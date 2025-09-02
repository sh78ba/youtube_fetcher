import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Container,
  Typography,
  TextField,
  Button,
  Grid,
  Card,
  CardContent,
  CardMedia,
  Pagination,
  CircularProgress,
  Box,
  Chip,
  Stack
} from '@mui/material';

const API_BASE = 'http://localhost:5001/api/videos';

function App() {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [stats, setStats] = useState(null);

  useEffect(() => {
    fetchVideos();
    fetchStats();
    // eslint-disable-next-line
  }, [page, search]);

  const fetchVideos = async () => {
    setLoading(true);
    try {
      const endpoint = search
        ? `${API_BASE}/search?q=${encodeURIComponent(search)}&page=${page}`
        : `${API_BASE}?page=${page}`;
      const res = await axios.get(endpoint);
      setVideos(res.data.data.videos);
      setTotalPages(res.data.data.pagination.totalPages);
    } catch (err) {
      setVideos([]);
    }
    setLoading(false);
  };

  const fetchStats = async () => {
    try {
      const res = await axios.get(`${API_BASE}/stats`);
      setStats(res.data.data);
    } catch (err) {
      setStats(null);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    fetchVideos();
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4 }}>
      <Typography variant="h3" gutterBottom align="center">
        YouTube Video Dashboard
      </Typography>
      <Box component="form" onSubmit={handleSearch} sx={{ mb: 3, display: 'flex', gap: 2 }}>
        <TextField
          label="Search videos (title/description)"
          variant="outlined"
          value={search}
          onChange={e => setSearch(e.target.value)}
          fullWidth
        />
        <Button type="submit" variant="contained" color="primary">
          Search
        </Button>
      </Box>
      {stats && (
        <Box sx={{ mb: 3 }}>
          <Stack direction="row" spacing={2}>
            <Chip label={`Total Videos: ${stats.totalVideos}`} color="primary" />
            <Chip label={`Unique Channels: ${stats.uniqueChannels}`} color="secondary" />
            <Chip label={`Avg. Description Length: ${stats.avgDescriptionLength}`} />
            <Chip label={`Search Query: ${stats.searchQuery}`} />
          </Stack>
        </Box>
      )}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <Grid container spacing={3}>
          {videos.map(video => (
            <Grid item xs={12} sm={6} md={4} key={video.videoId}>
              <Card>
                <CardMedia
                  component="img"
                  height="180"
                  image={video.thumbnails?.high?.url || video.thumbnails?.medium?.url || video.thumbnails?.default?.url}
                  alt={video.title}
                />
                <CardContent>
                  <Typography variant="h6" gutterBottom>{video.title}</Typography>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    {video.description.length > 120 ? video.description.slice(0, 120) + '...' : video.description}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Published: {new Date(video.publishedAt).toLocaleString()}<br />
                    Channel: {video.channelTitle}
                  </Typography>
                  <Box sx={{ mt: 1 }}>
                    {video.tags && video.tags.slice(0, 4).map(tag => (
                      <Chip key={tag} label={tag} size="small" sx={{ mr: 0.5 }} />
                    ))}
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <Pagination
          count={totalPages}
          page={page}
          onChange={(_, value) => setPage(value)}
          color="primary"
        />
      </Box>
    </Container>
  );
}

export default App;
