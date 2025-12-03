
  # ComChatX - Agent Product Frontend Design

  This is a code bundle for Agent Product Frontend Design. The original project is available at https://www.figma.com/design/VdIdbGWSfPNGDPEifSwpnV/Agent-Product-Frontend-Design.

  ## 🚀 快速开始

  ### 本地开发

  ```bash
  # 安装依赖
  npm install

  # 启动开发服务器
  npm run dev
  ```

  然后在浏览器中打开 [http://localhost:3000](http://localhost:3000)

  ### 构建生产版本

  ```bash
  npm run build
  ```

  构建产物将输出到 `dist` 目录。

  ## 📦 部署

  ### 部署到 Vercel

  本项目已配置好 Vercel 部署。详细的部署步骤请查看：

  - **[📖 详细部署指南](./DEPLOYMENT_GUIDE.md)** - 完整的部署教程（推荐）
  - **[✅ 部署检查清单](./部署检查清单.md)** - 快速检查清单

  **快速部署步骤**：
  1. 将代码推送到 GitHub 仓库
  2. 在 [Vercel](https://vercel.com) 导入 GitHub 仓库
  3. 配置域名（如：comchatx.me）
  4. 完成部署！

  ## 🛠️ 技术栈

  - **框架**: React 18 + TypeScript
  - **构建工具**: Vite 6
  - **UI 库**: Radix UI
  - **样式**: Tailwind CSS v4
  - **动画**: Motion (Framer Motion)
  - **部署**: Vercel

  ## 📝 项目结构

  ```
  ├── src/
  │   ├── components/     # React 组件
  │   ├── hooks/          # 自定义 Hooks
  │   ├── services/       # API 服务
  │   └── styles/         # 样式文件
  ├── index.html          # HTML 入口
  ├── vite.config.ts      # Vite 配置
  └── vercel.json         # Vercel 配置
  ```

  ## 🔧 环境变量

  如果需要配置后端 API 地址，创建 `.env` 文件：

  ```env
  VITE_API_BASE_URL=https://your-api-url.com
  ```

  然后在 Vercel 项目设置中也添加相同的环境变量。

  ## 📚 相关文档

  - [AI 集成指南](./src/AI_INTEGRATION_GUIDE.md)
  - [设计指南](./src/guidelines/Guidelines.md)

  ---

  **需要帮助？** 查看 [部署指南](./DEPLOYMENT_GUIDE.md) 或提交 Issue。
  