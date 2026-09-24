const nodemailer = require('nodemailer');
require('dotenv').config();

// Create the transporter once and reuse it
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// === 1. Customer Thank You Email ===
async function sendThankYouEmail(order) {
  const itemsHtml = order.items.map(item => `
    <tr>
      <td style="padding: 12px; border-bottom: 1px solid #E2E8F0;">
        <strong>${item.name}</strong>
      </td>
      <td style="padding: 12px; border-bottom: 1px solid #E2E8F0; text-align: center;">
        ${item.quantity}
      </td>
      <td style="padding: 12px; border-bottom: 1px solid #E2E8F0; text-align: right;">
        ₦${(item.price * item.quantity).toLocaleString()}
      </td>
    </tr>
  `).join('');

  const mailOptions = {
    from: `"${process.env.EMAIL_FROM_NAME}" <${process.env.EMAIL_USER}>`,
    to: order.customer_email,
    subject: `🎉 Order Confirmed - ${order.order_number}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #F8F9FA;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #FFFFFF;">
          
          <!-- Header -->
          <div style="background-color: #2563EB; padding: 40px 30px; text-align: center;">
            <h1 style="color: #FFFFFF; margin: 0; font-size: 32px; font-weight: 800;">
              Hallo<span style="color: #93C5FD;">Stores</span>
            </h1>
            <p style="color: #DBEAFE; margin: 8px 0 0 0; font-size: 14px;">Thank you for your order!</p>
          </div>

          <!-- Greeting -->
          <div style="padding: 40px 30px 20px;">
            <h2 style="color: #0F172A; margin: 0 0 12px 0; font-size: 22px;">
              Hi ${order.customer_name.split(' ')[0]}, 🎉
            </h2>
            <p style="color: #475569; line-height: 1.6; margin: 0;">
              Your payment was successful and your order is now being processed. 
              We'll notify you once it ships!
            </p>
          </div>

          <!-- Order Details -->
          <div style="padding: 0 30px 20px;">
            <div style="background-color: #F1F5F9; padding: 16px; border-radius: 8px; margin-bottom: 20px;">
              <table style="width: 100%; font-size: 14px;">
                <tr>
                  <td style="color: #64748B; padding: 4px 0;">Order Number:</td>
                  <td style="color: #0F172A; font-weight: 600; text-align: right;">${order.order_number}</td>
                </tr>
                <tr>
                  <td style="color: #64748B; padding: 4px 0;">Order Date:</td>
                  <td style="color: #0F172A; font-weight: 600; text-align: right;">
                    ${new Date(order.created_at).toLocaleDateString('en-NG', { 
                      year: 'numeric', month: 'long', day: 'numeric' 
                    })}
                  </td>
                </tr>
                <tr>
                  <td style="color: #64748B; padding: 4px 0;">Payment Status:</td>
                  <td style="text-align: right;">
                    <span style="background-color: #DCFCE7; color: #16A34A; padding: 4px 10px; border-radius: 12px; font-size: 12px; font-weight: 600;">
                      ✓ PAID
                    </span>
                  </td>
                </tr>
              </table>
            </div>
          </div>

          <!-- Items Table -->
          <div style="padding: 0 30px 20px;">
            <h3 style="color: #0F172A; font-size: 16px; margin: 0 0 12px 0;">Order Items</h3>
            <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
              <thead>
                <tr style="background-color: #F8F9FA;">
                  <th style="padding: 12px; text-align: left; color: #64748B; font-weight: 600; font-size: 12px; text-transform: uppercase;">Product</th>
                  <th style="padding: 12px; text-align: center; color: #64748B; font-weight: 600; font-size: 12px; text-transform: uppercase;">Qty</th>
                  <th style="padding: 12px; text-align: right; color: #64748B; font-weight: 600; font-size: 12px; text-transform: uppercase;">Total</th>
                </tr>
              </thead>
              <tbody>
                ${itemsHtml}
              </tbody>
            </table>
          </div>

          <!-- Total -->
          <div style="padding: 0 30px 30px;">
            <div style="background-color: #EFF6FF; padding: 20px; border-radius: 8px;">
              <table style="width: 100%; font-size: 16px;">
                <tr>
                  <td style="color: #2563EB; font-weight: 700;">Total Paid:</td>
                  <td style="color: #2563EB; font-weight: 700; text-align: right; font-size: 20px;">
                    ₦${order.total.toLocaleString()}
                  </td>
                </tr>
              </table>
            </div>
          </div>

          <!-- Delivery Address -->
          <div style="padding: 0 30px 30px;">
            <h3 style="color: #0F172A; font-size: 16px; margin: 0 0 8px 0;">Delivery Address</h3>
            <p style="color: #475569; line-height: 1.6; margin: 0; font-size: 14px;">
              ${order.customer_name}<br>
              ${order.customer_address}<br>
              📞 ${order.customer_phone}
            </p>
          </div>

          <!-- Footer -->
          <div style="background-color: #0F172A; padding: 30px; text-align: center;">
            <p style="color: #94A3B8; font-size: 13px; margin: 0 0 8px 0;">
              Need help? Reply to this email or contact us at
            </p>
            <p style="color: #60A5FA; font-size: 13px; margin: 0 0 16px 0;">
              ${process.env.EMAIL_USER}
            </p>
            <p style="color: #475569; font-size: 12px; margin: 0;">
              © ${new Date().getFullYear()} Hallo Stores. All rights reserved.
            </p>
          </div>

        </div>
      </body>
      </html>
    `,
  };

  return transporter.sendMail(mailOptions);
}

// === 2. Admin Notification Email ===
async function sendAdminNotification(order) {
  const itemsList = order.items
    .map(item => `• ${item.name} × ${item.quantity} — ₦${(item.price * item.quantity).toLocaleString()}`)
    .join('<br>');

  const mailOptions = {
    from: `"${process.env.EMAIL_FROM_NAME}" <${process.env.EMAIL_USER}>`,
    to: process.env.ADMIN_EMAIL,
    subject: `💰 New Sale! ${order.order_number} — ₦${order.total.toLocaleString()}`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #16A34A;">💰 New Order Received!</h2>
        <table style="width: 100%; border-collapse: collapse; margin-top: 16px;">
          <tr><td style="padding: 8px; color: #64748B;">Order #:</td><td style="padding: 8px; font-weight: bold;">${order.order_number}</td></tr>
          <tr><td style="padding: 8px; color: #64748B;">Customer:</td><td style="padding: 8px; font-weight: bold;">${order.customer_name}</td></tr>
          <tr><td style="padding: 8px; color: #64748B;">Email:</td><td style="padding: 8px;">${order.customer_email}</td></tr>
          <tr><td style="padding: 8px; color: #64748B;">Phone:</td><td style="padding: 8px;">${order.customer_phone}</td></tr>
          <tr><td style="padding: 8px; color: #64748B;">Address:</td><td style="padding: 8px;">${order.customer_address}</td></tr>
          <tr><td style="padding: 8px; color: #64748B;">Total:</td><td style="padding: 8px; font-weight: bold; color: #16A34A;">₦${order.total.toLocaleString()}</td></tr>
        </table>
        <h3 style="margin-top: 24px;">Items:</h3>
        <p style="line-height: 1.8;">${itemsList}</p>
      </div>
    `,
  };

  return transporter.sendMail(mailOptions);
}

module.exports = { sendThankYouEmail, sendAdminNotification };