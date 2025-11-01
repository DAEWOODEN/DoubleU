#!/bin/bash

# ComChatX 前端启动脚本

echo "🚀 启动 ComChatX 前端..."

cd "$(dirname "$0")/frontend"

echo "📦 检查依赖..."
if [ ! -d "node_modules" ]; then
    echo "正在安装依赖..."
    npm install
fi

echo "✅ 启动开发服务器..."
echo "前端将在 http://localhost:5173 启动"
echo ""

npm run dev

