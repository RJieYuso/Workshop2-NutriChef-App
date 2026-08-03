import React from 'react';
import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

// Screens
import SplashScreen from './src/screens/SplashScreen';
import HomeScreen from './src/screens/HomeScreen';
import InventoryScreen from './src/screens/InventoryScreen';
import RecipeScreen from './src/screens/RecipeScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import RecipeDetailScreen from './src/screens/RecipeDetailScreen';
import SavedRecipesScreen from './src/screens/SavedRecipesScreen';
import ScanFoodScreen from './src/screens/ScanFoodScreen';
import LoginScreen from './src/screens/LoginScreen';
import RegisterScreen from './src/screens/RegisterScreen';
import VerifyEmailScreen from './src/screens/VerifyEmailScreen'; // Import VerifyEmail

import ChatBot from './src/components/ChatBot';
import { navigationRef } from './src/services/NavigationService';

import { SettingsProvider, useSettings } from './src/context/SettingsContext';
import { AuthProvider, useAuth } from './src/context/AuthContext'; // Custom Auth
import { lightTheme as customLightTheme, darkTheme as customDarkTheme } from './src/theme';

const Stack = createNativeStackNavigator();
const AuthStack = createNativeStackNavigator(); // Define AuthStack

function ThemeAwareApp() {
    const { darkMode } = useSettings();

    // Correctly map custom theme to React Navigation theme structure
    const navigationTheme = darkMode ? {
        ...DarkTheme,
        colors: {
            ...DarkTheme.colors,
            primary: customDarkTheme.primary,
            background: customDarkTheme.background,
            card: customDarkTheme.surface, // or cardBackground
            text: customDarkTheme.text,
            border: customDarkTheme.border,
            notification: customDarkTheme.warning,
        },
    } : {
        ...DefaultTheme,
        colors: {
            ...DefaultTheme.colors,
            primary: customLightTheme.primary,
            background: customLightTheme.background,
            card: customLightTheme.surface,
            text: customLightTheme.text,
            border: customLightTheme.border,
            notification: customLightTheme.warning,
        },
    };

    function AuthNavigator() {
        return (
            <AuthStack.Navigator
                screenOptions={{
                    headerShown: false,
                    contentStyle: { backgroundColor: navigationTheme.colors.background }
                }}
            >
                <AuthStack.Screen name="Login" component={LoginScreen} />
                <AuthStack.Screen name="Register" component={RegisterScreen} />
                <AuthStack.Screen name="VerifyEmail" component={VerifyEmailScreen} />
            </AuthStack.Navigator>
        );
    }

    // Use Custom Auth Context
    const { user, loading } = useAuth();

    if (loading) {
        return <SplashScreen />; // Or a simple loading indicator
    }

    return (
        <GestureHandlerRootView style={{ flex: 1, backgroundColor: navigationTheme.colors.background }}>
            <NavigationContainer theme={navigationTheme} ref={navigationRef}>
                <Stack.Navigator
                    screenOptions={{
                        contentStyle: { backgroundColor: navigationTheme.colors.background },
                    }}
                >
                    {user ? (
                        // Authenticated Stack
                        <>
                            <Stack.Screen name="Home" component={HomeScreen} options={{ headerShown: false }} />
                            <Stack.Screen name="Inventory" component={InventoryScreen} options={{ headerShown: false }} />
                            <Stack.Screen name="Recipe" component={RecipeScreen} options={{ headerShown: false }} />
                            <Stack.Screen name="Profile" component={ProfileScreen} options={{ headerShown: false }} />
                            <Stack.Screen name="RecipeDetail" component={RecipeDetailScreen} options={{ headerShown: false }} />
                            <Stack.Screen name="SavedRecipes" component={SavedRecipesScreen} options={{ headerShown: false }} />
                            <Stack.Screen name="Scanner" component={ScanFoodScreen} options={{ headerShown: false }} />
                        </>
                    ) : (
                        // Auth Stack
                        <Stack.Screen name="Auth" component={AuthNavigator} options={{ headerShown: false }} />
                    )}
                </Stack.Navigator>
            </NavigationContainer>
            {user && <ChatBot />}
        </GestureHandlerRootView>
    );
}

export default function App() {
    return (
        <SafeAreaProvider>
            <SettingsProvider>
                <AuthProvider>
                    <ThemeAwareApp />
                </AuthProvider>
            </SettingsProvider>
        </SafeAreaProvider>
    );
}
