

// src/controllers/videoController.js
const Video = require('../models/Video');
const logger = require('../utils/logger');
const { validationResult } = require('express-validator');
const videoAnalytics = require('../services/videoAnalytics');
const cacheService = require('../services/cacheService');

class VideoController {
  // Get paginated videos sorted by publish date (descending) with enhanced filtering
  async getVideos(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      // Generate cache key for this request
      const cacheKey = cacheService.generateKey('videos', req.query);
      const cachedResult = cacheService.get(cacheKey);
      
      if (cachedResult) {
        return res.json(cachedResult);
      }

      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const skip = (page - 1) * limit;
      const sortBy = req.query.sortBy || 'publishedAt';
      const sortOrder = req.query.sortOrder === 'asc' ? 1 : -1;
      const channelFilter = req.query.channel;
      const dateFrom = req.query.dateFrom;
      const dateTo = req.query.dateTo;

      // Validate pagination parameters
      if (page < 1 || limit < 1 || limit > 100) {
        return res.status(400).json({ 
          error: 'Invalid pagination parameters. Page must be >= 1, limit must be between 1-100' 
        });
      }

      // Build dynamic filter query
      let filterQuery = {};
      
      if (channelFilter) {
        filterQuery.channelTitle = { $regex: channelFilter, $options: 'i' };
      }
      
      if (dateFrom || dateTo) {
        filterQuery.publishedAt = {};
        if (dateFrom) filterQuery.publishedAt.$gte = new Date(dateFrom);
        if (dateTo) filterQuery.publishedAt.$lte = new Date(dateTo);
      }

      // Build dynamic sort object
      const sortObj = {};
      sortObj[sortBy] = sortOrder;
      if (sortBy !== '_id') sortObj._id = 1; // Secondary sort for consistency

      const videos = await Video.find(filterQuery)
        .sort(sortObj)
        .skip(skip)
        .limit(limit)
        .select('-__v')
        .lean(); // Use lean() for better performance

      const total = await Video.countDocuments(filterQuery);
      const totalPages = Math.ceil(total / limit);
      const hasNext = page < totalPages;
      const hasPrev = page > 1;

      const result = {
        success: true,
        data: {
          videos,
          filters: {
            channel: channelFilter,
            dateFrom,
            dateTo,
            sortBy,
            sortOrder: sortOrder === 1 ? 'asc' : 'desc'
          },
          pagination: {
            currentPage: page,
            totalPages,
            totalVideos: total,
            hasNext,
            hasPrev,
            nextPage: hasNext ? page + 1 : null,
            prevPage: hasPrev ? page - 1 : null
          }
        }
      };

      // Cache the result for 2 minutes
      cacheService.set(cacheKey, result, 120);
      
      res.json(result);

    } catch (error) {
      logger.error('Error fetching videos:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // Search videos by title and description with partial matching
  async searchVideos(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { q: query } = req.query;
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const skip = (page - 1) * limit;

      if (!query || query.trim().length === 0) {
        return res.status(400).json({ error: 'Search query is required' });
      }

      // Validate pagination parameters
      if (page < 1 || limit < 1 || limit > 100) {
        return res.status(400).json({ 
          error: 'Invalid pagination parameters. Page must be >= 1, limit must be between 1-100' 
        });
      }

      // Create search conditions for partial matching
      const searchWords = query.trim().split(/\s+/);
      const regexConditions = searchWords.map(word => ({
        $or: [
          { title: { $regex: word, $options: 'i' } },
          { description: { $regex: word, $options: 'i' } }
        ]
      }));

      const searchQuery = {
        $and: regexConditions
      };

      const videos = await Video.find(searchQuery)
        .sort({ publishedAt: -1, _id: 1 })
        .skip(skip)
        .limit(limit)
        .select('-__v')
        .lean();

      const total = await Video.countDocuments(searchQuery);
      const totalPages = Math.ceil(total / limit);
      const hasNext = page < totalPages;
      const hasPrev = page > 1;

      res.json({
        success: true,
        data: {
          videos,
          searchQuery: query,
          pagination: {
            currentPage: page,
            totalPages,
            totalVideos: total,
            hasNext,
            hasPrev,
            nextPage: hasNext ? page + 1 : null,
            prevPage: hasPrev ? page - 1 : null
          }
        }
      });

    } catch (error) {
      logger.error('Error searching videos:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // Get video by ID
  async getVideoById(req, res) {
    try {
      const { id } = req.params;
      
      const video = await Video.findOne({ videoId: id })
        .select('-__v')
        .lean();

      if (!video) {
        return res.status(404).json({ error: 'Video not found' });
      }

      res.json({
        success: true,
        data: video
      });

    } catch (error) {
      logger.error('Error fetching video by ID:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // Get statistics
  async getStats(req, res) {
    try {
      const cacheKey = 'video_stats';
      const cachedStats = cacheService.get(cacheKey);
      
      if (cachedStats) {
        return res.json(cachedStats);
      }

      const totalVideos = await Video.countDocuments({});
      const latestVideo = await Video.findOne({})
        .sort({ publishedAt: -1 })
        .select('title publishedAt')
        .lean();

      const oldestVideo = await Video.findOne({})
        .sort({ publishedAt: 1 })
        .select('title publishedAt')
        .lean();

      // Get advanced analytics
      const analytics = await videoAnalytics.getVideoAnalytics();
      const trendingKeywords = await videoAnalytics.getTrendingKeywords(10);

      const result = {
        success: true,
        data: {
          totalVideos,
          uniqueChannels: analytics.overview.uniqueChannels?.length || 0,
          avgDescriptionLength: Math.round(analytics.overview.avgDescriptionLength || 0),
          avgViewCount: Math.round(analytics.overview.avgViewCount || 0),
          avgLikeCount: Math.round(analytics.overview.avgLikeCount || 0),
          latestVideo,
          oldestVideo,
          searchQuery: process.env.SEARCH_QUERY,
          topChannels: analytics.topChannels,
          dailyTrends: analytics.dailyUploadTrends,
          trendingKeywords,
          cacheStats: cacheService.getStats()
        }
      };

      // Cache stats for 5 minutes
      cacheService.set(cacheKey, result, 300);
      
      res.json(result);

    } catch (error) {
      logger.error('Error fetching stats:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}

module.exports = new VideoController();