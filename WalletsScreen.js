import React, { useState, useEffect } from 'react';
import {
    StyleSheet,
    Text,
    View,
    ScrollView,
    TouchableOpacity,
    SafeAreaView,
    Dimensions,
    Modal,
    TextInput,
    Switch,
    Image,
} from 'react-native';
import { Plus, Plane, Gamepad2, Users, Wallet, Target, X, Settings, Percent, DollarSign, Check, Bell, BellOff, Trash2, CreditCard, Baby, Shield, Share2 } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS } from './constants';
import { getWalletBalance, getTransactionHistory, getCurrentUser, getDemoUsers } from './api';


const INITIAL_POCKETS = [
    {
        id: 1,
        title: 'Voyage',
        amount: 450,
        target: 2000,
        icon: Plane,
        color: '#38B2AC',
        rule: 'Arrondi + 3DH',
        date: 'July 2026',
    },
    {
        id: 2,
        title: 'PS5 Pro',
        amount: 1200,
        target: 8000,
        icon: Gamepad2,
        color: '#8B5CF6',
        rule: 'Gig Tax 20%',
        date: 'Dec 2025',
    },
    {
        id: 3,
        title: 'Loyer',
        amount: 1500,
        target: 1500,
        icon: Users,
        color: '#F37021',
        rule: 'Locked',
        rule: 'Locked',
        date: 'Monthly',
        type: 'goal',
    },
    {
        id: 4,
        title: 'Adam\'s Wallet',
        amount: 150,
        target: 500, // Monthly Limit
        icon: Baby,
        color: '#3B82F6',
        rule: 'Allowance: 200DH',
        date: 'Weekly',
        type: 'child',
        allowance: 200,
        limit: 500,
    },
    {
        id: 5,
        title: 'Summer Trip',
        amount: 3200,
        target: 10000,
        icon: Share2,
        color: '#10B981',
        rule: 'Shared with 3',
        date: 'Aug 2026',
        type: 'shared',
        members: [
            'https://i.pravatar.cc/150?u=amine',
            'https://i.pravatar.cc/150?u=sarah',
            'https://i.pravatar.cc/150?u=karim',
        ],
    },

];

const SUBSCRIPTIONS = [
    { id: 1, name: 'Netflix Premium', amount: 120, date: 'Dec 15', icon: 'https://upload.wikimedia.org/wikipedia/commons/0/08/Netflix_2015_logo.svg', notify: true },
    { id: 2, name: 'Spotify Duo', amount: 70, date: 'Dec 20', icon: 'https://upload.wikimedia.org/wikipedia/commons/1/19/Spotify_logo_without_text.svg', notify: false },
    { id: 3, name: 'iCloud+', amount: 30, date: 'Dec 28', icon: 'https://upload.wikimedia.org/wikipedia/commons/1/1c/ICloud_logo.svg', notify: true },
    { id: 4, name: 'ChatGPT Plus', amount: 220, date: 'Jan 02', icon: 'https://upload.wikimedia.org/wikipedia/commons/0/04/ChatGPT_logo.svg', notify: true },
];

const { width } = Dimensions.get('window');

