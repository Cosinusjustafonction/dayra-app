import React, { useState, useEffect } from 'react';
import {
    StyleSheet,
    Text,
    View,
    ScrollView,
    TouchableOpacity,
    SafeAreaView,
    Dimensions,
    Modal,
} from 'react-native';
import { ShoppingBag, Coffee, Bus, Zap, TrendingUp, Calendar, X, ArrowRight, ArrowDownLeft, ArrowUpRight, Clock } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { LineChart, BarChart } from 'react-native-gifted-charts';
import { getTransactionHistory, getCurrentUser, getSpendingByCategory, getAnalyticsTransactions, getDebts } from './api';
import { COLORS } from './constants';



const SPENDING_DATA = [
    { id: 1, category: 'Food & Dining', amount: 1200, color: '#F37021', icon: Coffee, percent: 40 },
    { id: 2, category: 'Shopping', amount: 900, color: '#EC4899', icon: ShoppingBag, percent: 30 },
    { id: 3, category: 'Transport', amount: 450, color: '#38B2AC', icon: Bus, percent: 15 },
    { id: 4, category: 'Bills', amount: 450, color: '#8B5CF6', icon: Zap, percent: 15 },
];

const DEBTS = [
    { id: 1, type: 'owed_to_me', user: 'Amine', amount: 200, date: '2 days ago', status: 'pending' },
    { id: 2, type: 'i_owe', user: 'Sarah', amount: 150, date: 'Yesterday', status: 'pending' },
    { id: 3, type: 'owed_to_me', user: 'Karim', amount: 50, date: 'Last week', status: 'paid' },
];

const MOCK_TRANSACTIONS = {
    'Food & Dining': [
        {
            id: 1,
            name: 'Burger King',
            date: 'Today, 12:30 PM',
            amount: -85,
            icon: Coffee,
            items: [
                { name: 'Whopper Meal', price: 65 },
                { name: 'Cheese Bites', price: 20 },
            ]
        },
        {
            id: 2,
            name: 'Glovo Market',
            date: 'Yesterday, 8:15 PM',
            amount: -120,
            icon: ShoppingBag,
            items: [
                { name: 'Milk (1L)', price: 10 },
                { name: 'Bread', price: 5 },
                { name: 'Eggs (30)', price: 45 },
                { name: 'Cheese', price: 60 },
            ]
        },
        { id: 3, name: 'Starbucks', date: 'Dec 4, 9:00 AM', amount: -45, icon: Coffee },
    ],
    'Shopping': [
        {
            id: 4,
            name: 'Zara',
            date: 'Dec 3, 4:20 PM',
            amount: -550,
            icon: ShoppingBag,
            items: [
                { name: 'Black Jeans', price: 350 },
                { name: 'T-Shirt', price: 200 },
            ]
        },
        { id: 5, name: 'Marjane', date: 'Dec 1, 11:00 AM', amount: -350, icon: ShoppingBag },
    ],
    'Transport': [
        { id: 6, name: 'Uber', date: 'Today, 8:45 AM', amount: -35, icon: Bus },
        { id: 7, name: 'ONCF Ticket', date: 'Dec 2, 7:00 AM', amount: -180, icon: Bus },
    ],
    'Bills': [
        { id: 8, name: 'Lydec', date: 'Dec 1, 10:00 AM', amount: -450, icon: Zap },
    ],
};

const INCOME_DATA = [
    { value: 4000, label: 'Jul', dataPointText: '4k' },
    { value: 4500, label: 'Aug', dataPointText: '4.5k' },
    { value: 4200, label: 'Sep', dataPointText: '4.2k' },
    { value: 5000, label: 'Oct', dataPointText: '5k' },
    { value: 4800, label: 'Nov', dataPointText: '4.8k' },
    { value: 5500, label: 'Dec', dataPointText: '5.5k' },
];

