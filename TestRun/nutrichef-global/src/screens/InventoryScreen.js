import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity, Modal, TextInput, Alert, KeyboardAvoidingView, Platform, StatusBar } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import supabase, { supabaseDB } from '../services/supabase';
import moment from 'moment';
import { Swipeable } from 'react-native-gesture-handler';
import { useSettings } from '../context/SettingsContext';
import { getTheme } from '../theme';

import { useAuth } from '../context/AuthContext';

export default function InventoryScreen({ navigation }) {
    const { darkMode } = useSettings();
    const { user } = useAuth(); // Custom Auth
    const theme = getTheme(darkMode);

    const [loading, setLoading] = useState(true);
    const [items, setItems] = useState([]);

    // Modal State regarding Add/Edit
    const [modalVisible, setModalVisible] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false); // false = Add, true = Edit
    const [selectedItem, setSelectedItem] = useState(null);

    // Form Form State
    const [name, setName] = useState('');
    const [qty, setQty] = useState('');

    // Split Date State
    const [expDay, setExpDay] = useState('');
    const [expMonth, setExpMonth] = useState('');
    const [expYear, setExpYear] = useState('');

    useEffect(() => {
        if (user) {
            loadInventory();
        } else {
            setLoading(false);
        }
    }, [user]);

    const loadInventory = async () => {
        try {
            // Use custom auth user ID
            const userId = user?.user_id;

            if (!userId) {
                console.error("No user logged in");
                return;
            }
            console.log("Fetching inventory for:", userId);

            // FETCHING FROM SUPABASE
            const { data, error } = await supabaseDB.getUserInventory(userId);

            if (error) {
                console.error('Supabase error:', error);
                return;
            }

            if (data) {
                setItems(data);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleAddItem = () => {
        setIsEditMode(false);
        setSelectedItem(null);
        setName('');
        setName('');
        // setQty(''); -> Quantity Hidden

        // Default 1 week from now
        const nextWeek = moment().add(7, 'days');
        setExpDay(nextWeek.format('DD'));
        setExpMonth(nextWeek.format('MM'));
        setExpYear(nextWeek.format('YYYY'));

        setModalVisible(true);
    };

    const handleEditItem = (item) => {
        setIsEditMode(true);
        setSelectedItem(item);
        setName(item.ingredient_name);
        setName(item.ingredient_name);
        // setQty(item.quantity_grams?.toString() || ''); -> Quantity Hidden

        // Split date
        const mDate = moment(item.expiration_date);
        setExpDay(mDate.format('DD'));
        setExpMonth(mDate.format('MM'));
        setExpYear(mDate.format('YYYY'));

        setModalVisible(true);
    };

    const handleDeleteItem = async (id) => {
        Alert.alert(
            "Delete Item",
            "Are you sure you want to remove this item?",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Delete",
                    style: "destructive",
                    onPress: async () => {
                        const { error } = await supabaseDB.deleteUserInventory(id);
                        if (!error) loadInventory();
                        else Alert.alert("Error", "Could not delete item");
                    }
                }
            ]
        );
    };

    const handleSave = async () => {
        // Basic validation
        if (!name || !expDay || !expMonth || !expYear) {
            Alert.alert("Error", "Please fill all fields");
            return;
        }

        // Construct Date String
        const dateStr = `${expYear}-${expMonth}-${expDay}`;
        if (!moment(dateStr, 'YYYY-MM-DD', true).isValid()) {
            Alert.alert("Error", "Invalid Date. Please use YYYY-MM-DD format.");
            return;
        }

        // DUPLICATE CHECK
        const normalizedName = name.trim().toLowerCase();

        // Filter out the current item if we are in edit mode
        const existingItem = items.find(item => {
            if (isEditMode && selectedItem && item.inventory_id === selectedItem.inventory_id) {
                return false;
            }
            return item.ingredient_name.trim().toLowerCase() === normalizedName;
        });

        if (existingItem) {
            Alert.alert("Duplicate Item", `"${name}" is already in your fridge. Please edit the existing item instead.`);
            return;
        }

        try {
            // Dynamic User ID
            const userId = user?.user_id;

            if (!userId) {
                Alert.alert("Error", "No user logged in");
                return;
            }

            const payload = {
                ingredient_name: name.trim(), // Best practice to trim whitespace
                quantity_grams: 1, // Default to 1 implicitly
                expiration_date: dateStr,
                user_id: userId
            };

            let error;
            if (isEditMode && selectedItem) {
                const res = await supabaseDB.updateUserInventory(selectedItem.inventory_id, payload);
                error = res.error;
            } else {
                const res = await supabaseDB.addUserInventory(payload);
                error = res.error;
            }

            if (error) throw error;

            Alert.alert("Success", isEditMode ? "Item updated!" : "Item added!");
            setModalVisible(false);
            loadInventory();
        } catch (error) {
            Alert.alert("Error", "Failed to save item: " + error.message);
        }
    };

    const renderRightActions = (progress, dragX, item) => {
        return (
            <TouchableOpacity
                style={styles.deleteAction}
                onPress={() => handleDeleteItem(item.inventory_id)}
            >
                <Text style={styles.deleteActionText}>Delete</Text>
            </TouchableOpacity>
        );
    };

    const renderItem = ({ item }) => {
        const daysLeft = moment(item.expiration_date).diff(moment(), 'days');
        // Logic: Expired (< 0) -> Light Grey, Expiring Soon (< 3) -> Red, Fresh -> Green
        const statusColor = daysLeft < 0 ? '#e2e8f07a' : (daysLeft < 3 ? '#FEB2B2' : '#C6F6D5');

        return (
            <Swipeable renderRightActions={(p, d) => renderRightActions(p, d, item)}>
                <TouchableOpacity
                    activeOpacity={0.7}
                    onPress={() => handleEditItem(item)}
                >
                    <View style={[styles.item, { backgroundColor: statusColor }]}>
                        <View>
                            <Text style={styles.itemName}>{item.ingredient_name}</Text>
                            {/* <Text style={styles.itemQty}>{item.quantity_grams}g</Text> Hidden Qty */}
                        </View>
                        <View>
                            <Text style={styles.expiryText}>Exp: {moment(item.expiration_date).format('MMM DD')}</Text>
                            <Text style={styles.daysText}>{daysLeft} days left</Text>
                        </View>
                    </View>
                </TouchableOpacity>
            </Swipeable>
        );
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
            <StatusBar barStyle={theme.statusBarStyle} />
            <View style={styles.header}>
                <View style={{ flexDirection: 'row', alignItems: 'center', width: '100%', justifyContent: 'center', position: 'relative' }}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                        <Ionicons name="arrow-back" size={24} color={theme.text} />
                    </TouchableOpacity>
                    <Text style={[styles.headerTitle, { color: theme.text, textAlign: 'center' }]}>My Fridge ❄️</Text>
                </View>
                {/* Header Add Button if preferred (optional) */}
            </View>

            {loading ? (
                <ActivityIndicator size="large" />
            ) : (
                <FlatList
                    data={items}
                    renderItem={renderItem}
                    keyExtractor={item => item.inventory_id.toString()}
                    contentContainerStyle={styles.list}
                    showsVerticalScrollIndicator={false} // Hide scrollbar to prevent overlap
                    ListEmptyComponent={<Text style={{ textAlign: 'center', marginTop: 20, color: theme.textSecondary }}>No items found. Add some!</Text>}
                />
            )}

            {/* FAB - Add Button */}
            <TouchableOpacity
                style={styles.fab}
                onPress={handleAddItem}
            >
                <Text style={styles.fabText}>+</Text>
            </TouchableOpacity>

            {/* Edit/Add Modal */}
            <Modal
                animationType="slide"
                transparent={true}
                visible={modalVisible}
                onRequestClose={() => setModalVisible(false)}
            >
                <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={[styles.modalCenteredView, { backgroundColor: 'rgba(0,0,0,0.5)' }]}>
                    <View style={[styles.modalView, { backgroundColor: theme.background }]}>
                        <Text style={[styles.modalTitle, { color: theme.text }]}>{isEditMode ? "Edit Ingredient" : "Add New Ingredient"}</Text>

                        <Text style={[styles.label, { color: theme.text }]}>Name</Text>
                        <TextInput
                            style={[styles.input, { backgroundColor: theme.inputBackground, borderColor: theme.border, color: theme.text }]}
                            value={name}
                            onChangeText={setName}
                            placeholder="e.g. Milk"
                            placeholderTextColor={theme.textTertiary}
                        />

                        {/* Quantity Input Hidden 
                        <Text style={[styles.label, { color: theme.text }]}>Quantity (g)</Text>
                        <TextInput
                            style={[styles.input, { backgroundColor: theme.inputBackground, borderColor: theme.border, color: theme.text }]}
                            value={qty}
                            onChangeText={setQty}
                            keyboardType="numeric"
                            placeholder="e.g. 1000"
                            placeholderTextColor={theme.textTertiary}
                        />
                        */}

                        <Text style={[styles.label, { color: theme.text }]}>Expiration Date</Text>
                        <View style={styles.dateInputContainer}>
                            <View style={styles.dateInputWrapper}>
                                <Text style={[styles.dateLabel, { color: theme.textSecondary }]}>DD</Text>
                                <TextInput
                                    style={[styles.dateInput, { backgroundColor: theme.inputBackground, borderColor: theme.border, color: theme.text }]}
                                    value={expDay}
                                    onChangeText={setExpDay}
                                    placeholder="DD"
                                    placeholderTextColor={theme.textTertiary}
                                    keyboardType="numeric"
                                    maxLength={2}
                                />
                            </View>
                            <View style={styles.dateInputWrapper}>
                                <Text style={[styles.dateLabel, { color: theme.textSecondary }]}>MM</Text>
                                <TextInput
                                    style={[styles.dateInput, { backgroundColor: theme.inputBackground, borderColor: theme.border, color: theme.text }]}
                                    value={expMonth}
                                    onChangeText={setExpMonth}
                                    placeholder="MM"
                                    placeholderTextColor={theme.textTertiary}
                                    keyboardType="numeric"
                                    maxLength={2}
                                />
                            </View>
                            <View style={[styles.dateInputWrapper, { flex: 1.5 }]}>
                                <Text style={[styles.dateLabel, { color: theme.textSecondary }]}>YYYY</Text>
                                <TextInput
                                    style={[styles.dateInput, { backgroundColor: theme.inputBackground, borderColor: theme.border, color: theme.text }]}
                                    value={expYear}
                                    onChangeText={setExpYear}
                                    placeholder="YYYY"
                                    placeholderTextColor={theme.textTertiary}
                                    keyboardType="numeric"
                                    maxLength={4}
                                />
                            </View>
                        </View>

                        <View style={styles.modalButtons}>
                            <TouchableOpacity
                                style={[styles.button, styles.buttonClose]}
                                onPress={() => setModalVisible(false)}
                            >
                                <Text style={styles.textStyle}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.button, styles.buttonSave]}
                                onPress={handleSave}
                            >
                                <Text style={styles.textStyle}>Save</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </KeyboardAvoidingView>
            </Modal>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
        padding: 20,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
        position: 'relative',
        minHeight: 40,
    },
    backButton: {
        position: 'absolute',
        left: 0,
        padding: 10,
        zIndex: 10,
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: 'bold',
    },
    list: {
        paddingBottom: 80, // Space for FAB
    },
    item: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        padding: 15,
        borderRadius: 10,
        marginBottom: 10,
    },
    itemName: {
        fontSize: 18,
        fontWeight: '600',
    },
    itemQty: {
        color: '#666',
    },
    expiryText: {
        textAlign: 'right',
        fontWeight: 'bold',
    },
    daysText: {
        textAlign: 'right',
        fontSize: 12,
    },
    // Swipe Action
    deleteAction: {
        backgroundColor: '#E53E3E',
        justifyContent: 'center',
        alignItems: 'center',
        width: 80,
        height: '87%',
        borderRadius: 10,
        marginBottom: 10,
        marginLeft: 10, // Margin to separate from item
    },
    deleteActionText: {
        color: 'white',
        fontWeight: 'bold',
    },
    // FAB
    fab: {
        position: 'absolute',
        width: 60,
        height: 60,
        alignItems: 'center',
        justifyContent: 'center',
        right: 20,
        bottom: 30,
        borderRadius: 30,
        backgroundColor: '#4299E1',
        elevation: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
    },
    fabText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 30,
        marginTop: -3,
    },
    // Modal Styles
    modalCenteredView: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.5)',
    },
    modalView: {
        width: '90%',
        margin: 20,
        backgroundColor: 'white',
        borderRadius: 20,
        padding: 35,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 5,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 15,
        textAlign: 'center',
    },
    input: {
        height: 40,
        margin: 12,
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 5,
        padding: 10,
        width: '100%',
    },
    label: {
        fontWeight: '600',
        marginLeft: 12,
        marginTop: 5,
    },
    // Date Inputs
    dateInputContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginHorizontal: 12,
        marginTop: 5,
        marginBottom: 10,
    },
    dateInputWrapper: {
        flex: 1,
        marginRight: 5,
    },
    dateLabel: {
        fontSize: 12,
        color: '#666',
        marginBottom: 2,
        marginLeft: 2,
    },
    dateInput: {
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 5,
        padding: 10,
        textAlign: 'center',
    },
    modalButtons: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 20,
        width: '100%',
    },
    button: {
        borderRadius: 10,
        padding: 10,
        elevation: 2,
        width: '45%',
    },
    buttonClose: {
        backgroundColor: '#718096',
    },
    buttonSave: {
        backgroundColor: '#48BB78',
    },
    textStyle: {
        color: 'white',
        fontWeight: 'bold',
        textAlign: 'center',
    },
});
