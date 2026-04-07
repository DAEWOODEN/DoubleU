# 智能留学文书创作平台 - 从叙事挖掘到自我呈现

基于 Multi-Agent 架构的 AI 驱动个人陈述生成系统

## 项目简介

ComChatX 是一个创新的留学文书创作平台，通过 Multi-Agent AI 系统帮助学生从零散的想法出发，逐步构建完整的个人陈述。系统采用多个专门的 AI Agent 协同工作，包括收集想法、深度分析、引导提问、构建叙事框架、撰写文书和质量审核等环节。
我们以留学文书为引，帮用户整合零碎想法的同时深度构建完整的个人叙事；在此基础上又不止于留学场景，因为我们相信人生有无数个需要自我呈现的舞台。

## 产品定位

ComChatX 通过 Multi-Agent AI 系统帮助学生完成以下目标：

- 想法收集：随时记录零散灵感，通过极简优雅的"想法球"交互方式
- 思维引导：AI 主动提问深挖潜力，采用 Socratic 式追问方法
- 叙事架构：构建完整自我认知框架，可视化成长轨迹
- 文书创作：多学校差异化生成，专业级个人陈述
- 长期陪伴：持续迭代优化，记录成长时刻

## 技术架构

### 整体架构

```
前端 (React + TypeScript)
  ├─ IdeaBubbles (想法收集)
  ├─ ChatSidebar (AI 对话)
  ├─ TimelineView (叙事时间线)
  ├─ DocumentWorkspace (文书编辑)
  └─ InsightsPanel (智能洞察)
         │
         │ REST API / SSE
         │
后端 (FastAPI + Multi-Agent System)
  ├─ Global Supervisor Agent (总调度)
  ├─ Collector SubAgent (收集)
  ├─ Analyzer SubAgent (分析)
  ├─ Guide SubAgent (引导)
  ├─ Query SubAgent (质疑)
  ├─ Narrator SubAgent (叙事)
  ├─ Writer SubAgent (写作)
  └─ Audit SubAgent (审核)
         │
         │
AI Service Layer
  ├─ DeepSeek-V3 (主力对话和写作)
  └─ MiniMax-M2 (辅助分析)
```

## Multi-Agent 系统详解

### Agent 角色与职责

| Agent | 职责 | 触发时机 |
|-------|------|---------|
| Global Supervisor | 总调度,维护对话上下文 | 所有交互 |
| Collector | 收集并分类用户想法 | 接收用户输入 |
| Analyzer | 深度分析想法主题和关联 | 每 5 个想法 |
| Guide | 生成引导性问题 | 分析后 |
| Query | Socratic 式质疑追问 | 用户请求 |
| Narrator | 构建叙事框架 | 生成时间线 |
| Writer | 撰写个人陈述 | 生成文书 |
| Audit | 质量审核和反馈 | 文书完成后 |
| Major Agents | 专业领域审核 | 动态创建 |

### 工作流程示例

#### 想法收集到深入对话流程

```
用户: "我在山区支教的经历很有意义"
  ↓
Collector: 提取关键信息(支教、山区、意义)
  ↓
Analyzer: 识别主题(教育公平、社会责任)
  ↓
Guide: "这次支教经历中,哪个具体时刻让你意识到教育的重要性?"
```

#### 叙事构建到文书生成流程

```
Ideas (10个想法) → Narrator (构建框架) → Writer (撰写草稿) → Audit (质量审核)
  ↓
完整的 Stanford 个人陈述 (500 words)
```

## 核心功能

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

## API 密钥配置

如需更换密钥，请编辑 `backend/.env` 文件：

## 产品特色

### 对标一流 Agent 产品

- 高智能对话: 媲美 ChatGPT,深度理解用户意图
- Multi-Agent 协同: 专业分工,优于单一模型
- 流式体验: 实时响应,无等待感
- 数据闭环: 想法 → 对话 → 叙事 → 文书,完整链路
- 视觉交互: 想法球、时间线,超越传统文本界面
- 质量保证: Audit Agent 多维度评估

## 核心特性说明

### 每次访问全新开始

系统设计为每次用户访问都从零开始：
- 页面加载时自动清除所有本地存储数据
- 用户数据仅保存在当前会话中
- 页面刷新后所有数据清空，实现全新的开始

### 真实性保证

文书生成严格遵守真实性原则：
- 绝不编造个人经历或事件
- 仅使用用户实际提供的信息
- 当信息不足时，通过深度反思和分析扩展内容，而非虚构经历
- 强调思考深度而非事件数量



## 许可证

MIT License

## 作者

Bruuce

## 联系方式

- Email: bruuce520@gmail.com
- Issue: GitHub Issues

---

用 AI 赋能教育，让每个学生都能讲述自己的故事。
