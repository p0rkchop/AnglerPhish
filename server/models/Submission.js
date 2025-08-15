const mongoose = require('mongoose');

const attachmentSchema = new mongoose.Schema({
  filename: {
    type: String,
    required: true
  },
  originalName: {
    type: String,
    required: true
  },
  mimetype: {
    type: String,
    required: true
  },
  size: {
    type: Number,
    required: true
  },
  path: {
    type: String,
    required: true
  }
});

const submissionSchema = new mongoose.Schema({
  submissionId: {
    type: String,
    required: true,
    unique: true
  },
  senderEmail: {
    type: String,
    required: true,
    lowercase: true,
    trim: true
  },
  subject: {
    type: String,
    required: true
  },
  messageId: {
    type: String,
    required: true
  },
  emailContent: {
    html: String,
    text: String,
    headers: mongoose.Schema.Types.Mixed
  },
  extractedUrls: [{
    type: String
  }],
  attachments: [attachmentSchema],
  renderedImagePath: {
    type: String
  },
  status: {
    type: String,
    enum: ['To-Do', 'Done'],
    default: 'To-Do'
  },
  score: {
    type: Number,
    min: 0,
    max: 100
  },
  scoredBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  scoredAt: {
    type: Date
  },
  receivedAt: {
    type: Date,
    required: true,
    default: Date.now
  },
  processedAt: {
    type: Date
  },
  notes: {
    type: String
  }
});

// Index for better query performance
submissionSchema.index({ status: 1, receivedAt: -1 });
submissionSchema.index({ senderEmail: 1 });

module.exports = mongoose.model('Submission', submissionSchema);