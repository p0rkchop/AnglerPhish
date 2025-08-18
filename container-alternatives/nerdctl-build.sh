#!/bin/bash
# nerdctl build script for AnglerPhish using containerd

set -e

echo "🦭 Building AnglerPhish with nerdctl (containerd)"
echo "================================================"

# Navigate to project root
cd "$(dirname "$0")/.."

# Build the image using nerdctl
echo "📦 Building AnglerPhish image..."
nerdctl build \
    --tag anglerphish:latest \
    --target production \
    --file Dockerfile \
    --progress=plain \
    .

# Create network
echo "🌐 Creating network..."
nerdctl network create anglerphish-network 2>/dev/null || echo "Network already exists"

# Run MongoDB
echo "🍃 Starting MongoDB..."
nerdctl run -d \
    --name anglerphish-mongo-nerdctl \
    --network anglerphish-network \
    --publish 27017:27017 \
    --env MONGO_INITDB_DATABASE=anglerphish \
    --env MONGO_INITDB_ROOT_USERNAME=admin \
    --env MONGO_INITDB_ROOT_PASSWORD=password123 \
    --volume anglerphish-mongo-data:/data/db \
    --volume ./docker/mongo-init.js:/docker-entrypoint-initdb.d/mongo-init.js:ro \
    --restart unless-stopped \
    mongo:5-focal \
    mongod --auth

# Wait for MongoDB
echo "⏳ Waiting for MongoDB to start..."
sleep 15

# Run AnglerPhish application
echo "🎣 Starting AnglerPhish application..."
nerdctl run -d \
    --name anglerphish-app-nerdctl \
    --network anglerphish-network \
    --publish 5000:5000 \
    --env-file .env \
    --env NODE_ENV=production \
    --env MONGODB_URI=mongodb://anglerphish-mongo-nerdctl:27017/anglerphish \
    --volume anglerphish-uploads:/usr/src/app/uploads \
    --volume anglerphish-logs:/usr/src/app/logs \
    --restart unless-stopped \
    anglerphish:latest

echo "✅ AnglerPhish is now running on http://localhost:5000"
echo ""
echo "📋 Management commands:"
echo "  nerdctl ps                          # List running containers"
echo "  nerdctl logs anglerphish-app-nerdctl    # View application logs"
echo "  nerdctl logs anglerphish-mongo-nerdctl  # View MongoDB logs"
echo "  nerdctl stop anglerphish-app-nerdctl    # Stop application"
echo "  nerdctl stop anglerphish-mongo-nerdctl  # Stop MongoDB"
echo "  nerdctl compose -f container-alternatives/nerdctl-compose.yml up -d  # Use compose"