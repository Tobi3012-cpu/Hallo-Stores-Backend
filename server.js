const express = require('express');
const cors = require('cors');
require('dotenv').config();
const axios = require('axios');
const Database = require('better-sqlite3');
const { sendThankYouEmail, sendAdminNotification } = require('./email');

const app = express();
app.use(cors({
  origin: [
    'http://localhost:5173',
    'http://localhost:5174',
    'http://localhost:5175',
    'http://localhost:5176',
    'https://hallo-stores-global.vercel.app',
  ],
  credentials: true,
}));
app.use(express.json());

// === Database Setup ===
const dbPath = process.env.NODE_ENV === 'production' 
  ? '/data/orders.db' // This is the special "volume" path
  : 'orders.db';      // This is for your local computer
const db = new Database(dbPath);

db.exec(`
  CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_number TEXT UNIQUE,
    reference TEXT UNIQUE,
    customer_name TEXT,
    customer_email TEXT,
    customer_phone TEXT,
    customer_address TEXT,
    items TEXT,
    subtotal REAL,
    shipping REAL,
    total REAL,
    status TEXT DEFAULT 'pending',
    email_sent INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    paid_at DATETIME
  )
`);

console.log("✅ Database ready: orders.db");
console.log(
  "Paystack Key:",
  process.env.PAYSTACK_SECRET_KEY ? "✓ Loaded" : "❌ Missing"
);
console.log(
  "Email Account:",
  process.env.EMAIL_USER ? `✓ ${process.env.EMAIL_USER}` : "❌ Missing"
);

// Helper: Generate a friendly order number (e.g., HS-2024-0001)
function generateOrderNumber() {
  const year = new Date().getFullYear();
  const countRow = db.prepare(`SELECT COUNT(*) as count FROM orders`).get();
  const nextNum = (countRow.count + 1).toString().padStart(4, '0');
  return `HS-${year}-${nextNum}`;
}

// === Initialize Payment ===
app.post('/api/paystack/initialize', async (req, res) => {
  const { email, amount, customer, items } = req.body;

  if (!customer || !customer.name) {
    return res.status(400).json({ error: 'Customer information is required' });
  }

  const subtotal = amount / 100;
  const shipping = subtotal > 100000 ? 0 : 2000;
  const total = subtotal; // amount already includes shipping from frontend

  try {
    const response = await axios.post(
      'https://api.paystack.co/transaction/initialize',
      {
        email: email,
        amount: amount,
        channels: ['card'],
        callback_url: 'https://hallo-stores-global.vercel.app/checkout',
        metadata: {
          customer_name: customer.name,
          customer_phone: customer.phone,
        },
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
          'Content-Type': 'application/json',
        },
        timeout: 15000,
      }
    );

    const reference = response.data.data.reference;
    const orderNumber = generateOrderNumber();

    const insertOrder = db.prepare(`
      INSERT INTO orders 
        (order_number, reference, customer_name, customer_email, customer_phone, customer_address, items, subtotal, shipping, total, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    insertOrder.run(
      orderNumber,
      reference,
      customer.name,
      customer.email,
      customer.phone,
      customer.address,
      JSON.stringify(items),
      subtotal - shipping,
      shipping,
      total,
      'pending'
    );

    console.log(`📝 Order created: ${orderNumber} (${reference})`);
    res.json(response.data.data);
  } catch (error) {
    console.error("=== PAYSTACK ERROR ===");
    console.error("Message:", error.message);
    if (error.response) console.error("Data:", JSON.stringify(error.response.data));
    res.status(500).json({
      error: 'Payment initialization failed',
      message: error.message,
    });
  }
});

// === Verify Payment & Send Emails ===
app.get('/api/paystack/verify/:reference', async (req, res) => {
  const { reference } = req.params;

  try {
    const response = await axios.get(
      `https://api.paystack.co/transaction/verify/${reference}`,
      {
        headers: { Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}` },
        timeout: 15000,
      }
    );

    if (response.data.data.status !== 'success') {
      return res.json({ status: 'failed' });
    }

    // Fetch the full order from DB
    const order = db.prepare(`SELECT * FROM orders WHERE reference = ?`).get(reference);

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Update order to "paid"
    const updateStmt = db.prepare(`
      UPDATE orders 
      SET status = 'paid', paid_at = CURRENT_TIMESTAMP 
      WHERE reference = ?
    `);
    updateStmt.run(reference);

    console.log(`💰 Order PAID: ${order.order_number}`);

    // Parse items back to array for email
    order.items = JSON.parse(order.items);

    // Send emails only once
    if (!order.email_sent) {
      try {
        // Send both emails in parallel for speed
        await Promise.all([
          sendThankYouEmail(order),
          sendAdminNotification(order),
        ]);

        db.prepare(`UPDATE orders SET email_sent = 1 WHERE reference = ?`).run(reference);
        console.log(`📧 Emails sent for ${order.order_number}`);
      } catch (emailError) {
        console.error('❌ Email failed:', emailError.message);
        // Don't fail the payment if email fails
      }
    }

    res.json({ status: 'success', data: response.data.data, order_number: order.order_number });
  } catch (error) {
    console.error("Verify error:", error.message);
    res.status(500).json({ error: 'Verification failed' });
  }
});

// === Get All Orders (Admin) ===
app.get('/api/orders', (req, res) => {
  const orders = db.prepare(`SELECT * FROM orders ORDER BY created_at DESC`).all();
  const formatted = orders.map(order => ({
    ...order,
    items: JSON.parse(order.items),
  }));
  res.json(formatted);
});

// === Get Single Order ===
app.get('/api/orders/:orderNumber', (req, res) => {
  const order = db.prepare(`SELECT * FROM orders WHERE order_number = ?`).get(req.params.orderNumber);
  if (!order) return res.status(404).json({ error: 'Order not found' });
  order.items = JSON.parse(order.items);
  res.json(order);
});

// === Update Order Status (Admin: pending → paid → shipped → delivered) ===
app.patch('/api/orders/:orderNumber/status', (req, res) => {
  const { status } = req.body;
  const validStatuses = ['pending', 'paid', 'shipped', 'delivered', 'cancelled'];
  
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ error: 'Invalid status' });
  }

  const result = db.prepare(`UPDATE orders SET status = ? WHERE order_number = ?`).run(status, req.params.orderNumber);
  
  if (result.changes === 0) {
    return res.status(404).json({ error: 'Order not found' });
  }

  console.log(`📦 Order ${req.params.orderNumber} → ${status}`);
  res.json({ success: true, status });
});

const PORT = process.env.PORT || 5000;;
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));