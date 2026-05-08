const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const Store = require('electron-store');

const store = new Store();

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1100,
    height: 780,
    minWidth: 800,
    minHeight: 600,
    title: 'Cinna Tools',
    webPreferences: {
      preload: path.join(__dirname, '../preload/preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
    show: false,
  });

  mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
});

// 保存用户配置（模型 + API Key）
ipcMain.handle('store:set', (event, key, value) => {
  store.set(key, value);
  return true;
});

ipcMain.handle('store:get', (event, key) => {
  return store.get(key, null);
});

// 获取支持的模型列表
ipcMain.handle('get-models', () => {
  return [
    {
      id: 'gpt-4o',
      name: 'ChatGPT (OpenAI)',
      baseUrl: 'https://api.openai.com/v1',
      model: 'gpt-4o',
      requiresUrl: false,
    },
    {
      id: 'claude-3-5-sonnet',
      name: 'Claude (Anthropic)',
      baseUrl: 'https://api.anthropic.com/v1',
      model: 'claude-3-5-sonnet-20241022',
      requiresUrl: false,
    },
    {
      id: 'gemini-2-flash',
      name: 'Gemini (Google)',
      baseUrl: 'https://generativelanguage.googleapis.com/v1beta',
      model: 'gemini-2.0-flash',
      requiresUrl: false,
    },
    {
      id: 'glm-4-flash',
      name: 'GLM (智谱AI)',
      baseUrl: 'https://open.bigmodel.cn/api/paas/v4',
      model: 'glm-4-flash',
      requiresUrl: false,
    },
    {
      id: 'kimi-plus',
      name: 'Kimi (Moonshot)',
      baseUrl: 'https://api.moonshot.cn/v1',
      model: 'moonshot-v1-8k',
      requiresUrl: false,
    },
    {
      id: 'deepseek-chat',
      name: 'DeepSeek',
      baseUrl: 'https://api.deepseek.com/v1',
      model: 'deepseek-chat',
      requiresUrl: false,
    },
    {
      id: 'qwen-plus',
      name: '通义千问 (阿里云)',
      baseUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
      model: 'qwen-plus',
      requiresUrl: false,
    },
    {
      id: 'custom',
      name: '自定义 (OpenAI 兼容接口)',
      baseUrl: '',
      model: '',
      requiresUrl: true,
    },
  ];
});
