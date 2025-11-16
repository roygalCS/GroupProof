# How Members Can Join Tasks

## Overview

Yes! People can now join tasks. Here's how the complete flow works:

## Join Flow

### 1. **Creator Creates Task**
- Creator fills out the task form
- Invitation emails are sent to all member email addresses
- Each email contains a unique invite link

### 2. **Member Receives Email**
- Member clicks the invite link in their email
- Link format: `http://localhost:5173/join/{invite-token}`
- The invite token is a JWT that expires in 7 days

### 3. **Member Opens Join Page**
- Frontend verifies the invite token with the backend
- Task details are displayed:
  - Task ID
  - Stake amount required
  - Current member count
  - Join window deadline
  - Task deadline
  - Charity address

### 4. **Member Connects Wallet**
- Member clicks "Connect Phantom" button
- Approves wallet connection

### 5. **Member Joins & Deposits**
- Member clicks "Join & Deposit Stake" button
- Wallet prompts to approve:
  1. **USDC Transfer**: Transfers stake amount from member's wallet to escrow
  2. **Transaction Fee**: Small SOL amount for transaction fees
- On-chain transaction executes:
  - Creates member account (PDA)
  - Transfers USDC to escrow
  - Updates task member count
  - Records email hash

### 6. **Success**
- Member is redirected to task dashboard
- Can see task status and other members

## Requirements for Members

### Wallet Setup
1. **Install Phantom Wallet**
   - Download from https://phantom.app
   - Create or import a wallet

2. **Get Devnet SOL** (for transaction fees)
   - Use Solana Faucet: https://faucet.solana.com
   - Request airdrop to your wallet address
   - Need ~0.1 SOL for multiple transactions

3. **Get Devnet USDC** (for stake deposit)
   - **Important**: You need Devnet USDC, not mainnet!
   - Devnet USDC Mint: `4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU`
   - Ways to get Devnet USDC:
     - Use a Devnet USDC faucet (if available)
     - Swap SOL for USDC on a Devnet DEX
     - Ask the creator to send you some Devnet USDC
     - For testing: Use a Devnet token faucet

### Before Joining
- ✅ Wallet connected
- ✅ Have enough USDC in wallet (stake amount + small buffer)
- ✅ Have SOL for transaction fees (~0.01 SOL)
- ✅ Join window hasn't closed
- ✅ Task isn't full

## Common Issues

### "Insufficient funds"
- **SOL**: Get more from faucet
- **USDC**: Need Devnet USDC, not mainnet. Check you're on Devnet.

### "Join window has closed"
- The join window timestamp has passed
- Creator needs to create a new task with a longer join window

### "Task is full"
- All required members have already joined
- Cannot join this task

### "Invalid or expired invite link"
- Link expired (7 days)
- Link was already used
- Invalid token

### "Transaction failed"
- Check wallet has enough SOL for fees
- Check wallet has enough USDC
- Verify you're on Solana Devnet (not Mainnet)
- Check network connection

## Testing the Join Flow

### As Creator:
1. Create a task with your own email in the member list
2. Check your email for the invite link
3. Open the link in an incognito window (to simulate a different user)
4. Connect a different wallet
5. Join the task

### As Member:
1. Wait for invite email
2. Click invite link
3. Connect wallet
4. Ensure you have Devnet USDC and SOL
5. Click "Join & Deposit Stake"
6. Approve transactions in wallet

## Devnet vs Mainnet

**Currently configured for Devnet:**
- All transactions happen on Solana Devnet
- Use Devnet SOL and Devnet USDC
- Free to use, no real money at risk
- Perfect for testing

**To switch to Mainnet:**
- Update `App.tsx` to use `WalletAdapterNetwork.Mainnet`
- Update USDC mint address to mainnet USDC
- **Warning**: Real money will be used!

## Security Notes

- Invite links expire after 7 days
- Each invite link is tied to a specific email address
- Members must deposit the exact stake amount
- Funds are locked in escrow until task completion
- Only verified members (via email) can join

