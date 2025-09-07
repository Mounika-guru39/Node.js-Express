const express = require('express');
const multer = require('multer');
const { uploadResume, getAllResumes, getResumeById } = require('../controllers/resumeController');

const router = express.Router();

// Limit to PDFs, size 5MB
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype !== 'application/pdf') return cb(new Error('Only PDF files are allowed'));
    cb(null, true);
  },
});

router.post('/upload', upload.single('resume'), uploadResume);
router.get('/', getAllResumes);
router.get('/:id', getResumeById);

module.exports = router;
