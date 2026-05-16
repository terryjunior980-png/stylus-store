const axios = require('axios');

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;

async function sendTelegramAlert(order) {
  const { reference, customer, items, total, address } = order;

  const itemsList = items.map(item =>
    `  • ${item.name} (${item.size}, ${item.color}) x${item.quantity} — ₦${(item.price * item.quantity).toLocaleString()}`
  ).join('\n');

  const message = `
🛍️ *NEW STYLUS ORDER!*

📦 *Order Ref:* \`${reference}\`
💰 *Total:* ₦${total.toLocaleString()}

👤 *Customer Details:*
  Name: ${customer.name}
  Email: ${customer.email}
  Phone: ${customer.phone}

📍 *Delivery Address:*
  ${address.street}
  ${address.city}, ${address.state}
  ${address.country}

🧾 *Items Ordered:*
${itemsList}

✅ *Payment: CONFIRMED via Paystack*
  `.trim();

  try {
    await axios.post(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
      chat_id: TELEGRAM_CHAT_ID,
      text: message,
      parse_mode: 'Markdown'
    });
    console.log('✅ Telegram alert sent for order:', reference);
  } catch (err) {
    console.error('❌ Telegram alert failed:', err.response?.data || err.message);
  }
}

module.exports = { sendTelegramAlert };
