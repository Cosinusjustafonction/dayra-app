import React, { useState, useEffect } from 'react';
import {
    StyleSheet,
    Text,
    View,
    ScrollView,
    Image,
    TouchableOpacity,
    SafeAreaView,
    Dimensions,
    StatusBar,
    Modal,
    Alert,
    ActivityIndicator
} from 'react-native';
import { ShoppingBag, CreditCard, Clock, CheckCircle, AlertCircle, ChevronRight, X, User, TrendingUp, ArrowLeft } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { getAffiliatedStores, getBnplPlans, createBnplPlan, payBnplInstallment, getCurrentUser, getCreditScore } from './api';
import { COLORS } from './constants';

const { width } = Dimensions.get('window');

export default function ShopScreen({ navigation }) {
    const [stores, setStores] = useState([]);
    const [plans, setPlans] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedStore, setSelectedStore] = useState(null);
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [storeModalVisible, setStoreModalVisible] = useState(false);
    const [purchaseModalVisible, setPurchaseModalVisible] = useState(false);
    const [profileModalVisible, setProfileModalVisible] = useState(false);
    const [creditScore, setCreditScore] = useState(null);
    const [isProcessing, setIsProcessing] = useState(false);

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const user = getCurrentUser();
            const [storesData, plansData] = await Promise.all([
                getAffiliatedStores(),
                getBnplPlans(user.id)
            ]);

            if (storesData.result) setStores(storesData.result);
            if (plansData.result) setPlans(plansData.result);
        } catch (error) {
            console.error('Error fetching shop data:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const fetchCreditScore = async () => {
        try {
            const user = getCurrentUser();
            const response = await getCreditScore(user.phoneNumber);
            if (response.result) {
                setCreditScore(response.result);
            }
        } catch (error) {
            // Fallback credit score
            setCreditScore({
                score: 720,
                grade: 'Good',
                factors: {
                    payment_history: 85,
                    credit_utilization: 30,
                    account_age: 60,
                    transaction_diversity: 75,
                    social_trust: 80,
                    bnpl_reliability: 70
                },
                insights: ['Good transaction history', 'Healthy account balance', 'Try BNPL to build credit history'],
                eligible: { credit_card: true, personal_loan: true, bnpl_limit: 36000 }
            });
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleStorePress = (store) => {
        setSelectedStore(store);
        setStoreModalVisible(true);
    };

    const handleProductPress = (product) => {
        setSelectedProduct(product);
        setStoreModalVisible(false);
        setPurchaseModalVisible(true);
    };

    const handleProfilePress = async () => {
        await fetchCreditScore();
        setProfileModalVisible(true);
    };

    const handlePurchase = async () => {
        if (!selectedProduct) return;

        setIsProcessing(true);
        try {
            const user = getCurrentUser();
            const response = await createBnplPlan(user.id, selectedStore.id, selectedProduct.price);

            if (response.result?.success) {
                Alert.alert('Success', `${selectedProduct.name} purchased! You paid ${(selectedProduct.price / 4).toFixed(2)} DH today.`);
                setPurchaseModalVisible(false);
                setSelectedProduct(null);
                fetchData();
            } else {
                Alert.alert('Error', 'Purchase failed. Please try again.');
            }
        } catch (error) {
            Alert.alert('Error', 'Something went wrong.');
        } finally {
            setIsProcessing(false);
        }
    };

    const handlePayInstallment = async (plan) => {
        Alert.alert(
            'Pay Installment',
            `Pay ${(plan.total_amount / plan.total_installments).toFixed(2)} DH?`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Pay',
                    onPress: async () => {
                        try {
                            const response = await payBnplInstallment(plan.id);
                            if (response.result?.success) {
                                Alert.alert('Success', 'Installment paid successfully!');
                                fetchData();
                            }
                        } catch (error) {
                            Alert.alert('Error', 'Payment failed.');
                        }
                    }
                }
            ]
        );
    };

    const getScoreColor = (score) => {
        if (score >= 750) return '#10B981';
        if (score >= 700) return '#3B82F6';
        if (score >= 650) return '#F59E0B';
        return '#EF4444';
    };

    const renderPlanCard = (plan) => {
        const installmentAmount = (plan.total_amount / plan.total_installments).toFixed(2);
        const progress = plan.installments_paid / plan.total_installments;
        const isCompleted = plan.status === 'completed';

        return (
            <View key={plan.id} style={styles.planCard}>
                <View style={styles.planHeader}>
                    <View style={styles.planStoreInfo}>
                        <Image source={{ uri: plan.store_logo }} style={styles.planStoreLogo} />
                        <View>
                            <Text style={styles.planStoreName}>{plan.store_name}</Text>
                            <Text style={styles.planDate}>{new Date(plan.created_at).toLocaleDateString()}</Text>
                        </View>
                    </View>
                    <View style={[styles.statusBadge, isCompleted ? styles.statusCompleted : styles.statusActive]}>
                        <Text style={[styles.statusText, isCompleted ? styles.statusTextCompleted : styles.statusTextActive]}>
                            {isCompleted ? 'Paid' : `${plan.installments_paid}/${plan.total_installments}`}
                        </Text>
                    </View>
                </View>

                <View style={styles.planDetails}>
                    <View>
                        <Text style={styles.planLabel}>Total</Text>
                        <Text style={styles.planValue}>{plan.total_amount.toFixed(2)} DH</Text>
                    </View>
                    <View>
                        <Text style={styles.planLabel}>Remaining</Text>
                        <Text style={styles.planValue}>{(plan.total_amount - plan.paid_amount).toFixed(2)} DH</Text>
                    </View>
                </View>

                <View style={styles.progressContainer}>
                    <View style={[styles.progressBar, { width: `${progress * 100}%` }]} />
                </View>

                {!isCompleted && (
                    <TouchableOpacity
                        style={styles.payButton}
                        onPress={() => handlePayInstallment(plan)}
                    >
                        <Text style={styles.payButtonText}>Pay Next: {installmentAmount} DH</Text>
                        <ChevronRight size={16} color={COLORS.white} />
                    </TouchableOpacity>
                )}
            </View>
        );
    };

    return (
        <LinearGradient
            colors={[COLORS.background, '#EDE9FE', COLORS.background]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.container}
        >
            <SafeAreaView style={{ flex: 1 }}>
                <StatusBar barStyle="dark-content" />

                <View style={styles.header}>
                    <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
                        <ArrowLeft color={COLORS.text} size={24} />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Shop & Split</Text>
                    <TouchableOpacity style={styles.iconBtn} onPress={handleProfilePress}>
                        <User color={COLORS.text} size={24} />
                    </TouchableOpacity>
                </View>

                <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

                    {/* Active Plans Section */}
                    {plans.length > 0 && (
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>My Plans</Text>
                            {plans.map(renderPlanCard)}
                        </View>
                    )}

                    {/* Affiliated Stores Grid */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Partner Stores</Text>
                        <Text style={styles.sectionSubtitle}>Buy now, pay in 4 installments. 0% interest.</Text>

                        <View style={styles.storesGrid}>
                            {stores.map(store => (
                                <TouchableOpacity
                                    key={store.id}
                                    style={styles.storeCard}
                                    onPress={() => handleStorePress(store)}
                                >
                                    <View style={styles.storeLogoContainer}>
                                        <Image source={{ uri: store.logo }} style={styles.storeLogo} resizeMode="contain" />
                                    </View>
                                    <Text style={styles.storeName}>{store.name}</Text>
                                    <Text style={styles.storeCategory}>{store.category}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>

                </ScrollView>

                {/* Store Products Modal */}
                <Modal
                    animationType="slide"
                    transparent={true}
                    visible={storeModalVisible}
                    onRequestClose={() => setStoreModalVisible(false)}
                >
                    <View style={styles.modalOverlay}>
                        <View style={styles.modalView}>
                            <View style={styles.modalHeader}>
                                <Text style={styles.modalTitle}>{selectedStore?.name}</Text>
                                <TouchableOpacity onPress={() => setStoreModalVisible(false)}>
                                    <X color={COLORS.text} size={24} />
                                </TouchableOpacity>
                            </View>

                            <ScrollView showsVerticalScrollIndicator={false}>
                                <Text style={styles.productsTitle}>Available Products</Text>
                                {selectedStore?.products?.map(product => (
                                    <TouchableOpacity
                                        key={product.id}
                                        style={styles.productCard}
                                        onPress={() => handleProductPress(product)}
                                    >
                                        <Image
                                            source={{ uri: product.image }}
                                            style={styles.productImage}
                                            resizeMode="cover"
                                        />
                                        <View style={styles.productInfo}>
                                            <Text style={styles.productName}>{product.name}</Text>
                                            <Text style={styles.productPrice}>{product.price} DH</Text>
                                        </View>
                                        <View style={styles.splitBadge}>
                                            <Text style={styles.splitBadgeText}>{(product.price / 4).toFixed(0)} x4</Text>
                                        </View>
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>
                        </View>
                    </View>
                </Modal>

                {/* Purchase Confirmation Modal */}
                <Modal
                    animationType="slide"
                    transparent={true}
                    visible={purchaseModalVisible}
                    onRequestClose={() => setPurchaseModalVisible(false)}
                >
                    <View style={styles.modalOverlay}>
                        <View style={styles.modalView}>
                            <View style={styles.modalHeader}>
                                <Text style={styles.modalTitle}>Checkout</Text>
                                <TouchableOpacity onPress={() => setPurchaseModalVisible(false)}>
                                    <X color={COLORS.text} size={24} />
                                </TouchableOpacity>
                            </View>

                            <View style={styles.modalContent}>
                                <Image
                                    source={{ uri: selectedProduct?.image }}
                                    style={styles.productImageLarge}
                                    resizeMode="cover"
                                />
                                <Text style={styles.productNameLarge}>{selectedProduct?.name}</Text>
                                <Text style={styles.productPriceLarge}>{selectedProduct?.price} DH</Text>

                                <View style={styles.breakdownContainer}>
                                    <Text style={styles.breakdownTitle}>Split in 4 Payments</Text>
                                    <View style={styles.timeline}>
                                        {[0, 1, 2, 3].map(i => (
                                            <React.Fragment key={i}>
                                                <View style={styles.timelineItem}>
                                                    <View style={[styles.timelineDot, i === 0 && styles.timelineDotActive]} />
                                                    <Text style={styles.timelineDate}>{i === 0 ? 'Today' : `+${i * 30}d`}</Text>
                                                    <Text style={styles.timelineAmount}>{(selectedProduct?.price / 4).toFixed(0)} DH</Text>
                                                </View>
                                                {i < 3 && <View style={styles.timelineLine} />}
                                            </React.Fragment>
                                        ))}
                                    </View>
                                </View>

                                <TouchableOpacity
                                    style={styles.confirmButton}
                                    onPress={handlePurchase}
                                    disabled={isProcessing}
                                >
                                    {isProcessing ? (
                                        <ActivityIndicator color={COLORS.white} />
                                    ) : (
                                        <Text style={styles.confirmButtonText}>Pay {(selectedProduct?.price / 4).toFixed(2)} DH Now</Text>
                                    )}
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                </Modal>

                {/* Profile / Credit Score Modal */}
                <Modal
                    animationType="slide"
                    transparent={true}
                    visible={profileModalVisible}
                    onRequestClose={() => setProfileModalVisible(false)}
                >
                    <View style={styles.modalOverlay}>
                        <View style={styles.modalView}>
                            <View style={styles.modalHeader}>
                                <Text style={styles.modalTitle}>My Credit Profile</Text>
                                <TouchableOpacity onPress={() => setProfileModalVisible(false)}>
                                    <X color={COLORS.text} size={24} />
                                </TouchableOpacity>
                            </View>

                            <ScrollView showsVerticalScrollIndicator={false}>
                                {/* Score Circle */}
                                <View style={styles.scoreContainer}>
                                    <View style={[styles.scoreCircle, { borderColor: getScoreColor(creditScore?.score || 0) }]}>
                                        <Text style={[styles.scoreNumber, { color: getScoreColor(creditScore?.score || 0) }]}>
                                            {creditScore?.score || '---'}
                                        </Text>
                                        <Text style={styles.scoreGrade}>{creditScore?.grade || 'Loading'}</Text>
                                    </View>
                                </View>

                                {/* Score Factors */}
                                <View style={styles.factorsContainer}>
                                    <Text style={styles.factorsTitle}>Score Factors</Text>
                                    {creditScore?.factors && Object.entries(creditScore.factors).map(([key, value]) => (
                                        <View key={key} style={styles.factorRow}>
                                            <Text style={styles.factorLabel}>{key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</Text>
                                            <View style={styles.factorBarContainer}>
                                                <View style={[styles.factorBar, { width: `${value}%` }]} />
                                            </View>
                                            <Text style={styles.factorValue}>{value}%</Text>
                                        </View>
                                    ))}
                                </View>

                                {/* Insights */}
                                <View style={styles.insightsContainer}>
                                    <Text style={styles.insightsTitle}>Insights</Text>
                                    {creditScore?.insights?.map((insight, i) => (
                                        <View key={i} style={styles.insightRow}>
                                            <TrendingUp size={16} color={COLORS.primary} />
                                            <Text style={styles.insightText}>{insight}</Text>
                                        </View>
                                    ))}
                                </View>

                                {/* Eligibility */}
                                <View style={styles.eligibilityContainer}>
                                    <Text style={styles.eligibilityTitle}>You're Eligible For</Text>
                                    <View style={styles.eligibilityCards}>
                                        <View style={[styles.eligibilityCard, !creditScore?.eligible?.credit_card && styles.eligibilityCardDisabled]}>
                                            <CreditCard size={24} color={creditScore?.eligible?.credit_card ? COLORS.primary : COLORS.textMuted} />
                                            <Text style={styles.eligibilityCardText}>Credit Card</Text>
                                        </View>
                                        <View style={[styles.eligibilityCard, !creditScore?.eligible?.personal_loan && styles.eligibilityCardDisabled]}>
                                            <ShoppingBag size={24} color={creditScore?.eligible?.personal_loan ? COLORS.primary : COLORS.textMuted} />
                                            <Text style={styles.eligibilityCardText}>Personal Loan</Text>
                                        </View>
                                    </View>
                                    <Text style={styles.bnplLimit}>BNPL Limit: {creditScore?.eligible?.bnpl_limit?.toLocaleString() || '---'} DH</Text>
                                </View>
                            </ScrollView>
                        </View>
                    </View>
                </Modal>

            </SafeAreaView>
        </LinearGradient>
    );
}


const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 24,
        paddingVertical: 16,
    },
    headerTitle: {
        fontSize: 28,
        fontWeight: '800',
        color: COLORS.text,
    },
    iconBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: COLORS.white,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    content: {
        paddingBottom: 100,
    },
    section: {
        marginBottom: 32,
        paddingHorizontal: 24,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: COLORS.text,
        marginBottom: 8,
    },
    sectionSubtitle: {
        fontSize: 14,
        color: COLORS.textMuted,
        marginBottom: 16,
    },
    storesGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
    },
    storeCard: {
        width: '48%',
        backgroundColor: COLORS.white,
        borderRadius: 16,
        padding: 16,
        marginBottom: 16,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    storeLogoContainer: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: '#F3F4F6',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 12,
        overflow: 'hidden',
    },
    storeLogo: {
        width: 40,
        height: 40,
    },
    storeName: {
        fontSize: 16,
        fontWeight: '700',
        color: COLORS.text,
        marginBottom: 4,
        textAlign: 'center',
    },
    storeCategory: {
        fontSize: 12,
        color: COLORS.textMuted,
        textAlign: 'center',
    },
    // Plan Card Styles
    planCard: {
        backgroundColor: COLORS.white,
        borderRadius: 20,
        padding: 20,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 12,
        elevation: 3,
    },
    planHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 16,
    },
    planStoreInfo: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    planStoreLogo: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#F3F4F6',
        marginRight: 12,
    },
    planStoreName: {
        fontSize: 16,
        fontWeight: '700',
        color: COLORS.text,
    },
    planDate: {
        fontSize: 12,
        color: COLORS.textMuted,
    },
    statusBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
    },
    statusActive: {
        backgroundColor: '#DBEAFE',
    },
    statusCompleted: {
        backgroundColor: '#D1FAE5',
    },
    statusText: {
        fontSize: 12,
        fontWeight: '700',
    },
    statusTextActive: {
        color: '#1E40AF',
    },
    statusTextCompleted: {
        color: '#065F46',
    },
    planDetails: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 16,
    },
    planLabel: {
        fontSize: 12,
        color: COLORS.textMuted,
        marginBottom: 4,
    },
    planValue: {
        fontSize: 16,
        fontWeight: '700',
        color: COLORS.text,
    },
    progressContainer: {
        height: 6,
        backgroundColor: '#F3F4F6',
        borderRadius: 3,
        marginBottom: 16,
        overflow: 'hidden',
    },
    progressBar: {
        height: '100%',
        backgroundColor: COLORS.primary,
        borderRadius: 3,
    },
    payButton: {
        flexDirection: 'row',
        backgroundColor: COLORS.primary,
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 12,
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    payButtonText: {
        color: COLORS.white,
        fontWeight: '700',
        fontSize: 14,
    },
    // Modal Styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    modalView: {
        backgroundColor: COLORS.white,
        borderTopLeftRadius: 32,
        borderTopRightRadius: 32,
        padding: 24,
        height: '85%',
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
    modalContent: {
        alignItems: 'center',
    },
    modalStoreLogo: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#F3F4F6',
        marginBottom: 24,
    },
    amountLabel: {
        fontSize: 14,
        color: COLORS.textMuted,
        marginBottom: 8,
    },
    amountInputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 32,
    },
    currencyPrefix: {
        fontSize: 24,
        fontWeight: '700',
        color: COLORS.textMuted,
        marginRight: 8,
    },
    amountDisplay: {
        fontSize: 40,
        fontWeight: '800',
        color: COLORS.text,
    },
    breakdownContainer: {
        width: '100%',
        backgroundColor: '#F9FAFB',
        borderRadius: 20,
        padding: 20,
        marginBottom: 32,
    },
    breakdownTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: COLORS.text,
        marginBottom: 16,
    },
    timeline: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },
    timelineItem: {
        alignItems: 'center',
        width: 60,
    },
    timelineDot: {
        width: 12,
        height: 12,
        borderRadius: 6,
        backgroundColor: '#D1D5DB',
        marginBottom: 8,
    },
    timelineDotActive: {
        backgroundColor: COLORS.primary,
        borderWidth: 2,
        borderColor: '#E0E7FF',
    },
    timelineLine: {
        flex: 1,
        height: 2,
        backgroundColor: '#E5E7EB',
        marginTop: 5,
    },
    timelineDate: {
        fontSize: 10,
        color: COLORS.textMuted,
        marginBottom: 4,
    },
    timelineAmount: {
        fontSize: 10,
        fontWeight: '700',
        color: COLORS.text,
    },
    confirmButton: {
        width: '100%',
        backgroundColor: COLORS.primary,
        paddingVertical: 18,
        borderRadius: 16,
        alignItems: 'center',
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    confirmButtonText: {
        color: COLORS.white,
        fontWeight: '700',
        fontSize: 16,
    },
    // Product Card Styles
    productsTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: COLORS.text,
        marginBottom: 16,
    },
    productCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F9FAFB',
        padding: 16,
        borderRadius: 16,
        marginBottom: 12,
    },
    productImage: {
        width: 60,
        height: 60,
        borderRadius: 12,
        marginRight: 16,
        backgroundColor: '#F3F4F6',
    },
    productInfo: {
        flex: 1,
    },
    productName: {
        fontSize: 16,
        fontWeight: '600',
        color: COLORS.text,
        marginBottom: 4,
    },
    productPrice: {
        fontSize: 14,
        color: COLORS.primary,
        fontWeight: '700',
    },
    splitBadge: {
        backgroundColor: '#E0E7FF',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
    },
    splitBadgeText: {
        fontSize: 12,
        fontWeight: '700',
        color: COLORS.primary,
    },
    productImageLarge: {
        width: 120,
        height: 120,
        borderRadius: 16,
        marginBottom: 16,
        backgroundColor: '#F3F4F6',
    },
    productNameLarge: {
        fontSize: 24,
        fontWeight: '700',
        color: COLORS.text,
        marginBottom: 8,
    },
    productPriceLarge: {
        fontSize: 32,
        fontWeight: '800',
        color: COLORS.primary,
        marginBottom: 32,
    },
    // Credit Score Styles
    backBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: COLORS.white,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    scoreContainer: {
        alignItems: 'center',
        marginBottom: 32,
    },
    scoreCircle: {
        width: 160,
        height: 160,
        borderRadius: 80,
        borderWidth: 8,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: COLORS.white,
    },
    scoreNumber: {
        fontSize: 48,
        fontWeight: '800',
    },
    scoreGrade: {
        fontSize: 16,
        fontWeight: '600',
        color: COLORS.textMuted,
        marginTop: 4,
    },
    factorsContainer: {
        backgroundColor: '#F9FAFB',
        borderRadius: 20,
        padding: 20,
        marginBottom: 24,
    },
    factorsTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: COLORS.text,
        marginBottom: 16,
    },
    factorRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    factorLabel: {
        width: 120,
        fontSize: 12,
        color: COLORS.textMuted,
    },
    factorBarContainer: {
        flex: 1,
        height: 8,
        backgroundColor: '#E5E7EB',
        borderRadius: 4,
        marginHorizontal: 12,
        overflow: 'hidden',
    },
    factorBar: {
        height: '100%',
        backgroundColor: COLORS.primary,
        borderRadius: 4,
    },
    factorValue: {
        width: 40,
        fontSize: 12,
        fontWeight: '600',
        color: COLORS.text,
        textAlign: 'right',
    },
    insightsContainer: {
        marginBottom: 24,
    },
    insightsTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: COLORS.text,
        marginBottom: 12,
    },
    insightRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    insightText: {
        marginLeft: 8,
        fontSize: 14,
        color: COLORS.textMuted,
    },
    eligibilityContainer: {
        marginBottom: 32,
    },
    eligibilityTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: COLORS.text,
        marginBottom: 16,
    },
    eligibilityCards: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 16,
    },
    eligibilityCard: {
        width: '48%',
        backgroundColor: '#E0E7FF',
        padding: 20,
        borderRadius: 16,
        alignItems: 'center',
    },
    eligibilityCardDisabled: {
        backgroundColor: '#F3F4F6',
        opacity: 0.5,
    },
    eligibilityCardText: {
        marginTop: 8,
        fontSize: 14,
        fontWeight: '600',
        color: COLORS.text,
    },
    bnplLimit: {
        fontSize: 16,
        fontWeight: '700',
        color: COLORS.primary,
        textAlign: 'center',
    },
});
