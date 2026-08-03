import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { getTheme } from '../theme';
import { useSettings } from '../context/SettingsContext';

// Direct access needed for specific table insert if not in service
// const supabase = createClient(Config.SUPABASE_URL, Config.SUPABASE_ANON_KEY);

export default function RegisterScreen({ navigation }) {
    const { darkMode } = useSettings();
    const theme = getTheme(darkMode);
    const { register } = useAuth(); // Custom Hook

    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleRegister = async () => {
        if (!name || !email || !password || !confirmPassword) {
            Alert.alert('Error', 'Please fill in all fields');
            return;
        }

        if (password !== confirmPassword) {
            Alert.alert('Error', 'Passwords do not match');
            return;
        }

        if (password.length < 6) {
            Alert.alert('Error', 'Password must be at least 6 characters');
            return;
        }

        setLoading(true);
        try {
            // Using Custom Auth Context (Direct DB Insert)
            // Ensure we register with lowercased email
            const result = await register(name, email.toLowerCase().trim(), password.trim());

            if (result.success) {
                // Navigate to Verify Email Screen with password for auto-login
                navigation.navigate('VerifyEmail', { email: email, password: password.trim() });
            } else {
                Alert.alert('Registration Failed', result.error);
            }
        } catch (e) {
            Alert.alert('Registration Failed', e.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
            <ScrollView contentContainerStyle={styles.content}>
                <View style={styles.header}>
                    <Text style={[styles.title, { color: theme.text }]}>Create Account</Text>
                    <Text style={[styles.subtitle, { color: theme.textSecondary }]}>Join NutriChef for better health</Text>
                </View>

                <View style={styles.form}>
                    <Text style={[styles.label, { color: theme.textSecondary }]}>Full Name</Text>
                    <TextInput
                        style={[styles.input, {
                            backgroundColor: theme.inputBackground,
                            borderColor: theme.border,
                            color: theme.text
                        }]}
                        placeholder="Enter your name"
                        placeholderTextColor={theme.textTertiary}
                        value={name}
                        onChangeText={setName}
                    />

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
                            placeholder="Create a password"
                            placeholderTextColor={theme.textTertiary}
                            value={password}
                            onChangeText={setPassword}
                            secureTextEntry={!showPassword}
                        />
                        <TouchableOpacity
                            onPress={() => setShowPassword(!showPassword)}
                        >
                            <Ionicons name={showPassword ? "eye" : "eye-off"} size={24} color={theme.textTertiary} />
                        </TouchableOpacity>
                    </View>

                    <Text style={[styles.label, { color: theme.textSecondary }]}>Confirm Password</Text>
                    <View style={[styles.passwordContainer, {
                        backgroundColor: theme.inputBackground,
                        borderColor: theme.border,
                    }]}>
                        <TextInput
                            style={[styles.passwordInput, {
                                color: theme.text
                            }]}
                            placeholder="Confirm your password"
                            placeholderTextColor={theme.textTertiary}
                            value={confirmPassword}
                            onChangeText={setConfirmPassword}
                            secureTextEntry={!showConfirmPassword}
                        />
                        <TouchableOpacity
                            onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                        >
                            <Ionicons name={showConfirmPassword ? "eye" : "eye-off"} size={24} color={theme.textTertiary} />
                        </TouchableOpacity>
                    </View>

                    <TouchableOpacity
                        style={styles.button}
                        onPress={handleRegister}
                        disabled={loading}
                    >
                        {loading ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <Text style={styles.buttonText}>Sign Up</Text>
                        )}
                    </TouchableOpacity>

                    <View style={styles.footer}>
                        <Text style={[styles.footerText, { color: theme.textSecondary }]}>Already have an account? </Text>
                        <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                            <Text style={styles.link}>Log In</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    content: {
        flexGrow: 1,
        padding: 24,
        justifyContent: 'center',
    },
    header: {
        alignItems: 'center',
        marginBottom: 40,
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
        marginBottom: 20,
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
