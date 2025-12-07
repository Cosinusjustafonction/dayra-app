const express = require('express');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');
const db = require('./database');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Helper functions
const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();
const generateToken = () => uuidv4().replace(/-/g, '').toUpperCase().slice(0, 32);
const generateReferenceId = () => Math.floor(1000000000 + Math.random() * 9000000000).toString();
const generateContractId = () => `LAN${Date.now()}${Math.floor(Math.random() * 1000)}`;
const generateRIB = () => `8537802417${Math.floor(10000000000000 + Math.random() * 90000000000000)}`;

// ============================================
// 4.1 - WALLET CREATION
// ============================================

app.post('/wallet', (req, res) => {
    const { state } = req.query;

    if (state === 'precreate') {
        const { phoneNumber, phoneOperator, clientFirstName, clientLastName, email, placeOfBirth, dateOfBirth, clientAddress, gender, legalType, legalId } = req.body;

        const existingUser = db.getUserByPhone(phoneNumber);
        if (existingUser) {
            return res.status(400).json({ error: 'User already exists' });
        }

        const otp = generateOTP();
        const token = `TR${Date.now()}${Math.floor(Math.random() * 1000)}`;

        db.insertOtp({ phone_number: phoneNumber, otp, token, type: 'wallet_create' });

        res.status(201).json({
            result: {
                firstName: clientFirstName || 'Prenom',
                lastName: clientLastName || 'nom',
                mobileNumber: phoneNumber,
                email: email || '',
                gender: gender || '',
                placeOfBirth: placeOfBirth || '',
                dateOfBirth: dateOfBirth || '',
                provider: phoneOperator || 'IAM',
                otp: otp,
                token: token,
                institutionId: '0001',
                distributeurId: '000104',
                agenceId: '211',
                channelId: 'P',
                productId: '000',
                productTypeId: '000'
            }
        });
    } else if (state === 'activate') {
        const { otp, token } = req.body;

        const storedOtp = db.getOtpByTokenAndCode(token, otp);
        if (!storedOtp) {
            return res.status(400).json({ error: 'Invalid OTP or token' });
        }

        db.markOtpUsed(storedOtp.id);

        const contractId = generateContractId();
        const rib = generateRIB();
        const tierId = token;

        const userResult = db.insertUser({
            phone_number: storedOtp.phone_number,
            tier_id: tierId
        });

        db.insertWallet({
            contract_id: contractId,
            user_id: userResult.lastInsertRowid,
            phone_number: storedOtp.phone_number,
            rib: rib,
            balance: 0,
            level: '000',
            type: 'customer'
        });

        res.status(201).json({
            result: {
                contractId: contractId,
                reference: '',
                level: '000',
                rib: rib
            }
        });
    } else {
        res.status(400).json({ error: 'Invalid state parameter' });
    }
});

// ============================================
// 4.2 - CONSULTING CUSTOMER INFORMATION
// ============================================

app.post('/wallet/clientinfo', (req, res) => {
    const { phoneNumber } = req.body;

    const user = db.getUserByPhone(phoneNumber);
    if (!user) {
        return res.status(404).json({ error: 'User not found' });
    }

    const wallets = db.getWalletsByUserId(user.id);

    res.json({
        result: {
            phoneNumber: user.phone_number,
            email: user.email || '',
            country: 'MAR',
            tierFirstName: user.first_name || 'Prenom',
            tierLastName: user.last_name || 'nom',
            tierId: user.tier_id,
            pidType: user.legal_type || '',
            soldeCumule: wallets.reduce((sum, w) => sum + w.balance, 0).toFixed(2),
            products: wallets.map(w => ({
                contractId: w.contract_id,
                rib: w.rib,
                solde: w.balance.toFixed(2),
                level: w.level,
                statusId: w.status === 'active' ? '1' : '0',
                productTypeId: '000',
                productTypeName: 'PARTICULIER',
                name: 'CDP BASIC',
                phoneNumber: w.phone_number,
                provider: user.phone_operator || 'IAM'
            }))
        }
    });
});

// ============================================
// 4.3 - CONSULTATION OF TRANSACTION HISTORY
// ============================================

