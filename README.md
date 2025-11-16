# SmartDeadlines

**On-Chain Accountability Escrow for Group Tasks**

SmartDeadlines is a Solana-based decentralized application (dApp) that helps college students and teams stay accountable for group projects. By requiring members to stake SPL-USDC tokens, it creates financial incentives to complete tasks on time. If the task is completed successfully and the majority votes YES, everyone gets their money back. Otherwise, the funds go to charity.

---

## Features

- **On-Chain Escrow**: Secure SPL-USDC deposits managed by Solana smart contracts
- **Democratic Voting**: Members vote on task completion after the deadline
- **Automatic Distribution**: Funds are automatically refunded or donated based on vote outcome
- **IPFS Integration**: Task descriptions and proof of completion stored on IPFS
- **Email Invitations**: Seamless onboarding via email invite links
-- **Wallet Support**: Built for Phantom and compatible Solana wallets
- **Transparent**: All actions recorded on-chain for full transparency

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     SmartDeadlines System                    │
└─────────────────────────────────────────────────────────────┘

┌──────────────────┐      ┌──────────────────┐      ┌──────────────────┐
│  React Frontend  │◄────►│  Node Backend    │      │  Solana Program  │
│   (Vite + TS)    │      │  (Express API)   │      │  (Anchor/Rust)   │
└──────────────────┘      └──────────────────┘      └──────────────────┘
         │                         │                          │
         │                         │                          │
    ┌────▼────┐              ┌────▼────┐              ┌──────▼──────┐
    │ Wallet  │              │ SendGrid│              │  Solana RPC │
    │ Adapter │              │  Email  │              │   (Devnet)  │
    └─────────┘              └─────────┘              └─────────────┘
         │                                                    │
    ┌────▼────────────────────────────────────────────────────▼────┐
    │                         IPFS Network                          │
    │              (Web3.Storage / NFT.Storage)                     │
    └───────────────────────────────────────────────────────────────┘
```

### Components

1. **Anchor Program** ([programs/smart-deadlines/src/lib.rs](programs/smart-deadlines/src/lib.rs))
   - Creates and manages tasks
   - Handles SPL-USDC deposits via escrow PDAs
   - Processes votes and distributes funds
   - All logic executed on-chain

2. **React Frontend** ([app/src/](app/src/))
   - User interface for all interactions
   - Wallet connection (Phantom, etc.)
   - IPFS file uploads
   - Task dashboard and voting UI

3. **Node Backend** ([backend/src/](backend/src/))
   - Sends email invitations via SendGrid
   - Generates and verifies invite tokens (JWT)
   - Minimal state storage (production: use database)

4. **IPFS Storage**
   - Stores task descriptions
   - Stores proof of completion files
   - Only CIDs stored on-chain

---

## Project Structure

```
GroupProof/
├── programs/
│   └── smart-deadlines/
│       ├── src/
│       │   └── lib.rs              # Anchor program (Rust)
│       ├── Cargo.toml
│       └── Xargo.toml
├── app/                             # React frontend
│   ├── src/
│   │   ├── pages/                   # All page components
│   │   ├── hooks/                   # Custom React hooks
│   │   ├── utils/                   # Utility functions
│   │   ├── idl/                     # Program IDL
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── package.json
│   ├── vite.config.ts
│   └── .env.example
├── backend/                         # Node.js backend
│   ├── src/
│   │   ├── server.js
│   │   ├── routes/
│   │   │   └── invites.js
│   │   └── utils/
│   │       ├── email.js
│   │       └── storage.js
│   ├── package.json
│   └── .env.example
├── scripts/                         # Deployment scripts
│   ├── deploy.sh
│   ├── create-usdc-mint.sh
│   ├── test-local.sh
│   └── setup-env.sh
├── tests/
│   └── smart-deadlines.ts           # Anchor tests
├── Anchor.toml
├── Cargo.toml
└── README.md
```

---

## Installation & Setup

### Prerequisites

- **Node.js** v18+ and npm/yarn
- **Rust** v1.70+
- **Solana CLI** v1.16+
- **Anchor CLI** v0.29+
- **Git**

### Step 1: Clone Repository

```bash
git clone https://github.com/yourusername/GroupProof.git
cd GroupProof
```

### Step 2: Install Dependencies

```bash
# Install all dependencies (root, frontend, backend)
npm run install:all

# Or manually:
npm install
cd app && npm install && cd ..
cd backend && npm install && cd ..
```

### Step 3: Setup Environment Files

```bash
# Creates .env files from examples
npm run setup

