import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { healthCheck } from '../services/api';
import supabase from '../services/supabase';

export default function SplashScreen({ navigation }) {
    useEffect(() => {
        const init = async () => {
            // 1. Check API Health
            await healthCheck();

            // Note: Authentication check is now handled by App.js
            // We just wait here until App.js unmounts this component
        };

        init();
    }, []);

    return (
        <View style={styles.container}>
            <Text style={styles.title}>NutriChef Global</Text>
            <ActivityIndicator size="large" color="#0000ff" />
            <Text style={styles.subtitle}>Connecting to Cloud...</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#fff',
    },
    title: {
        fontSize: 32,
        fontWeight: 'bold',
        marginBottom: 20,
        color: '#333',
    },
    subtitle: {
        marginTop: 10,
        color: '#666',
    },
});
