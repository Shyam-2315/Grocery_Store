#!/bin/bash
# Quick start script for GroceryPOS Backend

echo "🚀 Starting GroceryPOS Backend..."

# Check if .env exists
if [ ! -f .env ]; then
    echo "⚠️  .env file not found. Creating from .env.example..."
    cp .env.example .env
    echo "✅ Please edit .env file with your database credentials"
    exit 1
fi

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    echo "📦 Creating virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment
source venv/bin/activate

# Install dependencies
echo "📥 Installing dependencies..."
pip install -r requirements.txt

# Run migration
echo "🗄️  Running database migration..."
python migrate_database.py

# Start server
echo "✅ Starting server..."
python run.py
