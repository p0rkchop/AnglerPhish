const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs').promises;
const logger = require('../utils/logger');

class EmailRenderer {
  constructor() {
    this.uploadsDir = path.join(__dirname, '../../uploads');
  }

  async renderEmailToPng(htmlContent, submissionId) {
    let browser;
    
    try {
      // Ensure uploads directory exists
      await fs.mkdir(this.uploadsDir, { recursive: true });
      
      // Launch browser
      browser = await puppeteer.launch({
        headless: 'new',
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-gpu'
        ]
      });
      
      const page = await browser.newPage();
      
      // Set viewport for consistent rendering
      await page.setViewport({
        width: 800,
        height: 600,
        deviceScaleFactor: 1
      });
      
      // Sanitize HTML content and wrap in a basic structure
      const sanitizedHtml = this.sanitizeHtml(htmlContent);
      const fullHtml = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body {
              font-family: Arial, sans-serif;
              max-width: 800px;
              margin: 0 auto;
              padding: 20px;
              background: white;
            }
            img {
              max-width: 100%;
              height: auto;
            }
          </style>
        </head>
        <body>
          ${sanitizedHtml}
        </body>
        </html>
      `;
      
      await page.setContent(fullHtml, { waitUntil: 'networkidle0' });
      
      // Generate filename and path
      const filename = `email_${submissionId}.png`;
      const filepath = path.join(this.uploadsDir, filename);
      
      // Take screenshot
      await page.screenshot({
        path: filepath,
        fullPage: true,
        type: 'png'
      });
      
      logger.info(`Email rendered to PNG: ${filename}`);
      return `/uploads/${filename}`;
      
    } catch (error) {
      logger.error('Error rendering email to PNG:', error);
      throw error;
    } finally {
      if (browser) {
        await browser.close();
      }
    }
  }

  sanitizeHtml(html) {
    // Basic HTML sanitization to prevent XSS and ensure proper rendering
    if (!html) return '';
    
    // Remove script tags
    html = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
    
    // Remove potentially dangerous attributes
    html = html.replace(/\s(on\w+)="[^"]*"/gi, '');
    html = html.replace(/\s(on\w+)='[^']*'/gi, '');
    
    // Convert relative URLs to prevent loading issues
    html = html.replace(/src="\/([^"]*)"/, 'src="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7"');
    
    return html;
  }
}

module.exports = new EmailRenderer();