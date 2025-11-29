# ComChatX Vercel 完整部署指南

## 📋 部署前准备

### 1. 确认代码已推送
- 确保所有代码已推送到 GitHub 仓库：`DAEWOODEN/DoubleU`
- 确保 `main` 分支是最新的

### 2. 准备信息
- **域名**：`comchatx.icu`（主域名）和 `api.comchatx.icu`（后端子域名）
- **API 密钥**：
  - `DEEPSEEK_API_KEY`: `sk-5875a42e4df34ec894a2e63e4fc1f212`
  - `MINIMAX_API_KEY`: `eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...`（完整token）

---

## 🚀 第一步：部署后端（api.comchatx.icu）

### 1.1 创建后端项目

1. 访问 https://vercel.com 并登录
2. 点击右上角 **"Add New..."** → **"Project"**
3. 选择仓库：**`DAEWOODEN/DoubleU`**

### 1.2 配置后端项目

在 "Configure Project" 页面：

**项目名称：**
- 输入：`comchatx-backend`

**框架预设：**
- 选择：**Other** 或 **None**

**根目录（Root Directory）：**
- 点击 "Edit" 或 "Override"
- 输入：`backend`
- ⚠️ **非常重要**：必须设置为 `backend`

**构建设置：**
- Build Command：**留空**
- Output Directory：**留空**
- Install Command：**留空**

点击 **"Deploy"** 按钮

### 1.3 配置环境变量

部署开始后（无论成功或失败），立即配置环境变量：

1. 在项目页面，点击左侧 **"Settings"**
2. 点击 **"Environment Variables"**
3. 添加以下变量：

**变量 1：**
- Name: `DEEPSEEK_API_KEY`
- Value: `sk-5875a42e4df34ec894a2e63e4fc1f212`
- Environment: 勾选 **Production**、**Preview**、**Development**
- 点击 **"Save"**

**变量 2：**
- Name: `MINIMAX_API_KEY`
- Value: `eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJHcm91cE5hbWUiOiJCcnV1Y2UiLCJVc2VyTmFtZSI6IkJydXVjZSIsIkFjY291bnQiOiIiLCJTdWJqZWN0SUQiOiIxOTgzODE3NTQxMTc2MjcxNzE1IiwiUGhvbmUiOiIxODk2NjQ2MzA5OSIsIkdyb3VwSUQiOiIxOTgzODE3NTQxMTY3ODgzMTA3IiwiUGFnZU5hbWUiOiIiLCJNYWlsIjoiIiwiQ3JlYXRlVGltZSI6IjIwMjUtMTEtMDEgMDg6MTQ6MzkiLCJUb2tlblR5cGUiOjEsImlzcyI6Im1pbmltYXgifQ.ScH7hEn_2jb9WqACRo_lmASYyUHEijwxDakg444SRM1ZMjBn0E72imVba2DKdXZj17EV_w4RURUdDky-_Bz_DY7JRy5qCaOCKzJ53qerG5fikRz1Z_1QAqRzrDXlYCFoJzRdZWPV1PSzFmvY2KD77w3L99UcdKRsryxYhvijN4Vc-CL7zsavzcNPaiTIoouoLKrW0RlF4scEL1wprtSZzdmiMQQCxNLPG0nmGp4fEUpEyXntoGxcq7T_SjKjTmPFZRp3mds011xkwf91NvWXoL4c6ap3f17f3fHvhADWzUSoluXSOTKZTznee63kTYHfE5CHkENjE-3y9U5AeDWNKQ`
- Environment: 勾选 **Production**、**Preview**、**Development**
- 点击 **"Save"**

### 1.4 重新部署

1. 点击左侧 **"Deployments"**
2. 找到最新部署，点击右侧 **"..."** → **"Redeploy"**
3. 等待 1-2 分钟

### 1.5 绑定域名

1. 在项目页面，点击左侧 **"Settings"** → **"Domains"**
2. 点击 **"Add Domain"**
3. 输入：`api.comchatx.icu`
4. 选择 **"Connect to an environment"** → **"Production"**
5. 点击 **"Save"**
6. 如果阿里云 DNS 还没配置，按照 Vercel 提示添加 CNAME 记录