# Or manually:
cp backend/.env.example backend/.env
cp app/.env.example app/.env
```

### Step 4: Configure Environment Variables

**Backend** (`backend/.env`):
```env
PORT=3001
SENDGRID_API_KEY=your_sendgrid_api_key_here
FROM_EMAIL=noreply@smartdeadlines.com
FRONTEND_URL=http://localhost:5173
JWT_SECRET=change_this_to_a_random_secret
```

**Frontend** (`app/.env`):
```env
VITE_SOLANA_RPC_URL=https://api.devnet.solana.com
VITE_BACKEND_URL=http://localhost:3001
VITE_PROGRAM_ID=Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS
VITE_USDC_MINT=4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU
VITE_WEB3_STORAGE_TOKEN=your_web3_storage_token
```

> **Note**: Get a Web3.Storage API token at https://web3.storage

### Step 5: Build and Deploy Anchor Program

```bash
# Set Solana to devnet
solana config set --url devnet

# Get some SOL for deployment
solana airdrop 2

# Build the program
anchor build

# Deploy to devnet
npm run deploy:devnet

# Or use the script directly:
./scripts/deploy.sh devnet
```

After deployment, update `VITE_PROGRAM_ID` in `app/.env` with the deployed program ID.

### Step 6: Create Test USDC Mint

```bash
# Create a test USDC mint on devnet
npm run create-usdc

# Or:
./scripts/create-usdc-mint.sh devnet
```

This will output a mint address. Update `VITE_USDC_MINT` in `app/.env`.

### Step 7: Start the Application

Open **three terminals**:

**Terminal 1 - Backend:**
```bash
cd backend
npm start
# Runs on http://localhost:3001
```

**Terminal 2 - Frontend:**
```bash
cd app
npm run dev
# Runs on http://localhost:5173
```

**Terminal 3 - Local Validator (Optional for local testing):**
```bash
npm run deploy:local
# Starts local validator and deploys program
```

---

## Usage Guide

### 1. Create a Task

1. Connect your Phantom wallet (or compatible Solana wallet)
2. Click "Create New Task"
3. Fill in:
   - Task title and description
   - Stake amount (USDC per member)
   - Member email addresses (comma-separated)
   - Join window (how long members have to join)
   - Deadline (when task must be completed)
   - Charity wallet address (receives funds if task fails)
4. Click "Create Task"
5. Approve the transaction in your wallet

### 2. Join a Task (As a Member)

1. Check your email for the invitation
2. Click the invite link
3. Connect your wallet
4. Review task details
5. Click "Join & Deposit Stake"
6. Approve the USDC transfer

### 3. Submit Proof of Completion

1. Navigate to the task dashboard
2. Click "Submit Proof of Completion"
3. Upload your proof file (PDF, images, documents)
4. File is uploaded to IPFS
5. CID is stored on-chain

### 4. Vote on Completion

1. After the deadline passes, go to the task page
2. Click "Cast Your Vote"
3. Review the submitted proof (view on IPFS)
4. Vote YES if completed, NO if not
5. Approve the transaction

### 5. Finalize and Claim

**If majority voted YES:**
- Click "Finalize Task"
- Each member can then "Claim Refund" to get their USDC back

**If majority voted NO (or tie):**
- Click "Finalize Task"
- All USDC is sent to the charity address
- No refunds available

---

## Testing

### Run Anchor Tests

```bash
anchor test
```

### Local Testing Environment

```bash
# Starts local validator, deploys program, runs tests
npm run deploy:local
```

### Manual Testing Flow

1. Create a test USDC mint (see Step 6 above)
2. Fund multiple wallets with test USDC:
   ```bash
   spl-token transfer <MINT> <AMOUNT> <RECIPIENT_ADDRESS>
   ```
3. Create a task from one wallet
4. Join from other wallets
5. Test the full flow

---

## Judge Demo Instructions

### Quick Demo Setup (5 minutes)

1. **Prerequisites Installed**: Ensure Node.js, Solana CLI, Anchor installed
2. **Clone and Install**:
   ```bash
   git clone <repo-url>
   cd GroupProof
   npm run install:all
   npm run setup
   ```

3. **Configure .env files** (use provided test values or create new ones)

4. **Deploy to Devnet**:
   ```bash
   npm run deploy:devnet
   npm run create-usdc
   ```

5. **Start Services**:
   ```bash
   # Terminal 1
   cd backend && npm start

   # Terminal 2
   cd app && npm run dev
   ```

6. **Open Browser**: Navigate to `http://localhost:5173`

### Demo Flow

1. **Connect Wallet** - Use Phantom or any Solana wallet on devnet
2. **Create Task** - Fill in task details with test emails
3. **Check Console** - Backend logs email invites (if SendGrid not configured)
4. **Join as Members** - Use invite links from console/emails
5. **Submit Proof** - Upload a test file (gets stored on IPFS)
6. **Vote** - Each member votes YES/NO
7. **Finalize** - See automatic distribution based on votes

---

## Wallet Support

SmartDeadlines supports multiple Solana wallets for maximum flexibility:

### **Gemini Wallet (Deprecated / Removed)**
Previously there were experimental references to Gemini Wallet in this repository. The project currently recommends using Phantom or any Solana Wallet Adapter-compatible wallet. If an official Gemini Solana adapter is released in the future, it can be added.

