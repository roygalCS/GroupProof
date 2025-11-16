# SmartDeadlines - Quick Start

## Running the Application

### Terminal 1: Backend
```bash
cd backend
npm run dev
```
✅ Backend runs on http://localhost:3001

### Terminal 2: Frontend
```bash
cd app
npm run dev
```
✅ Frontend runs on http://localhost:5173

## Creating Your First Task

1. **Open app**: http://localhost:5173
2. **Connect Phantom wallet** (top-right button)
3. **Click "Create New Task"**
4. **Fill in the form**:
   ```
   Title: Test Project
   Description: Complete our group assignment
   Stake: 10 (USDC per member)
   Emails: friend1@email.com, friend2@email.com
   Join Window: 24 (hours)
   Deadline: 168 (hours = 1 week)
   Charity Address: [paste any Solana Devnet address]
   ```
5. **Click "Create Task"**

## Key Points

### ✅ What Works Automatically

- **IPFS uploads**: Mocked automatically - no setup needed
- **Emails**: Logged to backend console - no SendGrid needed
- **Blockchain**: Uses Solana Devnet - no real money needed

### 🔧 What You Need

- **Phantom Wallet**: Install browser extension
- **Devnet SOL**: Get from https://faucet.solana.com/
- **Devnet USDC**: Token mint `4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU`

### 📝 Charity Address

When creating a task, use **any valid Solana address** as the charity address:
- Can be your own second wallet
- Can be any random Devnet address
- Example: `3N6o2e5vQ8YxkTz9uR5bPq1sHfWmVgY2Z7aKcLr8bTq`

## Expected Console Output

### Backend Console (Terminal 1)
```
SmartDeadlines backend server running on port 3001
Frontend URL: http://localhost:5173

=== EMAIL (SendGrid not configured) ===
To: friend1@email.com
Subject: You've been invited to join: Test Project
...
Invite Link: http://localhost:5173/join/[token]
=======================================
```

### Frontend Console (Browser)
```
⚠️ IPFS: Using mock implementation (Web3.Storage not configured)
📦 Mock IPFS Upload: { fileName: 'data.json', mockCID: 'Qm...' }
✅ Description uploaded to IPFS: Qm...
✅ Task created! Transaction: [signature]
✅ Invitation emails sent successfully
```

## Common Issues

### ❌ "Upload failed"
- **Fixed!** IPFS now uses mock implementation
- Check browser console for details

### ❌ Emails not sending
- **This is normal!** Emails are logged to backend console
- Check Terminal 1 for the email content

### ❌ Backend connection failed
- Ensure backend is running: `cd backend && npm run dev`
- Check http://localhost:3001/health

### ❌ Wallet won't connect
- Install Phantom extension
- Switch to **Devnet** in Phantom settings
- Refresh the page

## Testing Flow

1. **Create task** → See transaction in Phantom
2. **Check backend console** → See invitation emails logged
3. **Copy invite link** → Open in new browser tab
4. **Join task** → Deposit USDC
5. **Submit proof** → Upload completion evidence
6. **Vote** → Members vote YES/NO
7. **Finalize** → Get refund or donate to charity

## Need Help?

See [SETUP.md](./SETUP.md) for detailed setup instructions.
