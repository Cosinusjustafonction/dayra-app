import React, { useState, useEffect } from 'react';
import {
    StyleSheet,
    Text,
    View,
    ScrollView,
    TouchableOpacity,
    SafeAreaView,
    Dimensions,
    FlatList,
    Image,
    Modal,
    TextInput,
    Switch,
} from 'react-native';
import { ArrowLeft, Wallet, History, TrendingUp, TrendingDown, Users, Plus, DollarSign, Share2, Check, X, Split } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS } from './constants';
import { getWalletBalance, getTransactionHistory, getCurrentUser, simulateWalletTransfer, getWalletTransferOTP, confirmWalletTransfer } from './api';



const { width } = Dimensions.get('window');

// Mock Data
const TRANSACTIONS = [
    { id: 1, title: 'PlayStation Store', amount: -250, date: 'Today, 10:30 AM', type: 'expense', category: 'Gaming' },
    { id: 2, title: 'Allowance Received', amount: +200, date: 'Yesterday', type: 'income', category: 'Allowance' },
    { id: 3, title: 'McDonalds', amount: -85, date: 'Oct 24', type: 'expense', category: 'Food' },
];

const SHARED_EXPENSES = [
    { id: 1, title: 'Hotel Booking', amount: 1200, paidBy: 'Amine', date: 'Oct 20' },
    { id: 2, title: 'Dinner', amount: 450, paidBy: 'Sarah', date: 'Oct 21' },
];

