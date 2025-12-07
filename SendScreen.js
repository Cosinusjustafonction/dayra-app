import React, { useState, useEffect } from 'react';
import {
    StyleSheet,
    Text,
    View,
    ScrollView,
    TouchableOpacity,
    SafeAreaView,
    TextInput,
    Image,
    Switch,
} from 'react-native';
import { Search, ChevronRight, Send, Clock, Repeat, Users, ArrowLeft, ArrowUpRight, ArrowDownLeft, Wallet, Check } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { simulateWalletTransfer, getWalletTransferOTP, confirmWalletTransfer, getCurrentUser, getDemoUsers, getWalletBalance, createBorrowRequest } from './api';
import { COLORS } from './constants';

const RECENT_CONTACTS = [
    { id: 1, name: 'Amine', avatar: 'https://i.pravatar.cc/150?u=amine', label: 'Best Friend', labelColor: '#EC4899' },
    { id: 2, name: 'Sarah', avatar: 'https://i.pravatar.cc/150?u=sarah', label: 'Family', labelColor: '#F37021' },
    { id: 3, name: 'Karim', avatar: 'https://i.pravatar.cc/150?u=karim', label: 'Work', labelColor: '#38B2AC' },
    { id: 4, name: 'Mouna', avatar: 'https://i.pravatar.cc/150?u=mouna' },
    { id: 5, name: 'Youssef', avatar: 'https://i.pravatar.cc/150?u=youssef' },
];

const WALLETS = [
    { id: 1, type: 'Main Account', balance: '12,450.00', color: '#F37021' },
    { id: 2, type: 'Savings', balance: '45,000.00', color: '#38B2AC' },
    { id: 3, type: 'E-Shopping', balance: '1,200.00', color: '#8B5CF6' },
];

