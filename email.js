const { Resend } = require('resend');
const resend = new Resend(process.env.RESEND_API_KEY);

async function sendOrderConfirmation(order) {
  const { reference, customer, items, total, address } = order;

  const itemsHTML = items.map(item => `
    <tr>
      <td style="padding:12px;border-bottom:1px solid #1a1a1a;font-family:'Helvetica Neue',sans-serif;font-size:14px;color:#888">${item.name}</td>
      <td style="padding:12px;border-bottom:1px solid #1a1a1a;font-family:'Helvetica Neue',sans-serif;font-size:14px;color:#888;text-align:center">${item.size} · ${item.color}</td>
      <td style="padding:12px;border-bottom:1px solid #1a1a1a;font-family:'Helvetica Neue',sans-serif;font-size:14px;color:#888;text-align:center">${item.quantity}</td>
      <td style="padding:12px;border-bottom:1px solid #1a1a1a;font-family:'Helvetica Neue',sans-serif;font-size:14px;color:#c9a84c;text-align:right">₦${(item.price * item.quantity).toLocaleString()}</td>
    </tr>
  `).join('');

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#000;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#000;padding:40px 20px">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%">

          <!-- HEADER -->
          <tr>
            <td style="background:#0a0a0a;border:1px solid #222;padding:40px;text-align:center;border-bottom:none">
              <div style="font-family:'Courier New',monospace;font-size:28px;font-weight:700;letter-spacing:0.3em;color:#c9a84c">STYLUS</div>
              <div style="font-family:'Courier New',monospace;font-size:10px;letter-spacing:0.3em;color:#555;margin-top:6px;text-transform:uppercase">Premium Clothing</div>
            </td>
          </tr>

          <!-- HERO -->
          <tr>
            <td style="background:#0a0a0a;border-left:1px solid #222;border-right:1px solid #222;padding:40px;text-align:center;border-bottom:1px solid #222">
              <div style="width:60px;height:60px;border:2px solid #c9a84c;border-radius:50%;margin:0 auto 20px;display:flex;align-items:center;justify-content:center;font-size:24px;line-height:60px;color:#c9a84c">✓</div>
              <h1 style="font-family:Georgia,serif;font-size:28px;font-weight:300;color:#fff;margin:0 0 10px;font-style:italic">Order Confirmed</h1>
              <p style="font-size:14px;color:#888;margin:0;line-height:1.6">Thank you for shopping with STYLUS, ${customer.name.split(' ')[0]}.<br>Your order is being processed.</p>
            </td>
          </tr>

          <!-- ORDER REF -->
          <tr>
            <td style="background:#111;border-left:1px solid #222;border-right:1px solid #222;padding:20px 40px;border-bottom:1px solid #222">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="font-family:'Courier New',monospace;font-size:10px;letter-spacing:0.2em;color:#555;text-transform:uppercase">Order Reference</td>
                  <td style="font-family:'Courier New',monospace;font-size:10px;letter-spacing:0.2em;color:#555;text-transform:uppercase;text-align:right">Status</td>
                </tr>
                <tr>
                  <td style="font-family:'Courier New',monospace;font-size:13px;color:#c9a84c;padding-top:6px">${reference}</td>
                  <td style="font-family:'Courier New',monospace;font-size:11px;color:#25d366;padding-top:6px;text-align:right;font-weight:700">✓ PAID</td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- ITEMS -->
          <tr>
            <td style="background:#0a0a0a;border-left:1px solid #222;border-right:1px solid #222;padding:30px 40px;border-bottom:1px solid #222">
              <div style="font-family:'Courier New',monospace;font-size:10px;letter-spacing:0.25em;color:#555;text-transform:uppercase;margin-bottom:15px">Items Ordered</div>
              <table width="100%" cellpadding="0" cellspacing="0">
                <thead>
                  <tr>
                    <th style="font-family:'Courier New',monospace;font-size:9px;letter-spacing:0.15em;color:#444;text-transform:uppercase;padding:8px 12px;text-align:left;border-bottom:1px solid #222">Product</th>
                    <th style="font-family:'Courier New',monospace;font-size:9px;letter-spacing:0.15em;color:#444;text-transform:uppercase;padding:8px 12px;text-align:center;border-bottom:1px solid #222">Details</th>
                    <th style="font-family:'Courier New',monospace;font-size:9px;letter-spacing:0.15em;color:#444;text-transform:uppercase;padding:8px 12px;text-align:center;border-bottom:1px solid #222">Qty</th>
                    <th style="font-family:'Courier New',monospace;font-size:9px;letter-spacing:0.15em;color:#444;text-transform:uppercase;padding:8px 12px;text-align:right;border-bottom:1px solid #222">Price</th>
                  </tr>
                </thead>
                <tbody>${itemsHTML}</tbody>
              </table>
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:15px">
                <tr>
                  <td style="font-family:'Courier New',monospace;font-size:12px;color:#fff;padding:12px;text-align:right;border-top:1px solid #333">Total: <span style="color:#c9a84c;font-size:16px">₦${total.toLocaleString()}</span></td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- DELIVERY -->
          <tr>
            <td style="background:#0a0a0a;border-left:1px solid #222;border-right:1px solid #222;padding:30px 40px;border-bottom:1px solid #222">
              <div style="font-family:'Courier New',monospace;font-size:10px;letter-spacing:0.25em;color:#555;text-transform:uppercase;margin-bottom:15px">Delivery Address</div>
              <p style="font-size:14px;color:#888;margin:0;line-height:1.8">
                ${address.street}<br>
                ${address.city}, ${address.state}<br>
                ${address.country}
              </p>
            </td>
          </tr>

          <!-- CONTACT -->
          <tr>
            <td style="background:#0a0a0a;border-left:1px solid #222;border-right:1px solid #222;padding:30px 40px;border-bottom:1px solid #222;text-align:center">
              <p style="font-size:13px;color:#888;margin:0 0 15px;line-height:1.6">Questions about your order? We're here.</p>
              <a href="https://wa.me/2348144548826?text=Hi+STYLUS+my+order+ref+is+${reference}" style="display:inline-block;padding:12px 30px;background:#25d366;color:#000;font-family:'Courier New',monospace;font-size:11px;letter-spacing:0.15em;text-transform:uppercase;text-decoration:none;font-weight:700">Chat on WhatsApp</a>
            </td>
          </tr>

          <!-- FOOTER -->
          <tr>
            <td style="background:#000;border:1px solid #222;border-top:none;padding:30px 40px;text-align:center">
              <div style="font-family:'Courier New',monospace;font-size:16px;font-weight:700;letter-spacing:0.3em;color:#333;margin-bottom:8px">STYLUS</div>
              <p style="font-size:11px;color:#444;margin:0;letter-spacing:0.05em">Elevated essentials for the modern wardrobe.</p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;

  try {
    await resend.emails.send({
      from: 'STYLUS <onboarding@resend.dev>',
      to: customer.email,
      subject: `Order Confirmed — ${reference} 🖤`,
      html
    });
    console.log('✅ Email receipt sent to:', customer.email);
  } catch (err) {
    console.error('❌ Email failed:', err.message);
  }
}

module.exports = { sendOrderConfirmation };
