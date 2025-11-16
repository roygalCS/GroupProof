#!/bin/bash

# Script to create a local USDC mint for testing
# This should be run on localnet/devnet for testing purposes

set -e

echo "Creating test USDC mint..."

# Check if solana CLI is installed
if ! command -v solana &> /dev/null; then
    echo "Error: Solana CLI not found. Please install it first."
    exit 1
fi

# Check if spl-token CLI is installed
if ! command -v spl-token &> /dev/null; then
    echo "Error: SPL Token CLI not found. Installing..."
    cargo install spl-token-cli
fi

# Set cluster to devnet (change to localnet if needed)
CLUSTER=${1:-devnet}
solana config set --url $CLUSTER

echo "Using cluster: $CLUSTER"
echo "Current wallet: $(solana address)"

# Create USDC mint with 6 decimals (same as real USDC)
echo "Creating USDC mint..."
MINT_ADDRESS=$(spl-token create-token --decimals 6 | grep "Creating token" | awk '{print $3}')

echo "USDC Mint created: $MINT_ADDRESS"

# Create token account for current wallet
echo "Creating token account..."
TOKEN_ACCOUNT=$(spl-token create-account $MINT_ADDRESS | grep "Creating account" | awk '{print $3}')

echo "Token account created: $TOKEN_ACCOUNT"

# Mint some USDC for testing (1000 USDC)
echo "Minting 1000 USDC for testing..."
spl-token mint $MINT_ADDRESS 1000

echo ""
echo "==================================="
echo "Test USDC Setup Complete!"
echo "==================================="
echo "Mint Address: $MINT_ADDRESS"
echo "Your Token Account: $TOKEN_ACCOUNT"
echo "Balance: 1000 USDC"
echo ""
echo "Add this to your .env file:"
echo "VITE_USDC_MINT=$MINT_ADDRESS"
echo "==================================="
