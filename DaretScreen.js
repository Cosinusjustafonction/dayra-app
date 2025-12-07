import React, { useState, useEffect } from 'react';
import {
    StyleSheet,
    Text,
    View,
    ScrollView,
    TouchableOpacity,
    SafeAreaView,
    Image,
    Dimensions,
} from 'react-native';
import { Users, Calendar, CheckCircle, Clock, ArrowRight, ShieldCheck } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS } from './constants';
import { getDemoUsers, getCurrentUser } from './api';

const MEMBERS = [
    { id: 1, name: 'You', avatar: 'https://i.pravatar.cc/150?u=mehdi', status: 'paid', turn: 'Feb' },
    { id: 2, name: 'Amine', avatar: 'https://i.pravatar.cc/150?u=amine', status: 'paid', turn: 'Jan' },
    { id: 3, name: 'Sara', avatar: 'https://i.pravatar.cc/150?u=sara', status: 'pending', turn: 'Mar' },
    { id: 4, name: 'Omar', avatar: 'https://i.pravatar.cc/150?u=omar', status: 'pending', turn: 'Apr' },
    { id: 5, name: 'Lina', avatar: 'https://i.pravatar.cc/150?u=lina', status: 'pending', turn: 'May' },
];

const { width } = Dimensions.get('window');

