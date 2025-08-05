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

const allowedOrigins = [
  'http://localhost:3000',
  'https://event-album-production.up.railway.app'
];

app.use(cors({
  origin: function (origin, callback) {
    // בקשות ללא origin (למשל curl) יאושרו
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    } else {
      return callback(new Error('Not allowed by CORS'));
    }
  }
}));

app.use(express.static('public'));
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
  res.send('🟢 SERVER ONLINE');
});

// שליפת תמונות
// שליפת תמונות עם ברכות
app.get('/images', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT url, blessing FROM "wedding-album" ORDER BY upload_time ASC'
    );
    res.json(result.rows);
  } catch (err) {
    console.error('❌ Error retrieving images:', err);
    res.status(500).json({ error: 'Error retrieving images' });
  }
});


// העלאת תמונה
app.post('/upload', upload.single('image'), async (req, res) => {
  console.log('📥 Upload request receivedddגג');
  console.log('🖼️ req.file:', req.file);
  console.log('📦 req.body:', req.body); // אמור להופיע גם blessing כאן

  const now = new Date().toISOString();
  const imageUrl = req.file?.secure_url || req.file?.path || req.file?.url;
  const blessing = req.body?.blessing || null;

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
