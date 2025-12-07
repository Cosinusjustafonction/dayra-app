import React, { useState, useEffect } from 'react';
import {
    StyleSheet,
    Text,
    View,
    SafeAreaView,
    TouchableOpacity,
    ScrollView,
    TextInput,
    Image,
    Dimensions,
} from 'react-native';
import { ArrowLeft, ArrowDownLeft, ArrowUpRight, Users, CheckCircle2, Clock } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS } from './constants';
import { simulateCashIn, confirmCashIn, getCurrentUser, getDemoUsers } from './api';

const { width } = Dimensions.get('window');

const RECENT_CONTACTS = [
    { id: 1, name: 'Amine', avatar: 'https://i.pravatar.cc/150?u=amine' },
    { id: 2, name: 'Sarah', avatar: 'https://i.pravatar.cc/150?u=sarah' },
    { id: 3, name: 'Karim', avatar: 'https://i.pravatar.cc/150?u=karim' },
    { id: 4, name: 'Mouna', avatar: 'https://i.pravatar.cc/150?u=mouna' },
];

const DEBTS = [
    { id: 1, type: 'owed_to_me', user: 'Amine', amount: 200, date: '2 days ago', status: 'pending' },
    { id: 2, type: 'i_owe', user: 'Sarah', amount: 150, date: 'Yesterday', status: 'pending' },
    { id: 3, type: 'owed_to_me', user: 'Karim', amount: 50, date: 'Last week', status: 'paid' },
];

