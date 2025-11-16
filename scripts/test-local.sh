#!/bin/bash

# Script to run full local test environment
# This starts a local validator, deploys the program, and runs tests

set -e

echo "========================================="
echo "Starting Local Test Environment"
echo "========================================="

# Kill any existing solana-test-validator
echo "Stopping any existing validators..."
pkill -9 solana-test-validator || true

# Wait a bit for cleanup
sleep 2

# Start local validator
echo "Starting local validator..."
solana-test-validator \
  --reset \
  --quiet \
  &

VALIDATOR_PID=$!
echo "Validator PID: $VALIDATOR_PID"

# Wait for validator to start
echo "Waiting for validator to start..."
sleep 5

# Set config to localhost
solana config set --url localhost

# Check validator is running
if ! solana cluster-version &> /dev/null; then
    echo "Error: Validator failed to start"
    kill $VALIDATOR_PID || true
    exit 1
fi

echo "Validator is running!"

# Build and deploy
echo "Building program..."
anchor build

echo "Deploying to local validator..."
anchor deploy

# Get program ID
PROGRAM_ID=$(solana address -k target/deploy/smart_deadlines-keypair.json)
echo "Program deployed: $PROGRAM_ID"

# Run tests
echo "Running tests..."
anchor test --skip-local-validator

echo ""
echo "========================================="
echo "Local Test Environment Ready!"
echo "========================================="
echo "Validator PID: $VALIDATOR_PID"
echo "Program ID: $PROGRAM_ID"
echo ""
echo "To stop the validator:"
echo "  kill $VALIDATOR_PID"
echo ""
echo "To run tests:"
echo "  anchor test --skip-local-validator"
echo "========================================="

# Keep script running
echo ""
echo "Press Ctrl+C to stop the validator and exit"
wait $VALIDATOR_PID
