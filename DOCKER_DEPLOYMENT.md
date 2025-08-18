# Docker Deployment Guide for AnglerPhish

## Overview

This guide covers how to deploy AnglerPhish using Docker and Docker Compose with proper multi-stage builds, security practices, and production-ready configurations.

## Architecture

The deployment consists of:
- **Multi-stage Dockerfile** for optimized builds
- **Frontend builder stage** - Downloads dependencies and builds React application
- **Backend builder stage** - Downloads Node.js dependencies during build
- **Production stage** - Minimal production image with only runtime dependencies
- **MongoDB** with health checks and authentication
- **Docker volumes** for persistent data
- **Network isolation** between services

**🚨 IMPORTANT**: This project uses **build-time dependency installation**. No `node_modules` directories exist in the repository. All dependencies are downloaded fresh during the Docker build process for maximum security and cross-platform compatibility.

## Prerequisites

- Docker 20.x or higher
- Docker Compose 3.8 or higher
- `.env` file configured (see Environment Variables section)

## Quick Start

### 1. Development Environment

```bash
# Clone and navigate to the project
cd AnglerPhish

# Copy and configure environment file
cp .env.example .env
# Edit .env with your specific configuration

# Start services in development mode
docker-compose -f docker-compose.dev.yml up -d

# View logs
docker-compose -f docker-compose.dev.yml logs -f app
```

### 2. Production Environment

```bash
# Build and start production services
docker-compose up -d

# View logs
docker-compose logs -f app

# Check health status
docker-compose ps
```

## Environment Variables

### Required Variables

Create a `.env` file in the project root with the following variables:

```bash
# Database Configuration
MONGODB_URI=mongodb://localhost:27017/anglerphish

# JWT Configuration (CRITICAL - Change in production)
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production_2024

# Email Configuration (IMAP for receiving emails)
IMAP_USER=your_email@gmail.com
IMAP_PASS=your_gmail_app_password
IMAP_HOST=imap.gmail.com
IMAP_PORT=993
IMAP_SECURE=true

# Email Configuration (SMTP for sending emails)
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_gmail_app_password
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false

# Admin User Configuration
ADMIN_EMAIL=admin@yourcompany.com
ADMIN_PASSWORD=ChangeThisSecurePassword

# Application Configuration
NODE_ENV=production
PORT=5000

# MongoDB Configuration (for Docker)
MONGO_PORT=27017
MONGO_ROOT_USERNAME=admin
MONGO_ROOT_PASSWORD=ChangeThisPassword123
```

### Gmail Configuration

To use Gmail for email processing:

1. Enable 2-Factor Authentication on your Gmail account
2. Generate an App Password:
   - Go to Google Account settings
   - Security → 2-Step Verification → App passwords
   - Generate password for "AnglerPhish"
3. Use the app password in `IMAP_PASS` and `SMTP_PASS`

## Docker Architecture Details

### Multi-Stage Build Process

The Dockerfile uses a 3-stage build with **build-time dependency installation**:

1. **Frontend Builder Stage**
   - Downloads frontend dependencies using `npm ci` from package-lock.json
   - Builds React application with production optimizations
   - Generates static assets in `/build` directory
   - Dependencies are isolated to this build stage only

2. **Backend Builder Stage** 
   - Downloads Node.js dependencies during build time
   - No pre-existing `node_modules` directory used
   - Prepares server-side dependencies fresh

3. **Production Stage**
   - Minimal Alpine Linux base
   - Downloads **only production dependencies** using `npm ci --only=production`
   - Copies built React app from frontend builder stage
   - Non-root user for security
   - Health checks configured
   - Puppeteer with system Chromium
   - **No development dependencies** in final image

**Why Build-Time Installation?**
- ✅ **Cross-platform compatibility**: No platform-specific binaries in repository
- ✅ **Security**: Fresh dependencies with latest patches
- ✅ **Reproducible builds**: Exact versions from package-lock.json
- ✅ **Smaller repository**: No 600MB+ node_modules in Git
- ✅ **Docker layer caching**: Efficient rebuilds when only source code changes

### Security Features