export default function ReceiveScreen({ navigation }) {
    const [mode, setMode] = useState('receive'); // 'receive' or 'borrow'
    const [amount, setAmount] = useState('');
    const [selectedContact, setSelectedContact] = useState(null);
    const [contacts, setContacts] = useState(RECENT_CONTACTS);

    // Fetch contacts from API
    useEffect(() => {
        const fetchContacts = async () => {
            try {
                const response = await getDemoUsers();
                if (response.users && response.users.length > 0) {
                    const apiContacts = response.users.map((u, i) => ({
                        id: i + 1,
                        name: u.first_name,
                        phone: u.phone_number,
                        contractId: u.contract_id,
                        avatar: `https://i.pravatar.cc/150?u=${u.first_name?.toLowerCase()}`,
                    }));
                    setContacts(apiContacts);
                }
            } catch (error) {
                console.log('Using mock contacts');
            }
        };
        fetchContacts();
    }, []);

    const handleAction = async () => {
        if (!amount || !selectedContact) return;

        try {
            const user = getCurrentUser();
            // Simulate cash in (receiving money)
            const simResponse = await simulateCashIn({
                contractId: user.contractId,
                level: '002',
                phoneNumber: user.phoneNumber,
                amount: parseFloat(amount),
                fees: 0
            });

            if (simResponse.result?.token) {
                await confirmCashIn({
                    token: simResponse.result.token,
                    amount: parseFloat(amount),
                    fees: 0
                });
            }

            const action = mode === 'receive' ? 'Received' : 'Borrowed';
            alert(`✅ ${action} ${amount} DH from ${selectedContact.name}!`);
        } catch (error) {
            const action = mode === 'receive' ? 'Requested' : 'Borrowed';
            alert(`${action} ${amount} DH from ${selectedContact.name}`);
        }
        navigation.goBack();
    };

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <ArrowLeft color={COLORS.text} size={24} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Social Finance</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView contentContainerStyle={styles.content}>

                {/* Toggle Switch */}
                <View style={styles.toggleContainer}>
                    <TouchableOpacity
                        style={[styles.toggleBtn, mode === 'receive' && styles.toggleBtnActive]}
                        onPress={() => setMode('receive')}
                    >
                        <ArrowDownLeft color={mode === 'receive' ? COLORS.white : COLORS.textMuted} size={20} />
                        <Text style={[styles.toggleText, mode === 'receive' && styles.toggleTextActive]}>Receive</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.toggleBtn, mode === 'borrow' && styles.toggleBtnActive]}
                        onPress={() => setMode('borrow')}
                    >
                        <ArrowUpRight color={mode === 'borrow' ? COLORS.white : COLORS.textMuted} size={20} />
                        <Text style={[styles.toggleText, mode === 'borrow' && styles.toggleTextActive]}>Borrow</Text>
                    </TouchableOpacity>
                </View>

                {/* Main Action Card */}
                <View style={styles.actionCard}>
                    <Text style={styles.cardTitle}>
                        {mode === 'receive' ? 'Ask for money' : 'Borrow money from a friend'}
                    </Text>

                    <View style={styles.amountContainer}>
                        <Text style={styles.currencyPrefix}>DH</Text>
                        <TextInput
                            style={styles.amountInput}
                            placeholder="0"
                            placeholderTextColor={COLORS.textMuted}
                            keyboardType="numeric"
                            value={amount}
                            onChangeText={setAmount}
                        />
                    </View>

                    <Text style={styles.sectionLabel}>Select Contact</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.contactsScroll}>
                        {contacts.map((contact) => (
                            <TouchableOpacity
                                key={contact.id}
                                style={[
                                    styles.contactItem,
                                    selectedContact?.id === contact.id && styles.contactSelected
                                ]}
                                onPress={() => setSelectedContact(contact)}
                            >
                                <Image source={{ uri: contact.avatar }} style={styles.avatar} />
                                <Text style={styles.contactName}>{contact.name}</Text>
                                {selectedContact?.id === contact.id && (
                                    <View style={styles.checkBadge}>
                                        <CheckCircle2 size={16} color={COLORS.white} />
                                    </View>
                                )}
                            </TouchableOpacity>
                        ))}
                    </ScrollView>

                    <TouchableOpacity
                        style={[styles.sendBtn, (!amount || !selectedContact) && styles.sendBtnDisabled]}
                        onPress={handleAction}
                        disabled={!amount || !selectedContact}
                    >
                        <LinearGradient
                            colors={(!amount || !selectedContact) ? ['#334155', '#334155'] : [COLORS.primary, '#2C7A7B']}
                            style={styles.sendGradient}
                        >
                            <Text style={styles.sendBtnText}>
                                {mode === 'receive' ? 'Send Request' : 'Ask to Borrow'}
                            </Text>
                            <ArrowDownLeft color={COLORS.white} size={20} style={{ marginLeft: 8 }} />
                        </LinearGradient>
                    </TouchableOpacity>
                </View>



            </ScrollView>
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
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 24,
        paddingVertical: 16,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: COLORS.text,
    },
    backBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#F3E8FF',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(202, 183, 235, 0.5)',
    },
    content: {
        padding: 24,
    },
    toggleContainer: {
        flexDirection: 'row',
        backgroundColor: '#F3E8FF',
        borderRadius: 16,
        padding: 4,
        marginBottom: 24,
    },
    toggleBtn: {
        flex: 1,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 12,
        borderRadius: 12,
    },
    toggleBtnActive: {
        backgroundColor: COLORS.primary,
    },
    toggleText: {
        color: '#64748B',
        fontWeight: '600',
        marginLeft: 8,
    },
    toggleTextActive: {
        color: '#FFFFFF',
    },
    actionCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 24,
        padding: 24,
        marginBottom: 32,
        borderWidth: 1,
        borderColor: 'rgba(202, 183, 235, 0.3)',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    cardTitle: {
        color: COLORS.text,
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 24,
        textAlign: 'center',
    },
    amountContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 32,
    },
    currencyPrefix: {
        fontSize: 24,
        fontWeight: '700',
        color: COLORS.textMuted,
        marginRight: 8,
    },
    amountInput: {
        fontSize: 48,
        fontWeight: '800',
        color: COLORS.text,
        minWidth: 80,
        textAlign: 'center',
    },
    sectionLabel: {
        color: COLORS.textMuted,
        fontSize: 12,
        fontWeight: '600',
        marginBottom: 12,
    },
    contactsScroll: {
        marginBottom: 24,
    },
    contactItem: {
        alignItems: 'center',
        marginRight: 16,
        opacity: 0.6,
    },
    contactSelected: {
        opacity: 1,
    },
    avatar: {
        width: 56,
        height: 56,
        borderRadius: 28,
        marginBottom: 8,
    },
    contactName: {
        color: COLORS.text,
        fontSize: 12,
        fontWeight: '500',
    },
    checkBadge: {
        position: 'absolute',
        top: 0,
        right: 0,
        backgroundColor: COLORS.success,
        borderRadius: 10,
        padding: 2,
    },
    submitBtn: {
        borderRadius: 16,
        overflow: 'hidden',
    },
    submitBtnDisabled: {
        opacity: 0.5,
    },
    submitGradient: {
        paddingVertical: 16,
        alignItems: 'center',
    },
    sendBtn: {
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
    },
    sendBtnDisabled: {
        shadowOpacity: 0,
    },
    sendGradient: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 18,
        borderRadius: 24,
    },
    sendBtnText: {
        color: COLORS.white,
        fontSize: 18,
        fontWeight: '700',
    },
    submitText: {
        color: COLORS.white,
        fontSize: 16,
        fontWeight: '700',
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: COLORS.text,
        marginBottom: 16,
    },
    statsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 24,
    },
    statCard: {
        width: '48%',
        backgroundColor: COLORS.cardBg,
        padding: 16,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
    },
    statLabel: {
        color: COLORS.textMuted,
        fontSize: 12,
        marginBottom: 4,
    },
    statValue: {
        fontSize: 20,
        fontWeight: '700',
    },
    debtList: {
        gap: 12,
    },
    debtItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.cardBg,
        padding: 16,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
    },
    debtIconBg: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: 'rgba(255,255,255,0.05)',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    debtInfo: {
        flex: 1,
    },
    debtUser: {
        color: COLORS.text,
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 4,
    },
    debtMeta: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    debtDate: {
        color: COLORS.textMuted,
        fontSize: 12,
    },
    debtAmount: {
        fontSize: 16,
        fontWeight: '700',
        marginBottom: 2,
    },
    debtStatus: {
        fontSize: 10,
        fontWeight: '600',
        textTransform: 'uppercase',
    },
});
