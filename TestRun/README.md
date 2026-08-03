# 🍳 NutriChef - Local Development Backup

> **⚠️ This is the LOCAL DEVELOPMENT version**  
> For production deployment, see the separate GlobalHost/Railway repository.

## 📖 Overview

NutriChef is an AI-powered recipe planning and food management mobile application built with React Native (Expo) and Python Flask backend.

### Key Features
- 🔐 Custom authentication system
- 📦 Smart inventory management with expiry tracking
- 🤖 AI-powered recipe generation using DeepSeek API
- 📸 Food freshness detection using ML (TensorFlow/Keras)
- 💾 Recipe saving and management
- 🎨 Dark mode support
- 🌍 Multi-language support (i18next)
- 🍽️ Dietary preference management

---

## 🏗️ Project Structure

```
TestRun/
├── nutrichef-global/                    # Mobile App (React Native + Expo)
│   ├── src/
│   │   ├── screens/                     # All app screens
│   │   │   ├── HomeScreen.js
│   │   │   ├── LoginScreen.js
│   │   │   ├── RegisterScreen.js
│   │   │   ├── InventoryScreen.js
│   │   │   ├── RecipeScreen.js
│   │   │   ├── RecipeDetailScreen.js
│   │   │   ├── SavedRecipesScreen.js
│   │   │   ├── ProfileScreen.js
│   │   │   └── ScanItemScreen.js
│   │   ├── contexts/
│   │   │   ├── AuthContext.js           # Authentication state
│   │   │   └── SettingsContext.js       # App settings
│   │   ├── config.js                    # Environment configuration
│   │   └── supabaseClient.js            # Supabase client
│   ├── ml_resources/                    # ML models for food scanning
│   │   ├── food_model.py
│   │   └── class_indices.json
│   ├── assets/                          # Images, icons
│   ├── App.js                           # Main app entry
│   └── package.json
│
└── Healthy-Food-Recipe-Planning--main/
    └── Healthy-Food-Recipe-Planning--main/
        └── backend/
            └── api/                     # Python Flask Backend
                ├── deepseek_api.py      # Main API server
                ├── deepseek_recommender.py
                ├── food_freshness_service.py
                ├── supabase_recipe_generator.py
                ├── requirements-prod.txt
                └── quick_test.py        # Backend test script
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** (v18 or higher) - [Download](https://nodejs.org/)
- **Python** (v3.9 or higher) - [Download](https://www.python.org/)
- **Expo Go** app on your mobile device
- **Supabase Account** - [Sign up](https://supabase.com/)
- **DeepSeek API Key** - [Get key](https://platform.deepseek.com/)

### Installation

#### 1. Clone Repository
```bash
git clone https://github.com/RJieYuso/nutrichef-api-back-up.git
cd nutrichef-api-back-up
```

#### 2. Setup Backend

```bash
cd "Healthy-Food-Recipe-Planning--main/Healthy-Food-Recipe-Planning--main/backend/api"

# Install dependencies
pip install -r requirements-prod.txt

# Set environment variable (PowerShell)
$env:DEEPSEEK_API_KEY="your_deepseek_api_key_here"

# Run backend
python deepseek_api.py
```

Backend will run on `http://localhost:5002`

#### 3. Setup Mobile App

```bash
cd nutrichef-global

# Install dependencies
npm install

# Start Expo
npm start
```

Scan the QR code with Expo Go app to run on your device.

---

## 🧪 Testing

### Quick Backend Test
```bash
cd "Healthy-Food-Recipe-Planning--main/Healthy-Food-Recipe-Planning--main/backend/api"
python quick_test.py
```

### Full Testing
See [LOCAL_VERSION_TESTING.md](./LOCAL_VERSION_TESTING.md) for comprehensive testing checklist.

---

## ⚙️ Configuration

### Backend Configuration

Create `.env` file in `backend/api/`:
```env
DEEPSEEK_API_KEY=your_key_here
SUPABASE_URL=https://icsoywmvqyqcqtlfefsx.supabase.co
SUPABASE_KEY=your_supabase_anon_key
```

### Mobile App Configuration

Update `nutrichef-global/src/config.js`:

