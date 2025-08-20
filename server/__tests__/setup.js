// Test setup configuration for AnglerPhish defensive security system
// Provides database mocking and common test utilities

const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');

// Global test database instance
let mongoServer;

// Setup before all tests
beforeAll(async () => {
  // Start in-memory MongoDB instance
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  
  // Connect to test database
  await mongoose.connect(mongoUri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
});

// Cleanup after each test
afterEach(async () => {
  // Clear all collections after each test
  const collections = mongoose.connection.collections;
  
  for (const key in collections) {
    const collection = collections[key];
    await collection.deleteMany({});
  }
});

// Cleanup after all tests
afterAll(async () => {
  // Close database connection
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
  
  // Stop in-memory MongoDB
  await mongoServer.stop();
});

// Common test utilities
global.testUtils = {
  // Create test user data
  createTestUser: (overrides = {}) => ({
    email: 'test@example.com',
    password: 'TestPassword123!',
    role: 'Administrator',
    ...overrides,
  }),
  
  // Create test submission data
  createTestSubmission: (overrides = {}) => ({
    sender: 'phisher@malicious.com',
    subject: 'Test Phishing Email',
    body: 'This is a test phishing email',
    headers: {
      'message-id': 'test-message-id',
      'date': new Date().toISOString(),
    },
    urls: ['http://malicious-site.com'],
    attachments: [],
    status: 'todo',
    ...overrides,
  }),
  
  // Create test config data
  createTestConfig: (overrides = {}) => ({
    key: 'test_setting',
    value: 'test_value',
    description: 'Test configuration setting',
    category: 'system',
    ...overrides,
  }),
  
  // Mock JWT token for testing
  createTestToken: (payload = { userId: 'test-user-id', role: 'Administrator' }) => {
    const jwt = require('jsonwebtoken');
    return jwt.sign(payload, process.env.JWT_SECRET || 'test-secret', { expiresIn: '1h' });
  },
};

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret-for-testing-only';
process.env.ADMIN_EMAIL = 'admin@test.com';
process.env.ADMIN_PASSWORD = 'TestAdmin123!';

// Suppress console logs during testing (unless in debug mode)
if (!process.env.DEBUG_TESTS) {
  global.console = {
    ...console,
    log: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  };
}

// Add a dummy test to prevent "no tests" error
test('Setup file loads correctly', () => {
  expect(true).toBe(true);
});