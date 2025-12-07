/**
 * Dayra Wallet API Service
 * Connects the React Native frontend to the backend
 */

import { Platform } from 'react-native';

// Check if running on Vercel (web production)
const isVercelProduction = Platform.OS === 'web' &&
    typeof window !== 'undefined' &&
    window.location.hostname !== 'localhost';

// Base URL for native apps
const API_BASE_URL = Platform.OS === 'web'
    ? 'http://localhost:3001'
    : 'http://10.56.170.196:3001';

// Mock data for web demo (when backend not available)
const MOCK_DATA = {
    balance: { result: { balance: [{ value: '15750.50', type: 'Available' }] } },
    transactions: {
        result: [
            { id: 1, type: 'credit', amount: 5000, category: 'deposit', merchant: 'Cash In', date: new Date().toISOString() },
            { id: 2, type: 'debit', amount: 85, category: 'Food & Dining', merchant: 'Café Atlas', date: new Date().toISOString() },
            { id: 3, type: 'debit', amount: 250, category: 'Shopping', merchant: 'Marjane', date: new Date().toISOString() },
        ]
    },
    users: {
        users: [
            { first_name: 'Ahmed', phone_number: '+212612345678', contract_id: 'LAN2400000000000001' },
            { first_name: 'Sara', phone_number: '+212698765432', contract_id: 'LAN2400000000000002' },
        ]
    },
    creditScore: {
        score: 725, grade: 'Good',
        factors: { paymentHistory: 85, bnplReliability: 80, socialTrust: 70, transactionDiversity: 75, financialDiscipline: 65, accountHealth: 78 },
        insights: ['On-time BNPL payments boosting your score', 'Active Daret participation adds social trust'],
        eligibility: { creditCard: true, personalLoan: true, bnplLimit: 15000 },
    },
    stores: {
        result: [
            {
                id: 1, name: 'Marjane', category: 'Supermarket', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4a/Marjane_logo.svg/200px-Marjane_logo.svg.png', maxBnpl: 5000, products: [
                    { id: 101, name: 'Samsung TV 55"', price: 4999, image: 'https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?w=300' },
                    { id: 102, name: 'iPhone 15 Pro', price: 12999, image: 'https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=300' },
                    { id: 103, name: 'MacBook Air M3', price: 14999, image: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=300' },
                ]
            },
            {
                id: 2, name: 'Zara', category: 'Fashion', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/fd/Zara_Logo.svg/200px-Zara_Logo.svg.png', maxBnpl: 3000, products: [
                    { id: 201, name: 'Winter Jacket', price: 899, image: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=300' },
                    { id: 202, name: 'Premium Suit', price: 1999, image: 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=300' },
                ]
            },
            {
                id: 3, name: 'IKEA', category: 'Furniture', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c5/Ikea_logo.svg/200px-Ikea_logo.svg.png', maxBnpl: 8000, products: [
                    { id: 301, name: 'MALM Bed Frame', price: 2499, image: 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=300' },
                    { id: 302, name: 'KALLAX Shelving', price: 699, image: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=300' },
                ]
            },
            {
                id: 4, name: 'Decathlon', category: 'Sports', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/08/Decathlon_Logo.png/200px-Decathlon_Logo.png', maxBnpl: 4000, products: [
                    { id: 401, name: 'Treadmill Pro', price: 3999, image: 'https://images.unsplash.com/photo-1538805060514-97d9cc17730c?w=300' },
                    { id: 402, name: 'Mountain Bike', price: 2999, image: 'https://images.unsplash.com/photo-1532298229144-0ec0c57515c7?w=300' },
                ]
            },
            {
                id: 5, name: 'Electroplanet', category: 'Electronics', logo: 'https://images.unsplash.com/photo-1550009158-9ebf69173e03?w=100', maxBnpl: 10000, products: [
                    { id: 501, name: 'PS5 Console', price: 5999, image: 'https://images.unsplash.com/photo-1606813907291-d86efa9b94db?w=300' },
                    { id: 502, name: 'AirPods Pro', price: 2999, image: 'https://images.unsplash.com/photo-1603351154351-5e2d0600bb77?w=300' },
                ]
            },
        ]
    },
    bnplPlans: {
        result: [
            {
                id: 1,
                store_name: 'Marjane',
                store_logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4a/Marjane_logo.svg/200px-Marjane_logo.svg.png',
                product: 'Samsung TV 55"',
                total_amount: 4999,
                paid_amount: 2499.50,
                total_installments: 4,
                installments_paid: 2,
                status: 'active',
                created_at: '2024-01-15'
            },
        ]
    },
};

/**
 * Generic API request handler with mock fallback for web
 */
const apiRequest = async (endpoint, options = {}) => {
    // On Vercel production, use mock data
    if (isVercelProduction) {
        console.log('Using demo data (Vercel mode)');
        if (endpoint.includes('/wallet/balance')) return MOCK_DATA.balance;
        if (endpoint.includes('/wallet/operations') || endpoint.includes('/transactions')) return MOCK_DATA.transactions;
        if (endpoint.includes('/demo/users')) return MOCK_DATA.users;
        if (endpoint.includes('/credit-score')) return MOCK_DATA.creditScore;
        if (endpoint.includes('/stores')) return MOCK_DATA.stores;
        if (endpoint.includes('/bnpl/plans')) return MOCK_DATA.bnplPlans;
        if (endpoint.includes('/bnpl/create')) return { result: { success: true, planId: Date.now() } };
        if (endpoint.includes('/bnpl/pay')) return { result: { success: true } };
        return { result: { success: true } };
    }

    try {
        const url = `${API_BASE_URL}${endpoint}`;
        const response = await fetch(url, {
            headers: {
                'Content-Type': 'application/json',
                ...options.headers,
            },
            ...options,
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'API request failed');
        }

        return data;
    } catch (error) {
        console.error('API Error:', error);
        throw error;
    }
};

// ============================================
// WALLET APIs
// ============================================

/**
 * Get wallet balance
 * @param {string} contractId - Wallet contract ID
 */
export const getWalletBalance = async (contractId) => {
    return apiRequest(`/wallet/balance?contractid=${contractId}`);
};

/**
 * Get transaction history
 * @param {string} contractId - Wallet contract ID
 */
export const getTransactionHistory = async (contractId) => {
    return apiRequest(`/wallet/operations?contractid=${contractId}`);
};

/**
 * Get customer info
 * @param {string} phoneNumber - Phone number
 */
export const getCustomerInfo = async (phoneNumber) => {
    return apiRequest('/wallet/clientinfo', {
        method: 'POST',
        body: JSON.stringify({
            phoneNumber,
            identificationType: 'CIN',
            identificationNumber: ''
        }),
    });
};

/**
 * Pre-create wallet
 * @param {object} userData - User registration data
 */
export const preCreateWallet = async (userData) => {
    return apiRequest('/wallet?state=precreate', {
        method: 'POST',
        body: JSON.stringify(userData),
    });
};

/**
 * Activate wallet with OTP
 * @param {string} otp - One-time password
 * @param {string} token - Registration token
 */
export const activateWallet = async (otp, token) => {
    return apiRequest('/wallet?state=activate', {
        method: 'POST',
        body: JSON.stringify({ otp, token }),
    });
};

// ============================================
// CASH IN APIs
// ============================================

/**
 * Simulate cash in
 */
export const simulateCashIn = async ({ contractId, level, phoneNumber, amount, fees = 0 }) => {
    return apiRequest('/wallet/cash/in?step=simulation', {
        method: 'POST',
        body: JSON.stringify({ contractId, level, phoneNumber, amount: String(amount), fees: String(fees) }),
    });
};

/**
 * Confirm cash in
 */
export const confirmCashIn = async ({ token, amount, fees = 0 }) => {
    return apiRequest('/wallet/cash/in?step=confirmation', {
        method: 'POST',
        body: JSON.stringify({ token, amount: String(amount), fees: String(fees) }),
    });
};

// ============================================
// CASH OUT APIs
// ============================================

/**
 * Simulate cash out
 */
export const simulateCashOut = async ({ phoneNumber, amount, fees = 0 }) => {
    return apiRequest('/wallet/cash/out?step=simulation', {
        method: 'POST',
        body: JSON.stringify({ phoneNumber, amount: String(amount), fees: String(fees) }),
    });
};

/**
 * Get cash out OTP
 */
export const getCashOutOTP = async (phoneNumber) => {
    return apiRequest('/wallet/cash/out/otp', {
        method: 'POST',
        body: JSON.stringify({ phoneNumber }),
    });
};

/**
 * Confirm cash out
 */
export const confirmCashOut = async ({ token, phoneNumber, otp, amount, fees = 0 }) => {
    return apiRequest('/wallet/cash/out?step=confirmation', {
        method: 'POST',
        body: JSON.stringify({ token, phoneNumber, otp, amount: String(amount), fees: String(fees) }),
    });
};

// ============================================
// WALLET TO WALLET APIs
// ============================================

/**
 * Simulate wallet to wallet transfer
 */
export const simulateWalletTransfer = async ({ contractId, amount, destinationPhone, mobileNumber, clientNote = '' }) => {
    return apiRequest('/wallet/transfer/wallet?step=simulation', {
        method: 'POST',
        body: JSON.stringify({
            clientNote,
            contractId,
            amout: String(amount), // Note: API uses 'amout' (typo in spec)
            fees: '0',
            destinationPhone,
            mobileNumber
        }),
    });
};

/**
 * Get wallet transfer OTP
 */
export const getWalletTransferOTP = async (phoneNumber) => {
    return apiRequest('/wallet/transfer/wallet/otp', {
        method: 'POST',
        body: JSON.stringify({ phoneNumber }),
    });
};

/**
 * Confirm wallet to wallet transfer
 */
export const confirmWalletTransfer = async ({ mobileNumber, contractId, otp, referenceId, destinationPhone, fees = 0 }) => {
    return apiRequest('/wallet/transfer/wallet?step=confirmation', {
        method: 'POST',
        body: JSON.stringify({ mobileNumber, contractId, otp, referenceId, destinationPhone, fees: String(fees) }),
    });
};

// ============================================
// PAY MERCHANT APIs
// ============================================

/**
 * Simulate wallet to merchant payment
 */
export const simulateMerchantPayment = async ({ clientContractId, amount, clientPhoneNumber, merchantPhoneNumber, clientNote = '' }) => {
    return apiRequest('/wallet/Transfer/WalletToMerchant?step=simulation', {
        method: 'POST',
        body: JSON.stringify({
            clientNote,
            clientContractId,
            Amout: String(amount),
            clientPhoneNumber,
            merchantPhoneNumber
        }),
    });
};

/**
 * Get merchant payment OTP
 */
export const getMerchantPaymentOTP = async (phoneNumber) => {
    return apiRequest('/wallet/walletToMerchant/cash/out/otp', {
        method: 'POST',
        body: JSON.stringify({ phoneNumber }),
    });
};

/**
 * Confirm merchant payment
 */
export const confirmMerchantPayment = async ({ clientPhoneNumber, clientContractId, otp, referenceId, destinationPhone, fees = 0 }) => {
    return apiRequest('/wallet/Transfer/WalletToMerchant?step=confirmation', {
        method: 'POST',
        body: JSON.stringify({
            ClientPhoneNumber: clientPhoneNumber,
            ClientContractId: clientContractId,
            OTP: otp,
            ReferenceId: referenceId,
            DestinationPhone: destinationPhone,
            fees: String(fees)
        }),
    });
};

// ============================================
// DYNAMIC QR CODE
// ============================================

/**
 * Generate dynamic QR code for merchant
 */
export const generateQRCode = async ({ phoneNumber, contractId, amount }) => {
    return apiRequest('/wallet/pro/qrcode/dynamic', {
        method: 'POST',
        body: JSON.stringify({ phoneNumber, contractId, amount: String(amount) }),
    });
};

// ============================================
// DEMO / UTILITY APIs
// ============================================

/**
 * Get all demo users (for testing)
 */
export const getDemoUsers = async () => {
    return apiRequest('/demo/users');
};

/**
 * Get all demo merchants (for testing)
 */
export const getDemoMerchants = async () => {
    return apiRequest('/demo/merchants');
};

/**
 * Health check
 */
export const healthCheck = async () => {
    return apiRequest('/health');
};

// ============================================
// ANALYTICS APIs (for demo)
// ============================================

/**
 * Get analytics transactions with categories
 */
export const getAnalyticsTransactions = async (contractId) => {
    return apiRequest(`/analytics/transactions?contractid=${contractId}`);
};

/**
 * Get spending by category
 */
export const getSpendingByCategory = async (contractId) => {
    return apiRequest(`/analytics/spending?contractid=${contractId}`);
};

/**
 * Simulate a categorized purchase (for demo)
 */
export const simulatePurchase = async ({ contractId, amount, merchantName, category, note }) => {
    return apiRequest('/demo/purchase', {
        method: 'POST',
        body: JSON.stringify({ contractId, amount, merchantName, category, note }),
    });
};

// ============================================
// BORROW REQUESTS & DEBTS APIs
// ============================================

/**
 * Create a borrow request (ask someone to lend you money)
 */
export const createBorrowRequest = async ({ fromPhone, fromName, toPhone, amount, note }) => {
    return apiRequest('/borrow/request', {
        method: 'POST',
        body: JSON.stringify({ fromPhone, fromName, toPhone, amount, note }),
    });
};

/**
 * Get pending borrow requests (notifications) for a user
 */
export const getPendingBorrowRequests = async (phone) => {
    return apiRequest(`/borrow/pending?phone=${phone}`);
};

/**
 * Respond to a borrow request (accept or decline)
 */
export const respondToBorrowRequest = async ({ requestId, action, responderPhone }) => {
    return apiRequest('/borrow/respond', {
        method: 'POST',
        body: JSON.stringify({ requestId, action, responderPhone }),
    });
};

/**
 * Get all debts for a user
 */
export const getDebts = async (phone) => {
    return apiRequest(`/debts?phone=${phone}`);
};

// ============================================
// CURRENT USER STATE (Local State Management)
// ============================================

// Default demo user for quick testing
export const DEFAULT_USER = {
    phoneNumber: '212600000001',
    contractId: 'LAN2400000000000001',
    firstName: 'Ahmed',
    lastName: 'Benali',
};

// Store current user (in production, use AsyncStorage or Redux)
let currentUser = DEFAULT_USER;

export const setCurrentUser = (user) => {
    currentUser = user;
};

export const getCurrentUser = () => currentUser;

export default {
    getWalletBalance,
    getTransactionHistory,
    getCustomerInfo,
    preCreateWallet,
    activateWallet,
    simulateCashIn,
    confirmCashIn,
    simulateCashOut,
    getCashOutOTP,
    confirmCashOut,
    simulateWalletTransfer,
    getWalletTransferOTP,
    confirmWalletTransfer,
    simulateMerchantPayment,
    getMerchantPaymentOTP,
    confirmMerchantPayment,
    generateQRCode,
    getDemoUsers,
    getDemoMerchants,
    healthCheck,
    getAnalyticsTransactions,
    getSpendingByCategory,
    simulatePurchase,
    createBorrowRequest,
    getPendingBorrowRequests,
    respondToBorrowRequest,
    getDebts,
    setCurrentUser,
    getCurrentUser,
    DEFAULT_USER,
};
// ============================================
// BNPL APIs
// ============================================

export const getAffiliatedStores = async () => {
    return apiRequest('/stores');
};

export const createBnplPlan = async (userId, storeId, totalAmount) => {
    return apiRequest('/bnpl/create', {
        method: 'POST',
        body: JSON.stringify({ userId, storeId, totalAmount }),
    });
};

export const getBnplPlans = async (userId) => {
    return apiRequest(`/bnpl/plans/${userId}`);
};

export const payBnplInstallment = async (planId) => {
    return apiRequest('/bnpl/pay', {
        method: 'POST',
        body: JSON.stringify({ planId }),
    });
};

// ============================================
// CREDIT SCORE API
// ============================================

export const getCreditScore = async (phone) => {
    return apiRequest(`/credit-score/${phone}`);
};
