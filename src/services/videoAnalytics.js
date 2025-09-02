const Video = require('../models/Video');
const logger = require('../utils/logger');

class VideoAnalyticsService {
  
  /**
   * Get comprehensive analytics for video data
   */
  async getVideoAnalytics() {
    try {
      const analyticsData = await Video.aggregate([
        {
          $group: {
            _id: null,
            totalVideos: { $sum: 1 },
            avgViewCount: { $avg: { $toDouble: '$viewCount' } },
            avgLikeCount: { $avg: { $toDouble: '$likeCount' } },
            maxViewCount: { $max: { $toDouble: '$viewCount' } },
            minViewCount: { $min: { $toDouble: '$viewCount' } },
            uniqueChannels: { $addToSet: '$channelId' },
            totalDuration: { $sum: 1 }, // Could parse duration if needed
            avgDescriptionLength: { $avg: { $strLenCP: '$description' } }
          }
        }
      ]);

      const channelStats = await Video.aggregate([
        {
          $group: {
            _id: '$channelTitle',
            videoCount: { $sum: 1 },
            totalViews: { $sum: { $toDouble: '$viewCount' } },
            avgViews: { $avg: { $toDouble: '$viewCount' } }
          }
        },
        { $sort: { videoCount: -1 } },
        { $limit: 10 }
      ]);

      const dailyStats = await Video.aggregate([
        {
          $group: {
            _id: { 
              year: { $year: '$publishedAt' },
              month: { $month: '$publishedAt' },
              day: { $dayOfMonth: '$publishedAt' }
            },
            count: { $sum: 1 }
          }
        },
        { $sort: { '_id.year': -1, '_id.month': -1, '_id.day': -1 } },
        { $limit: 7 }
      ]);

      return {
        overview: analyticsData[0] || {},
        topChannels: channelStats,
        dailyUploadTrends: dailyStats
      };

    } catch (error) {
      logger.error('Error in video analytics service:', error);
      throw error;
    }
  }

  /**
   * Get trending keywords from video titles and descriptions
   */
  async getTrendingKeywords(limit = 20) {
    try {
      const keywords = await Video.aggregate([
        {
          $project: {
            words: {
              $split: [
                { $toLower: { $concat: ['$title', ' ', '$description'] } },
                ' '
              ]
            }
          }
        },
        { $unwind: '$words' },
        {
          $match: {
            words: { 
              $not: { $in: ['the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should'] },
              $regex: /^[a-zA-Z]{3,}$/
            }
          }
        },
        {
          $group: {
            _id: '$words',
            frequency: { $sum: 1 }
          }
        },
        { $sort: { frequency: -1 } },
        { $limit: limit }
      ]);

      return keywords;
    } catch (error) {
      logger.error('Error getting trending keywords:', error);
      throw error;
    }
  }
}

module.exports = new VideoAnalyticsService();
