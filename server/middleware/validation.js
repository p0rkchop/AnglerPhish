// Input validation middleware for AnglerPhish defensive security system
// Provides comprehensive input validation to prevent malicious payloads

const Joi = require('joi'); // Validation library
const logger = require('../utils/logger'); // Centralized logging

// Validation schemas
const schemas = {
  // User authentication validation
  login: Joi.object({
    email: Joi.string().email().required().max(255),
    password: Joi.string().required().min(8).max(255),
  }),

  // Configuration update validation
  configUpdate: Joi.object({
    value: Joi.string().required().max(1000),
    description: Joi.string().optional().max(500),
    category: Joi.string().optional().valid('email', 'system', 'notification').max(50),
  }),

  // Submission scoring validation
  submissionScore: Joi.object({
    score: Joi.number().integer().min(0).max(100).required(),
    notes: Joi.string().optional().max(1000),
  }),

  // Email configuration validation
  emailConfig: Joi.object({
    host: Joi.string().hostname().required(),
    port: Joi.number().integer().min(1).max(65535).required(),
    secure: Joi.boolean().required(),
    user: Joi.string().email().required().max(255),
    pass: Joi.string().required().max(255),
  }),

  // General query parameters validation
  queryParams: Joi.object({
    page: Joi.number().integer().min(1).max(1000).optional().default(1),
    limit: Joi.number().integer().min(1).max(100).optional().default(20),
    sort: Joi.string().valid('createdAt', 'updatedAt', 'score', 'sender').optional().default('createdAt'),
    order: Joi.string().valid('asc', 'desc').optional().default('desc'),
    status: Joi.string().valid('todo', 'done').optional(),
  }),

  // MongoDB ObjectId validation
  objectId: Joi.string().regex(/^[0-9a-fA-F]{24}$/).required(),
};

// Validation middleware factory
const validate = (schema, property = 'body') => {
  return (req, res, next) => {
    const dataToValidate = req[property];
    
    const { error, value } = schema.validate(dataToValidate, {
      abortEarly: false, // Return all validation errors
      allowUnknown: false, // Don't allow additional properties
      stripUnknown: true, // Remove unknown properties
    });

    if (error) {
      const errorDetails = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message,
      }));

      logger.warn(`Validation error from IP ${req.ip}:`, {
        endpoint: `${req.method} ${req.path}`,
        errors: errorDetails,
        data: dataToValidate,
      });

      return res.status(400).json({
        error: 'Validation error',
        details: errorDetails,
      });
    }

    // Replace the original data with validated and sanitized data
    req[property] = value;
    next();
  };
};

// Specific validation middleware functions
const validateLogin = validate(schemas.login);
const validateConfigUpdate = validate(schemas.configUpdate);
const validateSubmissionScore = validate(schemas.submissionScore);
const validateEmailConfig = validate(schemas.emailConfig);
const validateQueryParams = validate(schemas.queryParams, 'query');
const validateObjectId = (paramName = 'id') => {
  return (req, res, next) => {
    const id = req.params[paramName];
    
    const { error } = schemas.objectId.validate(id);
    
    if (error) {
      logger.warn(`Invalid ObjectId from IP ${req.ip}:`, {
        endpoint: `${req.method} ${req.path}`,
        paramName,
        value: id,
      });

      return res.status(400).json({
        error: 'Invalid ID format',
      });
    }

    next();
  };
};

// Sanitize HTML content to prevent XSS
const sanitizeHtml = require('cheerio'); // Using cheerio for HTML parsing

const sanitizeInput = (req, res, next) => {
  const sanitizeObject = (obj) => {
    for (const key in obj) {
      if (typeof obj[key] === 'string') {
        // Remove potential XSS vectors
        obj[key] = obj[key]
          .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove script tags
          .replace(/javascript:/gi, '') // Remove javascript: protocol
          .replace(/on\w+\s*=/gi, '') // Remove event handlers
          .trim();
      } else if (typeof obj[key] === 'object' && obj[key] !== null) {
        sanitizeObject(obj[key]);
      }
    }
  };

  if (req.body && typeof req.body === 'object') {
    sanitizeObject(req.body);
  }

  if (req.query && typeof req.query === 'object') {
    sanitizeObject(req.query);
  }

  next();
};

module.exports = {
  schemas,
  validate,
  validateLogin,
  validateConfigUpdate,
  validateSubmissionScore,
  validateEmailConfig,
  validateQueryParams,
  validateObjectId,
  sanitizeInput,
};