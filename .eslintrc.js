// ESLint configuration for AnglerPhish defensive security system
// Enforces code quality and security best practices

module.exports = {
  env: {
    node: true,
    es2021: true,
    jest: true,
  },
  extends: [
    'eslint:recommended',
  ],
  parserOptions: {
    ecmaVersion: 12,
    sourceType: 'module',
  },
  rules: {
    // Error Prevention
    'no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    'no-console': 'warn',
    'no-debugger': 'error',
    
    // Security Rules
    'no-eval': 'error',
    'no-implied-eval': 'error',
    'no-new-func': 'error',
    'no-script-url': 'error',
    
    // Code Quality
    'prefer-const': 'error',
    'no-var': 'error',
    'eqeqeq': 'error',
    'curly': 'error',
    
    // Style Consistency
    'indent': ['error', 2],
    'quotes': ['error', 'single', { allowTemplateLiterals: true }],
    'semi': ['error', 'always'],
    'comma-trailing': 'off',
    
    // Best Practices
    'no-magic-numbers': ['warn', { ignore: [-1, 0, 1, 2] }],
    'complexity': ['warn', 10],
    'max-depth': ['warn', 4],
    'max-params': ['warn', 5],
    
    // Async/Await
    'require-await': 'error',
    'no-return-await': 'error',
  },
  overrides: [
    {
      files: ['**/__tests__/**/*.js', '**/*.test.js'],
      rules: {
        'no-magic-numbers': 'off', // Allow magic numbers in tests
        'max-params': 'off', // Allow more params in test functions
      },
    },
  ],
};