# AnglerPhish Production Deployment Guide

This guide covers deploying AnglerPhish in a production environment for organizational phishing defense.

## Prerequisites

- Docker and Docker Compose installed
- Gmail account with App Passwords enabled
- Domain name (optional, for HTTPS)
- SSL certificate (recommended for production)

## Quick Production Setup

1. **Clone and Configure**
   ```bash
   git clone <repository-url>
   cd AnglerPhish
   cp .env.example .env
   ```

2. **Edit Production Configuration**
   ```bash
   # Required - Gmail configuration
   IMAP_USER=security@yourcompany.com
   IMAP_PASS=your-gmail-app-password
   SMTP_USER=security@yourcompany.com  
   SMTP_PASS=your-gmail-app-password
   
   # Required - Security
   JWT_SECRET=generate-a-very-long-random-string-for-production
   NODE_ENV=production
   
   # Required - Admin account
   ADMIN_EMAIL=admin@yourcompany.com
   ADMIN_PASSWORD=create-a-strong-password
   
   # Database (use strong passwords in production)
   MONGO_ROOT_USERNAME=admin
   MONGO_ROOT_PASSWORD=create-strong-database-password
   ```

3. **Deploy with Docker**
   ```bash
   chmod +x deploy.sh
   ./deploy.sh
   ```

## Production Security Checklist

### Environment Security
- [ ] Strong JWT_SECRET (32+ random characters)
- [ ] Strong admin password (12+ characters, mixed case, numbers, symbols)
- [ ] Strong MongoDB passwords
- [ ] Restrict .env file permissions: `chmod 600 .env`

### Network Security
- [ ] Configure firewall to restrict access
- [ ] Use HTTPS with valid SSL certificate
- [ ] Restrict admin interface to internal network only
- [ ] Consider VPN access for remote administrators

### Gmail Security
- [ ] Use dedicated Gmail account for the system
- [ ] Enable 2-Factor Authentication
- [ ] Generate App-specific password
- [ ] Monitor Gmail account for unauthorized access

### System Security
- [ ] Regular security updates for host system
- [ ] Monitor system logs for suspicious activity
- [ ] Backup email submissions and database regularly
- [ ] Test disaster recovery procedures

## Production Configuration

### Environment Variables

**Required**:
```bash
# Application
NODE_ENV=production
PORT=5000

# Database
MONGODB_URI=mongodb://mongodb:27017/anglerphish
MONGO_ROOT_USERNAME=admin
MONGO_ROOT_PASSWORD=secure_db_password

# Authentication
JWT_SECRET=your-very-long-secure-random-jwt-secret-key

# Gmail Configuration
IMAP_USER=security@yourcompany.com
IMAP_PASS=your-gmail-app-password
SMTP_USER=security@yourcompany.com
SMTP_PASS=your-gmail-app-password

# Admin User
ADMIN_EMAIL=admin@yourcompany.com
ADMIN_PASSWORD=secure_admin_password
```

**Optional**:
```bash
# Email server customization (defaults to Gmail)
IMAP_HOST=imap.gmail.com
IMAP_PORT=993
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
```

### SSL/HTTPS Configuration

For production, configure a reverse proxy (nginx) with SSL:

```nginx
server {
    listen 443 ssl;
    server_name your-domain.com;
    
    ssl_certificate /path/to/certificate.crt;
    ssl_certificate_key /path/to/private.key;
    
    location / {
        proxy_pass http://localhost:5000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### Firewall Configuration

Restrict access to essential ports:
```bash
# Allow HTTPS and SSH only
ufw allow 22/tcp   # SSH
ufw allow 443/tcp  # HTTPS
ufw enable
```

## Backup and Monitoring

### Database Backup
```bash
# Create backup script
cat > /opt/anglerphish/backup.sh << EOF
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
docker exec anglerphish-mongo mongodump --authenticationDatabase admin -u admin -p your-password --out /backup/anglerphish_$DATE
tar -czf /backup/anglerphish_backup_$DATE.tar.gz /backup/anglerphish_$DATE
rm -rf /backup/anglerphish_$DATE
EOF

chmod +x /opt/anglerphish/backup.sh

# Add to crontab for daily backups
echo "0 2 * * * /opt/anglerphish/backup.sh" | crontab -
```

### Log Monitoring
```bash
# Monitor application logs
docker-compose logs -f app

# Monitor system health
docker-compose ps
```

### Health Monitoring
The application provides a health endpoint: `GET /api/config/health`

Set up monitoring to check this endpoint regularly and alert if the service becomes unavailable.

## Operational Procedures

### User Onboarding
1. Communicate the submission email address to all employees
2. Provide training on how to forward suspicious emails
3. Set up email signatures or announcements with submission instructions

### Daily Operations
1. Check dashboard for new submissions
2. Review and score submissions promptly
3. Monitor system logs for errors
4. Verify email processing is working correctly

### Incident Response
If suspicious emails are submitted:
1. Score the submission in the system
2. Notify relevant security teams
3. Take appropriate action based on organizational policy
4. Document the incident for tracking

### Maintenance
- Update Docker images regularly for security patches
- Monitor disk space for uploads and logs directories  
- Review and rotate admin passwords quarterly
- Test backup and recovery procedures monthly

## Scaling Considerations

### High Volume Deployment
For organizations processing many submissions:
- Consider multiple email accounts to distribute load
- Scale MongoDB with replica sets
- Implement log rotation to manage disk space
- Use external storage for attachments and rendered images

### Multi-Organization Deployment
- Use separate databases per organization
- Implement organization-specific email addresses
- Consider separate application instances per organization

## Troubleshooting Production Issues

### Email Processing Not Working
1. Check Gmail credentials and App Password
2. Verify network connectivity to Gmail servers
3. Check logs for IMAP/SMTP connection errors
4. Test email connection using admin interface

### Performance Issues
1. Monitor CPU and memory usage
2. Check database query performance
3. Review log file sizes and implement rotation
4. Consider scaling MongoDB or application instances

### Security Incidents
1. Check access logs for unauthorized access attempts
2. Verify admin account hasn't been compromised
3. Review submission content for actual threats
4. Follow organizational incident response procedures

## Production Checklist

Before going live:
- [ ] Environment variables properly configured
- [ ] Strong passwords set for all accounts
- [ ] SSL certificate installed and configured
- [ ] Firewall rules configured
- [ ] Backup procedures tested
- [ ] Monitoring systems configured
- [ ] Admin team trained on the interface
- [ ] Employee communication sent
- [ ] Incident response procedures documented
- [ ] Security team notified of deployment

## Support and Maintenance

Regular maintenance tasks:
- Weekly: Review submissions and clear completed ones
- Monthly: Check system logs and performance
- Quarterly: Review and update passwords
- Annually: Security assessment and penetration testing

For technical support:
1. Check application logs first
2. Verify email configuration
3. Test system components individually
4. Contact development team with detailed logs