#!/bin/bash
echo "🚀 Preparing Backend Deployment..."

# 1. Navigate to backend directory
cd Healthy-Food-Recipe-Planning--main/Healthy-Food-Recipe-Planning--main/backend/api

# 2. Check for required files
if [ ! -f "Procfile" ]; then
    echo "❌ Error: Procfile missing!"
    exit 1
fi

if [ ! -f "requirements-prod.txt" ]; then
    echo "❌ Error: requirements-prod.txt missing!"
    exit 1
fi

echo "✅ Deployment files ready."

# 3. Instructions for User
echo "=============================================="
echo "MANUAL DEPLOYMENT STEPS (One-Time Setup):"
echo "1. Push this code to GitHub."
echo "2. Go to https://dashboard.render.com/"
echo "3. Click 'New +', select 'Web Service'."
echo "4. Connect your GitHub repository."
echo "5. Settings:"
echo "   - Name: nutrichef-api"
echo "   - Root Directory: Healthy-Food-Recipe-Planning--main/Healthy-Food-Recipe-Planning--main/backend/api"
echo "   - Environment: Python 3"
echo "   - Build Command: pip install -r requirements-prod.txt"
echo "   - Start Command: gunicorn deepseek_api:app"
echo "6. Environment Variables (Add these!):"
echo "   - PYTHON_VERSION: 3.9.0"
echo "   - DEEPSEEK_API_KEY: your_key_here"
echo "=============================================="
echo "Ready to push?"
read -p "Press Enter to continue..."
