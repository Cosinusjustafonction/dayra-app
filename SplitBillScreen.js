import React, { useState, useEffect } from 'react';
import {
    StyleSheet,
    Text,
    View,
    ScrollView,
    TouchableOpacity,
    SafeAreaView,
    Image,
    TextInput,
} from 'react-native';
import { ArrowLeft, CheckCircle, Search, Plus, List } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS } from './constants';
import { simulateWalletTransfer, getWalletTransferOTP, confirmWalletTransfer, getCurrentUser, getDemoUsers } from './api';

const TRANSACTIONS = [
    { id: 1, title: 'McDo', amount: 200, date: 'Yesterday' },
    { id: 2, title: 'Uber Trip', amount: 45, date: 'Today' },
    { id: 3, title: 'Cinema', amount: 150, date: 'Last Week' },
];

const FRIENDS = [
    { id: 1, name: 'Mehdi', avatar: 'https://i.pravatar.cc/150?u=mehdi' },
    { id: 2, name: 'Salma', avatar: 'https://i.pravatar.cc/150?u=salma' },
    { id: 3, name: 'Youssef', avatar: 'https://i.pravatar.cc/150?u=youssef' },
    { id: 4, name: 'Hajar', avatar: 'https://i.pravatar.cc/150?u=hajar' },
];

