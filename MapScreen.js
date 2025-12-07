import React, { useState } from 'react';
import {
    StyleSheet,
    Text,
    View,
    TouchableOpacity,
    SafeAreaView,
    Dimensions,
    ScrollView,
    Platform,
} from 'react-native';
import { ArrowLeft, MapPin, ShoppingBag, Coffee, Star, CreditCard, Home, Dumbbell, Smartphone, Music, Navigation } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS } from './constants';

// DayraPay Partner Stores (BNPL enabled)
const MARKERS = [
    // BNPL Partners
    {
        id: 1,
        title: 'Marjane',
        description: 'BNPL Partner - Split in 4',
        coordinate: { latitude: 33.5780, longitude: -7.6050 },
        type: 'bnpl',
        icon: ShoppingBag,
        color: '#22C55E',
        products: ['Groceries', 'Electronics', 'Home'],
        address: 'Bd Zerktouni, Casablanca',
    },
    {
        id: 2,
        title: 'Zara',
        description: 'BNPL Partner - Split in 4',
        coordinate: { latitude: 33.5731, longitude: -7.5898 },
        type: 'bnpl',
        icon: ShoppingBag,
        color: '#22C55E',
        products: ['Fashion', 'Accessories'],
        address: 'Morocco Mall, Casablanca',
    },
    {
        id: 3,
        title: 'Ikea',
        description: 'BNPL Partner - Split in 4',
        coordinate: { latitude: 33.5650, longitude: -7.6100 },
        type: 'bnpl',
        icon: Home,
        color: '#22C55E',
        products: ['Furniture', 'Home Decor'],
        address: 'Zenata, Casablanca',
    },
    {
        id: 4,
        title: 'Decathlon',
        description: 'BNPL Partner - Split in 4',
        coordinate: { latitude: 33.5800, longitude: -7.5800 },
        type: 'bnpl',
        icon: Dumbbell,
        color: '#22C55E',
        products: ['Sports', 'Fitness'],
        address: 'Anfa Place, Casablanca',
    },
    {
        id: 5,
        title: 'Electroplanet',
        description: 'BNPL Partner - Split in 4',
        coordinate: { latitude: 33.5690, longitude: -7.5950 },
        type: 'bnpl',
        icon: Smartphone,
        color: '#22C55E',
        products: ['Electronics', 'Phones'],
        address: 'Ain Diab, Casablanca',
    },
    {
        id: 6,
        title: 'Virgin Megastore',
        description: 'BNPL Partner - Split in 4',
        coordinate: { latitude: 33.5720, longitude: -7.6020 },
        type: 'bnpl',
        icon: Music,
        color: '#22C55E',
        products: ['Entertainment', 'Games'],
        address: 'Morocco Mall, Casablanca',
    },
    // Regular DayraPay Merchants
    {
        id: 7,
        title: 'Café La Presse',
        description: 'DayraPay Accepted',
        coordinate: { latitude: 33.5750, longitude: -7.5850 },
        type: 'dayrapay',
        icon: Coffee,
        color: COLORS.primary,
        address: 'Bd Hassan II, Casablanca',
    },
    {
        id: 8,
        title: 'Hanout Ahmed',
        description: 'DayraPay Accepted',
        coordinate: { latitude: 33.5710, longitude: -7.5950 },
        type: 'dayrapay',
        icon: MapPin,
        color: COLORS.primary,
        address: 'Derb Sultan, Casablanca',
    },
    {
        id: 9,
        title: 'Burger King',
        description: 'DayraPay Accepted - 5% Cashback',
        coordinate: { latitude: 33.5760, longitude: -7.6000 },
        type: 'cashback',
        icon: Coffee,
        color: '#F37021',
        address: 'Maarif, Casablanca',
    },
    {
        id: 10,
        title: 'McDonald\'s',
        description: 'DayraPay Accepted',
        coordinate: { latitude: 33.5680, longitude: -7.5880 },
        type: 'dayrapay',
        icon: Coffee,
        color: COLORS.primary,
        address: 'Bd Anfa, Casablanca',
    },
];

const { width, height } = Dimensions.get('window');

