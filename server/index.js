const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const dotenv = require('dotenv');
const cron = require('node-cron');

const logger = require('./utils/logger');
const initializeApp = require('./utils/initializeApp');
const authRoutes = require('./routes/auth');
const submissionRoutes = require('./routes/submissions');
const configRoutes = require('./routes/config');
const emailService = require('./services/emailService');

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files
app.use('/uploads', express.static('uploads'));

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/anglerphish')
  .then(async () => {
    logger.info('Connected to MongoDB successfully');
    // Initialize app (create admin user, etc.)
    await initializeApp();
  })
  .catch((error) => {
    logger.error('MongoDB connection error:', error);
    process.exit(1);
  });

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/submissions', submissionRoutes);
app.use('/api/config', configRoutes);

// Serve React app in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../client/build')));
  
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/build/index.html'));
  });
}

// Schedule email checking every 5 minutes
cron.schedule('*/5 * * * *', async () => {
  logger.info('Starting scheduled email check');
  try {
    await emailService.checkEmails();
    logger.info('Email check completed successfully');
  } catch (error) {
    logger.error('Error during scheduled email check:', error);
  }
});

// Error handling middleware
app.use((error, req, res, next) => {
  logger.error('Unhandled error:', error);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
});