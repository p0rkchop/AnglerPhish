// User model for AnglerPhish defensive security system
// Handles user authentication, authorization, and secure password storage

const mongoose = require('mongoose'); // MongoDB object document mapper
const bcrypt = require('bcryptjs'); // Secure password hashing library

// Define MongoDB schema for user authentication and authorization
const userSchema = new mongoose.Schema({
  // Email address serves as unique identifier for login
  email: {
    type: String,
    required: true, // Email is mandatory for all users
    unique: true, // Ensure no duplicate email addresses
    lowercase: true, // Normalize to lowercase for consistency
    trim: true // Remove leading/trailing whitespace
  },
  // Securely hashed password using bcrypt
  password: {
    type: String,
    required: true, // Password is mandatory
    minlength: 6 // Minimum password length for basic security
  },
  // Role-based access control for system permissions
  role: {
    type: String,
    enum: ['Administrator', 'User'], // Only allow these two roles
    default: 'User' // New users default to standard user role
  },
  // Timestamp when user account was created
  createdAt: {
    type: Date,
    default: Date.now // Auto-populate with current timestamp
  },
  // Track last login time for security monitoring
  lastLogin: {
    type: Date // Optional field, updated on each successful login
  }
});

// Pre-save middleware to automatically hash passwords before storing in database
// This ensures passwords are never stored in plain text for security
userSchema.pre('save', async function(next) {
  // Only hash the password if it has been modified (new user or password change)
  if (!this.isModified('password')) {return next();}
  
  try {
    // Generate a salt with complexity factor of 10 (good balance of security vs performance)
    const salt = await bcrypt.genSalt(10);
    // Hash the password using the generated salt
    this.password = await bcrypt.hash(this.password, salt);
    next(); // Continue with the save operation
  } catch (error) {
    // Pass any hashing errors to the next middleware
    next(error);
  }
});

// Instance method to securely compare provided password with stored hash
// Used during login authentication to verify user credentials
userSchema.methods.comparePassword = async function(candidatePassword) {
  // Use bcrypt to compare plain text password with hashed password
  // Returns true if passwords match, false otherwise
  return bcrypt.compare(candidatePassword, this.password);
};

// Export the User model for use throughout the application
// This creates the 'users' collection in MongoDB with the defined schema
module.exports = mongoose.model('User', userSchema);