// Web-compatible Map component (list view)
function WebMapView({ markers, onMarkerPress, selectedMarker }) {
    return (
        <View style={webStyles.mapContainer}>
            <View style={webStyles.mapPlaceholder}>
                <MapPin size={48} color={COLORS.primary} />
                <Text style={webStyles.mapPlaceholderTitle}>DayraPay Stores</Text>
                <Text style={webStyles.mapPlaceholderSubtitle}>Casablanca, Morocco</Text>
            </View>
            <ScrollView style={webStyles.storeList} showsVerticalScrollIndicator={false}>
                {markers.map((marker) => (
                    <TouchableOpacity
                        key={marker.id}
                        style={[
                            webStyles.storeCard,
                            selectedMarker?.id === marker.id && webStyles.storeCardSelected
                        ]}
                        onPress={() => onMarkerPress(marker)}
                    >
                        <View style={[webStyles.storeIcon, { backgroundColor: marker.color }]}>
                            <marker.icon size={20} color="#FFFFFF" />
                        </View>
                        <View style={webStyles.storeInfo}>
                            <Text style={webStyles.storeName}>{marker.title}</Text>
                            <Text style={webStyles.storeDesc}>{marker.description}</Text>
                            {marker.address && (
                                <View style={webStyles.addressRow}>
                                    <Navigation size={12} color={COLORS.textMuted} />
                                    <Text style={webStyles.storeAddress}>{marker.address}</Text>
                                </View>
                            )}
                        </View>
                        {marker.type === 'bnpl' && (
                            <View style={webStyles.bnplBadge}>
                                <Text style={webStyles.bnplBadgeText}>BNPL</Text>
                            </View>
                        )}
                    </TouchableOpacity>
                ))}
            </ScrollView>
        </View>
    );
}

// Native Map component (with react-native-maps)
let NativeMapView = null;
if (Platform.OS !== 'web') {
    const MapViewNative = require('react-native-maps').default;
    const { Marker } = require('react-native-maps');

    NativeMapView = ({ markers, onMarkerPress }) => (
        <MapViewNative
            style={styles.map}
            initialRegion={{
                latitude: 33.5731,
                longitude: -7.5898,
                latitudeDelta: 0.04,
                longitudeDelta: 0.04,
            }}
        >
            {markers.map((marker) => (
                <Marker
                    key={marker.id}
                    coordinate={marker.coordinate}
                    title={marker.title}
                    description={marker.description}
                    onPress={() => onMarkerPress(marker)}
                >
                    <View style={[styles.markerBg, { backgroundColor: marker.color }]}>
                        <marker.icon size={16} color={COLORS.white} />
                    </View>
                </Marker>
            ))}
        </MapViewNative>
    );
}

export default function MapScreen({ navigation }) {
    const [filter, setFilter] = useState('all');
    const [selectedMarker, setSelectedMarker] = useState(null);

    const filteredMarkers = MARKERS.filter(m => filter === 'all' || m.type === filter);

    const handleMarkerPress = (marker) => {
        setSelectedMarker(marker);
    };

    return (
        <View style={styles.container}>
            {Platform.OS === 'web' ? (
                <WebMapView
                    markers={filteredMarkers}
                    onMarkerPress={handleMarkerPress}
                    selectedMarker={selectedMarker}
                />
            ) : (
                NativeMapView && (
                    <NativeMapView
                        markers={filteredMarkers}
                        onMarkerPress={handleMarkerPress}
                    />
                )
            )}

            <SafeAreaView style={styles.overlay}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                        <ArrowLeft color="#1E293B" size={24} />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>DayraPay Stores</Text>
                    <View style={{ width: 40 }} />
                </View>

                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
                    <View style={styles.filterContainer}>
                        <TouchableOpacity
                            style={[styles.filterChip, filter === 'all' && styles.activeChip]}
                            onPress={() => setFilter('all')}
                        >
                            <Text style={[styles.chipText, filter === 'all' && styles.activeChipText]}>All</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.filterChip, filter === 'bnpl' && styles.activeChip, { backgroundColor: filter === 'bnpl' ? '#22C55E' : 'rgba(255, 255, 255, 0.95)' }]}
                            onPress={() => setFilter('bnpl')}
                        >
                            <CreditCard size={14} color={filter === 'bnpl' ? COLORS.white : COLORS.textMuted} style={{ marginRight: 4 }} />
                            <Text style={[styles.chipText, filter === 'bnpl' && styles.activeChipText]}>BNPL Partners</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.filterChip, filter === 'dayrapay' && styles.activeChip]}
                            onPress={() => setFilter('dayrapay')}
                        >
                            <MapPin size={14} color={filter === 'dayrapay' ? COLORS.white : COLORS.textMuted} style={{ marginRight: 4 }} />
                            <Text style={[styles.chipText, filter === 'dayrapay' && styles.activeChipText]}>DayraPay</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.filterChip, filter === 'cashback' && styles.activeChip, { backgroundColor: filter === 'cashback' ? '#F37021' : 'rgba(255, 255, 255, 0.95)' }]}
                            onPress={() => setFilter('cashback')}
                        >
                            <Star size={14} color={filter === 'cashback' ? COLORS.white : COLORS.textMuted} style={{ marginRight: 4 }} />
                            <Text style={[styles.chipText, filter === 'cashback' && styles.activeChipText]}>Cashback</Text>
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            </SafeAreaView>

            {Platform.OS !== 'web' && (
                <View style={styles.bottomCard}>
                    <LinearGradient
                        colors={['#FFFFFF', '#F3E8FF']}
                        style={styles.bottomContent}
                    >
                        {selectedMarker ? (
                            <>
                                <View style={styles.selectedHeader}>
                                    <View style={[styles.selectedIcon, { backgroundColor: selectedMarker.color }]}>
                                        <selectedMarker.icon size={24} color={COLORS.white} />
                                    </View>
                                    <View style={styles.selectedInfo}>
                                        <Text style={styles.bottomTitle}>{selectedMarker.title}</Text>
                                        <Text style={styles.bottomSubtitle}>{selectedMarker.description}</Text>
                                    </View>
                                </View>
                                {selectedMarker.type === 'bnpl' && (
                                    <TouchableOpacity
                                        style={styles.shopBtn}
                                        onPress={() => navigation.navigate('Shop')}
                                    >
                                        <Text style={styles.shopBtnText}>Shop Now - Split in 4</Text>
                                    </TouchableOpacity>
                                )}
                            </>
                        ) : (
                            <>
                                <Text style={styles.bottomTitle}>Discover DayraPay</Text>
                                <Text style={styles.bottomSubtitle}>Find BNPL partner stores to split purchases in 4, or merchants accepting DayraPay.</Text>
                            </>
                        )}
                    </LinearGradient>
                </View>
            )}
        </View>
    );
}

