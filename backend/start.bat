@echo off
REM ComChatX Backend 启动脚本 (Windows)

echo 🚀 Starting ComChatX Backend Server...

REM 检查 Python
python --version
if %errorlevel% neq 0 (
    echo ❌ Python not found. Please install Python 3.10+
    pause
    exit /b 1
)

REM 创建虚拟环境(如果不存在)
if not exist "venv" (
    echo 📦 Creating virtual environment...
    python -m venv venv
)

REM 激活虚拟环境
echo 📦 Activating virtual environment...
call venv\Scripts\activate.bat

REM 安装依赖
echo 📦 Installing dependencies...
pip install -q -r requirements.txt

REM 检查 .env 文件
if not exist ".env" (
    echo ⚠️ Warning: .env file not found
    echo Please create .env file from .env.example
)

echo.
echo ✅ Starting server at http://localhost:8000
echo 📚 API docs available at http://localhost:8000/docs
echo.

REM 启动服务器
python main.py

pause

