import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabaseAuth } from '../services/supabase';
import { getTheme } from '../theme';
import { useSettings } from '../context/SettingsContext';

import { useAuth } from '../context/AuthContext';

export default function LoginScreen({ navigation }) {
    const { darkMode } = useSettings();
    const { login } = useAuth(); // distinct from supabaseAuth
    const theme = getTheme(darkMode);

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleLogin = async () => {
        if (!email || !password) {
            Alert.alert('Error', 'Please fill in all fields');
            return;
        }

        setLoading(true);
        try {
            const result = await login(email, password);
            if (!result.success) {
                Alert.alert('Login Failed', result.error);
            } else {
                // Navigation is handled by App.js or we can force it here if needed,
                // but usually setting user state in context triggers App.js re-render
                console.log("Login successful, custom auth flow complete");
            }
        } catch (e) {
            Alert.alert('Error', e.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
            <View style={styles.content}>
                <View style={styles.header}>
                    <View style={styles.logoContainer}>
                        <Image
                            source={require('../../assets/login_1.png')}
                            style={styles.sideImageLeft}
                            resizeMode="contain"
                        />
                        <Image
                            source={require('../../assets/Get_Recipes_icon.png')}
                            style={styles.logo}
                            resizeMode="contain"
                        />
                        <Image
                            source={require('../../assets/login_2.png')}
                            style={styles.sideImageRight}
                            resizeMode="contain"
                        />
                    </View>
                    <Text style={[styles.title, { color: theme.text }]}>Welcome Back!</Text>
                    <Text style={[styles.subtitle, { color: theme.textSecondary }]}>Sign in to continue planning healthy meals</Text>
                </View>

                <View style={styles.form}>
                    <Text style={[styles.label, { color: theme.textSecondary }]}>Email</Text>
                    <TextInput
                        style={[styles.input, {
                            backgroundColor: theme.inputBackground,
                            borderColor: theme.border,
                            color: theme.text
                        }]}
                        placeholder="Enter your email"
                        placeholderTextColor={theme.textTertiary}
                        value={email}
                        onChangeText={setEmail}
                        autoCapitalize="none"
                        keyboardType="email-address"
                    />

                    <Text style={[styles.label, { color: theme.textSecondary }]}>Password</Text>
                    <View style={[styles.passwordContainer, {
                        backgroundColor: theme.inputBackground,
                        borderColor: theme.border,
                    }]}>
                        <TextInput
                            style={[styles.passwordInput, {
                                color: theme.text
                            }]}
                            placeholder="Enter your password"
                            placeholderTextColor={theme.textTertiary}
                            value={password}
                            onChangeText={setPassword}
                            secureTextEntry={!showPassword}
                        />
                        <TouchableOpacity
                            style={styles.eyeIcon}
                            onPress={() => setShowPassword(!showPassword)}
                        >
                            <Ionicons name={showPassword ? "eye" : "eye-off"} size={24} color={theme.textTertiary} />
                        </TouchableOpacity>
                    </View>

                    <TouchableOpacity
                        style={styles.button}
                        onPress={handleLogin}
                        disabled={loading}
                    >
                        {loading ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <Text style={styles.buttonText}>Log In</Text>
                        )}
                    </TouchableOpacity>

                    <View style={styles.footer}>
                        <Text style={[styles.footerText, { color: theme.textSecondary }]}>Don't have an account? </Text>
                        <TouchableOpacity onPress={() => navigation.navigate('Register')}>
                            <Text style={styles.link}>Sign Up</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    content: {
        flex: 1,
        padding: 24,
        justifyContent: 'center',
    },
    header: {
        alignItems: 'center',
        marginBottom: 40,
    },
    logoContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 20,
    },
    logo: {
        width: 80,
        height: 80,
        marginHorizontal: 0,
    },
    sideImageLeft: {
        width: 70,
        height: 70,
    },
    sideImageRight: {
        width: 90,
        height: 90,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 16,
        textAlign: 'center',
    },
    form: {
        width: '100%',
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 8,
        marginTop: 16,
    },
    input: {
        height: 50,
        borderRadius: 12,
        borderWidth: 1,
        paddingHorizontal: 16,
        fontSize: 16,
    },
    passwordContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        height: 50,
        borderRadius: 12,
        borderWidth: 1,
        paddingHorizontal: 16,
    },
    passwordInput: {
        flex: 1,
        height: '100%',
        fontSize: 16,
    },
    eyeIcon: {
        marginLeft: 10,
    },
    button: {
        backgroundColor: '#48BB78',
        height: 56,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 32,
        shadowColor: '#48BB78',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    buttonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: 24,
    },
    footerText: {
        fontSize: 14,
    },
    link: {
        color: '#48BB78',
        fontSize: 14,
        fontWeight: 'bold',
    },
});
