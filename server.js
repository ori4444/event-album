const express = require('express');
const multer = require('multer');
const cors = require('cors');
const { Pool } = require('pg');
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');

const app = express();
const port = process.env.PORT || 3000;

// ✅ CORS setup
const allowedOrigins = [
  'http://localhost:3000',
  'https://event-album-production.up.railway.app'
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));



// ✅ Handle preflight OPTIONS requests
app.options('*', cors());

// ✅ Middleware
app.use(express.static('public'));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// ✅ Cloudinary setup
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

// ✅ PostgreSQL setup
const pool = new Pool({
  connectionString: 'postgresql://postgres:jGilwsxTNfEruQtfzHzIyBZVugDQVvnv@shortline.proxy.rlwy.net:43346/railway',
  ssl: { rejectUnauthorized: false }
});

// ✅ יצירת טבלה אם לא קיימת
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

// ✅ נקודת בדיקה
app.get('/', (req, res) => {
  res.send('🟢 SERVER ONLINE');
});

// ✅ שליפת תמונות
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

// ✅ העלאת תמונה
app.post('/upload', upload.single('image'), async (req, res) => {
  console.log('📥 Upload request received');
  console.log('🖼️ req.file:', req.file);
  console.log('🙏 req.body:', req.body);

  const now = new Date().toISOString();
  const imageUrl = req.file?.secure_url || req.file?.path || req.file?.url;
  const blessing = req.body?.blessing || null;

  try {
    const query = 'INSERT INTO "wedding-album" (url, upload_time, blessing) VALUES ($1, $2, $3)';
    const values = [imageUrl, now, blessing];
    await pool.query(query, values);
    console.log('✅ Upload saved to DB');
    res.json({ success: true, message: 'Upload complete' });
  } catch (err) {
    console.error('❌ DB insert failed:', err);
    res.status(500).json({ success: false, message: 'DB insert error' });
  }
});
// ✅ העלאת ברכה בלבד לתמונה האחרונה שאין לה ברכה
app.post('/upload-blessing-only', async (req, res) => {
  const { blessing } = req.body;

  if (!blessing || blessing.trim() === '') {
    return res.status(400).json({ success: false, message: 'Missing blessing' });
  }

  try {
    const result = await pool.query(`
      UPDATE "wedding-album"
      SET blessing = $1
      WHERE id = (
        SELECT id FROM "wedding-album"
        WHERE blessing IS NULL
        ORDER BY upload_time DESC
        LIMIT 1
      )
      RETURNING *;
    `, [blessing]);

    if (result.rowCount === 0) {
      return res.status(404).json({ success: false, message: 'No image without blessing found' });
    }

    console.log('✅ Blessing added to last image without blessing:', result.rows[0]);
    res.json({ success: true, message: 'Blessing added' });
  } catch (err) {
    console.error('❌ Failed to update blessing:', err);
    res.status(500).json({ success: false, message: 'DB update error' });
  }
});

// ✅ התחלת שרת
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
