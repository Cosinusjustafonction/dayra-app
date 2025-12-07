import React, { useState, useEffect } from 'react';
import {
    StyleSheet,
    Text,
    View,
    ScrollView,
    TouchableOpacity,
    SafeAreaView,
    RefreshControl,
    Alert,
} from 'react-native';
import { ArrowLeft, Bell, Check, X, Clock, DollarSign } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { getPendingBorrowRequests, respondToBorrowRequest, getCurrentUser } from './api';
import { COLORS } from './constants';



export default function NotificationsScreen({ navigation }) {
    const [notifications, setNotifications] = useState([]);
    const [refreshing, setRefreshing] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    const fetchNotifications = async () => {
        try {
            const user = getCurrentUser();
            const response = await getPendingBorrowRequests(user.phoneNumber);
            if (response.result?.requests) {
                setNotifications(response.result.requests);
            }
        } catch (error) {
            console.log('Error fetching notifications');
        } finally {
            setIsLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchNotifications();
        const interval = setInterval(fetchNotifications, 5000);
        return () => clearInterval(interval);
    }, []);

    const handleRespond = async (requestId, action) => {
        try {
            const user = getCurrentUser();
            const response = await respondToBorrowRequest({
                requestId,
                action,
                responderPhone: user.phoneNumber,
            });

            if (response.result?.success) {
                Alert.alert(
                    action === 'accept' ? '✅ Money Sent!' : 'Request Declined',
                    response.result.message,
                    [{ text: 'OK' }]
                );
                fetchNotifications(); // Refresh the list
            }
        } catch (error) {
            Alert.alert('Error', error.message || 'Failed to process request');
        }
    };

    const onRefresh = () => {
        setRefreshing(true);
        fetchNotifications();
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins} min ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        return date.toLocaleDateString();
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <ArrowLeft size={24} color={COLORS.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Notifications</Text>
                <View style={styles.placeholder} />
            </View>

            <ScrollView
                contentContainerStyle={styles.content}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />
                }
            >
                {/* Pending Borrow Requests */}
                <Text style={styles.sectionTitle}>Borrow Requests</Text>

                {notifications.length === 0 && !isLoading && (
                    <View style={styles.emptyState}>
                        <Bell size={48} color={COLORS.textMuted} />
                        <Text style={styles.emptyText}>No pending requests</Text>
                        <Text style={styles.emptySubtext}>When someone asks to borrow money, it will appear here</Text>
                    </View>
                )}

                {notifications.map((notification) => (
                    <View key={notification.id} style={styles.notificationCard}>
                        <View style={styles.notificationHeader}>
                            <View style={styles.avatarContainer}>
                                <DollarSign size={20} color={COLORS.primary} />
                            </View>
                            <View style={styles.notificationInfo}>
                                <Text style={styles.notificationTitle}>
                                    {notification.fromName} wants to borrow
                                </Text>
                                <Text style={styles.notificationAmount}>
                                    {notification.amount} DH
                                </Text>
                            </View>
                            <Text style={styles.notificationTime}>
                                {formatDate(notification.date)}
                            </Text>
                        </View>

                        {notification.note && (
                            <Text style={styles.notificationNote}>"{notification.note}"</Text>
                        )}

                        <View style={styles.actionButtons}>
                            <TouchableOpacity
                                style={styles.declineButton}
                                onPress={() => handleRespond(notification.id, 'decline')}
                            >
                                <X size={18} color={COLORS.danger} />
                                <Text style={styles.declineText}>Decline</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles.acceptButton}
                                onPress={() => handleRespond(notification.id, 'accept')}
                            >
                                <LinearGradient
                                    colors={[COLORS.success, '#059669']}
                                    style={styles.acceptGradient}
                                >
                                    <Check size={18} color={COLORS.white} />
                                    <Text style={styles.acceptText}>Accept & Send</Text>
                                </LinearGradient>
                            </TouchableOpacity>
                        </View>
                    </View>
                ))}

                <Text style={[styles.sectionTitle, { marginTop: 24 }]}>How it works</Text>
                <View style={styles.infoCard}>
                    <Text style={styles.infoText}>
                        • When someone asks to borrow money, you'll see it here{'\n'}
                        • Click "Accept & Send" to lend them money instantly{'\n'}
                        • The debt will appear in your Analytics → Debts section{'\n'}
                        • You can remind them to pay back anytime
                    </Text>
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
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 16,
    },
    backBtn: {
        padding: 8,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: COLORS.text,
    },
    placeholder: {
        width: 40,
    },
    content: {
        paddingHorizontal: 20,
        paddingBottom: 100,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: COLORS.text,
        marginBottom: 16,
    },
    emptyState: {
        alignItems: 'center',
        paddingVertical: 40,
    },
    emptyText: {
        color: COLORS.text,
        fontSize: 16,
        fontWeight: '600',
        marginTop: 16,
    },
    emptySubtext: {
        color: COLORS.textMuted,
        fontSize: 14,
        textAlign: 'center',
        marginTop: 8,
    },
    notificationCard: {
        backgroundColor: COLORS.cardBg,
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    notificationHeader: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    avatarContainer: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: COLORS.iconBg,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    notificationInfo: {
        flex: 1,
    },
    notificationTitle: {
        color: COLORS.text,
        fontSize: 14,
        fontWeight: '600',
    },
    notificationAmount: {
        color: COLORS.primary,
        fontSize: 20,
        fontWeight: '700',
        marginTop: 2,
    },
    notificationTime: {
        color: COLORS.textMuted,
        fontSize: 12,
    },
    notificationNote: {
        color: COLORS.textMuted,
        fontSize: 13,
        fontStyle: 'italic',
        marginTop: 12,
        paddingLeft: 56,
    },
    actionButtons: {
        flexDirection: 'row',
        marginTop: 16,
        gap: 12,
    },
    declineButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: COLORS.danger,
    },
    declineText: {
        color: COLORS.danger,
        fontWeight: '600',
        marginLeft: 6,
    },
    acceptButton: {
        flex: 1,
    },
    acceptGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 12,
    },
    acceptText: {
        color: COLORS.white,
        fontWeight: '700',
        marginLeft: 6,
    },
    infoCard: {
        backgroundColor: COLORS.cardBg,
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    infoText: {
        color: COLORS.textMuted,
        fontSize: 13,
        lineHeight: 22,
    },
});
