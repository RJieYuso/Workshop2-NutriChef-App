import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';
import { getTheme } from '../theme';

export default function VerifyEmailScreen({ route, navigation }) {
    const { email } = route.params || {};
    const { verifyEmail, resendVerificationCode, login } = useAuth();
    const { darkMode } = useSettings();
    const theme = getTheme(darkMode);

    const [code, setCode] = useState(['', '', '', '', '', '']);
    const [loading, setLoading] = useState(false);
    const [timeLeft, setTimeLeft] = useState(60);
    const inputs = useRef([]);

    // Countdown timer for resend
    useEffect(() => {
        if (timeLeft > 0) {
            const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
            return () => clearTimeout(timer);
        }
    }, [timeLeft]);

    const handleInput = (text, index) => {
        const newCode = [...code];
        newCode[index] = text;
        setCode(newCode);

        // Auto focus next input
        if (text && index < 5) {
            inputs.current[index + 1].focus();
        }

        // Auto submit on last digit
        if (index === 5 && text) {
            // Optional: handleVerify(newCode.join(''));
        }
    };

    const handleVerify = async () => {
        const fullCode = code.join('');
        if (fullCode.length !== 6) {
            Alert.alert('Error', 'Please enter the complete 6-digit code');
            return;
        }

        setLoading(true);
        const result = await verifyEmail(email, fullCode);

        if (result.success) {
            // Auto-login the user after successful verification
            // We need to get the password from route params
            const { password } = route.params || {};

            if (password) {
                // Automatically log in
                const loginResult = await login(email, password);
                setLoading(false);

                if (loginResult.success) {
                    // Navigation to Home will happen automatically via AuthContext
                    // No need to manually navigate
                } else {
                    // If auto-login fails, go to login screen
                    Alert.alert('Verified!', 'Please log in with your credentials.', [
                        { text: 'OK', onPress: () => navigation.replace('Login') }
                    ]);
                }
            } else {
                setLoading(false);
                // No password available, redirect to login
                Alert.alert('Success', 'Email verified! Please log in.', [
                    { text: 'OK', onPress: () => navigation.replace('Login') }
                ]);
            }
        } else {
            setLoading(false);
            Alert.alert('Error', result.error || 'Verification failed');
        }
    };

    const handleResend = async () => {
        setLoading(true);
        const result = await resendVerificationCode(email);
        setLoading(false);

        if (result.success) {
            Alert.alert('Sent', 'A new code has been sent to your email.');
            setTimeLeft(60);
        } else {
            Alert.alert('Error', result.error || 'Failed to resend code');
        }
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
            <View style={styles.content}>
                <Text style={[styles.title, { color: theme.text }]}>Verify Email 📧</Text>
                <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
                    Please enter the 6-digit code sent to {email}
                </Text>

                <View style={styles.codeContainer}>
                    {code.map((digit, index) => (
                        <TextInput
                            key={index}
                            ref={ref => inputs.current[index] = ref}
                            style={[
                                styles.codeInput,
                                {
                                    backgroundColor: theme.inputBackground,
                                    borderColor: theme.border,
                                    color: theme.text
                                }
                            ]}
                            maxLength={1}
                            keyboardType="number-pad"
                            onChangeText={(text) => handleInput(text, index)}
                            value={digit}
                            onKeyPress={({ nativeEvent }) => {
                                if (nativeEvent.key === 'Backspace' && !digit && index > 0) {
                                    inputs.current[index - 1].focus();
                                }
                            }}
                        />
                    ))}
                </View>

                <TouchableOpacity
                    style={[styles.verifyButton, { opacity: loading ? 0.7 : 1 }]}
                    onPress={handleVerify}
                    disabled={loading}
                >
                    {loading ? (
                        <ActivityIndicator color="white" />
                    ) : (
                        <Text style={styles.buttonText}>Verify Account</Text>
                    )}
                </TouchableOpacity>

                <TouchableOpacity
                    onPress={handleResend}
                    disabled={timeLeft > 0 || loading}
                    style={styles.resendButton}
                >
                    <Text style={{
                        color: timeLeft > 0 ? theme.textSecondary : '#48BB78',
                        fontWeight: '600'
                    }}>
                        {timeLeft > 0 ? `Resend code in ${timeLeft}s` : "Resend Code"}
                    </Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    content: {
        padding: 20,
        alignItems: 'center',
        paddingTop: 50
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        marginBottom: 10,
    },
    subtitle: {
        fontSize: 16,
        textAlign: 'center',
        marginBottom: 40,
    },
    codeContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between', // Changed to space-between for better gap handling or use gap prop
        gap: 10,
        marginBottom: 30,
        width: '100%'
    },
    codeInput: {
        width: 45,
        height: 50,
        borderWidth: 1,
        borderRadius: 8,
        fontSize: 24,
        textAlign: 'center',
        fontWeight: 'bold',
    },
    verifyButton: {
        backgroundColor: '#48BB78',
        paddingVertical: 15,
        borderRadius: 8,
        width: '100%',
        alignItems: 'center',
        marginBottom: 20
    },
    buttonText: {
        color: 'white',
        fontSize: 18,
        fontWeight: 'bold',
    },
    resendButton: {
        padding: 10,
    }
});
