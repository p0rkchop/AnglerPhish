const express = require('express');
const Submission = require('../models/Submission');
const { adminAuth } = require('../middleware/auth');
const logger = require('../utils/logger');

const router = express.Router();

// Get all submissions (admin only)
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
    
    const query = status === 'all' ? {} : { status };
    
    const submissions = await Submission.find(query)
      .populate('scoredBy', 'email')
      .sort({ receivedAt: -1 })
      .limit(limitNum)
      .skip((pageNum - 1) * limitNum);
    
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

// Get submission by ID (admin only)
router.get('/:id', adminAuth, async (req, res) => {
  try {
    // Validate submission ID format
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

// Score a submission (admin only)
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
    
    submission.score = score;
    submission.notes = notes;
    submission.status = 'Done';
    submission.scoredBy = req.user._id;
    submission.scoredAt = new Date();
    
    await submission.save();
    
    logger.info(`Submission ${submission.submissionId} scored: ${score} by ${req.user.email}`);
    
    res.json(submission);
  } catch (error) {
    logger.error('Error scoring submission:', error);
    res.status(500).json({ error: 'Server error scoring submission' });
  }
});

// Get submission statistics (admin only)
router.get('/stats/summary', adminAuth, async (req, res) => {
  try {
    const [
      totalSubmissions,
      pendingSubmissions,
      completedSubmissions,
      averageScore
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

// Download attachment
router.get('/:id/attachments/:filename', adminAuth, async (req, res) => {
  try {
    const submission = await Submission.findById(req.params.id);
    if (!submission) {
      return res.status(404).json({ error: 'Submission not found' });
    }
    
    const attachment = submission.attachments.find(
      att => att.filename === req.params.filename
    );
    
    if (!attachment) {
      return res.status(404).json({ error: 'Attachment not found' });
    }
    
    res.download(attachment.path, attachment.originalName);
  } catch (error) {
    logger.error('Error downloading attachment:', error);
    res.status(500).json({ error: 'Server error downloading attachment' });
  }
});

module.exports = router;