app.get('/wallet/operations', (req, res) => {
    const { contractid } = req.query;

    const transactions = db.getTransactionsByContractId(contractid);

    res.json({
        result: transactions.map(tx => ({
            amount: tx.amount.toFixed(2),
            Fees: tx.fees.toString(),
            beneficiaryFirstName: 'Prenom',
            beneficiaryLastName: 'nom',
            beneficiaryRIB: null,
            clientNote: tx.client_note || '',
            currency: tx.currency,
            date: new Date(tx.created_at).toLocaleString(),
            referenceId: tx.reference_id,
            srcDestNumber: tx.destination_phone,
            status: tx.status,
            totalAmount: tx.amount.toFixed(2),
            totalFrai: tx.fees.toFixed(2),
            type: tx.type,
            isCanceled: false,
            isTierCashIn: false,
            totalPage: Math.ceil(transactions.length / 10)
        }))
    });
});

// ============================================
// 4.4 - BALANCE CONSULTATION
// ============================================

app.get('/wallet/balance', (req, res) => {
    const { contractid } = req.query;

    const wallet = db.getWalletByContractId(contractid);
    if (!wallet) {
        return res.status(404).json({ error: 'Wallet not found' });
    }

    res.json({
        result: {
            balance: [{ value: wallet.balance.toFixed(2) }]
        }
    });
});

// ============================================
// 4.5 - CASH IN
// ============================================

app.post('/wallet/cash/in', (req, res) => {
    const { step } = req.query;

    if (step === 'simulation') {
        const { contractId, level, phoneNumber, amount, fees } = req.body;

        const wallet = db.getWalletByContractId(contractId);
        if (!wallet) {
            return res.status(404).json({ error: 'Wallet not found' });
        }

        const token = generateToken();
        const transactionId = `${Date.now()}001`;

        db.insertPendingOp({
            token,
            type: 'CASH_IN',
            data: JSON.stringify({ contractId, amount: parseFloat(amount), fees: parseFloat(fees || 0) })
        });

        const user = db.getUserById(wallet.user_id);

        res.json({
            result: {
                Fees: (fees || 0).toString(),
                feeDetail: '[{Nature:"COM",InvariantFee:0.000,VariantFee:0.0000000}]',
                token: token,
                amountToCollect: parseFloat(amount),
                isTier: true,
                cardId: contractId,
                transactionId: transactionId,
                benFirstName: user?.first_name || 'Prenom',
                benLastName: user?.last_name || 'nom'
            }
        });
    } else if (step === 'confirmation') {
        const { token, amount, fees } = req.body;

        const pending = db.getPendingOpByToken(token);
        if (!pending) {
            return res.status(400).json({ error: 'Invalid token' });
        }

        const data = JSON.parse(pending.data);
        const referenceId = generateReferenceId();

        db.updateWalletBalance(data.contractId, data.amount);

        db.insertTransaction({
            reference_id: referenceId,
            type: 'CI',
            amount: data.amount,
            fees: data.fees,
            source_contract_id: data.contractId,
            client_note: 'Cash In',
            status: '000',
            currency: 'MAD'
        });

        db.deletePendingOp(token);

        res.json({
            result: {
                Fees: data.fees.toString(),
                feeDetails: null,
                token: token,
                amount: data.amount,
                transactionReference: referenceId,
                cardId: data.contractId
            }
        });
    } else {
        res.status(400).json({ error: 'Invalid step parameter' });
    }
});

// ============================================
// 4.6 - CASH OUT
// ============================================

app.post('/wallet/cash/out', (req, res) => {
    const { step } = req.query;

    if (step === 'simulation') {
        const { phoneNumber, amount, fees } = req.body;

        const wallet = db.getWalletByPhone(phoneNumber);
        if (!wallet) {
            return res.status(404).json({ error: 'Wallet not found' });
        }

        if (wallet.balance < parseFloat(amount)) {
            return res.status(400).json({ error: 'Insufficient balance' });
        }

        const token = generateToken();
        const transactionId = `${Date.now()}001`;

        db.insertPendingOp({
            token,
            type: 'CASH_OUT',
            data: JSON.stringify({ phoneNumber, contractId: wallet.contract_id, amount: parseFloat(amount), fees: parseFloat(fees || 0) })
        });

        res.json({
            result: {
                Fees: (fees || 0).toString(),
                token: token,
                amountToCollect: parseFloat(amount),
                cashOut_Max: wallet.balance,
                cardId: wallet.contract_id,
                transactionId: transactionId,
                feeDetail: '[{Nature:"COM",InvariantFee:0.000,VariantFee:0.0000000}]'
            }
        });
    } else if (step === 'confirmation') {
        const { token, phoneNumber, otp, amount, fees } = req.body;

        const pending = db.getPendingOpByToken(token);
        if (!pending) {
            return res.status(400).json({ error: 'Invalid token' });
        }

        const storedOtp = db.getLatestOtpByPhone(phoneNumber);
        if (!storedOtp || storedOtp.otp !== otp) {
            return res.status(400).json({ error: 'Invalid OTP' });
        }

        db.markOtpUsed(storedOtp.id);

        const data = JSON.parse(pending.data);
        const referenceId = generateReferenceId();

        db.updateWalletBalance(data.contractId, -(data.amount + data.fees));

        db.insertTransaction({
            reference_id: referenceId,
            type: 'CO',
            amount: data.amount,
            fees: data.fees,
            source_contract_id: data.contractId,
            client_note: 'Cash Out',
            status: '000',
            currency: 'MAD'
        });

        db.deletePendingOp(token);

        res.json({
            result: {
                Fees: data.fees.toString(),
                feeDetails: null,
                token: token,
                amount: data.amount,
                transactionReference: referenceId,
                cardId: data.contractId
            }
        });
    } else {
        res.status(400).json({ error: 'Invalid step parameter' });
    }
});

