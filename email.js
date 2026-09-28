const { Resend } = require('resend');
const { BrevoClient } = require('@getbrevo/brevo');
require('dotenv').config();

// Initialize Brevo for customer emails
const brevo = new BrevoClient({
  apiKey: process.env.BREVO_API_KEY,
});

// Initialize Resend for admin emails
const resend = new Resend(process.env.RESEND_API_KEY);

const BREVO_SENDER = {
  name: 'Hallo Stores',
  email: 'hallostoresglobal@gmail.com',
};

const RESEND_FROM_EMAIL = 'Hallo Stores <onboarding@resend.dev>';

// ============================================
// 1. Customer Thank You Email
// ============================================
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

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #F8F9FA;">
      <div style="max-width: 600px; margin: 0 auto; background-color: #FFFFFF;">
        
        <div style="background-color: #2563EB; padding: 40px 30px; text-align: center;">
          <h1 style="color: #FFFFFF; margin: 0; font-size: 32px; font-weight: 800;">
            Hallo<span style="color: #93C5FD;">Stores</span>
          </h1>
          <p style="color: #DBEAFE; margin: 8px 0 0 0; font-size: 14px;">Thank you for your order!</p>
        </div>

        <div style="padding: 40px 30px 20px;">
          <h2 style="color: #0F172A; margin: 0 0 12px 0; font-size: 22px;">
            Hi ${order.customer_name.split(' ')[0]}, 🎉
          </h2>
          <p style="color: #475569; line-height: 1.6; margin: 0;">
            Your payment was successful and your order is now being processed. 
            We'll notify you once it ships!
          </p>
        </div>

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

        <div style="padding: 0 30px 30px;">
          <h3 style="color: #0F172A; font-size: 16px; margin: 0 0 8px 0;">Delivery Address</h3>
          <p style="color: #475569; line-height: 1.6; margin: 0; font-size: 14px;">
            ${order.customer_name}<br>
            ${order.customer_address}<br>
            📞 ${order.customer_phone}
          </p>
        </div>

        <div style="padding: 0 30px 30px;">
          <p style="color: #475569; font-size: 14px; line-height: 1.6; margin: 0;">
            You can track your order anytime at:
            <br>
            <a href="https://hallo-stores-global.vercel.app/order/${order.order_number}" style="color: #2563EB; font-weight: 600;">
              hallo-stores-global.vercel.app/order/${order.order_number}
            </a>
          </p>
        </div>

        <div style="background-color: #0F172A; padding: 30px; text-align: center;">
          <p style="color: #94A3B8; font-size: 13px; margin: 0 0 8px 0;">
            Need help? Reply to this email or contact us at
          </p>
          <p style="color: #60A5FA; font-size: 13px; margin: 0 0 16px 0;">
            hallostoresglobal@gmail.com
          </p>
          <p style="color: #475569; font-size: 12px; margin: 0;">
            © ${new Date().getFullYear()} Hallo Stores. All rights reserved.
          </p>
        </div>

      </div>
    </body>
    </html>
  `;

  const result = await brevo.transactionalEmails.sendTransacEmail({
    subject: `🎉 Order Confirmed - ${order.order_number}`,
    htmlContent,
    sender: BREVO_SENDER,
    to: [{ email: order.customer_email, name: order.customer_name }],
  });
  console.log(`📧 Thank-you email sent to ${order.customer_email} (ID: ${result.messageId})`);
  return result;
}

// ============================================
// 2. Admin Notification Email
// ============================================
async function sendAdminNotification(order) {
  const itemsList = order.items
    .map(item => `• ${item.name} × ${item.quantity} — ₦${(item.price * item.quantity).toLocaleString()}`)
    .join('<br>');

  const html = `
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
  `;

  const { data, error } = await resend.emails.send({
    from: RESEND_FROM_EMAIL,
    to: process.env.ADMIN_EMAIL,
    subject: `💰 New Sale! ${order.order_number} — ₦${order.total.toLocaleString()}`,
    html,
  });
  if (error) throw error;
  const result = data;
  console.log(`📧 Admin notification sent to ${process.env.ADMIN_EMAIL}`);
  return result;
}

// ============================================
// 3. Order Shipped Email
// ============================================
async function sendShippedEmail(order) {
  const trackingInfo = order.tracking_number
    ? `<p style="color: #475569; font-size: 14px; line-height: 1.6; margin: 8px 0;">
         <strong>Tracking Number:</strong> ${order.tracking_number}
       </p>`
    : '';

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"></head>
    <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #F8F9FA;">
      <div style="max-width: 600px; margin: 0 auto; background-color: #FFFFFF;">
        <div style="background-color: #16A34A; padding: 40px 30px; text-align: center;">
          <h1 style="color: #FFFFFF; margin: 0; font-size: 28px; font-weight: 800;">
            📦 Your Order is On the Way!
          </h1>
          <p style="color: #DCFCE7; margin: 8px 0 0 0; font-size: 14px;">
            Order ${order.order_number}
          </p>
        </div>

        <div style="padding: 40px 30px;">
          <h2 style="color: #0F172A; margin: 0 0 12px 0; font-size: 22px;">
            Hi ${order.customer_name.split(' ')[0]},
          </h2>
          <p style="color: #475569; line-height: 1.7; margin: 0 0 20px 0;">
            Great news! Your order has been shipped and is on its way to you.
          </p>

          <div style="background-color: #F0FDF4; border-left: 4px solid #16A34A; padding: 16px; border-radius: 8px; margin-bottom: 24px;">
            <p style="color: #15803D; font-weight: 700; margin: 0; font-size: 14px;">
              🚚 Estimated Delivery
            </p>
            ${trackingInfo}
            <p style="color: #475569; font-size: 14px; line-height: 1.6; margin: 8px 0 0 0;">
              Your order will be delivered to: <br>
              <strong>${order.customer_address}</strong>
            </p>
          </div>

          <p style="color: #475569; font-size: 14px; line-height: 1.7; margin: 0 0 16px 0;">
            Track your order anytime at:
            <br>
            <a href="https://hallo-stores-global.vercel.app/order/${order.order_number}" style="color: #2563EB; font-weight: 600;">
              hallo-stores-global.vercel.app/order/${order.order_number}
            </a>
          </p>

          <p style="color: #475569; font-size: 14px; line-height: 1.7; margin: 0;">
            Thank you for shopping with Hallo Stores!
          </p>
        </div>

        <div style="background-color: #0F172A; padding: 30px; text-align: center;">
          <p style="color: #94A3B8; font-size: 13px; margin: 0 0 8px 0;">
            Questions? Reply to this email or contact us at
          </p>
          <p style="color: #60A5FA; font-size: 13px; margin: 0 0 16px 0;">
            hallostoresglobal@gmail.com
          </p>
          <p style="color: #475569; font-size: 12px; margin: 0;">
            © ${new Date().getFullYear()} Hallo Stores
          </p>
        </div>
      </div>
    </body>
    </html>
  `;

  const result = await brevo.transactionalEmails.sendTransacEmail({
    subject: `📦 Your order ${order.order_number} has been shipped!`,
    htmlContent,
    sender: BREVO_SENDER,
    to: [{ email: order.customer_email, name: order.customer_name }],
  });
  console.log(`📧 Shipped email sent to ${order.customer_email} (ID: ${result.messageId})`);
  return result;
}

module.exports = { sendThankYouEmail, sendAdminNotification, sendShippedEmail };