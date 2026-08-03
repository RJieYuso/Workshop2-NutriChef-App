import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Easing } from 'react-native';

const RecipeLoader = ({ theme }) => {
    const [messageIndex, setMessageIndex] = useState(0);
    const pulseAnim = useRef(new Animated.Value(0.3)).current;

    const messages = [
        "🔍 Analyzing your ingredients...",
        "👨‍🍳 Consulting the AI Chef...",
        "🥬 Checking for freshness...",
        "🧂 Creating nutritional balance...",
        "🍽️ Finalizing your recipes..."
    ];

    useEffect(() => {
        // Cycle through messages every 2 seconds
        const messageInterval = setInterval(() => {
            setMessageIndex((prev) => (prev + 1) % messages.length);
        }, 2000);

        return () => clearInterval(messageInterval);
    }, []);

    useEffect(() => {
        // Pulse animation for skeleton
        const startAnimation = () => {
            Animated.loop(
                Animated.sequence([
                    Animated.timing(pulseAnim, {
                        toValue: 1,
                        duration: 800,
                        useNativeDriver: true,
                        easing: Easing.ease,
                    }),
                    Animated.timing(pulseAnim, {
                        toValue: 0.3,
                        duration: 800,
                        useNativeDriver: true,
                        easing: Easing.ease,
                    }),
                ])
            ).start();
        };

        startAnimation();
    }, [pulseAnim]);

    const SkeletonCard = () => (
        <View style={[styles.card, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}>
            <Animated.View style={[styles.skeletonLine, { width: '70%', height: 20, opacity: pulseAnim, backgroundColor: theme.textSecondary }]} />
            <View style={{ height: 10 }} />
            <Animated.View style={[styles.skeletonLine, { width: '90%', height: 14, opacity: pulseAnim, backgroundColor: theme.textTertiary }]} />
            <View style={{ height: 6 }} />
            <Animated.View style={[styles.skeletonLine, { width: '40%', height: 14, opacity: pulseAnim, backgroundColor: theme.textTertiary }]} />
        </View>
    );

    return (
        <View style={styles.container}>
            <View style={styles.messageContainer}>
                <Text style={[styles.loadingText, { color: theme.primary }]}>
                    {messages[messageIndex]}
                </Text>
            </View>

            <View style={styles.skeletonContainer}>
                <SkeletonCard />
                <SkeletonCard />
                <SkeletonCard />
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginTop: 20,
    },
    messageContainer: {
        alignItems: 'center',
        marginBottom: 20,
        height: 30, // Fixed height to prevent jump
    },
    loadingText: {
        fontSize: 16,
        fontWeight: '600',
    },
    skeletonContainer: {
        gap: 15, // Gap support depends on RN version, fallback provided by margin in card
    },
    card: {
        padding: 15,
        borderRadius: 10,
        marginBottom: 15,
        borderWidth: 1,
    },
    skeletonLine: {
        borderRadius: 4,
    }
});

export default RecipeLoader;
