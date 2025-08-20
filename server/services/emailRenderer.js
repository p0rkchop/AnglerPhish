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
    // Enhanced HTML sanitization to prevent XSS and ensure proper rendering
    if (!html) {return '';}
    
    // Remove script tags and their content
    html = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
    
    // Remove style tags that could contain malicious CSS
    html = html.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '');
    
    // Remove potentially dangerous tags
    const dangerousTags = ['object', 'embed', 'applet', 'iframe', 'frame', 'frameset', 'base', 'meta', 'link'];
    dangerousTags.forEach(tag => {
      const regex = new RegExp(`<${tag}\\b[^>]*>.*?<\\/${tag}>`, 'gi');
      html = html.replace(regex, '');
      const selfClosing = new RegExp(`<${tag}\\b[^>]*\\/?>`, 'gi');
      html = html.replace(selfClosing, '');
    });
    
    // Remove all event handlers (onclick, onload, etc.)
    html = html.replace(/\s(on\w+)\s*=\s*["'][^"']*["']/gi, '');
    html = html.replace(/\s(on\w+)\s*=\s*[^>\s]+/gi, '');
    
    // Remove javascript: URLs
    html = html.replace(/javascript\s*:/gi, 'blocked:');
    
    // Remove data: URLs that could contain scripts
    html = html.replace(/data\s*:\s*text\/html/gi, 'blocked:text/html');
    
    // Convert relative URLs and external images to placeholder
    html = html.replace(/src\s*=\s*["']\/[^"']*["']/gi, 'src="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7"');
    html = html.replace(/src\s*=\s*["']https?:\/\/[^"']*["']/gi, 'src="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7"');
    
    return html;
  }
}

module.exports = new EmailRenderer();