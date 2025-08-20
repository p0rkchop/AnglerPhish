// Jest configuration for AnglerPhish defensive security system
// Provides testing framework configuration for Node.js backend

module.exports = {
  // Test environment for Node.js applications
  testEnvironment: 'node',
  
  // Test file patterns - only server tests
  testMatch: [
    '<rootDir>/server/**/__tests__/**/*.js',
    '<rootDir>/server/**/*.test.js',
  ],
  
  // Exclude client tests explicitly
  testPathIgnorePatterns: [
    '<rootDir>/node_modules/',
    '<rootDir>/client/',
  ],
  
  // Setup files to run before tests
  setupFilesAfterEnv: ['<rootDir>/server/__tests__/setup.js'],
  
  // Coverage collection configuration
  collectCoverageFrom: [
    'server/**/*.js',
    '!server/__tests__/**',
    '!server/index.js', // Exclude main entry point from coverage
    '!**/node_modules/**',
  ],
  
  // Coverage thresholds for quality gates
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70,
    },
  },
  
  // Coverage output directory
  coverageDirectory: 'coverage',
  
  // Test timeout (30 seconds for email operations)
  testTimeout: 30000,
  
  // Verbose output for better debugging
  verbose: true,
  
  // Clear mock calls between tests
  clearMocks: true,
  
  // Mock modules for testing
  moduleNameMapper: {},
  
  // Transform configuration (if needed for ES modules)
  transform: {},
};