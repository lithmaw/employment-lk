const express  = require('express');
const router   = express.Router();
const multer   = require('multer');
const auth     = require('../middleware/auth');
const { uploadFileToSupabase } = require('../services/supabase');

const BASE_ALLOWED_TYPES = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
const CV_ALLOWED_TYPES = [
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-word',
  'application/octet-stream',
];
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
    const uploadType = req.body.type;
    const isCvUpload = uploadType === 'cvUrl';
    const allowedTypes = isCvUpload ? [...BASE_ALLOWED_TYPES, ...CV_ALLOWED_TYPES] : BASE_ALLOWED_TYPES;
    const fileExt = originalname.split('.').pop()?.toLowerCase() || '';
    const isAllowedCvExtension = ['doc', 'docx', 'pdf'].includes(fileExt);

    if (!allowedTypes.includes(mimetype) || (isCvUpload && !isAllowedCvExtension)) {
      const allowedLabel = isCvUpload ? 'PDF, DOC, DOCX' : 'PDF, JPG, PNG';
      return res.status(400).json({ error: `Invalid file type. Allowed: ${allowedLabel}` });
    }
    if (size > MAX_SIZE) {
      return res.status(400).json({ error: 'File exceeds 10 MB limit' });
    }

    const result = await uploadFileToSupabase(buffer, mimetype, originalname, req.user.orderId);
    res.json(result);
  } catch (err) {
    console.error('Upload error:', err);
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'File exceeds 10 MB limit' });
    }
    res.status(500).json({ error: err.message || 'Upload failed' });
  }
});

module.exports = router;
