# CIH Wallet Management Kit - Backend API

A complete Node.js/Express backend implementing the CIH Wallet Management Kit API for the hackathon.

## 🚀 Quick Start

```bash
cd backend
npm install
npm start
```

Server runs on **http://localhost:3001**

## 📊 Demo Accounts

### Customer Wallets

| Name | Phone | Contract ID | Balance | RIB |
|------|-------|-------------|---------|-----|
| Ahmed Benali | 212600000001 | LAN2400000000000001 | 5,000 DH | 853780241716465970000001 |
| Fatima Zahra | 212600000002 | LAN2400000000000002 | 12,500 DH | 853780241716465970000002 |
| Youssef Amrani | 212600000003 | LAN2400000000000003 | 8,750 DH | 853780241716465970000003 |
| Sara Idrissi | 212600000004 | LAN2400000000000004 | 3,200 DH | 853780241716465970000004 |
| Karim Tazi | 212600000005 | LAN2400000000000005 | 15,000 DH | 853780241716465970000005 |

### Merchant Wallets

| Company | Phone | Contract ID | Balance |
|---------|-------|-------------|---------|
| Café Atlas | 212700000001 | MER2400000000000001 | 25,000 DH |
| Pharmacie Centrale | 212700000002 | MER2400000000000002 | 45,000 DH |
| Tech Store | 212700000003 | MER2400000000000003 | 78,000 DH |

---

## 📱 App Action → API Route Mapping

### Home Screen

| App Action | Method | Route | Description |
|------------|--------|-------|-------------|
| View Balance | GET | `/wallet/balance?contractid={id}` | Get wallet balance |
| View Transactions | GET | `/wallet/operations?contractid={id}` | Get transaction history |

### Send Money (Wallet to Wallet)

| App Action | Method | Route | Description |
|------------|--------|-------|-------------|
| Enter Amount | POST | `/wallet/transfer/wallet?step=simulation` | Simulate transfer |
| Request OTP | POST | `/wallet/transfer/wallet/otp` | Get verification code |
| Confirm Send | POST | `/wallet/transfer/wallet?step=confirmation` | Execute transfer |

### Receive Money (Cash IN)

| App Action | Method | Route | Description |
|------------|--------|-------|-------------|
| Enter Amount | POST | `/wallet/cash/in?step=simulation` | Simulate deposit |
| Confirm Deposit | POST | `/wallet/cash/in?step=confirmation` | Execute deposit |

### Withdraw Cash (Cash OUT)

| App Action | Method | Route | Description |
|------------|--------|-------|-------------|
| Enter Amount | POST | `/wallet/cash/out?step=simulation` | Simulate withdrawal |
| Request OTP | POST | `/wallet/cash/out/otp` | Get verification code |
| Confirm Withdrawal | POST | `/wallet/cash/out?step=confirmation` | Execute withdrawal |

### ATM Withdrawal

| App Action | Method | Route | Description |
|------------|--------|-------|-------------|
| Enter Amount | POST | `/wallet/cash/gab/out?step=simulation` | Simulate ATM withdrawal |
| Request OTP | POST | `/wallet/cash/gab/otp` | Get verification code |
| Confirm | POST | `/wallet/cash/gab/out?step=confirmation` | Execute ATM withdrawal |

### Pay Merchant

| App Action | Method | Route | Description |
|------------|--------|-------|-------------|
| Scan QR / Enter Amount | POST | `/wallet/Transfer/WalletToMerchant?step=simulation` | Simulate payment |
| Request OTP | POST | `/wallet/walletToMerchant/cash/out/otp` | Get verification code |
| Confirm Payment | POST | `/wallet/Transfer/WalletToMerchant?step=confirmation` | Execute payment |

### Create Wallet

| App Action | Method | Route | Description |
|------------|--------|-------|-------------|
| Register | POST | `/wallet?state=precreate` | Pre-register wallet |
| Verify OTP | POST | `/wallet?state=activate` | Activate wallet |

### QR Code (Merchant)

| App Action | Method | Route | Description |
|------------|--------|-------|-------------|
| Generate QR | POST | `/wallet/pro/qrcode/dynamic` | Create payment QR code |

### Bank Transfer

| App Action | Method | Route | Description |
|------------|--------|-------|-------------|
| Enter Details | POST | `/wallet/transfer/virement?step=simulation` | Simulate transfer |
| Request OTP | POST | `/wallet/transfer/virement/otp` | Get verification code |
| Confirm Transfer | POST | `/wallet/transfer/virement?step=confirmation` | Execute transfer |

---

## 🧪 Testing with cURL

### Get Balance
```bash
curl "http://localhost:3001/wallet/balance?contractid=LAN2400000000000001"
```

### Send Money (Wallet to Wallet)
```bash
# Step 1: Simulate
curl -X POST "http://localhost:3001/wallet/transfer/wallet?step=simulation" \
  -H "Content-Type: application/json" \
  -d '{"contractId":"LAN2400000000000001","amout":"100","destinationPhone":"212600000002","mobileNumber":"212600000001","clientNote":"Test"}'

# Step 2: Get OTP
curl -X POST "http://localhost:3001/wallet/transfer/wallet/otp" \
  -H "Content-Type: application/json" \
  -d '{"phoneNumber":"212600000001"}'

# Step 3: Confirm (use referenceId from step 1 and OTP from step 2)
curl -X POST "http://localhost:3001/wallet/transfer/wallet?step=confirmation" \
  -H "Content-Type: application/json" \
  -d '{"mobileNumber":"212600000001","contractId":"LAN2400000000000001","otp":"123456","referenceId":"YOUR_REF","destinationPhone":"212600000002"}'
```

### View Demo Users
```bash
curl "http://localhost:3001/demo/users"
```

### View Demo Merchants
```bash
curl "http://localhost:3001/demo/merchants"
```

---

## 📁 Project Structure

```
backend/
├── package.json      # Dependencies
├── database.js       # SQLite setup & seed data
├── server.js         # Express API server
├── wallet.db         # SQLite database (auto-created)
└── README.md         # This file
```

## 🔐 Authentication

As per hackathon rules, **no authentication is required**. All endpoints are open.

## 📝 Response Codes

| Code | Meaning |
|------|---------|
| 200 | Success |
| 201 | Created |
| 400 | Invalid request |
| 404 | Not found |
| 500 | Server error |

---

## 🎯 Hackathon Notes

1. **OTP Handling**: OTPs are generated and stored in the database. For demo purposes, use the OTP returned by the API.
2. **Balance Updates**: All transactions update balances in real-time.
3. **Reset Data**: Delete `wallet.db` and restart the server to reset demo data.
