const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { auth } = require('../middleware/auth');
const logger = require('../utils/logger');

const router = express.Router();

// Login route
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }
    
    // Find user
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    // Update last login
    user.lastLogin = new Date();
    await user.save();
    
    // Generate JWT
    const token = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );
    
    logger.info(`User logged in: ${user.email}`);
    
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
    res.status(500).json({ error: 'Server error during login' });
  }
});

// Get current user
router.get('/me', auth, (req, res) => {
  res.json({
    user: {
      id: req.user._id,
      email: req.user.email,
      role: req.user.role
    }
  });
});

// Create admin user (should be protected in production)
router.post('/create-admin', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Check if admin already exists
    const existingAdmin = await User.findOne({ role: 'Administrator' });
    if (existingAdmin) {
      return res.status(400).json({ error: 'Admin user already exists' });
    }
    
    const admin = new User({
      email: email || process.env.ADMIN_EMAIL || 'admin@anglerphish.com',
      password: password || process.env.ADMIN_PASSWORD || 'admin123',
      role: 'Administrator'
    });
    
    await admin.save();
    logger.info(`Admin user created: ${admin.email}`);
    
    res.status(201).json({ message: 'Admin user created successfully' });
  } catch (error) {
    logger.error('Error creating admin user:', error);
    res.status(500).json({ error: 'Server error creating admin user' });
  }
});

module.exports = router;