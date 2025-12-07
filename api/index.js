// Vercel Serverless API - Main Handler
import { v4 as uuidv4 } from 'uuid';

// In-memory database for serverless (simplified for demo)
const users = new Map();
const wallets = new Map();
const transactions = [];

// Demo user for testing
const DEMO_USER = {
    id: 1,
    phone_number: '+212612345678',
    first_name: 'Ahmed',
    last_name: 'Alami',
    tier_id: 'TR1234567890'
};

const DEMO_WALLET = {
    contract_id: 'LAN2400000000000001',
    user_id: 1,
    phone_number: '+212612345678',
    rib: '853780241700000000000001',
    balance: 15750.50,
    level: '002',
    type: 'customer'
};

// Initialize demo data
users.set(DEMO_USER.phone_number, DEMO_USER);
wallets.set(DEMO_WALLET.contract_id, DEMO_WALLET);

// Add demo transactions
const demoTransactions = [
    { id: 1, wallet_id: 'LAN2400000000000001', type: 'credit', amount: 5000, category: 'deposit', merchant: 'Cash In', date: new Date().toISOString(), status: 'completed' },
    { id: 2, wallet_id: 'LAN2400000000000001', type: 'debit', amount: 85, category: 'Food & Dining', merchant: 'Café Atlas', date: new Date().toISOString(), status: 'completed' },
    { id: 3, wallet_id: 'LAN2400000000000001', type: 'debit', amount: 250, category: 'Shopping', merchant: 'Marjane', date: new Date().toISOString(), status: 'completed' },
];
transactions.push(...demoTransactions);

// Helper functions
const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();
const generateToken = () => uuidv4().replace(/-/g, '').toUpperCase().slice(0, 32);

// CORS headers
const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export default async function handler(req, res) {
    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
        return res.status(200).json({});
    }

    // Set CORS headers
    Object.entries(corsHeaders).forEach(([key, value]) => {
        res.setHeader(key, value);
    });

    const { url, method, body, query } = req;
    const path = url.split('?')[0].replace('/api', '');

    try {
        // Health check
        if (path === '/health' || path === '/') {
            return res.status(200).json({ status: 'ok', message: 'Dayra API is running' });
        }

        // Get wallet balance
        if (path === '/wallet/balance' && method === 'GET') {
            const contractId = query.contractid || query.contractId;
            const wallet = wallets.get(contractId) || DEMO_WALLET;
            return res.status(200).json({
                result: {
                    balance: [{ value: wallet.balance.toString(), type: 'Available' }]
                }
            });
        }

        // Get transaction history
        if (path === '/transactions' && method === 'GET') {
            const contractId = query.contractid || query.contractId;
            const walletTx = transactions.filter(t => t.wallet_id === contractId || t.wallet_id === DEMO_WALLET.contract_id);
            return res.status(200).json({ result: walletTx });
        }

        // Get demo users
        if (path === '/demo/users' && method === 'GET') {
            return res.status(200).json({
                users: [
                    { first_name: 'Ahmed', phone_number: '+212612345678', contract_id: 'LAN2400000000000001' },
                    { first_name: 'Sara', phone_number: '+212698765432', contract_id: 'LAN2400000000000002' },
                    { first_name: 'Karim', phone_number: '+212655555555', contract_id: 'LAN2400000000000003' },
                ]
            });
        }

        // Credit score
        if (path.startsWith('/credit-score/') && method === 'GET') {
            const phone = path.split('/credit-score/')[1];
            return res.status(200).json({
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

        // Transfer/P2P
        if (path === '/transfer/p2p' && method === 'POST') {
            const { amount, to } = body;
            const wallet = wallets.get(DEMO_WALLET.contract_id);
            if (wallet) {
                wallet.balance -= parseFloat(amount) || 0;
            }
            return res.status(200).json({
                result: {
                    success: true,
                    message: `Transferred ${amount} DH to ${to}`,
                    newBalance: wallet?.balance || 0
                }
            });
        }

        // Simulate purchase
        if (path === '/purchase/simulate' && method === 'POST') {
            const { amount, merchantName, category } = body;
            const wallet = wallets.get(DEMO_WALLET.contract_id);
            if (wallet) {
                wallet.balance -= parseFloat(amount) || 0;
            }
            transactions.push({
                id: transactions.length + 1,
                wallet_id: DEMO_WALLET.contract_id,
                type: 'debit',
                amount: parseFloat(amount),
                category: category || 'Shopping',
                merchant: merchantName || 'Unknown',
                date: new Date().toISOString(),
                status: 'completed'
            });
            return res.status(200).json({
                result: {
                    success: true,
                    message: `Purchased ${amount} DH at ${merchantName}`,
                    newBalance: wallet?.balance || 0
                }
            });
        }

        // Analytics summary
        if (path === '/analytics/summary' && method === 'GET') {
            return res.status(200).json({
                result: {
                    totalSpent: 12500,
                    avgTransaction: 156.25,
                    topCategory: 'Shopping',
                    monthlyChange: '+8.5%',
                    categories: [
                        { name: 'Shopping', amount: 5200, percentage: 41.6 },
                        { name: 'Food & Dining', amount: 3100, percentage: 24.8 },
                        { name: 'Transport', amount: 1800, percentage: 14.4 },
                        { name: 'Healthcare', amount: 1200, percentage: 9.6 },
                        { name: 'Entertainment', amount: 1200, percentage: 9.6 },
                    ]
                }
            });
        }

        // Default: endpoint not found
        return res.status(404).json({ error: 'Endpoint not found', path });

    } catch (error) {
        console.error('API Error:', error);
        return res.status(500).json({ error: 'Internal server error', message: error.message });
    }
}
