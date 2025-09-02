const axios = require('axios');
const logger = require('../utils/logger');

class YouTubeAPI {
  constructor() {
    this.apiKeys = process.env.YOUTUBE_API_KEYS?.split(',') || [];
    this.currentKeyIndex = 0;
    this.baseURL = 'https://www.googleapis.com/youtube/v3';
    
    if (this.apiKeys.length === 0) {
      throw new Error('No YouTube API keys provided');
    }
  }

  getCurrentAPIKey() {
    return this.apiKeys[this.currentKeyIndex];
  }

  rotateAPIKey() {
    this.currentKeyIndex = (this.currentKeyIndex + 1) % this.apiKeys.length;
    logger.info(`Rotated to API key ${this.currentKeyIndex + 1}`);
  }

  async makeRequest(endpoint, params) {
    const maxRetries = this.apiKeys.length;
    let attempts = 0;

    while (attempts < maxRetries) {
      try {
        const response = await axios.get(`${this.baseURL}${endpoint}`, {
          params: {
            key: this.getCurrentAPIKey(),
            ...params
          }
        });

        return response.data;
      } catch (error) {
        attempts++;
        
        if (error.response?.status === 403) {
          logger.warn(`API key quota exhausted, rotating key`);
          this.rotateAPIKey();
          
          if (attempts < maxRetries) {
            continue;
          }
        }
        
        logger.error(`YouTube API request failed:`, error.message);
        throw error;
      }
    }
  }

  async searchVideos(query, publishedAfter, maxResults = 50) {
    const params = {
      part: 'snippet',
      type: 'video',
      order: 'date',
      maxResults,
      q: query,
      publishedAfter: publishedAfter.toISOString()
    };

    return this.makeRequest('/search', params);
  }

  async getVideoDetails(videoIds) {
    if (!videoIds.length) return { items: [] };
    
    const params = {
      part: 'snippet,statistics,contentDetails',
      id: videoIds.join(',')
    };

    return this.makeRequest('/videos', params);
  }
}

module.exports = new YouTubeAPI();
