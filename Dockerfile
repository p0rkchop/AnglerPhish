# ==============================================================================
# Build Stage - Frontend
# ==============================================================================
FROM node:18-alpine AS frontend-builder

WORKDIR /app/client

# Copy frontend package files for better layer caching
COPY client/package*.json ./

# Install frontend dependencies
RUN npm ci --only=production --silent

# Copy frontend source code
COPY client/ ./

# Build the React application
RUN npm run build

# ==============================================================================
# Build Stage - Backend Dependencies
# ==============================================================================
FROM node:18-alpine AS backend-builder

WORKDIR /app

# Copy backend package files for better layer caching
COPY package*.json ./

# Install all dependencies (including dev dependencies for build if needed)
RUN npm ci --silent

# ==============================================================================
# Production Stage
# ==============================================================================
FROM node:18-alpine AS production

# Install Chrome dependencies for Puppeteer in production
RUN apk add --no-cache \
    chromium \
    nss \
    freetype \
    freetype-dev \
    harfbuzz \
    ca-certificates \
    ttf-freefont \
    && rm -rf /var/cache/apk/*

# Tell Puppeteer to use the installed Chromium
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser \
    NODE_ENV=production

# Create app directory and non-root user
WORKDIR /usr/src/app
RUN addgroup -g 1001 -S nodejs && \
    adduser -S anglerphish -u 1001

# Copy package files and install production dependencies only
COPY package*.json ./
RUN npm ci --only=production --silent && \
    npm cache clean --force

# Copy server source code
COPY server/ ./server/

# Copy built React app from frontend builder
COPY --from=frontend-builder /app/client/build ./client/build

# Create necessary directories and set permissions
RUN mkdir -p uploads logs && \
    chown -R anglerphish:nodejs /usr/src/app

# Switch to non-root user
USER anglerphish

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD node -e "require('http').get('http://localhost:5000/api/config/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })" || exit 1

# Expose port
EXPOSE 5000

# Start the application
CMD ["npm", "start"]