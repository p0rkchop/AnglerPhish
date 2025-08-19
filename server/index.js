// AnglerPhish Server - Main application entry point
// This is a defensive security tool for phishing email detection and reporting

// Import required dependencies for Express server, database, and security
const express = require('express');
const mongoose = require('mongoose'); // MongoDB ODM for database operations
const cors = require('cors'); // Cross-Origin Resource Sharing middleware
const path = require('path'); // Node.js path utilities
const dotenv = require('dotenv'); // Environment variable loader
const cron = require('node-cron'); // Task scheduler for automated email checking

// Import custom application modules
const logger = require('./utils/logger'); // Centralized logging utility
const initializeApp = require('./utils/initializeApp'); // Application initialization
const authRoutes = require('./routes/auth'); // Authentication API routes
const submissionRoutes = require('./routes/submissions'); // Email submission routes
const configRoutes = require('./routes/config'); // System configuration routes
const emailService = require('./services/emailService'); // Email processing service

// Load environment variables from .env file for configuration
dotenv.config();

// Initialize Express application instance
const app = express();
// Set server port from environment or default to 5000
const PORT = process.env.PORT || 5000;

// Configure middleware for security and request processing
// CORS configuration to allow frontend access from specific origins
const corsOptions = {
  // Allow different origins based on environment (production vs development)
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://your-domain.com'] // Replace with your actual domain
    : ['http://localhost:3000', 'http://127.0.0.1:3000'], // Development origins
  credentials: true, // Allow cookies and authentication headers
  optionsSuccessStatus: 200 // Legacy browser support
};
app.use(cors(corsOptions));
// Parse JSON payloads up to 10MB (for email attachments and images)
app.use(express.json({ limit: '10mb' }));
// Parse URL-encoded form data with extended syntax support
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve static files from uploads directory (email attachments, rendered images)
app.use('/uploads', express.static('uploads'));

// Establish MongoDB database connection
// Uses connection string from environment or defaults to local development database
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/anglerphish')
  .then(async () => {
    logger.info('Connected to MongoDB successfully');
    // Initialize application (create default admin user, setup collections)
    await initializeApp();
  })
  .catch((error) => {
    logger.error('MongoDB connection error:', error);
    // Exit process if database connection fails (critical dependency)
    process.exit(1);
  });

// Register API route handlers
app.use('/api/auth', authRoutes); // Authentication endpoints (login, logout, token validation)
app.use('/api/submissions', submissionRoutes); // Email submission management endpoints
app.use('/api/config', configRoutes); // System configuration management endpoints

// Serve React frontend application in production environment
if (process.env.NODE_ENV === 'production') {
  // Serve static React build files (CSS, JS, images)
  app.use(express.static(path.join(__dirname, '../client/build')));
  
  // Handle client-side routing - send index.html for all non-API routes
  // This allows React Router to handle navigation
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/build/index.html'));
  });
}

// Schedule automated email checking every 5 minutes using cron job
// This is the core defensive security feature that processes incoming phishing reports
cron.schedule('*/5 * * * *', async () => {
  logger.info('Starting scheduled email check');
  try {
    // Connect to IMAP server and process new email submissions
    await emailService.checkEmails();
    logger.info('Email check completed successfully');
  } catch (error) {
    // Log errors but don't crash the server - email checking will retry in 5 minutes
    logger.error('Error during scheduled email check:', error);
  }
});

// Global error handling middleware - catches any unhandled errors
// Ensures the application doesn't crash and provides consistent error responses
app.use((error, req, res, next) => {
  logger.error('Unhandled error:', error);
  // Return generic error message to prevent information disclosure
  res.status(500).json({ error: 'Internal server error' });
});

// Start the Express server on the configured port
app.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
});