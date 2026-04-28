const express  = require('express');
const router   = express.Router();
const crypto   = require('crypto');
const jwt      = require('jsonwebtoken');
const { generateHash, verifyNotifyHash } = require('../services/payhere');
const { createOrder, getOrder, updateOrder } = require('../services/firestore');
const { appendRow } = require('../services/googleSheets');

// ── POST /api/payment/initiate ─────────────────────────────────────────────
router.post('/initiate', async (req, res) => {
  try {
    const { name, email, phone } = req.body;
    if (!name || !email || !phone) return res.status(400).json({ error: 'Missing fields' });

    const parts     = name.trim().split(' ');
    const firstName = parts[0];
    const lastName  = parts.slice(1).join(' ') || parts[0];

    const orderId    = 'EMP-' + crypto.randomBytes(8).toString('hex').toUpperCase();
    const amount     = '4500.00';
    const currency   = 'LKR';
    const merchantId = process.env.PAYHERE_MERCHANT_ID;

    await createOrder({ orderId, name, firstName, lastName, email, phone, status: 'Pending', createdAt: new Date().toISOString() });

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
      const order = await getOrder(order_id);
      await appendRow([
        new Date().toISOString(), '',
        order?.firstName || '', order?.lastName || '',
        '', '', order?.phone || '', order?.email || '',
        '', '', '', '', '', '',
        'Online Payment', 'Paid',
        '', '', '', '', '',
      ]);
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
      { orderId: order.orderId, name: order.name, email: order.email, phone: order.phone, paid: true },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    res.redirect(`/form2.html?token=${token}`);
  } catch (err) {
    console.error('Return error:', err);
    res.redirect('/payment.html?error=server_error');
  }
});

module.exports = router;
