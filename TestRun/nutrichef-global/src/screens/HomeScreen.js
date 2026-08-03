import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, StatusBar, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Config from '../config';
import { useSettings } from '../context/SettingsContext';
import { getTheme } from '../theme';
import { useAuth } from '../context/AuthContext';

export default function HomeScreen({ navigation }) {
    const { darkMode } = useSettings();
    const { user } = useAuth();
    const theme = getTheme(darkMode);

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: theme.surface }]}>
            <StatusBar barStyle={theme.statusBarStyle} />
            <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
                <View style={styles.header}>
                    <Text style={[styles.welcome, { color: theme.textSecondary }]}>Hi {user?.name || 'Chef'}, welcome to</Text>
                    <View style={styles.brandingContainer}>
                        <Image
                            source={require('../../assets/AppLogo2.png')}
                            style={styles.logo}
                            resizeMode="contain"
                        />
                        <Text style={[styles.appName, { color: theme.text }]}>{Config.APP_NAME}</Text>
                    </View>
                </View>

                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>Quick Actions</Text>
                    <View style={styles.grid}>
                        <TouchableOpacity
                            style={[styles.card, { backgroundColor: theme.background }]}
                            onPress={() => navigation.navigate('Inventory')}
                        >
                            <Image
                                source={require('../../assets/ingredients_icon.png')}
                                style={styles.cardIcon}
                                resizeMode="contain"
                            />
                            <Text style={[styles.cardText, { color: theme.text }]}>My Inventory</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.card, { backgroundColor: theme.background }]}
                            onPress={() => navigation.navigate('Scanner')}
                        >
                            <Image
                                source={require('../../assets/camera_icon.png')}
                                style={styles.cardIcon}
                                resizeMode="contain"
                            />
                            <Text style={[styles.cardText, { color: theme.text }]}>Scan Item</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.card, { backgroundColor: theme.background }]}
                            onPress={() => navigation.navigate('Recipe')}
                        >
                            <Image
                                source={require('../../assets/Get_Recipes_icon.png')}
                                style={styles.cardIcon}
                                resizeMode="contain"
                            />
                            <Text style={[styles.cardText, { color: theme.text }]}>Get Recipes</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.card, { backgroundColor: theme.background }]}
                            onPress={() => navigation.navigate('Profile')}
                        >
                            <Image
                                source={require('../../assets/user_icon.png')}
                                style={styles.cardIcon}
                                resizeMode="contain"
                            />
                            <Text style={[styles.cardText, { color: theme.text }]}>Profile</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* How to use section */}
                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>How our app works:</Text>
                    <View style={[styles.infoCard, { backgroundColor: theme.background }]}>
                        <View style={styles.stepItem}>
                            <Text style={[styles.stepNumber, { color: theme.primary }]}>1.</Text>
                            <Text style={[styles.stepText, { color: theme.text }]}>
                                <Text style={{ fontWeight: 'bold' }}>Profile:</Text> Fill in your meal preferences. This helps us prepare the right recipes for you.
                            </Text>
                        </View>
                        <View style={styles.stepItem}>
                            <Text style={[styles.stepNumber, { color: theme.primary }]}>2.</Text>
                            <Text style={[styles.stepText, { color: theme.text }]}>
                                <Text style={{ fontWeight: 'bold' }}>My Inventory:</Text> Manage the items in your fridge.
                            </Text>
                        </View>
                        <View style={styles.stepItem}>
                            <Text style={[styles.stepNumber, { color: theme.primary }]}>3.</Text>
                            <Text style={[styles.stepText, { color: theme.text }]}>
                                <Text style={{ fontWeight: 'bold' }}>Scan Item:</Text> Use the camera to check if your food is Fresh or Spoiled when there’s no expiration label.
                            </Text>
                        </View>
                        <View style={styles.stepItem}>
                            <Text style={[styles.stepNumber, { color: theme.primary }]}>4.</Text>
                            <Text style={[styles.stepText, { color: theme.text }]}>
                                <Text style={{ fontWeight: 'bold' }}>Get Recipes:</Text> Let AI suggest recipes based on your selected ingredients!
                            </Text>
                        </View>
                    </View>
                </View>

                <View style={styles.status}>
                    <Text style={[styles.statusText, { color: theme.textTertiary }]}>Connected to: {Config.API_URL}</Text>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scroll: {
        padding: 20,
    },
    header: {
        marginBottom: 20,
    },
    welcome: {
        fontSize: 20,
    },
    appName: {
        fontSize: 32,
        fontWeight: 'bold',
    },
    brandingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 5,
    },
    logo: {
        width: 50,
        height: 50,
        marginRight: 10,
        borderRadius: 8, // Optional: if icon is square
    },
    section: {
        marginBottom: 15,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        marginBottom: 15,
    },
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
    },
    card: {
        width: '48%',
        padding: 20,
        borderRadius: 16,
        marginBottom: 8,
        alignItems: 'center',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
    },
    cardIcon: {
        width: 80,
        height: 80,
        marginBottom: 10,
    },
    cardText: {
        fontSize: 14,
        fontWeight: '600',
    },
    // New Styles for Info Section
    infoCard: {
        padding: 20,
        borderRadius: 16,
        elevation: 1,
    },
    stepItem: {
        flexDirection: 'row',
        marginBottom: 12,
        alignItems: 'flex-start',
    },
    stepNumber: {
        fontSize: 16,
        fontWeight: 'bold',
        marginRight: 10,
        width: 20,
    },
    stepText: {
        fontSize: 14,
        flex: 1,
        lineHeight: 20,
    },
    status: {
        marginTop: 20,
        alignItems: 'center',
        paddingBottom: 20,
    },
    statusText: {
        fontSize: 12,
    },
});