export default function DaretScreen() {
    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <View>
                    <Text style={styles.headerTitle}>Daret Circle</Text>
                    <Text style={styles.headerSubtitle}>Group #128 • 2,000 DH/Month</Text>
                </View>
                <View style={styles.guaranteeBadge}>
                    <ShieldCheck size={14} color={COLORS.success} />
                    <Text style={styles.guaranteeText}>Secured</Text>
                </View>
            </View>

            <ScrollView contentContainerStyle={styles.content}>

                {/* Visual Cycle (Simplified Representation) */}
                <View style={styles.cycleContainer}>
                    <View style={styles.cycleCircle}>
                        <LinearGradient
                            colors={[COLORS.primary, '#A78BFA']}
                            style={styles.activeTurnRing}
                        >
                            <Image source={{ uri: 'https://i.pravatar.cc/150?u=amine' }} style={styles.centerAvatar} />
                        </LinearGradient>
                        <View style={styles.turnInfo}>
                            <Text style={styles.turnLabel}>Current Turn</Text>
                            <Text style={styles.turnName}>Amine</Text>
                            <Text style={styles.turnAmount}>10,000 DH</Text>
                        </View>
                    </View>

                    <View style={styles.timeline}>
                        <View style={styles.timelineLine} />
                        {MEMBERS.map((member, index) => (
                            <View key={member.id} style={[styles.timelineNode, { left: `${index * 20 + 10}%` }]}>
                                <Image source={{ uri: member.avatar }} style={[styles.timelineAvatar, member.name === 'Amine' && styles.activeAvatar]} />
                                <Text style={styles.timelineMonth}>{member.turn}</Text>
                            </View>
                        ))}
                    </View>
                </View>

                {/* Your Status */}
                <View style={[styles.statusCard, { backgroundColor: COLORS.cardBg }]}>
                    <View style={styles.statusRow}>
                        <View>
                            <Text style={styles.statusLabel}>Your Turn</Text>
                            <Text style={styles.statusValue}>February 2026</Text>
                        </View>
                        <View style={styles.countdownBadge}>
                            <Clock size={14} color={COLORS.warning} />
                            <Text style={styles.countdownText}>1 Month left</Text>
                        </View>
                    </View>
                    <View style={styles.progressBarBg}>
                        <LinearGradient
                            colors={[COLORS.primary, '#C4B5FD']}
                            style={[styles.progressBarFill, { width: '80%' }]}
                        />
                    </View>
                    <Text style={styles.progressText}>4/5 Contributions Paid</Text>
                </View>

                <Text style={styles.sectionTitle}>Members Status</Text>

                {MEMBERS.map((member) => (
                    <View key={member.id} style={styles.memberRow}>
                        <View style={styles.memberInfo}>
                            <Image source={{ uri: member.avatar }} style={styles.memberAvatar} />
                            <View>
                                <Text style={styles.memberName}>{member.name}</Text>
                                <Text style={styles.memberRole}>{member.turn}</Text>
                            </View>
                        </View>
                        <View style={[styles.statusBadge, member.status === 'paid' ? styles.statusPaid : styles.statusPending]}>
                            {member.status === 'paid' ? (
                                <CheckCircle size={14} color={COLORS.success} />
                            ) : (
                                <Clock size={14} color={COLORS.warning} />
                            )}
                            <Text style={[styles.statusText, member.status === 'paid' ? { color: COLORS.success } : { color: COLORS.warning }]}>
                                {member.status === 'paid' ? 'Paid' : 'Pending'}
                            </Text>
                        </View>
                    </View>
                ))}

                <TouchableOpacity style={styles.payBtn}>
                    <LinearGradient
                        colors={[COLORS.primary, '#7C3AED']}
                        style={styles.payGradient}
                    >
                        <Text style={styles.payBtnText}>Pay Contribution (2,000 DH)</Text>
                        <ArrowRight color={COLORS.white} size={20} />
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
    headerTitle: {
        fontSize: 24,
        fontWeight: '700',
        color: COLORS.text,
    },
    headerSubtitle: {
        color: COLORS.textMuted,
        fontSize: 12,
    },
    guaranteeBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'rgba(16, 185, 129, 0.2)',
    },
    guaranteeText: {
        color: COLORS.success,
        fontSize: 10,
        fontWeight: '600',
        marginLeft: 4,
    },
    content: {
        padding: 24,
    },
    cycleContainer: {
        alignItems: 'center',
        marginBottom: 32,
        height: 200,
        justifyContent: 'center',
    },
    cycleCircle: {
        alignItems: 'center',
        marginBottom: 24,
    },
    activeTurnRing: {
        width: 100,
        height: 100,
        borderRadius: 50,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 12,
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.5,
        shadowRadius: 20,
    },
    centerAvatar: {
        width: 92,
        height: 92,
        borderRadius: 46,
        borderWidth: 4,
        borderColor: COLORS.background,
    },
    turnInfo: {
        alignItems: 'center',
    },
    turnLabel: {
        color: COLORS.textMuted,
        fontSize: 10,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    turnName: {
        color: COLORS.text,
        fontSize: 18,
        fontWeight: '700',
    },
    turnAmount: {
        color: COLORS.success,
        fontSize: 14,
        fontWeight: '600',
    },
    timeline: {
        width: '100%',
        height: 60,
        position: 'relative',
        marginTop: 20,
    },
    timelineLine: {
        position: 'absolute',
        top: 20,
        left: 20,
        right: 20,
        height: 2,
        backgroundColor: COLORS.border,
    },
    timelineNode: {
        position: 'absolute',
        alignItems: 'center',
        width: 40,
    },
    timelineAvatar: {
        width: 32,
        height: 32,
        borderRadius: 16,
        borderWidth: 2,
        borderColor: COLORS.cardBg,
        marginBottom: 4,
        opacity: 0.5,
    },
    activeAvatar: {
        opacity: 1,
        borderColor: COLORS.primary,
        transform: [{ scale: 1.2 }],
    },
    timelineMonth: {
        color: COLORS.textMuted,
        fontSize: 10,
    },
    statusCard: {
        borderRadius: 20,
        padding: 20,
        marginBottom: 32,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
    },
    statusRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    statusLabel: {
        color: COLORS.textMuted,
        fontSize: 12,
    },
    statusValue: {
        color: COLORS.text,
        fontSize: 18,
        fontWeight: '700',
    },
    countdownBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(245, 158, 11, 0.1)',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 12,
    },
    countdownText: {
        color: COLORS.warning,
        fontSize: 12,
        fontWeight: '600',
        marginLeft: 6,
    },
    progressBarBg: {
        height: 8,
        backgroundColor: COLORS.border,
        borderRadius: 4,
        marginBottom: 8,
    },
    progressBarFill: {
        height: '100%',
        borderRadius: 4,
    },
    progressText: {
        color: COLORS.textMuted,
        fontSize: 10,
        textAlign: 'right',
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: COLORS.text,
        marginBottom: 16,
    },
    memberRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: COLORS.cardBg,
        padding: 16,
        borderRadius: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
    },
    memberInfo: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    memberAvatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        marginRight: 12,
    },
    memberName: {
        color: COLORS.text,
        fontWeight: '600',
        fontSize: 14,
    },
    memberRole: {
        color: COLORS.textMuted,
        fontSize: 12,
    },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 12,
        borderWidth: 1,
    },
    statusPaid: {
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        borderColor: 'rgba(16, 185, 129, 0.2)',
    },
    statusPending: {
        backgroundColor: 'rgba(245, 158, 11, 0.1)',
        borderColor: 'rgba(245, 158, 11, 0.2)',
    },
    statusText: {
        fontSize: 12,
        fontWeight: '600',
        marginLeft: 4,
    },
    payBtn: {
        marginTop: 16,
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
    },
    payGradient: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 18,
        borderRadius: 24,
    },
    payBtnText: {
        color: COLORS.white,
        fontSize: 16,
        fontWeight: '700',
        marginRight: 8,
    },
});
