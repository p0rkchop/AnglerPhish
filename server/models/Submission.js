// Submission model for AnglerPhish defensive security system
// Stores email submissions reported by users for phishing analysis

const mongoose = require('mongoose'); // MongoDB object document mapper

// Sub-schema for email attachments - stores metadata about files attached to suspicious emails
const attachmentSchema = new mongoose.Schema({
  // Server-generated filename for stored attachment
  filename: {
    type: String,
    required: true
  },
  // Original filename as it appeared in the email
  originalName: {
    type: String,
    required: true
  },
  // MIME type of the attachment (e.g., 'application/pdf', 'image/png')
  mimetype: {
    type: String,
    required: true
  },
  // File size in bytes for storage management
  size: {
    type: Number,
    required: true
  },
  // File system path where attachment is stored
  path: {
    type: String,
    required: true
  }
});

// Main schema for email submissions reported to the phishing detection system
const submissionSchema = new mongoose.Schema({
  // Unique identifier for tracking each email submission
  submissionId: {
    type: String,
    required: true,
    unique: true // Ensures no duplicate submissions
  },
  // Email address of the person who reported the suspicious email
  senderEmail: {
    type: String,
    required: true,
    lowercase: true, // Normalize for consistency
    trim: true // Remove whitespace
  },
  // Subject line of the suspicious email
  subject: {
    type: String,
    required: true
  },
  // Unique message ID from the email headers for tracking
  messageId: {
    type: String,
    required: true
  },
  // Complete email content in multiple formats for analysis
  emailContent: {
    html: String, // HTML version of email body
    text: String, // Plain text version of email body
    headers: mongoose.Schema.Types.Mixed // Full email headers as object
  },
  // Array of URLs extracted from the email content for security analysis
  extractedUrls: [{
    type: String
  }],
  // Array of email attachments using the attachment sub-schema
  attachments: [attachmentSchema],
  // Path to rendered PNG image of the email for visual review
  renderedImagePath: {
    type: String
  },
  // Processing status for workflow management
  status: {
    type: String,
    enum: ['To-Do', 'Done'], // Only allow these two states
    default: 'To-Do' // New submissions start as unprocessed
  },
  // Security score assigned by administrators (0-100 points)
  score: {
    type: Number,
    min: 0, // Minimum score
    max: 100 // Maximum score
  },
  // Reference to the administrator who assigned the score
  scoredBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User' // Links to User model
  },
  // Timestamp when the score was assigned
  scoredAt: {
    type: Date
  },
  // When the email submission was received by the system
  receivedAt: {
    type: Date,
    required: true,
    default: Date.now // Auto-populate with current time
  },
  // When the submission was marked as processed
  processedAt: {
    type: Date
  },
  // Additional notes from administrators about the submission
  notes: {
    type: String
  }
});

// Database indexes for optimized query performance
// Compound index for filtering by status and sorting by received date (most common query)
submissionSchema.index({ status: 1, receivedAt: -1 });
// Index for searching submissions by sender email address
submissionSchema.index({ senderEmail: 1 });

// Export the Submission model for use throughout the application
// This creates the 'submissions' collection in MongoDB with the defined schema
module.exports = mongoose.model('Submission', submissionSchema);