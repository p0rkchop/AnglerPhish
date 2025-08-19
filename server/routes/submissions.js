// Submission routes for AnglerPhish defensive security system
// Handles CRUD operations for phishing email submissions - Admin access only

const express = require('express'); // Web framework
const Submission = require('../models/Submission'); // Submission model for database operations
const { adminAuth } = require('../middleware/auth'); // Admin authentication middleware
const logger = require('../utils/logger'); // Centralized logging utility

// Create Express router for submission endpoints
const router = express.Router();

// GET /api/submissions - Retrieve paginated list of email submissions
// Protected route requiring Administrator role for security review access
router.get('/', adminAuth, async (req, res) => {
  try {
    const { status = 'To-Do', page = 1, limit = 20 } = req.query;
    
    // Input validation
    const validStatuses = ['To-Do', 'Done', 'all'];
    if (status !== 'all' && !validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status value' });
    }
    
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    
    if (isNaN(pageNum) || pageNum < 1 || pageNum > 10000) {
      return res.status(400).json({ error: 'Invalid page number' });
    }
    
    if (isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
      return res.status(400).json({ error: 'Invalid limit value (1-100 allowed)' });
    }
    
    // Build database query based on status filter
    const query = status === 'all' ? {} : { status };
    
    // Fetch submissions with pagination, populate scorer info, sort by newest first
    const submissions = await Submission.find(query)
      .populate('scoredBy', 'email') // Include email of admin who scored
      .sort({ receivedAt: -1 }) // Newest submissions first
      .limit(limitNum) // Limit results for pagination
      .skip((pageNum - 1) * limitNum); // Skip for pagination offset
    
    const total = await Submission.countDocuments(query);
    
    res.json({
      submissions,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum)
      }
    });
  } catch (error) {
    logger.error('Error fetching submissions:', error);
    res.status(500).json({ error: 'Server error fetching submissions' });
  }
});

// GET /api/submissions/:id - Retrieve detailed view of specific submission
// Used by admins to review full email content, attachments, and scoring details
router.get('/:id', adminAuth, async (req, res) => {
  try {
    // Validate MongoDB ObjectId format to prevent injection attacks
    if (!req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ error: 'Invalid submission ID format' });
    }
    
    const submission = await Submission.findById(req.params.id)
      .populate('scoredBy', 'email');
    
    if (!submission) {
      return res.status(404).json({ error: 'Submission not found' });
    }
    
    res.json(submission);
  } catch (error) {
    logger.error('Error fetching submission:', error);
    res.status(500).json({ error: 'Server error fetching submission' });
  }
});

// POST /api/submissions/:id/score - Assign security score to email submission
// Core defensive security feature - admins evaluate phishing risk (0-100 points)
router.post('/:id/score', adminAuth, async (req, res) => {
  try {
    const { score, notes } = req.body;
    
    // Input validation
    if (score === undefined || score === null) {
      return res.status(400).json({ error: 'Score is required' });
    }
    
    if (typeof score !== 'number' || isNaN(score)) {
      return res.status(400).json({ error: 'Score must be a valid number' });
    }
    
    if (score < 0 || score > 100) {
      return res.status(400).json({ error: 'Score must be between 0 and 100' });
    }
    
    if (notes && typeof notes !== 'string') {
      return res.status(400).json({ error: 'Notes must be a string' });
    }
    
    if (notes && notes.length > 1000) {
      return res.status(400).json({ error: 'Notes must be less than 1000 characters' });
    }
    
    // Validate submission ID format
    if (!req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ error: 'Invalid submission ID format' });
    }
    
    const submission = await Submission.findById(req.params.id);
    if (!submission) {
      return res.status(404).json({ error: 'Submission not found' });
    }
    
    // Update submission with scoring information and mark as completed
    submission.score = score; // Security risk score (0-100)
    submission.notes = notes; // Optional admin notes about the analysis
    submission.status = 'Done'; // Mark as processed
    submission.scoredBy = req.user._id; // Track which admin scored it
    submission.scoredAt = new Date(); // Timestamp the scoring action
    
    await submission.save();
    
    logger.info(`Submission ${submission.submissionId} scored: ${score} by ${req.user.email}`);
    
    res.json(submission);
  } catch (error) {
    logger.error('Error scoring submission:', error);
    res.status(500).json({ error: 'Server error scoring submission' });
  }
});

// GET /api/submissions/stats/summary - Aggregate statistics for admin dashboard
// Provides metrics on submission volume, processing status, and average risk scores
router.get('/stats/summary', adminAuth, async (req, res) => {
  try {
    // Execute multiple database queries in parallel for better performance
    const [
      totalSubmissions, // Total number of emails reported
      pendingSubmissions, // Emails awaiting admin review
      completedSubmissions, // Emails that have been scored
      averageScore // Average security risk score for completed submissions
    ] = await Promise.all([
      Submission.countDocuments(),
      Submission.countDocuments({ status: 'To-Do' }),
      Submission.countDocuments({ status: 'Done' }),
      Submission.aggregate([
        { $match: { status: 'Done', score: { $exists: true } } },
        { $group: { _id: null, avgScore: { $avg: '$score' } } }
      ])
    ]);
    
    res.json({
      total: totalSubmissions,
      pending: pendingSubmissions,
      completed: completedSubmissions,
      averageScore: averageScore[0]?.avgScore || 0
    });
  } catch (error) {
    logger.error('Error fetching submission stats:', error);
    res.status(500).json({ error: 'Server error fetching statistics' });
  }
});

// GET /api/submissions/:id/attachments/:filename - Download email attachments
// Secure file download for admin analysis of suspicious attachments
router.get('/:id/attachments/:filename', adminAuth, async (req, res) => {
  try {
    const submission = await Submission.findById(req.params.id);
    if (!submission) {
      return res.status(404).json({ error: 'Submission not found' });
    }
    
    // Find the requested attachment in the submission
    const attachment = submission.attachments.find(
      att => att.filename === req.params.filename
    );
    
    if (!attachment) {
      return res.status(404).json({ error: 'Attachment not found' });
    }
    
    // Securely serve file with original filename for admin analysis
    res.download(attachment.path, attachment.originalName);
  } catch (error) {
    logger.error('Error downloading attachment:', error);
    res.status(500).json({ error: 'Server error downloading attachment' });
  }
});

// Export the router for use in the main application
module.exports = router;