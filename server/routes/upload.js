const express  = require('express');
const router   = express.Router();
const multer   = require('multer');
const auth     = require('../middleware/auth');
const { uploadFileToDrive } = require('../services/googleDrive');

const ALLOWED_TYPES = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
const MAX_SIZE      = 10 * 1024 * 1024; // 10 MB

const upload = multer({
  storage: multer.memoryStorage(),
  limits:  { fileSize: MAX_SIZE },
});

// ── POST /api/upload ───────────────────────────────────────────────────────
router.post('/', auth, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file received' });

    const { mimetype, buffer, originalname, size } = req.file;

    if (!ALLOWED_TYPES.includes(mimetype)) {
      return res.status(400).json({ error: 'Invalid file type. Allowed: PDF, JPG, PNG' });
    }
    if (size > MAX_SIZE) {
      return res.status(400).json({ error: 'File exceeds 10 MB limit' });
    }

    const result = await uploadFileToDrive(buffer, mimetype, originalname, req.user.orderId);
    res.json(result);
  } catch (err) {
    console.error('Upload error:', err);
    res.status(500).json({ error: 'Upload failed' });
  }
});

module.exports = router;
