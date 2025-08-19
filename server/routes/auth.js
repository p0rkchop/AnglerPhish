// Authentication routes for AnglerPhish defensive security system
// Handles user login, token validation, and admin user creation

const express = require('express'); // Web framework
const jwt = require('jsonwebtoken'); // JSON Web Token library for secure authentication
const User = require('../models/User'); // User model for database operations
const { auth } = require('../middleware/auth'); // Authentication middleware
const logger = require('../utils/logger'); // Centralized logging utility

// Create Express router for authentication endpoints
const router = express.Router();

// POST /api/auth/login - Authenticate user and return JWT token
// This endpoint validates user credentials and creates a session token
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Comprehensive input validation for security
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }
    
    // Type validation to prevent injection attacks
    if (typeof email !== 'string' || typeof password !== 'string') {
      return res.status(400).json({ error: 'Invalid input format' });
    }
    
    // Length validation to prevent buffer overflow attacks
    if (email.length > 254 || password.length > 128) {
      return res.status(400).json({ error: 'Input too long' });
    }
    
    // Email format validation using regex
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }
    
    // Find user in database (case-insensitive email lookup)
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      // Generic error message to prevent user enumeration
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    // Verify password using secure bcrypt comparison
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      // Generic error message to prevent user enumeration
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    // Update last login timestamp for security monitoring
    user.lastLogin = new Date();
    await user.save();
    
    // Generate JWT token with user ID and role for authorization
    const token = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '24h' } // Token expires in 24 hours
    );
    
    logger.info(`User logged in: ${user.email}`);
    
    // Return token and user info (excluding sensitive data like password)
    res.json({
      token,
      user: {
        id: user._id,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    logger.error('Login error:', error);
    // Generic error response to prevent information disclosure
    res.status(500).json({ error: 'Server error during login' });
  }
});

// GET /api/auth/me - Get current authenticated user information
// Protected route that requires valid JWT token in Authorization header
router.get('/me', auth, (req, res) => {
  // Return current user info (attached by auth middleware)
  // This allows frontend to verify token validity and get user details
  res.json({
    user: {
      id: req.user._id,
      email: req.user.email,
      role: req.user.role
    }
  });
});

// POST /api/auth/create-admin - Create initial administrator user
// WARNING: This endpoint should be protected or removed in production
// Used for initial system setup when no admin user exists
router.post('/create-admin', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Security check: Only allow creation if no admin exists
    const existingAdmin = await User.findOne({ role: 'Administrator' });
    if (existingAdmin) {
      return res.status(400).json({ error: 'Admin user already exists' });
    }
    
    // Create new admin user with provided or default credentials
    const admin = new User({
      email: email || process.env.ADMIN_EMAIL || 'admin@anglerphish.com',
      password: password || process.env.ADMIN_PASSWORD || 'admin123',
      role: 'Administrator'
    });
    
    // Save to database (password will be hashed by User model middleware)
    await admin.save();
    logger.info(`Admin user created: ${admin.email}`);
    
    res.status(201).json({ message: 'Admin user created successfully' });
  } catch (error) {
    logger.error('Error creating admin user:', error);
    res.status(500).json({ error: 'Server error creating admin user' });
  }
});

// Export the router for use in the main application
module.exports = router;