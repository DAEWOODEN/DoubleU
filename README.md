# ComChatX - 智能留学文书创作平台

> 基于 **Multi-Agent 架构**的 AI 驱动个人陈述生成系统

[![Python](https://img.shields.io/badge/Python-3.10+-blue.svg)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115+-green.svg)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/React-18.3+-61dafb.svg)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue.svg)](https://www.typescriptlang.org/)

## 🎯 产品定位

ComChatX 是一个创新的留学文书创作平台,通过 **Multi-Agent AI 系统**帮助学生:

- 📝 **想法收集**: 随时记录零散灵感,极简优雅的"想法球"交互
- 🤔 **思维引导**: AI 主动提问深挖潜力,Socratic 式追问
- 📖 **叙事架构**: 构建完整自我认知框架,可视化成长轨迹
- ✍️ **文书创作**: 多学校差异化生成,专业级个人陈述
- 🌱 **长期陪伴**: 持续迭代优化,记录成长时刻

## 🏗️ 技术架构

### 整体架构

```
┌─────────────────────────────────────────────────────┐
│                  Frontend (React)                    │
│  ├─ IdeaBubbles (想法收集)                           │
│  ├─ ChatSidebar (AI 对话)                           │
│  ├─ TimelineView (叙事时间线)                        │
│  ├─ DocumentWorkspace (文书编辑)                     │
│  └─ InsightsPanel (智能洞察)                         │
└─────────────────┬───────────────────────────────────┘
                  │ REST API / SSE
┌─────────────────▼───────────────────────────────────┐
│            Backend (FastAPI + AutoGen)               │
│  ┌──────────────────────────────────────────────┐  │
│  │         Multi-Agent System                    │  │
│  │  ┌────────────────────────────────────────┐  │  │
│  │  │  Global Supervisor Agent               │  │  │
│  │  │  ├─ Collector SubAgent (收集)          │  │  │
│  │  │  ├─ Analyzer SubAgent (分析)           │  │  │
│  │  │  ├─ Guide SubAgent (引导)              │  │  │
│  │  │  ├─ Query SubAgent (质疑)              │  │  │
│  │  │  ├─ Narrator SubAgent (叙事)           │  │  │
│  │  │  ├─ Writer SubAgent (写作)             │  │  │
│  │  │  ├─ Audit SubAgent (审核)              │  │  │
│  │  │  └─ Dynamic Major Agents (专业)        │  │  │
│  │  └────────────────────────────────────────┘  │  │
│  └──────────────────────────────────────────────┘  │
└─────────────────┬───────────────────────────────────┘
                  │
┌─────────────────▼───────────────────────────────────┐
│              AI Service Layer                        │
│  ├─ DeepSeek-V3 (主力对话和写作)                    │
│  └─ MiniMax-M2 (辅助分析)                           │
└──────────────────────────────────────────────────────┘
```

### 核心技术栈

**前端**
- React 18.3 + TypeScript
- Vite (构建工具)
- Motion (动画库)
- Radix UI (组件库)
- TailwindCSS (样式)

**后端**
- FastAPI (Web 框架)
- AutoGen (Multi-Agent 框架)
- SQLAlchemy (ORM)
- DeepSeek API (主 LLM)
- MiniMax API (辅助 LLM)

## 🚀 快速开始

### 前置要求

- **Node.js**: 16+ (推荐 18+)
- **Python**: 3.10+
- **包管理器**: npm/yarn/pnpm

### 1. 克隆项目

```bash
git clone <repository-url>
cd ComChatX
```

### 2. 启动后端

```bash
cd backend

# 安装依赖
pip install -r requirements.txt

# 启动服务器 (已配置 API 密钥)
python main.py

# 或使用启动脚本
# macOS/Linux:
chmod +x start.sh
./start.sh

# Windows:
start.bat
```

后端将在 `http://localhost:8000` 启动

**API 文档**: http://localhost:8000/docs

### 3. 启动前端

```bash
cd frontend

# 安装依赖
npm install

# 启动开发服务器
npm run dev
```

前端将在 `http://localhost:5173` 启动

### 4. 访问应用

打开浏览器访问: **http://localhost:5173**

## 📁 项目结构

```
ComChatX/
├── frontend/                  # React 前端
│   ├── src/
│   │   ├── components/       # UI 组件
│   │   │   ├── IdeaBubbles.tsx      # 想法球交互
│   │   │   ├── ChatSidebar.tsx      # AI 对话
│   │   │   ├── TimelineView.tsx     # 叙事时间线
│   │   │   ├── DocumentWorkspace.tsx # 文书编辑
│   │   │   └── ui/                  # 基础组件
│   │   ├── services/
│   │   │   └── api.ts               # API 客户端
│   │   └── App.tsx                  # 主应用
│   ├── package.json
│   └── vite.config.ts
│
├── backend/                   # FastAPI 后端
│   ├── agents/               # Multi-Agent 系统
│   │   ├── agent_system.py  # Agent 编排核心
│   │   └── prompts.py       # Agent 提示词
│   ├── api/                  # API 路由
│   │   ├── chat.py          # 对话 API
│   │   ├── essay.py         # 文书 API
│   │   ├── ideas.py         # 想法 API
│   │   ├── narrative.py     # 叙事 API
│   │   ├── profile.py       # 用户 API
│   │   └── insights.py      # 洞察 API
│   ├── database.py           # 数据库模型
│   ├── llm_clients.py        # LLM 客户端
│   ├── config.py             # 配置管理
│   ├── main.py               # 应用入口
│   └── requirements.txt      # Python 依赖
│
├── Mutiagent.txt             # Multi-Agent 设计文档
└── README.md                 # 项目说明
```

## 🤖 Multi-Agent 系统详解

### Agent 角色与职责

| Agent | 职责 | 触发时机 |
|-------|------|---------|
| **Global Supervisor** | 总调度,维护对话上下文 | 所有交互 |
| **Collector** | 收集并分类用户想法 | 接收用户输入 |
| **Analyzer** | 深度分析想法主题和关联 | 每 5 个想法 |
| **Guide** | 生成引导性问题 | 分析后 |
| **Query** | Socratic 式质疑追问 | 用户请求 |
| **Narrator** | 构建叙事框架 | 生成时间线 |
| **Writer** | 撰写个人陈述 | 生成文书 |
| **Audit** | 质量审核和反馈 | 文书完成后 |
| **Major Agents** | 专业领域审核 | 动态创建 |

### 工作流程示例

**1. 想法收集 → 深入对话**
```
用户: "我在山区支教的经历很有意义"
  ↓
Collector: 提取关键信息(支教、山区、意义)
  ↓
Analyzer: 识别主题(教育公平、社会责任)
  ↓
Guide: "这次支教经历中,哪个具体时刻让你意识到教育的重要性?"
```

**2. 叙事构建 → 文书生成**
```
Ideas (10个想法) → Narrator (构建框架) → Writer (撰写草稿) → Audit (质量审核)
  ↓
完整的 Stanford 个人陈述 (500 words)
```

## 🎨 核心功能

### 1. 想法球 (Idea Bubbles)
- 动态浮动的想法可视化
- 拖拽交互,强度调节
- 自动关联和主题识别
- 想法存储盒管理

### 2. AI 对话 (Chat)
- 实时流式响应
- Multi-Agent 协同
- Socratic 式深度提问
- 上下文记忆

### 3. 叙事时间线 (Timeline)
- 自动生成成长轨迹
- 可视化因果关系
- AI 建议补充事件

### 4. 文书工作区 (Document)
- 多学校版本管理
- 实时字数统计
- AI 反馈和建议
- 一键复制导出

### 5. 智能洞察 (Insights)
- 主题分析
- 准备度评估
- 关系图谱
- 下一步建议

## 🔑 API 密钥配置

**已预配置密钥** (开箱即用):

```env
# backend/.env
DEEPSEEK_API_KEY=sk-5875a42e4df34ec894a2e63e4fc1f212
MINIMAX_API_KEY=<完整 JWT Token>
```

如需更换密钥,请编辑 `backend/.env` 文件。

## 📊 数据流向

```
用户输入
  ↓
前端 IdeaBubbles/Chat
  ↓
POST /api/chat/stream (SSE)
  ↓
Global Agent → SubAgents
  ↓
DeepSeek/MiniMax API
  ↓
流式返回 → 前端渲染
  ↓
数据库持久化
```

## 🛠️ 开发指南

### 添加新组件

1. 在 `frontend/src/components/` 创建组件
2. 使用 Radix UI + TailwindCSS
3. 集成 Motion 动画

### 添加新 API

1. 在 `backend/api/` 创建路由文件
2. 定义 Pydantic Schema
3. 在 `api/__init__.py` 注册路由

### 调整 Agent 行为

编辑 `backend/agents/prompts.py` 中的 Agent 提示词

### 自定义样式

编辑 `frontend/src/index.css` 或组件内联样式

## 🧪 测试

### 后端测试

```bash
cd backend
pytest
```

### 前端测试

```bash
cd frontend
npm run test
```

## 📦 部署

### 后端部署 (推荐使用 Docker)

```bash
# TODO: 添加 Dockerfile
docker build -t comchatx-backend ./backend
docker run -p 8000:8000 comchatx-backend
```

### 前端部署

```bash
cd frontend
npm run build
# dist/ 目录可部署到 Vercel/Netlify/Nginx
```

## 🎯 产品特色

### 对标一流 Agent 产品

- ✅ **高智能对话**: 媲美 ChatGPT,深度理解用户意图
- ✅ **Multi-Agent 协同**: 专业分工,优于单一模型
- ✅ **流式体验**: 实时响应,无等待感
- ✅ **数据闭环**: 想法 → 对话 → 叙事 → 文书,完整链路
- ✅ **视觉交互**: 想法球、时间线,超越传统文本界面
- ✅ **质量保证**: Audit Agent 多维度评估

## 📝 开发日志

### 已完成
- ✅ 完整的 Multi-Agent 系统架构
- ✅ DeepSeek + MiniMax 双 LLM 集成
- ✅ FastAPI 异步 API 框架
- ✅ React + TypeScript 前端
- ✅ 流式响应 (SSE)
- ✅ 数据库持久化
- ✅ 想法球交互
- ✅ 对话系统
- ✅ 文书生成

### 待优化
- 🚧 Agent 提示词精调
- 🚧 更复杂的叙事分析
- 🚧 动态专业 Agent 实现
- 🚧 缓存和性能优化
- 🚧 单元测试覆盖

## 🤝 贡献

欢迎提交 Issue 和 Pull Request!

### 开发规范
- Python: PEP 8
- TypeScript: ESLint + Prettier
- Commit: Conventional Commits

## 📄 许可证

MIT License

## 👨‍💻 作者

**Bruuce**

---

**⭐ 如果这个项目对你有帮助,请给个 Star!**

## 📞 联系方式

- Email: (待添加)
- Issue: GitHub Issues

---

> 用 AI 赋能教育,让每个学生都能讲述自己的故事。

