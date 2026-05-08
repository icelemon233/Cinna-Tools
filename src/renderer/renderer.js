// ============================================
// Cinna Tools - Renderer (Chat Logic)
// ============================================

let models = [];
let currentConfig = {
  modelId: null,
  model: null,
  baseUrl: null,
  apiKey: null,
  chatName: null,
};
let conversationHistory = []; // 多轮对话历史
let isGenerating = false;

// ============================================
// Init
// ============================================

document.addEventListener('DOMContentLoaded', async () => {
  models = await window.electronAPI.getModels();
  populateModelSelect();
  await loadSavedConfig();
  bindEvents();
});

// ============================================
// Model Select
// ============================================

function populateModelSelect() {
  const select = document.getElementById('modelSelect');
  models.forEach((m) => {
    const opt = document.createElement('option');
    opt.value = m.id;
    opt.textContent = m.name;
    select.appendChild(opt);
  });
}

document.getElementById('modelSelect').addEventListener('change', (e) => {
  const model = models.find((m) => m.id === e.target.value);
  const customUrlGroup = document.getElementById('customUrlGroup');
  const customModelGroup = document.getElementById('customModelGroup');

  if (model && model.requiresUrl) {
    customUrlGroup.classList.remove('hidden');
    customModelGroup.classList.remove('hidden');
  } else {
    customUrlGroup.classList.add('hidden');
    customModelGroup.classList.add('hidden');
  }
});

// ============================================
// Settings Panel
// ============================================

document.getElementById('btnSettings').addEventListener('click', () => {
  document.getElementById('settingsPanel').classList.remove('hidden');
});

document.getElementById('btnCloseSettings').addEventListener('click', () => {
  document.getElementById('settingsPanel').classList.add('hidden');
});

document.getElementById('btnOpenSettings').addEventListener('click', () => {
  document.getElementById('settingsPanel').classList.remove('hidden');
});

// ============================================
// API Key visibility toggle
// ============================================

document.getElementById('btnTogglePwd').addEventListener('click', () => {
  const input = document.getElementById('apiKeyInput');
  input.type = input.type === 'password' ? 'text' : 'password';
});

// ============================================
// Start Chat
// ============================================

document.getElementById('btnStartChat').addEventListener('click', async () => {
  const modelId = document.getElementById('modelSelect').value;
  const customBaseUrl = document.getElementById('customBaseUrl').value.trim();
  const customModelName = document.getElementById('customModelName').value.trim();
  const apiKey = document.getElementById('apiKeyInput').value.trim();
  const chatName = document.getElementById('chatNameInput').value.trim();

  if (!modelId) {
    showToast('请先选择一个模型', 'error');
    return;
  }

  if (!apiKey) {
    showToast('请输入 API Key', 'error');
    return;
  }

  const model = models.find((m) => m.id === modelId);
  let baseUrl = model.baseUrl;
  let modelName = model.model;

  if (modelId === 'custom') {
    if (!customBaseUrl) {
      showToast('请输入 API 地址', 'error');
      return;
    }
    if (!customModelName) {
      showToast('请输入模型名称', 'error');
      return;
    }
    baseUrl = customBaseUrl.replace(/\/$/, '');
    modelName = customModelName;
  }

  currentConfig = { modelId, model: modelName, baseUrl, apiKey, chatName };
  conversationHistory = [];

  await window.electronAPI.storeSet('config', currentConfig);

  // 开始聊天
  startChat();
});

// ============================================
// Load saved config
// ============================================

async function loadSavedConfig() {
  const config = await window.electronAPI.storeGet('config');
  if (config && config.modelId) {
    currentConfig = config;
    document.getElementById('modelSelect').value = config.modelId;
    if (config.modelId === 'custom') {
      document.getElementById('customUrlGroup').classList.remove('hidden');
      document.getElementById('customModelGroup').classList.remove('hidden');
      document.getElementById('customBaseUrl').value = config.baseUrl || '';
      document.getElementById('customModelName').value = config.model || '';
    }
    document.getElementById('apiKeyInput').value = config.apiKey || '';
    document.getElementById('chatNameInput').value = config.chatName || '';
    document.getElementById('currentModelName').textContent =
      models.find((m) => m.id === config.modelId)?.name || config.modelId;

    // 如果已有完整配置，直接进入聊天界面
    if (config.apiKey && config.model && config.baseUrl) {
      conversationHistory = [];
      startChat();
    }
  }
}

// ============================================
// Start Chat UI
// ============================================

function startChat() {
  document.getElementById('settingsPanel').classList.add('hidden');
  document.getElementById('welcomePage').style.display = 'none';
  document.getElementById('messages').style.display = 'flex';
  document.getElementById('inputArea').style.display = 'block';

  // 更新侧边栏模型名
  const model = models.find((m) => m.id === currentConfig.modelId);
  document.getElementById('currentModelName').textContent = model?.name || currentConfig.model;

  showToast(`已加载模型: ${currentConfig.model}`, 'success');

  // 如果有历史消息，恢复显示
  if (conversationHistory.length > 0) {
    renderAllMessages();
  }

  document.getElementById('chatInput').focus();
}

// ============================================
// New Chat
// ============================================

