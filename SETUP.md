# SmartDeadlines Setup Guide

## Quick Start

### Prerequisites
- Node.js (v18 or higher)
- Phantom Wallet browser extension
- Some Devnet SOL and USDC for testing

### 1. Install Dependencies

```bash
# Install root dependencies (Anchor/Solana)
npm install

# Install backend dependencies
cd backend
npm install
cd ..

# Install frontend dependencies
cd app
npm install
cd ..
```

### 2. Start the Backend Server

The backend handles email invitations for tasks.

```bash
cd backend
npm run dev
```

The backend will start on http://localhost:3001

**Note:** Email sending is mocked in development. Emails will be logged to the console instead of actually being sent.

### 3. Start the Frontend

In a new terminal:

```bash
cd app
npm run dev
```

The frontend will start on http://localhost:5173

### 4. Get Test Tokens

For Devnet testing:

1. **Get Devnet SOL:**
   - Visit https://faucet.solana.com/
   - Paste your Phantom wallet address
   - Request 2 SOL

2. **Get Devnet USDC:**
   - The app uses Devnet USDC Mint: `4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU`
   - Use https://spl-token-faucet.com/ or create your own using `spl-token`

## Configuration

### Environment Variables

#### Backend (.env in `/backend/`)
```env
PORT=3001
SENDGRID_API_KEY=your_sendgrid_api_key_here  # Optional - emails are mocked without this
FROM_EMAIL=noreply@smartdeadlines.com
FRONTEND_URL=http://localhost:5173
JWT_SECRET=your_random_secret_key_here_change_in_production
```

#### Frontend (.env in `/app/`)
```env
VITE_CHARITY_PUBKEY=3N6o2e5vQ8YxkTz9uR5bPq1sHfWmVgY2Z7aKcLr8bTq  # Example pubkey
VITE_SOLANA_RPC_URL=https://api.devnet.solana.com
VITE_BACKEND_URL=http://localhost:3001
VITE_PROGRAM_ID=Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS
VITE_USDC_MINT=4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU
VITE_WEB3_STORAGE_TOKEN=your_web3_storage_token_here  # Optional - IPFS is mocked without this
```

## Usage

### Creating a Task

1. Connect your Phantom wallet
2. Click "Create New Task"
3. Fill in the task details:
   - **Title**: Name of your task
   - **Description**: What needs to be accomplished
   - **Stake Amount**: USDC per member (e.g., 10)
   - **Member Emails**: Comma-separated list of emails
   - **Join Window**: How long members have to join (hours)
   - **Deadline**: When the task must be completed (hours)
   - **Charity Address**: Any valid Solana Devnet address (receives funds if task fails)

4. Click "Create Task"

### What Happens Next

1. **IPFS Upload**: Task description is uploaded to IPFS (mocked in dev mode)
2. **On-Chain Creation**: Task is created on Solana blockchain
3. **Email Invites**: Invitation emails are sent to members (logged to console in dev mode)
4. **Task Dashboard**: You're redirected to view your task

### Charity Address

When creating a task, you need to provide a charity address. This is where funds will be sent if the task fails. For development:

- Use any valid Solana address from Devnet
- You can use a second wallet address you own
- The address format is a base58 string (e.g., `3N6o2e5vQ8YxkTz9uR5bPq1sHfWmVgY2Z7aKcLr8bTq`)

## Development Notes

### IPFS Upload Behavior

- **Without Web3.Storage token**: Uses mock implementation that generates fake CIDs
  - These CIDs won't work with actual IPFS but allow development to proceed
  - Check console for "Mock IPFS Upload" messages

- **With Web3.Storage token**: Uses real IPFS uploads
  - Get a free token at https://web3.storage/
  - Add to `VITE_WEB3_STORAGE_TOKEN` in `/app/.env`

### Email Sending Behavior

- **Without SendGrid API key**: Emails are logged to console
  - Check the backend terminal for email content
  - Invite links are still generated and functional

- **With SendGrid API key**: Emails are actually sent
  - Get an API key at https://sendgrid.com/
  - Add to `SENDGRID_API_KEY` in `/backend/.env`

### Devnet vs Mainnet

This app is configured for **Devnet only**. To use on Mainnet:

1. Update `VITE_SOLANA_RPC_URL` to Mainnet RPC
2. Update `VITE_USDC_MINT` to Mainnet USDC
3. Deploy smart contract to Mainnet
4. Update `VITE_PROGRAM_ID` with Mainnet program ID
5. ⚠️ **Use real USDC** - be careful with actual funds!

## Troubleshooting

### "Upload failed" error when creating task

**Solution**: IPFS is now mocked automatically. If you still see this error:
- Check the browser console for detailed error messages
- Ensure the frontend is running (`npm run dev` in `/app/`)

### Emails not sending

**Solution**: This is normal in development!
- Emails are logged to the backend console
- Check the terminal where you ran `npm run dev` in `/backend/`
- Look for messages starting with `=== EMAIL ===`

### Backend connection failed

**Solution**: Ensure backend is running:
```bash
cd backend
npm run dev
```
- Backend should be on http://localhost:3001
- Test with: `curl http://localhost:3001/health`

### Wallet not connecting

**Solution**:
- Install Phantom wallet extension
- Switch to Devnet in Phantom settings
- Refresh the page

### Transaction failed

**Solution**:
- Ensure you have Devnet SOL for gas fees
- Ensure you have Devnet USDC for the stake amount
- Check Phantom wallet is on Devnet network
- Check browser console for detailed error

## Architecture

```
GroupProof/
├── app/                    # React frontend
│   ├── src/
│   │   ├── pages/         # Page components
│   │   ├── components/    # Reusable components
│   │   ├── hooks/         # Custom React hooks
│   │   └── utils/         # Utilities (IPFS, Anchor, etc.)
│   └── .env               # Frontend environment variables
├── backend/               # Express.js backend
│   ├── src/
│   │   ├── routes/        # API routes
│   │   └── utils/         # Email, storage, etc.
│   └── .env               # Backend environment variables
├── programs/              # Solana smart contract (Anchor)
└── tests/                 # Integration tests
```

## Next Steps

1. Connect Phantom wallet to the app
2. Get Devnet SOL and USDC
3. Create a test task with your email
4. Check backend console for invitation email content
5. Use the invite link to join the task
6. Complete the task workflow: join → submit proof → vote → finalize

## Support

For issues, check:
- Browser console for frontend errors
- Backend terminal for API/email errors
- Phantom wallet for transaction details
