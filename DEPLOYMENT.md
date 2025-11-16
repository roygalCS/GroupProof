# SmartDeadlines - Deployment Guide

## Current Issue

The Solana program needs to be built and deployed to Devnet before the frontend can interact with it.

**Error you're seeing**: "Transaction simulation failed: Error processing Instruction 0: Unsupported program id"

This means the program ID `Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS` doesn't exist on Devnet yet.

## Prerequisites for Deployment

1. **Rust and Cargo** installed
2. **Solana CLI** installed
3. **Anchor CLI** installed
4. **Devnet SOL** in your wallet for deployment fees (~2-5 SOL)

## Step-by-Step Deployment

### 1. Install Required Tools (if not already installed)

```bash
# Install Rust
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
source $HOME/.cargo/env

# Install Solana CLI
sh -c "$(curl -sSfL https://release.solana.com/stable/install)"

# Install Anchor CLI (version 0.29.0 to match project)
cargo install --git https://github.com/coral-xyz/anchor --tag v0.29.0 anchor-cli --locked

# Verify installations
rustc --version
solana --version
anchor --version
```

### 2. Configure Solana for Devnet

```bash
# Set cluster to devnet
solana config set --url devnet

# Check your wallet address
solana address

# Get devnet SOL (run this a few times to get ~5 SOL)
solana airdrop 2

# Check balance
solana balance
```

### 3. Build the Program

```bash
# From the project root directory
anchor build
```

This will compile the Rust program and create:
- `target/deploy/smart_deadlines.so` - The compiled program
- `target/idl/smart_deadlines.json` - The IDL (Interface Definition Language) file

### 4. Deploy to Devnet

```bash
# Deploy the program
anchor deploy

# Note the Program ID that gets printed
# It should match: Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS
```

**Important**: If you get a different Program ID, you'll need to update it in:
- `Anchor.toml` - All program sections (localnet, devnet, testnet)
- `programs/smart-deadlines/src/lib.rs` - The `declare_id!()` macro
- `app/.env` - The `VITE_PROGRAM_ID` variable

Then rebuild and deploy again.

### 5. Verify Deployment

```bash
# Check if the program is deployed
solana program show Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS --url devnet

# You should see program details if successful
```

### 6. Update Frontend IDL

After deployment, copy the IDL to the frontend:

```bash
# Copy IDL to frontend
cp target/idl/smart_deadlines.json app/src/idl/

# If the app/src/idl directory doesn't exist, create it
mkdir -p app/src/idl
```

## Alternative: Use a Pre-deployed Program ID

If you don't want to deploy your own program, you can use an already deployed instance (if available). However, you'll need to:

1. Get the deployed program ID
2. Update it in all configuration files mentioned above
3. Make sure you have the matching IDL file

## Troubleshooting

### "cargo: command not found"

Install Rust first: `curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh`

### "Error: No such file or directory (os error 2)"

This usually means Rust/Cargo isn't properly installed or isn't in your PATH. Try:
```bash
source $HOME/.cargo/env
```

### "Anchor version mismatch"

Make sure you're using Anchor 0.29.0:
```bash
anchor --version
# Should show: anchor-cli 0.29.0
```

### "Insufficient funds"

You need more devnet SOL:
```bash
solana airdrop 2
# Run multiple times if needed
```

### Build takes forever

Rust compilation can be slow the first time. Subsequent builds are faster due to caching.

## Quick Commands Summary

```bash
# 1. Build
anchor build

# 2. Deploy
anchor deploy

# 3. Verify
solana program show Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS --url devnet

# 4. Test (optional)
anchor test --skip-local-validator
```

## What Happens After Deployment

Once deployed successfully:

1. ✅ The program will be live on Devnet
2. ✅ Your frontend will be able to interact with it
3. ✅ You can create tasks, join them, vote, etc.
4. ✅ All transactions will happen on Solana Devnet

## Need Help?

If you're stuck on deployment, you have a few options:

1. **Deploy yourself** - Follow the steps above
2. **Ask for help** - Share the errors you're encountering
3. **Use localnet** - Test with `solana-test-validator` instead of Devnet
