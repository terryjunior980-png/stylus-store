var chatOpen = false;
var chatHistory = [];

document.addEventListener('DOMContentLoaded', function() {
  var chatBtn = document.getElementById('chatbotBtn');
  var chatWindow = document.getElementById('chatbotWindow');
  var chatCloseBtn = document.getElementById('chatCloseBtn');
  var chatInput = document.getElementById('chatInput');
  var chatSendBtn = document.getElementById('chatSendBtn');

  if (!chatBtn) { console.error('Chat button not found'); return; }

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
});

function sendChatMessage() {
  var chatInput = document.getElementById('chatInput');
  var msg = chatInput.value.trim();
  if (!msg) return;
  chatInput.value = '';

  appendChatMessage(msg, 'user');
  chatHistory.push({ role: 'user', content: msg });

  var typing = appendTypingIndicator();

  fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages: chatHistory })
  })
  .then(function(res) {
    console.log('Chat response status:', res.status);
    return res.json();
  })
  .then(function(data) {
    console.log('Chat response:', data);
    typing.remove();
    var reply = data.reply || 'Contact us on WhatsApp: +2348144548826';
    appendChatMessage(reply, 'bot');
    chatHistory.push({ role: 'assistant', content: reply });
  })
  .catch(function(e) {
    console.error('Chat error:', e);
    typing.remove();
    appendChatMessage('Contact us on WhatsApp: +2348144548826', 'bot');
  });
}

function appendChatMessage(text, role) {
  var container = document.getElementById('chatMessages');
  var div = document.createElement('div');
  div.style.cssText = role === 'user'
    ? 'background:#1a1a1a;border:1px solid #333;padding:0.75rem 1rem;font-size:0.8rem;color:#fff;line-height:1.6;max-width:85%;border-radius:8px 0 8px 8px;align-self:flex-end;margin-left:auto;white-space:pre-line;word-break:break-word'
    : 'background:#111;border:1px solid #222;padding:0.75rem 1rem;font-size:0.8rem;color:#ccc;line-height:1.6;max-width:85%;border-radius:0 8px 8px 8px;white-space:pre-line;word-break:break-word';
  div.textContent = text;
  container.appendChild(div);
  container.scrollTop = container.scrollHeight;
  return div;
}

function appendTypingIndicator() {
  var container = document.getElementById('chatMessages');
  var div = document.createElement('div');
  div.style.cssText = 'background:#111;border:1px solid #222;padding:0.75rem 1rem;font-size:0.8rem;color:#555;max-width:85%;border-radius:0 8px 8px 8px';
  div.textContent = 'Typing...';
  container.appendChild(div);
  container.scrollTop = container.scrollHeight;
  return div;
}
