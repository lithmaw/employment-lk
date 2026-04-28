const express = require('express');
const router  = express.Router();
const crypto  = require('crypto');
const auth    = require('../middleware/auth');
const { createApplication, updateOrder } = require('../services/db');

function generateRef() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let ref = 'EMP-LK-';
  for (let i = 0; i < 6; i++) ref += chars[Math.floor(Math.random() * chars.length)];
  return ref;
}

// ── POST /api/submit ───────────────────────────────────────────────────────
router.post('/', auth, async (req, res) => {
  try {
    const user = req.user;
    const body = req.body || {};
    const pick = (...keys) => {
      for (const key of keys) {
        if (body[key] !== undefined && body[key] !== null && body[key] !== '') {
          return body[key];
        }
      }
      return '';
    };

    const {
      firstName, lastName, address, city, province, postal,
      dob, gender, nic, phone,
      passportNumber, passportCountry, passportIssue, passportExpiry,
      jobCategory,
      extraUrls,
    } = body;
    const passportUrl = pick('passportUrl', 'passporturl', 'passport_url');
    const birthCertUrl = pick('birthCertUrl', 'birthcerturl', 'birth_cert_url');
    const nicUrl = pick('nicUrl', 'nicurl', 'nic_url');
    const photoUrl = pick('photoUrl', 'photourl', 'photo_url');

    // Required field check
    const required = { firstName, lastName, address, city, province, nic,
                       passportNumber, passportExpiry, jobCategory,
                       passportUrl, birthCertUrl, nicUrl, photoUrl };
    for (const [key, val] of Object.entries(required)) {
      if (!val) return res.status(400).json({ error: `Missing required field: ${key}` });
    }

    // Passport expiry must be >= 6 months from today
    const sixMonths = new Date();
    sixMonths.setMonth(sixMonths.getMonth() + 6);
    if (new Date(passportExpiry) < sixMonths) {
      return res.status(400).json({ error: 'Passport must be valid for at least 6 more months' });
    }

    const refNumber   = generateRef();
    const submittedAt = new Date().toISOString();
    const resolvedPhone = phone || user.phone || '';

    await createApplication({
      orderId: user.orderId, refNumber,
      firstName, lastName, address, city, province, postal: postal || '',
      dob: dob || '', gender: gender || '', nic, phone: resolvedPhone,
      passportNumber, passportCountry: passportCountry || 'Sri Lanka',
      passportIssue: passportIssue || '', passportExpiry,
      jobCategory,
      passportUrl, birthCertUrl, nicUrl, photoUrl,
      extraUrls: Array.isArray(extraUrls) ? extraUrls : (extraUrls ? [extraUrls] : []),
      submittedAt, status: 'Submitted',
    });

    await updateOrder(user.orderId, { status: 'Application Submitted', refNumber });

    res.json({ refNumber });
  } catch (err) {
    console.error('Submit error:', err);
    res.status(500).json({ error: err.message || 'Submission failed' });
  }
});

module.exports = router;