app.post('/wallet/cash/out/otp', (req, res) => {
    const { phoneNumber } = req.body;

    const otp = generateOTP();
    db.insertOtp({ phone_number: phoneNumber, otp, type: 'cash_out' });

    res.json({ result: [{ codeOtp: otp }] });
});

// ============================================
// 4.7 - WALLET TO WALLET
// ============================================

app.post('/wallet/transfer/wallet', (req, res) => {
    const { step } = req.query;

    if (step === 'simulation') {
        const { clientNote, contractId, amout, fees, destinationPhone, mobileNumber } = req.body;

        const sourceWallet = db.getWalletByContractId(contractId);
        const destWallet = db.getWalletByPhone(destinationPhone);

        if (!sourceWallet) {
            return res.status(404).json({ error: 'Source wallet not found' });
        }

        const amount = parseFloat(amout);
        const feeAmount = parseFloat(fees || 0);
        const totalFees = feeAmount === 0 ? 6 : feeAmount;

        if (sourceWallet.balance < amount + totalFees) {
            return res.status(400).json({ error: 'Insufficient balance' });
        }

        const referenceId = generateReferenceId();

        db.insertPendingOp({
            token: referenceId,
            type: 'W2W',
            data: JSON.stringify({ contractId, amount, fees: totalFees, destinationPhone, mobileNumber, clientNote })
        });

        const destUser = destWallet ? db.getUserById(destWallet.user_id) : null;

        res.json({
            result: {
                amount: amount.toString(),
                Fees: totalFees.toString(),
                beneficiaryFirstName: destUser?.first_name || 'Prenom',
                beneficiaryLastName: destUser?.last_name || 'nom',
                referenceId: referenceId,
                totalAmount: (amount + totalFees).toFixed(2),
                totalFrai: totalFees.toFixed(2),
                type: 'TT',
                frais: [
                    { currency: 'MAD', name: 'COM', referenceId, value: totalFees * 0.83 },
                    { currency: 'MAD', name: 'TVA', referenceId, value: totalFees * 0.17 }
                ],
                isCanceled: false,
                isTierCashIn: false
            }
        });
    } else if (step === 'confirmation') {
        const { mobileNumber, contractId, otp, referenceId, destinationPhone, fees } = req.body;

        const pending = db.getPendingOpByToken(referenceId);
        if (!pending) {
            return res.status(400).json({ error: 'Invalid reference' });
        }

        const storedOtp = db.getLatestOtpByPhone(mobileNumber);
        if (!storedOtp || storedOtp.otp !== otp) {
            return res.status(400).json({ error: 'Invalid OTP' });
        }

        db.markOtpUsed(storedOtp.id);

        const data = JSON.parse(pending.data);

        db.updateWalletBalance(data.contractId, -(data.amount + data.fees));
        db.updateWalletBalanceByPhone(data.destinationPhone, data.amount);

        // Look up destination user name
        const destWallet = db.getWalletByPhone(data.destinationPhone);
        const destUser = destWallet ? db.getUserById(destWallet.user_id) : null;
        const destName = destUser ? `${destUser.first_name} ${destUser.last_name}` : data.destinationPhone;

        db.insertTransaction({
            reference_id: referenceId,
            type: 'W2W',
            amount: data.amount,
            fees: data.fees,
            source_contract_id: data.contractId,
            destination_phone: data.destinationPhone,
            destination_name: destName,
            client_note: data.clientNote || `Transfer to ${destName}`,
            category: 'Other',
            status: '000',
            currency: 'MAD'
        });

        db.deletePendingOp(referenceId);

        const sourceWallet = db.getWalletByContractId(data.contractId);

        res.json({
            result: {
                item1: { value: sourceWallet.balance.toFixed(3) },
                item2: '000',
                item3: 'Successful'
            }
        });
    } else {
        res.status(400).json({ error: 'Invalid step parameter' });
    }
});

