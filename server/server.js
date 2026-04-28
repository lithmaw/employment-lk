require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, '../public')));

app.use('/api/payment', require('./routes/payment'));
app.use('/api/cod',     require('./routes/cod'));
app.use('/api/upload',  require('./routes/upload'));
app.use('/api/submit',  require('./routes/submit'));
app.use('/api/auth',    require('./routes/auth'));

// Root → payment form
app.get('/', (_req, res) => res.redirect('/payment.html'));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Employement server running → http://localhost:${PORT}`));
