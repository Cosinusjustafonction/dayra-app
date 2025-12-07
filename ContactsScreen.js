import React, { useState, useEffect } from 'react';
import {
    StyleSheet,
    Text,
    View,
    TouchableOpacity,
    SafeAreaView,
    ScrollView,
    TextInput,
    Image,
} from 'react-native';
import { ArrowLeft, Search, Plus, User, Heart, Home, Briefcase, Star } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS } from './constants';
import { getDemoUsers, getCurrentUser } from './api';


const LABELS = [
    { id: 'family', label: 'Family', icon: Home, color: '#F37021' },
    { id: 'friend', label: 'Best Friend', icon: Heart, color: '#EC4899' },
    { id: 'work', label: 'Work', icon: Briefcase, color: '#38B2AC' },
    { id: 'other', label: 'Other', icon: User, color: '#94A3B8' },
];

const INITIAL_CONTACTS = [
    { id: 1, name: 'Amine', phone: '+212 600-000000', label: 'friend', avatar: 'https://i.pravatar.cc/150?u=amine' },
    { id: 2, name: 'Sarah', phone: '+212 611-111111', label: 'family', avatar: 'https://i.pravatar.cc/150?u=sarah' },
    { id: 3, name: 'Karim', phone: '+212 622-222222', label: 'work', avatar: 'https://i.pravatar.cc/150?u=karim' },
];

export default function ContactsScreen({ navigation }) {
    const [contacts, setContacts] = useState(INITIAL_CONTACTS);
    const [searchQuery, setSearchQuery] = useState('');
    const [showAddModal, setShowAddModal] = useState(false); // Simplified for this demo

    const filteredContacts = contacts.filter(c =>
        c.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const getLabelIcon = (labelId) => {
        const label = LABELS.find(l => l.id === labelId);
        return label ? label.icon : User;
    };

    const getLabelColor = (labelId) => {
        const label = LABELS.find(l => l.id === labelId);
        return label ? label.color : COLORS.textMuted;
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <ArrowLeft color={COLORS.text} size={24} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>My Contacts</Text>
                <TouchableOpacity style={styles.addBtn}>
                    <Plus color={COLORS.white} size={24} />
                </TouchableOpacity>
            </View>

            <View style={styles.searchContainer}>
                <Search color={COLORS.textMuted} size={20} style={styles.searchIcon} />
                <TextInput
                    style={styles.searchInput}
                    placeholder="Search contacts..."
                    placeholderTextColor={COLORS.textMuted}
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                />
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                <Text style={styles.sectionTitle}>All Contacts</Text>

                {filteredContacts.map((contact) => {
                    const LabelIcon = getLabelIcon(contact.label);
                    const labelColor = getLabelColor(contact.label);

                    return (
                        <TouchableOpacity
                            key={contact.id}
                            style={styles.contactRow}
                            onPress={() => navigation.navigate('ContactDetails', { contact })}
                        >
                            <Image source={{ uri: contact.avatar }} style={styles.avatar} />
                            <View style={styles.contactInfo}>
                                <Text style={styles.contactName}>{contact.name}</Text>
                                <Text style={styles.contactPhone}>{contact.phone}</Text>
                            </View>

                            {contact.label && (
                                <View style={[styles.labelBadge, { backgroundColor: `${labelColor}20`, borderColor: `${labelColor}40` }]}>
                                    <LabelIcon size={12} color={labelColor} style={{ marginRight: 4 }} />
                                    <Text style={[styles.labelText, { color: labelColor }]}>
                                        {LABELS.find(l => l.id === contact.label)?.label}
                                    </Text>
                                </View>
                            )}
                        </TouchableOpacity>
                    );
                })}
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
    backBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: COLORS.cardBg,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: COLORS.text,
    },
    addBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: COLORS.primary,
        justifyContent: 'center',
        alignItems: 'center',
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.cardBg,
        marginHorizontal: 24,
        marginBottom: 24,
        borderRadius: 12,
        paddingHorizontal: 16,
        height: 48,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
    },
    searchIcon: {
        marginRight: 12,
    },
    searchInput: {
        flex: 1,
        color: COLORS.text,
        fontSize: 16,
    },
    content: {
        paddingHorizontal: 24,
    },
    sectionTitle: {
        color: COLORS.textMuted,
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 16,
    },
    contactRow: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.cardBg,
        padding: 16,
        borderRadius: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
    },
    avatar: {
        width: 48,
        height: 48,
        borderRadius: 24,
        marginRight: 16,
    },
    contactInfo: {
        flex: 1,
    },
    contactName: {
        color: COLORS.text,
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 4,
    },
    contactPhone: {
        color: COLORS.textMuted,
        fontSize: 14,
    },
    labelBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 20,
        borderWidth: 1,
    },
    labelText: {
        fontSize: 12,
        fontWeight: '600',
    },
});
