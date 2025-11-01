#!/bin/bash

# ComChatX Backend 启动脚本

echo "🚀 Starting ComChatX Backend Server..."

# 检查 Python 版本
python_version=$(python3 --version 2>&1 | awk '{print $2}')
echo "📦 Python version: $python_version"

# 检查依赖
if [ ! -d "venv" ]; then
    echo "📦 Creating virtual environment..."
    python3 -m venv venv
fi

echo "📦 Activating virtual environment..."
source venv/bin/activate

echo "📦 Installing dependencies..."
pip install -q -r requirements.txt

# 检查 .env 文件
if [ ! -f ".env" ]; then
    echo "⚠️  Warning: .env file not found. Using defaults..."
    echo "Please create .env file from .env.example"
fi

echo "🗄️  Initializing database..."
echo "Database will be created automatically on first run"

echo ""
echo "✅ Starting server at http://localhost:8000"
echo "📚 API docs available at http://localhost:8000/docs"
echo ""

# 启动服务器
python main.py