app.post('/wallet/transfer/wallet/otp', (req, res) => {
    const { phoneNumber } = req.body;

    const otp = generateOTP();
    db.insertOtp({ phone_number: phoneNumber, otp, type: 'w2w' });

    res.json({ result: [{ codeOtp: otp }] });
});

// ============================================
// 4.8 - TRANSFER (BANK TRANSFER)
// ============================================

app.post('/wallet/transfer/virement', (req, res) => {
    const { step } = req.query;

    if (step === 'simulation') {
        const { Amount } = req.body;

        res.json({
            result: [{
                frais: '0',
                fraisSms: null,
                totalAmountWithFee: Amount,
                fraisInclus: false,
                montantDroitTimbre: 0,
                montantFrais: 0,
                montantFraisSMS: 0,
                montantFraisTotal: 0,
                montantTVA: 0,
                montantTVASMS: 0,
                tauxChange: 0
            }]
        });
    } else if (step === 'confirmation') {
        const { ContractId } = req.body;

        const newReferenceId = generateReferenceId();

        res.json({
            result: {
                contractId: ContractId,
                reference: newReferenceId
            }
        });
    } else {
        res.status(400).json({ error: 'Invalid step parameter' });
    }
});

app.post('/wallet/transfer/virement/otp', (req, res) => {
    const { PhoneNumber } = req.body;

    const otp = generateOTP();
    db.insertOtp({ phone_number: PhoneNumber, otp, type: 'transfer' });

    res.json({ result: otp });
});

// ============================================
// 4.9 - ATM WITHDRAWAL
// ============================================

app.post('/wallet/cash/gab/out', (req, res) => {
    const { step } = req.query;

    if (step === 'simulation') {
        const { ContractId, Amount } = req.body;

        const wallet = db.getWalletByContractId(ContractId);
        if (!wallet) {
            return res.status(404).json({ error: 'Wallet not found' });
        }

        const amount = parseFloat(Amount);
        const fees = 3;

        if (wallet.balance < amount + fees) {
            return res.status(400).json({ error: 'Insufficient balance' });
        }

        const token = generateToken();
        const referenceId = generateReferenceId();

        db.insertPendingOp({
            token,
            type: 'ATM',
            data: JSON.stringify({ ContractId, amount, fees, referenceId })
        });

        res.json({
            result: {
                totalFrai: fees.toFixed(2),
                feeDetails: '[{Nature:"COM",InvariantFee:3.000,VariantFee:0.0000000}]',
                token: token,
                totalAmount: amount + fees,
                referenceId: referenceId
            }
        });
    } else if (step === 'confirmation') {
        const { ContractId, Token } = req.body;

        const pending = db.getPendingOpByToken(Token);
        if (!pending) {
            return res.status(400).json({ error: 'Invalid token' });
        }

        const data = JSON.parse(pending.data);
        const transactionId = Math.floor(1000000000 + Math.random() * 9000000000);

        db.updateWalletBalance(data.ContractId, -(data.amount + data.fees));
        db.deletePendingOp(Token);

        res.json({
            result: {
                fee: data.fees.toFixed(2),
                feeDetails: null,
                token: Token,
                amount: data.amount,
                transactionReference: '',
                cardId: data.ContractId,
                transactionId: transactionId,
                transfertCihExpressReference: `00230110002126${Date.now()}`
            }
        });
    } else {
        res.status(400).json({ error: 'Invalid step parameter' });
    }
});

app.post('/wallet/cash/gab/otp', (req, res) => {
    const { phoneNumber } = req.body;

    const otp = generateOTP();
    db.insertOtp({ phone_number: phoneNumber, otp, type: 'atm' });

    res.json({ result: [{ codeOtp: otp }] });
});

// ============================================
// 4.10 - WALLET TO MERCHANT
// ============================================

app.post('/wallet/Transfer/WalletToMerchant', (req, res) => {
    const { step } = req.query;

    if (step === 'simulation') {
        const { clientNote, clientContractId, Amout, clientPhoneNumber, merchantPhoneNumber } = req.body;

        const merchant = db.getMerchantByPhone(merchantPhoneNumber);
        const referenceId = generateReferenceId();

        res.json({
            result: {
                amount: Amout,
                beneficiaryFirstName: merchant?.first_name || 'Merchant',
                beneficiaryLastName: merchant?.last_name || 'Name',
                clientNote: clientNote,
                referenceId: referenceId,
                totalAmount: Amout,
                totalFrai: '0',
                type: 'TM',
                isCanceled: false,
                isTierCashIn: false
            }
        });
    } else if (step === 'confirmation') {
        const { ClientContractId } = req.body;

        const wallet = db.getWalletByContractId(ClientContractId);

        res.json({
            result: {
                item1: { value: wallet?.balance.toFixed(3) || '0.000' },
                item2: '000',
                item3: 'Successful'
            }
        });
    } else {
        res.status(400).json({ error: 'Invalid step parameter' });
    }
});