export default function WalletDetailsScreen({ route, navigation }) {
    const { wallet } = route.params;
    const [splitModalVisible, setSplitModalVisible] = useState(false);
    const [splitTitle, setSplitTitle] = useState('');
    const [splitAmount, setSplitAmount] = useState('');
    const [splitType, setSplitType] = useState('equal'); // 'equal' or 'fixed'
    const [selectedMembers, setSelectedMembers] = useState(wallet.members || []);

    const handleSplitBill = () => {
        if (!splitAmount || !splitTitle) return;
        const amount = parseFloat(splitAmount);
        const count = selectedMembers.length + 1; // +1 for self
        const share = (amount / count).toFixed(2);

        alert(`Split Request Sent for "${splitTitle}"!\nEach person owes: ${share} DH`);
        setSplitModalVisible(false);
        setSplitAmount('');
        setSplitTitle('');
    };

    const renderHeader = () => (
        <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                <ArrowLeft color={COLORS.white} size={24} />
            </TouchableOpacity>
            <View style={styles.headerTitleContainer}>
                <Text style={styles.headerTitle}>{wallet.title}</Text>
                <Text style={styles.headerSubtitle}>{wallet.type === 'child' ? 'Child Wallet' : (wallet.type === 'shared' ? 'Shared Wallet' : 'Savings Goal')}</Text>
            </View>
            <View style={{ width: 40 }} />
        </View>
    );

    const renderBalanceCard = () => (
        <View style={styles.balanceCard}>
            <LinearGradient
                colors={[wallet.color, '#1E293B']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.balanceGradient}
            >
                <Text style={styles.balanceLabel}>Current Balance</Text>
                <Text style={styles.balanceAmount}>{wallet.amount} DH</Text>
                {wallet.type === 'child' && (
                    <View style={styles.limitBadge}>
                        <Text style={styles.limitText}>Monthly Limit: {wallet.limit} DH</Text>
                    </View>
                )}
            </LinearGradient>
        </View>
    );

    const renderChildView = () => (
        <View style={styles.section}>
            <Text style={styles.sectionTitle}>Recent Activity</Text>
            {TRANSACTIONS.map((tx) => (
                <View key={tx.id} style={styles.txItem}>
                    <View style={[styles.txIcon, { backgroundColor: tx.type === 'income' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)' }]}>
                        {tx.type === 'income' ? <TrendingUp size={20} color={COLORS.success} /> : <TrendingDown size={20} color={COLORS.danger} />}
                    </View>
                    <View style={styles.txInfo}>
                        <Text style={styles.txTitle}>{tx.title}</Text>
                        <Text style={styles.txDate}>{tx.date} • {tx.category}</Text>
                    </View>
                    <Text style={[styles.txAmount, { color: tx.type === 'income' ? COLORS.success : COLORS.white }]}>
                        {tx.type === 'income' ? '+' : ''}{tx.amount} DH
                    </Text>
                </View>
            ))}
        </View>
    );

    const renderSharedView = () => (
        <>
            <View style={styles.section}>
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Members</Text>
                    <TouchableOpacity style={styles.addMemberBtn}>
                        <Plus size={16} color={COLORS.primary} />
                        <Text style={styles.addMemberText}>Add</Text>
                    </TouchableOpacity>
                </View>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.membersList}>
                    {wallet.members?.map((avatar, index) => (
                        <Image key={index} source={{ uri: avatar }} style={styles.memberAvatarLarge} />
                    ))}
                </ScrollView>
            </View>

            <View style={styles.section}>
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Shared Expenses</Text>
                    <TouchableOpacity style={styles.splitBtn} onPress={() => setSplitModalVisible(true)}>
                        <Share2 size={16} color={COLORS.white} />
                        <Text style={styles.splitBtnText}>Split Bill</Text>
                    </TouchableOpacity>
                </View>
                {SHARED_EXPENSES.map((exp) => (
                    <View key={exp.id} style={styles.txItem}>
                        <View style={styles.txIcon}>
                            <DollarSign size={20} color={COLORS.textMuted} />
                        </View>
                        <View style={styles.txInfo}>
                            <Text style={styles.txTitle}>{exp.title}</Text>
                            <Text style={styles.txDate}>Paid by {exp.paidBy} • {exp.date}</Text>
                        </View>
                        <Text style={styles.txAmount}>{exp.amount} DH</Text>
                    </View>
                ))}
            </View>
        </>
    );

    return (
        <SafeAreaView style={styles.container}>
            {renderHeader()}
            <ScrollView contentContainerStyle={styles.content}>
                {renderBalanceCard()}
                {wallet.type === 'child' ? renderChildView() : (wallet.type === 'shared' ? renderSharedView() : null)}
            </ScrollView>

            {/* Split Bill Modal */}
            <Modal
                animationType="slide"
                transparent={true}
                visible={splitModalVisible}
                onRequestClose={() => setSplitModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalView}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Split Bill</Text>
                            <TouchableOpacity onPress={() => setSplitModalVisible(false)}>
                                <X color={COLORS.textMuted} size={24} />
                            </TouchableOpacity>
                        </View>

                        <Text style={styles.inputLabel}>Expense Title</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="e.g. Hotel Booking"
                            placeholderTextColor={COLORS.textMuted}
                            value={splitTitle}
                            onChangeText={setSplitTitle}
                        />

                        <Text style={styles.inputLabel}>Total Amount (DH)</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="0.00"
                            placeholderTextColor={COLORS.textMuted}
                            keyboardType="numeric"
                            value={splitAmount}
                            onChangeText={setSplitAmount}
                        />

                        <Text style={styles.inputLabel}>Split With</Text>
                        <View style={styles.membersSelect}>
                            {wallet.members?.map((avatar, index) => (
                                <View key={index} style={styles.memberSelectOption}>
                                    <Image source={{ uri: avatar }} style={styles.memberAvatarSmall} />
                                    <View style={styles.checkBadge}>
                                        <Check size={10} color={COLORS.white} />
                                    </View>
                                </View>
                            ))}
                        </View>

                        <View style={styles.splitTypeContainer}>
                            <TouchableOpacity
                                style={[styles.splitTypeBtn, splitType === 'equal' && styles.splitTypeBtnActive]}
                                onPress={() => setSplitType('equal')}
                            >
                                <Text style={[styles.splitTypeText, splitType === 'equal' && styles.splitTypeTextActive]}>Equal Split</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.splitTypeBtn, splitType === 'fixed' && styles.splitTypeBtnActive]}
                                onPress={() => setSplitType('fixed')}
                            >
                                <Text style={[styles.splitTypeText, splitType === 'fixed' && styles.splitTypeTextActive]}>Fixed Amount</Text>
                            </TouchableOpacity>
                        </View>

                        <TouchableOpacity style={styles.createBtn} onPress={handleSplitBill}>
                            <LinearGradient
                                colors={[COLORS.primary, '#FF8C42']}
                                style={styles.createGradient}
                            >
                                <Text style={styles.createBtnText}>Send Request</Text>
                            </LinearGradient>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
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
        paddingHorizontal: 24,
        paddingVertical: 16,
    },
    backBtn: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 20,
        backgroundColor: COLORS.cardBg,
    },
    headerTitleContainer: {
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: COLORS.text,
    },
    headerSubtitle: {
        fontSize: 12,
        color: COLORS.textMuted,
    },
    content: {
        padding: 24,
    },
    balanceCard: {
        borderRadius: 24,
        marginBottom: 32,
        overflow: 'hidden',
    },
    balanceGradient: {
        padding: 24,
        alignItems: 'center',
    },
    balanceLabel: {
        color: 'rgba(255,255,255,0.8)',
        fontSize: 14,
        marginBottom: 8,
    },
    balanceAmount: {
        color: COLORS.white,
        fontSize: 36,
        fontWeight: '800',
        marginBottom: 16,
    },
    limitBadge: {
        backgroundColor: 'rgba(255,255,255,0.2)',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
    },
    limitText: {
        color: COLORS.white,
        fontSize: 12,
        fontWeight: '600',
    },
    section: {
        marginBottom: 32,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: COLORS.text,
        marginBottom: 16,
    },
    txItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.cardBg,
        padding: 16,
        borderRadius: 16,
        marginBottom: 12,
    },
    txIcon: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: 'rgba(255,255,255,0.05)',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    txInfo: {
        flex: 1,
    },
    txTitle: {
        color: COLORS.text,
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 4,
    },
    txDate: {
        color: COLORS.textMuted,
        fontSize: 12,
    },
    txAmount: {
        color: COLORS.white,
        fontSize: 16,
        fontWeight: '700',
    },
    addMemberBtn: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    addMemberText: {
        color: COLORS.primary,
        fontWeight: '600',
        marginLeft: 4,
    },
    membersList: {
        flexDirection: 'row',
    },
    memberAvatarLarge: {
        width: 48,
        height: 48,
        borderRadius: 24,
        marginRight: 12,
        borderWidth: 2,
        borderColor: COLORS.cardBg,
    },
    splitBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.primary,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 8,
    },
    splitBtnText: {
        color: COLORS.white,
        fontWeight: '600',
        fontSize: 12,
        marginLeft: 6,
    },
    // Modal
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.8)',
        justifyContent: 'flex-end',
    },
    modalView: {
        backgroundColor: COLORS.cardBg,
        borderTopLeftRadius: 32,
        borderTopRightRadius: 32,
        padding: 24,
        minHeight: 500,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 24,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: COLORS.text,
    },
    inputLabel: {
        color: COLORS.textMuted,
        fontSize: 14,
        marginBottom: 8,
        fontWeight: '600',
    },
    input: {
        backgroundColor: COLORS.background,
        borderRadius: 16,
        padding: 16,
        color: COLORS.white,
        marginBottom: 24,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    membersSelect: {
        flexDirection: 'row',
        marginBottom: 24,
    },
    memberSelectOption: {
        marginRight: 16,
        position: 'relative',
    },
    memberAvatarSmall: {
        width: 40,
        height: 40,
        borderRadius: 20,
    },
    checkBadge: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        backgroundColor: COLORS.success,
        width: 16,
        height: 16,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: COLORS.cardBg,
    },
    splitTypeContainer: {
        flexDirection: 'row',
        backgroundColor: COLORS.background,
        borderRadius: 12,
        padding: 4,
        marginBottom: 24,
    },
    splitTypeBtn: {
        flex: 1,
        paddingVertical: 12,
        alignItems: 'center',
        borderRadius: 8,
    },
    splitTypeBtnActive: {
        backgroundColor: COLORS.cardBg,
    },
    splitTypeText: {
        color: COLORS.textMuted,
        fontWeight: '600',
    },
    splitTypeTextActive: {
        color: COLORS.white,
    },
    createBtn: {
        marginTop: 8,
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
    },
    createGradient: {
        paddingVertical: 18,
        borderRadius: 24,
        alignItems: 'center',
    },
    createBtnText: {
        color: COLORS.white,
        fontSize: 16,
        fontWeight: '700',
    },
});
