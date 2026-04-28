const express  = require('express');
const router   = express.Router();
const crypto   = require('crypto');
const jwt      = require('jsonwebtoken');
const { generateHash, verifyNotifyHash } = require('../services/payhere');
const { createOrder, getOrder, updateOrder } = require('../services/db');

// ── POST /api/payment/initiate ─────────────────────────────────────────────
router.post('/initiate', async (req, res) => {
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

    const orderId    = 'EMP-' + crypto.randomBytes(8).toString('hex').toUpperCase();
    const amount     = '4500.00';
    const currency   = 'LKR';
    const merchantId = process.env.PAYHERE_MERCHANT_ID;

    await createOrder({ orderId, name: fullName, firstName, lastName, email, phone, status: 'Pending', createdAt: new Date().toISOString() });

    const hash   = generateHash(merchantId, orderId, amount, currency, process.env.PAYHERE_MERCHANT_SECRET);

    const params = {
      merchant_id: merchantId,
      return_url:  process.env.PAYHERE_RETURN_URL,
      cancel_url:  process.env.PAYHERE_CANCEL_URL,
      notify_url:  process.env.PAYHERE_NOTIFY_URL,
      order_id:    orderId,
      items:       'Employement Registration',
      amount,
      currency,
      hash,
      first_name:  firstName,
      last_name:   lastName,
      email,
      phone,
      address:     'N/A',
      city:        'Colombo',
      country:     'Sri Lanka',
    };

    res.json({ params, checkoutUrl: process.env.PAYHERE_BASE_URL });
  } catch (err) {
    console.error('Initiate error:', err);
    res.status(500).json({ error: 'Failed to initiate payment' });
  }
});

// ── POST /api/payment/notify  (PayHere server callback) ───────────────────
router.post('/notify', async (req, res) => {
  try {
    if (!verifyNotifyHash(req.body, process.env.PAYHERE_MERCHANT_SECRET)) {
      console.error('PayHere notify: hash mismatch');
      return res.status(400).send('Invalid signature');
    }

    const { order_id, status_code } = req.body;

    if (status_code === '2') {
      await updateOrder(order_id, { status: 'Paid', paidAt: new Date().toISOString() });
    }

    res.status(200).send('OK');
  } catch (err) {
    console.error('Notify error:', err);
    res.status(500).send('Error');
  }
});

// ── GET /api/payment/return  (PayHere browser redirect) ───────────────────
router.get('/return', async (req, res) => {
  try {
    const { order_id } = req.query;
    if (!order_id) return res.redirect('/payment.html?error=missing_order');

    const order = await getOrder(order_id);
    if (!order || order.status !== 'Paid') {
      return res.redirect('/payment.html?error=payment_not_verified');
    }

    const token = jwt.sign(
      {
        orderId: order.orderId,
        name: order.name,
        firstName: order.firstName,
        lastName: order.lastName,
        email: order.email,
        phone: order.phone,
        paid: true
      },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    res.redirect(`/form2.html?token=${token}`);
  } catch (err) {
    console.error('Return error:', err);
    res.redirect('/payment.html?error=server_error');
  }
});

// ── GET /api/payment/test-success (BYPASS FOR TESTING) ────────────────────
router.get('/test-success', async (req, res) => {
  try {
    const orderId = 'EMP-TEST-' + crypto.randomBytes(4).toString('hex').toUpperCase();
    await createOrder({
      orderId,
      name: 'Test User',
      firstName: 'Test',
      lastName: 'User',
      email: 'test@example.com',
      phone: '0712345678',
      status: 'Paid',
      createdAt: new Date().toISOString(),
      paidAt: new Date().toISOString(),
    });

    const token = jwt.sign(
      {
        orderId,
        name: 'Test User',
        firstName: 'Test',
        lastName: 'User',
        email: 'test@example.com',
        phone: '0712345678',
        paid: true
      },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );
    res.redirect(`/form2.html?token=${token}`);
  } catch (err) {
    console.error('Test success error:', err);
    res.redirect('/payment.html?error=server_error');
  }
});

module.exports = router;
