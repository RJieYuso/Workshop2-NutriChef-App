import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, Modal, StyleSheet, ScrollView, ActivityIndicator, Alert, TextInput, Image, DeviceEventEmitter, PanResponder, Animated, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { supabaseDB } from '../services/supabase';
import { generateRecipes, generateMealPlan } from '../services/api';
import * as NavigationService from '../services/NavigationService';
import moment from 'moment';

const { width, height } = Dimensions.get('window');
const BUBBLE_SIZE = 60;

const ChatBot = () => {
    const { user } = useAuth();
    const [visible, setVisible] = useState(false);
    const [messages, setMessages] = useState([
        { id: 1, type: 'bot', text: "Hi! I am your Meal Planning Assistant. Let's plan your meals for the day together.", options: true }
    ]);
    const [loading, setLoading] = useState(false);
    const scrollViewRef = useRef();

    // PanResponder for Draggable Bubble
    const pan = useRef(new Animated.ValueXY({ x: width - BUBBLE_SIZE - 20, y: height - 150 })).current;

    const panResponder = useRef(
        PanResponder.create({
            onStartShouldSetPanResponder: () => true,
            onPanResponderGrant: () => {
                pan.setOffset({
                    x: pan.x._value,
                    y: pan.y._value
                });
                pan.setValue({ x: 0, y: 0 });
            },
            onPanResponderMove: Animated.event(
                [null, { dx: pan.x, dy: pan.y }],
                { useNativeDriver: false }
            ),
            onPanResponderRelease: (e, gestureState) => {
                pan.flattenOffset();

                // Click detection (small movement)
                if (Math.abs(gestureState.dx) < 5 && Math.abs(gestureState.dy) < 5) {
                    setVisible(true);
                } else {
                    // Snap to edge logic
                    const currentX = pan.x._value;
                    let newX = 0; // Left edge
                    if (currentX > (width / 2) - (BUBBLE_SIZE / 2)) {
                        newX = width - BUBBLE_SIZE; // Right edge
                    }

                    Animated.spring(pan, {
                        toValue: { x: newX, y: pan.y._value },
                        useNativeDriver: false
                    }).start();
                }
            }
        })
    ).current;

    useEffect(() => {
        const subscription = DeviceEventEmitter.addListener('OPEN_CHATBOT', () => {
            setVisible(true);
        });
        return () => subscription.remove();
    }, []);

    // Inventory State
    const [fridgeItems, setFridgeItems] = useState([]);

    // Unique ID generator
    const lastId = useRef(Date.now());
    const generateId = () => {
        const newId = Date.now();
        if (newId <= lastId.current) {
            lastId.current += 1;
        } else {
            lastId.current = newId;
        }
        return lastId.current;
    };

    const loadInventory = async () => {
        if (!user) {
            console.log("ChatBot: No user found");
            return;
        }
        console.log("ChatBot: Fetching inventory for user:", user.user_id);
        const { data, error } = await supabaseDB.getUserInventory(user.user_id);

        if (error) {
            console.error("ChatBot: Inventory fetch error:", error);
            return;
        }

        console.log("ChatBot: Raw inventory data:", data);

        if (data) {
            // Filter fresh items
            const fresh = data.filter(item => {
                const isFresh = moment(item.expiration_date).diff(moment(), 'days') >= 0;
                console.log(`Item: ${item.ingredient_name}, Exp: ${item.expiration_date}, Fresh: ${isFresh}`);
                return isFresh;
            });
            const items = fresh.map(i => i.ingredient_name);
            console.log("ChatBot: Fresh items:", items);
            setFridgeItems(items);
            return items;
        }
        return [];
    };

    const addMessage = (text, type = 'bot', options = false) => {
        setMessages(prev => [...prev, { id: generateId(), type, text, options }]);
    };

    const handleOptionSelect = async (option) => {
        if (loading) return;

        // User Selection
        addMessage(option, 'user');
        setLoading(true);

        try {
            // Fixed race condition: get ingredients directly
            const ingredients = await loadInventory();

            if (ingredients.length === 0) {
                setLoading(false);
                addMessage("Your fridge seems empty! Add some items to your inventory first.", 'bot');
                return;
            }

            if (option === 'Meal Planning') {
                try {
                    // Fetch user preferences
                    let mealDirection = null;
                    if (user) {
                        const { data: profile } = await supabaseDB.getUserProfile(user.user_id);
                        if (profile && profile.meal_direction) {
                            mealDirection = profile.meal_direction;
                        }
                    }

                    addMessage(`Generating your daily meal plan based on your fridge${mealDirection ? ` and preferences (${mealDirection})` : ''}...`, 'bot');
                    const result = await generateMealPlan(ingredients, mealDirection);

                    if (result.success && result.meal_plan) {
                        const plan = result.meal_plan.meal_plan;
                        let responseText = "Here is your meal plan for today! You can click on the recipes to view details.";
                        addMessage(responseText, 'bot');

                        // internal helper to format recipe for list
                        const formatForList = (r, type) => ({ ...r, recipe_name: `${type}: ${r.recipe_name}` });

                        const mealPlanRecipes = [];
                        if (plan.breakfast) mealPlanRecipes.push(formatForList(plan.breakfast, '🍳 Breakfast'));
                        if (plan.lunch) mealPlanRecipes.push(formatForList(plan.lunch, '🥗 Lunch'));
                        if (plan.dinner) mealPlanRecipes.push(formatForList(plan.dinner, '🍽️ Dinner'));

                        // Show recipes as clickable cards
                        setMessages(prev => [...prev, {
                            id: generateId(),
                            type: 'recipe_list',
                            recipes: mealPlanRecipes
                        }]);

                        // Add Save Button Message
                        setMessages(prev => [...prev, {
                            id: generateId(),
                            type: 'system',
                            action: 'save_plan',
                            data: result.meal_plan
                        }]);

                    } else {
                        addMessage("Sorry, I couldn't generate a plan right now.", 'bot');
                    }
                } catch (e) {
                    addMessage("Error generating meal plan.", 'bot');
                }

            } else if (option === 'Saved Meal Plans') {
                // FETCH SAVED PLANS
                addMessage("Fetching your saved meal plans...", 'bot');

                const { data: savedPlans, error } = await supabaseDB.getSavedMealPlans(user?.user_id);

                if (savedPlans && savedPlans.length > 0) {
                    // addMessage(`Found ${savedPlans.length} saved plans. Here is the most recent one:`, 'bot');

                    // Let's list top 3 most recent as clickable or just expand the first one
                    const latestPlan = savedPlans[0].plan_data; // assuming plan_data is the JSON

                    // We can reuse the recipe_list type or generic message
                    // Let's re-render the plan
                    const plan = latestPlan.meal_plan;

                    // internal helper to format recipe for list
                    const formatForList = (r, type) => ({ ...r, recipe_name: `${type}: ${r.recipe_name}` });

                    const mealPlanRecipes = [];
                    if (plan.breakfast) mealPlanRecipes.push(formatForList(plan.breakfast, '🍳 Breakfast'));
                    if (plan.lunch) mealPlanRecipes.push(formatForList(plan.lunch, '🥗 Lunch'));
                    if (plan.dinner) mealPlanRecipes.push(formatForList(plan.dinner, '🍽️ Dinner'));

                    setMessages(prev => [...prev, {
                        id: generateId(),
                        type: 'recipe_list',
                        recipes: mealPlanRecipes
                    }]);

                    addMessage(`Plan Date: ${moment(savedPlans[0].created_at).format('MMM Do YYYY')}`, 'system');

                    // Generate Shopping List from Missing Ingredients (For Saved Plan)
                    const missingSet = new Set();
                    const isStaple = (item) => {
                        const lower = item.toLowerCase();
                        return lower.includes('water') || lower.includes('salt') || lower.includes('pepper');
                    };

                    if (plan.breakfast && plan.breakfast.missing_ingredients) {
                        plan.breakfast.missing_ingredients.forEach(i => {
                            if (!isStaple(i)) missingSet.add(i);
                        });
                    }
                    if (plan.lunch && plan.lunch.missing_ingredients) {
                        plan.lunch.missing_ingredients.forEach(i => {
                            if (!isStaple(i)) missingSet.add(i);
                        });
                    }
                    if (plan.dinner && plan.dinner.missing_ingredients) {
                        plan.dinner.missing_ingredients.forEach(i => {
                            if (!isStaple(i)) missingSet.add(i);
                        });
                    }

                    if (missingSet.size > 0) {
                        const shoppingList = Array.from(missingSet).join(', ');
                        addMessage(`🛒 **Shopping List**\n(Ingredients you need):\n${shoppingList}`, 'bot');
                    }

                } else {
                    addMessage("You don't have any saved meal plans yet.", 'bot');
                }

            } else {
                // Single Meal (Breakfast, Lunch, Dinner)
                addMessage(`Looking for a perfect ${option} recipe...`, 'bot');

                // Pass the meal type (Breakfast, Lunch, Dinner) and ask for 1 recipe
                const response = await generateRecipes(ingredients, [], 1, option);

                if (response.success && response.recommendations && response.recommendations.length > 0) {
                    const recs = response.recommendations;
                    addMessage(`Here is a ${option} recipe for you:`, 'bot');

                    // Show recipes as clickable cards
                    setMessages(prev => [...prev, {
                        id: generateId(),
                        type: 'recipe_list',
                        recipes: recs
                    }]);
                } else {
                    addMessage(`Sorry, I couldn't find any ${option} recipes.`, 'bot');
                }
            }

        } catch (error) {
            console.error(error);
            addMessage("Ouch, I had a brain freeze. Try again?", 'bot');
        } finally {
            setLoading(false);
        }
    };

    const handleSavePlan = async (planData) => {
        if (!user) {
            Alert.alert("Error", "Please login to save.");
            return;
        }

        console.log("Verifying user validity before saving...", user.user_id);
        const { data: userProfile } = await supabaseDB.getUserProfile(user.user_id);

        if (!userProfile) {
            Alert.alert("Session Expired", "Your user session is invalid. Please Logout and Login again.", [
                { text: "OK" }
            ]);
            return;
        }

        try {
            await supabaseDB.saveMealPlan(planData, user.user_id);
            Alert.alert("Success", "Meal plan saved!");
        } catch (e) {
            console.error("Save Plan Error:", e);
            Alert.alert("Error", "Failed to save plan. " + e.message);
        }
    };

    const handleRefresh = async () => {
        setMessages([
            { id: generateId(), type: 'bot', text: "Hi! I am your Meal Planning Assistant. Let's plan your meals for the day together.", options: true }
        ]);
        setLoading(false);
        await loadInventory();
    };

    return (
        <>
            {/* Draggable Bubble */}
            <Animated.View
                style={[
                    styles.fab,
                    {
                        transform: [{ translateX: pan.x }, { translateY: pan.y }]
                    }
                ]}
                {...panResponder.panHandlers}
            >
                <Ionicons name="chatbubble-ellipses-outline" size={30} color="white" />
            </Animated.View>

            {/* Chat Modal */}
            <Modal
                animationType="slide"
                transparent={true}
                visible={visible}
                onRequestClose={() => setVisible(false)}
            >
                <View style={styles.modalContainer}>
                    <View style={styles.modalContent}>
                        {/* Header */}
                        <View style={styles.header}>
                            <Text style={styles.headerTitle}>Meal Planning Assistant</Text>
                            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                <TouchableOpacity onPress={handleRefresh} style={{ marginRight: 15 }}>
                                    <Ionicons name="refresh" size={24} color="#333" />
                                </TouchableOpacity>
                                <TouchableOpacity onPress={() => setVisible(false)}>
                                    <Ionicons name="close" size={24} color="#333" />
                                </TouchableOpacity>
                            </View>
                        </View>

                        {/* Chat Area */}
                        <ScrollView
                            ref={scrollViewRef}
                            style={styles.chatArea}
                            contentContainerStyle={{ padding: 15 }}
                            onContentSizeChange={() => scrollViewRef.current.scrollToEnd({ animated: true })}
                        >
                            {messages.map((msg) => {
                                if (msg.type === 'system' && msg.action === 'save_plan') {
                                    return (
                                        <TouchableOpacity
                                            key={msg.id}
                                            style={styles.saveButton}
                                            onPress={() => handleSavePlan(msg.data)}
                                        >
                                            <Text style={styles.saveButtonText}>💾 Save This Plan</Text>
                                        </TouchableOpacity>
                                    );
                                }

                                if (msg.type === 'recipe_list') {
                                    return (
                                        <View key={msg.id}>
                                            {msg.recipes.map((r, idx) => (
                                                <TouchableOpacity
                                                    key={idx}
                                                    style={styles.recipeCard}
                                                    onPress={() => {
                                                        // Close modal so Detail screen is top-most
                                                        setVisible(false);
                                                        NavigationService.navigate('RecipeDetail', {
                                                            recipe: r,
                                                            from_screen: 'ChatBot'
                                                        });
                                                    }}
                                                >
                                                    <Text style={styles.recipeTitle}>{r.recipe_name}</Text>
                                                    <Text style={styles.recipeTime}>⏱️ {r.total_time}</Text>
                                                </TouchableOpacity>
                                            ))}
                                        </View>
                                    );
                                }

                                return (
                                    <View key={msg.id} style={[
                                        styles.messageBubble,
                                        msg.type === 'user' ? styles.userBubble : styles.botBubble
                                    ]}>
                                        <Text style={[
                                            styles.messageText,
                                            msg.type === 'user' ? styles.userText : styles.botText
                                        ]}>{msg.text}</Text>
                                    </View>
                                );
                            })}

                            {loading && (
                                <View style={styles.loadingContainer}>
                                    <ActivityIndicator size="small" color="#48BB78" />
                                    <Text style={styles.loadingText}>Chef is thinking...</Text>
                                </View>
                            )}

                            {/* Options */}
                            {!loading && messages[messages.length - 1].options && (
                                <View style={styles.optionsContainer}>
                                    {['Meal Planning', 'Saved Meal Plans'].map((opt) => (
                                        <TouchableOpacity
                                            key={opt}
                                            style={styles.optionButton}
                                            onPress={() => handleOptionSelect(opt)}
                                        >
                                            <Text style={styles.optionText}>{opt}</Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            )}
                        </ScrollView>
                    </View>
                </View>
            </Modal>
        </>
    );
};

const styles = StyleSheet.create({
    fab: {
        position: 'absolute',
        width: BUBBLE_SIZE,
        height: BUBBLE_SIZE,
        borderRadius: BUBBLE_SIZE / 2,
        backgroundColor: '#48BB78',
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        zIndex: 9999, // High zIndex to sit on top
    },
    modalContainer: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: 'white',
        height: '80%',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        overflow: 'hidden',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
        backgroundColor: '#f9f9f9',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
    },
    chatArea: {
        flex: 1,
    },
    messageBubble: {
        padding: 12,
        borderRadius: 15,
        maxWidth: '80%',
        marginBottom: 10,
    },
    botBubble: {
        backgroundColor: '#f0f0f0',
        alignSelf: 'flex-start',
        borderBottomLeftRadius: 0,
    },
    userBubble: {
        backgroundColor: '#48BB78',
        alignSelf: 'flex-end',
        borderBottomRightRadius: 0,
    },
    messageText: {
        fontSize: 15,
        lineHeight: 22,
    },
    botText: {
        color: '#333',
    },
    userText: {
        color: 'white',
    },
    optionsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginTop: 10,
        marginBottom: 20,
    },
    optionButton: {
        backgroundColor: 'white',
        borderWidth: 1,
        borderColor: '#48BB78',
        borderRadius: 20,
        paddingVertical: 8,
        paddingHorizontal: 15,
        margin: 5,
    },
    optionText: {
        color: '#48BB78',
        fontWeight: '600',
    },
    loadingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 10,
        marginLeft: 10,
    },
    loadingText: {
        marginLeft: 8,
        color: '#666',
        fontSize: 14,
    },
    recipeCard: {
        backgroundColor: '#F7FAFC',
        padding: 12,
        borderRadius: 10,
        marginBottom: 8,
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    recipeTitle: {
        fontWeight: 'bold',
        fontSize: 16,
        color: '#2D3748',
        marginBottom: 4,
    },
    recipeTime: {
        fontSize: 12,
        color: '#718096',
    },
    saveButton: {
        backgroundColor: '#4299E1',
        padding: 12,
        borderRadius: 10,
        alignItems: 'center',
        marginVertical: 10,
        alignSelf: 'center',
    },
    saveButtonText: {
        color: 'white',
        fontWeight: 'bold',
    },
});

export default ChatBot;
