require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const axios = require('axios');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const products = require('./products');
const { sendTelegramAlert } = require('./telegram');
const { sendOrderConfirmation } = require('./email');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "https://js.paystack.co", "https://checkout.paystack.com"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:", "http:"],
      connectSrc: ["'self'", "https://api.paystack.co"],
      frameSrc: ["https://checkout.paystack.com"]
    }
  }
}));

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 100 });
app.use('/api/', limiter);

app.get('/api/products', (req, res) => {
  const { category, sort } = req.query;
  let result = [...products];
  if (category && category !== 'All') result = result.filter(p => p.category === category);
  if (sort === 'price-asc') result.sort((a, b) => a.price - b.price);
  if (sort === 'price-desc') result.sort((a, b) => b.price - a.price);
  res.json({ success: true, products: result });
});

app.get('/api/products/:id', (req, res) => {
  const product = products.find(p => p.id === req.params.id);
  if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
  res.json({ success: true, product });
});

app.post('/api/payment/initialize', async (req, res) => {
  const { customer, items, address } = req.body;
  if (!customer?.email || !customer?.name || !items?.length) {
    return res.status(400).json({ success: false, message: 'Missing required fields' });
  }
  let total = 0;
  for (const item of items) {
    const product = products.find(p => p.id === item.id);
    if (!product) return res.status(400).json({ success: false, message: `Product ${item.id} not found` });
    total += product.price * item.quantity;
  }
  const reference = `STYLUS-${uuidv4().split('-')[0].toUpperCase()}-${Date.now()}`;
  try {
    const response = await axios.post(
      'https://api.paystack.co/transaction/initialize',
      {
        email: customer.email,
        amount: total * 100,
        reference,
        currency: 'NGN',
        metadata: {
          custom_fields: [
            { display_name: 'Customer Name', variable_name: 'customer_name', value: customer.name },
            { display_name: 'Phone', variable_name: 'phone', value: customer.phone || 'N/A' },
            { display_name: 'Delivery Address', variable_name: 'address', value: `${address?.street}, ${address?.city}, ${address?.state}` },
            { display_name: 'Order Items', variable_name: 'items', value: items.map(i => `${i.name} x${i.quantity}`).join(', ') }
          ],
          customer, items, address, total
        }
      },
      { headers: { Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`, 'Content-Type': 'application/json' } }
    );
    res.json({ success: true, authorization_url: response.data.data.authorization_url, reference, total });
  } catch (err) {
    console.error('Paystack init error:', err.response?.data || err.message);
    res.status(500).json({ success: false, message: 'Payment initialization failed' });
  }
});

app.post('/api/payment/verify', async (req, res) => {
  const { reference } = req.body;
  if (!reference) return res.status(400).json({ success: false, message: 'Reference required' });
  try {
    const response = await axios.get(
      `https://api.paystack.co/transaction/verify/${reference}`,
      { headers: { Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}` } }
    );
    const data = response.data.data;
   if (data.status === 'success') {
      const metadata = data.metadata;
      const order = {
        reference,
        customer: metadata.customer,
        items: metadata.items,
        total: metadata.total,
        address: metadata.address,
        date: new Date().toISOString()
      };
      await sendTelegramAlert(order);
      await sendOrderConfirmation(order);
      res.json({ success: true, order });
    } else {
      res.json({ success: false, message: 'Payment not confirmed' });
    }
  } catch (err) {
    console.error('Paystack verify error:', err.response?.data || err.message);
    res.status(500).json({ success: false, message: 'Verification failed' });
  }
});

app.get('/api/config', (req, res) => {
  res.json({
    paystackPublicKey: process.env.PAYSTACK_PUBLIC_KEY,
    whatsappNumber: process.env.WHATSAPP_NUMBER,
    storeName: process.env.STORE_NAME
  });
});

app.get('/health', (req, res) => res.json({ status: 'ok', store: 'STYLUS', time: new Date().toISOString() }));

app.listen(PORT, () => console.log(`STYLUS Store running on port ${PORT}`));
