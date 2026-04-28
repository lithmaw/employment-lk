const express = require('express');
const router  = express.Router();
const crypto  = require('crypto');
const jwt     = require('jsonwebtoken');
const { createOrder } = require('../services/firestore');
const { appendRow }   = require('../services/googleSheets');

// ── POST /api/cod/register ────────────────────────────────────────────────
router.post('/register', async (req, res) => {
  try {
    const { name, email, phone } = req.body;
    if (!name || !email || !phone) return res.status(400).json({ error: 'Missing fields' });

    const parts     = name.trim().split(' ');
    const firstName = parts[0];
    const lastName  = parts.slice(1).join(' ') || parts[0];
    const orderId   = 'EMP-' + crypto.randomBytes(8).toString('hex').toUpperCase();

    try {
      await createOrder({
        orderId, name, firstName, lastName, email, phone,
        status: 'Pending COD',
        createdAt: new Date().toISOString(),
      });

      await appendRow([
        new Date().toISOString(), '',
        firstName, lastName,
        '', '', phone, email,
        '', '', '', '', '', '',
        'Cash on Delivery', 'Pending COD',
        '', '', '', '', '',
      ]);
    } catch (dbErr) {
      console.warn('DB/Sheets integration skipped/failed:', dbErr.message);
    }

    const token = jwt.sign(
      { orderId, name, email, phone, codPending: true },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    res.json({ token });
  } catch (err) {
    console.error('COD register error:', err);
    res.status(500).json({ error: 'Failed to register COD order' });
  }
});

module.exports = router;
