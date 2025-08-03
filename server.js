const express = require('express');
const multer = require('multer');
const cors = require('cors');
const { Pool } = require('pg');
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');

const app = express();
const port = process.env.PORT || 3000;

// Cloudinary setup
cloudinary.config({
  cloud_name: 'dbpxjgghy',
  api_key: '615724297644761',
  api_secret: 'srSE8nw-6hzDYTZ6dUPO8d8CbS0'
});

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'wedding_album',
    resource_type: 'auto',
    allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp', 'mp4']
  }
});

const upload = multer({ storage });

// PostgreSQL setup
const pool = new Pool({
  connectionString: 'postgresql://postgres:jGilwsxTNfEruQtfzHzIyBZVugDQVvnv@shortline.proxy.rlwy.net:43346/railway',
  ssl: { rejectUnauthorized: false }
});

app.use(cors());
app.use(express.static('public'));

// ❗ חיוני לנתח שדות טופס שאינם קבצים
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// יצירת טבלה אם לא קיימת
const createTableIfNotExists = async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS "wedding-album" (
      id SERIAL PRIMARY KEY,
      url TEXT NOT NULL,
      upload_time TIMESTAMP NOT NULL,
      blessing TEXT
    );
  `);
};

// נקודת בדיקה
app.get('/', (req, res) => {
  res.send('🟢 NEW VERSION');
});


// שליפת תמונות
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

// נקודת העלאה עם ברכה
app.post('/upload', (req, res) => {
  const multerMiddleware = upload.single('image');

  multerMiddleware(req, res, async function (err) {
    if (err) {
      console.error('❌ Multer error:', err);
      return res.status(500).json({ success: false, message: 'Upload error' });
    }

    console.log('📥 Upload request received');
    console.log('req.file:', req.file);
    console.log('req.body:', req.body);

    if (!req.file) {
      console.log('❌ No file uploaded');
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    const now = new Date().toISOString();
    const imageUrl = req.file.secure_url || req.file.path || req.file.url;
    const blessing = req.body.blessing || null;

    console.log('Parsed blessing:', blessing);

    try {
      const query = 'INSERT INTO "wedding-album" (url, upload_time, blessing) VALUES ($1, $2, $3)';
      const values = [imageUrl, now, blessing];
      await pool.query(query, values);
      console.log('✅ Upload saved successfully to DB');
      res.json({ success: true, message: 'Upload complete' });
    } catch (err) {
      console.error('❌ DB insert failed:', err);
      res.status(500).json({ success: false, message: 'DB insert error' });
    }
  });
});


// התחלת שרת
pool.connect().then(async client => {
  client.release();
  await createTableIfNotExists();
  app.listen(port, '0.0.0.0', () => {
    console.log(`🚀 Server running on port ${port}`);
  });
}).catch(err => {
  console.error('❌ Failed to connect to DB:', err);
  process.exit(1);
});