app.post('/wallet/walletToMerchant/cash/out/otp', (req, res) => {
    const { phoneNumber } = req.body;

    const otp = generateOTP();
    db.insertOtp({ phone_number: phoneNumber, otp, type: 'w2m' });

    res.json({ result: [{ codeOtp: otp }] });
});

// ============================================
// 4.11 - MERCHANT WALLET CREATION
// ============================================

app.post('/merchants', (req, res) => {
    const { MobileNumber } = req.body;

    const token = `ME${Date.now()}${Math.floor(Math.random() * 1000)}`;
    const otp = generateOTP();

    db.insertOtp({ phone_number: MobileNumber, otp, token, type: 'merchant_create' });

    res.status(201).json({
        result: { token: token }
    });
});

app.post('/merchant/activate', (req, res) => {
    const { Token, Otp } = req.body;

    const storedOtp = db.getOtpByTokenAndCode(Token, Otp);
    if (!storedOtp) {
        return res.status(400).json({ error: 'Invalid OTP or token' });
    }

    db.markOtpUsed(storedOtp.id);

    const contractId = `LAN${Date.now()}${Math.floor(Math.random() * 1000)}`;

    db.insertMerchant({
        contract_id: contractId,
        phone_number: storedOtp.phone_number,
        status: 'active',
        balance: 0
    });

    res.status(201).json({
        result: { contractId: contractId }
    });
});

// ============================================
// 4.12 - MERCHANT TO MERCHANT
// ============================================

app.post('/merchant/transaction/simulation', (req, res) => {
    const { ClientNote, ContractId, Amount, DestinationPhone } = req.body;

    const destMerchant = db.getMerchantByPhone(DestinationPhone);
    const referenceId = generateReferenceId();
    const fees = parseFloat(Amount) * 0.04;

    res.json({
        result: [{
            amount: Amount,
            beneficiaryFirstName: destMerchant?.first_name || 'Merchant',
            beneficiaryLastName: destMerchant?.last_name || 'Name',
            clientNote: ClientNote,
            referenceId: referenceId,
            totalAmount: Amount,
            totalFrai: fees.toFixed(2),
            type: 'CC',
            frais: [
                { currency: 'MAD', name: 'COM', referenceId, value: fees * 0.83 },
                { currency: 'MAD', name: 'TVA', referenceId, value: fees * 0.17 }
            ],
            isCanceled: false,
            isTierCashIn: false
        }]
    });
});

app.post('/merchant/transaction/otp', (req, res) => {
    const { phoneNumber } = req.body;

    const otp = generateOTP();
    db.insertOtp({ phone_number: phoneNumber, otp, type: 'm2m' });

    res.json({ result: [{ codeOtp: otp }] });
});

app.post('/merchant/transaction/confirmation', (req, res) => {
    const { ContractId } = req.body;

    const merchant = db.getMerchantByContractId(ContractId);

    res.json({
        result: {
            creditAmounts: null,
            debitAmounts: null,
            depot: null,
            retrait: null,
            value: merchant?.balance.toFixed(3) || '0.000'
        }
    });
});

// ============================================
// 4.13 - DYNAMIC QR CODE
// ============================================

app.post('/wallet/pro/qrcode/dynamic', (req, res) => {
    const { phoneNumber, contractId, amount } = req.body;

    const token = `${Date.now()}${Math.floor(Math.random() * 10000)}`;
    const qrData = JSON.stringify({ phoneNumber, contractId, amount, token });
    const base64Content = Buffer.from(qrData).toString('base64');

    res.json({
        result: {
            phoneNumber: phoneNumber,
            reference: '',
            token: token,
            base64Content: base64Content,
            binaryContent: `000201010212${phoneNumber}${contractId}${amount}${token}`
        }
    });
});

// ============================================
// 4.14 - MERCHANT TO WALLET
// ============================================

app.post('/merchant/merchantToWallet/simulation', (req, res) => {
    const { Amount } = req.body;

    res.json({
        result: {
            amount: parseFloat(Amount),
            feeAmount: 0.0
        }
    });
});

