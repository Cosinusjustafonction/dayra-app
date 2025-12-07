import React, { useState } from 'react';
import {
    StyleSheet,
    Text,
    View,
    ScrollView,
    TouchableOpacity,
    SafeAreaView,
    Image,
} from 'react-native';
import { ArrowLeft, MapPin, Clock, Briefcase, ShieldCheck, ScanLine, Star } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS } from './constants';

const USER_PROFILE = {
    specialty: 'IT', // Smart Profiling
    trustScore: 82,
    level: 3,
};

const GIGS = [
    {
        id: 1,
        title: 'React Native Dev Fix',
        company: 'Startup Studio',
        location: 'Remote',
        reward: 800,
        type: 'One-time',
        time: '2 days',
        gradient: ['#3B82F6', '#1D4ED8'], // Blue
        category: 'IT',
        escrow: true,
    },
    {
        id: 2,
        title: 'Mystery Shopper',
        company: 'Marjane',
        location: 'Casablanca',
        reward: 150,
        type: 'One-time',
        time: '2 hours',
        gradient: ['#F59E0B', '#D97706'], // Amber
        category: 'General',
        escrow: true,
    },
    {
        id: 3,
        title: 'Brand Ambassador',
        company: 'Red Bull',
        location: 'Rabat',
        reward: 400,
        type: 'Weekend',
        time: '4 hours',
        gradient: ['#EF4444', '#B91C1C'], // Red
        category: 'Marketing',
        escrow: false,
    },
];

const TAGS = ['Recommended', 'IT Missions', 'Weekend', 'Remote'];

