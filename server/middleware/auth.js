// Authentication middleware for AnglerPhish defensive security system
// Validates JWT tokens and enforces role-based access control

const jwt = require('jsonwebtoken'); // JSON Web Token library for token verification
const User = require('../models/User'); // User model for database operations
const logger = require('../utils/logger'); // Centralized logging utility

// Base authentication middleware - validates JWT tokens
// Extracts user information and attaches it to the request object
const auth = async (req, res, next) => {
  try {
    // Extract JWT token from Authorization header (format: "Bearer <token>")
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    // Return 401 if no token is provided
    if (!token) {
      return res.status(401).json({ error: 'Access denied. No token provided.' });
    }
    
    // Verify the JWT token using the secret key from environment variables
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    // Fetch user from database using the decoded user ID, excluding password field
    const user = await User.findById(decoded.userId).select('-password');
    
    // Return 401 if user doesn't exist (token may be for deleted user)
    if (!user) {
      return res.status(401).json({ error: 'Invalid token.' });
    }
    
    // Attach authenticated user to request object for use in route handlers
    req.user = user;
    next(); // Continue to next middleware or route handler
  } catch (error) {
    // Log authentication errors for security monitoring
    logger.error('Authentication error:', error);
    // Return generic error message to prevent information disclosure
    res.status(401).json({ error: 'Invalid token.' });
  }
};

// Administrator authentication middleware - requires both valid token AND admin role
// Uses the base auth middleware then checks for Administrator role
const adminAuth = (req, res, next) => {
  // First run the base authentication middleware
  auth(req, res, (authError) => {
    // If authentication failed, pass the error along
    if (authError) {
      return next(authError);
    }
    
    // Check if the authenticated user has Administrator role
    // This enforces role-based access control for sensitive operations
    if (req.user.role !== 'Administrator') {
      return res.status(403).json({ error: 'Access denied. Administrator role required.' });
    }
    
    // User is authenticated and has admin role, proceed to route handler
    next();
  });
};

// Export both middleware functions for use in route definitions
module.exports = { auth, adminAuth };