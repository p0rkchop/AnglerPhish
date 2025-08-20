// Authentication routes tests for AnglerPhish defensive security system
// Tests login functionality, token validation, and security measures

const request = require('supertest');
const express = require('express');
const authRoutes = require('../../routes/auth');
const User = require('../../models/User');
const { helmetConfig, authLimiter } = require('../../middleware/security');
const { sanitizeInput, validateLogin } = require('../../middleware/validation');

// Create test app
const app = express();
app.use(express.json());
app.use(helmetConfig);
app.use(sanitizeInput);
app.use('/auth', authRoutes);

describe('Authentication Routes', () => {
  let testUser;
  
  beforeEach(async () => {
    // Create test user
    testUser = new User(testUtils.createTestUser());
    await testUser.save();
  });

  describe('POST /auth/login', () => {
    it('should login with valid credentials', async () => {
      const response = await request(app)
        .post('/auth/login')
        .send({
          email: 'test@example.com',
          password: 'TestPassword123!',
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('token');
      expect(response.body).toHaveProperty('user');
      expect(response.body.user.email).toBe('test@example.com');
      expect(response.body.user).not.toHaveProperty('password');
    });

    it('should reject invalid credentials', async () => {
      const response = await request(app)
        .post('/auth/login')
        .send({
          email: 'test@example.com',
          password: 'WrongPassword',
        });

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Invalid credentials');
    });

    it('should reject non-existent user', async () => {
      const response = await request(app)
        .post('/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'TestPassword123!',
        });

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Invalid credentials');
    });

    it('should validate email format', async () => {
      const response = await request(app)
        .post('/auth/login')
        .send({
          email: 'invalid-email',
          password: 'TestPassword123!',
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Validation error');
    });

    it('should require all fields', async () => {
      const response = await request(app)
        .post('/auth/login')
        .send({
          email: 'test@example.com',
          // Missing password
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Validation error');
    });

    it('should update last login timestamp', async () => {
      const originalLastLogin = testUser.lastLogin;
      
      await request(app)
        .post('/auth/login')
        .send({
          email: 'test@example.com',
          password: 'TestPassword123!',
        });

      const updatedUser = await User.findById(testUser._id);
      expect(updatedUser.lastLogin).not.toEqual(originalLastLogin);
    });
  });

  describe('GET /auth/me', () => {
    let authToken;

    beforeEach(() => {
      authToken = testUtils.createTestToken({ userId: testUser._id, role: testUser.role });
    });

    it('should return user info with valid token', async () => {
      const response = await request(app)
        .get('/auth/me')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.user.id).toBe(testUser._id.toString());
      expect(response.body.user.email).toBe(testUser.email);
      expect(response.body.user).not.toHaveProperty('password');
    });

    it('should reject request without token', async () => {
      const response = await request(app)
        .get('/auth/me');

      expect(response.status).toBe(401);
    });

    it('should reject invalid token', async () => {
      const response = await request(app)
        .get('/auth/me')
        .set('Authorization', 'Bearer invalid-token');

      expect(response.status).toBe(401);
    });
  });

  describe('POST /auth/create-admin', () => {
    beforeEach(async () => {
      // Remove existing admin for these tests
      await User.deleteMany({ role: 'Administrator' });
    });

    it('should create admin when none exists', async () => {
      const response = await request(app)
        .post('/auth/create-admin')
        .send({
          email: 'admin@test.com',
          password: 'AdminPassword123!',
        });

      expect(response.status).toBe(201);
      expect(response.body.message).toBe('Admin user created successfully');

      const admin = await User.findOne({ role: 'Administrator' });
      expect(admin).toBeTruthy();
      expect(admin.email).toBe('admin@test.com');
    });

    it('should reject when admin already exists', async () => {
      // Create an admin first
      const existingAdmin = new User(testUtils.createTestUser({
        email: 'existing@admin.com',
        role: 'Administrator',
      }));
      await existingAdmin.save();

      const response = await request(app)
        .post('/auth/create-admin')
        .send({
          email: 'new@admin.com',
          password: 'AdminPassword123!',
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Admin user already exists');
    });

    it('should use environment defaults when no data provided', async () => {
      const response = await request(app)
        .post('/auth/create-admin')
        .send({});

      expect(response.status).toBe(201);

      const admin = await User.findOne({ role: 'Administrator' });
      expect(admin.email).toBe(process.env.ADMIN_EMAIL);
    });
  });

  describe('Security Features', () => {
    it('should sanitize potentially malicious input', async () => {
      const response = await request(app)
        .post('/auth/login')
        .send({
          email: 'test@example.com<script>alert("xss")</script>',
          password: 'TestPassword123!',
        });

      // Should still validate email format after sanitization
      expect(response.status).toBe(400);
    });

    it('should handle database errors gracefully', async () => {
      // Simulate database error by closing connection temporarily
      await User.db.close();

      const response = await request(app)
        .post('/auth/login')
        .send({
          email: 'test@example.com',
          password: 'TestPassword123!',
        });

      expect(response.status).toBe(500);
      expect(response.body.error).toBe('Server error during login');
    });
  });
});