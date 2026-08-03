import React, { useState } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    Image,
    StyleSheet,
    Alert,
    ActivityIndicator,
    ScrollView,
    SafeAreaView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { scanFood } from '../services/api';
import { useSettings } from '../context/SettingsContext';
import { useAuth } from '../context/AuthContext';
import { supabaseDB } from '../services/supabase';

const ScanFoodScreen = ({ navigation }) => {
    const [image, setImage] = useState(null);
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null);
    const { darkMode } = useSettings();

    const theme = {
        background: darkMode ? '#121212' : '#F5F5F7',
        text: darkMode ? '#FFFFFF' : '#000000',
        card: darkMode ? '#1E1E1E' : '#FFFFFF',
        border: darkMode ? '#333333' : '#E0E0E0',
        primary: '#6b9080',
        secondary: '#a4c3b2',
        danger: '#FF6B6B',
        success: '#4ECDC4'
    };

    const pickImage = async (source) => {
        try {
            let permissionResult;

            if (source === 'camera') {
                permissionResult = await ImagePicker.requestCameraPermissionsAsync();
            } else {
                permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
            }

            if (permissionResult.granted === false) {
                Alert.alert("Permission Required", "Need camera/gallery access to scan food!");
                return;
            }

            let pickerResult;
            const options = {
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: [1, 1], // Square aspect ratio for model
                quality: 0.8,
            };

            if (source === 'camera') {
                pickerResult = await ImagePicker.launchCameraAsync(options);
            } else {
                pickerResult = await ImagePicker.launchImageLibraryAsync(options);
            }

            if (!pickerResult.canceled) {
                const selectedImage = pickerResult.assets[0].uri;
                setImage(selectedImage);
                handleScan(selectedImage);
            }
        } catch (error) {
            console.error("Error picking image:", error);
            Alert.alert("Error", "Failed to pick image");
        }
    };

    const handleScan = async (imageUri) => {
        setLoading(true);
        setResult(null);

        try {
            const data = await scanFood(imageUri);

            if (data.success && data.result) {
                setResult(data.result);
            } else {
                Alert.alert("Scan Failed", data.error || "Unknown error occurred");
            }
        } catch (error) {
            console.error("Scan Error:", error);
            Alert.alert("Error", "Failed to connect to scanner service.");
        } finally {
            setLoading(false);
        }
    };

    const { user } = useAuth(); // Get current user

    const handleAddToFridge = async () => {
        if (!result || !result.item_name) return;
        if (!user) {
            Alert.alert("Error", "You must be logged in to add items.");
            return;
        }

        try {
            // Add item to Supabase inventory
            // We use the item name from the scan result and pass shelf life for date calculation
            await supabaseDB.addItemToInventory(result.item_name, user.user_id, result.shelf_life);

            Alert.alert(
                "Added to Fridge! 🧊",
                `${result.item_name} has been added to your inventory.`,
                [{ text: "OK", onPress: () => navigation.goBack() }]
            );
        } catch (error) {
            console.error("Failed to add scanned item:", error);
            Alert.alert("Error", "Could not add item to database.");
        }
    };

    const getStatusColor = (status) => {
        if (typeof status === 'string' && status.toLowerCase().includes('fresh')) return theme.success;
        return theme.danger;
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
            <ScrollView contentContainerStyle={styles.scrollContent}>

                <View style={{ flexDirection: 'row', alignItems: 'center', width: '100%', marginBottom: 10 }}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginRight: 0 }}>
                        <Ionicons name="arrow-back" size={24} color={theme.text} />
                    </TouchableOpacity>
                    <Text style={[styles.title, { color: theme.text, flex: 1, textAlign: 'center', marginBottom: 0 }]}>Food Freshness Scanner</Text>
                </View>
                <Text style={[styles.subtitle, { color: theme.text }]}>
                    Identify food and check freshness with AI.
                </Text>

                <View style={[styles.imageContainer, { borderColor: theme.border }]}>
                    {image ? (
                        <Image source={{ uri: image }} style={styles.previewImage} />
                    ) : (
                        <View style={[styles.placeholder, { backgroundColor: theme.card }]}>
                            <Text style={{ color: theme.text, opacity: 0.5 }}>No image selected</Text>
                        </View>
                    )}
                </View>

                <View style={styles.buttonContainer}>
                    <TouchableOpacity
                        style={[styles.button, { backgroundColor: theme.primary }]}
                        onPress={() => pickImage('camera')}
                        disabled={loading}
                    >
                        <Image source={require('../../assets/Take_A_Picture_icon.png')} style={styles.buttonIcon} />
                        <Text style={styles.buttonText}>Take a Picture</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.button, { backgroundColor: theme.secondary }]}
                        onPress={() => pickImage('gallery')}
                        disabled={loading}
                    >
                        <Image source={require('../../assets/upload_image_icon.png')} style={styles.buttonIcon} />
                        <Text style={[styles.buttonText, { color: '#000' }]}>Upload Image</Text>
                    </TouchableOpacity>
                </View>

                {loading && (
                    <View style={styles.resultContainer}>
                        <ActivityIndicator size="large" color={theme.primary} />
                        <Text style={[styles.loadingText, { color: theme.text }]}>Analyzing with DeepSeek AI...</Text>
                    </View>
                )}

                {result && !loading && (
                    <View style={[styles.resultCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
                        <Text style={[styles.resultTitle, { color: theme.text }]}>Scan Result</Text>

                        <View style={styles.resultRow}>
                            <Text style={[styles.resultLabel, { color: theme.text }]}>Item:</Text>
                            <Text style={[styles.resultValue, { color: theme.primary, fontWeight: 'bold' }]}>
                                {result.item_name}
                            </Text>
                        </View>

                        <View style={styles.resultRow}>
                            <Text style={[styles.resultLabel, { color: theme.text }]}>Status:</Text>
                            <Text style={[styles.resultValue, { color: getStatusColor(result.status), fontWeight: 'bold' }]}>
                                {result.status}
                            </Text>
                        </View>

                        {result.shelf_life && (
                            <View style={styles.resultRow}>
                                <Text style={[styles.resultLabel, { color: theme.text }]}>Shelf Life:</Text>
                                <Text style={[styles.resultValue, { color: theme.text }]}>
                                    {result.shelf_life}
                                </Text>
                            </View>
                        )}

                        {/* Add to Fridge Button - Only show if FRESH */}
                        {!result.status.toLowerCase().includes('rotten') && !result.status.toLowerCase().includes('spoiled') && (
                            <TouchableOpacity
                                style={[styles.actionButton, { backgroundColor: theme.primary, marginTop: 15 }]}
                                onPress={handleAddToFridge}
                            >
                                <Ionicons name="add-circle-outline" size={24} color="white" style={{ marginRight: 8 }} />
                                <Text style={styles.buttonText}>Add to Fridge</Text>
                            </TouchableOpacity>
                        )}

                        <View style={styles.divider} />

                        <View style={styles.infoBox}>
                            <Text style={[styles.infoTitle, { color: theme.text, fontWeight: 'bold', marginBottom: 5 }]}>Storage Tips:</Text>
                            <Text style={[styles.infoText, { color: theme.text }]}>
                                {result.storage_tips || (result.status === 'Fresh'
                                    ? "✅ This item appears fresh and safe to eat."
                                    : "⚠️ Warning: This item shows signs of spoilage.")}
                            </Text>
                        </View>
                    </View>
                )}

            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollContent: {
        padding: 20,
        alignItems: 'center',
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        marginBottom: 10,
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 16,
        textAlign: 'center',
        marginBottom: 30,
        opacity: 0.7,
    },
    imageContainer: {
        width: 300,
        height: 300,
        borderRadius: 20,
        borderWidth: 1,
        overflow: 'hidden',
        marginBottom: 30,
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    previewImage: {
        width: '100%',
        height: '100%',
    },
    placeholder: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    buttonContainer: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        width: '100%',
        marginBottom: 20,
    },
    button: {
        flexDirection: 'column',
        paddingVertical: 30,
        paddingHorizontal: 20,
        borderRadius: 25,
        minWidth: 140,
        alignItems: 'center',
        justifyContent: 'center',
        elevation: 2,
    },
    buttonIcon: {
        width: 60,
        height: 60,
        marginBottom: 12,
    },
    buttonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    resultContainer: {
        marginTop: 20,
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 10,
        fontSize: 16,
    },
    resultCard: {
        width: '100%',
        padding: 20,
        borderRadius: 15,
        borderWidth: 1,
        marginTop: 10,
    },
    resultTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        marginBottom: 15,
        textAlign: 'center',
    },
    resultRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start', // Align top if multiline
        marginBottom: 12,
    },
    resultLabel: {
        fontSize: 18,
        opacity: 0.8,
        flex: 0.4, // Fixed width for label
    },
    resultValue: {
        fontSize: 18,
        fontWeight: '500',
        flex: 0.6,
        textAlign: 'right', // Align value to right
        flexWrap: 'wrap',
    },
    divider: {
        height: 1,
        backgroundColor: '#ccc',
        opacity: 0.3,
        marginVertical: 15,
    },
    infoBox: {
        padding: 15, // More padding
        borderRadius: 10,
        backgroundColor: 'rgba(0,0,0,0.05)',
    },
    infoText: {
        textAlign: 'left', // Better for longer text
        fontSize: 15,
        lineHeight: 22, // Better readability
    },
    actionButton: {
        flexDirection: 'row',
        paddingVertical: 15,
        borderRadius: 15,
        alignItems: 'center',
        justifyContent: 'center',
        elevation: 2,
    }
});

export default ScanFoodScreen;
