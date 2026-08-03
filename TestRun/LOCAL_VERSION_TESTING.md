# 🧪 NutriChef Local Version - Final Testing Plan

## 📋 Overview
This document outlines the complete testing procedure for the **local development version** of NutriChef before backing it up to GitHub.

---

## 🎯 Testing Objectives
1. ✅ Verify all core features work locally
2. ✅ Ensure backend API is functioning correctly
3. ✅ Test mobile app on physical device
4. ✅ Validate data persistence (Supabase)
5. ✅ Check ML model integration (food scanning)
6. ✅ Confirm AI recipe generation works

---

## 📦 Project Structure

```
TestRun/
├── nutrichef-global/                    # Mobile App (React Native + Expo)
│   ├── src/
│   │   ├── screens/                     # All app screens
│   │   ├── contexts/                    # Auth, Settings contexts
│   │   ├── config.js                    # Environment configuration
│   │   └── supabaseClient.js            # Supabase client
│   ├── ml_resources/                    # ML models for food scanning
│   ├── assets/                          # Images, icons
│   └── package.json
│
└── Healthy-Food-Recipe-Planning--main/
    └── Healthy-Food-Recipe-Planning--main/
        └── backend/
            └── api/                     # Python Flask Backend
                ├── deepseek_api.py      # Main API server
                ├── food_freshness_service.py
                └── requirements-prod.txt
```

---

## 🔧 Pre-Testing Setup

### 1. Environment Variables
Create a `.env` file in the backend directory:

```bash
# Backend API (.env in backend/api/)
DEEPSEEK_API_KEY=your_deepseek_api_key_here
SUPABASE_URL=https://icsoywmvqyqcqtlfefsx.supabase.co
SUPABASE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imljc295d212cXlxY3F0bGZlZnN4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU2OTgzNzIsImV4cCI6MjA4MTI3NDM3Mn0.dy33uJZ_f9iOe1QijUe4nRFKUSG5ugpTNZ8nCyN-M2Q
```

### 2. Install Dependencies

**Backend:**
```bash
cd "Healthy-Food-Recipe-Planning--main/Healthy-Food-Recipe-Planning--main/backend/api"
pip install -r requirements-prod.txt
```

**Mobile App:**
```bash
cd nutrichef-global
npm install
```

---

## 🧪 Testing Checklist

### Phase 1: Backend API Testing

#### 1.1 Start Backend Server
```bash
cd "Healthy-Food-Recipe-Planning--main/Healthy-Food-Recipe-Planning--main/backend/api"

# Set environment variable (PowerShell)
$env:DEEPSEEK_API_KEY="your_key_here"

# Run server
python deepseek_api.py
```

**Expected Output:**
```
✓ Server running on http://0.0.0.0:5002
✓ CORS enabled
✓ DeepSeek API key loaded
```

#### 1.2 Test Backend Endpoints

**Test 1: Health Check**
```bash
curl http://localhost:5002/health
```
Expected: `{"status": "healthy"}`

**Test 2: Recipe Generation**
```bash
curl -X POST http://localhost:5002/generate-recipes \
  -H "Content-Type: application/json" \
  -d '{
    "ingredients": ["chicken", "rice", "tomato"],
    "user_id": "test-user-123"
  }'
```
Expected: JSON with 5 recipes (3 simple, 2 normal)

**Test 3: Food Freshness Detection**
```bash
curl -X POST http://localhost:5002/predict-freshness \
  -F "image=@path/to/test/image.jpg"
```
Expected: `{"prediction": "fresh/rotten", "confidence": 0.95}`

---

### Phase 2: Mobile App Testing

#### 2.1 Configure for Local Testing

**Update `src/config.js`:**
- For **same computer testing**: Use `http://localhost:5002`
- For **physical device testing**: Use ngrok URL