### **Phantom Wallet (Available Now)**
Phantom is the most popular Solana wallet with excellent security and UX.

- **Status**: ✅ Ready to use
- **Features**: Multi-chain support, hardware wallet integration, NFT support
- **Download**: https://phantom.app/
- **Integration**: Fully integrated and tested

### **Other Supported Wallets**
- Solflare
- Any Solana Wallet Adapter compatible wallet

### How to Connect

1. **First Time Users**: Click the "Connect Wallet" button in the header and select Phantom or another compatible wallet
2. **Already Have a Wallet**: Click the "Connect Wallet" button in the header
3. **Choose Your Wallet**: Select from available wallets in the modal
4. **Approve Connection**: Sign the connection request in your wallet
5. **Ready to Go**: Your wallet address will be displayed

---

## Technical Details

### On-Chain Program Instructions

1. **`create_task`** - Creates a new task with escrow PDA
2. **`join_and_deposit`** - Member joins and deposits SPL-USDC stake
3. **`submit_proof`** - Task creator uploads IPFS CID of proof
4. **`vote`** - Members vote YES/NO after deadline
5. **`finalize`** - Sends all funds to charity if majority NO (or tie)
6. **`claim_refund`** - Members claim refund if majority YES

### PDA Seeds

- **Task PDA**: `["task", task_id]`
- **Escrow PDA**: `["escrow", task_pubkey]`
- **Member PDA**: `["member", task_pubkey, member_pubkey]`

### Vote Logic

- **Majority YES** (strict majority): All members get refunds
- **Majority NO or TIE**: All funds go to charity
- Example: 2-2 vote = charity (not a strict majority for YES)

### Security Features

- Join window prevents late joins
- Deadline enforcement for voting
- Proof submission only by task creator
- One vote per member
- PDA-signed transfers for security
- All state transitions validated on-chain

---

## Troubleshooting

### Common Issues

**"Transaction simulation failed"**
- Check your wallet has enough SOL for fees
- Ensure USDC balance is sufficient
- Verify you're on the correct network (devnet/testnet)

**"Program not found"**
- Redeploy the program
- Update `VITE_PROGRAM_ID` in `app/.env`
- Clear browser cache

**"Email not sending"**
- Check `SENDGRID_API_KEY` in `backend/.env`
- Emails are logged to console if SendGrid not configured
- Verify `FROM_EMAIL` is verified in SendGrid

**"IPFS upload failed"**
- Check `VITE_WEB3_STORAGE_TOKEN` is set
- Ensure file size is reasonable (<100MB)
- Try alternative IPFS services (Pinata, NFT.storage)

---

## Future Enhancements

- [ ] Mobile-responsive design improvements
- [ ] Notification system for task updates
- [ ] Multi-signature approval for large stakes
- [ ] Task templates for common use cases
- [ ] Analytics dashboard for task creators
- [ ] Integration with project management tools
- [ ] Support for other SPL tokens besides USDC
- [ ] Dispute resolution mechanism
- [ ] Reputation system for members

---

## Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## License

This project is licensed under the MIT License - see the LICENSE file for details.

---

## Acknowledgments

- Built with [Anchor](https://www.anchor-lang.com/)
- Wallet integration via [Solana Wallet Adapter](https://github.com/solana-labs/wallet-adapter)
- IPFS storage via [Web3.Storage](https://web3.storage/)
- Email service via [SendGrid](https://sendgrid.com/)
- UI framework: React + Vite

---

## Contact & Support

- **Issues**: https://github.com/yourusername/GroupProof/issues
- **Documentation**: See `/docs` folder (if available)
- **Discord**: [Your Discord link]
- **Twitter**: [@YourHandle]

---

## Appendix: Environment Variables Reference

### Backend Environment Variables

| Variable | Description | Required | Example |
|----------|-------------|----------|---------|
| `PORT` | Backend server port | No | `3001` |
| `SENDGRID_API_KEY` | SendGrid API key for emails | Yes (for email) | `SG.xxx...` |
| `FROM_EMAIL` | Sender email address | Yes | `noreply@smartdeadlines.com` |
| `FRONTEND_URL` | Frontend URL for invite links | Yes | `http://localhost:5173` |
| `JWT_SECRET` | Secret for signing invite tokens | Yes | `random-secret-key` |

### Frontend Environment Variables

| Variable | Description | Required | Example |
|----------|-------------|----------|---------|
| `VITE_SOLANA_RPC_URL` | Solana RPC endpoint | Yes | `https://api.devnet.solana.com` |
| `VITE_BACKEND_URL` | Backend API URL | Yes | `http://localhost:3001` |
| `VITE_PROGRAM_ID` | Deployed program address | Yes | `Fg6PaFpo...` |
| `VITE_USDC_MINT` | USDC mint address | Yes | `4zMMC9sr...` |
| `VITE_WEB3_STORAGE_TOKEN` | Web3.Storage API token | Yes | `eyJhbG...` |

---

**Built with ❤️ for hackathons, group projects, and accountability**