export default function WalletsScreen({ navigation }) {
    const [activeTab, setActiveTab] = useState('goals'); // 'goals' or 'subscriptions'
    const [pockets, setPockets] = useState(INITIAL_POCKETS);
    const [subscriptions, setSubscriptions] = useState(SUBSCRIPTIONS);
    const [modalVisible, setModalVisible] = useState(false);
    const [rulesModalVisible, setRulesModalVisible] = useState(false);

    // New Pocket State
    const [newPocketName, setNewPocketName] = useState('');
    const [newPocketTarget, setNewPocketTarget] = useState('');
    const [newPocketType, setNewPocketType] = useState('goal'); // 'goal', 'child', 'shared'

    // Rules State
    const [allocationType, setAllocationType] = useState('percent'); // 'percent' or 'fixed'
    const [allocationValue, setAllocationValue] = useState('');
    const [selectedWalletId, setSelectedWalletId] = useState(null);

    const handleCreatePocket = () => {
        if (newPocketName && newPocketTarget) {
            const newPocket = {
                id: pockets.length + 1,
                title: newPocketName,
                amount: 0,
                target: parseInt(newPocketTarget),
                amount: 0,
                target: parseInt(newPocketTarget),
                icon: newPocketType === 'child' ? Baby : (newPocketType === 'shared' ? Share2 : Target),
                color: newPocketType === 'child' ? '#3B82F6' : (newPocketType === 'shared' ? '#10B981' : '#EC4899'),
                rule: newPocketType === 'child' ? 'Allowance: 0DH' : 'Manual',
                date: 'TBD',
                type: newPocketType,
                allowance: newPocketType === 'child' ? 0 : undefined,
                limit: newPocketType === 'child' ? parseInt(newPocketTarget) : undefined,
                members: newPocketType === 'shared' ? [] : undefined,
            };
            setPockets([...pockets, newPocket]);
            setModalVisible(false);
            setNewPocketName('');
            setNewPocketTarget('');
        }
    };

    const handleSaveRule = () => {
        if (!selectedWalletId) {
            alert('Please select a wallet to allocate funds to.');
            return;
        }
        const wallet = pockets.find(p => p.id === selectedWalletId);
        setRulesModalVisible(false);
        // In a real app, this would save the automation rule to the backend
        alert(`Rule Saved: Allocate ${allocationValue}${allocationType === 'percent' ? '%' : ' DH'} to "${wallet.title}" on Payday.`);
    };

    const toggleSubscriptionNotify = (id) => {
        setSubscriptions(subscriptions.map(sub =>
            sub.id === id ? { ...sub, notify: !sub.notify } : sub
        ));
    };

    const stopSubscription = (id) => {
        const sub = subscriptions.find(s => s.id === id);
        alert(`Subscription for ${sub.name} has been stopped.`);
        setSubscriptions(subscriptions.filter(s => s.id !== id));
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>My Wallets</Text>
                <View style={{ flexDirection: 'row' }}>
                    <TouchableOpacity style={[styles.iconBtn, { marginRight: 12 }]} onPress={() => setRulesModalVisible(true)}>
                        <Settings color={COLORS.textMuted} size={24} />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.addBtn} onPress={() => setModalVisible(true)}>
                        <Plus color={COLORS.white} size={24} />
                    </TouchableOpacity>
                </View>
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                <View style={styles.summaryCard}>
                    <LinearGradient
                        colors={[COLORS.primary, '#FF8C42']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.summaryGradient}
                    >
                        <View style={styles.summaryRow}>
                            <View>
                                <Text style={styles.summaryLabel}>Total Savings</Text>
                                <Text style={styles.summaryAmount}>
                                    {pockets.reduce((acc, curr) => acc + curr.amount, 0).toLocaleString()} DH
                                </Text>
                            </View>
                            <View style={styles.summaryIcon}>
                                <Wallet color={COLORS.white} size={24} />
                            </View>
                        </View>
                    </LinearGradient>
                </View>



                {/* Tabs */}
                <View style={styles.tabContainer}>
                    <TouchableOpacity
                        style={[styles.tabBtn, activeTab === 'goals' && styles.tabBtnActive]}
                        onPress={() => setActiveTab('goals')}
                    >
                        <Target size={16} color={activeTab === 'goals' ? COLORS.white : COLORS.textMuted} />
                        <Text style={[styles.tabText, activeTab === 'goals' && styles.tabTextActive]}>Goals</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.tabBtn, activeTab === 'subscriptions' && styles.tabBtnActive]}
                        onPress={() => setActiveTab('subscriptions')}
                    >
                        <CreditCard size={16} color={activeTab === 'subscriptions' ? COLORS.white : COLORS.textMuted} />
                        <Text style={[styles.tabText, activeTab === 'subscriptions' && styles.tabTextActive]}>Subscriptions</Text>
                    </TouchableOpacity>
                </View>

                {activeTab === 'goals' ? (
                    <>
                        <Text style={styles.sectionTitle}>Active Goals</Text>

                        {pockets.map((pocket) => {
                            const Icon = pocket.icon;
                            const progress = (pocket.amount / pocket.target) * 100;

                            return (
                                <TouchableOpacity
                                    key={pocket.id}
                                    activeOpacity={0.9}
                                    onPress={() => navigation.navigate('WalletDetails', { wallet: pocket })}
                                >
                                    <View style={styles.pocketCard}>
                                        <View style={styles.pocketHeader}>
                                            <View style={[styles.iconContainer, { backgroundColor: `${pocket.color}20` }]}>
                                                <Icon color={pocket.color} size={20} />
                                            </View>
                                            <View style={styles.pocketInfo}>
                                                <Text style={styles.pocketTitle}>{pocket.title}</Text>
                                                <Text style={styles.pocketRule}>{pocket.rule} • {pocket.date}</Text>
                                            </View>
                                            <View style={{ alignItems: 'flex-end' }}>
                                                <Text style={styles.pocketAmount}>{pocket.amount} DH</Text>
                                                <Text style={styles.pocketTarget}>
                                                    {pocket.type === 'child' ? `Limit: ${pocket.limit} DH` : `of ${pocket.target} DH`}
                                                </Text>
                                            </View>
                                        </View>

                                        {pocket.type === 'shared' && pocket.members && (
                                            <View style={styles.membersRow}>
                                                {pocket.members.map((avatar, index) => (
                                                    <Image
                                                        key={index}
                                                        source={{ uri: avatar }}
                                                        style={[styles.memberAvatar, { marginLeft: index > 0 ? -10 : 0 }]}
                                                    />
                                                ))}
                                                <TouchableOpacity style={styles.addMemberBtn}>
                                                    <Plus size={12} color={COLORS.textMuted} />
                                                </TouchableOpacity>
                                            </View>
                                        )}

                                        <View style={styles.progressBarBg}>
                                            <LinearGradient
                                                colors={[pocket.color, pocket.color]}
                                                style={[styles.progressBarFill, { width: `${Math.min(progress, 100)}%` }]}
                                            />
                                        </View>

                                        {pocket.type === 'child' && (
                                            <View style={styles.childControls}>
                                                <View style={styles.childBadge}>
                                                    <Shield size={12} color={COLORS.white} />
                                                    <Text style={styles.childBadgeText}>Parental Controls On</Text>
                                                </View>
                                            </View>
                                        )}
                                    </View>
                                </TouchableOpacity>
                            );
                        })}
                    </>
                ) : (
                    <>
                        <Text style={styles.sectionTitle}>Active Subscriptions</Text>

                        {subscriptions.map((sub) => (
                            <View key={sub.id} style={styles.subCard}>
                                <View style={styles.subHeader}>
                                    <View style={styles.subInfo}>
                                        <Text style={styles.subName}>{sub.name}</Text>
                                        <Text style={styles.subDate}>Next payment: {sub.date}</Text>
                                    </View>
                                    <Text style={styles.subAmount}>{sub.amount} DH</Text>
                                </View>

                                <View style={styles.subActions}>
                                    <TouchableOpacity
                                        style={[styles.subActionBtn, sub.notify ? styles.notifyActive : styles.notifyInactive]}
                                        onPress={() => toggleSubscriptionNotify(sub.id)}
                                    >
                                        {sub.notify ? (
                                            <Bell size={16} color={COLORS.secondary} />
                                        ) : (
                                            <BellOff size={16} color={COLORS.textMuted} />
                                        )}
                                        <Text style={[styles.subActionText, sub.notify ? { color: COLORS.secondary } : { color: COLORS.textMuted }]}>
                                            {sub.notify ? 'Notify On' : 'Notify Off'}
                                        </Text>
                                    </TouchableOpacity>

                                    <TouchableOpacity
                                        style={[styles.subActionBtn, styles.stopBtn]}
                                        onPress={() => stopSubscription(sub.id)}
                                    >
                                        <Trash2 size={16} color={COLORS.danger} />
                                        <Text style={[styles.subActionText, { color: COLORS.danger }]}>Stop</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        ))}
                    </>
                )}
            </ScrollView>

            {/* Create Pocket Modal */}
            <Modal
                animationType="slide"
                transparent={true}
                visible={modalVisible}
                onRequestClose={() => setModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalView}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>New Pocket</Text>
                            <TouchableOpacity onPress={() => setModalVisible(false)}>
                                <X color={COLORS.textMuted} size={24} />
                            </TouchableOpacity>
                        </View>

                        <View style={styles.toggleContainer}>
                            <TouchableOpacity
                                style={[styles.toggleBtn, newPocketType === 'goal' && styles.toggleBtnActive]}
                                onPress={() => setNewPocketType('goal')}
                            >
                                <Target size={16} color={newPocketType === 'goal' ? COLORS.white : COLORS.textMuted} />
                                <Text style={[styles.toggleText, newPocketType === 'goal' && styles.toggleTextActive]}>Goal</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.toggleBtn, newPocketType === 'child' && styles.toggleBtnActive]}
                                onPress={() => setNewPocketType('child')}
                            >
                                <Baby size={16} color={newPocketType === 'child' ? COLORS.white : COLORS.textMuted} />
                                <Text style={[styles.toggleText, newPocketType === 'child' && styles.toggleTextActive]}>Child</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.toggleBtn, newPocketType === 'shared' && styles.toggleBtnActive]}
                                onPress={() => setNewPocketType('shared')}
                            >
                                <Share2 size={16} color={newPocketType === 'shared' ? COLORS.white : COLORS.textMuted} />
                                <Text style={[styles.toggleText, newPocketType === 'shared' && styles.toggleTextActive]}>Shared</Text>
                            </TouchableOpacity>
                        </View>

                        <Text style={styles.inputLabel}>
                            {newPocketType === 'child' ? 'Child Name' : (newPocketType === 'shared' ? 'Group Name' : 'Goal Name')}
                        </Text>
                        <TextInput
                            style={styles.input}
                            placeholder="e.g. New Laptop"
                            placeholderTextColor={COLORS.textMuted}
                            value={newPocketName}
                            onChangeText={setNewPocketName}
                        />

                        <Text style={styles.inputLabel}>
                            {newPocketType === 'child' ? 'Monthly Spending Limit (DH)' : 'Target Amount (DH)'}
                        </Text>
                        <TextInput
                            style={styles.input}
                            placeholder="e.g. 5000"
                            placeholderTextColor={COLORS.textMuted}
                            keyboardType="numeric"
                            value={newPocketTarget}
                            onChangeText={setNewPocketTarget}
                        />

                        <TouchableOpacity style={styles.createBtn} onPress={handleCreatePocket}>
                            <LinearGradient
                                colors={[COLORS.primary, '#FF8C42']}
                                style={styles.createGradient}
                            >
                                <Text style={styles.createBtnText}>
                                    {newPocketType === 'child' ? 'Create Child Wallet' : (newPocketType === 'shared' ? 'Create Shared Wallet' : 'Create Goal')}
                                </Text>
                            </LinearGradient>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            {/* Payday Rules Modal */}
            <Modal
                animationType="slide"
                transparent={true}
                visible={rulesModalVisible}
                onRequestClose={() => setRulesModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalView}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Payday Rules</Text>
                            <TouchableOpacity onPress={() => setRulesModalVisible(false)}>
                                <X color={COLORS.textMuted} size={24} />
                            </TouchableOpacity>
                        </View>

                        <Text style={styles.modalSubtitle}>Automatically allocate money when you receive your paycheck.</Text>

                        <View style={styles.toggleContainer}>
                            <TouchableOpacity
                                style={[styles.toggleBtn, allocationType === 'percent' && styles.toggleBtnActive]}
                                onPress={() => setAllocationType('percent')}
                            >
                                <Percent size={16} color={allocationType === 'percent' ? COLORS.white : COLORS.textMuted} />
                                <Text style={[styles.toggleText, allocationType === 'percent' && styles.toggleTextActive]}>Percentage</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.toggleBtn, allocationType === 'fixed' && styles.toggleBtnActive]}
                                onPress={() => setAllocationType('fixed')}
                            >
                                <DollarSign size={16} color={allocationType === 'fixed' ? COLORS.white : COLORS.textMuted} />
                                <Text style={[styles.toggleText, allocationType === 'fixed' && styles.toggleTextActive]}>Fixed Amount</Text>
                            </TouchableOpacity>
                        </View>

                        <Text style={styles.inputLabel}>
                            {allocationType === 'percent' ? 'Percentage of Income (%)' : 'Amount to Save (DH)'}
                        </Text>
                        <TextInput
                            style={styles.input}
                            placeholder={allocationType === 'percent' ? "e.g. 20" : "e.g. 1000"}
                            placeholderTextColor={COLORS.textMuted}
                            keyboardType="numeric"
                            value={allocationValue}
                            onChangeText={setAllocationValue}
                        />

                        <Text style={styles.inputLabel}>Select Target Wallet</Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.walletSelector}>
                            {pockets.map((pocket) => {
                                const Icon = pocket.icon;
                                const isSelected = selectedWalletId === pocket.id;
                                return (
                                    <TouchableOpacity
                                        key={pocket.id}
                                        style={[styles.walletOption, isSelected && { borderColor: pocket.color, backgroundColor: `${pocket.color}10` }]}
                                        onPress={() => setSelectedWalletId(pocket.id)}
                                    >
                                        <View style={[styles.walletOptionIcon, { backgroundColor: isSelected ? pocket.color : COLORS.cardBg }]}>
                                            <Icon size={20} color={isSelected ? COLORS.white : COLORS.textMuted} />
                                        </View>
                                        <Text style={[styles.walletOptionText, isSelected && { color: COLORS.white }]}>{pocket.title}</Text>
                                        {isSelected && (
                                            <View style={styles.checkBadge}>
                                                <Check size={10} color={COLORS.white} />
                                            </View>
                                        )}
                                    </TouchableOpacity>
                                );
                            })}
                        </ScrollView>

                        <TouchableOpacity style={styles.createBtn} onPress={handleSaveRule}>
                            <LinearGradient
                                colors={[COLORS.success, '#059669']}
                                style={styles.createGradient}
                            >
                                <Text style={styles.createBtnText}>Save Rule</Text>
                            </LinearGradient>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </SafeAreaView >
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 24,
        paddingVertical: 16,
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: '700',
        color: COLORS.text,
    },
    addBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#F3E8FF',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(202, 183, 235, 0.5)',
    },
    iconBtn: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
    },
    content: {
        padding: 24,
    },
    summaryCard: {
        borderRadius: 24,
        marginBottom: 32,
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 16,
    },
    summaryGradient: {
        padding: 24,
        borderRadius: 24,
    },
    summaryRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    summaryLabel: {
        color: 'rgba(255,255,255,0.8)',
        fontSize: 14,
        marginBottom: 4,
    },
    summaryAmount: {
        color: COLORS.white,
        fontSize: 32,
        fontWeight: '800',
    },
    summaryIcon: {
        width: 48,
        height: 48,
        borderRadius: 16,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: COLORS.text,
        marginBottom: 16,
    },
    pocketCard: {
        backgroundColor: COLORS.cardBg,
        borderRadius: 20,
        padding: 20,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
    },
    pocketHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    iconContainer: {
        width: 48,
        height: 48,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    pocketInfo: {
        flex: 1,
    },
    pocketTitle: {
        color: COLORS.text,
        fontSize: 16,
        fontWeight: '700',
        marginBottom: 4,
    },
    pocketRule: {
        color: COLORS.textMuted,
        fontSize: 12,
    },
    pocketAmount: {
        color: COLORS.text,
        fontSize: 16,
        fontWeight: '700',
    },
    pocketTarget: {
        color: COLORS.textMuted,
        fontSize: 12,
    },
    progressBarBg: {
        height: 6,
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderRadius: 3,
        overflow: 'hidden',
    },
    progressBarFill: {
        height: '100%',
        borderRadius: 3,
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
    modalSubtitle: {
        color: COLORS.textMuted,
        fontSize: 14,
        marginBottom: 24,
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
    toggleContainer: {
        flexDirection: 'row',
        backgroundColor: COLORS.background,
        borderRadius: 16,
        padding: 4,
        marginBottom: 24,
    },
    toggleBtn: {
        flex: 1,
        flexDirection: 'row',
        paddingVertical: 12,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 12,
    },
    toggleBtnActive: {
        backgroundColor: COLORS.cardBg,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    toggleText: {
        color: COLORS.textMuted,
        fontWeight: '600',
        fontSize: 14,
        marginLeft: 8,
    },
    toggleTextActive: {
        color: COLORS.white,
    },
    walletSelector: {
        marginBottom: 24,
    },
    walletOption: {
        width: 100,
        height: 100,
        backgroundColor: COLORS.background,
        borderRadius: 16,
        padding: 12,
        marginRight: 12,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        justifyContent: 'center',
        alignItems: 'center',
        position: 'relative',
    },
    walletOptionIcon: {
        width: 40,
        height: 40,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
    },
    walletOptionText: {
        color: COLORS.textMuted,
        fontWeight: '600',
        fontSize: 12,
        textAlign: 'center',
    },
    checkBadge: {
        position: 'absolute',
        top: 8,
        right: 8,
        width: 16,
        height: 16,
        borderRadius: 8,
        backgroundColor: COLORS.success,
        justifyContent: 'center',
        alignItems: 'center',
    },

    // Tab Styles
    tabContainer: {
        flexDirection: 'row',
        backgroundColor: COLORS.cardBg,
        borderRadius: 16,
        padding: 4,
        marginBottom: 24,
    },
    tabBtn: {
        flex: 1,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 12,
        borderRadius: 12,
    },
    tabBtnActive: {
        backgroundColor: 'rgba(255,255,255,0.1)',
    },
    tabText: {
        color: COLORS.textMuted,
        fontWeight: '600',
        marginLeft: 8,
    },
    tabTextActive: {
        color: COLORS.white,
    },
    // Subscription Styles
    subCard: {
        backgroundColor: COLORS.cardBg,
        borderRadius: 20,
        padding: 20,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
    },
    subHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
        paddingBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.05)',
    },
    subInfo: {
        flex: 1,
    },
    subName: {
        color: COLORS.text,
        fontSize: 16,
        fontWeight: '700',
        marginBottom: 4,
    },
    subDate: {
        color: COLORS.textMuted,
        fontSize: 12,
    },
    subAmount: {
        color: COLORS.text,
        fontSize: 18,
        fontWeight: '700',
    },
    subActions: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    subActionBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 8,
        borderWidth: 1,
    },
    notifyActive: {
        backgroundColor: 'rgba(56, 178, 172, 0.1)',
        borderColor: 'rgba(56, 178, 172, 0.2)',
    },
    notifyInactive: {
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderColor: 'rgba(255,255,255,0.1)',
    },
    stopBtn: {
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        borderColor: 'rgba(239, 68, 68, 0.2)',
    },
    subActionText: {
        fontSize: 12,
        fontWeight: '600',
        marginLeft: 6,
    },

    // Shared & Child Styles
    membersRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
        marginTop: -4,
    },
    memberAvatar: {
        width: 24,
        height: 24,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: COLORS.cardBg,
    },
    addMemberBtn: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: 'rgba(255,255,255,0.1)',
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: 8,
        borderStyle: 'dashed',
        borderWidth: 1,
        borderColor: COLORS.textMuted,
    },
    childControls: {
        marginTop: 12,
        flexDirection: 'row',
    },
    childBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(59, 130, 246, 0.2)',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: 'rgba(59, 130, 246, 0.3)',
    },
    childBadgeText: {
        color: '#60A5FA',
        fontSize: 10,
        fontWeight: '600',
        marginLeft: 4,
    },
    dummy: {},
});
