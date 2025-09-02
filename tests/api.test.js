const request = require('supertest');
const app = require('../src/server');
const Video = require('../src/models/Video');

// Mock data for testing
const mockVideo = {
  videoId: 'test123',
  title: 'Test Video Title',
  description: 'This is a test video description',
  publishedAt: new Date(),
  thumbnails: {
    default: { url: 'http://example.com/thumb.jpg' }
  },
  channelId: 'channel123',
  channelTitle: 'Test Channel'
};

describe('Video API Endpoints', () => {
  
  beforeAll(async () => {
    // Setup test database connection
  });

  afterAll(async () => {
    // Clean up test database
  });

  beforeEach(async () => {
    // Clear database before each test
    await Video.deleteMany({});
  });

  describe('GET /api/videos', () => {
    test('should return paginated videos', async () => {
      // Insert test video
      await Video.create(mockVideo);

      const response = await request(app)
        .get('/api/videos')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.videos).toHaveLength(1);
      expect(response.body.data.pagination.totalVideos).toBe(1);
    });

    test('should handle pagination parameters', async () => {
      const response = await request(app)
        .get('/api/videos?page=1&limit=5')
        .expect(200);

      expect(response.body.data.pagination.currentPage).toBe(1);
    });

    test('should validate pagination parameters', async () => {
      const response = await request(app)
        .get('/api/videos?page=0&limit=200')
        .expect(400);

      expect(response.body.error).toContain('pagination parameters');
    });
  });

  describe('GET /api/videos/search', () => {
    test('should search videos by title and description', async () => {
      await Video.create(mockVideo);

      const response = await request(app)
        .get('/api/videos/search?q=test')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.videos).toHaveLength(1);
      expect(response.body.data.searchQuery).toBe('test');
    });

    test('should require search query', async () => {
      const response = await request(app)
        .get('/api/videos/search')
        .expect(400);

      expect(response.body.errors).toBeDefined();
    });

    test('should handle partial word matching', async () => {
      await Video.create({
        ...mockVideo,
        title: 'How to make tea',
        description: 'Learn tea making'
      });

      const response = await request(app)
        .get('/api/videos/search?q=tea how')
        .expect(200);

      expect(response.body.data.videos).toHaveLength(1);
    });
  });

  describe('GET /api/videos/stats', () => {
    test('should return video statistics', async () => {
      await Video.create(mockVideo);

      const response = await request(app)
        .get('/api/videos/stats')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.totalVideos).toBe(1);
      expect(response.body.data.uniqueChannels).toBeDefined();
    });
  });

  describe('GET /api/videos/:id', () => {
    test('should return specific video by ID', async () => {
      await Video.create(mockVideo);

      const response = await request(app)
        .get('/api/videos/test123')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.videoId).toBe('test123');
    });

    test('should return 404 for non-existent video', async () => {
      const response = await request(app)
        .get('/api/videos/nonexistent')
        .expect(404);

      expect(response.body.error).toBe('Video not found');
    });
  });
});

describe('Health Check', () => {
  test('should return health status', async () => {
    const response = await request(app)
      .get('/health')
      .expect(200);

    expect(response.body.status).toBe('OK');
    expect(response.body.timestamp).toBeDefined();
    expect(response.body.uptime).toBeDefined();
  });
});
