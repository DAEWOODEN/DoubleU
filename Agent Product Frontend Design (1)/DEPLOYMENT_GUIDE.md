# ComChatX 项目部署指南

本指南将帮助您将 ComChatX 项目部署到 Vercel，并使用您的域名 `comchatx.me`。

## 📋 目录

1. [前置准备](#前置准备)
2. [第一步：本地测试项目](#第一步本地测试项目)
3. [第二步：准备 GitHub 仓库](#第二步准备-github-仓库)
4. [第三步：配置 Vercel](#第三步配置-vercel)
5. [第四步：配置域名](#第四步配置域名)
6. [第五步：验证部署](#第五步验证部署)
7. [常见问题](#常见问题)

---

## 前置准备

在开始之前，请确保您已经准备好：

- ✅ 域名：`comchatx.me`（已在阿里云购买）
- ✅ GitHub 账号（如果没有，请访问 [github.com](https://github.com) 注册）
- ✅ Vercel 账号（如果没有，请访问 [vercel.com](https://vercel.com) 注册，可使用 GitHub 账号登录）

### 需要安装的软件

1. **Node.js**（版本 18 或更高）
   - 下载地址：https://nodejs.org/
   - 安装后，打开终端运行 `node -v` 检查版本
   - 应该显示 `v18.x.x` 或更高版本

2. **Git**（用于版本控制）
   - Mac 通常已预装，运行 `git --version` 检查
   - 如果没有，下载地址：https://git-scm.com/downloads

---

## 第一步：本地测试项目

在部署之前，我们需要先确保项目可以在本地正常运行。

### 1.1 打开终端并进入项目目录

```bash
cd "/Users/bruuce/Downloads/Agent Product Frontend Design (1)"
```

### 1.2 安装项目依赖

```bash
npm install
```

这可能需要几分钟时间，请耐心等待。如果遇到错误，请告诉我。

### 1.3 检查并补充缺失的依赖

运行以下命令添加可能缺失的 TypeScript 相关依赖：

```bash
npm install --save-dev typescript @types/react @types/react-dom
```

### 1.4 本地测试运行

```bash
npm run dev
```

如果成功，您应该看到类似以下的输出：

```
  VITE v6.x.x  ready in xxx ms

  ➜  Local:   http://localhost:3000/
  ➜  Network: use --host to expose
```

然后：
1. 打开浏览器，访问 `http://localhost:3000`
2. 检查网站是否能正常显示
3. 如果一切正常，按 `Ctrl + C` 停止本地服务器

### 1.5 测试构建

确保项目可以成功构建：

```bash
npm run build
```

如果构建成功，您会看到 `dist` 文件夹被创建。这是将要部署到 Vercel 的文件夹。

---

## 第二步：准备 GitHub 仓库

Vercel 需要从 GitHub 仓库部署代码。让我们将项目上传到 GitHub。

### 2.1 在 GitHub 上创建新仓库

1. 登录 [GitHub.com](https://github.com)
2. 点击右上角的 `+` 号，选择 `New repository`
3. 填写仓库信息：
   - **Repository name**: `comchatx-frontend`（或您喜欢的名称）
   - **Description**: `ComChatX Frontend Application`
   - **Visibility**: 选择 `Public` 或 `Private`（建议先选 Private）
   - **不要**勾选 "Initialize this repository with a README"
   - 点击 `Create repository`

### 2.2 初始化本地 Git 仓库

在项目目录的终端中运行：

```bash
# 初始化 Git 仓库
git init

# 添加所有文件到 Git
git add .

# 创建第一次提交
git commit -m "Initial commit: ComChatX frontend project"
```

### 2.3 连接到 GitHub 仓库

GitHub 创建仓库后会显示一个页面，上面有仓库的 URL（类似 `https://github.com/您的用户名/comchatx-frontend.git`）。

复制这个 URL，然后在终端运行：

```bash
# 将 GitHub 仓库地址替换为您实际的仓库地址
git remote add origin https://github.com/您的用户名/comchatx-frontend.git

# 将代码推送到 GitHub
git branch -M main
git push -u origin main
```

**注意**：如果这是您第一次使用 Git，可能需要配置用户信息：

```bash
git config --global user.name "您的名字"
git config --global user.email "您的邮箱"
```

### 2.4 验证代码已上传

回到 GitHub 网页，刷新页面，您应该能看到所有项目文件。

---

## 第三步：配置 Vercel

现在我们将项目连接到 Vercel 并部署。

### 3.1 登录 Vercel

1. 访问 [vercel.com](https://vercel.com)
2. 点击 `Sign Up` 或 `Log In`
3. 选择 `Continue with GitHub`，使用您的 GitHub 账号登录
4. 授权 Vercel 访问您的 GitHub 仓库

### 3.2 导入项目

1. 登录后，点击 `Add New...` → `Project`
2. 在仓库列表中找到您刚刚创建的仓库（`comchatx-frontend`）
3. 点击 `Import`

### 3.3 配置项目设置

Vercel 会自动检测到这是一个 Vite 项目，但请检查以下设置：

- **Framework Preset**: 应该自动识别为 `Vite`
- **Root Directory**: 保持为 `./`（默认值）
- **Build Command**: `npm run build`（应该已自动填写）
- **Output Directory**: `dist`（应该已自动填写）
- **Install Command**: `npm install`（应该已自动填写）

### 3.4 环境变量配置（可选）

如果您的项目需要环境变量（例如 API 地址），可以在这里添加：

- 点击 `Environment Variables`
- 添加变量，例如：
  - `VITE_API_BASE_URL` = `https://your-api-url.com`
  - 点击 `Save`

**注意**：目前项目中 API 地址硬编码为 `http://localhost:8000`，如果后端还没有部署，可以先不添加环境变量。

### 3.5 部署项目

1. 点击 `Deploy` 按钮
2. 等待构建完成（通常需要 1-3 分钟）
3. 构建成功后，Vercel 会给您一个临时域名，例如：`comchatx-frontend.vercel.app`
4. 点击该域名，验证网站是否正常运行

**恭喜！** 您的网站已经部署到 Vercel 了！

---

## 第四步：配置域名

现在我们需要将您的自定义域名 `comchatx.me` 连接到 Vercel 部署。

### 4.1 在 Vercel 中添加域名

1. 在 Vercel 项目页面，点击 `Settings` 标签
2. 在左侧菜单中找到 `Domains`
3. 在输入框中输入您的域名：`comchatx.me`
4. 点击 `Add`
5. Vercel 会显示需要配置的 DNS 记录

### 4.2 在阿里云配置 DNS 解析

1. 登录 [阿里云控制台](https://ecs.console.aliyun.com/)
2. 进入 **域名控制台** 或搜索 "域名"
3. 找到您的域名 `comchatx.me`
4. 点击 **解析设置** 或 **DNS 解析**

### 4.3 添加 DNS 记录

Vercel 会显示需要添加的记录。通常有两种方式：

#### 方式 A：使用 CNAME 记录（推荐，支持 www）

添加以下两条记录：

**记录 1：**
- **记录类型**: `CNAME`
- **主机记录**: `@`（或留空，表示主域名）
- **记录值**: `cname.vercel-dns.com.`（注意末尾有个点）
- **TTL**: `600` 或 `自动`

**记录 2：**
- **记录类型**: `CNAME`
- **主机记录**: `www`
- **记录值**: `cname.vercel-dns.com.`（注意末尾有个点）
- **TTL**: `600` 或 `自动`

#### 方式 B：使用 A 记录（如果 CNAME 不支持）

如果您的域名不支持根域名使用 CNAME，Vercel 会显示一个 IP 地址列表，添加以下 A 记录：

**记录 1：**
- **记录类型**: `A`
- **主机记录**: `@`
- **记录值**: `76.76.21.21`（Vercel 提供的 IP，以 Vercel 显示为准）
- **TTL**: `600`

**记录 2：**
- **记录类型**: `A`
- **主机记录**: `@`
- **记录值**: `76.76.21.22`（Vercel 提供的另一个 IP，如果有多个的话）
- **TTL**: `600`

**重要提示**：
- 配置完成后，DNS 传播可能需要 **几分钟到 48 小时**，通常 10-30 分钟内生效
- 删除任何现有的 `A` 记录或 `CNAME` 记录（如果有冲突）

### 4.4 验证域名配置

1. 回到 Vercel 的 Domains 页面
2. Vercel 会自动检测域名配置
3. 当状态变为绿色勾号 ✅ 时，表示配置成功
4. 如果显示错误，请检查 DNS 记录是否正确

### 4.5 等待 DNS 生效

配置完成后，您可以：

1. 使用在线工具检查 DNS 是否生效：
   - 访问 [dnschecker.org](https://dnschecker.org)
   - 输入域名 `comchatx.me`
   - 查看全球 DNS 解析状态

2. 在本地终端测试：
   ```bash
   nslookup comchatx.me
   ```
   或
   ```bash
   dig comchatx.me
   ```

---

## 第五步：验证部署

### 5.1 访问您的网站

配置完成后，访问以下地址：

- 主域名：`https://comchatx.me`
- www 子域名：`https://www.comchatx.me`
- Vercel 临时域名：`https://comchatx-frontend.vercel.app`

所有地址应该都指向同一个网站。

### 5.2 检查 HTTPS

Vercel 会自动为您的域名配置免费的 SSL 证书（HTTPS），确保网站使用 `https://` 访问。

### 5.3 测试网站功能

1. 检查页面是否正常加载
2. 测试交互功能
3. 在不同设备上测试（手机、平板、电脑）

---

## 常见问题

### Q1: 构建失败怎么办？

**可能原因：**
- 依赖缺失
- 代码错误
- 环境变量未配置

**解决方法：**
1. 在 Vercel 项目页面查看构建日志
2. 在本地运行 `npm run build` 重现错误
3. 修复错误后，Git push 会自动触发重新部署

### Q2: 域名无法访问？

**检查清单：**
- ✅ DNS 记录是否正确配置
- ✅ 等待 DNS 传播（最多 48 小时）
- ✅ 检查 Vercel Domains 页面是否有错误提示
- ✅ 尝试清除浏览器缓存或使用无痕模式

### Q3: 如何更新网站？

每次您向 GitHub 推送代码时，Vercel 会自动重新部署：

```bash
git add .
git commit -m "更新描述"
git push
```

### Q4: 如何查看部署日志？

1. 在 Vercel 项目页面
2. 点击 `Deployments` 标签
3. 选择任意部署
4. 查看构建日志

### Q5: 如何回滚到之前的版本？

1. 在 Vercel 的 `Deployments` 页面
2. 找到之前成功的部署
3. 点击右侧的 `...` 菜单
4. 选择 `Promote to Production`

### Q6: API 请求失败？

如果您的后端 API 还没有部署：
- 前端会使用 mock 数据，功能可能受限
- 需要部署后端 API 后，在 Vercel 环境变量中配置 `VITE_API_BASE_URL`

---

## 📝 后续步骤

1. **配置环境变量**：如果后端 API 已部署，在 Vercel 中配置 API 地址
2. **设置自定义域名重定向**：确保 `www.comchatx.me` 重定向到 `comchatx.me`（或相反）
3. **启用分析**：在 Vercel 中启用 Analytics 查看访问数据
4. **配置 CI/CD**：每次代码更新都会自动部署

---

## 🎉 完成！

如果一切顺利，您的网站现在应该可以通过 `https://comchatx.me` 访问了！

如果遇到任何问题，请告诉我，我会帮您解决。

---

**最后更新**: 2025年1月

