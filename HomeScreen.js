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
} from 'react-native';
import { Bell, Menu, ArrowUpRight, Plus, CreditCard, Wallet, Zap, Smartphone, ShoppingBag, MoreHorizontal, MapPin, Users, Check, X, PiggyBank, Baby, Share2, Split, Briefcase, User, TrendingUp, Award, Lightbulb } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { getWalletBalance, getTransactionHistory, getCurrentUser, DEFAULT_USER, simulatePurchase, getCreditScore } from './api';
import { COLORS } from './constants';

const { width } = Dimensions.get('window');

// Initial wallets structure - balance will be updated from API
const INITIAL_WALLETS = [
  {
    id: 1,
    type: 'Main Account',
    balance: '0.00',
    currency: 'DH',
    number: '**** **** **** 1234',
    colors: [COLORS.primary, '#FF8C42'],
  },
  {
    id: 2,
    type: 'Savings',
    balance: '45,000.00',
    currency: 'DH',
    number: '**** **** **** 1234',
    colors: [COLORS.secondary, '#4FD1C5'],
  },
  {
    id: 3,
    type: 'E-Shopping',
    balance: '1,200.00',
    currency: 'DH',
    number: '**** **** **** 1234',
    colors: [COLORS.accent, '#A78BFA'],
  },
];

