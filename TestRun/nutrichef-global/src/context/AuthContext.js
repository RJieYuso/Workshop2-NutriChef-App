import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabaseDB } from '../services/supabase';
import supabase from '../services/supabase';
import Config from '../config';
import { Alert } from 'react-native';

const AuthContext = createContext({});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadStorageData();
    }, []);

    const loadStorageData = async () => {
        try {
            const storedUser = await AsyncStorage.getItem('userData');
            if (storedUser) {
                setUser(JSON.parse(storedUser));
            }
        } catch (e) {
            console.error("Failed to load user data", e);
        } finally {
            setLoading(false);
        }
    };

    const login = async (email, password) => {
        try {
            console.log("Attempting login for:", email);
            const normalizedEmail = email.toLowerCase().trim();
            const normalizedPassword = password.trim(); // Be careful trimming password if user intended spaces, but usually safe for simple apps

            // 1. Query the user table directly
            const { data, error } = await supabase
                .from('users')
                .select('*')
                .eq('email', normalizedEmail)
                .single(); // Expecting one result

            if (error) {
                console.error("Supabase Login Error:", error);
                if (error.code === 'PGRST116') {
                    throw new Error("User not found");
                }
                throw error;
            }

            console.log("User found:", data.email);
            // console.log("DB Password:", data.password); // Security risk logging password, but useful for debugging if desperate.
            // console.log("Input Password:", normalizedPassword);

            // 2. Simple Password Check (Insecure: string compare)
            // Note: In production, this should use bcrypt compare
            if (data.password !== normalizedPassword) {
                console.warn("Password mismatch");
                throw new Error("Invalid password");
            }

            // 3. Success
            console.log("Login successful, updating state...");
            setUser(data);
            await AsyncStorage.setItem('userData', JSON.stringify(data));
            return { success: true };

        } catch (e) {
            console.error("Login Exception:", e.message);
            return { success: false, error: e.message };
        }
    };

    const register = async (name, email, password) => {
        console.log("AuthContext: Registering...", email);
        try {
            // 1. Check if email exists
            const { data: existingUser } = await supabase
                .from('users')
                .select('email')
                .eq('email', email)
                .maybeSingle();

            if (existingUser) {
                console.log("AuthContext: Email already exists");
                throw new Error("Email already registered");
            }

            // 2. Generate 6-digit Code
            const code = Math.floor(100000 + Math.random() * 900000).toString();
            console.log("AuthContext: Generated Code:", code);

            // 3. Insert new user (Unverified)
            const { data, error } = await supabase
                .from('users')
                .insert([
                    {
                        name: name,
                        email: email,
                        password: password,
                        meal_direction: '',
                        is_verified: false,
                        verification_code: code
                    }
                ])
                .select()
                .single();

            if (error) {
                console.error("AuthContext: DB Insert Error", error);
                throw error;
            }

            // 4. Send Email via Backend
            // IMPORTANT: Ensure your python backend is running on the correct IP/Port
            // Using localhost for now assuming tunnel or local run
            // 4. Send Email via Backend
            // Using Configured URL (LAN IP or Production)
            const API_URL = `${Config.PYTHON_BACKEND_URL}/api/auth/send-verification`;
            console.log("AuthContext: Sending email via", API_URL);

            try {
                // Fetch from the backend with 15s timeout (email sending can be slow)
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 15000);

                const response = await fetch(API_URL, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, code }),
                    signal: controller.signal
                });
                clearTimeout(timeoutId);

                const result = await response.json();
                console.log("AuthContext: Email result", result);
            } catch (emailErr) {
                console.warn("AuthContext: Email fetch failed/timed out:", emailErr.message);
                // We proceed anyway so user isn't stuck. They can click "Resend" later.
            }

            return { success: true };

        } catch (e) {
            console.error("AuthContext: Register Exception", e);
            return { success: false, error: e.message };
        }
    };

    const verifyEmail = async (email, code) => {
        try {
            // 1. Fetch user
            const { data, error } = await supabase
                .from('users')
                .select('*')
                .eq('email', email)
                .single();

            if (error || !data) throw new Error("User not found");

            // 2. Validate Code
            if (data.verification_code !== code) {
                throw new Error("Invalid verification code");
            }

            // 3. Update Status
            const { error: updateError } = await supabase
                .from('users')
                .update({ is_verified: true, verification_code: null }) // Clear code
                .eq('user_id', data.user_id);

            if (updateError) throw updateError;

            return { success: true };
        } catch (e) {
            return { success: false, error: e.message };
        }
    };

    const resendVerificationCode = async (email) => {
        try {
            const code = Math.floor(100000 + Math.random() * 900000).toString();

            // Update DB
            await supabase
                .from('users')
                .update({ verification_code: code })
                .eq('email', email);

            // Call Backend
            const API_URL = `${Config.PYTHON_BACKEND_URL}/api/auth/send-verification`;
            await fetch(API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, code })
            });

            return { success: true };
        } catch (e) {
            return { success: false, error: e.message };
        }
    };

    const logout = async () => {
        setUser(null);
        await AsyncStorage.removeItem('userData');
        // Clear Supabase session just in case
        await supabase.auth.signOut();
    };

    return (
        <AuthContext.Provider value={{ user, loading, login, register, logout, verifyEmail, resendVerificationCode }}>
            {children}
        </AuthContext.Provider>
    );
};
