#!/bin/bash
# Podman build script for AnglerPhish

set -e

echo "🐳 Building AnglerPhish with Podman"
echo "=================================="

# Navigate to project root
cd "$(dirname "$0")/.."

# Build the image
echo "📦 Building AnglerPhish image..."
podman build \
    --tag anglerphish:latest \
    --target production \
    --file Dockerfile \
    .

# Create a pod (Podman's equivalent to docker-compose networking)
echo "🌐 Creating AnglerPhish pod..."
podman pod create \
    --name anglerphish-pod \
    --publish 5000:5000 \
    --publish 27017:27017

# Run MongoDB container
echo "🍃 Starting MongoDB..."
podman run -d \
    --pod anglerphish-pod \
    --name anglerphish-mongo \
    --env MONGO_INITDB_DATABASE=anglerphish \
    --env MONGO_INITDB_ROOT_USERNAME=admin \
    --env MONGO_INITDB_ROOT_PASSWORD=password123 \
    --volume anglerphish-mongo-data:/data/db \
    --volume ./docker/mongo-init.js:/docker-entrypoint-initdb.d/mongo-init.js:ro \
    docker.io/mongo:5-focal \
    mongod --auth

# Wait for MongoDB to start
echo "⏳ Waiting for MongoDB to start..."
sleep 10

# Run AnglerPhish application
echo "🎣 Starting AnglerPhish application..."
podman run -d \
    --pod anglerphish-pod \
    --name anglerphish-app \
    --env-file .env \
    --env NODE_ENV=production \
    --env MONGODB_URI=mongodb://localhost:27017/anglerphish \
    --volume anglerphish-uploads:/usr/src/app/uploads \
    --volume anglerphish-logs:/usr/src/app/logs \
    anglerphish:latest

echo "✅ AnglerPhish is now running on http://localhost:5000"
echo ""
echo "📋 Management commands:"
echo "  podman pod ps                     # Show pod status"
echo "  podman logs anglerphish-app       # View application logs"
echo "  podman logs anglerphish-mongo     # View MongoDB logs"
echo "  podman pod stop anglerphish-pod   # Stop all services"
echo "  podman pod rm anglerphish-pod     # Remove pod"