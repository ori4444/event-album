const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const pool = require('./db');

const app = express();
const PORT = process.env.PORT || 3000;

// הגדרות אחסון התמונות
const storage = multer.diskStorage({
  destination: 'uploads/',
  filename: (req, file, cb) => {
    const uniqueName = Date.now() + '-' + file.originalname;
    cb(null, uniqueName);
  }
});
const upload = multer({ storage });

// הגשת הקבצים הסטטיים
app.use(express.static('public'));
app.use('/uploads', express.static('uploads'));

// הצגת עמוד הבית
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/public/index.html');
});

// API להעלאת קבצים
app.post('/upload', upload.single('image'), async (req, res) => {
  try {
    const filename = req.file.filename;
    await pool.query('INSERT INTO images (filename) VALUES ($1)', [filename]);
    res.redirect('/');
  } catch (err) {
    console.error('Error saving to DB:', err);
    res.status(500).send('Failed to upload');
  }
});

// API לקבלת רשימת התמונות
app.get('/images', async (req, res) => {
  try {
    const result = await pool.query('SELECT filename FROM images ORDER BY uploaded_at DESC');
    const filenames = result.rows.map(row => row.filename);
    res.json(filenames);
  } catch (err) {
    console.error('Error reading from DB:', err);
    res.status(500).send('Error loading images');
  }
});


app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