export default function HomeScreen({ navigation }) {
  const [activeWalletIndex, setActiveWalletIndex] = useState(0);
  const [roundUpModalVisible, setRoundUpModalVisible] = useState(false);
  const [roundUpAmount, setRoundUpAmount] = useState(0);
  const [selectedRoundUpWallet, setSelectedRoundUpWallet] = useState('savings');
  const [wallets, setWallets] = useState(INITIAL_WALLETS);
  const [isLoading, setIsLoading] = useState(true);
  const [transactions, setTransactions] = useState([]);
  const [userName, setUserName] = useState('Ahmed');
  const [isConnected, setIsConnected] = useState(false);
  const [profileModalVisible, setProfileModalVisible] = useState(false);
  const [creditScore, setCreditScore] = useState(null);

  // Fetch wallet data from backend
  const fetchWalletData = async () => {
    setIsLoading(true);
    try {
      const user = getCurrentUser();
      console.log('Fetching data for user:', user.contractId);

      // Fetch balance
      const balanceResponse = await getWalletBalance(user.contractId);
      console.log('Balance response:', balanceResponse);

      if (balanceResponse.result?.balance?.[0]?.value) {
        const apiBalance = parseFloat(balanceResponse.result.balance[0].value);
        const formattedBalance = apiBalance.toLocaleString('en-US', { minimumFractionDigits: 2 });

        // Update the main wallet balance
        setWallets(prev => prev.map((w, idx) =>
          idx === 0 ? { ...w, balance: formattedBalance } : w
        ));
        setIsConnected(true);
      }

      // Fetch transactions
      const txResponse = await getTransactionHistory(user.contractId);
      if (txResponse.result) {
        setTransactions(txResponse.result.slice(0, 5));
      }

      setUserName(user.firstName || 'Ahmed');
    } catch (error) {
      console.log('API Error:', error.message);
      setIsConnected(false);
      // Keep showing mock data
    } finally {
      setIsLoading(false);
    }
  };

  // Refresh on focus (when coming back from other screens)
  useEffect(() => {
    fetchWalletData();

    // Set up interval to refresh every 5 seconds when connected
    const interval = setInterval(() => {
      if (isConnected) {
        fetchWalletData();
      }
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  // Purchase simulation state
  const [purchaseModalVisible, setPurchaseModalVisible] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('Food & Dining');
  const [purchaseAmount, setPurchaseAmount] = useState(85);

  const PURCHASE_CATEGORIES = [
    { id: 'Food & Dining', label: 'Food & Dining', icon: '🍔', merchant: 'Café Atlas' },
    { id: 'Shopping', label: 'Shopping', icon: '🛍️', merchant: 'Marjane' },
    { id: 'Transport', label: 'Transport', icon: '🚕', merchant: 'Uber' },
    { id: 'Healthcare', label: 'Healthcare', icon: '💊', merchant: 'Pharmacie Centrale' },
    { id: 'Entertainment', label: 'Entertainment', icon: '🎬', merchant: 'Mégarama' },
    { id: 'Bills', label: 'Bills', icon: '📱', merchant: 'Maroc Telecom' },
  ];

  const triggerDemoPurchase = () => {
    setPurchaseModalVisible(true);
  };

  const handlePurchase = async () => {
    const category = PURCHASE_CATEGORIES.find(c => c.id === selectedCategory);
    try {
      const user = getCurrentUser();
      const response = await simulatePurchase({
        contractId: user.contractId,
        amount: purchaseAmount,
        merchantName: category.merchant,
        category: selectedCategory,
        note: `Demo purchase at ${category.merchant}`
      });

      if (response.result?.success) {
        // Show round-up modal after successful purchase
        const roundUp = (Math.ceil(purchaseAmount) - purchaseAmount).toFixed(2);
        setRoundUpAmount(roundUp > 0 ? roundUp : '0.70');
        setPurchaseModalVisible(false);
        setRoundUpModalVisible(true);
        fetchWalletData(); // Refresh balance
      } else {
        alert(`Paid ${purchaseAmount} DH at ${category.merchant}!`);
        fetchWalletData();
        setPurchaseModalVisible(false);
      }
    } catch (error) {
      // Fallback for demo
      const roundUp = (Math.ceil(purchaseAmount) - purchaseAmount).toFixed(2);
      setRoundUpAmount(roundUp > 0 ? roundUp : '0.70');
      setPurchaseModalVisible(false);
      setRoundUpModalVisible(true);
    }
  };

  const handleAcceptRoundUp = () => {
    setRoundUpModalVisible(false);
    alert(`Rounded up ${roundUpAmount} DH to your ${selectedRoundUpWallet} wallet!`);
  };

  const handleScroll = (event) => {
    const slideSize = event.nativeEvent.layoutMeasurement.width;
    const index = event.nativeEvent.contentOffset.x / slideSize;
    const roundIndex = Math.round(index);
    setActiveWalletIndex(roundIndex);
  };

  // Handle profile press - fetch credit score and show modal
  const handleProfilePress = async () => {
    try {
      const user = getCurrentUser();
      const response = await getCreditScore(user.phone);
      if (response) {
        setCreditScore(response);
      }
    } catch (error) {
      console.log('Credit score fetch error:', error);
      // Use fallback score for demo
      setCreditScore({
        score: 725,
        grade: 'Good',
        factors: {
          paymentHistory: 85,
          bnplReliability: 80,
          socialTrust: 70,
          transactionDiversity: 75,
          financialDiscipline: 65,
          accountHealth: 78,
        },
        insights: [
          'On-time BNPL payments boosting your score',
          'Active Daret participation adds social trust',
          'Consider setting up savings goals',
        ],
        eligibility: {
          creditCard: true,
          personalLoan: true,
          bnplLimit: 15000,
        },
      });
    }
    setProfileModalVisible(true);
  };

  const getScoreColor = (score) => {
    if (score >= 750) return '#22C55E';
    if (score >= 700) return '#3B82F6';
    if (score >= 650) return '#EAB308';
    if (score >= 600) return '#F97316';
    return '#EF4444';
  };

  return (
    <LinearGradient
      colors={[COLORS.background, '#EDE9FE', COLORS.background]} // Subtle violet glow
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.container}
    >
      <SafeAreaView style={{ flex: 1 }}>
        <StatusBar barStyle="light-content" />

        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.userInfo} onPress={handleProfilePress}>
            <Image
              source={{ uri: 'https://i.pravatar.cc/150?u=ahmed' }}
              style={styles.avatar}
            />
            <View>
              <Text style={styles.greeting}>Good Evening,</Text>
              <Text style={styles.username}>{userName} {isConnected ? '🟢' : '🔴'}</Text>
            </View>
            <View style={styles.creditBadge}>
              <TrendingUp size={12} color={COLORS.white} />
              <Text style={styles.creditBadgeText}>Score</Text>
            </View>
          </TouchableOpacity>
          <View style={styles.headerActions}>
            <TouchableOpacity style={styles.iconBtn} onPress={() => navigation.navigate('Notifications')}>
              <Bell color={COLORS.text} size={24} />
              <View style={styles.badge} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconBtn}>
              <Menu color={COLORS.text} size={24} />
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

          {/* Swipeable Wallets */}
          <View style={styles.walletsContainer}>
            <ScrollView
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              onScroll={handleScroll}
              scrollEventThrottle={16}
            >
              {wallets.map((wallet) => (
                <View key={wallet.id} style={styles.walletWrapper}>
                  <LinearGradient
                    colors={wallet.colors}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.balanceCard}
                  >
                    <View style={styles.cardHeader}>
                      <View>
                        <Text style={styles.cardLabel}>{wallet.type}</Text>
                        <Text style={styles.cardNumber}>{wallet.number}</Text>
                      </View>
                      <Image
                        source={{ uri: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2a/Mastercard-logo.svg/1280px-Mastercard-logo.svg.png' }}
                        style={styles.cardLogo}
                      />
                    </View>

                    <View style={styles.balanceSection}>
                      <Text style={styles.balanceLabel}>Available Balance</Text>
                      <View style={styles.balanceRow}>
                        <Text style={styles.currency}>{wallet.currency}</Text>
                        <Text style={styles.balanceAmount}>{wallet.balance}</Text>
                      </View>
                    </View>

                    {wallet.id === 1 && (
                      <View style={styles.safeSpendBadge}>
                        <Zap size={12} color={COLORS.white} fill={COLORS.white} />
                        <Text style={styles.safeSpendText}>Safe-to-Spend: {Math.floor(parseInt(wallet.balance.replace(/,/g, '')) * 0.8)} DH</Text>
                      </View>
                    )}
                  </LinearGradient>
                </View>
              ))}
            </ScrollView>

            {/* Pagination Dots */}
            <View style={styles.pagination}>
              {wallets.map((_, index) => (
                <View
                  key={index}
                  style={[
                    styles.dot,
                    activeWalletIndex === index ? styles.activeDot : styles.inactiveDot,
                  ]}
                />
              ))}
            </View>
          </View>

          {/* Quick Actions Grid */}
          <View style={styles.actionsGrid}>
            <TouchableOpacity style={styles.actionItem} onPress={() => navigation.navigate('Send')}>
              <View style={[styles.actionIcon, { backgroundColor: '#E0E7FF' }]}>
                <ArrowUpRight color={COLORS.primary} size={24} />
              </View>
              <Text style={styles.actionLabel}>Send</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionItem} onPress={() => navigation.navigate('Receive')}>
              <View style={[styles.actionIcon, { backgroundColor: '#FEF2F2' }]}>
                <Smartphone color="#DC2626" size={24} />
              </View>
              <Text style={styles.actionLabel}>Receive</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionItem} onPress={() => navigation.navigate('Shop')}>
              <View style={[styles.actionIcon, { backgroundColor: '#F3E8FF' }]}>
                <ShoppingBag color={COLORS.primary} size={24} />
              </View>
              <Text style={styles.actionLabel}>Shop</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionItem} onPress={() => navigation.navigate('Map')}>
              <View style={[styles.actionIcon, { backgroundColor: '#DCFCE7' }]}>
                <MapPin color="#22C55E" size={24} />
              </View>
              <Text style={styles.actionLabel}>Map</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionItem} onPress={() => navigation.navigate('Daret')}>
              <View style={[styles.actionIcon, { backgroundColor: '#FCE7F3' }]}>
                <Users color="#DB2777" size={24} />
              </View>
              <Text style={styles.actionLabel}>Daret</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionItem} onPress={() => navigation.navigate('SplitBill')}>
              <View style={[styles.actionIcon, { backgroundColor: '#FEF3C7' }]}>
                <Split color="#D97706" size={24} />
              </View>
              <Text style={styles.actionLabel}>Split</Text>
            </TouchableOpacity>
          </View>

          {/* Gigs Teaser */}
          <TouchableOpacity onPress={() => navigation.navigate('Gigs')}>
            <LinearGradient
              colors={[COLORS.cardBg, COLORS.background]}
              style={styles.gigsTeaser}
            >
              <View style={styles.gigsContent}>
                <View style={styles.gigsIconBg}>
                  <ShoppingBag color={COLORS.primary} size={20} />
                </View>
                <View>
                  <Text style={styles.gigsTitle}>Earn Extra Cash</Text>
                  <Text style={styles.gigsSubtitle}>3 new gigs match your profile</Text>
                </View>
              </View>
              <View style={styles.gigsBadge}>
                <Text style={styles.gigsBadgeText}>+450 DH</Text>
              </View>
            </LinearGradient>
          </TouchableOpacity>

          {/* Demo Trigger (Hidden in Prod) */}
          <TouchableOpacity style={styles.demoTrigger} onPress={triggerDemoPurchase}>
            <Text style={styles.demoTriggerText}>Simulate Purchase (Demo)</Text>
          </TouchableOpacity>

        </ScrollView>

        {/* Purchase Simulation Modal */}
        <Modal
          animationType="slide"
          transparent={true}
          visible={purchaseModalVisible}
          onRequestClose={() => setPurchaseModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalView}>
              <Text style={styles.modalTitle}>Simulate Purchase</Text>
              <Text style={styles.modalSubtitle}>Choose a category to demo the analytics classification</Text>

              <View style={styles.categoryGrid}>
                {PURCHASE_CATEGORIES.map((cat) => (
                  <TouchableOpacity
                    key={cat.id}
                    style={[styles.categoryItem, selectedCategory === cat.id && styles.categoryItemSelected]}
                    onPress={() => setSelectedCategory(cat.id)}
                  >
                    <Text style={styles.categoryIcon}>{cat.icon}</Text>
                    <Text style={[styles.categoryLabel, selectedCategory === cat.id && styles.categoryLabelSelected]}>
                      {cat.label}
                    </Text>
                    <Text style={styles.merchantLabel}>{cat.merchant}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <View style={styles.amountRow}>
                <Text style={styles.inputLabel}>Amount:</Text>
                <View style={styles.amountButtons}>
                  {[50, 85, 150, 250].map((amt) => (
                    <TouchableOpacity
                      key={amt}
                      style={[styles.amountBtn, purchaseAmount === amt && styles.amountBtnSelected]}
                      onPress={() => setPurchaseAmount(amt)}
                    >
                      <Text style={[styles.amountBtnText, purchaseAmount === amt && styles.amountBtnTextSelected]}>
                        {amt} DH
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.modalActions}>
                <TouchableOpacity style={styles.declineBtn} onPress={() => setPurchaseModalVisible(false)}>
                  <Text style={styles.declineText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.acceptBtn} onPress={handlePurchase}>
                  <LinearGradient
                    colors={[COLORS.primary, '#FF8C42']}
                    style={styles.acceptGradient}
                  >
                    <Text style={styles.acceptText}>Pay {purchaseAmount} DH</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* Round Up Modal */}
        <Modal
          animationType="fade"
          transparent={true}
          visible={roundUpModalVisible}
          onRequestClose={() => setRoundUpModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalView}>
              <View style={styles.modalIconBg}>
                <PiggyBank size={32} color={COLORS.primary} />
              </View>
              <Text style={styles.modalTitle}>Round Up?</Text>
              <Text style={styles.modalSubtitle}>
                You spent 45.30 DH at Carrefour. Round up to 46.00 DH and save the change?
              </Text>

              <View style={styles.roundUpAmountContainer}>
                <Text style={styles.roundUpAmount}>+{roundUpAmount} DH</Text>
              </View>

              <Text style={styles.inputLabel}>Save to:</Text>
              <View style={styles.walletSelector}>
                <TouchableOpacity
                  style={[styles.walletOption, selectedRoundUpWallet === 'savings' && styles.walletOptionSelected]}
                  onPress={() => setSelectedRoundUpWallet('savings')}
                >
                  <Wallet size={20} color={selectedRoundUpWallet === 'savings' ? COLORS.white : COLORS.textMuted} />
                  <Text style={[styles.walletOptionText, selectedRoundUpWallet === 'savings' && styles.walletOptionTextSelected]}>Savings</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.walletOption, selectedRoundUpWallet === 'child' && styles.walletOptionSelected]}
                  onPress={() => setSelectedRoundUpWallet('child')}
                >
                  <Baby size={20} color={selectedRoundUpWallet === 'child' ? COLORS.white : COLORS.textMuted} />
                  <Text style={[styles.walletOptionText, selectedRoundUpWallet === 'child' && styles.walletOptionTextSelected]}>Adam</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.walletOption, selectedRoundUpWallet === 'shared' && styles.walletOptionSelected]}
                  onPress={() => setSelectedRoundUpWallet('shared')}
                >
                  <Share2 size={20} color={selectedRoundUpWallet === 'shared' ? COLORS.white : COLORS.textMuted} />
                  <Text style={[styles.walletOptionText, selectedRoundUpWallet === 'shared' && styles.walletOptionTextSelected]}>Trip</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.modalActions}>
                <TouchableOpacity style={styles.declineBtn} onPress={() => setRoundUpModalVisible(false)}>
                  <Text style={styles.declineText}>No thanks</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.acceptBtn} onPress={handleAcceptRoundUp}>
                  <LinearGradient
                    colors={[COLORS.primary, '#FF8C42']}
                    style={styles.acceptGradient}
                  >
                    <Text style={styles.acceptText}>Round Up</Text>
                  </LinearGradient>
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
            <View style={styles.profileModalContent}>
              <View style={styles.modalHandle} />

              <View style={styles.profileHeader}>
                <TouchableOpacity onPress={() => setProfileModalVisible(false)} style={styles.closeBtn}>
                  <X size={24} color={COLORS.text} />
                </TouchableOpacity>
                <Text style={styles.profileTitle}>Your Credit Profile</Text>
                <View style={{ width: 40 }} />
              </View>

              <ScrollView showsVerticalScrollIndicator={false}>
                {/* Credit Score Circle */}
                <View style={styles.scoreContainer}>
                  <View style={[styles.scoreCircle, { borderColor: creditScore ? getScoreColor(creditScore.score) : COLORS.primary }]}>
                    <Text style={[styles.scoreNumber, { color: creditScore ? getScoreColor(creditScore.score) : COLORS.primary }]}>
                      {creditScore?.score || '---'}
                    </Text>
                    <Text style={styles.scoreGrade}>{creditScore?.grade || 'Loading...'}</Text>
                  </View>
                  <Text style={styles.scoreLabel}>Dayra Credit Score</Text>
                </View>

                {/* Score Factors */}
                {creditScore?.factors && (
                  <View style={styles.factorsCard}>
                    <Text style={styles.factorsTitle}>Score Breakdown</Text>
                    {Object.entries(creditScore.factors).map(([key, value]) => (
                      <View key={key} style={styles.factorRow}>
                        <Text style={styles.factorLabel}>
                          {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                        </Text>
                        <View style={styles.factorBarBg}>
                          <View style={[styles.factorBarFill, { width: `${value}%`, backgroundColor: getScoreColor(value * 8.5) }]} />
                        </View>
                        <Text style={styles.factorValue}>{value}%</Text>
                      </View>
                    ))}
                  </View>
                )}

                {/* Insights */}
                {creditScore?.insights && (
                  <View style={styles.insightsCard}>
                    <View style={styles.insightsHeader}>
                      <Lightbulb size={20} color={COLORS.primary} />
                      <Text style={styles.insightsTitle}>Insights</Text>
                    </View>
                    {creditScore.insights.map((insight, index) => (
                      <View key={index} style={styles.insightRow}>
                        <Check size={16} color="#22C55E" />
                        <Text style={styles.insightText}>{insight}</Text>
                      </View>
                    ))}
                  </View>
                )}

                {/* Eligibility */}
                {creditScore?.eligibility && (
                  <View style={styles.eligibilityCard}>
                    <View style={styles.eligibilityHeader}>
                      <Award size={20} color={COLORS.primary} />
                      <Text style={styles.eligibilityTitle}>You're Eligible For</Text>
                    </View>
                    <View style={styles.eligibilityGrid}>
                      <View style={[styles.eligibilityItem, creditScore.eligibility.creditCard && styles.eligibilityItemActive]}>
                        <CreditCard size={24} color={creditScore.eligibility.creditCard ? COLORS.primary : COLORS.textMuted} />
                        <Text style={styles.eligibilityItemText}>Credit Card</Text>
                      </View>
                      <View style={[styles.eligibilityItem, creditScore.eligibility.personalLoan && styles.eligibilityItemActive]}>
                        <Wallet size={24} color={creditScore.eligibility.personalLoan ? COLORS.primary : COLORS.textMuted} />
                        <Text style={styles.eligibilityItemText}>Personal Loan</Text>
                      </View>
                    </View>
                    <View style={styles.bnplLimitBox}>
                      <Text style={styles.bnplLimitLabel}>BNPL Limit</Text>
                      <Text style={styles.bnplLimitValue}>{creditScore.eligibility.bnplLimit?.toLocaleString() || '10,000'} DH</Text>
                    </View>
                  </View>
                )}

                <TouchableOpacity
                  style={styles.shopNowBtn}
                  onPress={() => {
                    setProfileModalVisible(false);
                    navigation.navigate('Shop');
                  }}
                >
                  <Text style={styles.shopNowBtnText}>Shop with BNPL</Text>
                </TouchableOpacity>
              </ScrollView>
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    </LinearGradient >
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
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 12,
    borderWidth: 2,
    borderColor: COLORS.cardBg,
  },
  greeting: {
    color: COLORS.textMuted,
    fontSize: 14,
  },
  username: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: '700',
  },
  headerActions: {
    flexDirection: 'row',
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.cardBg,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  badge: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.primary,
    borderWidth: 1,
    borderColor: COLORS.cardBg,
  },
  content: {
    paddingBottom: 100,
  },
  walletsContainer: {
    marginBottom: 24,
  },
  walletWrapper: {
    width: width,
    paddingHorizontal: 24,
  },
  balanceCard: {
    borderRadius: 24,
    padding: 24,
    height: 200,
    justifyContent: 'space-between',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  cardLabel: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  cardNumber: {
    color: COLORS.white,
    fontSize: 12,
    opacity: 0.8,
  },
  cardLogo: {
    width: 40,
    height: 24,
    resizeMode: 'contain',
  },
  balanceSection: {
    marginTop: 12,
  },
  balanceLabel: {
    color: COLORS.white,
    fontSize: 12,
    marginBottom: 4,
    opacity: 0.9,
  },
  balanceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  currency: {
    color: COLORS.white,
    fontSize: 20,
    fontWeight: '600',
    marginRight: 8,
  },
  balanceAmount: {
    color: COLORS.white,
    fontSize: 36,
    fontWeight: '800',
  },
  safeSpendBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.25)',
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  safeSpendText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 6,
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 16,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginHorizontal: 4,
  },
  activeDot: {
    backgroundColor: COLORS.primary,
    width: 24,
  },
  inactiveDot: {
    backgroundColor: COLORS.textMuted,
    opacity: 0.3,
  },
  actionsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    marginBottom: 32,
    flexWrap: 'wrap',
  },
  actionItem: {
    alignItems: 'center',
    width: '18%', // Adjusted for 5 items
    marginBottom: 16,
  },
  actionIcon: {
    width: 56,
    height: 56,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  actionLabel: {
    color: COLORS.textMuted,
    fontSize: 12,
    fontWeight: '500',
  },
  gigsTeaser: {
    marginHorizontal: 24,
    borderRadius: 20,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  gigsContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  gigsIconBg: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(243, 112, 33, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  gigsTitle: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: '700',
  },
  gigsSubtitle: {
    color: COLORS.textMuted,
    fontSize: 12,
  },
  gigsBadge: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.2)',
  },
  gigsBadgeText: {
    color: COLORS.success,
    fontSize: 12,
    fontWeight: '700',
  },
  demoTrigger: {
    marginTop: 24,
    alignSelf: 'center',
    padding: 12,
    backgroundColor: COLORS.inputBg,
    borderRadius: 12,
  },
  demoTriggerText: {
    color: COLORS.textMuted,
    fontSize: 12,
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalView: {
    width: '100%',
    backgroundColor: COLORS.cardBg,
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  modalIconBg: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(243, 112, 33, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 8,
  },
  modalSubtitle: {
    fontSize: 14,
    color: COLORS.textMuted,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  roundUpAmountContainer: {
    backgroundColor: COLORS.inputBg,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    marginBottom: 24,
  },
  roundUpAmount: {
    fontSize: 24,
    fontWeight: '800',
    color: COLORS.success,
  },
  inputLabel: {
    alignSelf: 'flex-start',
    color: COLORS.textMuted,
    fontSize: 12,
    marginBottom: 12,
    fontWeight: '600',
  },
  walletSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 24,
  },
  walletOption: {
    flex: 1,
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginHorizontal: 4,
  },
  walletOptionSelected: {
    backgroundColor: 'rgba(243, 112, 33, 0.1)',
    borderColor: COLORS.primary,
  },
  walletOptionText: {
    color: COLORS.textMuted,
    fontSize: 12,
    marginTop: 8,
    fontWeight: '500',
  },
  walletOptionTextSelected: {
    color: COLORS.primary,
    fontWeight: '700',
  },
  modalActions: {
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  declineBtn: {
    padding: 16,
  },
  declineText: {
    color: COLORS.textMuted,
    fontWeight: '600',
  },
  acceptBtn: {
    flex: 1,
    marginLeft: 16,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  acceptGradient: {
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
  },
  acceptText: {
    color: COLORS.white,
    fontWeight: '700',
    fontSize: 16,
  },
  // Purchase modal styles
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 20,
  },
  categoryItem: {
    width: '48%',
    backgroundColor: COLORS.cardBg,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  categoryItemSelected: {
    borderColor: COLORS.primary,
    backgroundColor: 'rgba(243, 112, 33, 0.1)',
  },
  categoryIcon: {
    fontSize: 28,
    marginBottom: 8,
  },
  categoryLabel: {
    color: COLORS.textMuted,
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  categoryLabelSelected: {
    color: COLORS.white,
  },
  merchantLabel: {
    color: COLORS.textMuted,
    fontSize: 10,
    marginTop: 4,
  },
  amountRow: {
    width: '100%',
    marginBottom: 24,
  },
  amountButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  amountBtn: {
    backgroundColor: COLORS.cardBg,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  amountBtnSelected: {
    borderColor: COLORS.primary,
    backgroundColor: 'rgba(243, 112, 33, 0.1)',
  },
  amountBtnText: {
    color: COLORS.textMuted,
    fontWeight: '600',
  },
  amountBtnTextSelected: {
    color: COLORS.white,
  },
  // Credit Badge styles
  creditBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 8,
  },
  creditBadgeText: {
    color: COLORS.white,
    fontSize: 10,
    fontWeight: '700',
    marginLeft: 4,
  },
  // Profile Modal styles
  profileModalContent: {
    backgroundColor: COLORS.background,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    height: '85%',
    paddingHorizontal: 24,
    paddingTop: 16,
  },
  profileHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  profileTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text,
  },
  closeBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.cardBg,
    justifyContent: 'center',
    alignItems: 'center',
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
    backgroundColor: COLORS.cardBg,
    marginBottom: 16,
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
  scoreLabel: {
    fontSize: 14,
    color: COLORS.textMuted,
  },
  factorsCard: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
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
    width: 110,
    fontSize: 11,
    color: COLORS.textMuted,
  },
  factorBarBg: {
    flex: 1,
    height: 8,
    backgroundColor: '#2D3748',
    borderRadius: 4,
    marginHorizontal: 12,
    overflow: 'hidden',
  },
  factorBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  factorValue: {
    width: 36,
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.text,
    textAlign: 'right',
  },
  insightsCard: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
  },
  insightsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  insightsTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
    marginLeft: 8,
  },
  insightRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  insightText: {
    marginLeft: 12,
    fontSize: 14,
    color: COLORS.textMuted,
    flex: 1,
  },
  eligibilityCard: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 20,
    padding: 20,
    marginBottom: 24,
  },
  eligibilityHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  eligibilityTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
    marginLeft: 8,
  },
  eligibilityGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  eligibilityItem: {
    width: '48%',
    backgroundColor: '#2D3748',
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
    opacity: 0.5,
  },
  eligibilityItemActive: {
    backgroundColor: 'rgba(202, 183, 235, 0.2)',
    opacity: 1,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  eligibilityItemText: {
    marginTop: 8,
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
  },
  bnplLimitBox: {
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#22C55E',
  },
  bnplLimitLabel: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginBottom: 4,
  },
  bnplLimitValue: {
    fontSize: 24,
    fontWeight: '800',
    color: '#22C55E',
  },
  shopNowBtn: {
    backgroundColor: COLORS.primary,
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 40,
  },
  shopNowBtnText: {
    color: COLORS.white,
    fontWeight: '700',
    fontSize: 16,
  },
});
