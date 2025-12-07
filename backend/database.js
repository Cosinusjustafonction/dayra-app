/**
 * In-Memory Database for CIH Wallet Backend
 * Uses simple JavaScript objects - no native dependencies required
 */

// In-memory database storage
// Auto-increment IDs
let userIdCounter = 1;
let walletIdCounter = 1;
let merchantIdCounter = 1;
let transactionIdCounter = 1;
let otpIdCounter = 1;
let pendingOpIdCounter = 1;
let borrowRequestIdCounter = 1;
let bnplPlanIdCounter = 1;

// In-memory database storage
const db = {
    users: [],
    wallets: [],
    merchants: [],
    transactions: [],
    otps: [],
    pendingOperations: [],
    borrowRequests: [],
    affiliated_stores: [],
    bnpl_plans: []
};

// Database operations
const database = {
    // Users
    insertUser: (user) => {
        const newUser = { id: userIdCounter++, ...user, created_at: new Date().toISOString() };
        db.users.push(newUser);
        return { lastInsertRowid: newUser.id };
    },
    getUserByPhone: (phone) => db.users.find(u => u.phone_number === phone),
    getUserById: (id) => db.users.find(u => u.id === id),
    getAllUsers: () => db.users,

    // Wallets
    insertWallet: (wallet) => {
        const newWallet = { id: walletIdCounter++, ...wallet, created_at: new Date().toISOString() };
        db.wallets.push(newWallet);
        return { lastInsertRowid: newWallet.id };
    },
    getWalletByContractId: (contractId) => db.wallets.find(w => w.contract_id === contractId),
    getWalletByPhone: (phone) => db.wallets.find(w => w.phone_number === phone),
    getWalletsByUserId: (userId) => db.wallets.filter(w => w.user_id === userId),
    updateWalletBalance: (contractId, amount) => {
        const wallet = db.wallets.find(w => w.contract_id === contractId);
        if (wallet) wallet.balance += amount;
    },
    updateWalletBalanceByPhone: (phone, amount) => {
        const wallet = db.wallets.find(w => w.phone_number === phone);
        if (wallet) wallet.balance += amount;
    },

    // Merchants
    insertMerchant: (merchant) => {
        const newMerchant = { id: merchantIdCounter++, ...merchant, created_at: new Date().toISOString() };
        db.merchants.push(newMerchant);
        return { lastInsertRowid: newMerchant.id };
    },
    getMerchantByPhone: (phone) => db.merchants.find(m => m.phone_number === phone),
    getMerchantByContractId: (contractId) => db.merchants.find(m => m.contract_id === contractId),
    getAllMerchants: () => db.merchants,

    // Transactions
    insertTransaction: (tx) => {
        const newTx = { id: transactionIdCounter++, ...tx, created_at: new Date().toISOString() };
        db.transactions.push(newTx);
        return { lastInsertRowid: newTx.id };
    },
    getTransactionsByContractId: (contractId) =>
        db.transactions.filter(t => t.source_contract_id === contractId || t.destination_contract_id === contractId)
            .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
            .slice(0, 50),

    // OTPs
    insertOtp: (otp) => {
        const newOtp = { id: otpIdCounter++, ...otp, used: 0, created_at: new Date().toISOString() };
        db.otps.push(newOtp);
        return { lastInsertRowid: newOtp.id };
    },
    getOtpByTokenAndCode: (token, code) => db.otps.find(o => o.token === token && o.otp === code && o.used === 0),
    getLatestOtpByPhone: (phone) =>
        db.otps.filter(o => o.phone_number === phone && o.used === 0)
            .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))[0],
    markOtpUsed: (id) => {
        const otp = db.otps.find(o => o.id === id);
        if (otp) otp.used = 1;
    },

    // Pending Operations
    insertPendingOp: (op) => {
        const newOp = { id: pendingOpIdCounter++, ...op, created_at: new Date().toISOString() };
        db.pendingOperations.push(newOp);
        return { lastInsertRowid: newOp.id };
    },
    getPendingOpByToken: (token) => db.pendingOperations.find(o => o.token === token),
    deletePendingOp: (token) => {
        const index = db.pendingOperations.findIndex(o => o.token === token);
        if (index !== -1) db.pendingOperations.splice(index, 1);
    },

    // Borrow Requests
    insertBorrowRequest: (request) => {
        const newRequest = {
            id: borrowRequestIdCounter++,
            ...request,
            status: 'pending',
            created_at: new Date().toISOString()
        };
        db.borrowRequests.push(newRequest);
        return { lastInsertRowid: newRequest.id };
    },
    getBorrowRequestsByPhone: (phone) =>
        db.borrowRequests.filter(r => r.to_phone === phone || r.from_phone === phone)
            .sort((a, b) => new Date(b.created_at) - new Date(a.created_at)),
    getPendingRequestsForUser: (phone) =>
        db.borrowRequests.filter(r => r.to_phone === phone && r.status === 'pending'),
    getBorrowRequestById: (id) => db.borrowRequests.find(r => r.id === id),
    updateBorrowRequestStatus: (id, status) => {
        const request = db.borrowRequests.find(r => r.id === id);
        if (request) {
            request.status = status;
            request.updated_at = new Date().toISOString();
        }
        return request;
    },
    getDebtsForUser: (phone) =>
        db.borrowRequests.filter(r =>
            (r.from_phone === phone || r.to_phone === phone) && r.status === 'accepted'
        ),

    // Get all data with joins (for demo endpoints)
    getAllUsersWithWallets: () => {
        return db.users.map(user => {
            const wallet = db.wallets.find(w => w.user_id === user.id);
            return { ...user, contract_id: wallet?.contract_id, rib: wallet?.rib, balance: wallet?.balance };
        });
    },

    // BNPL Operations
    getAffiliatedStores: () => db.affiliated_stores,

    createBnplPlan: (plan) => {
        const newPlan = {
            id: bnplPlanIdCounter++,
            ...plan,
            paid_amount: plan.total_amount / plan.total_installments, // First installment paid immediately
            installments_paid: 1,
            status: 'active',
            created_at: new Date().toISOString(),
            next_payment_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // +30 days
        };
        db.bnpl_plans.push(newPlan);
        return { lastInsertRowid: newPlan.id };
    },

    getBnplPlansByUser: (userId) => {
        return db.bnpl_plans.filter(p => p.user_id === userId)
            .map(plan => {
                const store = db.affiliated_stores.find(s => s.id === plan.store_id);
                return { ...plan, store_name: store?.name, store_logo: store?.logo };
            })
            .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    },

    payBnplInstallment: (planId) => {
        const plan = db.bnpl_plans.find(p => p.id === planId);
        if (plan && plan.status === 'active') {
            const installmentAmount = plan.total_amount / plan.total_installments;
            plan.paid_amount += installmentAmount;
            plan.installments_paid += 1;
            plan.next_payment_date = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(); // +30 days

            if (plan.installments_paid >= plan.total_installments) {
                plan.status = 'completed';
                plan.next_payment_date = null;
            }
            return plan;
        }
        return null;
    }
};

