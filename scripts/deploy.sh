#!/bin/bash

# Deployment script for SmartDeadlines
# Usage: ./scripts/deploy.sh [localnet|devnet|testnet]

set -e

CLUSTER=${1:-devnet}

echo "========================================="
echo "Deploying SmartDeadlines to $CLUSTER"
echo "========================================="

# Check if anchor is installed
if ! command -v anchor &> /dev/null; then
    echo "Error: Anchor CLI not found. Please install it first."
    exit 1
fi

# Set Solana cluster
echo "Setting Solana cluster to $CLUSTER..."
solana config set --url $CLUSTER

# Show current wallet
WALLET=$(solana address)
echo "Deploying from wallet: $WALLET"

# Check balance
BALANCE=$(solana balance | awk '{print $1}')
echo "Wallet balance: $BALANCE SOL"

if (( $(echo "$BALANCE < 2" | bc -l) )); then
    echo "Warning: Low balance. You may need to airdrop some SOL."
    if [ "$CLUSTER" != "mainnet-beta" ]; then
        echo "Requesting airdrop..."
        solana airdrop 2 || echo "Airdrop failed, continuing anyway..."
    fi
fi

# Build the program
echo "Building program..."
anchor build

# Get program ID
PROGRAM_ID=$(solana address -k target/deploy/smart_deadlines-keypair.json)
echo "Program ID: $PROGRAM_ID"

# Update Anchor.toml with correct program ID if needed
echo "Updating Anchor.toml..."
sed -i.bak "s/smart_deadlines = \".*\"/smart_deadlines = \"$PROGRAM_ID\"/" Anchor.toml

# Deploy
echo "Deploying program..."
anchor deploy --provider.cluster $CLUSTER

echo ""
echo "========================================="
echo "Deployment Complete!"
echo "========================================="
echo "Program ID: $PROGRAM_ID"
echo "Cluster: $CLUSTER"
echo ""
echo "Next steps:"
echo "1. Update app/.env with VITE_PROGRAM_ID=$PROGRAM_ID"
echo "2. Create a test USDC mint: ./scripts/create-usdc-mint.sh $CLUSTER"
echo "3. Update app/.env with the USDC mint address"
echo "4. Start the frontend: cd app && npm run dev"
echo "5. Start the backend: cd backend && npm start"
echo "========================================="
