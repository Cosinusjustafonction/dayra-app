/**
 * CIH Wallet API Service
 * Connects the React Native frontend to the Node.js backend
 */

// Base URL - Using your computer's IP for mobile device access
const API_BASE_URL = 'http://10.56.170.196:3001';

// For iOS Simulator, you can use localhost:
// const API_BASE_URL = 'http://localhost:3001';

/**
 * Generic API request handler
 */
const apiRequest = async (endpoint, options = {}) => {
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