// Seed demo data
const seedDemoData = () => {
    if (db.users.length === 0) {
        console.log('Seeding demo data...');

        // Demo Users
        const demoUsers = [
            { phone: '212600000001', operator: 'IAM', firstName: 'Ahmed', lastName: 'Benali', email: 'ahmed.benali@email.ma', legalType: 'CIN', legalId: 'BK123456', balance: 5000 },
            { phone: '212600000002', operator: 'INWI', firstName: 'Fatima', lastName: 'Zahra', email: 'fatima.zahra@email.ma', legalType: 'CIN', legalId: 'BE789012', balance: 12500 },
            { phone: '212600000003', operator: 'ORANGE', firstName: 'Youssef', lastName: 'Amrani', email: 'youssef.amrani@email.ma', legalType: 'CIN', legalId: 'BH345678', balance: 8750 },
            { phone: '212600000004', operator: 'IAM', firstName: 'Sara', lastName: 'Idrissi', email: 'sara.idrissi@email.ma', legalType: 'CIN', legalId: 'BJ901234', balance: 3200 },
            { phone: '212600000005', operator: 'INWI', firstName: 'Karim', lastName: 'Tazi', email: 'karim.tazi@email.ma', legalType: 'CIN', legalId: 'BK567890', balance: 15000 },
        ];

        demoUsers.forEach((user, index) => {
            const tierId = `TR240000000000000${index + 1}`;
            const contractId = `LAN240000000000000${index + 1}`;
            const rib = `853780241716465970${String(index + 1).padStart(6, '0')}`;

            const result = database.insertUser({
                phone_number: user.phone,
                phone_operator: user.operator,
                first_name: user.firstName,
                last_name: user.lastName,
                email: user.email,
                legal_type: user.legalType,
                legal_id: user.legalId,
                tier_id: tierId
            });

            database.insertWallet({
                contract_id: contractId,
                user_id: result.lastInsertRowid,
                phone_number: user.phone,
                rib: rib,
                balance: user.balance,
                level: '002',
                type: 'customer'
            });
        });

        // Demo Merchants
        const demoMerchants = [
            { phone: '212700000001', firstName: 'Mohamed', lastName: 'Alaoui', company: 'Café Atlas', email: 'cafe.atlas@email.ma', sector: 'Food & Beverage', mcc: '5812', balance: 25000 },
            { phone: '212700000002', firstName: 'Leila', lastName: 'Bennani', company: 'Pharmacie Centrale', email: 'pharma.centrale@email.ma', sector: 'Healthcare', mcc: '5912', balance: 45000 },
            { phone: '212700000003', firstName: 'Omar', lastName: 'Fassi', company: 'Tech Store', email: 'tech.store@email.ma', sector: 'Electronics', mcc: '5732', balance: 78000 },
        ];

        demoMerchants.forEach((merchant, index) => {
            const contractId = `MER240000000000000${index + 1}`;
            database.insertMerchant({
                contract_id: contractId,
                phone_number: merchant.phone,
                first_name: merchant.firstName,
                last_name: merchant.lastName,
                company_name: merchant.company,
                email: merchant.email,
                activity_sector: merchant.sector,
                mcc: merchant.mcc,
                balance: merchant.balance,
                status: 'active'
            });
        });

        // Demo Transactions with Categories for Analytics
        const demoTransactions = [
            // Ahmed's transactions (user 1) - diverse categories
            { refId: '1181798513', type: 'W2W', amount: 150, fees: 6, contractId: 'LAN2400000000000001', destPhone: '212600000002', destName: 'Fatima Zahra', note: 'Déjeuner', category: 'Food & Dining', status: '000' },
            { refId: '1181798514', type: 'TM', amount: 85, fees: 0, contractId: 'LAN2400000000000001', destPhone: '212700000001', destName: 'Café Atlas', note: 'Café et croissant', category: 'Food & Dining', status: '000' },
            { refId: '1181798520', type: 'TM', amount: 450, fees: 0, contractId: 'LAN2400000000000001', destPhone: '212700000002', destName: 'Pharmacie Centrale', note: 'Médicaments', category: 'Healthcare', status: '000' },
            { refId: '1181798521', type: 'TM', amount: 1200, fees: 0, contractId: 'LAN2400000000000001', destPhone: '212700000003', destName: 'Tech Store', note: 'Écouteurs Bluetooth', category: 'Shopping', status: '000' },
            { refId: '1181798522', type: 'W2W', amount: 200, fees: 6, contractId: 'LAN2400000000000001', destPhone: '212600000003', destName: 'Youssef Amrani', note: 'Uber partagé', category: 'Transport', status: '000' },
            { refId: '1181798523', type: 'CO', amount: 500, fees: 3, contractId: 'LAN2400000000000001', destPhone: null, destName: null, note: 'Retrait DAB', category: 'Cash', status: '000' },
            { refId: '1181798524', type: 'W2W', amount: 300, fees: 6, contractId: 'LAN2400000000000001', destPhone: '212600000004', destName: 'Sara Idrissi', note: 'Abonnement Netflix', category: 'Entertainment', status: '000' },
            { refId: '1181798525', type: 'TM', amount: 120, fees: 0, contractId: 'LAN2400000000000001', destPhone: '212700000001', destName: 'Café Atlas', note: 'Petit-déjeuner équipe', category: 'Food & Dining', status: '000' },

            // Fatima's transactions (user 2)
            { refId: '1181798515', type: 'CI', amount: 2000, fees: 0, contractId: 'LAN2400000000000002', destPhone: null, destName: null, note: 'Recharge', category: 'Cash', status: '000' },
            { refId: '1181798526', type: 'W2W', amount: 100, fees: 6, contractId: 'LAN2400000000000002', destPhone: '212600000001', destName: 'Ahmed Benali', note: 'Remboursement taxi', category: 'Transport', status: '000' },
            { refId: '1181798527', type: 'TM', amount: 350, fees: 0, contractId: 'LAN2400000000000002', destPhone: '212700000003', destName: 'Tech Store', note: 'Coque téléphone', category: 'Shopping', status: '000' },
            { refId: '1181798528', type: 'W2W', amount: 500, fees: 6, contractId: 'LAN2400000000000002', destPhone: '212600000005', destName: 'Karim Tazi', note: 'Part loyer', category: 'Bills', status: '000' },

            // Youssef's transactions (user 3)
            { refId: '1181798516', type: 'W2W', amount: 500, fees: 6, contractId: 'LAN2400000000000003', destPhone: '212600000004', destName: 'Sara Idrissi', note: 'Cadeau anniversaire', category: 'Shopping', status: '000' },
            { refId: '1181798529', type: 'TM', amount: 75, fees: 0, contractId: 'LAN2400000000000003', destPhone: '212700000001', destName: 'Café Atlas', note: 'Café', category: 'Food & Dining', status: '000' },
            { refId: '1181798530', type: 'W2W', amount: 250, fees: 6, contractId: 'LAN2400000000000003', destPhone: '212600000001', destName: 'Ahmed Benali', note: 'Billet concert', category: 'Entertainment', status: '000' },

            // Sara's transactions (user 4)
            { refId: '1181798517', type: 'CO', amount: 200, fees: 3, contractId: 'LAN2400000000000004', destPhone: null, destName: null, note: 'Retrait', category: 'Cash', status: '000' },
            { refId: '1181798531', type: 'W2W', amount: 150, fees: 6, contractId: 'LAN2400000000000004', destPhone: '212600000002', destName: 'Fatima Zahra', note: 'Essence', category: 'Transport', status: '000' },
            { refId: '1181798532', type: 'TM', amount: 180, fees: 0, contractId: 'LAN2400000000000004', destPhone: '212700000002', destName: 'Pharmacie Centrale', note: 'Vitamines', category: 'Healthcare', status: '000' },

            // Karim's transactions (user 5)
            { refId: '1181798518', type: 'CI', amount: 5000, fees: 0, contractId: 'LAN2400000000000005', destPhone: null, destName: null, note: 'Virement reçu', category: 'Cash', status: '000' },
            { refId: '1181798533', type: 'W2W', amount: 1000, fees: 6, contractId: 'LAN2400000000000005', destPhone: '212600000001', destName: 'Ahmed Benali', note: 'Prêt remboursé', category: 'Other', status: '000' },
            { refId: '1181798534', type: 'TM', amount: 2500, fees: 0, contractId: 'LAN2400000000000005', destPhone: '212700000003', destName: 'Tech Store', note: 'Tablette', category: 'Shopping', status: '000' },
        ];

        demoTransactions.forEach(tx => {
            database.insertTransaction({
                reference_id: tx.refId,
                type: tx.type,
                amount: tx.amount,
                fees: tx.fees,
                source_contract_id: tx.contractId,
                destination_phone: tx.destPhone,
                destination_name: tx.destName,
                client_note: tx.note,
                category: tx.category,
                status: tx.status,
                currency: 'MAD'
            });
        });

        // Seed Affiliated Stores with Products
        const stores = [
            {
                id: 1, name: 'Marjane', category: 'Groceries',
                logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/23/Marjane_Logo.svg/1200px-Marjane_Logo.svg.png',
                description: 'Leading hypermarket chain in Morocco.',
                products: [
                    { id: 101, name: 'Weekly Grocery Bundle', price: 450, image: '🛒' },
                    { id: 102, name: 'Fresh Meat Pack', price: 280, image: '🥩' },
                    { id: 103, name: 'Cleaning Supplies Set', price: 150, image: '🧹' },
                    { id: 104, name: 'Baby Essentials Kit', price: 320, image: '👶' },
                ]
            },
            {
                id: 2, name: 'Zara', category: 'Fashion',
                logo: 'https://upload.wikimedia.org/wikipedia/commons/f/fd/Zara_Logo.svg',
                description: 'Latest fashion trends for men, women & kids.',
                products: [
                    { id: 201, name: 'Winter Jacket', price: 890, image: '🧥' },
                    { id: 202, name: 'Denim Jeans', price: 450, image: '👖' },
                    { id: 203, name: 'Elegant Dress', price: 650, image: '👗' },
                    { id: 204, name: 'Leather Shoes', price: 780, image: '👞' },
                ]
            },
            {
                id: 3, name: 'Ikea', category: 'Home',
                logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c5/Ikea_logo.svg/2560px-Ikea_logo.svg.png',
                description: 'Affordable furniture and home accessories.',
                products: [
                    { id: 301, name: 'MALM Bed Frame', price: 2500, image: '🛏️' },
                    { id: 302, name: 'KALLAX Shelf Unit', price: 890, image: '📚' },
                    { id: 303, name: 'POÄNG Armchair', price: 1200, image: '🪑' },
                    { id: 304, name: 'LACK Coffee Table', price: 350, image: '☕' },
                ]
            },
            {
                id: 4, name: 'Decathlon', category: 'Sports',
                logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/23/Decathlon_Logo.svg/1200px-Decathlon_Logo.svg.png',
                description: 'Sports gear and equipment for everyone.',
                products: [
                    { id: 401, name: 'Running Shoes', price: 550, image: '👟' },
                    { id: 402, name: 'Yoga Mat Pro', price: 180, image: '🧘' },
                    { id: 403, name: 'Mountain Bike', price: 3500, image: '🚴' },
                    { id: 404, name: 'Camping Tent', price: 1200, image: '⛺' },
                ]
            },
            {
                id: 5, name: 'Electroplanet', category: 'Electronics',
                logo: 'https://upload.wikimedia.org/wikipedia/commons/e/e6/Electroplanet_Logo.png',
                description: 'Top electronics and home appliances.',
                products: [
                    { id: 501, name: 'Samsung Galaxy S24', price: 12000, image: '📱' },
                    { id: 502, name: 'MacBook Air M3', price: 18000, image: '💻' },
                    { id: 503, name: 'Sony 55" Smart TV', price: 8500, image: '📺' },
                    { id: 504, name: 'AirPods Pro', price: 3200, image: '🎧' },
                ]
            },
            {
                id: 6, name: 'Virgin Megastore', category: 'Entertainment',
                logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b5/Virgin_Megastore_logo.svg/1200px-Virgin_Megastore_logo.svg.png',
                description: 'Music, books, games, and tech gadgets.',
                products: [
                    { id: 601, name: 'PS5 Console', price: 6500, image: '🎮' },
                    { id: 602, name: 'Vinyl Record Player', price: 1800, image: '🎵' },
                    { id: 603, name: 'Kindle Paperwhite', price: 1500, image: '📖' },
                    { id: 604, name: 'Board Games Bundle', price: 450, image: '🎲' },
                ]
            }
        ];
        db.affiliated_stores = stores;
        console.log(`Seeded ${stores.length} affiliated stores with products.`);

        // Seed Credit Scores for demo users
        db.credit_scores = [
            { user_id: 1, phone: '212600000001', score: 720, factors: { payment_history: 85, credit_utilization: 30, account_age: 24, transaction_diversity: 75, social_trust: 80 } },
            { user_id: 2, phone: '212600000002', score: 680, factors: { payment_history: 75, credit_utilization: 45, account_age: 12, transaction_diversity: 60, social_trust: 70 } },
        ];

        console.log('Demo data seeded successfully!');
    }
};

seedDemoData();

module.exports = database;
