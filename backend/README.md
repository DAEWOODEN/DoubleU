# ComChatX Backend

基于 **AutoGen Multi-Agent 框架**的智能留学文书创作平台后端系统。

## 🏗️ 技术架构

### 核心技术栈
- **Web 框架**: FastAPI (高性能异步框架)
- **Multi-Agent**: AutoGen (Microsoft 开源 Agent 框架)
- **AI 模型**: 
  - DeepSeek-V3 (主力对话和写作)
  - MiniMax-M2 (辅助分析)
- **数据库**: SQLite + SQLAlchemy (异步 ORM)
- **实时通信**: Server-Sent Events (SSE)

### Multi-Agent 系统设计

```
┌─────────────────────────────────────────────────────────┐
│              Global Supervisor Agent                    │
│  (统筹调度、对话接口、用户画像维护)                      │
└────────────────────┬────────────────────────────────────┘
                     │
     ┌───────────────┼───────────────┐
     │               │               │
┌────▼────┐    ┌────▼────┐    ┌────▼────┐
│Collector│    │Analyzer │    │  Guide  │
│收集想法  │    │深度分析 │    │引导提问  │
└─────────┘    └─────────┘    └─────────┘
     
     │               │               │
┌────▼────┐    ┌────▼────┐    ┌────▼────┐
│  Query  │    │Narrator │    │ Writer  │
│质疑追问  │    │叙事构建 │    │文书写作  │
└─────────┘    └─────────┘    └─────────┘

     │               │
┌────▼────┐    ┌────▼────────┐
│  Audit  │    │Major Agents │
│质量审核  │    │动态专业Agent│
└─────────┘    └─────────────┘
```

## 🚀 快速开始

### 1. 环境要求
- Python 3.10+
- pip 或 conda

### 2. 安装依赖

```bash
cd backend
pip install -r requirements.txt
```

### 3. 配置环境变量

复制 `.env.example` 并修改为 `.env`:

```bash
cp .env.example .env
```

**重要**: API 密钥已预配置在 `.env` 文件中:
- DeepSeek API Key: 
- MiniMax API Key: 

### 4. 启动服务器

```bash
# 开发模式(自动重载)
python main.py

# 或使用 uvicorn
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```



### 5. 访问 API 文档



## 📁 项目结构

```
backend/
├── main.py                 # FastAPI 应用入口
├── config.py              # 配置管理
├── database.py            # 数据库模型和连接
├── llm_clients.py         # DeepSeek 和 MiniMax 客户端
├── requirements.txt       # Python 依赖
├── .env                   # 环境变量(已配置)
├── .env.example           # 环境变量模板
│
├── agents/                # Multi-Agent 系统
│   ├── __init__.py
│   ├── agent_system.py   # Multi-Agent 核心编排
│   └── prompts.py        # Agent 系统提示词
│
├── api/                   # API 路由
│   ├── __init__.py
│   ├── schemas.py        # Pydantic 数据模型
│   ├── profile.py        # 用户资料 API
│   ├── ideas.py          # 想法管理 API
│   ├── chat.py           # 对话系统 API
│   ├── narrative.py      # 叙事生成 API
│   ├── essay.py          # 文书生成 API
│   └── insights.py       # 洞察分析 API
│
└── data/                  # 数据存储目录
    └── comchatx.db       # SQLite 数据库(自动创建)
```

## 🤖 Multi-Agent 工作流

### 1. 对话流程
```
用户输入 → Collector(收集) → Analyzer(分析) → Guide(引导) → 返回问题
```

### 2. 文书生成流程
```
Ideas + Timeline → Narrator(叙事框架) → Writer(写作) → Audit(审核) → 最终文书
```

### 3. Socratic 提问流程
```
对话历史 + Ideas → Analyzer → Query(质疑) → 深度问题
```

## 🔌 API 端点概览