app.post('/merchant/otp/send', (req, res) => {
    const { phoneNumber } = req.body;

    const otp = generateOTP();
    db.insertOtp({ phone_number: phoneNumber, otp, type: 'm2w' });

    res.json({ result: otp });
});

app.post('/merchant/merchantToWallet/confirmation', (req, res) => {
    const referenceId = generateReferenceId();

    res.json({
        result: {
            contractId: null,
            reference: referenceId,
            transferAmount: 0
        }
    });
});

// ============================================
// UTILITY ENDPOINTS
// ============================================

app.get('/demo/users', (req, res) => {
    const users = db.getAllUsersWithWallets();
    res.json({ users });
});

app.get('/demo/merchants', (req, res) => {
    const merchants = db.getAllMerchants();
    res.json({ merchants });
});

app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ============================================
// ANALYTICS ENDPOINTS (for demo)
// ============================================

// Get transactions with categories for analytics
app.get('/analytics/transactions', (req, res) => {
    const { contractid } = req.query;

    const transactions = db.getTransactionsByContractId(contractid);

    // Group by category
    const categoryTotals = {};
    transactions.forEach(tx => {
        const cat = tx.category || 'Other';
        if (!categoryTotals[cat]) {
            categoryTotals[cat] = { amount: 0, count: 0, transactions: [] };
        }
        categoryTotals[cat].amount += tx.amount;
        categoryTotals[cat].count++;
        categoryTotals[cat].transactions.push({
            id: tx.id,
            amount: tx.amount,
            note: tx.client_note,
            destination: tx.destination_name,
            date: tx.created_at,
            type: tx.type
        });
    });

    res.json({
        result: {
            transactions: transactions.map(tx => ({
                id: tx.id,
                amount: tx.amount.toFixed(2),
                fees: tx.fees,
                type: tx.type,
                category: tx.category || 'Other',
                note: tx.client_note,
                destination: tx.destination_name,
                destinationPhone: tx.destination_phone,
                date: tx.created_at,
                status: tx.status
            })),
            categories: Object.entries(categoryTotals).map(([name, data]) => ({
                name,
                totalAmount: data.amount.toFixed(2),
                transactionCount: data.count,
                percentage: 0 // Will be calculated on frontend
            })),
            totalSpent: transactions.filter(t => t.type !== 'CI').reduce((sum, t) => sum + t.amount, 0).toFixed(2),
            totalReceived: transactions.filter(t => t.type === 'CI').reduce((sum, t) => sum + t.amount, 0).toFixed(2)
        }
    });
});

// Simulate a purchase with category (for demo)
app.post('/demo/purchase', (req, res) => {
    const { contractId, amount, merchantName, category, note } = req.body;

    const wallet = db.getWalletByContractId(contractId);
    if (!wallet) {
        return res.status(404).json({ error: 'Wallet not found' });
    }

    const purchaseAmount = parseFloat(amount);
    if (wallet.balance < purchaseAmount) {
        return res.status(400).json({ error: 'Insufficient balance' });
    }

    // Deduct from wallet
    db.updateWalletBalance(contractId, -purchaseAmount);

    // Record transaction with category
    const referenceId = generateReferenceId();
    db.insertTransaction({
        reference_id: referenceId,
        type: 'TM',
        amount: purchaseAmount,
        fees: 0,
        source_contract_id: contractId,
        destination_phone: null,
        destination_name: merchantName || 'Store',
        client_note: note || `Purchase at ${merchantName}`,
        category: category || 'Shopping',
        status: '000',
        currency: 'MAD'
    });

    const updatedWallet = db.getWalletByContractId(contractId);

    res.json({
        result: {
            success: true,
            referenceId,
            merchantName,
            amount: purchaseAmount.toFixed(2),
            category,
            newBalance: updatedWallet.balance.toFixed(2),
            message: `Paid ${purchaseAmount} DH at ${merchantName} (${category})`
        }
    });
});

