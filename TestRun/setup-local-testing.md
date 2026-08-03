# 🧪 Setup Local Testing

## 1. Prerequisites
Since you are missing Node.js, you MUST install it first to run the mobile app.

1. **Install Node.js (LTS Version)**
   - Download: [https://nodejs.org/](https://nodejs.org/)
   - Install the "LTS" version.

2. **Verify Installation**
   Open PowerShell/Terminal and run:
   ```bash
   node -v
   npm -v
   ```

## 2. Setup Mobile App
Once Node is installed:

1. **Install Dependencies**
   ```bash
   cd nutrichef-global
   npm install
   ```

2. **Start the App**
   ```bash
   npm start
   ```
   - Build for Android: `npm run android`
   - Build for iOS: `npm run ios`

## 3. Setup Backend (Local)
1. **Install Python Deps**
   ```bash
   cd Healthy-Food-Recipe-Planning--main/Healthy-Food-Recipe-Planning--main/backend/api
   pip install -r requirements-prod.txt
   ```

2. **Run Backend**
   ```bash
   # Linux/Mac
   export DEEPSEEK_API_KEY="your_key"
   python deepseek_api.py

   # Windows (PowerShell)
   $env:DEEPSEEK_API_KEY="your_key"
   python deepseek_api.py
   ```

3. **Expose to World (Optional)**
   If testing on real mobile device:
   - Install `ngrok`
   - Run: `ngrok http 5002`
   - Update `src/config.js` with the ngrok URL.
