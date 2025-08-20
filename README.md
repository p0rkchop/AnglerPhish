# AnglerPhish

A gamified phishing email submission system that allows organizations to encourage employees to report suspicious emails by earning points for successful submissions.

## Overview

AnglerPhish is a defensive security tool designed to improve organizational security awareness by:
- Providing a simple way for users to submit suspicious emails
- Gamifying the process with scoring to encourage participation  
- Giving administrators tools to review and score submissions
- Maintaining audit trails of all security-related submissions

## Architecture

- **Backend**: Node.js/Express with MongoDB
- **Frontend**: React with Material-UI
- **Email Processing**: IMAP/SMTP integration for Gmail
- **Deployment**: Docker containerized application

## Features

- **Email Ingestion**: Automatically retrieves submitted emails via IMAP every 5 minutes
- **Email Processing**: Parses emails, extracts URLs, processes attachments
- **Email Rendering**: Converts emails to PNG images for safe preview
- **Admin Dashboard**: Review submissions, score them (0-100 points), manage system
- **Automatic Responses**: Sends acknowledgment emails to submitters
- **Configuration Management**: Web-based system configuration and health monitoring

## Quick Start

### Docker Deployment (Recommended)

The easiest way to run AnglerPhish is with Docker. **This project uses build-time dependency installation** - no `node_modules` directories exist in the repository.

```bash
# 1. Clone the repository
git clone <repository-url>
cd AnglerPhish

# 2. Configure environment
cp .env.example .env
# Edit .env with your configuration (see DOCKER_DEPLOYMENT.md for details)

# 3. Build and start (dependencies downloaded during build)
docker-compose up -d --build

# 4. Access the application
# Web interface: http://localhost:5000
# Admin login: Use credentials from your .env file
```

**IMPORTANT**: Do NOT run `npm install` manually. All dependencies are automatically downloaded during the Docker build process for optimal security and cross-platform compatibility.

For detailed Docker deployment instructions, see [DOCKER_DEPLOYMENT.md](DOCKER_DEPLOYMENT.md).

**Container Alternatives**: Don't have Docker? AnglerPhish also works with Podman, Buildah, nerdctl, Lima, and Kubernetes. See [CONTAINER_ALTERNATIVES.md](CONTAINER_ALTERNATIVES.md) for complete instructions.

### Manual Development Setup

**Note**: For development without Docker, you'll need to install dependencies manually since they're not included in the repository:

```bash
# Install backend dependencies
npm install

# Install frontend dependencies
cd client && npm install

# Start development servers
npm run dev  # Starts both backend and frontend
```

## Build-Time Dependency Installation

This project follows modern containerization best practices:

- **No `node_modules` in Git**: Dependencies are not committed to the repository
- **Fresh installs**: Dependencies are downloaded during Docker build for security
- **Cross-platform**: No platform-specific binaries causing compatibility issues
- **Reproducible**: Uses `package-lock.json` for exact version resolution
- **Efficient**: Docker layer caching optimizes rebuild times

### Why This Approach?

| Traditional (❌) | Build-Time (✅) |
|-----------------|----------------|
| 600MB+ node_modules in Git | Clean repository ~50MB |
| Platform-specific binaries | Works on any Docker platform |
| Stale/vulnerable packages | Fresh downloads with patches |
| Slow Git operations | Fast clone/pull operations |
| Manual dependency management | Automated during build |

### Prerequisites

- Docker and Docker Compose
- Gmail account with App Passwords enabled
- MongoDB (included in Docker setup)

### 1. Clone and Setup

```bash
git clone <repository-url>
cd AnglerPhish
cp .env.example .env
```

### 2. Configure Environment

Edit `.env` file with your Gmail credentials:

```bash
# Gmail Configuration
IMAP_USER=your-email@gmail.com
IMAP_PASS=your-app-password
SMTP_USER=your-email@gmail.com  
SMTP_PASS=your-app-password

# Admin User (optional - defaults provided)
ADMIN_EMAIL=admin@anglerphish.com
ADMIN_PASSWORD=admin123

# JWT Secret (generate a secure random string)
JWT_SECRET=your-secure-jwt-secret
```

