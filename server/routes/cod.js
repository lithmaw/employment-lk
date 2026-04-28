const express = require('express');
const router  = express.Router();
const crypto  = require('crypto');
const jwt     = require('jsonwebtoken');
const { createOrder } = require('../services/db');

// ── POST /api/cod/register ────────────────────────────────────────────────
router.post('/register', async (req, res) => {
  try {
    const {
      name,
      firstName: rawFirstName,
      lastName: rawLastName,
      email,
      phone
    } = req.body;
    const firstName = rawFirstName?.trim() || name?.trim().split(/\s+/)[0] || '';
    const lastName = rawLastName?.trim() || name?.trim().split(/\s+/).slice(1).join(' ') || '';
    const fullName = [firstName, lastName].filter(Boolean).join(' ').trim();
    if (!firstName || !lastName || !email || !phone) return res.status(400).json({ error: 'Missing fields' });
    const orderId   = 'EMP-' + crypto.randomBytes(8).toString('hex').toUpperCase();

    try {
      await createOrder({
        orderId, name: fullName, firstName, lastName, email, phone,
        status: 'Pending COD',
        createdAt: new Date().toISOString(),
      });
    } catch (dbErr) {
      console.warn('Order creation failed:', dbErr.message);
    }

    const token = jwt.sign(
      { orderId, name: fullName, firstName, lastName, email, phone, codPending: true },
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
