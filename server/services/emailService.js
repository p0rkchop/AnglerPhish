// Email processing service for AnglerPhish defensive security system
// Handles IMAP email retrieval, parsing, URL extraction, and automated responses

const Imap = require('imap'); // IMAP client for reading emails
const nodemailer = require('nodemailer'); // SMTP client for sending responses
const { simpleParser } = require('mailparser'); // Email parsing library
const cheerio = require('cheerio'); // HTML parsing for URL extraction
const urlParse = require('url-parse'); // URL parsing utilities
const fs = require('fs').promises; // Asynchronous file system operations
const path = require('path'); // File path utilities
const { v4: uuidv4 } = require('uuid'); // UUID generation for unique identifiers

const Submission = require('../models/Submission'); // Database model for email submissions
const logger = require('../utils/logger'); // Centralized logging utility
const emailRenderer = require('./emailRenderer'); // Email-to-image rendering service

// Main email processing service class - core of the defensive security system
class EmailService {
  constructor() {
    // IMAP configuration for connecting to email server (Gmail by default)
    this.imapConfig = {
      user: process.env.IMAP_USER,
      password: process.env.IMAP_PASS,
      host: process.env.IMAP_HOST || 'imap.gmail.com',
      port: parseInt(process.env.IMAP_PORT) || 993,
      tls: process.env.IMAP_SECURE !== 'false',
      tlsOptions: { rejectUnauthorized: false }
    };

    this.smtpTransporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });
  }

  async checkEmails() {
    return new Promise((resolve, reject) => {
      const imap = new Imap(this.imapConfig);
      
      imap.once('ready', () => {
        logger.info('IMAP connection ready');
        
        imap.openBox('INBOX', false, async (err, box) => {
          if (err) {
            logger.error('Error opening inbox:', err);
            return reject(err);
          }

          // Search for unseen emails
          imap.search(['UNSEEN'], async (err, results) => {
            if (err) {
              logger.error('Error searching emails:', err);
              return reject(err);
            }

            if (!results || results.length === 0) {
              logger.info('No new emails found');
              imap.end();
              return resolve([]);
            }

            logger.info(`Found ${results.length} new emails`);
            const processedEmails = [];

            const fetch = imap.fetch(results, { bodies: '', struct: true });
            
            fetch.on('message', (msg, seqno) => {
              let buffer = '';
              
              msg.on('body', (stream) => {
                stream.on('data', (chunk) => {
                  buffer += chunk.toString('utf8');
                });
              });

              msg.once('end', async () => {
                try {
                  const parsed = await simpleParser(buffer);
                  const submission = await this.processEmail(parsed);
                  processedEmails.push(submission);
                  
                  // Mark email as seen
                  imap.addFlags(seqno, ['\\Seen'], (err) => {
                    if (err) logger.error('Error marking email as seen:', err);
                  });

                  // Send acknowledgment email
                  if (parsed.from && parsed.from.text) {
                    await this.sendAcknowledgment(parsed.from.text);
                  }
                } catch (error) {
                  logger.error('Error processing email:', error);
                }
              });
            });

            fetch.once('error', (err) => {
              logger.error('Fetch error:', err);
              reject(err);
            });

            fetch.once('end', () => {
              logger.info('Email fetch completed');
              imap.end();
              resolve(processedEmails);
            });
          });
        });
      });

      imap.once('error', (err) => {
        logger.error('IMAP error:', err);
        reject(err);
      });

      imap.connect();
    });
  }

  async processEmail(parsedEmail) {
    try {
      const submissionId = uuidv4();
      const senderEmail = this.extractEmailAddress(parsedEmail.from.text);
      
      // Extract URLs from email content
      const extractedUrls = this.extractUrls(parsedEmail.html || parsedEmail.text);
      
      // Process attachments
      const attachments = await this.processAttachments(parsedEmail.attachments || [], submissionId);
      
      // Create submission record
      const submission = new Submission({
        submissionId,
        senderEmail,
        subject: parsedEmail.subject || 'No Subject',
        messageId: parsedEmail.messageId,
        emailContent: {
          html: parsedEmail.html,
          text: parsedEmail.text,
          headers: parsedEmail.headers
        },
        extractedUrls,
        attachments,
        receivedAt: parsedEmail.date || new Date(),
        processedAt: new Date()
      });

      await submission.save();
      logger.info(`Processed email submission: ${submissionId} from ${senderEmail}`);

      // Render email to PNG
      if (parsedEmail.html) {
        try {
          const imagePath = await emailRenderer.renderEmailToPng(parsedEmail.html, submissionId);
          submission.renderedImagePath = imagePath;
          await submission.save();
        } catch (renderError) {
          logger.error('Error rendering email to PNG:', renderError);
        }
      }

      return submission;
    } catch (error) {
      logger.error('Error processing email:', error);
      throw error;
    }
  }

  extractUrls(content) {
    if (!content) return [];
    
    const urls = new Set();
    
    // If content is HTML, parse it with cheerio
    if (content.includes('<')) {
      const $ = cheerio.load(content);
      
      // Extract href attributes
      $('a[href]').each((i, elem) => {
        const href = $(elem).attr('href');
        if (href && this.isValidUrl(href)) {
          urls.add(href);
        }
      });
      
      // Extract src attributes from images
      $('img[src]').each((i, elem) => {
        const src = $(elem).attr('src');
        if (src && this.isValidUrl(src)) {
          urls.add(src);
        }
      });
    }
    
    // Also use regex to find URLs in text
    const urlRegex = /(https?:\/\/[^\s<>"{}|\\^`[\]]+)/gi;
    const matches = content.match(urlRegex);
    if (matches) {
      matches.forEach(url => {
        if (this.isValidUrl(url)) {
          urls.add(url);
        }
      });
    }
    
    return Array.from(urls);
  }

  isValidUrl(string) {
    try {
      const parsed = urlParse(string);
      return parsed.protocol === 'http:' || parsed.protocol === 'https:';
    } catch {
      return false;
    }
  }

  async processAttachments(attachments, submissionId) {
    const processedAttachments = [];
    
    // Ensure uploads directory exists
    const uploadsDir = path.join(__dirname, '../../uploads');
    await fs.mkdir(uploadsDir, { recursive: true });
    
    for (const attachment of attachments) {
      try {
        const filename = `${submissionId}_${attachment.filename}`;
        const filepath = path.join(uploadsDir, filename);
        
        await fs.writeFile(filepath, attachment.content);
        
        processedAttachments.push({
          filename,
          originalName: attachment.filename,
          mimetype: attachment.contentType,
          size: attachment.size,
          path: filepath
        });
        
        logger.info(`Saved attachment: ${filename}`);
      } catch (error) {
        logger.error('Error processing attachment:', error);
      }
    }
    
    return processedAttachments;
  }

  extractEmailAddress(fromText) {
    if (!fromText || typeof fromText !== 'string') {
      return null;
    }
    const emailRegex = /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/;
    const match = fromText.match(emailRegex);
    return match ? match[1] : fromText.trim();
  }

  async sendAcknowledgment(recipientEmail) {
    try {
      const recipient = this.extractEmailAddress(recipientEmail);
      if (!recipient) {
        logger.warn('Cannot send acknowledgment: invalid recipient email');
        return;
      }
      
      const mailOptions = {
        from: process.env.SMTP_USER,
        to: recipient,
        subject: 'AnglerPhish - Email Submission Received',
        html: `
          <h2>Thank you for your submission!</h2>
          <p>We have received your suspicious email submission and it has been forwarded to our security team for review.</p>
          <p>Your contribution helps keep our organization safe from phishing attacks.</p>
          <p>You will receive points once your submission has been reviewed and scored.</p>
          <br>
          <p>Best regards,<br>AnglerPhish Security Team</p>
        `
      };

      await this.smtpTransporter.sendMail(mailOptions);
      logger.info(`Acknowledgment sent to ${recipient}`);
    } catch (error) {
      logger.error('Error sending acknowledgment email:', error);
    }
  }

  async testConnection() {
    try {
      // Test SMTP connection
      await this.smtpTransporter.verify();
      logger.info('SMTP connection test successful');
      
      // Test IMAP connection
      return new Promise((resolve, reject) => {
        const imap = new Imap(this.imapConfig);
        
        imap.once('ready', () => {
          logger.info('IMAP connection test successful');
          imap.end();
          resolve(true);
        });
        
        imap.once('error', (err) => {
          logger.error('IMAP connection test failed:', err);
          reject(err);
        });
        
        imap.connect();
      });
    } catch (error) {
      logger.error('Email connection test failed:', error);
      throw error;
    }
  }
}

module.exports = new EmailService();