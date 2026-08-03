# NutriChef Presentation Plan & Run Guide

## 📋 Project Overview
NutriChef is an AI-powered smart kitchen assistant designed to reduce food waste and simplify meal planning.

### Key Features
1. **AI Recipe Generation**: Creates personalized recipes based on available ingredients, allergies, and health goals using DeepSeek LLM.
2. **Smart Food Scanner**: Identifies food and checks freshness using a Hybrid AI approach:
   - **Local AI (TensorFlow)**: Instantly detects food items and freshness status (Fresh vs. Rotten).
   - **Cloud AI (DeepSeek)**: Enriches results with shelf-life estimates and storage tips.
3. **Pantry Management**: Tracks inventory via Supabase cloud database.

### Tech Stack
- **Frontend**: React Native (Expo SDK 52)
- **Backend**: Python Flask
- **AI Models**: DeepSeek-V3 (API) + MobileNetV2 (Local Custom Model)
- **Database**: Supabase (PostgreSQL)

---

## 🚀 How to Run (Step-by-Step)

You need to keep **3 separate terminals** running at the same time.

### Terminal 1: Python Backend (The Brain)
1. Navigate to the backend folder: 
   `cd "Healthy-Food-Recipe-Planning--main\Healthy-Food-Recipe-Planning--main\backend\api"`
2. **Activate the Virtual Environment** (Crucial!):
   ```powershell
   .\venv\Scripts\Activate
   ```
   *(You must see `(venv)` at the start of your command line. If not, try again)*
3. Run the server:
   ```powershell
   python deepseek_api.py
   ```

### Terminal 2: Ngrok (The Bridge)
1. Open a new terminal.
2. Run ngrok on port 5002:
   ```powershell
   ngrok http 5002
   ```
3. **CRITICAL STEP**: 
   - Copy the "Forwarding" URL (e.g., `https://xxxx-xx.ngrok-free.app`).
   - Open file: `nutrichef-global\src\config.js`.
   - Update `PYTHON_BACKEND_URL` with this new link.
   - **Save the file**.

### Terminal 3: Mobile App (The UI)
1. Navigate to the frontend folder:
   `cd nutrichef-global`
2. Start the app with tunnel:
   ```powershell
   npx expo start --tunnel
   ```
3. Scan the QR code with your phone (Expo Go app).

---

## 🎤 Demo Script Checklist
1.  **Intro**: "This is NutriChef, an app that helps you cook with what you have."
2.  **Login**: Show the seamless custom authentication.
3.  **Scan Feature (The "Wow" Factor)**: 
    - Tap "Scan Food".
    - Take a picture of an item (e.g., Apple).
    - **Highlight**: "It uses local AI to detect freshness instantly, then asks the Cloud for storage tips."
4.  **Recipe Generation**:
    - Select a few ingredients from the fridge.
    - Generate a "Low Calorie" recipe.
    - Show the detailed instructions provided by DeepSeek.
