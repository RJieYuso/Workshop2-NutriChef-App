import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, StatusBar, Image, DeviceEventEmitter } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSettings } from '../context/SettingsContext';
import { getTheme } from '../theme';
import supabase, { supabaseDB } from '../services/supabase';
import moment from 'moment'; // Import moment

import { useAuth } from '../context/AuthContext';

export default function RecipeDetailScreen({ route, navigation }) {
    const { recipe, isSaved } = route.params; // isSaved indicates if recipe is already saved

    console.log("🧐 RECIPE DETAIL RECEIVED:", {
        name: recipe.recipe_name,
        missing_ingredients: recipe.missing_ingredients,
        source: recipe.source || "Unknown", // Log the source
        all_ingredients: recipe.ingredients
    });

    const { darkMode } = useSettings();
    const { user } = useAuth(); // Custom auth
    const theme = getTheme(darkMode);
    const [saving, setSaving] = useState(false);
    const [fridgeItems, setFridgeItems] = useState([]); // Just names for display check
    const [fullFridgeItems, setFullFridgeItems] = useState([]); // Full objects for cooking
    const [loadingFridge, setLoadingFridge] = useState(true);
    const [cooking, setCooking] = useState(false); // State to track if user has started cooking

    useEffect(() => {
        if (user) {
            loadFridgeItems();
        } else {
            setLoadingFridge(false);
        }
    }, [user]);

    const loadFridgeItems = async () => {
        try {
            // Dynamic User ID
            const userId = user?.user_id;

            if (!userId) {
                console.log("No user logged in, treating fridge as empty");
                return;
            }

            const { data, error } = await supabaseDB.getUserInventory(userId);
            if (data) {
                setFullFridgeItems(data);
                setFridgeItems(data.map(item => item.ingredient_name.toLowerCase()));
            }
        } catch (e) {
            console.error('Error loading fridge items:', e);
        } finally {
            setLoadingFridge(false);
        }
    };

    const isIngredientInFridge = (ingredient) => {
        // Basic pantry staples that every kitchen should have
        const pantryStaples = ['water', 'salt', 'pepper', 'oil', 'black pepper', 'vegetable oil', 'olive oil', 'cooking oil'];

        const ingredientLower = ingredient.toLowerCase();

        // Check if it's a pantry staple
        if (pantryStaples.some(staple => ingredientLower.includes(staple))) {
            return true;
        }

        // Check if it's in the user's fridge AND FRESH
        // We use fullFridgeItems to check expiration dates
        return fullFridgeItems.some(fridgeItem => {
            const fridgeName = fridgeItem.ingredient_name.toLowerCase();
            const matchesName = ingredientLower.includes(fridgeName) || fridgeName.includes(ingredientLower.split(' ')[0]);

            if (!matchesName) return false;

            // Check Expiry: If expired (days < 0), we treat it as MISSING
            const daysLeft = moment(fridgeItem.expiration_date).diff(moment(), 'days');
            return daysLeft >= 0; // Must be fresh (0 days or more)
        });
    };

    const handleCook = async () => {
        if (!fullFridgeItems || fullFridgeItems.length === 0) {
            Alert.alert('Fridge Empty', 'Your fridge has no items to use.');
            return;
        }

        // 1. NORMALIZE & PREPARE DATA
        // Simplify recipe ingredients (lowercase, remove quantities, trim)
        const recipeIngNames = recipe.ingredients.map(ing =>
            ing.toLowerCase()
                .replace(/[\d\s\/\.]+/g, ' ') // Remove numbers and fractions
                .replace(/\s+/g, ' ')         // Collapse multiple spaces
                .trim()
                .split(' ')[0]                // Take only the first word (e.g., "chicken" from "chicken breast")
        ).filter(name => name.length > 2); // Filter out very short words

        // 2. FIND MATCHES & MISSING
        const itemsToDelete = []; // Array of IDs
        const missingIngredients = [];

        // Common units and adjectives to ignore (removed meat cuts "breast", "thigh" to improve matching)
        const stopWords = [
            'cup', 'cups', 'tbsp', 'tsp', 'teaspoon', 'tablespoon', 'oz', 'ounce', 'lb', 'pound', 'g', 'gram', 'kg',
            'ml', 'l', 'liter', 'quart', 'pint', 'gallon', 'pinch', 'dash', 'slice', 'slices', 'piece', 'pieces',
            'clove', 'cloves', 'can', 'cans', 'jar', 'jars', 'pack', 'package', 'bunch', 'sprig', 'stalk',
            'medium', 'large', 'small', 'approx', 'about', 'fresh', 'dried', 'sliced', 'diced', 'chopped', 'minced',
            'uncooked', 'cooked', 'raw', 'whole', 'ground', 'boneless', 'skinless'
        ];

        // For each ingredient in recipe, check if we have a match
        recipe.ingredients.forEach(recipeIng => {
            // Normalize recipe ingredient string
            const normalizedIng = recipeIng.toLowerCase()
                .replace(/[\d\/\.]+/g, '') // Remove numbers specific chars
                .replace(/[^\w\s]/g, ' ')   // Replace punctuation with SPACE to avoid concatenation
                .trim();

            // Split into words and filter stop words
            const meaningfulWords = normalizedIng.split(/\s+/)
                .filter(w => w.length > 2 && !stopWords.includes(w));

            if (meaningfulWords.length === 0) return; // Skip if no meaningful words (e.g. just "1/2 cup")

            // Check against pantry staples (if any meaningful word matches a staple)
            const pantryStaples = ['water', 'salt', 'pepper', 'oil', 'vegetable oil', 'olive oil', 'cooking oil'];
            if (pantryStaples.some(staple => recipeIng.toLowerCase().includes(staple))) return;

            // Check against fridge
            const match = fullFridgeItems.find(fridgeItem => {
                const fridgeName = fridgeItem.ingredient_name.toLowerCase();
                // Check if ANY meaningful word from recipe is present in fridge item name
                // OR if the fridge item name is present in the normalized recipe string
                return meaningfulWords.some(word => fridgeName.includes(word)) ||
                    meaningfulWords.some(word => word.includes(fridgeName)); // catch-all
            });

            if (match) {
                if (!itemsToDelete.includes(match.inventory_id)) {
                    itemsToDelete.push(match.inventory_id);
                }
            } else {
                // Formatting: Capitalize first letter for display
                missingIngredients.push(recipeIng);
            }
        });

        // Helper to proceed with cooking/deletion
        const proceedToCook = async () => {
            try {
                // DELETE FROM DATABASE
                for (const itemId of itemsToDelete) {
                    await supabaseDB.deleteUserInventory(itemId);
                }

                // UPDATE UI STATE
                const updatedFridge = fullFridgeItems.filter(item =>
                    !itemsToDelete.includes(item.inventory_id)
                );
                setFullFridgeItems(updatedFridge);
                setFridgeItems(updatedFridge.map(item => item.ingredient_name.toLowerCase()));

                // Change state to Cooking Mode
                setCooking(true);
                Alert.alert('Started Cooking', 'Ingredients have been removed from your fridge. Follow the steps and click "Finished" when done. Happy Cooking!');

            } catch (error) {
                Alert.alert('Error', 'Could not update fridge. Please try again.');
                console.error('Cook error:', error);
            }
        };

        // 3. ALERT IF MISSING ITEMS
        if (missingIngredients.length > 0) {
            Alert.alert(
                'Missing Ingredients',
                `There are some missing ingredients to cook, please make sure you get:\n\n${missingIngredients.map(i => `• ${i}`).join('\n')}`,
                [
                    { text: 'Back', style: 'cancel' },
                    {
                        text: 'Okay',
                        onPress: proceedToCook
                    }
                ]
            );
        } else {
            // No missing items, ask to confirm usage
            const deleteNames = fullFridgeItems
                .filter(item => itemsToDelete.includes(item.inventory_id))
                .map(i => i.ingredient_name)
                .join(', ');

            Alert.alert(
                'Cook This Recipe?',
                `This will use up ${itemsToDelete.length} item(s) from your fridge: ${deleteNames}.`,
                [
                    { text: 'Cancel', style: 'cancel' },
                    {
                        text: 'Yes, Cook',
                        style: 'destructive',
                        onPress: proceedToCook
                    }
                ]
            );
        }
    };

    const handleFinished = () => {
        Alert.alert(
            'Cooking Complete! 👩‍🍳',
            'Do you want to keep this recipe in your Saved list or remove it?',
            [
                { text: 'Back', style: 'cancel' },
                {
                    text: 'Keep Recipe',
                    onPress: () => {
                        Alert.alert('Nice!', 'Recipe kept in your collection.', [
                            { text: 'OK', onPress: () => navigation.goBack() }
                        ]);
                    }
                },
                {
                    text: 'Remove',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            if (recipe.recipe_id) {
                                await supabaseDB.deleteRecipe(recipe.recipe_id);
                                Alert.alert('Removed', 'Recipe completed and removed from your list.', [
                                    { text: 'OK', onPress: () => navigation.goBack() }
                                ]);
                            } else {
                                // Fallback if no ID
                                Alert.alert('Error', 'Could not find recipe ID to delete.');
                            }
                        } catch (error) {
                            console.error('Finish error:', error);
                            Alert.alert('Error', 'Failed to update recipe status.');
                        }
                    }
                }
            ]
        );
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const userId = user?.user_id;
            if (!userId) {
                Alert.alert("Error", "You must be logged in to save recipes.");
                return;
            }

            const { error } = await supabaseDB.saveRecipe(recipe, userId);

            if (error) {
                if (error.code === '23505') { // Unique constraint violation
                    Alert.alert('Already Saved', 'This recipe is already in your collection!');
                } else {
                    throw error;
                }
            } else {
                Alert.alert('Success', 'Recipe saved to your collection!', [
                    { text: 'OK', onPress: () => navigation.goBack() }
                ]);
            }
        } catch (error) {
            console.error('Save error:', error);
            Alert.alert('Error', 'Failed to save recipe. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    // Parse nutrition string to display nicely
    const parseNutrition = (nutritionStr) => {
        if (!nutritionStr) return null;
        const parts = nutritionStr.split(',').map(p => p.trim());
        return parts;
    };

    const nutritionParts = parseNutrition(recipe.nutrition);

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
            <StatusBar barStyle={theme.statusBarStyle} />

            {/* Header */}
            <View style={[styles.header, { borderBottomColor: theme.border }]}>
                <TouchableOpacity
                    onPress={() => {
                        // If we came from ChatBot, explicitly navigate back to Home to resume it
                        if (route.params?.from_screen === 'ChatBot') {
                            DeviceEventEmitter.emit('OPEN_CHATBOT');
                        }
                        navigation.goBack();
                    }}
                    style={styles.backButton}
                >
                    <Text style={[styles.backText, { color: theme.primary }]}>← Back</Text>
                </TouchableOpacity>
            </View>

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                {/* Recipe Name */}
                <Text style={[styles.recipeName, { color: theme.text }]}>
                    {recipe.recipe_name || 'Untitled Recipe'}
                </Text>

                {/* Time & Difficulty */}
                <View style={styles.metaContainer}>
                    {recipe.prep_time && (
                        <View style={[styles.metaChip, { backgroundColor: theme.surface }]}>
                            <Text style={[styles.metaLabel, { color: theme.textSecondary }]}>Prep</Text>
                            <Text style={[styles.metaValue, { color: theme.text }]}>{recipe.prep_time}</Text>
                        </View>
                    )}
                    {recipe.cook_time && (
                        <View style={[styles.metaChip, { backgroundColor: theme.surface }]}>
                            <Text style={[styles.metaLabel, { color: theme.textSecondary }]}>Cook</Text>
                            <Text style={[styles.metaValue, { color: theme.text }]}>{recipe.cook_time}</Text>
                        </View>
                    )}
                    {recipe.total_time && (
                        <View style={[styles.metaChip, { backgroundColor: theme.surface }]}>
                            <Text style={[styles.metaLabel, { color: theme.textSecondary }]}>Total</Text>
                            <Text style={[styles.metaValue, { color: theme.text }]}>{recipe.total_time}</Text>
                        </View>
                    )}
                    {recipe.difficulty && (
                        <View style={[styles.metaChip, { backgroundColor: theme.surface }]}>
                            <Text style={[styles.metaLabel, { color: theme.textSecondary }]}>Level</Text>
                            <Text style={[styles.metaValue, { color: theme.text }]}>{recipe.difficulty}</Text>
                        </View>
                    )}
                </View>

                {/* Ingredients */}
                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: theme.text }]}>Ingredients</Text>
                    {recipe.ingredients && recipe.ingredients.map((ingredient, index) => {
                        // TRUST LOCAL FRIDGE FIRST: If we have it and it's fresh, it's NOT missing.
                        // Even if the AI/Backend calculated it as missing (maybe due to naming mismatch),
                        // we trust the user's actual inventory state check.
                        const inFridgeAndFresh = isIngredientInFridge(ingredient);

                        if (inFridgeAndFresh) {
                            isMissing = false;
                        } else if (recipe.missing_ingredients && Array.isArray(recipe.missing_ingredients)) {
                            // Backend provided definitive list. Check if this ingredient contains any of the missing items.
                            isMissing = recipe.missing_ingredients.some(missingName =>
                                ingredient.toLowerCase().includes(missingName.toLowerCase())
                            );
                        } else {
                            // Fallback logic
                            isMissing = true;
                        }

                        return (
                            <View key={index} style={[styles.listItem, { borderBottomColor: theme.borderLight }]}>
                                <Text style={[styles.bullet, { color: theme.primary }]}>•</Text>
                                <Text style={[styles.listText, { color: theme.textSecondary, flex: 1 }]}>{ingredient}</Text>
                                {!loadingFridge && isMissing && (
                                    <View style={[styles.missingBadge, { backgroundColor: theme.error + '20', borderColor: theme.error }]}>
                                        <Text style={[styles.missingText, { color: theme.error }]}>Missing</Text>
                                    </View>
                                )}
                            </View>
                        );
                    })}
                </View>

                {/* Instructions */}
                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: theme.text }]}>Instructions</Text>
                    {recipe.instructions && recipe.instructions.map((instruction, index) => (
                        <View key={index} style={[styles.instructionItem, { borderBottomColor: theme.borderLight }]}>
                            <View style={[styles.stepNumber, { backgroundColor: theme.primary }]}>
                                <Text style={styles.stepNumberText}>{index + 1}</Text>
                            </View>
                            <Text style={[styles.instructionText, { color: theme.textSecondary }]}>{instruction}</Text>
                        </View>
                    ))}
                </View>

                {/* Nutrition */}
                {nutritionParts && (
                    <View style={styles.section}>
                        <Text style={[styles.sectionTitle, { color: theme.text }]}>Nutrition Facts</Text>
                        <View style={[styles.nutritionContainer, { backgroundColor: theme.surface }]}>
                            {nutritionParts.map((part, index) => (
                                <Text key={index} style={[styles.nutritionText, { color: theme.textSecondary }]}>
                                    {part}
                                </Text>
                            ))}
                        </View>
                    </View>
                )}

                {/* Bottom padding for FAB */}
                <View style={{ height: 100 }} />
            </ScrollView>

            {/* Save FAB - Show if NOT saved */}
            {!isSaved && (
                <TouchableOpacity
                    style={[styles.fab, { backgroundColor: theme.secondary }]}
                    onPress={handleSave}
                    disabled={saving}
                >
                    <Text style={styles.fabText}>{saving ? '...' : '⭐ Save'}</Text>
                </TouchableOpacity>
            )}

            {/* Cook / Finished FAB - Show if SAVED */}
            {isSaved && !cooking && (
                <TouchableOpacity
                    style={[styles.fab, { backgroundColor: theme.primary }]}
                    onPress={handleCook}
                >
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <Image
                            source={require('../../assets/cook_button_icon.png')}
                            style={{ width: 28, height: 28, marginRight: 8 }}
                            resizeMode="contain"
                        />
                        <Text style={styles.fabText}>Cook</Text>
                    </View>
                </TouchableOpacity>
            )}

            {isSaved && cooking && (
                <TouchableOpacity
                    style={[styles.fab, { backgroundColor: '#48BB78' }]} // Green for finished
                    onPress={handleFinished}
                >
                    <Text style={styles.fabText}>✅ Finished</Text>
                </TouchableOpacity>
            )}

        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        paddingHorizontal: 20,
        paddingVertical: 15,
        borderBottomWidth: 1,
    },
    backButton: {
        paddingVertical: 5,
    },
    backText: {
        fontSize: 16,
        fontWeight: '600',
    },
    content: {
        flex: 1,
        padding: 20,
    },
    recipeName: {
        fontSize: 28,
        fontWeight: 'bold',
        marginBottom: 20,
    },
    metaContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginBottom: 25,
        gap: 10,
    },
    metaChip: {
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 8,
        minWidth: 70,
    },
    metaLabel: {
        fontSize: 11,
        textTransform: 'uppercase',
        marginBottom: 2,
    },
    metaValue: {
        fontSize: 14,
        fontWeight: '600',
    },
    section: {
        marginBottom: 30,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 15,
    },
    listItem: {
        flexDirection: 'row',
        paddingVertical: 8,
        borderBottomWidth: 1,
        alignItems: 'center',
    },
    bullet: {
        fontSize: 20,
        marginRight: 10,
        marginTop: -2,
    },
    listText: {
        fontSize: 15,
        lineHeight: 22,
    },
    missingBadge: {
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 4,
        borderWidth: 1,
        marginLeft: 8,
    },
    missingText: {
        fontSize: 11,
        fontWeight: '600',
    },
    instructionItem: {
        flexDirection: 'row',
        paddingVertical: 12,
        borderBottomWidth: 1,
        alignItems: 'flex-start',
    },
    stepNumber: {
        width: 28,
        height: 28,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
        marginTop: 2,
    },
    stepNumberText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 14,
    },
    instructionText: {
        flex: 1,
        fontSize: 15,
        lineHeight: 22,
    },
    nutritionContainer: {
        padding: 15,
        borderRadius: 10,
    },
    nutritionText: {
        fontSize: 14,
        marginBottom: 5,
    },
    fab: {
        position: 'absolute',
        right: 20,
        bottom: 30,
        paddingVertical: 15,
        paddingHorizontal: 25,
        borderRadius: 30,
        elevation: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 5,
    },
    fabText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 16,
    },
});
