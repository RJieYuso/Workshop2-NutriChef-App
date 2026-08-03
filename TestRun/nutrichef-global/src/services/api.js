import axios from 'axios';
import Config from '../config';
import NetInfo from '@react-native-community/netinfo';
import { Alert, Platform } from 'react-native';
import supabase from './supabase'; // Fixed import (default export)

const API = axios.create({
    baseURL: Config.API_URL,
    timeout: 120000,
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'App-Version': '1.0.0',
    }
});

// Global error handling
API.interceptors.response.use(
    response => response,
    async error => {
        if (!error.response) {
            // Network error - no internet
            const netState = await NetInfo.fetch();
            if (!netState.isConnected) {
                Alert.alert('No Connection', 'Please check your internet connection.');
                // You might want to throw a specific error type here
                return Promise.reject(new Error('NO_INTERNET'));
            }
            return Promise.reject(new Error('SERVER_UNREACHABLE'));
        }

        // Handle specific status codes
        switch (error.response.status) {
            case 401:
                // Token expired - redirect to login (handled by nav usually)
                console.log("Unauthorized");
                break;
            case 429:
                Alert.alert('Too Many Requests', 'Please wait a moment before trying again.');
                break;
            case 500:
                console.error("Server Error", error.response.data);
                break;
            default:
                console.error("API Error", error);
        }
        return Promise.reject(error);
    }
);

export const healthCheck = async () => {
    try {
        const response = await API.get('/ai-recommend/health');
        return response.data;
    } catch (error) {
        console.error('Health check failed:', error);
        return null;
    }
};

export const generateRecipes = async (ingredients, healthConditions, topN = 3, mealType = null, servings = "2") => {
    // Use Python Backend for enhanced AI
    const baseUrl = Config.PYTHON_BACKEND_URL || Config.API_URL;
    // Adapt path based on backend (Python uses /api/ai/recommend, Supabase uses /ai-recommend)
    // We assume we want Python now
    const url = Config.PYTHON_BACKEND_URL
        ? `${Config.PYTHON_BACKEND_URL}/api/ai/recommend`
        : '/ai-recommend';

    const response = await axios.post(url, {
        ingredients,
        health_conditions: healthConditions,
        top_n: topN,
        meal_type: mealType,
        servings: servings
    }, {
        headers: {
            'Content-Type': 'application/json',
            'ngrok-skip-browser-warning': 'true'
        }
    });
    return response.data;
};

export const generateMealPlan = async (ingredients, mealDirection = null, calorieTarget = 2000) => {
    // Use Python Backend
    const baseUrl = Config.PYTHON_BACKEND_URL || Config.API_URL;
    const url = Config.PYTHON_BACKEND_URL
        ? `${Config.PYTHON_BACKEND_URL}/api/ai/meal-plan`
        : '/ai/meal-plan';

    // Parse mealDirection into a list if it's a string, or send as is
    let healthConditions = [];
    if (mealDirection) {
        healthConditions = typeof mealDirection === 'string'
            ? mealDirection.split(',').map(s => s.trim()).filter(s => s.length > 0)
            : mealDirection;
    }

    const response = await axios.post(url, {
        ingredients,
        health_conditions: healthConditions,
        calorie_target: calorieTarget
    }, {
        headers: {
            'Content-Type': 'application/json',
            'ngrok-skip-browser-warning': 'true'
        }
    });
    return response.data;
};

export const scanFood = async (imageUri) => {
    const formData = new FormData();

    if (Platform.OS === 'web') {
        // Web requires a Blob/File object
        const response = await fetch(imageUri);
        const blob = await response.blob();
        formData.append('image', blob, 'food_scan.jpg');
    } else {
        // Mobile requires the URI object
        formData.append('image', {
            uri: imageUri,
            type: 'image/jpeg',
            name: 'food_scan.jpg',
        });
    }

    // Determine backend URL (Python backend vs Supabase)
    // Using LAN IP 192.168.1.10 (from your Flask logs) to support both Emulator and Physical Device
    let backendUrl = 'http://192.168.1.10:5002';

    // Check if we are in production or have a specific config override
    if (Config.PYTHON_BACKEND_URL) {
        backendUrl = Config.PYTHON_BACKEND_URL;
    }

    try {
        console.log(`📡 Sending scan request to: ${backendUrl}/api/scan-food`);

        // Create a new instance for this specific call to avoid base URL conflict
        // Use fetch instead of axios for better FormData handling on mobile
        const response = await fetch(`${backendUrl}/api/scan-food`, {
            method: 'POST',
            body: formData,
            headers: {
                'Accept': 'application/json',
                'ngrok-skip-browser-warning': 'true',
            },
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`HTTP error! status: ${response.status}, body: ${errorText}`);
        }

        const data = await response.json();

        console.log("✅ Scan successful!", data);
        return data;
    } catch (error) {
        console.error("❌ Scan failed:", error);
        throw error;
    }
};

// Add Authorization header for Supabase Edge Functions
API.interceptors.request.use(async (config) => {
    try {
        const { data: { session } } = await supabase.auth.getSession();
        const token = session?.access_token || Config.SUPABASE_ANON_KEY;
        config.headers.Authorization = `Bearer ${token}`;
    } catch (error) {
        console.warn('Error fetching session for API:', error);
        config.headers.Authorization = `Bearer ${Config.SUPABASE_ANON_KEY}`;
    }
    return config;
});

export default API;