```javascript
development: {
    PYTHON_BACKEND_URL: 'http://localhost:5002', // For emulator
    // OR
    PYTHON_BACKEND_URL: 'https://your-ngrok-url.ngrok-free.app', // For physical device
    SUPABASE_URL: 'https://icsoywmvqyqcqtlfefsx.supabase.co',
    SUPABASE_ANON_KEY: 'your_key_here',
}
```

---

## 📱 Features Breakdown

### Authentication
- Custom email/password authentication
- Direct database queries (no Supabase Auth)
- Secure password handling
- Session management with AsyncStorage

### Inventory Management
- Add/Edit/Delete food items
- Expiry date tracking
- Quantity management
- Swipe-to-delete functionality

### AI Recipe Generation
- Powered by DeepSeek API
- Generates 5 recipes (3 simple, 2 normal)
- Sorted by missing ingredients
- Considers dietary preferences
- ~30-60 second generation time

### Food Scanning
- ML-powered freshness detection
- TensorFlow/Keras model
- Fresh/Rotten classification
- Confidence scoring

### Saved Recipes
- Bookmark favorite recipes
- Persistent storage in Supabase
- Swipe-to-delete management
- Full recipe details

### Meal Directions
- Set dietary preferences (vegetarian, allergies, etc.)
- Toggle ON/OFF for recipe generation
- Stored in user profile

---

## 🗄️ Database Schema

### Supabase Tables

**`public.users`**
```sql
- id (uuid, primary key)
- email (text, unique)
- password (text, hashed)
- meal_direction (text, nullable)
- created_at (timestamp)
```

**`inventory`**
```sql
- id (uuid, primary key)
- user_id (uuid, foreign key)
- name (text)
- quantity (integer)
- expiry_date (date)
- created_at (timestamp)
```

**`saved_recipes`**
```sql
- id (uuid, primary key)
- user_id (uuid, foreign key)
- recipe_name (text)
- ingredients (jsonb)
- instructions (text)
- difficulty (text)
- missing_items (jsonb)
- created_at (timestamp)
```

---

## 🔧 Tech Stack

### Frontend (Mobile App)
- **Framework:** React Native with Expo
- **Navigation:** React Navigation
- **State Management:** Context API
- **Storage:** AsyncStorage
- **Database:** Supabase (PostgreSQL)
- **Image Picker:** expo-image-picker
- **Internationalization:** i18next

### Backend (API)
- **Framework:** Flask (Python)
- **AI:** DeepSeek API
- **ML:** TensorFlow/Keras
- **Database Client:** Supabase Python SDK
- **CORS:** Flask-CORS

---

## 📦 Dependencies

### Mobile App (`package.json`)
```json
{
  "dependencies": {
    "@react-navigation/native": "^6.1.9",
    "@supabase/supabase-js": "^2.87.1",
    "expo": "^52.0.0",
    "expo-image-picker": "~16.0.6",
    "react-native": "^0.76.9",
    "i18next": "^23.7.6",
    "axios": "^1.6.2"
  }
}
```

### Backend (`requirements-prod.txt`)
```
Flask==3.0.0
flask-cors==4.0.0
requests==2.31.0
supabase==2.3.0
tensorflow==2.15.0
Pillow==10.2.0
numpy==1.26.3
```

---

## 🐛 Known Issues

1. **Recipe Generation Time:** Takes 30-60 seconds (DeepSeek API processing)
2. **ML Model Size:** Large model files (~6GB) excluded from Git
3. **Ngrok Requirement:** Physical device testing requires ngrok tunnel

---


---

## 📝 Testing Checklist

Before each backup, ensure:
- [ ] All authentication flows work
- [ ] Inventory CRUD operations functional
- [ ] Recipe generation produces 5 recipes
- [ ] Food scanning model loads correctly
- [ ] Saved recipes persist
- [ ] Meal directions toggle works
- [ ] Dark mode has no white flashes
- [ ] All data persists in Supabase

See [LOCAL_VERSION_TESTING.md](./LOCAL_VERSION_TESTING.md) for detailed checklist.

---

## 📄 License

This is a private backup repository for development purposes.

---

## 👤 Author

**RJieYuso**

---

## 📞 Support

For issues or questions, please create an issue in this repository.

---

**Last Updated:** December 18, 2024  
**Version:** Local Development v1.0  
**Status:** ✅ Tested and Ready for Backup