```javascript
development: {
    PYTHON_BACKEND_URL: 'http://localhost:5002', // Same computer
    // OR
    PYTHON_BACKEND_URL: 'https://your-ngrok-url.ngrok-free.app', // Physical device
}
```

#### 2.2 Start Mobile App
```bash
cd nutrichef-global
npm start
```

**Options:**
- Press `a` - Android emulator
- Press `i` - iOS simulator
- Scan QR code - Physical device (Expo Go app)

---

### Phase 3: Feature Testing

#### ✅ 3.1 Authentication Flow
- [ ] **Register new account**
  - Enter email, password, confirm password
  - Check if user created in Supabase `public.users` table
- [ ] **Login**
  - Use registered credentials
  - Verify successful login
- [ ] **Logout**
  - Confirm session cleared
- [ ] **Password validation**
  - Test weak passwords (should fail)
  - Test password mismatch (should fail)

#### ✅ 3.2 Home Screen
- [ ] **Quick Actions visible**
  - Scan Item
  - View Inventory
  - AI Chef
  - Saved Recipes
- [ ] **Navigation works**
  - Tap each quick action
  - Verify correct screen opens

#### ✅ 3.3 Inventory Management
- [ ] **Add item manually**
  - Fill in: name, quantity, expiry date
  - Save and verify in Supabase `inventory` table
- [ ] **Edit item**
  - Update quantity/expiry
  - Confirm changes persist
- [ ] **Delete item**
  - Swipe to delete
  - Verify removed from database
- [ ] **View all items**
  - Check list displays correctly
  - Test sorting (by expiry date)

#### ✅ 3.4 Food Scanning (ML Model)
- [ ] **Scan fresh food**
  - Take photo of fresh produce
  - Verify prediction: "Fresh"
  - Check confidence score
- [ ] **Scan rotten food**
  - Take photo of spoiled food
  - Verify prediction: "Rotten"
- [ ] **Add scanned item to inventory**
  - After scan, save to inventory
  - Confirm appears in inventory list

#### ✅ 3.5 AI Recipe Generation
- [ ] **Generate recipes with inventory**
  - Ensure inventory has items
  - Tap "AI Chef"
  - Wait for recipe generation (~30-60 seconds)
  - Verify 5 recipes returned (3 simple, 2 normal)
- [ ] **Check recipe details**
  - Tap on a recipe
  - Verify: ingredients, instructions, missing items
- [ ] **Recipes sorted by missing items**
  - Confirm recipes with 0 missing items appear first
- [ ] **Save recipe**
  - Tap star icon
  - Check saved in `saved_recipes` table
- [ ] **Cook recipe (delete ingredients)**
  - Tap cook icon
  - Verify used ingredients removed from inventory

#### ✅ 3.6 Meal Directions (Dietary Preferences)
- [ ] **Set meal directions**
  - Go to Profile → Meal Direction
  - Add: "Vegetarian, no nuts"
  - Save and verify in `users` table
- [ ] **Toggle meal directions ON**
  - Enable toggle in Profile
  - Generate recipes
  - Verify recipes follow dietary restrictions
- [ ] **Toggle meal directions OFF**
  - Disable toggle
  - Generate recipes
  - Verify recipes ignore restrictions

#### ✅ 3.7 Saved Recipes
- [ ] **View saved recipes**
  - Navigate to Saved Recipes screen
  - Verify all saved recipes display
- [ ] **Delete saved recipe**
  - Swipe to delete
  - Confirm removed from database
- [ ] **Open recipe details**
  - Tap on saved recipe
  - Verify full details shown

#### ✅ 3.8 Profile Screen
- [ ] **Display user info**
  - Email shown correctly
- [ ] **Dark mode toggle**
  - Switch to dark mode
  - Verify all screens update
  - No white flashes during navigation
- [ ] **Language selection**
  - Change language (if implemented)
  - Verify UI updates

---

### Phase 4: Data Persistence Testing

#### 4.1 Supabase Database Checks

