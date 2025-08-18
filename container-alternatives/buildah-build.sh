#!/bin/bash
# Buildah build script for AnglerPhish - builds images without Docker daemon

set -e

echo "🔨 Building AnglerPhish with Buildah"
echo "==================================="

# Navigate to project root
cd "$(dirname "$0")/.."

# Stage 1: Frontend Builder
echo "📦 Stage 1: Building frontend..."
frontend_container=$(buildah from node:18-alpine)
buildah config --workingdir /app/client $frontend_container
buildah copy $frontend_container client/package*.json ./
buildah run $frontend_container npm ci --only=production --silent
buildah copy $frontend_container client/ ./
buildah run $frontend_container npm run build

# Stage 2: Production Image
echo "🏭 Stage 2: Creating production image..."
production_container=$(buildah from node:18-alpine)

# Install Chrome dependencies for Puppeteer
buildah run $production_container -- apk add --no-cache \
    chromium \
    nss \
    freetype \
    freetype-dev \
    harfbuzz \
    ca-certificates \
    ttf-freefont

# Configure environment
buildah config --env PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true $production_container
buildah config --env PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser $production_container
buildah config --env NODE_ENV=production $production_container

# Create app directory and user
buildah config --workingdir /usr/src/app $production_container
buildah run $production_container -- addgroup -g 1001 -S nodejs
buildah run $production_container -- adduser -S anglerphish -u 1001

# Install production dependencies
buildah copy $production_container package*.json ./
buildah run $production_container npm ci --only=production --silent
buildah run $production_container npm cache clean --force

# Copy server code
buildah copy $production_container server/ ./server/

# Copy built React app from frontend stage
buildah copy --from $frontend_container $production_container /app/client/build ./client/build

# Create directories and set permissions
buildah run $production_container -- mkdir -p uploads logs
buildah run $production_container -- chown -R anglerphish:nodejs /usr/src/app

# Configure container
buildah config --user anglerphish $production_container
buildah config --port 5000 $production_container
buildah config --cmd '["npm", "start"]' $production_container

# Add health check
buildah config --healthcheck 'CMD node -e "require(\"http\").get(\"http://localhost:5000/api/config/health\", (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })" || exit 1' $production_container
buildah config --healthcheck-interval 30s $production_container
buildah config --healthcheck-timeout 3s $production_container
buildah config --healthcheck-start-period 5s $production_container
buildah config --healthcheck-retries 3 $production_container

# Commit the image
echo "💾 Committing AnglerPhish image..."
buildah commit $production_container anglerphish:latest

# Clean up containers
buildah rm $frontend_container $production_container

echo "✅ AnglerPhish image built successfully with Buildah!"
echo "📋 Next steps:"
echo "  podman run -d --name anglerphish -p 5000:5000 --env-file .env anglerphish:latest"
echo "  buildah images  # List built images"