# Cinna Tools 🧡

> 轻量级 AI 聊天桌面工具，支持多模型接入

## 功能特性

- ✅ **多模型支持**：OpenAI (GPT) / Claude (Anthropic) / Gemini (Google) / GLM (智谱) / Kimi (Moonshot) / DeepSeek / 通义千问 / 自定义 OpenAI 兼容接口
- ✅ **多轮对话**：基于上下文连贯聊天
- ✅ **API Key 管理**：安全存储，一键切换模型
- ✅ **深色主题**：现代护眼界面
- ✅ **桌面应用**：Windows / macOS / Linux 原生 exe

## 模型支持

| 模型 | 提供商 |
|------|--------|
| GPT-4o | OpenAI |
| Claude 3.5 Sonnet | Anthropic |
| Gemini 2.0 Flash | Google |
| GLM-4-Flash | 智谱 AI |
| moonshot-v1-8k | Moonshot (Kimi) |
| DeepSeek Chat | DeepSeek |
| Qwen Plus | 阿里云通义 |
| 自定义 | 任意 OpenAI 兼容接口 |

## 安装运行

### 环境要求

- Node.js >= 18
- npm

### 安装依赖

```bash
cd Cinna-Tools
npm install
```

### 开发运行

```bash
npm start
```

### 打包为 exe

```bash
# Windows
npm run build:win

# macOS
npm run build:mac

# Linux
npm run build:linux
```

打包后的文件在 `dist/` 目录下。

## 使用方法

1. 首次打开，点击左下角 **⚙️ 设置**
2. 选择模型，粘贴 **API Key**
3. 点击 **🚀 开始聊天** 即可
4. 支持多轮对话，对话历史自动保存

## 获取 API Key

- **OpenAI**：https://platform.openai.com/api-keys
- **Anthropic**：https://console.anthropic.com/settings/keys
- **Google Gemini**：https://aistudio.google.com/app/apikey
- **智谱 GLM**：https://open.bigmodel.cn/usercenter/apikeys
- **Moonshot (Kimi)**：https://platform.moonshot.cn/console/api-keys
- **DeepSeek**：https://platform.deepseek.com/api_keys
- **阿里云通义**：https://dashscope.console.aliyun.com/apiKey

## 技术栈

- **Electron** 28
- **electron-store** (配置持久化)
- **electron-builder** (打包)

## 目录结构

```
Cinna-Tools/
├── src/
│   ├── main/         # 主进程 (main.js)
│   ├── preload/      # 预加载脚本 (preload.js)
│   └── renderer/     # 渲染进程 (HTML/CSS/JS)
├── assets/           # 应用图标
├── dist/             # 打包输出目录
├── package.json
└── README.md
```

## License

MIT
