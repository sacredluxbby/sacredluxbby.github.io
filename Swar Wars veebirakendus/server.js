const express = require('express');
const cors = require('cors');
const axios = require('axios');
const path = require('path');

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

const API_BASE = 'https://starwars-databank-server.onrender.com/api/v1/';

async function fetchCategory(req, res, remoteCategory, localCategoryLabel) {
  const page = Number.parseInt(req.query.page, 10) || 1;
  const limit = Number.parseInt(req.query.limit, 10) || 6;

  try {
    const response = await axios.get(`${API_BASE}${remoteCategory}`, {
      params: { page, limit }
    });
    res.json(response.data);
  } catch (error) {
    console.error(`Error fetching ${localCategoryLabel}:`, error.message);
    res.status(500).json({ error: `Failed to fetch ${localCategoryLabel}` });
  }
}

// Primary categories used by the frontend.
app.get('/api/characters', (req, res) => fetchCategory(req, res, 'characters', 'characters'));
app.get('/api/locations', (req, res) => fetchCategory(req, res, 'locations', 'locations'));
app.get('/api/species', (req, res) => fetchCategory(req, res, 'species', 'species'));
app.get('/api/vehicles', (req, res) => fetchCategory(req, res, 'vehicles', 'vehicles'));

// Backward-compatible aliases with previous naming.
app.get('/api/planets', (req, res) => fetchCategory(req, res, 'locations', 'planets'));
app.get('/api/starships', (req, res) => fetchCategory(req, res, 'vehicles', 'starships'));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'Server is running' });
});

app.listen(PORT, () => {
  console.log(`🚀 Star Wars App running at http://localhost:${PORT}`);
});