**Tables to verify:**
1. **`public.users`**
   - User accounts created
   - Meal directions saved
   - Settings persisted

2. **`inventory`**
   - Items added/updated/deleted correctly
   - Expiry dates stored properly

3. **`saved_recipes`**
   - Recipes saved with full details
   - User ID linked correctly

**SQL Queries (run in Supabase dashboard):**
```sql
-- Check users
SELECT * FROM public.users ORDER BY created_at DESC LIMIT 5;

-- Check inventory
SELECT * FROM inventory WHERE user_id = 'your-test-user-id';

-- Check saved recipes
SELECT * FROM saved_recipes WHERE user_id = 'your-test-user-id';
```

---

### Phase 5: Error Handling Testing

#### 5.1 Network Errors
- [ ] **Offline mode**
  - Disable internet
  - Try to generate recipes
  - Verify error message shown
- [ ] **Backend down**
  - Stop backend server
  - Try to use AI features
  - Verify graceful error handling

#### 5.2 Invalid Inputs
- [ ] **Empty inventory**
  - Try to generate recipes with no items
  - Verify appropriate message
- [ ] **Invalid image upload**
  - Upload non-food image
  - Check error handling
- [ ] **Malformed data**
  - Test with special characters in inputs

---

## 📊 Test Results Template

### Test Session: [Date/Time]

| Feature | Status | Notes |
|---------|--------|-------|
| Backend Health | ⬜ Pass / ⬜ Fail | |
| Recipe Generation | ⬜ Pass / ⬜ Fail | |
| Food Scanning | ⬜ Pass / ⬜ Fail | |
| Authentication | ⬜ Pass / ⬜ Fail | |
| Inventory CRUD | ⬜ Pass / ⬜ Fail | |
| Saved Recipes | ⬜ Pass / ⬜ Fail | |
| Meal Directions | ⬜ Pass / ⬜ Fail | |
| Dark Mode | ⬜ Pass / ⬜ Fail | |
| Data Persistence | ⬜ Pass / ⬜ Fail | |

**Overall Status:** ⬜ Ready for Backup / ⬜ Needs Fixes

---

## 🐛 Known Issues (To Document)

1. **Issue:** [Description]
   - **Severity:** High / Medium / Low
   - **Steps to Reproduce:** 
   - **Expected Behavior:**
   - **Actual Behavior:**
   - **Fix Status:** ⬜ Fixed / ⬜ Pending / ⬜ Won't Fix

---

## 🚀 Post-Testing: Backup to GitHub

Once all tests pass:

### 1. Initialize Git Repository
```bash
cd "c:/Users/ASUS/OneDrive - Personal-423/U info/Year3Sem1(Latest)/Workshop2/TestRun"
git init
```

### 2. Create `.gitignore`
```
# Dependencies
node_modules/
.venv/
__pycache__/

# Environment
.env
*.env

# Build outputs
.expo/
dist/
build/

# OS files
.DS_Store
Thumbs.db

# Large files
*.zip
ml_resources/*.h5
ml_resources/*.keras
```

### 3. Commit and Push
```bash
git add .
git commit -m "Local version - Final tested build"
git branch -M main
git remote add origin https://github.com/RJieYuso/nutrichef-api-back-up.git
git push -u origin main
```

---

## 📝 Notes

- **Testing Duration:** Allocate 2-3 hours for complete testing
- **Test Environment:** Windows 11, Expo Go on Android/iOS
- **Backend:** Python 3.x, Flask
- **Database:** Supabase (PostgreSQL)
- **AI Model:** DeepSeek API
- **ML Model:** TensorFlow/Keras (food freshness detection)

---

## ✅ Sign-off

**Tested By:** _______________  
**Date:** _______________  
**Version:** Local Development v1.0  
**Status:** ⬜ Approved for Backup

---

*This is the LOCAL version for development and testing. The production version is deployed separately on Railway/GlobalHost.*