const webStyles = StyleSheet.create({
    mapContainer: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    mapPlaceholder: {
        backgroundColor: '#F3E8FF',
        padding: 32,
        alignItems: 'center',
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(202, 183, 235, 0.3)',
    },
    mapPlaceholderTitle: {
        fontSize: 24,
        fontWeight: '700',
        color: '#1E293B',
        marginTop: 12,
    },
    mapPlaceholderSubtitle: {
        fontSize: 14,
        color: '#64748B',
        marginTop: 4,
    },
    storeList: {
        flex: 1,
        padding: 16,
    },
    storeCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        padding: 16,
        borderRadius: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: 'rgba(202, 183, 235, 0.3)',
    },
    storeCardSelected: {
        borderColor: COLORS.primary,
        backgroundColor: '#F3E8FF',
    },
    storeIcon: {
        width: 44,
        height: 44,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    storeInfo: {
        flex: 1,
    },
    storeName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1E293B',
        marginBottom: 2,
    },
    storeDesc: {
        fontSize: 13,
        color: '#64748B',
    },
    addressRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 4,
    },
    storeAddress: {
        fontSize: 12,
        color: '#94A3B8',
        marginLeft: 4,
    },
    bnplBadge: {
        backgroundColor: '#22C55E',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
    },
    bnplBadgeText: {
        color: '#FFFFFF',
        fontSize: 10,
        fontWeight: '700',
    },
});

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    map: {
        width: width,
        height: height,
    },
    overlay: {
        position: Platform.OS === 'web' ? 'relative' : 'absolute',
        top: 0,
        left: 0,
        right: 0,
        backgroundColor: Platform.OS === 'web' ? COLORS.background : 'transparent',
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
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1E293B',
        backgroundColor: Platform.OS === 'web' ? 'transparent' : 'rgba(255, 255, 255, 0.9)',
        paddingHorizontal: Platform.OS === 'web' ? 0 : 16,
        paddingVertical: Platform.OS === 'web' ? 0 : 8,
        borderRadius: 20,
        overflow: 'hidden',
    },
    filterContainer: {
        flexDirection: 'row',
        paddingHorizontal: 24,
        marginTop: 8,
    },
    filterScroll: {
        marginTop: 8,
    },
    filterChip: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 20,
        marginRight: 12,
        borderWidth: 1,
        borderColor: 'rgba(202, 183, 235, 0.3)',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    activeChip: {
        backgroundColor: COLORS.primary,
        borderColor: COLORS.primary,
    },
    chipText: {
        color: '#64748B',
        fontSize: 14,
        fontWeight: '600',
    },
    activeChipText: {
        color: COLORS.white,
    },
    markerBg: {
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 3,
        borderColor: COLORS.white,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 4,
    },
    bottomCard: {
        position: 'absolute',
        bottom: 40,
        left: 24,
        right: 24,
        borderRadius: 24,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
        elevation: 8,
    },
    bottomContent: {
        padding: 24,
        backgroundColor: 'rgba(255, 255, 255, 0.98)',
    },
    bottomTitle: {
        color: '#1E293B',
        fontSize: 18,
        fontWeight: '700',
        marginBottom: 4,
    },
    bottomSubtitle: {
        color: '#64748B',
        fontSize: 14,
    },
    selectedHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    selectedIcon: {
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    selectedInfo: {
        flex: 1,
    },
    shopBtn: {
        backgroundColor: '#22C55E',
        paddingVertical: 14,
        borderRadius: 12,
        alignItems: 'center',
    },
    shopBtnText: {
        color: COLORS.white,
        fontWeight: '700',
        fontSize: 16,
    },
});