### Profile (用户资料)
- `POST /api/profile` - 创建/更新用户资料
- `GET /api/profile` - 获取用户资料

### Ideas (想法管理)
- `POST /api/ideas/sync` - 同步想法
- `POST /api/ideas/analyze` - AI 分析想法
- `GET /api/ideas/{id}/connections` - 获取想法关联
- `GET /api/ideas/summary` - 获取想法摘要

### Chat (对话系统)
- `POST /api/chat/message` - 发送消息
- `POST /api/chat/stream` - 流式对话 (SSE)
- `GET /api/chat/history/{id}` - 获取对话历史
- `POST /api/chat/socratic` - 请求 Socratic 问题

### Narrative (叙事生成)
- `POST /api/narrative/generate` - 生成叙事框架
- `POST /api/narrative/save` - 保存叙事事件
- `GET /api/narrative/suggestions` - 获取叙事建议

### Essay (文书生成)
- `POST /api/essay/generate` - 生成文书
- `POST /api/essay/stream` - 流式生成文书
- `POST /api/essay/save` - 保存文书
- `GET /api/essay/{id}/feedback` - 获取 AI 反馈
- `GET /api/essay/list` - 列出所有文书

### Insights (洞察分析)
- `GET /api/insights` - 获取综合洞察
- `GET /api/insights/relationships` - 获取关系图谱

## 🎯 核心特性

### 1. Multi-Agent 协同
- **Global Agent**: 统筹全局,维护用户画像
- **Collector**: 智能提取对话中的关键信息
- **Analyzer**: 每 5 个想法触发一次深度分析
- **Guide**: 基于分析生成针对性引导问题
- **Query**: Socratic 式深度追问
- **Narrator**: 构建完整叙事框架
- **Writer**: 生成高质量个人陈述
- **Audit**: 多维度质量评估

### 2. 流式响应
- 使用 SSE (Server-Sent Events) 实现实时流式输出
- 适用于对话和文书生成场景
- 提供即时反馈,提升用户体验

### 3. 智能分析
- 自动识别想法主题和关联
- 构建知识图谱
- 生成个性化叙事建议

### 4. 数据持久化
- 完整保存用户数据
- 支持多版本文书管理
- 对话历史追溯

## 🔧 开发指南

### 添加新的 Agent

1. 在 `agents/prompts.py` 中定义 Agent 提示词
2. 在 `agents/agent_system.py` 中实现 Agent 逻辑
3. 在相应的 API 路由中调用

### 调整 LLM 参数

编辑 `.env` 文件:
```env
DEFAULT_TEMPERATURE=0.7      # 0-1, 越高越有创意
DEFAULT_MAX_TOKENS=4000      # 最大生成 token 数
```

### 切换 AI 模型

在 `agents/agent_system.py` 中:
```python
# 使用 DeepSeek
response = await self.deepseek_client.chat_completion(...)

# 或使用 MiniMax
response = await self.minimax_client.chat_completion(...)
```

## 🐛 调试

### 查看日志
应用使用 `loguru` 进行日志记录,所有日志会输出到控制台。

### 数据库检查
```bash
# 使用 SQLite CLI
sqlite3 data/comchatx.db

# 查看表
.tables

# 查看数据
SELECT * FROM ideas;
```

## 📊 性能优化

- 使用异步 I/O 处理所有数据库和 API 调用
- LLM 响应缓存(可选)
- 数据库连接池管理
- 流式响应减少首字节时间

## 🔒 安全性

- CORS 配置限制允许的前端域名
- API 密钥存储在环境变量中
- 输入验证使用 Pydantic
- SQL 注入防护(ORM)

## 📝 许可证

MIT License

## 👥 贡献

欢迎提交 Issue 和 Pull Request!

---

**注意**: 这是一个高质量的 Multi-Agent 系统实现,充分利用了 DeepSeek 和 MiniMax 的能力,为留学文书创作提供智能化支持。

