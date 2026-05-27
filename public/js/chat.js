'use strict';

let chatOpen = false;
let chatHistory = [];

const chatBtn = document.getElementById('chatbotBtn');
const chatWindow = document.getElementById('chatbotWindow');
const chatCloseBtn = document.getElementById('chatCloseBtn');
const chatInput = document.getElementById('chatInput');
const chatSendBtn = document.getElementById('chatSendBtn');
const chatMessages = document.getElementById('chatMessages');

chatBtn.addEventListener('click', function() {
  chatOpen = !chatOpen;
  chatWindow.style.display = chatOpen ? 'flex' : 'none';
  if (chatOpen) {
    chatWindow.style.flexDirection = 'column';
    chatInput.focus();
  }
});

chatCloseBtn.addEventListener('click', function() {
  chatOpen = false;
  chatWindow.style.display = 'none';
});

chatSendBtn.addEventListener('click', sendChatMessage);

chatInput.addEventListener('keydown', function(e) {
  if (e.key === 'Enter') sendChatMessage();
});

async function sendChatMessage() {
  const msg = chatInput.value.trim();
  if (!msg) return;
  chatInput.value = '';

  appendChatMessage(msg, 'user');
  chatHistory.push({ role: 'user', content: msg });

  const typing = appendTypingIndicator();

  try {
    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: chatHistory })
    });
    const data = await res.json();
    typing.remove();
    const reply = data.reply || "Contact us on WhatsApp: +2348144548826";
    appendChatMessage(reply, 'bot');
    chatHistory.push({ role: 'assistant', content: reply });
  } catch(e) {
    typing.remove();
    appendChatMessage('Contact us on WhatsApp: +2348144548826', 'bot');
  }
}

function appendChatMessage(text, role) {
  const div = document.createElement('div');
  div.style.cssText = role === 'user'
    ? 'background:#1a1a1a;border:1px solid #333;padding:0.75rem 1rem;font-size:0.8rem;color:#fff;line-height:1.6;max-width:85%;border-radius:8px 0 8px 8px;align-self:flex-end;margin-left:auto;white-space:pre-line;word-break:break-word'
    : 'background:#111;border:1px solid #222;padding:0.75rem 1rem;font-size:0.8rem;color:#ccc;line-height:1.6;max-width:85%;border-radius:0 8px 8px 8px;white-space:pre-line;word-break:break-word';
  div.textContent = text;
  chatMessages.appendChild(div);
  chatMessages.scrollTop = chatMessages.scrollHeight;
  return div;
}

function appendTypingIndicator() {
  const div = document.createElement('div');
  div.style.cssText = 'background:#111;border:1px solid #222;padding:0.75rem 1rem;font-size:0.8rem;color:#555;line-height:1.6;max-width:85%;border-radius:0 8px 8px 8px';
  div.textContent = 'Typing...';
  chatMessages.appendChild(div);
  chatMessages.scrollTop = chatMessages.scrollHeight;
  return div;
}
