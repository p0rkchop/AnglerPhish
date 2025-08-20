// Configuration routes for AnglerPhish defensive security system
// Handles system settings management for email processing and notifications

const express = require('express'); // Web framework
const Config = require('../models/Config'); // Configuration model for database operations
const { adminAuth } = require('../middleware/auth'); // Admin authentication middleware  
const emailService = require('../services/emailService'); // Email processing service
const logger = require('../utils/logger'); // Centralized logging utility

// Create Express router for configuration endpoints
const router = express.Router();

// Get all configuration settings (admin only)
router.get('/', adminAuth, async (req, res) => {
  try {
    const configs = await Config.find().populate('updatedBy', 'email');
    res.json(configs);
  } catch (error) {
    logger.error('Error fetching config:', error);
    res.status(500).json({ error: 'Server error fetching configuration' });
  }
});

// Update configuration setting (admin only)
router.put('/:key', adminAuth, async (req, res) => {
  try {
    const { key } = req.params;
    const { value, description, category } = req.body;
    
    let config = await Config.findOne({ key });
    
    if (config) {
      config.value = value;
      config.description = description || config.description;
      config.category = category || config.category;
      config.updatedBy = req.user._id;
    } else {
      config = new Config({
        key,
        value,
        description,
        category: category || 'system',
        updatedBy: req.user._id
      });
    }
    
    await config.save();
    await config.populate('updatedBy', 'email');
    
    logger.info(`Configuration updated: ${key} by ${req.user.email}`);
    res.json(config);
  } catch (error) {
    logger.error('Error updating config:', error);
    res.status(500).json({ error: 'Server error updating configuration' });
  }
});

// Test email connection (admin only)
router.post('/test-email', adminAuth, async (req, res) => {
  try {
    await emailService.testConnection();
    logger.info(`Email connection tested by ${req.user.email}`);
    res.json({ message: 'Email connection successful' });
  } catch (error) {
    logger.error('Email connection test failed:', error);
    res.status(500).json({ error: 'Email connection test failed', details: error.message });
  }
});

// Trigger manual email check (admin only)
router.post('/check-emails', adminAuth, async (req, res) => {
  try {
    const submissions = await emailService.checkEmails();
    logger.info(`Manual email check triggered by ${req.user.email}, found ${submissions.length} emails`);
    res.json({ 
      message: `Email check completed. Processed ${submissions.length} new emails.`,
      submissions: submissions.length 
    });
  } catch (error) {
    logger.error('Manual email check failed:', error);
    res.status(500).json({ error: 'Email check failed', details: error.message });
  }
});

// Get basic system health status (public endpoint for Docker health checks)
router.get('/health', async (req, res) => {
  try {
    const health = {
      status: 'healthy',
      timestamp: new Date(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development'
    };
    
    res.json(health);
  } catch (error) {
    logger.error('Error checking health:', error);
    res.status(500).json({ status: 'unhealthy', error: 'Server error' });
  }
});

// Get detailed system health status (admin only)
router.get('/health/detailed', adminAuth, async (req, res) => {
  try {
    const health = {
      database: 'connected',
      timestamp: new Date(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      environment: process.env.NODE_ENV || 'development'
    };
    
    // Test email connection
    try {
      await emailService.testConnection();
      health.email = 'connected';
    } catch (error) {
      health.email = 'disconnected';
      health.emailError = error.message;
    }
    
    res.json(health);
  } catch (error) {
    logger.error('Error checking detailed health:', error);
    res.status(500).json({ error: 'Server error checking health' });
  }
});

module.exports = router;