export default function GigsScreen({ navigation }) {
    const [activeTag, setActiveTag] = useState('Recommended');

    // Smart Profiling Logic
    const filteredGigs = activeTag === 'Recommended'
        ? GIGS.filter(g => g.category === USER_PROFILE.specialty || g.category === 'General')
        : GIGS;

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <ArrowLeft color={COLORS.text} size={24} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Gigs & Jobs</Text>
                <View style={{ width: 24 }} />
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                {/* Trust Score Header (EARN Module) */}
                <View style={[styles.trustCard, { backgroundColor: COLORS.cardBg }]}>
                    <View style={styles.trustHeader}>
                        <View>
                            <Text style={styles.trustLabel}>Trust Score</Text>
                            <Text style={styles.trustScore}>{USER_PROFILE.trustScore}/100</Text>
                        </View>
                        <View style={styles.levelBadge}>
                            <Star size={16} color={COLORS.primary} fill={COLORS.primary} />
                            <Text style={styles.levelText}>Level {USER_PROFILE.level}</Text>
                        </View>
                    </View>
                    <View style={styles.trustFooter}>
                        <Text style={styles.trustDesc}>"Freelance Vérifié"</Text>
                        <TouchableOpacity style={styles.exportBtn}>
                            <Text style={styles.exportText}>Export CV</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                <View style={styles.tagsContainer}>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tagsScroll}>
                        {TAGS.map((tag) => (
                            <TouchableOpacity
                                key={tag}
                                style={[styles.tag, activeTag === tag && styles.activeTag]}
                                onPress={() => setActiveTag(tag)}
                            >
                                <Text style={[styles.tagText, activeTag === tag && styles.activeTagText]}>{tag}</Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </View>

                <Text style={styles.sectionTitle}>Available Missions</Text>

                {filteredGigs.map((gig) => (
                    <TouchableOpacity key={gig.id} activeOpacity={0.9}>
                        <View style={[styles.gigCard, { backgroundColor: COLORS.cardBg }]}>
                            <View style={styles.gigHeader}>
                                <LinearGradient
                                    colors={gig.gradient}
                                    style={styles.logoContainer}
                                >
                                    <Briefcase color={COLORS.white} size={20} />
                                </LinearGradient>
                                <View style={styles.gigInfo}>
                                    <Text style={styles.gigTitle}>{gig.title}</Text>
                                    <Text style={styles.gigCompany}>{gig.company}</Text>
                                </View>
                                <View style={styles.rewardBadge}>
                                    <Text style={styles.rewardText}>{gig.reward} DH</Text>
                                </View>
                            </View>

                            <View style={styles.divider} />

                            <View style={styles.gigDetails}>
                                <View style={styles.detailItem}>
                                    <MapPin size={14} color={COLORS.textMuted} />
                                    <Text style={styles.detailText}>{gig.location}</Text>
                                </View>
                                <View style={styles.detailItem}>
                                    <Clock size={14} color={COLORS.textMuted} />
                                    <Text style={styles.detailText}>{gig.time}</Text>
                                </View>
                            </View>

                            {/* Escrow & Scan Actions */}
                            <View style={styles.cardFooter}>
                                {gig.escrow && (
                                    <View style={styles.escrowBadge}>
                                        <ShieldCheck size={14} color={COLORS.green} />
                                        <Text style={styles.escrowText}>Funds Secured</Text>
                                    </View>
                                )}
                                <TouchableOpacity style={styles.scanAction}>
                                    <ScanLine size={16} color={COLORS.primary} />
                                    <Text style={styles.scanText}>Scan to Start</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </TouchableOpacity>
                ))}
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
        borderRadius: 12,
        backgroundColor: COLORS.cardBg,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: COLORS.text,
    },
    content: {
        paddingHorizontal: 20,
    },
    // Trust Score Card
    trustCard: {
        padding: 20,
        borderRadius: 20,
        marginBottom: 24,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    trustHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 16,
    },
    trustLabel: {
        color: COLORS.textMuted,
        fontSize: 12,
        marginBottom: 4,
    },
    trustScore: {
        color: COLORS.text,
        fontSize: 32,
        fontWeight: '800',
    },
    levelBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(243, 112, 33, 0.1)',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: COLORS.primary,
    },
    levelText: {
        color: COLORS.primary,
        fontWeight: '700',
        marginLeft: 6,
    },
    trustFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    trustDesc: {
        color: COLORS.green,
        fontWeight: '600',
    },
    exportBtn: {
        backgroundColor: COLORS.cardBg,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 8,
    },
    exportText: {
        color: COLORS.textMuted,
        fontSize: 12,
    },
    // Tags
    tagsContainer: {
        marginBottom: 24,
    },
    tagsScroll: {
        paddingRight: 20,
    },
    tag: {
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 20,
        backgroundColor: COLORS.cardBg,
        marginRight: 12,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
    },
    activeTag: {
        backgroundColor: COLORS.primary,
        borderColor: COLORS.primary,
    },
    tagText: {
        fontSize: 14,
        color: COLORS.textMuted,
        fontWeight: '600',
    },
    activeTagText: {
        color: COLORS.white,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: COLORS.text,
        marginBottom: 20,
    },
    // Gig Card
    gigCard: {
        borderRadius: 24,
        padding: 20,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
    },
    gigHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    logoContainer: {
        width: 48,
        height: 48,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    gigInfo: {
        flex: 1,
    },
    gigTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: COLORS.text,
        marginBottom: 4,
    },
    gigCompany: {
        fontSize: 14,
        color: COLORS.textMuted,
    },
    rewardBadge: {
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'rgba(16, 185, 129, 0.2)',
    },
    rewardText: {
        color: COLORS.green,
        fontWeight: '700',
        fontSize: 14,
    },
    divider: {
        height: 1,
        backgroundColor: COLORS.border,
        marginBottom: 16,
    },
    gigDetails: {
        flexDirection: 'row',
        alignItems: 'center',
        flexWrap: 'wrap',
        marginBottom: 16,
    },
    detailItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginRight: 16,
    },
    detailText: {
        fontSize: 12,
        color: COLORS.textMuted,
        marginLeft: 6,
    },
    cardFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    escrowBadge: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    escrowText: {
        color: COLORS.green,
        fontSize: 12,
        marginLeft: 6,
        fontWeight: '500',
    },
    scanAction: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    scanText: {
        color: COLORS.primary,
        fontSize: 12,
        fontWeight: '700',
        marginLeft: 6,
    },
});
