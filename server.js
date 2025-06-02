require('dotenv').config();
const express = require('express');
const multer = require('multer');
const cors = require('cors');
const { Pool } = require('pg');
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');

const app = express();
const port = process.env.PORT || 3000;

// Cloudinary configuration
cloudinary.config({
  cloud_name: 'dbpxjgghy',
  api_key: '615724297644761',
  api_secret: 'srSE8nw-6hzDYTZ6dUPO8d8CbS0'
});

// Cloudinary storage setup
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'wedding_album',
    allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp', 'mp4']
  },
});

const upload = multer({ storage });

// PostgreSQL connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL ? { rejectUnauthorized: false } : false
});

// Middleware
app.use(cors());
app.use(express.static('public'));

// Route: Get all images (ordered by upload_time)
app.get('/images', async (req, res) => {
  try {
    const result = await pool.query('SELECT url FROM "wedding-album" ORDER BY upload_time ASC');
    res.json(result.rows.map(row => row.url));
  } catch (err) {
    console.error('Error retrieving images:', err);
    res.status(500).send('Error retrieving images');
  }
});

// Route: Upload new image
app.post('/upload', upload.single('image'), async (req, res) => {
  if (!req.file || !req.file.path) return res.status(400).send('No file uploaded');

  const now = new Date().toISOString();

  try {
    await pool.query(
      'INSERT INTO "wedding-album" (url, upload_time) VALUES ($1, $2)',
      [req.file.path, now]
    );
    res.redirect('/');
  } catch (err) {
    console.error('Error saving image to DB:', err);
    res.status(500).send('Error saving file');
  }
});

// Start server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
