const cron = require('node-cron');
const Video = require('../models/Video');
const youtubeAPI = require('./youtubeAPI');
const logger = require('../utils/logger');

class VideoFetcher {
  constructor() {
    this.isRunning = false;
    this.lastFetchTime = new Date(Date.now() - 24 * 60 * 60 * 1000); // Start from 24 hours ago
    this.searchQuery = process.env.SEARCH_QUERY || 'cricket';
  }

  async fetchAndStoreVideos() {
    if (this.isRunning) {
      logger.info('Video fetch already in progress, skipping...');
      return;
    }

    this.isRunning = true;
    logger.info('Starting video fetch process...');

    try {
      // Search for videos published after last fetch time
      const searchResponse = await youtubeAPI.searchVideos(
        this.searchQuery,
        this.lastFetchTime,
        process.env.MAX_RESULTS_PER_REQUEST || 50
      );

      if (!searchResponse.items || searchResponse.items.length === 0) {
        logger.info('No new videos found');
        return;
      }

      // Extract video IDs for detailed information
      const videoIds = searchResponse.items.map(item => item.id.videoId);
      
      // Get detailed video information
      const detailsResponse = await youtubeAPI.getVideoDetails(videoIds);
      
      // Process and store videos
      const videosToStore = [];
      
      for (const searchItem of searchResponse.items) {
        const detailItem = detailsResponse.items.find(
          detail => detail.id === searchItem.id.videoId
        );

        const videoData = this.processVideoData(searchItem, detailItem);
        videosToStore.push(videoData);
      }

      // Bulk insert with upsert to avoid duplicates
      const bulkOps = videosToStore.map(video => ({
        updateOne: {
          filter: { videoId: video.videoId },
          update: { $set: video },
          upsert: true
        }
      }));

      const result = await Video.bulkWrite(bulkOps);
      
      // Update last fetch time to the most recent video's publish time
      if (videosToStore.length > 0) {
        const latestPublishTime = Math.max(
          ...videosToStore.map(v => new Date(v.publishedAt).getTime())
        );
        this.lastFetchTime = new Date(latestPublishTime);
      }

      logger.info(`Video fetch completed. Inserted: ${result.upsertedCount}, Modified: ${result.modifiedCount}`);

    } catch (error) {
      logger.error('Error in video fetch process:', error);
    } finally {
      this.isRunning = false;
    }
  }

  processVideoData(searchItem, detailItem) {
    return {
      videoId: searchItem.id.videoId,
      title: searchItem.snippet.title,
      description: searchItem.snippet.description,
      publishedAt: new Date(searchItem.snippet.publishedAt),
      thumbnails: {
        default: searchItem.snippet.thumbnails.default,
        medium: searchItem.snippet.thumbnails.medium,
        high: searchItem.snippet.thumbnails.high
      },
      channelId: searchItem.snippet.channelId,
      channelTitle: searchItem.snippet.channelTitle,
      duration: detailItem?.contentDetails?.duration,
      viewCount: detailItem?.statistics?.viewCount,
      likeCount: detailItem?.statistics?.likeCount,
      tags: detailItem?.snippet?.tags || [],
      categoryId: detailItem?.snippet?.categoryId
    };
  }

  start() {
    // Run immediately on start
    this.fetchAndStoreVideos();

    // Schedule to run every specified interval
    const intervalSeconds = Math.floor((process.env.FETCH_INTERVAL || 10000) / 1000);
    const cronExpression = `*/${intervalSeconds} * * * * *`;
    
    cron.schedule(cronExpression, () => {
      this.fetchAndStoreVideos();
    });

    logger.info(`Video fetcher started with interval: ${intervalSeconds} seconds`);
  }
}

const videoFetcher = new VideoFetcher();

const startVideoFetcher = async () => {
  videoFetcher.start();
};

module.exports = { startVideoFetcher };
