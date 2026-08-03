import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, Alert, StatusBar, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { generateRecipes } from '../services/api';
import supabase, { supabaseDB } from '../services/supabase';
import moment from 'moment';
import { useSettings } from '../context/SettingsContext';
import { getTheme } from '../theme';
import RecipeLoader from '../components/RecipeLoader';

import { useAuth } from '../context/AuthContext'; // Custom Auth

export default function RecipeScreen({ navigation }) {
    const { darkMode, useMealDirection } = useSettings();
    const { user } = useAuth(); // Get user from Context
    const theme = getTheme(darkMode);

    const [ingredients, setIngredients] = useState('');
    const [recipes, setRecipes] = useState([]);
    const [mealDirection, setMealDirection] = useState('');
    const [loading, setLoading] = useState(false);
    const [peopleCount, setPeopleCount] = useState('2');
    const [preferenceOverridden, setPreferenceOverridden] = useState(false); // Track if user chose to override

    // Fridge Inventory State
    const [fridgeItems, setFridgeItems] = useState([]);
    const [selectedFridgeItems, setSelectedFridgeItems] = useState([]); // Array of item names
    const [loadingFridge, setLoadingFridge] = useState(true);

    useEffect(() => {
        // Load fridge items whenever user changes or focused
        if (user) {
            loadFridgeItems();
        } else {
            setLoadingFridge(false);
            setFridgeItems([]);
        }
    }, [user]);

    // Also reload when screen comes into focus
    useEffect(() => {
        const unsubscribe = navigation.addListener('focus', () => {
            if (user) loadFridgeItems();
        });
        return unsubscribe;
    }, [navigation, user]);

    const loadFridgeItems = async () => {
        try {
            const userId = user?.user_id;

            if (!userId) {
                console.error("No user logged in");
                setLoadingFridge(false);
                return;
            }
            const { data, error } = await supabaseDB.getUserInventory(userId);
            if (data) {
                // Filter out expired items (daysLeft < 0)
                const freshItems = data.filter(item => {
                    const daysLeft = moment(item.expiration_date).diff(moment(), 'days');
                    return daysLeft >= 0; // Only show strictly non-expired items
                });

                setFridgeItems(freshItems);

                // data is array of objects { ingredient_name, ... }
                // Remove selected items that are no longer in the fridge or filtered out
                const availableNames = freshItems.map(item => item.ingredient_name);
                setSelectedFridgeItems(prevSelected =>
                    prevSelected.filter(name => availableNames.includes(name))
                );
            }

            // Also fetch User Profile for Meal Direction
            // We can also rely on user.meal_direction directly from context but fetching fresh is safe
            const { data: profileData } = await supabaseDB.getUserProfile(userId);
            if (profileData && profileData.meal_direction) {
                setMealDirection(profileData.meal_direction);
            }

        } catch (e) {
            console.error(e);
        } finally {
            setLoadingFridge(false);
        }
    };

    // Check for conflicts between ingredients and meal directions
    const checkConflicts = (ingredientsList, mealDirections) => {
        if (!useMealDirection || !mealDirections) return null;

        const directions = mealDirections.toLowerCase();
        const conflicts = ingredientsList.filter(ing => directions.includes(ing.toLowerCase()));

        return conflicts.length > 0 ? conflicts : null;
    };

    const toggleFridgeItem = (name) => {
        if (selectedFridgeItems.includes(name)) {
            // Removing item
            const newSelected = selectedFridgeItems.filter(i => i !== name);
            setSelectedFridgeItems(newSelected);

            // Check if there are still conflicts after removal
            // If no more conflicts, reset the override
            const remainingConflicts = checkConflicts(newSelected, mealDirection);
            if (!remainingConflicts) {
                setPreferenceOverridden(false); // Re-enable preference if no conflicts remain
            }
        } else {
            // Check conflict BEFORE adding
            const conflicts = checkConflicts([name], mealDirection);
            if (conflicts) {
                Alert.alert(
                    'Heads up!',
                    `Wait! '${name}' might conflict with your '${mealDirection}' preference.`,
                    [
                        {
                            text: 'Add & Disable Preference',
                            onPress: () => {
                                setSelectedFridgeItems([...selectedFridgeItems, name]);
                                setPreferenceOverridden(true); // Mark preference as overridden
                            },
                            style: 'destructive'
                        },
                        {
                            text: 'Cancel',
                            style: 'cancel'
                        }
                    ]
                );
            } else {
                setSelectedFridgeItems([...selectedFridgeItems, name]);
            }
        }
    };

    const handleGenerate = async () => {
        // PERMISSIONS: Combine manual text input + selected fridge items
        const manualItems = ingredients.split(',').map(i => i.trim()).filter(i => i.length > 0);

        // Check Manual Items for Conflicts FIRST
        const manualConflicts = checkConflicts(manualItems, mealDirection);

        const runGeneration = async (includeManual, finalManualItems) => {
            const finalIngredientList = [...new Set([...selectedFridgeItems, ...finalManualItems])];

            console.log("🚀 SENDING INGREDIENTS TO BACKEND:", finalIngredientList);

            if (finalIngredientList.length === 0) {
                Alert.alert('Details Needed', 'Please select fridge items or enter ingredients.');
                return;
            }

            setLoading(true);
            try {
                // USER REQUEST: Add extra ingredients to fridge automatically
                if (finalManualItems.length > 0) {
                    const userId = user?.user_id;

                    if (!userId) throw new Error("No user logged in to save ingredients");
                    console.log("💾 Saving extra ingredients to fridge:", finalManualItems);

                    await Promise.all(finalManualItems.map(async (item) => {
                        const alreadyHas = fridgeItems.some(f => f.ingredient_name.toLowerCase() === item.toLowerCase());
                        if (!alreadyHas) {
                            const today = moment().format('YYYY-MM-DD');
                            const tomorrow = moment().add(1, 'days').format('YYYY-MM-DD');

                            await supabaseDB.addUserInventory({
                                user_id: userId,
                                ingredient_name: item,
                                quantity_grams: 100,
                                expiration_date: tomorrow
                            });
                        }
                    }));
                    console.log("✅ Extra ingredients saved to DB");
                    setIngredients(''); // Clear the input field
                }

                // Determine effective health conditions
                // If user explicitly chose "Add & Disable Preference" OR there are conflicts, disable meal directions
                const allConflicts = checkConflicts(finalIngredientList, mealDirection);

                let healthConditions = [];
                // Only include health conditions if:
                // 1. User hasn't overridden the preference
                // 2. No conflicts are present
                // 3. useMealDirection is enabled
                // 4. mealDirection exists
                if (!preferenceOverridden && !allConflicts && useMealDirection && mealDirection) {
                    healthConditions = mealDirection.split(',').map(s => s.trim()).filter(s => s.length > 0);
                }

                console.log('🎯 Preference Override Status:', preferenceOverridden);
                console.log('🎯 Health Conditions Sent:', healthConditions);

                console.log('🎯 Health Conditions Sent:', healthConditions);

                const response = await generateRecipes(finalIngredientList, healthConditions, 3, null, peopleCount);
                if (response && response.recommendations) {
                    setRecipes(response.recommendations);
                }
            } catch (error) {
                Alert.alert('Error', 'Failed to generate recipes. Try again.');
                console.error(error);
            } finally {
                setLoading(false);
            }
        };

        if (manualConflicts) {
            Alert.alert(
                'Heads up!',
                `Wait! These ingredients conflict with your '${mealDirection}' preference: ${manualConflicts.join(', ')}.`,
                [
                    {
                        text: 'Add & Disable Preference',
                        onPress: () => {
                            setPreferenceOverridden(true); // Mark preference as overridden
                            runGeneration(true, manualItems);
                        },
                        style: 'destructive'
                    },
                    {
                        text: 'Remove Conflicting',
                        onPress: () => {
                            const safeManual = manualItems.filter(i => !manualConflicts.includes(i));
                            runGeneration(true, safeManual);
                        }
                    },
                    {
                        text: 'Cancel',
                        style: 'cancel'
                    }
                ]
            );
        } else {
            runGeneration(false, manualItems);
        }
    };

    const renderFridgeItem = (item) => {
        const daysLeft = moment(item.expiration_date).diff(moment(), 'days');
        const isExpiringSoon = daysLeft < 3;
        // Use the same colors as InventoryScreen: Red for soon, Green for safe
        const bgColor = isExpiringSoon ? '#FEB2B2' : '#C6F6D5';
        const isSelected = selectedFridgeItems.includes(item.ingredient_name);

        return (
            <TouchableOpacity
                key={item.inventory_id}
                style={[
                    styles.chip,
                    { backgroundColor: bgColor },
                    isSelected && styles.chipSelected // Add border if selected
                ]}
                onPress={() => toggleFridgeItem(item.ingredient_name)}
            >
                <Text style={styles.chipText}>
                    {item.ingredient_name}
                    {isSelected && " ✅"}
                </Text>
                <Text style={styles.chipSubText}>
                    {daysLeft} days
                </Text>
            </TouchableOpacity>
        );
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
            <StatusBar barStyle={theme.statusBarStyle} />
            <ScrollView contentContainerStyle={{ paddingBottom: 20 }} showsVerticalScrollIndicator={false}>
                <View style={styles.headerContainer}>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginRight: 10 }}>
                            <Ionicons name="arrow-back" size={24} color={theme.text} />
                        </TouchableOpacity>
                        <Text style={[styles.headerTitle, { color: theme.text, marginRight: 10 }]}>AI Chef</Text>
                        <Image
                            source={require('../../assets/Get_Recipes_icon.png')}
                            style={{ width: 32, height: 32 }}
                            resizeMode="contain"
                        />
                        {useMealDirection && mealDirection ? (
                            <TouchableOpacity
                                onPress={() => {
                                    if (preferenceOverridden) {
                                        // Re-enable preference
                                        setPreferenceOverridden(false);
                                    }
                                }}
                                style={{
                                    backgroundColor: theme.surface,
                                    paddingHorizontal: 8,
                                    paddingVertical: 4,
                                    borderRadius: 12,
                                    marginLeft: 10,
                                    borderWidth: 1,
                                    borderColor: preferenceOverridden ? '#F56565' : '#48BB78'
                                }}
                            >
                                <Text style={{ color: preferenceOverridden ? '#F56565' : '#48BB78', fontSize: 10, fontWeight: 'bold' }}>
                                    {preferenceOverridden ? 'Preference Disabled (Tap to Re-enable)' : 'Meal Direction Applied'}
                                </Text>
                            </TouchableOpacity>
                        ) : null}
                    </View>
                    <TouchableOpacity
                        style={[styles.bookmarkButton, { backgroundColor: theme.surface }]}
                        onPress={() => navigation.navigate('SavedRecipes')}
                    >
                        <Text style={styles.bookmarkIcon}>⭐</Text>
                    </TouchableOpacity>
                </View>

                {/* FRIDGE SECTION */}
                <Text style={[styles.sectionTitle, { color: theme.text }]}>From My Fridge ❄️</Text>
                <Text style={[styles.subTitle, { color: theme.textSecondary }]}>Select items to include:</Text>

                {loadingFridge ? (
                    <ActivityIndicator size="small" />
                ) : (
                    <View style={styles.fridgeGrid}>
                        {fridgeItems.length > 0 ? (
                            fridgeItems.map(renderFridgeItem)
                        ) : (
                            <Text style={{ color: theme.textSecondary, fontStyle: 'italic' }}>No items in fridge.</Text>
                        )}
                    </View>
                )}

                <View style={[styles.divider, { backgroundColor: theme.border }]} />

                <View style={[styles.divider, { backgroundColor: theme.border }]} />

                {/* PEOPLE COUNT SECTION - NEW */}
                <View style={[styles.inputContainer, { marginBottom: 10 }]}>
                    <Text style={[styles.label, { color: theme.textSecondary }]}>Number of People to Serve 👥</Text>
                    <TextInput
                        style={[styles.input, { backgroundColor: theme.inputBackground, borderColor: theme.border, color: theme.text }]}
                        placeholder="e.g. 2"
                        placeholderTextColor={theme.textTertiary}
                        value={peopleCount}
                        onChangeText={setPeopleCount}
                        keyboardType="numeric"
                    />
                </View>

                {/* MANUAL INPUT SECTION */}
                <View style={styles.inputContainer}>
                    <Text style={[styles.label, { color: theme.textSecondary }]}>Add Extra Ingredients (comma separated)</Text>
                    <TextInput
                        style={[styles.input, { backgroundColor: theme.inputBackground, borderColor: theme.border, color: theme.text }]}
                        placeholder="e.g. Rice, Spices..."
                        placeholderTextColor={theme.textTertiary}
                        value={ingredients}
                        onChangeText={setIngredients}
                    />

                    <TouchableOpacity
                        style={[styles.button, { opacity: loading ? 0.7 : 1 }]}
                        onPress={handleGenerate}
                        disabled={loading}
                    >
                        {/* We keep the button simple, maybe just text saying "Generating..." or the original spinner + text */}
                        {loading ? (
                            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                <ActivityIndicator color="#fff" style={{ marginRight: 8 }} />
                                <Text style={styles.buttonText}>Cooking Plan...</Text>
                            </View>
                        ) : (
                            <Text style={styles.buttonText}>
                                Generate Recipes ({selectedFridgeItems.length + (ingredients ? ingredients.split(',').length : 0)} items)
                            </Text>
                        )}
                    </TouchableOpacity>
                </View>

                {/* RESULTS SECTION */}
                <View style={styles.results}>
                    {loading ? (
                        <RecipeLoader theme={theme} />
                    ) : (
                        recipes.map((recipe, index) => (
                            <TouchableOpacity
                                key={index}
                                activeOpacity={0.7}
                                onPress={() => navigation.navigate('RecipeDetail', { recipe })}
                            >
                                <View style={[styles.recipeCard, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}>
                                    <Text style={[styles.recipeTitle, { color: theme.text }]}>{recipe.recipe_name || recipe.name || 'Unknown Recipe'}</Text>
                                    <Text style={[styles.recipeDesc, { color: theme.textSecondary }]}>
                                        {recipe.total_time ? `⏱️ ${recipe.total_time}` : (recipe.cook_time ? `⏱️ ${recipe.cook_time}` : (recipe.reason || 'No description available.'))}
                                    </Text>
                                </View>
                            </TouchableOpacity>
                        ))
                    )}
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 15,
    },
    headerContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: 'bold',
    },
    bookmarkButton: {
        padding: 10,
        borderRadius: 15,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
    },
    bookmarkIcon: {
        fontSize: 20,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        marginTop: 10,
        marginBottom: 5,
    },
    subTitle: {
        fontSize: 14,
        color: '#666',
        marginBottom: 10,
    },
    fridgeGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginBottom: 20,
    },
    chip: {
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 20, // Rounded chip style
        marginRight: 10,
        marginBottom: 10,
        alignItems: 'center',
        borderWidth: 2,
        borderColor: 'transparent', // Invisible border by default
    },
    chipSelected: {
        borderColor: '#4299E1', // Blue border when selected
        // transform: [{ scale: 1.05 }] // Removed to prevent left-side cutoff
        borderWidth: 3, // Thicker border instead of scaling
    },
    chipText: {
        fontWeight: '600',
        fontSize: 14,
        color: '#2D3748',
    },
    chipSubText: {
        fontSize: 10,
        color: '#4A5568',
    },
    divider: {
        height: 1,
        backgroundColor: '#eee',
        marginVertical: 0,
    },
    inputContainer: {
        marginBottom: 20,
        marginTop: 10,
    },
    label: {
        marginBottom: 5,
        color: '#666',
        fontWeight: '600',
    },
    input: {
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        padding: 12,
        marginBottom: 0,
        fontSize: 16,
    },
    button: {
        backgroundColor: '#48BB78',
        padding: 15,
        borderRadius: 8,
        alignItems: 'center',
        marginTop: 10,
    },
    buttonText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 16,
    },
    results: {
        marginTop: 10,
    },
    recipeCard: {
        backgroundColor: '#F7FAFC',
        padding: 15,
        borderRadius: 10,
        marginBottom: 15,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        elevation: 1,
    },
    recipeTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 5,
        color: '#2D3748',
    },
    recipeDesc: {
        color: '#4A5568',
        lineHeight: 20,
    },
});
