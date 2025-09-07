const express = require('express');
const cors = require('cors');
require('dotenv').config();

const resumeRoutes = require('./routes/resumeRoutes');

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api/resumes', resumeRoutes);

// Global error handler for Multer/others
app.use((err, _req, res, _next) => {
  console.error('Global error:', err);
  if (err.message === 'Only PDF files are allowed') {
    return res.status(400).json({ error: err.message });
  }
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({ error: 'File too large (max 5MB)' });
  }
  res.status(500).json({ error: 'Server error' });
});

const PORT = Number(process.env.PORT || 5000);
app.listen(PORT, () => console.log(`Backend listening on port ${PORT}`));
