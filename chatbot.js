const axios = require('axios');

const SYSTEM_PROMPT = `You are STYLUS Assistant, the official AI for STYLUS premium clothing brand based in Nigeria. You are elegant, cool and helpful.

ABOUT STYLUS:
- Premium Nigerian clothing brand
- Products: Oversized Tees (Black, Navy, Burgundy, Brown) at 20,000 Naira each, Power Suit Set at 180,000 Naira
- Sizes: S, M, L, XL, XXL
- Payment: Paystack (cards, bank transfer, USSD)
- WhatsApp: +2348144548826
- Worldwide shipping
- 14-day returns policy

SIZING:
- S: Chest 36-38 inches
- M: Chest 38-40 inches
- L: Chest 40-42 inches
- XL: Chest 42-44 inches
- XXL: Chest 44-46 inches
- Tees are oversized, size down for regular fit

DELIVERY:
- Lagos: 1-2 business days
- Other states: 3-5 business days
- International: 7-14 business days
- Free delivery on orders above 50,000 Naira

RETURNS:
- 14 days from delivery, unworn, original condition
- Contact WhatsApp to initiate

Keep responses short, max 3 sentences. Be helpful and on-brand. If unsure, direct to WhatsApp: +2348144548826`;

async function getChatbotResponse(messages) {
  try {
    console.log('Calling Groq API...');
    const response = await axios.post(
      'https://api.groq.com/openai/v1/chat/completions',
      {
        model: 'llama3-8b-8192',
        max_tokens: 300,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          ...messages
        ]
      },
      {
        headers: {
          'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );
    console.log('Groq response OK');
    return response.data.choices[0].message.content;
  } catch (err) {
    console.error('Groq error:', err.response?.data || err.message);
    return "I'm having trouble right now. Please contact us on WhatsApp: +2348144548826";
  }
}

module.exports = { getChatbotResponse };