// Get spending by category
app.get('/analytics/spending', (req, res) => {
    const { contractid } = req.query;

    const transactions = db.getTransactionsByContractId(contractid);
    const spending = transactions.filter(t => t.type !== 'CI'); // Exclude cash in

    const categoryData = {};
    const categories = ['Food & Dining', 'Shopping', 'Transport', 'Healthcare', 'Entertainment', 'Bills', 'Cash', 'Other'];

    categories.forEach(cat => {
        categoryData[cat] = { amount: 0, count: 0 };
    });

    let totalSpent = 0;
    spending.forEach(tx => {
        const cat = tx.category || 'Other';
        if (categoryData[cat]) {
            categoryData[cat].amount += tx.amount;
            categoryData[cat].count++;
        } else {
            categoryData['Other'].amount += tx.amount;
            categoryData['Other'].count++;
        }
        totalSpent += tx.amount;
    });

    res.json({
        result: {
            totalSpent: totalSpent.toFixed(2),
            categories: Object.entries(categoryData).map(([name, data]) => ({
                name,
                amount: data.amount.toFixed(2),
                count: data.count,
                percent: totalSpent > 0 ? Math.round((data.amount / totalSpent) * 100) : 0
            }))
        }
    });
});

// ============================================
// BORROW REQUESTS & DEBTS
// ============================================

// Create a borrow request (ask someone to lend you money)
app.post('/borrow/request', (req, res) => {
    const { fromPhone, fromName, toPhone, amount, note } = req.body;

    // Look up the lender's name
    const toWallet = db.getWalletByPhone(toPhone);
    const toUser = toWallet ? db.getUserById(toWallet.user_id) : null;
    const toName = toUser ? `${toUser.first_name} ${toUser.last_name}` : toPhone;

    const result = db.insertBorrowRequest({
        from_phone: fromPhone,
        from_name: fromName,
        to_phone: toPhone,
        to_name: toName,
        amount: parseFloat(amount),
        note: note || `Borrow request for ${amount} DH`
    });

    res.json({
        result: {
            success: true,
            requestId: result.lastInsertRowid,
            message: `Borrow request sent to ${toName} for ${amount} DH`
        }
    });
});

// Get pending borrow requests (notifications) for a user
app.get('/borrow/pending', (req, res) => {
    const { phone } = req.query;

    const requests = db.getPendingRequestsForUser(phone);

    res.json({
        result: {
            count: requests.length,
            requests: requests.map(r => ({
                id: r.id,
                fromPhone: r.from_phone,
                fromName: r.from_name,
                amount: r.amount,
                note: r.note,
                date: r.created_at,
                status: r.status
            }))
        }
    });
});

// Respond to a borrow request (accept or decline)
app.post('/borrow/respond', (req, res) => {
    const { requestId, action, responderPhone } = req.body; // action: 'accept' or 'decline'

    const request = db.getBorrowRequestById(parseInt(requestId));
    if (!request) {
        return res.status(404).json({ error: 'Request not found' });
    }

    if (action === 'accept') {
        // Check if lender has enough balance
        const lenderWallet = db.getWalletByPhone(request.to_phone);
        if (!lenderWallet || lenderWallet.balance < request.amount) {
            return res.status(400).json({ error: 'Insufficient balance' });
        }

        // Transfer money
        db.updateWalletBalance(lenderWallet.contract_id, -request.amount);
        db.updateWalletBalanceByPhone(request.from_phone, request.amount);

        // Record the transaction
        db.insertTransaction({
            reference_id: generateReferenceId(),
            type: 'W2W',
            amount: request.amount,
            fees: 0,
            source_contract_id: lenderWallet.contract_id,
            destination_phone: request.from_phone,
            destination_name: request.from_name,
            client_note: `Loan to ${request.from_name}`,
            category: 'Other',
            status: '000',
            currency: 'MAD'
        });

        db.updateBorrowRequestStatus(request.id, 'accepted');

        res.json({
            result: {
                success: true,
                message: `You lent ${request.amount} DH to ${request.from_name}`,
                newBalance: (lenderWallet.balance - request.amount).toFixed(2)
            }
        });
    } else {
        db.updateBorrowRequestStatus(request.id, 'declined');
        res.json({
            result: {
                success: true,
                message: 'Request declined'
            }
        });
    }
});

// Get all debts for a user (what they owe and what's owed to them)
app.get('/debts', (req, res) => {
    const { phone } = req.query;

    const debts = db.getDebtsForUser(phone);

    const owedToMe = debts.filter(d => d.to_phone === phone).map(d => ({
        id: d.id,
        user: d.from_name,
        phone: d.from_phone,
        amount: d.amount,
        date: d.created_at,
        status: d.status,
        type: 'owed_to_me'
    }));

    const iOwe = debts.filter(d => d.from_phone === phone).map(d => ({
        id: d.id,
        user: d.to_name,
        phone: d.to_phone,
        amount: d.amount,
        date: d.created_at,
        status: d.status,
        type: 'i_owe'
    }));

    res.json({
        result: {
            owedToMe,
            iOwe,
            totalOwedToMe: owedToMe.reduce((sum, d) => sum + d.amount, 0),
            totalIOwe: iOwe.reduce((sum, d) => sum + d.amount, 0)
        }
    });
});