### 1.6 验证后端

访问：`https://api.comchatx.icu/api/docs`

- ✅ 如果看到 FastAPI 文档页面，说明后端部署成功
- ❌ 如果还是 500 错误，查看 Runtime Logs 并告诉我错误信息

---

## 🎨 第二步：部署前端（comchatx.icu）

### 2.1 创建前端项目

1. 在 Vercel 控制台，点击右上角 **"Add New..."** → **"Project"**
2. 选择仓库：**`DAEWOODEN/DoubleU`**（同一个仓库）

### 2.2 配置前端项目

在 "Configure Project" 页面：

**项目名称：**
- 输入：`comchatx-frontend`

**框架预设：**
- 选择：**Vite**（Vercel 会自动识别）

**根目录（Root Directory）：**
- 点击 "Edit" 或 "Override"
- 输入：`frontend`
- ⚠️ **非常重要**：必须设置为 `frontend`

**构建设置：**
- Build Command：`npm run build`（应该自动填充）
- Output Directory：`dist`（应该自动填充）
- Install Command：留空（自动）

点击 **"Deploy"** 按钮

### 2.3 配置环境变量

1. 在项目页面，点击左侧 **"Settings"** → **"Environment Variables"**
2. 添加变量：

**变量：**
- Name: `VITE_API_BASE_URL`
- Value: `https://api.comchatx.icu`
- Environment: 勾选 **Production**、**Preview**、**Development**
- 点击 **"Save"**

### 2.4 重新部署

1. 点击左侧 **"Deployments"**
2. 找到最新部署，点击右侧 **"..."** → **"Redeploy"**
3. 等待 1-2 分钟

### 2.5 绑定域名

1. 在项目页面，点击左侧 **"Settings"** → **"Domains"**
2. 点击 **"Add Domain"**
3. 输入：`comchatx.icu` 和 `www.comchatx.icu`（两个都添加）
4. 选择 **"Connect to an environment"** → **"Production"**
5. 点击 **"Save"**
6. 如果阿里云 DNS 还没配置，按照 Vercel 提示添加 DNS 记录

### 2.6 验证前端

访问：`https://comchatx.icu`

- ✅ 如果页面正常加载，说明前端部署成功
- ✅ 打开浏览器开发者工具（F12）→ Network，测试对话功能
- ✅ 确认 API 请求发往 `https://api.comchatx.icu/api/...`

---

## 🔧 故障排查

### 后端 500 错误

1. 在 Vercel 后端项目，点击最新部署
2. 点击 **"Runtime Logs"**
3. 复制错误信息发给我

### 前端无法连接后端

1. 检查前端环境变量 `VITE_API_BASE_URL` 是否正确
2. 检查浏览器控制台 Network 标签，查看请求是否失败
3. 检查后端 CORS 配置是否包含前端域名

### 域名无法访问

1. 检查 Vercel Domains 页面，域名状态是否为 "Valid Configuration"
2. 检查阿里云 DNS 记录是否正确
3. 等待 DNS 生效（可能需要几分钟到几小时）

---

## ✅ 部署检查清单

### 后端检查
- [ ] 项目 Root Directory 设置为 `backend`
- [ ] 环境变量 `DEEPSEEK_API_KEY` 和 `MINIMAX_API_KEY` 已配置
- [ ] 域名 `api.comchatx.icu` 已绑定
- [ ] 访问 `https://api.comchatx.icu/api/docs` 能看到文档

### 前端检查
- [ ] 项目 Root Directory 设置为 `frontend`
- [ ] 环境变量 `VITE_API_BASE_URL` 设置为 `https://api.comchatx.icu`
- [ ] 域名 `comchatx.icu` 和 `www.comchatx.icu` 已绑定
- [ ] 访问 `https://comchatx.icu` 页面正常加载
- [ ] 对话、生成等功能正常工作

---

## 📞 需要帮助？

如果遇到问题，请告诉我：
1. 在哪一步卡住了？
2. 看到了什么错误信息？
3. Build Logs 或 Runtime Logs 显示什么？

我会帮你解决！

