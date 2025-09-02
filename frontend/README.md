# YouTube Video Dashboard

A React dashboard to view, search, and filter YouTube videos fetched by the backend API.

## Features
- Paginated video list
- Advanced search (partial match, multi-word)
- Stats display (total videos, unique channels, etc.)
- Responsive Material UI design

## Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```
2. Start the dashboard:
   ```bash
   npm start
   ```
3. The dashboard will run on http://localhost:3000 and proxy API requests to the backend.

## API Endpoints Used
- `/api/videos` (GET, paginated)
- `/api/videos/search?q=...` (GET, paginated, advanced search)
- `/api/videos/stats` (GET, stats)

## Customization
- Edit `src/App.js` to change search query, filters, or UI layout.

---

**Note:** Make sure your backend server is running and accessible at `/api` for the dashboard to work.
