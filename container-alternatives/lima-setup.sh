#!/bin/bash
# Lima setup script for AnglerPhish

set -e

echo "🦙 Setting up Lima for AnglerPhish"
echo "=================================="

# Check if Lima is installed
if ! command -v limactl &> /dev/null; then
    echo "❌ Lima is not installed. Installing via Homebrew..."
    if command -v brew &> /dev/null; then
        brew install lima
    else
        echo "❌ Homebrew not found. Please install Lima manually:"
        echo "   https://github.com/lima-vm/lima#installation"
        exit 1
    fi
fi

# Navigate to project root
cd "$(dirname "$0")/.."

# Start Lima VM
echo "🚀 Starting Lima VM for AnglerPhish..."
limactl start container-alternatives/lima-anglerphish.yml

# Wait for VM to be ready
echo "⏳ Waiting for VM to be ready..."
sleep 30

# Show VM info
echo "✅ Lima VM is ready!"
echo ""
echo "📋 Available commands:"
echo "  limactl shell lima-anglerphish                    # SSH into VM"
echo "  limactl shell lima-anglerphish docker --version   # Run Docker in VM"
echo "  limactl shell lima-anglerphish 'cd anglerphish && docker-compose up -d'  # Deploy AnglerPhish"
echo ""

# Example deployment
echo "🎣 Example: Deploy AnglerPhish in Lima VM"
echo "limactl shell lima-anglerphish 'cd anglerphish && cp .env.example .env && docker-compose up -d'"
echo ""
echo "🌐 Access AnglerPhish at: http://localhost:5000"
echo "🗄️  Access MongoDB at: localhost:27017"