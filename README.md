
# README.md

# YouTube Video Fetcher API 

A scalable Node.js backend API that continuously fetches the latest videos from YouTube for a given search query and provides paginated access with search functionality,multiple API key rotation, advanced search, and Dockerization.

## 🚀 Features & Requirements

- **Background Video Fetching**: Continuously fetches latest videos every 10 seconds (configurable, async)
- **Multiple API Key Support**: Automatic rotation when quota is exhausted (bonus)
- **Paginated API**: Get videos with proper pagination and sorting (descending by published datetime)
- **Advanced Search**: Search videos by title and description with partial matching (bonus: multi-word, partial match)
- **Optimized Database**: Proper indexing for efficient queries
- **Dockerized**: Complete Docker setup with MongoDB
- **Rate Limiting**: API rate limiting for production use
- **Comprehensive Logging**: Winston-based logging system
- **Error Handling**: Robust error handling and validation
- **Health Checks**: Built-in health monitoring
- **Stats Endpoint**: `/api/videos/stats` for dashboard and analytics (bonus)
- **Frontend Dashboard**: See `frontend/` for React dashboard (bonus)

## 📦 Installation & Local Development

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Start MongoDB**
   ```bash
   # Using Docker
   docker run -d -p 27017:27017 --name mongodb mongo:7.0
   # Or use your local MongoDB installation
   ```

5. **Run the application**
   ```bash
   # Development mode
   npm run dev
   # Production mode
   npm start
   ```

## 🐳 Docker Deployment

### Quick Start with Docker

1. **Prerequisites:**
   ```bash
   # Make sure Docker and Docker Compose are installed
   docker --version
   docker-compose --version
   ```

2. **Setup environment variables:**
   ```bash
   # Create .env file with your YouTube API keys
   cp .env.example .env
   # Edit .env and add your YouTube API keys
   ```

3. **Build and start all services:**
   ```bash
   # Start in background (detached mode)
   docker-compose up -d --build
   
   # Or start with logs visible
   docker-compose up --build
   ```

4. **Verify services are running:**
   ```bash
   # Check running containers
   docker-compose ps
   
   # View logs
   docker-compose logs backend
   docker-compose logs mongo
   ```

5. **Access the application:**
   - Backend API: `http://localhost:5001`
   - Health check: `http://localhost:5001/health`
   - Videos API: `http://localhost:5001/api/videos`
   - Search API: `http://localhost:5001/api/videos/search?q=your+query`
   - Stats API: `http://localhost:5001/api/videos/stats`
   - MongoDB: `localhost:27017`

### Docker Commands

```bash
# Stop all services
docker-compose down

# Stop and remove volumes (clears database)
docker-compose down -v

# Rebuild only backend
docker-compose build backend

# View real-time logs
docker-compose logs -f backend

# Execute commands in running container
docker-compose exec backend npm test

# Scale services (if needed)
docker-compose up --scale backend=2
```

### Production Deployment

```bash
# Set production environment
export NODE_ENV=production

# Start with production configuration
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d

# Or use environment file
docker-compose --env-file .env.production up -d
```

## ⚙️ Configuration

Create a `.env` file in the root directory:

```env
NODE_ENV=development
PORT=5001
MONGODB_URI=mongodb://localhost:27017/youtube_videos

# YouTube API Keys (comma-separated for multiple keys)
YOUTUBE_API_KEYS=AIzaSyD_example_key_1,AIzaSyD_example_key_2,AIzaSyD_example_key_3

# Search configuration
SEARCH_QUERY=cricket
FETCH_INTERVAL=10000
MAX_RESULTS_PER_REQUEST=50
```

## Example .env Format

```env
NODE_ENV=development
PORT=5001
MONGODB_URI=mongodb://localhost:27017/youtube_videos
YOUTUBE_API_KEYS=AIzaSyD_example_key_1,AIzaSyD_example_key_2,AIzaSyD_example_key_3
SEARCH_QUERY=cricket
FETCH_INTERVAL=10000
MAX_RESULTS_PER_REQUEST=50
```

### Getting YouTube API Keys

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable YouTube Data API v3
4. Create credentials (API Key)
5. Restrict the key to YouTube Data API v3 for security

## API Endpoints

- `GET /api/videos` - Paginated list of videos sorted by published datetime (desc)
- `GET /api/videos/search?q=your+query` - Search videos by title/description (partial match, multi-word)
- `GET /api/videos/:id` - Get video by ID
- `GET /api/videos/stats` - Get stats for dashboard

## Project Structure

- `src/` - Backend source code
- `frontend/` - React dashboard (bonus)
- `Dockerfile` - Backend Docker build
- `docker-compose.yml` - Multi-service orchestration

## Features Details

- **Background fetcher**: Async, interval-based, stores all required fields
- **API key rotation**: Handles quota exhaustion automatically
- **Search API**: Partial match, multi-word, optimized with indexes
- **Stats endpoint**: For dashboard analytics
- **Dockerized**: Easy deployment and scaling


