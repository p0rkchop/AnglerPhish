// Security middleware for AnglerPhish defensive security system
// Provides essential security protections for the web application

const helmet = require('helmet'); // Security headers middleware
const rateLimit = require('express-rate-limit'); // Rate limiting middleware
const logger = require('../utils/logger'); // Centralized logging

// Configure Helmet for security headers
const helmetConfig = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ['\'self\''],
      scriptSrc: ['\'self\'', '\'unsafe-inline\'', '\'unsafe-eval\''], // Needed for React
      styleSrc: ['\'self\'', '\'unsafe-inline\''], // Needed for React styles
      imgSrc: ['\'self\'', 'data:', 'blob:'], // Allow data URLs for images
      fontSrc: ['\'self\''],
      connectSrc: ['\'self\''],
      objectSrc: ['\'none\''],
      mediaSrc: ['\'self\''],
      frameSrc: ['\'none\''],
    },
  },
  crossOriginEmbedderPolicy: false, // Disable for now to avoid issues with file uploads
});

// Rate limiting configurations
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: {
    error: 'Too many requests from this IP, please try again later.',
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  handler: (req, res) => {
    logger.warn(`Rate limit exceeded for IP: ${req.ip}`);
    res.status(429).json({
      error: 'Too many requests from this IP, please try again later.',
    });
  },
});

// Stricter rate limiting for authentication endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 login attempts per windowMs
  message: {
    error: 'Too many login attempts from this IP, please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // Don't count successful requests
  handler: (req, res) => {
    logger.warn(`Auth rate limit exceeded for IP: ${req.ip}`);
    res.status(429).json({
      error: 'Too many login attempts from this IP, please try again later.',
    });
  },
});

// Rate limiting for email-related operations (more restrictive)
const emailLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // Limit each IP to 10 email operations per hour
  message: {
    error: 'Too many email operations from this IP, please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn(`Email operation rate limit exceeded for IP: ${req.ip}`);
    res.status(429).json({
      error: 'Too many email operations from this IP, please try again later.',
    });
  },
});

// Security logging middleware
const securityLogger = (req, res, next) => {
  // Log potentially suspicious activity
  const suspiciousPatterns = [
    /\.\.\//,  // Directory traversal
    /<script/i, // XSS attempts
    /union.*select/i, // SQL injection attempts
    /javascript:/i, // JavaScript protocol attempts
  ];

  const requestString = `${req.method} ${req.url} ${JSON.stringify(req.body)}`;
  
  for (const pattern of suspiciousPatterns) {
    if (pattern.test(requestString)) {
      logger.warn(`Suspicious request detected from IP ${req.ip}: ${requestString}`);
      break;
    }
  }

  next();
};

module.exports = {
  helmetConfig,
  generalLimiter,
  authLimiter,
  emailLimiter,
  securityLogger,
};