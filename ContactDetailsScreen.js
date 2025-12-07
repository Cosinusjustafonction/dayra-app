import React from 'react';
import {
    StyleSheet,
    Text,
    View,
    SafeAreaView,
    TouchableOpacity,
    Image,
    ScrollView,
    Dimensions,
} from 'react-native';
import { ArrowLeft, QrCode, Calendar, MessageSquare, ArrowUpRight, ArrowDownLeft } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS } from './constants';

const { width } = Dimensions.get('window');

// Mock History Data
const HISTORY = [
    {
        id: 1,
        type: 'sent',
        amount: '250.00',
        date: 'Today, 10:23 AM',
        motive: 'Lunch at Venezia',
        icon: ArrowUpRight,
        color: COLORS.danger,
    },
    {
        id: 2,
        type: 'received',
        amount: '1,200.00',
        date: 'Yesterday, 4:15 PM',
        motive: 'Concert Tickets Reimbursement',
        icon: ArrowDownLeft,
        color: COLORS.success,
    },
    {
        id: 3,
        type: 'sent',
        amount: '50.00',
        date: 'Oct 24, 09:00 AM',
        motive: 'Coffee',
        icon: ArrowUpRight,
        color: COLORS.danger,
    },
    {
        id: 4,
        type: 'sent',
        amount: '500.00',
        date: 'Oct 20, 08:30 PM',
        motive: 'Shared Gift for Mom',
        icon: ArrowUpRight,
        color: COLORS.danger,
    },
];

export default function ContactDetailsScreen({ route, navigation }) {
    const { contact } = route.params || {
        contact: {
            name: 'Amine',
            label: 'Best Friend',
            avatar: 'https://i.pravatar.cc/150?u=amine',
            phone: '+212 6 12 34 56 78'
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <ArrowLeft color={COLORS.text} size={24} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Contact Details</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                {/* Profile Section */}
                <View style={styles.profileSection}>
                    <View style={styles.avatarContainer}>
                        <Image source={{ uri: contact.avatar }} style={styles.avatar} />
                        <View style={styles.labelBadge}>
                            <Text style={styles.labelText}>{contact.label}</Text>
                        </View>
                    </View>
                    <Text style={styles.name}>{contact.name}</Text>
                    <Text style={styles.phone}>{contact.phone}</Text>

                    <View style={styles.statsRow}>
                        <View style={styles.statItem}>
                            <Text style={styles.statValue}>2,450 DH</Text>
                            <Text style={styles.statLabel}>Total Sent</Text>
                        </View>
                        <View style={styles.statDivider} />
                        <View style={styles.statItem}>
                            <Text style={styles.statValue}>1,200 DH</Text>
                            <Text style={styles.statLabel}>Total Received</Text>
                        </View>
                    </View>
                </View>

                {/* Actions */}
                <View style={styles.actionsRow}>
                    <TouchableOpacity style={styles.actionBtn} onPress={() => navigation.navigate('QRScanner')}>
                        <LinearGradient
                            colors={[COLORS.primary, '#FF8C42']}
                            style={styles.actionGradient}
                        >
                            <QrCode color={COLORS.white} size={24} />
                            <Text style={styles.actionText}>Scan to Pay</Text>
                        </LinearGradient>
                    </TouchableOpacity>
                </View>

                {/* History Section */}
                <Text style={styles.sectionTitle}>Interaction History</Text>
                <View style={styles.historyList}>
                    {HISTORY.map((item) => (
                        <View key={item.id} style={styles.historyItem}>
                            <View style={[styles.historyIcon, { backgroundColor: item.type === 'sent' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)' }]}>
                                <item.icon color={item.color} size={20} />
                            </View>
                            <View style={styles.historyContent}>
                                <View style={styles.historyHeader}>
                                    <Text style={styles.historyMotive}>{item.motive}</Text>
                                    <Text style={[styles.historyAmount, { color: item.color }]}>
                                        {item.type === 'sent' ? '-' : '+'}{item.amount} DH
                                    </Text>
                                </View>
                                <View style={styles.historyFooter}>
                                    <View style={styles.dateRow}>
                                        <Calendar size={12} color={COLORS.textMuted} style={{ marginRight: 4 }} />
                                        <Text style={styles.historyDate}>{item.date}</Text>
                                    </View>
                                </View>
                            </View>
                        </View>
                    ))}
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
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 20,
        backgroundColor: COLORS.cardBg,
    },
    content: {
        paddingBottom: 40,
    },
    profileSection: {
        alignItems: 'center',
        paddingVertical: 24,
    },
    avatarContainer: {
        position: 'relative',
        marginBottom: 16,
    },
    avatar: {
        width: 100,
        height: 100,
        borderRadius: 50,
        borderWidth: 4,
        borderColor: COLORS.cardBg,
    },
    labelBadge: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        backgroundColor: COLORS.primary,
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: COLORS.background,
    },
    labelText: {
        color: COLORS.white,
        fontSize: 12,
        fontWeight: '700',
    },
    name: {
        fontSize: 24,
        fontWeight: '700',
        color: COLORS.text,
        marginBottom: 4,
    },
    phone: {
        fontSize: 14,
        color: COLORS.textMuted,
        marginBottom: 24,
    },
    statsRow: {
        flexDirection: 'row',
        backgroundColor: COLORS.cardBg,
        borderRadius: 20,
        padding: 16,
        width: width - 48,
        justifyContent: 'space-around',
        alignItems: 'center',
    },
    statItem: {
        alignItems: 'center',
    },
    statValue: {
        fontSize: 18,
        fontWeight: '700',
        color: COLORS.text,
        marginBottom: 4,
    },
    statLabel: {
        fontSize: 12,
        color: COLORS.textMuted,
    },
    statDivider: {
        width: 1,
        height: 30,
        backgroundColor: 'rgba(255,255,255,0.1)',
    },
    actionsRow: {
        paddingHorizontal: 24,
        marginVertical: 24,
    },
    actionBtn: {
        borderRadius: 20,
        overflow: 'hidden',
    },
    actionGradient: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 16,
    },
    actionText: {
        color: COLORS.white,
        fontSize: 16,
        fontWeight: '700',
        marginLeft: 8,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: COLORS.text,
        marginLeft: 24,
        marginBottom: 16,
    },
    historyList: {
        paddingHorizontal: 24,
    },
    historyItem: {
        flexDirection: 'row',
        backgroundColor: COLORS.cardBg,
        padding: 16,
        borderRadius: 16,
        marginBottom: 12,
        alignItems: 'center',
    },
    historyIcon: {
        width: 40,
        height: 40,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    historyContent: {
        flex: 1,
    },
    historyHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 4,
    },
    historyMotive: {
        color: COLORS.text,
        fontSize: 14,
        fontWeight: '600',
    },
    historyAmount: {
        fontSize: 14,
        fontWeight: '700',
    },
    historyFooter: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    dateRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    historyDate: {
        color: COLORS.textMuted,
        fontSize: 12,
    },
});
