#!/bin/bash

# AnglerPhish Production Deployment Script
# This script deploys the complete phishing email detection system

set -e

echo "AnglerPhish Production Deployment Starting..."

# Check if .env file exists
if [ ! -f .env ]; then
    echo "Error: .env file not found. Please copy .env.example to .env and configure it."
    exit 1
fi

# Source environment variables
source .env

# Check required environment variables
required_vars=("JWT_SECRET" "IMAP_USER" "IMAP_PASS" "SMTP_USER" "SMTP_PASS" "ADMIN_EMAIL" "ADMIN_PASSWORD")
for var in "${required_vars[@]}"; do
    if [ -z "${!var}" ]; then
        echo "Error: Required environment variable $var is not set in .env file"
        exit 1
    fi
done

echo "Environment configuration validated"

# Install backend dependencies
echo "Installing backend dependencies..."
npm install --production

# Install frontend dependencies and build
echo "Installing frontend dependencies..."
cd client
npm install --production

echo "Building React frontend for production..."
npm run build

cd ..

# Create necessary directories
echo "Creating necessary directories..."
mkdir -p uploads logs

# Set proper permissions
chmod 755 uploads logs

echo "Starting services with Docker Compose..."

# Check if Docker is available
if command -v docker &> /dev/null && command -v docker-compose &> /dev/null; then
    # Stop any existing containers
    docker-compose down 2>/dev/null || true
    
    # Build and start containers
    docker-compose up -d --build
    
    echo "Waiting for services to start..."
    sleep 30
    
    # Check if services are healthy
    if docker-compose ps | grep -q "Up"; then
        echo "Docker services started successfully"
        echo "Application should be available at http://localhost:${PORT:-5000}"
        echo "Configure email submissions to: ${IMAP_USER}"
        echo "Admin login: ${ADMIN_EMAIL}"
    else
        echo "Some services failed to start. Check logs with: docker-compose logs"
        exit 1
    fi
else
    echo "Docker not available. Starting in development mode..."
    
    # Start MongoDB (assuming it's running separately)
    echo "Please ensure MongoDB is running on mongodb://localhost:27017"
    
    # Set production environment
    export NODE_ENV=production
    export PORT=${PORT:-5000}
    
    # Start the application
    echo "Starting AnglerPhish application..."
    npm start &
    
    echo "Application started in development mode"
    echo "Available at http://localhost:${PORT:-5000}"
    echo "Configure email submissions to: ${IMAP_USER}"
    echo "Admin login: ${ADMIN_EMAIL}"
fi

echo ""
echo "AnglerPhish Deployment Complete!"
echo ""
echo "Next Steps:"
echo "1. Configure Gmail App Password for ${IMAP_USER}"
echo "2. Log in with admin credentials: ${ADMIN_EMAIL}"
echo "3. Test email submission by forwarding a suspicious email to ${IMAP_USER}"
echo "4. Monitor logs: docker-compose logs -f (or check logs/ directory)"
echo ""
echo "Security Reminder:"
echo "- Change default admin password immediately after first login"
echo "- Ensure .env file permissions are restricted (600)"
echo "- Configure proper firewall rules for production deployment"
echo ""