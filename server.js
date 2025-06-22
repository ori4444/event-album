const express = require('express');
const multer = require('multer');
const cors = require('cors');
const { Pool } = require('pg');
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');

const app = express();
// Use the PORT provided by Railway (or 3000 locally)
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
    resource_type: 'auto',
    allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp', 'mp4']
  }
});

const upload = multer({ storage });

// PostgreSQL pool
const pool = new Pool({
  connectionString: 'postgresql://postgres:jGilwsxTNfEruQtfzHzIyBZVugDQVvnv@shortline.proxy.rlwy.net:43346/railway',
  ssl: { rejectUnauthorized: false }
});

app.use(cors());
app.use(express.static('public'));
app.use(express.json());

// Health-check endpoint
app.get('/', (req, res) => {
  res.send('🟢 OK');
});

// Fetch images
app.get('/images', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT url FROM "wedding-album" ORDER BY upload_time ASC'
    );
    res.json(result.rows.map(row => row.url));
  } catch (err) {
    console.error('Error retrieving images:', err);
    res.status(500).json({ error: 'Error retrieving images' });
  }
});

// Upload single image
app.post('/upload', upload.single('image'), async (req, res) => {
  console.log('Upload request received');
  console.log('req.file:', req.file);

  if (!req.file) {
    console.log('No file uploaded');
    return res.status(400).json({ success: false, message: 'No file uploaded' });
  }

  const now = new Date().toISOString();
  const imageUrl = req.file.secure_url || req.file.path || req.file.url;

  if (!imageUrl) {
    console.error('Invalid file:', req.file);
    return res.status(400).json({ success: false, message: 'Invalid file' });
  }

  try {
    await pool.query(
      'INSERT INTO "wedding-album" (url, upload_time) VALUES ($1, $2)',
      [imageUrl, now]
    );
    res.json({ success: true, message: 'Upload complete' });
  } catch (err) {
    console.error('Error saving image to DB:', err);
    res.status(500).json({ success: false, message: 'Error saving file: ' + err.message });
  }
});

// Connect to the database first, then start the server
pool
  .connect()
  .then(client => {
    client.release();
    app.listen(port, '0.0.0.0', () => {
      console.log(`✅ Server running on port ${port}`);
    });
  })
  .catch(err => {
    console.error('❌ Failed to connect to DB:', err);
    process.exit(1);
  });