export default function SplitBillScreen({ navigation }) {
    const [selectedTx, setSelectedTx] = useState(null);
    const [selectedFriends, setSelectedFriends] = useState([]);
    const [mode, setMode] = useState('manual'); // 'manual' or 'transaction'
    const [manualTitle, setManualTitle] = useState('');
    const [manualAmount, setManualAmount] = useState('');
    const [friends, setFriends] = useState(FRIENDS);
    const [transactions, setTransactions] = useState(TRANSACTIONS);

    // Fetch friends and transactions from API
    useEffect(() => {
        const fetchData = async () => {
            try {
                // Fetch friends
                const usersResponse = await getDemoUsers();
                if (usersResponse.users && usersResponse.users.length > 0) {
                    const apiFriends = usersResponse.users.map((u, i) => ({
                        id: i + 1,
                        name: u.first_name,
                        phone: u.phone_number,
                        contractId: u.contract_id,
                        avatar: `https://i.pravatar.cc/150?u=${u.first_name?.toLowerCase()}`,
                    }));
                    setFriends(apiFriends);
                }
            } catch (error) {
                console.log('Using mock data for SplitBill');
            }
        };
        fetchData();
    }, []);

    const toggleFriend = (id) => {
        if (selectedFriends.includes(id)) {
            setSelectedFriends(selectedFriends.filter(fid => fid !== id));
        } else {
            setSelectedFriends([...selectedFriends, id]);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <ArrowLeft color={COLORS.text} size={24} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Split Bill 2.0</Text>
                <View style={{ width: 24 }} />
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                <View style={styles.toggleContainer}>
                    <TouchableOpacity
                        style={[styles.toggleBtn, mode === 'manual' && styles.toggleBtnActive]}
                        onPress={() => setMode('manual')}
                    >
                        <Plus size={16} color={mode === 'manual' ? COLORS.white : COLORS.textMuted} />
                        <Text style={[styles.toggleText, mode === 'manual' && styles.toggleTextActive]}>New Expense</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.toggleBtn, mode === 'transaction' && styles.toggleBtnActive]}
                        onPress={() => setMode('transaction')}
                    >
                        <List size={16} color={mode === 'transaction' ? COLORS.white : COLORS.textMuted} />
                        <Text style={[styles.toggleText, mode === 'transaction' && styles.toggleTextActive]}>From History</Text>
                    </TouchableOpacity>
                </View>

                {mode === 'transaction' ? (
                    <>
                        <Text style={styles.sectionTitle}>Select Transaction</Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.txScroll}>
                            {transactions.map((tx) => (
                                <TouchableOpacity
                                    key={tx.id}
                                    style={[styles.txCard, selectedTx === tx.id && styles.activeTxCard]}
                                    onPress={() => setSelectedTx(tx.id)}
                                >
                                    <Text style={styles.txTitle}>{tx.title}</Text>
                                    <Text style={styles.txAmount}>{tx.amount} DH</Text>
                                    <Text style={styles.txDate}>{tx.date}</Text>
                                    {selectedTx === tx.id && (
                                        <View style={styles.checkIcon}>
                                            <CheckCircle size={16} color={COLORS.white} />
                                        </View>
                                    )}
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </>
                ) : (
                    <>
                        <Text style={styles.inputLabel}>Expense Title</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="e.g. Dinner with friends"
                            placeholderTextColor={COLORS.textMuted}
                            value={manualTitle}
                            onChangeText={setManualTitle}
                        />

                        <Text style={styles.inputLabel}>Amount (DH)</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="0.00"
                            placeholderTextColor={COLORS.textMuted}
                            keyboardType="numeric"
                            value={manualAmount}
                            onChangeText={setManualAmount}
                        />
                    </>
                )}

                <Text style={styles.sectionTitle}>Select Friends</Text>
                <View style={styles.friendsGrid}>
                    {friends.map((friend) => (
                        <TouchableOpacity
                            key={friend.id}
                            style={[styles.friendCard, selectedFriends.includes(friend.id) && styles.activeFriendCard]}
                            onPress={() => toggleFriend(friend.id)}
                        >
                            <Image source={{ uri: friend.avatar }} style={styles.avatar} />
                            <Text style={styles.friendName}>{friend.name}</Text>
                            {selectedFriends.includes(friend.id) && (
                                <View style={styles.friendCheck}>
                                    <CheckCircle size={14} color={COLORS.white} />
                                </View>
                            )}
                        </TouchableOpacity>
                    ))}
                </View>
            </ScrollView>

            <View style={styles.footer}>
                <TouchableOpacity
                    style={[
                        styles.splitBtn,
                        ((mode === 'transaction' && !selectedTx) || (mode === 'manual' && (!manualTitle || !manualAmount)) || selectedFriends.length === 0) && styles.disabledBtn
                    ]}
                    disabled={(mode === 'transaction' && !selectedTx) || (mode === 'manual' && (!manualTitle || !manualAmount)) || selectedFriends.length === 0}
                >
                    <LinearGradient
                        colors={((mode === 'transaction' && !selectedTx) || (mode === 'manual' && (!manualTitle || !manualAmount)) || selectedFriends.length === 0) ? ['#475569', '#475569'] : [COLORS.primary, '#FF8C42']}
                        style={styles.splitGradient}
                    >
                        <Text style={styles.splitText}>Send Request</Text>
                    </LinearGradient>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 16,
    },
    backBtn: {
        padding: 8,
        borderRadius: 12,
        backgroundColor: COLORS.cardBg,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: COLORS.text,
    },
    content: {
        padding: 20,
    },
    toggleContainer: {
        flexDirection: 'row',
        backgroundColor: COLORS.cardBg,
        borderRadius: 12,
        padding: 4,
        marginBottom: 24,
    },
    toggleBtn: {
        flex: 1,
        flexDirection: 'row',
        paddingVertical: 12,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 8,
    },
    toggleBtnActive: {
        backgroundColor: 'rgba(255,255,255,0.1)',
    },
    toggleText: {
        color: COLORS.textMuted,
        fontWeight: '600',
        marginLeft: 8,
    },
    toggleTextActive: {
        color: COLORS.white,
    },
    inputLabel: {
        color: COLORS.textMuted,
        fontSize: 14,
        marginBottom: 8,
        fontWeight: '600',
    },
    input: {
        backgroundColor: COLORS.cardBg,
        borderRadius: 16,
        padding: 16,
        color: COLORS.white,
        marginBottom: 24,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: COLORS.textMuted,
        marginBottom: 16,
        marginTop: 8,
    },
    txScroll: {
        marginBottom: 32,
    },
    txCard: {
        backgroundColor: COLORS.cardBg,
        padding: 16,
        borderRadius: 16,
        marginRight: 12,
        width: 120,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
    },
    activeTxCard: {
        borderColor: COLORS.primary,
        backgroundColor: 'rgba(243, 112, 33, 0.1)',
    },
    txTitle: {
        color: COLORS.text,
        fontWeight: '600',
        marginBottom: 4,
    },
    txAmount: {
        color: COLORS.white,
        fontWeight: '700',
        fontSize: 18,
        marginBottom: 4,
    },
    txDate: {
        color: COLORS.textMuted,
        fontSize: 12,
    },
    checkIcon: {
        position: 'absolute',
        top: 8,
        right: 8,
    },
    friendsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
    },
    friendCard: {
        width: '30%',
        backgroundColor: COLORS.cardBg,
        padding: 12,
        borderRadius: 16,
        alignItems: 'center',
        marginBottom: 16,
        marginRight: '3%',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
    },
    activeFriendCard: {
        borderColor: COLORS.primary,
        backgroundColor: 'rgba(243, 112, 33, 0.1)',
    },
    avatar: {
        width: 48,
        height: 48,
        borderRadius: 24,
        marginBottom: 8,
    },
    friendName: {
        color: COLORS.text,
        fontSize: 12,
        fontWeight: '500',
    },
    friendCheck: {
        position: 'absolute',
        top: 8,
        right: 8,
        backgroundColor: COLORS.primary,
        borderRadius: 10,
    },
    footer: {
        padding: 20,
    },
    splitBtn: {
        borderRadius: 24,
        overflow: 'hidden',
    },
    disabledBtn: {
        opacity: 0.5,
    },
    splitGradient: {
        paddingVertical: 18,
        alignItems: 'center',
    },
    splitText: {
        color: COLORS.white,
        fontWeight: '700',
        fontSize: 16,
    },
});