// ============================================
// BNPL (BUY NOW PAY LATER)
// ============================================

// Get affiliated stores
app.get('/stores', (req, res) => {
    const stores = db.getAffiliatedStores();
    res.json({ result: stores });
});

// Create BNPL Plan
app.post('/bnpl/create', (req, res) => {
    const { userId, storeId, totalAmount } = req.body;

    const result = db.createBnplPlan({
        user_id: parseInt(userId),
        store_id: parseInt(storeId),
        total_amount: parseFloat(totalAmount),
        total_installments: 4
    });

    res.json({
        result: {
            success: true,
            planId: result.lastInsertRowid,
            message: 'BNPL Plan created successfully'
        }
    });
});

// Get User's BNPL Plans
app.get('/bnpl/plans/:userId', (req, res) => {
    const { userId } = req.params;
    const plans = db.getBnplPlansByUser(parseInt(userId));
    res.json({ result: plans });
});

// Pay BNPL Installment
app.post('/bnpl/pay', (req, res) => {
    const { planId } = req.body;
    const updatedPlan = db.payBnplInstallment(parseInt(planId));

    if (updatedPlan) {
        res.json({ result: { success: true, plan: updatedPlan } });
    } else {
        res.status(400).json({ error: 'Payment failed or plan not active' });
    }
});

// ============================================
// CREDIT SCORE API
// ============================================

// Get User Credit Score
app.get('/credit-score/:phone', (req, res) => {
    const { phone } = req.params;

    // Find credit score or generate one based on user activity
    const user = db.getUserByPhone(phone);
    if (!user) {
        return res.status(404).json({ error: 'User not found' });
    }

    // Get transaction history for analysis
    const wallets = db.getWalletsByUserId(user.id);
    const transactions = wallets.length > 0 ? db.getTransactionsByContractId(wallets[0].contract_id) : [];

    // Calculate dynamic credit score based on behavior
    const baseScore = 600;
    let score = baseScore;

    // Factor 1: Account Age (max +50)
    const accountAge = Math.floor((Date.now() - new Date(user.created_at).getTime()) / (1000 * 60 * 60 * 24 * 30)); // months
    score += Math.min(accountAge * 2, 50);

    // Factor 2: Transaction History (max +80)
    const txCount = transactions.length;
    score += Math.min(txCount * 4, 80);

    // Factor 3: Wallet Balance (max +40)
    const totalBalance = wallets.reduce((sum, w) => sum + w.balance, 0);
    score += Math.min(Math.floor(totalBalance / 500), 40);

    // Factor 4: BNPL Payment History (max +30)
    const bnplPlans = db.getBnplPlansByUser(user.id);
    const completedPlans = bnplPlans.filter(p => p.status === 'completed').length;
    score += completedPlans * 10;

    // Cap at 850
    score = Math.min(score, 850);

    // Calculate factor breakdown
    const factors = {
        payment_history: Math.min(85, 50 + txCount * 3),
        credit_utilization: Math.max(10, 50 - (totalBalance / 1000)),
        account_age: Math.min(100, accountAge * 4),
        transaction_diversity: Math.min(80, 30 + txCount * 5),
        social_trust: Math.min(90, 60 + completedPlans * 10),
        bnpl_reliability: completedPlans > 0 ? Math.min(100, 70 + completedPlans * 10) : 50
    };

    res.json({
        result: {
            score,
            grade: score >= 750 ? 'Excellent' : score >= 700 ? 'Good' : score >= 650 ? 'Fair' : 'Building',
            factors,
            insights: [
                txCount < 5 ? 'Make more transactions to build your score' : 'Good transaction history',
                totalBalance < 1000 ? 'Maintain a higher balance' : 'Healthy account balance',
                bnplPlans.length === 0 ? 'Try BNPL to build credit history' : `${completedPlans} BNPL plans completed on time`
            ],
            eligible: {
                credit_card: score >= 680,
                personal_loan: score >= 700,
                bnpl_limit: score >= 650 ? Math.floor(score * 50) : 5000
            }
        }
    });
});

// ============================================
// START SERVER
// ============================================

app.listen(PORT, () => {
    console.log(`
╔══════════════════════════════════════════════════════════════╗
║                                                              ║
║   🏦 CIH Wallet Management Kit Backend                       ║
║   Server running on http://localhost:${PORT}                    ║
║                                                              ║
║   📚 API Documentation: /demo/users, /demo/merchants         ║
║   💊 Health Check: /health                                   ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝
    `);
});
