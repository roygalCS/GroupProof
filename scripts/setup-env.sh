#!/bin/bash

# Script to setup environment files from examples

set -e

echo "Setting up environment files..."

# Setup backend .env
if [ ! -f backend/.env ]; then
    echo "Creating backend/.env from backend/.env.example..."
    cp backend/.env.example backend/.env
    echo "✓ Created backend/.env"
    echo "  Please edit backend/.env and add your SendGrid API key"
else
    echo "✓ backend/.env already exists"
fi

# Setup frontend .env
if [ ! -f app/.env ]; then
    echo "Creating app/.env from app/.env.example..."
    cp app/.env.example app/.env
    echo "✓ Created app/.env"
    echo "  Please edit app/.env and update the values"
else
    echo "✓ app/.env already exists"
fi

echo ""
echo "========================================="
echo "Environment Setup Complete!"
echo "========================================="
echo ""
echo "Next steps:"
echo "1. Edit backend/.env and add your SendGrid API key"
echo "2. Edit app/.env and update USDC mint address"
echo "3. Run: npm install (in root, app/, and backend/ directories)"
echo "4. Deploy the program: ./scripts/deploy.sh devnet"
echo "========================================="
