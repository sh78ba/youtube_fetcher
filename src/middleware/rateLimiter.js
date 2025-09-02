const rateLimit = require('express-rate-limit');
const logger = require('../utils/logger');

// Enhanced rate limiting with different limits for different endpoints
const createRateLimiter = (windowMs, max, message, skipSuccessfulRequests = false) => {
  return rateLimit({
    windowMs,
    max,
    message: {
      error: message,
      retryAfter: Math.ceil(windowMs / 1000)
    },
    skipSuccessfulRequests,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
      logger.warn(`Rate limit exceeded for IP: ${req.ip}, endpoint: ${req.path}`);
      res.status(429).json({
        error: message,
        retryAfter: Math.ceil(windowMs / 1000)
      });
    },
    skip: (req) => {
      // Skip rate limiting for health checks in development
      if (process.env.NODE_ENV === 'development' && req.path === '/health') {
        return true;
      }
      return false;
    }
  });
};

// Different rate limits for different endpoints
const rateLimiters = {
  // General API rate limit - 100 requests per 15 minutes
  general: createRateLimiter(
    15 * 60 * 1000, // 15 minutes
    100,
    'Too many requests from this IP, please try again later.'
  ),

  // Search endpoint - more restrictive due to database queries
  search: createRateLimiter(
    5 * 60 * 1000, // 5 minutes
    20,
    'Too many search requests, please wait before searching again.',
    true // Skip successful requests
  ),

  // Stats endpoint - very restrictive as it's resource intensive
  stats: createRateLimiter(
    10 * 60 * 1000, // 10 minutes
    10,
    'Too many stats requests, please wait before requesting stats again.'
  ),

  // Video listing - moderate limit
  videos: createRateLimiter(
    5 * 60 * 1000, // 5 minutes
    50,
    'Too many video list requests, please wait before requesting more videos.'
  )
};

module.exports = rateLimiters;