- **Non-root user**: Application runs as `anglerphish` user
- **Minimal attack surface**: Alpine Linux base image
- **No secrets in image**: Environment variables used for configuration
- **Health checks**: Application and database health monitoring
- **Network isolation**: Services communicate through Docker network
- **Volume permissions**: Proper ownership of mounted volumes

## Service Management

### Starting Services

```bash
# Development
docker-compose -f docker-compose.dev.yml up -d

# Production
docker-compose up -d

# Build and start (force rebuild)
docker-compose up -d --build
```

### Stopping Services

```bash
# Stop services
docker-compose down

# Stop and remove volumes (CAUTION: Data loss)
docker-compose down -v
```

### Monitoring

```bash
# View logs
docker-compose logs -f app
docker-compose logs -f mongo

# Check service status
docker-compose ps

# Check health status
docker inspect anglerphish-app | grep Health -A 20
```

### Scaling and Updates

```bash
# Update application without downtime
docker-compose pull app
docker-compose up -d app

# Scale horizontally (if load balancer configured)
docker-compose up -d --scale app=3
```

## Data Persistence

### Volumes

- `mongo_data`: MongoDB database files
- `uploads_data`: Email attachments and rendered images  
- `logs_data`: Application logs

### Backup

```bash
# Backup MongoDB
docker exec anglerphish-mongo mongodump --db anglerphish --out /tmp/backup
docker cp anglerphish-mongo:/tmp/backup ./backup/$(date +%Y%m%d)

# Backup uploads and logs
docker run --rm -v anglerphish_uploads_data:/data -v $(pwd):/backup alpine tar czf /backup/uploads-backup-$(date +%Y%m%d).tar.gz /data
```

## Troubleshooting

### Common Issues

1. **Build Failures**
   ```bash
   # Clear Docker cache and rebuild
   docker system prune -f
   docker-compose build --no-cache
   ```

2. **Permission Issues**
   ```bash
   # Fix volume permissions
   docker-compose exec app chown -R anglerphish:nodejs /usr/src/app/uploads
   ```

3. **Database Connection Issues**
   ```bash
   # Check MongoDB health
   docker-compose exec mongo mongosh --eval "db.adminCommand('ping')"
   
   # Check network connectivity
   docker-compose exec app ping mongo
   ```

4. **Email Configuration Issues**
   ```bash
   # Test email settings
   docker-compose exec app node -e "
   const emailService = require('./server/services/emailService');
   emailService.testConnection().then(() => console.log('✅ Email OK')).catch(console.error);
   "
   ```

### Viewing Application

- **Web Interface**: http://localhost:5000
- **Default Admin**: As configured in `.env` file
- **Health Check**: http://localhost:5000/api/config/health

### Performance Optimization

1. **Resource Limits**
   ```yaml
   # Add to docker-compose.yml services
   deploy:
     resources:
       limits:
         cpus: '1.0'
         memory: 1G
       reservations:
         cpus: '0.5'
         memory: 512M
   ```

2. **Multi-stage Build Benefits**
   - Smaller production image (~200MB vs ~500MB)
   - No development dependencies in production
   - Better layer caching
   - Faster deployments

## Production Considerations

### Security Checklist

- [ ] Change all default passwords in `.env`
- [ ] Use strong JWT secret (32+ characters)
- [ ] Configure firewall rules
- [ ] Enable MongoDB authentication
- [ ] Use HTTPS with reverse proxy (nginx/traefik)
- [ ] Regular security updates
- [ ] Monitor logs for suspicious activity

### Monitoring

- Configure log aggregation (ELK stack, Grafana)
- Set up health check monitoring
- Monitor resource usage
- Alert on service failures

### Backups

- Automated database backups
- Regular testing of restore procedures
- Offsite backup storage
- Backup rotation policy

## Development vs Production

| Feature | Development | Production |
|---------|-------------|------------|
| Environment | `NODE_ENV=development` | `NODE_ENV=production` |
| Logging | Console output | File logging |
| MongoDB Auth | Disabled | Enabled |
| Volume Mounts | Local directories | Docker volumes |
| SSL/TLS | Optional | Required |
| Resource Limits | None | Configured |

This deployment setup provides a production-ready, secure, and scalable foundation for the AnglerPhish application.