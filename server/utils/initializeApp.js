const User = require('../models/User');
const logger = require('./logger');

const initializeApp = async () => {
  try {
    // Check if admin user exists
    const existingAdmin = await User.findOne({ role: 'Administrator' });
    
    if (!existingAdmin) {
      // Create default admin user
      const adminUser = new User({
        email: process.env.ADMIN_EMAIL || 'admin@anglerphish.com',
        password: process.env.ADMIN_PASSWORD || 'admin123',
        role: 'Administrator'
      });
      
      await adminUser.save();
      logger.info(`Default admin user created: ${adminUser.email}`);
    } else {
      logger.info(`Admin user already exists: ${existingAdmin.email}`);
    }
  } catch (error) {
    logger.error('Error during app initialization:', error);
  }
};

module.exports = initializeApp;