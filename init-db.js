const pool = require('./db');

const createTable = `
CREATE TABLE IF NOT EXISTS images (
  id SERIAL PRIMARY KEY,
  filename TEXT NOT NULL,
  uploaded_at TIMESTAMP DEFAULT NOW()
);
`;

pool.query(createTable)
  .then(() => {
    console.log("✅ Table created");
    process.exit();
  })
  .catch(err => {
    console.error("❌ Error creating table:", err);
    process.exit(1);
  });