document.getElementById('btnNewChat').addEventListener('click', () => {
  conversationHistory = [];
  document.getElementById('messages').innerHTML = '';
  document.getElementById('chatInput').value = '';
  document.getElementById('chatInput').focus();
  showToast('新对话已创建 ✨', 'success');
});

// ============================================
// Send Message
// ============================================

document.getElementById('btnSend').addEventListener('click', sendMessage);
document.getElementById('chatInput').addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    sendMessage();
  }
});

// Auto-resize textarea
document.getElementById('chatInput').addEventListener('input', function () {
  this.style.height = 'auto';
  this.style.height = Math.min(this.scrollHeight, 120) + 'px';
});

async function sendMessage() {
  if (isGenerating) return;

  const input = document.getElementById('chatInput');
  const text = input.value.trim();
  if (!text) return;

  // 添加用户消息
  conversationHistory.push({ role: 'user', content: text });
  appendMessage('user', text);
  input.value = '';
  input.style.height = 'auto';

  // 调用 AI
  isGenerating = true;
  setSendButtonState(true);
  scrollToBottom();

  const botMsgEl = appendMessage('bot', '', true); // placeholder

  try {
    const reply = await callAI(text, botMsgEl);
    conversationHistory.push({ role: 'assistant', content: reply });
    updateMessage(botMsgEl, reply);
  } catch (err) {
    updateMessage(botMsgEl, `⚠️ 请求失败: ${err.message}`, true);
  } finally {
    isGenerating = false;
    setSendButtonState(false);
    scrollToBottom();
  }
}

// ============================================
// Call AI API
// ============================================

async function callAI(userMessage, botMsgEl) {
  const { modelId, model: modelName, baseUrl, apiKey } = currentConfig;

  if (modelId === 'claude-3-5-sonnet') {
    return await callClaude({ baseUrl, apiKey, modelName, userMessage });
  } else if (modelId === 'gemini-2-flash') {
    return await callGemini({ baseUrl, apiKey, modelName, userMessage });
  } else {
    return await callOpenAICompatible({ baseUrl, apiKey, modelName, userMessage });
  }
}

// OpenAI 兼容接口
async function callOpenAICompatible({ baseUrl, apiKey, modelName, userMessage }) {
  const messages = conversationHistory.map((m) => ({
    role: m.role,
    content: m.content,
  }));

  const res = await fetch(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({ model: modelName, messages }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || `HTTP ${res.status}`);
  }

  const data = await res.json();
  return data.choices[0].message.content;
}

// Anthropic Claude
async function callClaude({ baseUrl, apiKey, modelName, userMessage }) {
  // Claude 用自己的 API 格式
  const messages = conversationHistory.map((m) => ({
    role: m.role === 'assistant' ? 'assistant' : 'user',
    content: m.content,
  }));

  const res = await fetch(`${baseUrl}/messages`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model: modelName,
      messages,
      max_tokens: 4096,
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || `HTTP ${res.status}`);
  }

  const data = await res.json();
  return data.content[0].text;
}

// Google Gemini
async function callGemini({ baseUrl, apiKey, modelName, userMessage }) {
  // Gemini 用 REST API
  const contents = conversationHistory.map((m) => ({
    role: m.role === 'model' ? 'model' : 'user',
    parts: [{ text: m.content }],
  }));

  const url = `${baseUrl}/models/${modelName}:generateContent?key=${apiKey}`;

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ contents }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || `HTTP ${res.status}`);
  }

  const data = await res.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text || '（无回复）';
}

// ============================================
// Message Rendering
// ============================================

function appendMessage(role, content, isError = false) {
  const container = document.getElementById('messages');
  const div = document.createElement('div');
  div.className = `message ${role}${isError ? ' error' : ''}`;

  const avatarText = role === 'user' ? 'U' : 'C';
  div.innerHTML = `
    <div class="msg-avatar">${avatarText}</div>
    <div class="msg-content">${escapeHtml(content)}</div>
  `;

  if (role === 'bot' && isGenerating && !content) {
    // 显示 typing 动画
    div.querySelector('.msg-content').innerHTML = `
      <div class="typing-indicator">
        <span></span><span></span><span></span>
      </div>
    `;
  }

  container.appendChild(div);
  scrollToBottom();
  return div;
}

function updateMessage(el, content, isError = false) {
  const contentDiv = el.querySelector('.msg-content');
  contentDiv.innerHTML = escapeHtml(content);
  if (isError) el.classList.add('error');
  scrollToBottom();
}

function renderAllMessages() {
  const container = document.getElementById('messages');
  container.innerHTML = '';
  conversationHistory.forEach((m) => {
    if (m.role !== 'system') {
      appendMessage(m.role === 'assistant' ? 'bot' : 'user', m.content);
    }
  });
}

// ============================================
// Helpers
// ============================================

function setSendButtonState(disabled) {
  document.getElementById('btnSend').disabled = disabled;
}

function scrollToBottom() {
  const messages = document.getElementById('messages');
  messages.scrollTop = messages.scrollHeight;
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function showToast(msg, type = '') {
  const toast = document.getElementById('toast');
  toast.textContent = msg;
  toast.className = `toast ${type}`;
  toast.classList.remove('hidden');
  setTimeout(() => toast.classList.add('hidden'), 2500);
}

// ============================================
// Event Bindings
// ============================================

function bindEvents() {
  // nothing extra needed
}
