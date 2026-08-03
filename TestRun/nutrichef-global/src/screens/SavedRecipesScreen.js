import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, ActivityIndicator, StatusBar } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Swipeable } from 'react-native-gesture-handler';
import { useSettings } from '../context/SettingsContext';
import { getTheme } from '../theme';
import { supabaseDB } from '../services/supabase';

import { useAuth } from '../context/AuthContext';

export default function SavedRecipesScreen({ navigation }) {
    const { darkMode } = useSettings();
    const { user } = useAuth(); // Custom Auth
    const theme = getTheme(darkMode);
    const [recipes, setRecipes] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (user) {
            loadSavedRecipes();
        } else {
            setLoading(false);
        }
    }, [user]);

    // Reload recipes when screen comes into focus
    useEffect(() => {
        const unsubscribe = navigation.addListener('focus', () => {
            if (user) loadSavedRecipes();
        });
        return unsubscribe;
    }, [navigation, user]);

    const loadSavedRecipes = async () => {
        setLoading(true);
        try {
            const userId = user?.user_id;
            if (!userId) return;

            const { data, error } = await supabaseDB.getSavedRecipes(userId);
            if (error) throw error;
            setRecipes(data || []);
        } catch (error) {
            console.error('Error loading saved recipes:', error);
            Alert.alert('Error', 'Failed to load saved recipes');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (recipeId, recipeName) => {
        Alert.alert(
            'Delete Recipe',
            `Are you sure you want to delete "${recipeName}"?`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            const { error } = await supabaseDB.deleteRecipe(recipeId);
                            if (error) throw error;
                            setRecipes(recipes.filter(r => r.recipe_id !== recipeId));
                        } catch (error) {
                            console.error('Error deleting recipe:', error);
                            Alert.alert('Error', 'Failed to delete recipe');
                        }
                    }
                }
            ]
        );
    };

    const renderRightActions = (recipe) => {
        return (
            <TouchableOpacity
                style={[styles.deleteButton, { backgroundColor: theme.error }]}
                onPress={() => handleDelete(recipe.recipe_id, recipe.name)}
            >
                <Text style={styles.deleteButtonText}>Delete</Text>
            </TouchableOpacity>
        );
    };

    const renderRecipe = ({ item }) => {
        // Convert database format back to display format
        const displayRecipe = {
            recipe_name: item.name,
            total_time: item.total_time,
            cook_time: item.cook_time,
            prep_time: item.prep_time,
            ingredients: item.ingredients_json,
            instructions: item.directions ? item.directions.split('\n') : [],
            nutrition: formatNutrition(item.nutrition_facts),
            difficulty: item.difficulty || 'Medium',
            recipe_id: item.recipe_id, // include ID for deletion logic
        };

        return (
            <Swipeable
                renderRightActions={() => renderRightActions(item)}
                overshootRight={false}
            >
                <TouchableOpacity
                    style={[styles.recipeCard, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}
                    onPress={() => navigation.navigate('RecipeDetail', { recipe: displayRecipe, isSaved: true })}
                    activeOpacity={0.7}
                >
                    <Text style={[styles.recipeName, { color: theme.text }]}>{item.name}</Text>
                    {item.total_time && (
                        <Text style={[styles.recipeTime, { color: theme.textSecondary }]}>⏱️ {item.total_time}</Text>
                    )}
                </TouchableOpacity>
            </Swipeable>
        );
    };

    const formatNutrition = (nutritionFacts) => {
        if (!nutritionFacts) return '';
        const parts = [];
        for (const [key, value] of Object.entries(nutritionFacts)) {
            parts.push(`${key.charAt(0).toUpperCase() + key.slice(1)}: ${value}`);
        }
        return parts.join(', ');
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
            <StatusBar barStyle={theme.statusBarStyle} />

            {/* Header */}
            <View style={[styles.header, { borderBottomColor: theme.border }]}>
                <View style={{ flexDirection: 'row', alignItems: 'center', width: '100%', justifyContent: 'center', position: 'relative' }}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                        <Ionicons name="arrow-back" size={24} color={theme.text} />
                    </TouchableOpacity>
                    <Text style={[styles.headerTitle, { color: theme.text, textAlign: 'center' }]}>Saved Recipes ⭐</Text>
                </View>
            </View>

            {loading ? (
                <ActivityIndicator size="large" style={styles.loader} />
            ) : recipes.length === 0 ? (
                <View style={styles.emptyContainer}>
                    <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
                        No saved recipes yet.{'\n'}Save recipes from AI Chef to see them here!
                    </Text>
                </View>
            ) : (
                <FlatList
                    data={recipes}
                    renderItem={renderRecipe}
                    keyExtractor={(item) => item.recipe_id.toString()}
                    contentContainerStyle={styles.list}
                    showsVerticalScrollIndicator={false}
                />
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
        justifyContent: 'center',
    },
    backButton: {
        position: 'absolute',
        left: 0,
        padding: 5,
        zIndex: 10,
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: 'bold',
    },
    loader: {
        marginTop: 50,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 40,
    },
    emptyText: {
        fontSize: 16,
        textAlign: 'center',
        lineHeight: 24,
    },
    list: {
        padding: 15,
    },
    recipeCard: {
        padding: 15,
        borderRadius: 10,
        marginBottom: 10,
        borderWidth: 1,
        elevation: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
    },
    recipeName: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 5,
    },
    recipeTime: {
        fontSize: 14,
    },
    deleteButton: {
        justifyContent: 'center',
        alignItems: 'center',
        width: 80,
        height: '87%',
        borderRadius: 10,
        marginBottom: 10,
        marginLeft: 10,
    },
    deleteButtonText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 14,
    },
});
