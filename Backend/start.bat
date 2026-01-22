@echo off
REM Quick start script for GroceryPOS Backend (Windows)

echo 🚀 Starting GroceryPOS Backend...

REM Check if .env exists
if not exist .env (
    echo ⚠️  .env file not found. Creating from .env.example...
    copy .env.example .env
    echo ✅ Please edit .env file with your database credentials
    pause
    exit /b 1
)

REM Check if virtual environment exists
if not exist venv (
    echo 📦 Creating virtual environment...
    python -m venv venv
)

REM Activate virtual environment
call venv\Scripts\activate.bat

REM Install dependencies
echo 📥 Installing dependencies...
pip install -r requirements.txt

REM Run migration
echo 🗄️  Running database migration...
python migrate_database.py

REM Start server
echo ✅ Starting server...
python run.py

pause
