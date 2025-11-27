# ComChatX 部署说明

## 当前部署方式：Vercel

本项目已迁移到 Vercel 平台进行部署，使用以下配置：

### 前端部署
- **项目名称**: `comchatx-frontend`
- **域名**: `https://comchatx.icu` 和 `https://www.comchatx.icu`
- **Root Directory**: `frontend`
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **环境变量**:
  - `VITE_API_BASE_URL`: `https://api.comchatx.icu`

### 后端部署
- **项目名称**: `comchatx-backend`
- **域名**: `https://api.comchatx.icu`
- **Root Directory**: `backend`
- **环境变量**:
  - `DEEPSEEK_API_KEY`: (你的密钥)
  - `MINIMAX_API_KEY`: (你的密钥)
  - `CORS_ORIGINS`: `https://comchatx.icu,https://www.comchatx.icu`

### 部署文件说明
- `backend/vercel.json`: Vercel 后端部署配置
- `backend/api/index.py`: Vercel Serverless Function 入口文件

### 旧部署方式（已废弃）
以下文件/脚本已不再使用，保留仅作参考：
- `快速部署.sh`: 旧的本地+ngrok部署脚本
- `使用说明.md`: 旧的部署说明

## 本地开发

### 启动后端
```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
python main.py
```

### 启动前端
```bash
cd frontend
npm install
npm run dev
```

## 更新部署

1. 修改代码后，推送到 GitHub
2. Vercel 会自动检测并重新部署
3. 如需手动触发，在 Vercel 控制台点击 "Redeploy"

## 故障排查

### 前端无法连接后端
1. 检查前端环境变量 `VITE_API_BASE_URL` 是否正确
2. 检查后端 CORS 配置是否包含前端域名
3. 检查后端是否正常部署（访问 `https://api.comchatx.icu/api/docs`）

### 后端功能异常
1. 检查 Vercel 函数日志
2. 确认环境变量已正确配置
3. 检查 `backend/api/index.py` 和 `backend/vercel.json` 是否存在