export default function SendScreen({ navigation }) {
    const [mode, setMode] = useState('send'); // 'send' or 'lend'
    const [amount, setAmount] = useState('');
    const [selectedContact, setSelectedContact] = useState(null);
    const [wallets, setWallets] = useState(WALLETS);
    const [selectedWallet, setSelectedWallet] = useState(WALLETS[0]);
    const [note, setNote] = useState('');
    const [isRecurring, setIsRecurring] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [pendingTransfer, setPendingTransfer] = useState(null);
    const [availableContacts, setAvailableContacts] = useState(RECENT_CONTACTS);

    // Fetch wallets and contacts from API
    useEffect(() => {
        const fetchData = async () => {
            try {
                // Fetch contacts
                const response = await getDemoUsers();
                if (response.users && response.users.length > 0) {
                    const contacts = response.users.map((u, i) => ({
                        id: i + 1,
                        name: u.first_name,
                        phone: u.phone_number,
                        contractId: u.contract_id,
                        avatar: `https://i.pravatar.cc/150?u=${u.first_name?.toLowerCase()}`,
                    }));
                    setAvailableContacts(contacts);
                }

                // Fetch wallet balance
                const user = getCurrentUser();
                const balanceResponse = await getWalletBalance(user.contractId);
                if (balanceResponse.result?.balance?.[0]?.value) {
                    const apiBalance = parseFloat(balanceResponse.result.balance[0].value);
                    const formattedBalance = apiBalance.toLocaleString('en-US', { minimumFractionDigits: 2 });

                    // Update main account balance
                    setWallets(prev => prev.map((w, idx) =>
                        idx === 0 ? { ...w, balance: formattedBalance } : w
                    ));
                    setSelectedWallet(prev =>
                        prev.id === 1 ? { ...prev, balance: formattedBalance } : prev
                    );
                }
            } catch (error) {
                console.log('Using mock data for SendScreen');
            }
        };
        fetchData();
    }, []);

    const handleSend = async () => {
        if (amount && selectedContact) {
            setIsProcessing(true);
            try {
                const user = getCurrentUser();
                const destPhone = selectedContact.phone || '212600000002';

                // If mode is 'lend', send a borrow request instead of transferring money
                if (mode === 'lend') {
                    const response = await createBorrowRequest({
                        fromPhone: user.phoneNumber,
                        fromName: `${user.firstName} ${user.lastName}`,
                        toPhone: destPhone,
                        amount: parseFloat(amount),
                        note: note || `Borrow request for ${amount} DH`
                    });

                    setIsProcessing(false);
                    alert(`✅ Borrow request sent to ${selectedContact.name}!\nThey will see it in their notifications.`);
                    navigation.goBack();
                    return;
                }

                // Regular send mode - Step 1: Simulate transfer
                const simResponse = await simulateWalletTransfer({
                    contractId: user.contractId,
                    amount: parseFloat(amount),
                    destinationPhone: destPhone,
                    mobileNumber: user.phoneNumber,
                    clientNote: note || mode
                });

                // Step 2: Get OTP
                const otpResponse = await getWalletTransferOTP(user.phoneNumber);
                const otp = otpResponse.result?.[0]?.codeOtp || '123456';

                // Step 3: Confirm transfer
                await confirmWalletTransfer({
                    mobileNumber: user.phoneNumber,
                    contractId: user.contractId,
                    otp: otp,
                    referenceId: simResponse.result?.referenceId,
                    destinationPhone: destPhone,
                    fees: 0
                });

                const action = mode === 'send' ? 'Sent' : 'Lent';
                alert(`✅ ${action} ${amount} DH to ${selectedContact.name}!\nReference: ${simResponse.result?.referenceId}`);
                navigation.goBack();
            } catch (error) {
                console.error('Transfer failed:', error);
                // Fallback to mock behavior
                const action = mode === 'send' ? 'Sent' : 'Lent';
                alert(`${action} ${amount} DH to ${selectedContact.name} from ${selectedWallet.type}`);
                navigation.goBack();
            } finally {
                setIsProcessing(false);
            }
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <ArrowLeft color={COLORS.text} size={24} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Send Money</Text>
                <TouchableOpacity style={styles.scanBtn} onPress={() => navigation.navigate('Contacts')}>
                    <Users color={COLORS.white} size={20} />
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.content}>

                {/* Toggle Switch */}
                <View style={styles.toggleContainer}>
                    <TouchableOpacity
                        style={[styles.toggleBtn, mode === 'send' && styles.toggleBtnActive]}
                        onPress={() => setMode('send')}
                    >
                        <ArrowUpRight color={mode === 'send' ? COLORS.white : COLORS.textMuted} size={20} />
                        <Text style={[styles.toggleText, mode === 'send' && styles.toggleTextActive]}>Send</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.toggleBtn, mode === 'lend' && styles.toggleBtnActive]}
                        onPress={() => setMode('lend')}
                    >
                        <ArrowDownLeft color={mode === 'lend' ? COLORS.white : COLORS.textMuted} size={20} />
                        <Text style={[styles.toggleText, mode === 'lend' && styles.toggleTextActive]}>Lend</Text>
                    </TouchableOpacity>
                </View>

                {/* Amount Input */}
                <View style={styles.amountContainer}>
                    <Text style={styles.currencyPrefix}>DH</Text>
                    <TextInput
                        style={styles.amountInput}
                        placeholder="0"
                        placeholderTextColor={COLORS.textMuted}
                        keyboardType="numeric"
                        value={amount}
                        onChangeText={setAmount}
                        autoFocus
                    />
                </View>

                {/* Wallet Selection */}
                <Text style={styles.sectionTitle}>From Wallet</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.walletScroll}>
                    {wallets.map((wallet) => (
                        <TouchableOpacity
                            key={wallet.id}
                            style={[
                                styles.walletItem,
                                selectedWallet.id === wallet.id && { borderColor: wallet.color, backgroundColor: `${wallet.color}10` }
                            ]}
                            onPress={() => setSelectedWallet(wallet)}
                        >
                            <View style={[styles.walletIcon, { backgroundColor: `${wallet.color}20` }]}>
                                <Wallet size={20} color={wallet.color} />
                            </View>
                            <View>
                                <Text style={styles.walletType}>{wallet.type}</Text>
                                <Text style={styles.walletBalance}>{wallet.balance} DH</Text>
                            </View>
                            {selectedWallet.id === wallet.id && (
                                <View style={[styles.checkBadge, { backgroundColor: wallet.color }]}>
                                    <Check size={10} color={COLORS.white} />
                                </View>
                            )}
                        </TouchableOpacity>
                    ))}
                </ScrollView>

                {/* Contact Selection */}
                <Text style={styles.sectionTitle}>To</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.contactsScroll}>
                    {availableContacts.map((contact) => (
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
                                    <View style={styles.checkInner} />
                                </View>
                            )}
                        </TouchableOpacity>
                    ))}
                    <TouchableOpacity style={styles.searchBtn}>
                        <Search color={COLORS.textMuted} size={24} />
                    </TouchableOpacity>
                </ScrollView>

                {/* Note Input */}
                <View style={styles.inputContainer}>
                    <TextInput
                        style={styles.noteInput}
                        placeholder="Add a note (optional)"
                        placeholderTextColor={COLORS.textMuted}
                        value={note}
                        onChangeText={setNote}
                    />
                </View>

                {/* Recurring Payment Toggle */}
                <View style={styles.recurringContainer}>
                    <View style={styles.recurringInfo}>
                        <View style={styles.iconBg}>
                            <Repeat size={20} color={COLORS.primary} />
                        </View>
                        <View>
                            <Text style={styles.recurringTitle}>Repeat Monthly</Text>
                            <Text style={styles.recurringSubtitle}>Schedule this payment every month</Text>
                        </View>
                    </View>
                    <Switch
                        trackColor={{ false: COLORS.cardBg, true: COLORS.primary }}
                        thumbColor={COLORS.white}
                        ios_backgroundColor={COLORS.cardBg}
                        onValueChange={setIsRecurring}
                        value={isRecurring}
                    />
                </View>

                {/* Send Button */}
                <TouchableOpacity
                    style={[styles.sendBtn, (!amount || !selectedContact) && styles.sendBtnDisabled]}
                    onPress={handleSend}
                    disabled={!amount || !selectedContact}
                >
                    <LinearGradient
                        colors={(!amount || !selectedContact) ? ['#334155', '#334155'] : [COLORS.primary, '#2C7A7B']}
                        style={styles.sendGradient}
                    >
                        <Text style={styles.sendBtnText}>
                            {isRecurring ? 'Schedule Payment' : (mode === 'send' ? 'Send Now' : 'Lend Now')}
                        </Text>
                        <Send color={COLORS.white} size={20} style={{ marginLeft: 8 }} />
                    </LinearGradient>
                </TouchableOpacity>

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
    backText: {
        color: COLORS.textMuted,
        fontSize: 16,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: COLORS.text,
    },
    content: {
        padding: 24,
    },
    toggleContainer: {
        flexDirection: 'row',
        backgroundColor: COLORS.cardBg,
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
    amountContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 40,
        marginTop: 20,
    },
    currencyPrefix: {
        fontSize: 40,
        fontWeight: '700',
        color: COLORS.textMuted,
        marginRight: 8,
    },
    amountInput: {
        fontSize: 64,
        fontWeight: '800',
        color: COLORS.text,
        minWidth: 100,
        textAlign: 'center',
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: COLORS.textMuted,
        marginBottom: 16,
    },
    contactsScroll: {
        marginBottom: 32,
    },
    contactItem: {
        alignItems: 'center',
        marginRight: 20,
        position: 'relative',
    },
    contactSelected: {
        opacity: 1,
    },
    avatar: {
        width: 64,
        height: 64,
        borderRadius: 32,
        marginBottom: 8,
        borderWidth: 2,
        borderColor: COLORS.cardBg,
    },
    contactName: {
        color: COLORS.text,
        fontSize: 12,
        fontWeight: '500',
    },
    miniLabel: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        width: 16,
        height: 16,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: COLORS.cardBg,
    },
    miniLabelText: {
        color: COLORS.white,
        fontSize: 8,
        fontWeight: '700',
    },
    amountSection: {
        position: 'absolute',
        top: 0,
        right: 0,
        width: 24,
        height: 24,
    },
    checkBadge: {
        position: 'absolute',
        top: 0,
        right: 0,
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: COLORS.primary,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: COLORS.background,
    },
    checkInner: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: COLORS.white,
    },
    searchBtn: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: COLORS.cardBg,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    inputContainer: {
        backgroundColor: COLORS.cardBg,
        borderRadius: 16,
        padding: 4,
        marginBottom: 24,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
    },
    noteInput: {
        padding: 16,
        color: COLORS.text,
        fontSize: 16,
    },
    recurringContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: COLORS.cardBg,
        padding: 16,
        borderRadius: 20,
        marginBottom: 32,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
    },
    recurringInfo: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    iconBg: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: 'rgba(56, 178, 172, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    recurringTitle: {
        color: COLORS.text,
        fontWeight: '600',
        fontSize: 14,
        marginBottom: 2,
    },
    recurringSubtitle: {
        color: COLORS.textMuted,
        fontSize: 12,
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
    // Wallet Selector Styles
    walletScroll: {
        marginBottom: 24,
    },
    walletItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.cardBg,
        padding: 12,
        borderRadius: 16,
        marginRight: 12,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
        minWidth: 160,
    },
    walletIcon: {
        width: 40,
        height: 40,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    walletType: {
        color: COLORS.text,
        fontSize: 12,
        fontWeight: '600',
    },
    walletBalance: {
        color: COLORS.textMuted,
        fontSize: 12,
    },
    checkBadge: {
        position: 'absolute',
        top: -6,
        right: -6,
        width: 16,
        height: 16,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: COLORS.background,
    },
});
