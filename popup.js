let ws;

document.addEventListener('DOMContentLoaded', () => {
  const urlInput = document.getElementById('worker-url');
  const tokenInput = document.getElementById('token');
  const saveBtn = document.getElementById('save-btn');
  const chatDiv = document.getElementById('chat');
  const msgInput = document.getElementById('msg-input');
  const sendBtn = document.getElementById('send-btn');

  // Load saved config
  chrome.storage.local.get(['workerUrl', 'token'], (result) => {
    if (result.workerUrl) urlInput.value = result.workerUrl;
    if (result.token) tokenInput.value = result.token;
  });

  saveBtn.addEventListener('click', () => {
    const workerUrl = urlInput.value.replace(/\/$/, '');
    const token = tokenInput.value;
    chrome.storage.local.set({ workerUrl, token });
    connect(workerUrl, token);
  });

  sendBtn.addEventListener('click', sendMessage);
  msgInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') sendMessage();
  });

  function connect(url, token) {
    if (ws) ws.close();
    
    // Convert https to wss
    const wsUrl = url.replace('https://', 'wss://').replace('http://', 'ws://') + '/?token=' + token;
    
    appendMsg('System', 'Connecting to ' + wsUrl);
    
    ws = new WebSocket(wsUrl);
    
    ws.onopen = () => {
      appendMsg('System', 'Connected!');
    };
    
    ws.onmessage = (event) => {
      appendMsg('Bot', event.data);
    };
    
    ws.onclose = () => {
      appendMsg('System', 'Disconnected');
    };
    
    ws.onerror = (err) => {
      appendMsg('System', 'Error: ' + err);
    };
  }

  function sendMessage() {
    const text = msgInput.value;
    if (!text || !ws) return;
    
    // OpenClaw protocol likely expects JSON. Let's try sending raw text first, 
    // or a simple JSON object if we knew the schema.
    // Based on Moltbot, it usually accepts: { type: 'message', text: '...' } or just text.
    // Let's try raw text first as per src/index.ts logs implying pass-through.
    ws.send(text);
    
    appendMsg('Me', text);
    msgInput.value = '';
  }

  function appendMsg(sender, text) {
    const div = document.createElement('div');
    div.className = 'msg ' + (sender === 'Me' ? 'me' : 'bot');
    div.textContent = `${sender}: ${text}`;
    chatDiv.appendChild(div);
    chatDiv.scrollTop = chatDiv.scrollHeight;
  }
});