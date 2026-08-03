import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Switch, TouchableOpacity, ScrollView, StatusBar, TextInput, Alert, ActivityIndicator, KeyboardAvoidingView, Platform, TouchableWithoutFeedback, Keyboard } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSettings } from '../context/SettingsContext';
import { useAuth } from '../context/AuthContext';
import { getTheme } from '../theme';
import supabase, { supabaseDB } from '../services/supabase';

export default function ProfileScreen({ navigation }) {
    const { darkMode, toggleDarkMode, useMealDirection, toggleUseMealDirection } = useSettings();
    const { logout, user } = useAuth(); // Get user from Context
    const theme = getTheme(darkMode);

    // Initial state from context if available, but fetch fresh to be sure
    const [mealDirection, setMealDirection] = useState(user?.meal_direction || '');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        loadProfile();
    }, [user]);

    const loadProfile = async () => {
        if (!user || !user.user_id) {
            setLoading(false);
            return;
        }

        try {
            // We use the ID from our custom auth context user
            const userId = user.user_id;

            // Re-fetch to get latest server state
            const { data, error } = await supabaseDB.getUserProfile(userId);
            if (data) {
                setMealDirection(data.meal_direction || '');
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            if (!user || !user.user_id) {
                Alert.alert("Error", "No user logged in");
                return;
            }
            const userId = user.user_id;

            const { error } = await supabaseDB.updateUserProfile(userId, { meal_direction: mealDirection });
            if (!error) {
                Alert.alert('Success', 'Meal directions saved!');
                // Optional: Update context if we had a setUser method exposed, 
                // but next login/reload will catch it. 
                // ideally we updating local user object in AuthContext too.
            } else {
                Alert.alert('Error', 'Failed to save changes.');
            }
        } catch (e) {
            console.error(e);
            Alert.alert('Error', 'An unexpected error occurred.');
        } finally {
            setSaving(false);
        }
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
            <StatusBar barStyle={theme.statusBarStyle} />
            <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                <ScrollView showsVerticalScrollIndicator={false}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 30 }}>
                        <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginRight: 15 }}>
                            <Ionicons name="arrow-back" size={24} color={theme.text} />
                        </TouchableOpacity>
                        <Text style={[styles.headerTitle, { color: theme.text, marginBottom: 0 }]}>Profile & Settings</Text>
                    </View>

                    <View style={styles.section}>
                        <Text style={[styles.sectionHeader, { color: theme.textTertiary }]}>APPEARANCE</Text>

                        <View style={[styles.row, { borderBottomColor: theme.borderLight }]}>
                            <View>
                                <Text style={[styles.label, { color: theme.text }]}>Dark Mode</Text>
                                <Text style={[styles.sublabel, { color: theme.textSecondary }]}>
                                    {darkMode ? 'Enabled' : 'Disabled'}
                                </Text>
                            </View>
                            <Switch
                                value={darkMode}
                                onValueChange={toggleDarkMode}
                                trackColor={{ false: theme.border, true: theme.primary }}
                                thumbColor={darkMode ? theme.surface : '#f4f3f4'}
                            />
                        </View>
                    </View>

                    <View style={styles.section}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                            <Text style={[styles.sectionHeader, { color: theme.textTertiary, marginBottom: 0 }]}>MEAL DIRECTION</Text>
                            <Switch
                                value={useMealDirection}
                                onValueChange={toggleUseMealDirection}
                                trackColor={{ false: theme.border, true: theme.primary }}
                                thumbColor={useMealDirection ? theme.surface : '#f4f3f4'}
                            />
                        </View>
                        <Text style={[styles.helperText, { color: theme.textSecondary }]}>
                            Enter your dietary preferences, allergies, or meal goals strictly below (e.g., "Peanut Allergy, Low Carb, Vegetarian").
                        </Text>

                        {loading ? (
                            <ActivityIndicator size="small" style={{ marginTop: 20 }} />
                        ) : (
                            <View>
                                <TextInput
                                    style={[
                                        styles.input,
                                        {
                                            backgroundColor: theme.surface,
                                            color: theme.text,
                                            borderColor: theme.border
                                        }
                                    ]}
                                    value={mealDirection}
                                    onChangeText={setMealDirection}
                                    placeholder="Type your preferences here..."
                                    placeholderTextColor={theme.textTertiary}
                                    multiline
                                    textAlignVertical="top"
                                />

                                <TouchableOpacity
                                    style={[styles.saveButton, { backgroundColor: theme.primary }]}
                                    onPress={handleSave}
                                    disabled={saving}
                                >
                                    {saving ? (
                                        <ActivityIndicator color="#fff" />
                                    ) : (
                                        <Text style={styles.saveButtonText}>Save Changes</Text>
                                    )}
                                </TouchableOpacity>
                            </View>
                        )}
                    </View>

                    <View style={styles.section}>
                        <TouchableOpacity
                            style={[styles.saveButton, { backgroundColor: '#E53E3E' }]}
                            onPress={logout}
                        >
                            <Text style={styles.saveButtonText}>Log Out</Text>
                        </TouchableOpacity>
                    </View>

                    <Text style={[styles.version, { color: theme.textTertiary }]}>
                        Version 1.0.0 (Global Build)
                    </Text>
                </ScrollView>
            </TouchableWithoutFeedback>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 30,
    },
    section: {
        marginBottom: 30,
    },
    sectionHeader: {
        fontSize: 14,
        fontWeight: 'bold',
        marginBottom: 10,
        textTransform: 'uppercase',
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 15,
        borderBottomWidth: 1,
    },
    label: {
        fontSize: 16,
        fontWeight: '600',
    },
    sublabel: {
        fontSize: 13,
        marginTop: 2,
    },
    helperText: {
        fontSize: 14,
        marginBottom: 10,
        lineHeight: 20,
    },
    input: {
        borderWidth: 1,
        borderRadius: 12,
        padding: 15,
        minHeight: 120, // Taller input for paragraphs
        fontSize: 16,
        marginBottom: 15,
    },
    saveButton: {
        padding: 15,
        borderRadius: 12,
        alignItems: 'center',
        elevation: 2,
    },
    saveButtonText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 16,
    },
    version: {
        textAlign: 'center',
        marginTop: 20,
        marginBottom: 20,
    },
});
