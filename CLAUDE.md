# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

AnglerPhish is a gamified phishing email submission system that allows organizations to encourage employees to report suspicious emails by earning points for successful submissions. This is a defensive security tool designed to improve organizational security awareness.

**Current Status**: This repository currently contains only requirements documentation. No code implementation exists yet.

## Architecture (Planned)

Based on the requirements document, the system will use:

- **Technology Stack**: MERN (MongoDB, Express.js, React, Node.js)
- **Deployment**: Docker containerized application
- **Email Processing**: IMAP/SMTP integration for receiving and responding to email submissions
- **Security Focus**: Defensive tool for phishing detection and reporting

## Core Components (To Be Implemented)

1. **Email Ingestion Engine**
   - IMAP client for retrieving submitted emails (every 5 minutes)
   - Email parsing for URLs and attachments
   - Email rendering to PNG images
   - SMTP client for sending responses

2. **Web User Interface**
   - Administrator dashboard for reviewing submissions
   - Submission detail views with scoring capability (0-100 points)
   - User management and system configuration
   - Navigation: Dashboard, Config, Logout

3. **Database Schema**
   - Email submissions with states: "To-Do" and "Done"
   - User management with roles: Administrator and User
   - URL extraction and attachment storage
   - Scoring and timestamp tracking

## Email Configuration

The system is designed to work with Gmail:
- **Submission Email**: anglerphish25@gmail.com
- **IMAP Server**: imap.gmail.com (port 993, TLS)
- **SMTP Server**: smtp.gmail.com (port 587, TLS)

## Security Considerations

This is a **defensive security tool** designed to:
- Help organizations identify and respond to phishing attempts
- Gamify security awareness through point-based submissions
- Provide administrators with tools to review and score suspicious emails
- Maintain audit trails of all security-related submissions

## Development Notes

- All operations must be logged (INFO for routine, WARN for errors)
- Error checking required for all functions
- All configuration must be available through web UI
- Focus on administrator interface first (user-side deferred to later iterations)