const SPENDING_DATA_LINE = [
    { value: 2500, label: 'Jul', dataPointText: '2.5k' },
    { value: 2800, label: 'Aug', dataPointText: '2.8k' },
    { value: 2300, label: 'Sep', dataPointText: '2.3k' },
    { value: 3200, label: 'Oct', dataPointText: '3.2k' },
    { value: 2900, label: 'Nov', dataPointText: '2.9k' },
    { value: 3500, label: 'Dec', dataPointText: '3.5k' },
];

const BAR_DATA = [
    {
        value: 2000,
        label: 'Income',
        frontColor: COLORS.success,
        gradientColor: '#34D399',
        showGradient: true,
        topLabelComponent: () => (
            <Text style={{ color: COLORS.success, fontSize: 12, fontWeight: '700', marginBottom: 4 }}>2k</Text>
        ),
    },
    {
        value: 1500,
        label: 'Expense',
        frontColor: COLORS.danger,
        gradientColor: '#F87171',
        showGradient: true,
        topLabelComponent: () => (
            <Text style={{ color: COLORS.danger, fontSize: 12, fontWeight: '700', marginBottom: 4 }}>1.5k</Text>
        ),
    },
];

const { width } = Dimensions.get('window');

export default function AnalyticsScreen() {
    const [chartType, setChartType] = useState('income'); // 'income', 'spending', 'comparison'
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [selectedTransaction, setSelectedTransaction] = useState(null);
    const [modalVisible, setModalVisible] = useState(false);
    const [spendingData, setSpendingData] = useState(SPENDING_DATA);
    const [totalSpent, setTotalSpent] = useState('3,000.00');
    const [isLoading, setIsLoading] = useState(true);
    const [categoryTransactions, setCategoryTransactions] = useState({});
    const [debts, setDebts] = useState(DEBTS);

    // Category color and icon mapping
    const CATEGORY_STYLES = {
        'Food & Dining': { color: '#F37021', icon: Coffee },
        'Shopping': { color: '#EC4899', icon: ShoppingBag },
        'Transport': { color: '#38B2AC', icon: Bus },
        'Healthcare': { color: '#10B981', icon: Zap },
        'Entertainment': { color: '#8B5CF6', icon: ShoppingBag },
        'Bills': { color: '#F59E0B', icon: Zap },
        'Cash': { color: '#6366F1', icon: Zap },
        'Other': { color: '#94A3B8', icon: ShoppingBag },
    };

    // Fetch spending data from API
    useEffect(() => {
        const fetchSpending = async () => {
            setIsLoading(true);
            try {
                const user = getCurrentUser();

                // Fetch spending breakdown
                const response = await getSpendingByCategory(user.contractId);

                if (response.result?.categories) {
                    const apiData = response.result.categories
                        .filter(cat => parseFloat(cat.amount) > 0)
                        .map((cat, idx) => ({
                            id: idx + 1,
                            category: cat.name,
                            amount: parseFloat(cat.amount),
                            color: CATEGORY_STYLES[cat.name]?.color || '#94A3B8',
                            icon: CATEGORY_STYLES[cat.name]?.icon || ShoppingBag,
                            percent: cat.percent,
                        }));

                    if (apiData.length > 0) {
                        setSpendingData(apiData);
                    }
                    setTotalSpent(response.result.totalSpent);
                }

                // Fetch actual transactions
                const txResponse = await getAnalyticsTransactions(user.contractId);
                if (txResponse.result?.transactions) {
                    // Group transactions by category
                    const grouped = {};
                    txResponse.result.transactions.forEach(tx => {
                        const cat = tx.category || 'Other';
                        if (!grouped[cat]) grouped[cat] = [];
                        grouped[cat].push({
                            id: tx.id,
                            name: tx.destination || tx.note || 'Transaction',
                            date: new Date(tx.date).toLocaleString(),
                            amount: -parseFloat(tx.amount),
                            note: tx.note,
                        });
                    });
                    setCategoryTransactions(grouped);
                }

                // Fetch debts
                const debtsResponse = await getDebts(user.phoneNumber);
                if (debtsResponse.result) {
                    const allDebts = [
                        ...debtsResponse.result.owedToMe.map(d => ({ ...d, type: 'owed_to_me' })),
                        ...debtsResponse.result.iOwe.map(d => ({ ...d, type: 'i_owe' }))
                    ];
                    if (allDebts.length > 0) {
                        setDebts(allDebts.map(d => ({
                            id: d.id,
                            type: d.type,
                            user: d.user,
                            amount: d.amount,
                            date: new Date(d.date).toLocaleDateString(),
                            status: d.status === 'accepted' ? 'pending' : d.status
                        })));
                    }
                }
            } catch (error) {
                console.log('Using mock spending data');
            } finally {
                setIsLoading(false);
            }
        };

        fetchSpending();

        // Refresh every 3 seconds
        const interval = setInterval(fetchSpending, 3000);
        return () => clearInterval(interval);
    }, []);

    const handleCategoryPress = (category) => {
        setSelectedCategory(category);
        setModalVisible(true);
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Analytics</Text>
                <View style={styles.periodBadge}>
                    <Calendar size={12} color={COLORS.textMuted} style={{ marginRight: 4 }} />
                    <Text style={styles.periodText}>Last 6 Months</Text>
                </View>
            </View>

            <ScrollView contentContainerStyle={styles.content}>

                {/* Chart Toggle */}
                {/* Chart Toggle */}
                <View style={styles.toggleContainer}>
                    <TouchableOpacity
                        style={[styles.toggleBtn, chartType === 'income' && styles.toggleBtnActive]}
                        onPress={() => setChartType('income')}
                    >
                        <Text style={[styles.toggleText, chartType === 'income' && styles.toggleTextActive]}>Income</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.toggleBtn, chartType === 'spending' && styles.toggleBtnActive]}
                        onPress={() => setChartType('spending')}
                    >
                        <Text style={[styles.toggleText, chartType === 'spending' && styles.toggleTextActive]}>Spending</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.toggleBtn, chartType === 'comparison' && styles.toggleBtnActive]}
                        onPress={() => setChartType('comparison')}
                    >
                        <Text style={[styles.toggleText, chartType === 'comparison' && styles.toggleTextActive]}>In vs Out</Text>
                    </TouchableOpacity>
                </View>

                <View style={styles.chartCard}>
                    <Text style={styles.chartTitle}>
                        {chartType === 'income' ? 'Income Evolution' :
                            chartType === 'spending' ? 'Spending Evolution' :
                                'Income vs Expense (Dec)'}
                    </Text>

                    {chartType === 'income' && (
                        <LineChart
                            data={INCOME_DATA}
                            color={COLORS.success}
                            thickness={3}
                            dataPointsColor={COLORS.success}
                            startFillColor={COLORS.success}
                            endFillColor={COLORS.success}
                            startOpacity={0.2}
                            endOpacity={0.05}
                            areaChart
                            yAxisTextStyle={{ color: COLORS.textMuted, fontSize: 10 }}
                            xAxisLabelTextStyle={{ color: COLORS.textMuted, fontSize: 10 }}
                            hideRules
                            hideYAxisText
                            width={width - 80}
                            height={180}
                            curved
                            isAnimated
                            textColor1={COLORS.success}
                            textShiftY={-8}
                            textShiftX={-10}
                            textFontSize={10}
                        />
                    )}

                    {chartType === 'spending' && (
                        <LineChart
                            data={SPENDING_DATA_LINE}
                            color={COLORS.danger}
                            thickness={3}
                            dataPointsColor={COLORS.danger}
                            startFillColor={COLORS.danger}
                            endFillColor={COLORS.danger}
                            startOpacity={0.2}
                            endOpacity={0.05}
                            areaChart
                            yAxisTextStyle={{ color: COLORS.textMuted, fontSize: 10 }}
                            xAxisLabelTextStyle={{ color: COLORS.textMuted, fontSize: 10 }}
                            hideRules
                            hideYAxisText
                            width={width - 80}
                            height={180}
                            curved
                            isAnimated
                            textColor1={COLORS.danger}
                            textShiftY={-8}
                            textShiftX={-10}
                            textFontSize={10}
                        />
                    )}

                    {chartType === 'comparison' && (
                        <BarChart
                            data={BAR_DATA}
                            barWidth={60}
                            spacing={60}
                            roundedTop
                            roundedBottom
                            hideRules
                            xAxisThickness={0}
                            yAxisThickness={0}
                            yAxisTextStyle={{ color: COLORS.textMuted }}
                            xAxisLabelTextStyle={{ color: COLORS.textMuted, fontWeight: '600', marginTop: 4 }}
                            width={width - 80}
                            height={180}
                            isAnimated
                            showGradient
                            gradientColor={'#FFEE91'} // Fallback
                        />
                    )}
                </View>

                <View style={styles.statsRow}>
                    <View style={styles.statCard}>
                        <Text style={styles.statLabel}>Total Savings</Text>
                        <Text style={styles.statValue}>+12,450 DH</Text>
                        <View style={styles.trendBadge}>
                            <TrendingUp size={12} color={COLORS.success} />
                            <Text style={styles.trendText}>+12%</Text>
                        </View>
                    </View>
                    <View style={styles.statCard}>
                        <Text style={styles.statLabel}>Avg Spending</Text>
                        <Text style={styles.statValue}>2,100 DH</Text>
                    </View>
                </View>

                {/* Debt Dashboard */}
                <Text style={styles.sectionTitle}>Debt Dashboard</Text>

                <View style={styles.statsRow}>
                    <View style={styles.statCard}>
                        <Text style={styles.statLabel}>Owed to me</Text>
                        <Text style={[styles.statValue, { color: COLORS.success }]}>250 DH</Text>
                    </View>
                    <View style={styles.statCard}>
                        <Text style={styles.statLabel}>I Owe</Text>
                        <Text style={[styles.statValue, { color: COLORS.danger }]}>150 DH</Text>
                    </View>
                </View>

                <View style={styles.debtList}>
                    {debts.map((debt) => (
                        <View key={debt.id} style={styles.debtItem}>
                            <View style={styles.debtIconBg}>
                                {debt.type === 'owed_to_me' ? (
                                    <ArrowDownLeft color={COLORS.success} size={20} />
                                ) : (
                                    <ArrowUpRight color={COLORS.danger} size={20} />
                                )}
                            </View>
                            <View style={styles.debtInfo}>
                                <Text style={styles.debtUser}>
                                    {debt.type === 'owed_to_me' ? `${debt.user} owes you` : `You owe ${debt.user}`}
                                </Text>
                                <View style={styles.debtMeta}>
                                    <Clock size={12} color={COLORS.textMuted} style={{ marginRight: 4 }} />
                                    <Text style={styles.debtDate}>{debt.date}</Text>
                                </View>
                            </View>
                            <View style={{ alignItems: 'flex-end' }}>
                                <Text style={[styles.debtAmount, { color: debt.type === 'owed_to_me' ? COLORS.success : COLORS.danger }]}>
                                    {debt.amount} DH
                                </Text>
                                <Text style={[styles.debtStatus, { color: debt.status === 'paid' ? COLORS.success : COLORS.textMuted }]}>
                                    {debt.status}
                                </Text>
                            </View>
                        </View>
                    ))}
                </View>

                <Text style={[styles.sectionTitle, { marginTop: 24 }]}>Spending Classification</Text>

                {spendingData.map((item) => {
                    const Icon = item.icon;
                    return (
                        <TouchableOpacity key={item.id} onPress={() => handleCategoryPress(item)}>
                            <View style={styles.categoryRow}>
                                <View style={[styles.iconContainer, { backgroundColor: `${item.color}20` }]}>
                                    <Icon color={item.color} size={20} />
                                </View>
                                <View style={styles.categoryInfo}>
                                    <View style={styles.categoryHeader}>
                                        <Text style={styles.categoryName}>{item.category}</Text>
                                        <Text style={styles.categoryAmount}>{item.amount} DH</Text>
                                    </View>
                                    <View style={styles.progressBg}>
                                        <View style={[styles.progressFill, { width: `${item.percent}%`, backgroundColor: item.color }]} />
                                    </View>
                                    <Text style={styles.categoryPercent}>{item.percent}% of total</Text>
                                </View>
                                <View style={styles.arrowContainer}>
                                    <ArrowRight size={16} color={COLORS.textMuted} />
                                </View>
                            </View>
                        </TouchableOpacity>
                    );
                })}
            </ScrollView>

            {/* Transactions Modal */}
            <Modal
                animationType="slide"
                transparent={true}
                visible={modalVisible}
                onRequestClose={() => setModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalView}>
                        <View style={styles.modalHeader}>
                            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                <View style={[styles.modalIconBg, { backgroundColor: selectedCategory ? `${selectedCategory.color}20` : COLORS.cardBg }]}>
                                    {selectedCategory && <selectedCategory.icon size={24} color={selectedCategory.color} />}
                                </View>
                                <Text style={styles.modalTitle}>
                                    {selectedTransaction ? 'Receipt Details' : selectedCategory?.category}
                                </Text>
                            </View>
                            <TouchableOpacity
                                onPress={() => {
                                    if (selectedTransaction) {
                                        setSelectedTransaction(null);
                                    } else {
                                        setModalVisible(false);
                                    }
                                }}
                                style={styles.closeBtn}
                            >
                                {selectedTransaction ? <ArrowRight style={{ transform: [{ rotate: '180deg' }] }} color={COLORS.textMuted} size={24} /> : <X color={COLORS.textMuted} size={24} />}
                            </TouchableOpacity>
                        </View>

                        {selectedTransaction ? (
                            <View>
                                <View style={styles.receiptHeader}>
                                    <Text style={styles.receiptMerchant}>{selectedTransaction.name}</Text>
                                    <Text style={styles.receiptDate}>{selectedTransaction.date}</Text>
                                    <Text style={styles.receiptTotal}>{Math.abs(selectedTransaction.amount)} DH</Text>
                                </View>

                                <Text style={styles.receiptLabel}>Items Purchased</Text>
                                <View style={styles.receiptItems}>
                                    {selectedTransaction.items ? (
                                        selectedTransaction.items.map((item, index) => (
                                            <View key={index} style={styles.receiptItemRow}>
                                                <Text style={styles.itemName}>{item.name}</Text>
                                                <Text style={styles.itemPrice}>{item.price} DH</Text>
                                            </View>
                                        ))
                                    ) : (
                                        <Text style={styles.noItemsText}>No itemized details available.</Text>
                                    )}
                                </View>
                                <View style={styles.receiptDivider} />
                                <View style={styles.receiptFooter}>
                                    <Text style={styles.footerLabel}>Total Paid</Text>
                                    <Text style={styles.footerAmount}>{Math.abs(selectedTransaction.amount)} DH</Text>
                                </View>
                            </View>
                        ) : (
                            <>
                                {/* Category Stats */}
                                {selectedCategory && (
                                    <View style={styles.categoryStatsContainer}>
                                        <View style={styles.categoryStatItem}>
                                            <Text style={styles.categoryStatLabel}>Total Spent</Text>
                                            <Text style={styles.categoryStatValue}>
                                                {selectedCategory.amount} DH
                                            </Text>
                                        </View>
                                        <View style={styles.categoryStatDivider} />
                                        <View style={styles.categoryStatItem}>
                                            <Text style={styles.categoryStatLabel}>Transactions</Text>
                                            <Text style={styles.categoryStatValue}>
                                                {(categoryTransactions[selectedCategory.category] || MOCK_TRANSACTIONS[selectedCategory.category] || []).length}
                                            </Text>
                                        </View>
                                        <View style={styles.categoryStatDivider} />
                                        <View style={styles.categoryStatItem}>
                                            <Text style={styles.categoryStatLabel}>Average</Text>
                                            <Text style={styles.categoryStatValue}>
                                                {Math.round(selectedCategory.amount / ((categoryTransactions[selectedCategory.category] || MOCK_TRANSACTIONS[selectedCategory.category] || []).length || 1))} DH
                                            </Text>
                                        </View>
                                    </View>
                                )}

                                <Text style={styles.modalSubtitle}>Recent Transactions</Text>
                                <ScrollView>
                                    {selectedCategory && (categoryTransactions[selectedCategory.category] || MOCK_TRANSACTIONS[selectedCategory.category])?.map((tx) => (
                                        <TouchableOpacity
                                            key={tx.id}
                                            style={styles.txRow}
                                            onPress={() => setSelectedTransaction(tx)}
                                        >
                                            <View style={styles.txInfo}>
                                                <Text style={styles.txName}>{tx.name}</Text>
                                                <Text style={styles.txDate}>{tx.date}</Text>
                                            </View>
                                            <View style={{ alignItems: 'flex-end' }}>
                                                <Text style={styles.txAmount}>{tx.amount} DH</Text>
                                                {tx.items && <Text style={styles.viewReceiptText}>View Receipt</Text>}
                                            </View>
                                        </TouchableOpacity>
                                    ))}
                                    {selectedCategory && !categoryTransactions[selectedCategory.category] && !MOCK_TRANSACTIONS[selectedCategory.category] && (
                                        <Text style={styles.noTxText}>No recent transactions found.</Text>
                                    )}
                                </ScrollView>
                            </>
                        )}
                    </View>
                </View>
            </Modal>
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
    periodBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.cardBg,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    periodText: {
        color: COLORS.textMuted,
        fontSize: 12,
        fontWeight: '600',
    },
    content: {
        padding: 24,
    },
    toggleContainer: {
        flexDirection: 'row',
        backgroundColor: COLORS.cardBg,
        borderRadius: 12,
        padding: 4,
        marginBottom: 24,
    },
    toggleBtn: {
        flex: 1,
        paddingVertical: 8,
        alignItems: 'center',
        borderRadius: 8,
    },
    toggleBtnActive: {
        backgroundColor: COLORS.background,
    },
    toggleText: {
        color: COLORS.textMuted,
        fontWeight: '600',
        fontSize: 13,
    },
    toggleTextActive: {
        color: COLORS.text,
    },
    chartCard: {
        backgroundColor: COLORS.cardBg,
        borderRadius: 24,
        padding: 20,
        marginBottom: 32,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
        alignItems: 'center',
    },
    chartTitle: {
        color: COLORS.text,
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 24,
        alignSelf: 'flex-start',
    },
    statsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 32,
    },
    statCard: {
        width: '48%',
        backgroundColor: COLORS.cardBg,
        padding: 16,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
    },
    statLabel: {
        color: COLORS.textMuted,
        fontSize: 12,
        marginBottom: 4,
    },
    statValue: {
        color: COLORS.text,
        fontSize: 18,
        fontWeight: '700',
        marginBottom: 4,
    },
    trendBadge: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    trendText: {
        color: COLORS.success,
        fontSize: 12,
        fontWeight: '600',
        marginLeft: 4,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: COLORS.text,
        marginBottom: 16,
    },
    categoryRow: {
        flexDirection: 'row',
        marginBottom: 20,
        alignItems: 'center',
    },
    iconContainer: {
        width: 48,
        height: 48,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    categoryInfo: {
        flex: 1,
        justifyContent: 'center',
    },
    categoryHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    categoryName: {
        color: COLORS.text,
        fontWeight: '600',
        fontSize: 14,
    },
    categoryAmount: {
        color: COLORS.text,
        fontWeight: '700',
        fontSize: 14,
    },
    progressBg: {
        height: 6,
        backgroundColor: COLORS.cardBg,
        borderRadius: 3,
        marginBottom: 4,
    },
    progressFill: {
        height: '100%',
        borderRadius: 3,
    },
    categoryPercent: {
        color: COLORS.textMuted,
        fontSize: 10,
        alignSelf: 'flex-end',
    },
    arrowContainer: {
        marginLeft: 12,
    },
    // Modal
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.8)',
        justifyContent: 'flex-end',
    },
    modalView: {
        backgroundColor: COLORS.cardBg,
        borderTopLeftRadius: 32,
        borderTopRightRadius: 32,
        padding: 24,
        minHeight: 500,
        maxHeight: '80%',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 24,
    },
    modalIconBg: {
        width: 48,
        height: 48,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: COLORS.text,
    },
    closeBtn: {
        padding: 4,
    },
    modalSubtitle: {
        color: COLORS.textMuted,
        fontSize: 14,
        marginBottom: 16,
        fontWeight: '600',
    },
    txRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.05)',
    },
    txInfo: {
        flex: 1,
    },
    txName: {
        color: COLORS.text,
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 4,
    },
    txDate: {
        color: COLORS.textMuted,
        fontSize: 12,
    },
    txAmount: {
        color: COLORS.text,
        fontSize: 16,
        fontWeight: '700',
    },
    noTxText: {
        color: COLORS.textMuted,
        textAlign: 'center',
        marginTop: 24,
    },
    viewReceiptText: {
        color: COLORS.primary,
        fontSize: 10,
        fontWeight: '600',
        marginTop: 2,
    },
    // Receipt Styles
    receiptHeader: {
        alignItems: 'center',
        marginBottom: 24,
        paddingBottom: 24,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.1)',
        borderStyle: 'dashed',
    },
    receiptMerchant: {
        color: COLORS.text,
        fontSize: 20,
        fontWeight: '700',
        marginBottom: 4,
    },
    receiptDate: {
        color: COLORS.textMuted,
        fontSize: 14,
        marginBottom: 8,
    },
    receiptTotal: {
        color: COLORS.text,
        fontSize: 32,
        fontWeight: '800',
    },
    receiptLabel: {
        color: COLORS.textMuted,
        fontSize: 12,
        fontWeight: '600',
        marginBottom: 12,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    receiptItems: {
        marginBottom: 24,
    },
    receiptItemRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 12,
    },
    itemName: {
        color: COLORS.text,
        fontSize: 14,
    },
    itemPrice: {
        color: COLORS.text,
        fontSize: 14,
        fontWeight: '600',
    },
    noItemsText: {
        color: COLORS.textMuted,
        fontStyle: 'italic',
    },
    receiptDivider: {
        height: 1,
        backgroundColor: 'rgba(255,255,255,0.1)',
        marginBottom: 16,
    },
    receiptFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    footerLabel: {
        color: COLORS.textMuted,
        fontSize: 16,
        fontWeight: '600',
    },
    footerAmount: {
        color: COLORS.primary,
        fontSize: 20,
        fontWeight: '700',
    },
    // Debt Styles
    debtList: {
        gap: 12,
        marginBottom: 24,
    },
    debtItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.cardBg,
        padding: 16,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
    },
    debtIconBg: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: 'rgba(255,255,255,0.05)',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    debtInfo: {
        flex: 1,
    },
    debtUser: {
        color: COLORS.text,
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 4,
    },
    debtMeta: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    debtDate: {
        color: COLORS.textMuted,
        fontSize: 12,
    },
    debtAmount: {
        fontSize: 16,
        fontWeight: '700',
        marginBottom: 2,
    },
    debtStatus: {
        fontSize: 10,
        fontWeight: '600',
        textTransform: 'uppercase',
    },
    categoryStatsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        backgroundColor: COLORS.background,
        borderRadius: 12,
        padding: 16,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    categoryStatItem: {
        alignItems: 'center',
        flex: 1,
    },
    categoryStatDivider: {
        width: 1,
        backgroundColor: COLORS.border,
        height: '100%',
    },
    categoryStatLabel: {
        fontSize: 12,
        color: COLORS.textMuted,
        marginBottom: 4,
    },
    categoryStatValue: {
        fontSize: 16,
        fontWeight: '700',
        color: COLORS.text,
    },
});
