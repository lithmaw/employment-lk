const express = require('express');
const router  = express.Router();
const jwt     = require('jsonwebtoken');

// ── GET /api/auth/verify ──────────────────────────────────────────────────
router.get('/verify', (req, res) => {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ valid: false, error: 'No token provided' });
  }
  const token = header.slice(7);
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    res.json({ valid: true, payload });
  } catch {
    res.status(401).json({ valid: false, error: 'Invalid or expired token' });
  }
});

module.exports = router;
