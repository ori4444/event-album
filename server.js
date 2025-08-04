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
app.get('/images', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT url FROM "wedding-album" ORDER BY upload_time ASC'
    );
    res.json(result.rows.map(row => row.url));
  } catch (err) {
    console.error('❌ Error retrieving images:', err);
    res.status(500).json({ error: 'Error retrieving images' });
  }
});

// העלאת תמונה
app.post('/upload', upload.single('image'), async (req, res) => {
  console.log('\n📤 ==== קיבלת בקשת upload ====');

  if (!req.file) {
    console.log('❌ לא התקבל קובץ (req.file חסר)');
    return res.status(400).json({ success: false, message: 'No file uploaded' });
  }

  console.log('✅ קובץ התקבל:');
  console.log('fieldname:', req.file.fieldname);
  console.log('originalname:', req.file.originalname);
  console.log('mimetype:', req.file.mimetype);
  console.log('path:', req.file.path);
  console.log('secure_url:', req.file.secure_url);
  console.log('size:', req.file.size);

  console.log('\n📦 נתוני טופס נוספים (req.body):');
  console.dir(req.body);

  const imageUrl = req.file.secure_url || req.file.path || req.file.url;
  const now = new Date().toISOString();
  const blessing = req.body?.blessing || null;

  console.log('\n💬 ברכה מזוהה:', blessing || '[אין]');

  try {
    const query = 'INSERT INTO "wedding-album" (url, upload_time, blessing) VALUES ($1, $2, $3)';
    const values = [imageUrl, now, blessing];
    console.log('📝 מוסיף למסד נתונים:', values);
    await pool.query(query, values);
    console.log('✅ הוכנס בהצלחה למסד הנתונים');
    res.json({ success: true, message: 'Upload complete' });
  } catch (err) {
    console.error('❌ שגיאה בהכנסה ל־DB:', err);
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
