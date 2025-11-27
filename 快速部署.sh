#!/bin/bash

# ⚠️ 此脚本已废弃 - 项目已迁移到 Vercel 部署
# 请参考 DEPLOYMENT.md 了解新的部署方式
# 
# ComChatX 最简单公开部署脚本（旧版）
# 一键启动前后端并通过ngrok暴露（已废弃）

clear
echo "╔════════════════════════════════════════════════════════╗"
echo "║   🚀 ComChatX 一键公开部署                               ║"
echo "╚════════════════════════════════════════════════════════╝"
echo ""

# 切换到脚本所在目录
cd "$(dirname "$0")"
echo "📁 当前目录: $(pwd)"
echo ""

# 检查ngrok是否安装
if ! command -v ngrok &> /dev/null; then
    echo "❌ ngrok未安装！"
    echo ""
    echo "📦 请先安装ngrok:"
    echo "   brew install ngrok/ngrok/ngrok"
    echo ""
    echo "   或访问: https://ngrok.com/download"
    echo ""
    exit 1
fi

echo "✅ ngrok已安装"
echo ""

# 检查后端是否运行
echo "🔍 检查后端服务..."
if curl -s http://localhost:8000/api/docs > /dev/null 2>&1; then
    echo "✅ 后端已在运行 (http://localhost:8000)"
else
    echo "⚠️  后端未运行，正在启动..."
    echo ""
    
    cd backend
    
    # 创建虚拟环境（如果不存在）
    if [ ! -d "venv" ]; then
        echo "📦 创建虚拟环境..."
        python3 -m venv venv
    fi
    
    # 激活虚拟环境
    source venv/bin/activate
    
    # 安装依赖（如果需要）
    if [ ! -f "venv/.installed" ]; then
        echo "📦 安装依赖..."
        pip install -q -r requirements.txt
        touch venv/.installed
    fi
    
    # 检查.env文件
    if [ ! -f ".env" ]; then
        echo "⚠️  警告: .env 文件不存在，使用默认配置"
    fi
    
    # 启动后端（后台运行）
    echo "🚀 启动后端..."
    python3 main.py > ../backend.log 2>&1 &
    BACKEND_PID=$!
    cd ..
    
    # 等待后端启动
    echo "⏳ 等待后端启动..."
    for i in {1..10}; do
        sleep 1
        if curl -s http://localhost:8000/api/docs > /dev/null 2>&1; then
            echo "✅ 后端已启动成功！ (PID: $BACKEND_PID)"
            break
        fi
        if [ $i -eq 10 ]; then
            echo "❌ 后端启动失败，请查看 backend.log"
            kill $BACKEND_PID 2>/dev/null
            exit 1
        fi
    done
fi

echo ""

# 检查前端是否运行
echo "🔍 检查前端服务..."
if curl -s http://localhost:3000 > /dev/null 2>&1; then
    echo "✅ 前端已在运行 (http://localhost:3000)"
else
    echo "⚠️  前端未运行，正在启动..."
    echo ""
    
    cd frontend
    
    # 检查node_modules
    if [ ! -d "node_modules" ]; then
        echo "📦 安装前端依赖..."
        npm install
    fi
    
    # 临时允许所有CORS（用于测试）
    echo "🔧 配置CORS..."
    
    # 修改后端main.py临时允许所有来源
    cd ../backend
    if ! grep -q 'allow_origins=\["\*"\]' main.py 2>/dev/null; then
        # 备份原文件
        cp main.py main.py.bak
        
        # 修改CORS配置
        python3 << 'PYTHON_SCRIPT'
import re

with open('main.py', 'r') as f:
    content = f.read()

# 临时修改CORS配置
content = re.sub(
    r'allow_origins=settings\.cors_origins_list',
    'allow_origins=["*"]  # 临时允许所有来源（用于公开访问）',
    content
)

with open('main.py', 'w') as f:
    f.write(content)

print("✅ CORS配置已更新")
PYTHON_SCRIPT
        
        # 重启后端
        echo "🔄 重启后端以应用CORS配置..."
        pkill -f "python.*main.py" 2>/dev/null
        sleep 2
        
        source venv/bin/activate
        python3 main.py > ../backend.log 2>&1 &
        sleep 3
    fi
    cd ../frontend
    
    # 启动前端（后台运行）
    echo "🚀 启动前端..."
    npm run dev > ../frontend.log 2>&1 &
    FRONTEND_PID=$!
    cd ..
    
    # 等待前端启动
    echo "⏳ 等待前端启动..."
    for i in {1..15}; do
        sleep 1
        if curl -s http://localhost:3000 > /dev/null 2>&1; then
            echo "✅ 前端已启动成功！ (PID: $FRONTEND_PID)"
            break
        fi
        if [ $i -eq 15 ]; then
            echo "⚠️  前端可能还在启动中..."
        fi
    done
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "🌐 启动ngrok暴露前端服务..."
echo ""
echo "📌 下面的HTTPS URL就是你的公开访问地址！"
echo "   复制这个URL，分享给任何人即可访问"
echo ""
echo "📝 提示:"
echo "   - 后端: http://localhost:8000"
echo "   - 前端: http://localhost:3000"
echo "   - 公开: 下面ngrok提供的HTTPS URL"
echo ""
echo "⚠️  按 Ctrl+C 停止ngrok和服务"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# 启动ngrok（检查token配置）
if ngrok http 3000 2>&1 | grep -q "authtoken"; then
    echo ""
    echo "⚠️  ngrok需要配置authtoken"
    echo ""
    echo "📝 请选择："
    echo "   1) 注册账号获取token (推荐，URL更稳定)"
    echo "      访问: https://dashboard.ngrok.com/signup"
    echo "      然后运行: ngrok config add-authtoken YOUR_TOKEN"
    echo ""
    echo "   2) 直接运行ngrok (无账号模式，URL每次变化)"
    echo ""
    read -p "按Enter继续使用无账号模式，或Ctrl+C退出配置token..."
    ngrok http 3000
else
    # 启动ngrok
    ngrok http 3000
fi

# 清理：停止后台进程
echo ""
echo "🛑 正在停止服务..."
pkill -f "python.*main.py" 2>/dev/null
pkill -f "vite" 2>/dev/null

# 恢复CORS配置（如果有备份）
if [ -f "backend/main.py.bak" ]; then
    echo "🔄 恢复CORS配置..."
    mv backend/main.py.bak backend/main.py
fi

echo "✅ 服务已停止"

