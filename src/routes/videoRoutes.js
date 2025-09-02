// src/routes/videoRoutes.js
const express = require('express');
const { query, param } = require('express-validator');
const videoController = require('../controllers/videoController');
const rateLimiters = require('../middleware/rateLimiter');

const router = express.Router();

// Validation middleware
const paginationValidation = [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('sortBy').optional().isIn(['publishedAt', 'title', 'viewCount', 'likeCount']).withMessage('Invalid sort field'),
  query('sortOrder').optional().isIn(['asc', 'desc']).withMessage('Sort order must be asc or desc'),
  query('channel').optional().isLength({ min: 1, max: 100 }).withMessage('Channel filter must be 1-100 characters'),
  query('dateFrom').optional().isISO8601().withMessage('Invalid dateFrom format'),
  query('dateTo').optional().isISO8601().withMessage('Invalid dateTo format')
];

const searchValidation = [
  query('q').notEmpty().withMessage('Search query is required').isLength({ min: 1, max: 200 }).withMessage('Search query must be 1-200 characters').trim().escape(),
  ...paginationValidation
];

// Routes with enhanced rate limiting
router.get('/', rateLimiters.videos, paginationValidation, videoController.getVideos);
router.get('/search', rateLimiters.search, searchValidation, videoController.searchVideos);
router.get('/stats', rateLimiters.stats, videoController.getStats);
router.get('/:id', param('id').notEmpty().withMessage('Video ID is required').isLength({ min: 1, max: 50 }).withMessage('Video ID must be 1-50 characters'), videoController.getVideoById);

module.exports = router;