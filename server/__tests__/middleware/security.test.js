// Security middleware tests for AnglerPhish defensive security system
// Tests rate limiting, security headers, and input sanitization

const request = require('supertest');
const express = require('express');
const { 
  helmetConfig, 
  generalLimiter, 
  authLimiter, 
  emailLimiter,
  securityLogger 
} = require('../../middleware/security');

describe('Security Middleware', () => {
  describe('Helmet Configuration', () => {
    let app;

    beforeEach(() => {
      app = express();
      app.use(helmetConfig);
      app.get('/test', (req, res) => res.json({ message: 'test' }));
    });

    it('should set security headers', async () => {
      const response = await request(app).get('/test');

      expect(response.headers).toHaveProperty('x-content-type-options', 'nosniff');
      expect(response.headers).toHaveProperty('x-frame-options');
      expect(response.headers).toHaveProperty('x-xss-protection');
      expect(response.headers).toHaveProperty('content-security-policy');
    });

    it('should set Content Security Policy', async () => {
      const response = await request(app).get('/test');
      const csp = response.headers['content-security-policy'];

      expect(csp).toContain('default-src \'self\'');
      expect(csp).toContain('object-src \'none\'');
      expect(csp).toContain('frame-src \'none\'');
    });
  });

  describe('Rate Limiting', () => {
    describe('General Rate Limiter', () => {
      let app;

      beforeEach(() => {
        app = express();
        app.use(generalLimiter);
        app.get('/test', (req, res) => res.json({ message: 'test' }));
      });

      it('should allow requests under limit', async () => {
        const response = await request(app).get('/test');
        expect(response.status).toBe(200);
      });

      it('should include rate limit headers', async () => {
        const response = await request(app).get('/test');
        
        expect(response.headers).toHaveProperty('ratelimit-limit');
        expect(response.headers).toHaveProperty('ratelimit-remaining');
        expect(response.headers).toHaveProperty('ratelimit-reset');
      });
    });

    describe('Auth Rate Limiter', () => {
      let app;

      beforeEach(() => {
        app = express();
        app.use(express.json());
        app.use('/auth', authLimiter);
        app.post('/auth/login', (req, res) => res.json({ message: 'login attempt' }));
      });

      it('should have stricter limits than general limiter', async () => {
        // Make multiple requests to test the limit
        const requests = Array(6).fill().map(() => 
          request(app)
            .post('/auth/login')
            .send({ email: 'test@test.com', password: 'password' })
        );

        const responses = await Promise.all(requests);
        
        // Should have some successful and some rate limited
        const successfulResponses = responses.filter(r => r.status === 200);
        const rateLimitedResponses = responses.filter(r => r.status === 429);
        
        expect(rateLimitedResponses.length).toBeGreaterThan(0);
        expect(successfulResponses.length).toBeLessThan(6);
      });

      it('should return proper error message when rate limited', async () => {
        // Exhaust the rate limit
        const requests = Array(10).fill().map(() => 
          request(app)
            .post('/auth/login')
            .send({ email: 'test@test.com', password: 'password' })
        );

        const responses = await Promise.all(requests);
        const rateLimited = responses.find(r => r.status === 429);

        if (rateLimited) {
          expect(rateLimited.body.error).toContain('Too many login attempts');
        }
      });
    });

    describe('Email Rate Limiter', () => {
      let app;

      beforeEach(() => {
        app = express();
        app.use('/email', emailLimiter);
        app.post('/email/send', (req, res) => res.json({ message: 'email sent' }));
      });

      it('should have very strict limits for email operations', async () => {
        // Email limiter should have lower limits than auth limiter
        const requests = Array(12).fill().map(() => 
          request(app).post('/email/send')
        );

        const responses = await Promise.all(requests);
        const rateLimitedResponses = responses.filter(r => r.status === 429);
        
        expect(rateLimitedResponses.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Security Logger', () => {
    let app;
    let logSpy;

    beforeEach(() => {
      // Mock the logger
      const logger = require('../../utils/logger');
      logSpy = jest.spyOn(logger, 'warn').mockImplementation(() => {});

      app = express();
      app.use(express.json());
      app.use(securityLogger);
      app.post('/test', (req, res) => res.json({ message: 'test' }));
    });

    afterEach(() => {
      logSpy.mockRestore();
    });

    it('should log suspicious directory traversal attempts', async () => {
      await request(app)
        .post('/test')
        .send({ path: '../../../etc/passwd' });

      expect(logSpy).toHaveBeenCalledWith(
        expect.stringContaining('Suspicious request detected')
      );
    });

    it('should log potential XSS attempts', async () => {
      await request(app)
        .post('/test')
        .send({ content: '<script>alert("xss")</script>' });

      expect(logSpy).toHaveBeenCalledWith(
        expect.stringContaining('Suspicious request detected')
      );
    });

    it('should log potential SQL injection attempts', async () => {
      await request(app)
        .post('/test')
        .send({ query: 'UNION SELECT * FROM users' });

      expect(logSpy).toHaveBeenCalledWith(
        expect.stringContaining('Suspicious request detected')
      );
    });

    it('should log JavaScript protocol attempts', async () => {
      await request(app)
        .post('/test')
        .send({ url: 'javascript:alert("malicious")' });

      expect(logSpy).toHaveBeenCalledWith(
        expect.stringContaining('Suspicious request detected')
      );
    });

    it('should not log normal requests', async () => {
      await request(app)
        .post('/test')
        .send({ name: 'normal user', email: 'user@example.com' });

      expect(logSpy).not.toHaveBeenCalled();
    });

    it('should include IP address in suspicious request logs', async () => {
      await request(app)
        .post('/test')
        .send({ malicious: '../../../etc/passwd' });

      expect(logSpy).toHaveBeenCalledWith(
        expect.stringMatching(/IP.*::ffff:127\.0\.0\.1/),
        expect.any(String)
      );
    });
  });

  describe('Integration Tests', () => {
    let app;

    beforeEach(() => {
      app = express();
      app.use(helmetConfig);
      app.use(generalLimiter);
      app.use(securityLogger);
      app.use(express.json());
      app.post('/secure', (req, res) => res.json({ message: 'secure endpoint' }));
    });

    it('should apply all security middleware together', async () => {
      const response = await request(app)
        .post('/secure')
        .send({ test: 'data' });

      expect(response.status).toBe(200);
      expect(response.headers).toHaveProperty('x-content-type-options');
      expect(response.headers).toHaveProperty('ratelimit-limit');
    });

    it('should handle malicious requests with all protections active', async () => {
      const logSpy = jest.spyOn(require('../../utils/logger'), 'warn')
        .mockImplementation(() => {});

      const response = await request(app)
        .post('/secure')
        .send({ 
          payload: '<script>alert("xss")</script>',
          path: '../../../etc/passwd'
        });

      expect(response.status).toBe(200); // Request should still succeed
      expect(response.headers).toHaveProperty('x-content-type-options'); // Security headers applied
      expect(logSpy).toHaveBeenCalled(); // Suspicious activity logged

      logSpy.mockRestore();
    });
  });
});