### 3. Start with Docker

```bash
# Build and start all services
docker-compose up -d

# View logs
docker-compose logs -f app
```

The application will be available at `http://localhost:5000`

### 4. Login

- **URL**: `http://localhost:5000`
- **Default Admin**: `admin@anglerphish.com` / `admin123`

## Development Setup

For local development without Docker:

```bash
# Install backend dependencies
npm install

# Install frontend dependencies  
cd client
npm install
cd ..

# Start MongoDB (requires local MongoDB installation)
mongod

# Start in development mode (backend + frontend)
npm run dev
```

## Gmail Setup

1. Enable 2-Factor Authentication on your Gmail account
2. Generate an App Password:
   - Google Account Settings → Security → App passwords
   - Select "Mail" and generate password
   - Use this password in your `.env` file

## Usage

### For End Users
1. Forward suspicious emails to the configured email address (e.g., anglerphish25@gmail.com)
2. Receive automatic acknowledgment email
3. Wait for admin to review and score the submission

### For Administrators  
1. Login to admin dashboard
2. Review pending submissions on the Dashboard
3. Click on submissions to view details, attachments, and extracted URLs
4. Score submissions (0-100 points) to mark them as completed
5. Monitor system health in the Config section

## API Endpoints

### Authentication
- `POST /api/auth/login` - Admin login
- `GET /api/auth/me` - Get current user

### Submissions  
- `GET /api/submissions` - List submissions (admin only)
- `GET /api/submissions/:id` - Get submission details (admin only)
- `POST /api/submissions/:id/score` - Score a submission (admin only)
- `GET /api/submissions/stats/summary` - Get submission statistics (admin only)

### Configuration
- `GET /api/config/health` - System health check (admin only)
- `POST /api/config/test-email` - Test email connection (admin only)  
- `POST /api/config/check-emails` - Manual email check (admin only)

## Security Considerations

This is a **defensive security tool** designed to:
- Help organizations identify phishing attempts
- Encourage security awareness through gamification
- Provide safe email analysis capabilities
- Maintain proper audit trails

### Email Safety
- Emails are rendered to PNG images to prevent active content execution
- Attachments are stored securely and only accessible to admins
- URLs are extracted but not automatically followed
- HTML content is sanitized before display

## Logging

All operations are logged to files in the `logs/` directory:
- `combined.log` - All application logs
- `error.log` - Error logs only

Log levels: INFO for routine operations, WARN/ERROR for issues.

## Troubleshooting

### Email Connection Issues
1. Verify Gmail App Password is correct
2. Check firewall settings for ports 993 (IMAP) and 587 (SMTP)
3. Use the "Test Email Connection" button in the Config page
4. Check logs for detailed error messages

### Common Issues
- **Admin can't login**: Check if admin user was created in logs
- **No emails received**: Verify IMAP configuration and Gmail settings
- **Images not rendering**: Check if Puppeteer/Chrome dependencies are installed

## Development

### Project Structure
```
├── server/          # Node.js backend
│   ├── models/      # MongoDB models  
│   ├── routes/      # API routes
│   ├── services/    # Business logic
│   ├── middleware/  # Auth and other middleware
│   └── utils/       # Utilities and helpers
├── client/          # React frontend
│   ├── src/
│   │   ├── components/  # React components
│   │   ├── contexts/    # React contexts
│   │   └── services/    # API services
└── uploads/         # File storage
```

### Adding Features
1. Backend: Add routes, models, and services as needed
2. Frontend: Create components and update contexts
3. Test thoroughly with email submissions
4. Update this README with new functionality

## License

MIT License - see LICENSE file for details.

## Support

For issues and questions:
1. Check the logs in `logs/combined.log`
2. Verify email configuration
3. Test system health in the Config page
4. Report issues with detailed logs and configuration (remove sensitive data)