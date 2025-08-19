// Configuration model for AnglerPhish defensive security system
// Stores system settings that can be modified through the admin interface

const mongoose = require('mongoose'); // MongoDB object document mapper

// Schema for flexible key-value configuration storage
// Allows runtime configuration changes without code deployment
const configSchema = new mongoose.Schema({
  // Unique identifier for each configuration setting
  key: {
    type: String,
    required: true,
    unique: true // Ensures no duplicate configuration keys
  },
  // Configuration value - can be string, number, object, array, etc.
  value: {
    type: mongoose.Schema.Types.Mixed, // Flexible type for any JSON-serializable data
    required: true
  },
  // Human-readable description of what this setting controls
  description: {
    type: String
  },
  // Category grouping for organizing settings in the admin interface
  category: {
    type: String,
    enum: ['email', 'system', 'notification'], // Predefined categories
    default: 'system'
  },
  // Timestamp of the last configuration change
  updatedAt: {
    type: Date,
    default: Date.now
  },
  // Reference to the administrator who made the last change
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User' // Links to User model for audit trail
  }
});

// Pre-save middleware to automatically update timestamp on configuration changes
// Provides audit trail for when settings were modified
configSchema.pre('save', function(next) {
  // Always update the timestamp when a configuration is saved
  this.updatedAt = new Date();
  next(); // Continue with the save operation
});

// Export the Config model for use throughout the application
// This creates the 'configs' collection in MongoDB with the defined schema
module.exports = mongoose.model('Config', configSchema);