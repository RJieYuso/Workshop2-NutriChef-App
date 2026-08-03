import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SettingsContext = createContext();

export const useSettings = () => {
    const context = useContext(SettingsContext);
    if (!context) {
        throw new Error('useSettings must be used within SettingsProvider');
    }
    return context;
};

export const SettingsProvider = ({ children }) => {
    const [darkMode, setDarkMode] = useState(false);
    const [metricUnits, setMetricUnits] = useState(true);
    const [loading, setLoading] = useState(true);

    // Load settings from AsyncStorage on mount
    useEffect(() => {
        loadSettings();
    }, []);

    const loadSettings = async () => {
        try {
            const darkModeValue = await AsyncStorage.getItem('darkMode');
            const metricUnitsValue = await AsyncStorage.getItem('metricUnits');

            if (darkModeValue !== null) {
                setDarkMode(JSON.parse(darkModeValue));
            }
            if (metricUnitsValue !== null) {
                setMetricUnits(JSON.parse(metricUnitsValue));
            }
            const useMealDirectionValue = await AsyncStorage.getItem('useMealDirection');
            if (useMealDirectionValue !== null) {
                setUseMealDirection(JSON.parse(useMealDirectionValue));
            }
        } catch (error) {
            console.error('Error loading settings:', error);
        } finally {
            setLoading(false);
        }
    };

    const toggleDarkMode = async () => {
        try {
            const newValue = !darkMode;
            setDarkMode(newValue);
            await AsyncStorage.setItem('darkMode', JSON.stringify(newValue));
        } catch (error) {
            console.error('Error saving dark mode:', error);
        }
    };

    const toggleMetricUnits = async () => {
        try {
            const newValue = !metricUnits;
            setMetricUnits(newValue);
            await AsyncStorage.setItem('metricUnits', JSON.stringify(newValue));
        } catch (error) {
            console.error('Error saving metric units:', error);
        }
    };

    // New: Meal Direction Toggle
    const [useMealDirection, setUseMealDirection] = useState(true);

    const toggleUseMealDirection = async () => {
        try {
            const newValue = !useMealDirection;
            setUseMealDirection(newValue);
            await AsyncStorage.setItem('useMealDirection', JSON.stringify(newValue));
        } catch (error) {
            console.error('Error saving meal direction preference:', error);
        }
    };

    // Load this new setting in loadSettings


    const value = {
        darkMode,
        metricUnits,
        useMealDirection,
        toggleDarkMode,
        toggleMetricUnits,
        toggleUseMealDirection,
        loading,
    };

    return (
        <SettingsContext.Provider value={value}>
            {children}
        </SettingsContext.Provider>
    );
};
