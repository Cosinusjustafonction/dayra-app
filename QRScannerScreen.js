import React, { useState, useEffect } from 'react';
import {
    StyleSheet,
    Text,
    View,
    SafeAreaView,
    TouchableOpacity,
    Dimensions,
    StatusBar,
} from 'react-native';
import { X, Zap, QrCode } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS } from './constants';
import { simulateMerchantPayment, getMerchantPaymentOTP, confirmMerchantPayment, getCurrentUser } from './api';

const { width, height } = Dimensions.get('window');


export default function QRScannerScreen({ navigation }) {
    const [hasPermission, setHasPermission] = useState(null);
    const [scanned, setScanned] = useState(false);

    // Mock permission and scanning simulation
    useEffect(() => {
        setTimeout(() => {
            setHasPermission(true);
        }, 500);
    }, []);

    const handleSimulateScan = () => {
        setScanned(true);
        setTimeout(() => {
            alert('Payment Successful! 250 DH sent to Venezia Ice.');
            navigation.goBack();
        }, 1000);
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" />

            {/* Mock Camera View */}
            <View style={styles.cameraView}>
                <Text style={styles.cameraPlaceholder}>Camera Active</Text>
            </View>

            {/* Overlay */}
            <View style={styles.overlay}>
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.closeBtn}>
                        <X color={COLORS.white} size={24} />
                    </TouchableOpacity>
                    <Text style={styles.title}>Scan to Pay</Text>
                    <View style={{ width: 40 }} />
                </View>

                {/* Scanner Frame */}
                <View style={styles.scanFrameContainer}>
                    <View style={styles.scanFrame}>
                        <View style={[styles.corner, styles.topLeft]} />
                        <View style={[styles.corner, styles.topRight]} />
                        <View style={[styles.corner, styles.bottomLeft]} />
                        <View style={[styles.corner, styles.bottomRight]} />

                        {/* Scanning Animation Line (Static for now) */}
                        <LinearGradient
                            colors={['transparent', COLORS.primary, 'transparent']}
                            style={styles.scanLine}
                        />
                    </View>
                    <Text style={styles.instruction}>Align QR code within the frame</Text>
                </View>

                {/* Footer Actions */}
                <View style={styles.footer}>
                    <TouchableOpacity style={styles.simulateBtn} onPress={handleSimulateScan}>
                        <QrCode color={COLORS.background} size={20} />
                        <Text style={styles.simulateText}>Simulate Scan</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: 'black',
    },
    cameraView: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: '#1E293B', // Dark grey to simulate camera feed in simulator
        justifyContent: 'center',
        alignItems: 'center',
    },
    cameraPlaceholder: {
        color: '#334155',
        fontSize: 24,
        fontWeight: '700',
    },
    overlay: {
        flex: 1,
        justifyContent: 'space-between',
        paddingVertical: 40,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 24,
    },
    closeBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    title: {
        color: COLORS.white,
        fontSize: 18,
        fontWeight: '700',
    },
    scanFrameContainer: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    scanFrame: {
        width: width * 0.7,
        height: width * 0.7,
        position: 'relative',
    },
    corner: {
        position: 'absolute',
        width: 40,
        height: 40,
        borderColor: COLORS.primary,
        borderWidth: 4,
    },
    topLeft: { top: 0, left: 0, borderRightWidth: 0, borderBottomWidth: 0 },
    topRight: { top: 0, right: 0, borderLeftWidth: 0, borderBottomWidth: 0 },
    bottomLeft: { bottom: 0, left: 0, borderRightWidth: 0, borderTopWidth: 0 },
    bottomRight: { bottom: 0, right: 0, borderLeftWidth: 0, borderTopWidth: 0 },
    scanLine: {
        width: '100%',
        height: 2,
        position: 'absolute',
        top: '50%',
    },
    instruction: {
        color: COLORS.white,
        marginTop: 24,
        fontSize: 16,
        fontWeight: '500',
        opacity: 0.8,
    },
    footer: {
        paddingHorizontal: 24,
        alignItems: 'center',
    },
    simulateBtn: {
        flexDirection: 'row',
        backgroundColor: COLORS.white,
        paddingHorizontal: 24,
        paddingVertical: 16,
        borderRadius: 30,
        alignItems: 'center',
    },
    simulateText: {
        color: COLORS.background,
        fontWeight: '700',
        marginLeft: 8,
    },
});
