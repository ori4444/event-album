const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');

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
app.post('/upload', upload.single('image'), (req, res) => {
  res.redirect('/');
});

// API לקבלת רשימת התמונות
app.get('/images', (req, res) => {
  fs.readdir('./uploads', (err, files) => {
    if (err) return res.status(500).send('Error loading images');
    res.json(files);
  });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
