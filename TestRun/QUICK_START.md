# 🚀 Quick Start - Local Testing Guide

## ⚡ Fast Track (5 Minutes)

### Step 1: Start Backend (Terminal 1)
```powershell
cd "c:/Users/ASUS/OneDrive - Personal-423/U info/Year3Sem1(Latest)/Workshop2/TestRun/Healthy-Food-Recipe-Planning--main/Healthy-Food-Recipe-Planning--main/backend/api"

# Set your DeepSeek API key
$env:DEEPSEEK_API_KEY="your_key_here"

# Run backend
python deepseek_api.py
```

**Expected:** Server running on `http://0.0.0.0:5002`

---

### Step 2: Test Backend (Terminal 2)
```powershell
cd "c:/Users/ASUS/OneDrive - Personal-423/U info/Year3Sem1(Latest)/Workshop2/TestRun/Healthy-Food-Recipe-Planning--main/Healthy-Food-Recipe-Planning--main/backend/api"

python quick_test.py
```

**Expected:** All tests pass ✅

---

### Step 3: Start Mobile App (Terminal 3)
```powershell
cd "c:/Users/ASUS/OneDrive - Personal-423/U info/Year3Sem1(Latest)/Workshop2/TestRun/nutrichef-global"

npm start
```

**Options:**
- Press `a` for Android emulator
- Press `i` for iOS simulator  
- Scan QR code with Expo Go app on your phone

---

## 📱 Testing on Physical Device

If testing on a real phone (not emulator):

### 1. Install ngrok
```powershell
# Download from: https://ngrok.com/download
# Or use chocolatey:
choco install ngrok
```

### 2. Start ngrok tunnel
```powershell
ngrok http 5002
```

**Copy the HTTPS URL** (e.g., `https://abc123.ngrok-free.app`)

### 3. Update Mobile App Config
Edit `nutrichef-global/src/config.js`:
```javascript
development: {
    PYTHON_BACKEND_URL: 'https://abc123.ngrok-free.app', // Your ngrok URL
    // ... rest of config
}
```

### 4. Restart Expo
```powershell
# Press Ctrl+C to stop, then:
npm start
```

---

## ✅ Quick Feature Test

Once the app is running:

1. **Register Account**
   - Email: `test@example.com`
   - Password: `Test1234!`

2. **Add Inventory Item**
   - Home → View Inventory → Add Item
   - Name: `Chicken`
   - Quantity: `2`
   - Expiry: Tomorrow's date

3. **Generate Recipes**
   - Home → AI Chef
   - Wait 30-60 seconds
   - Should see 5 recipes

4. **Save a Recipe**
   - Tap on a recipe
   - Tap star icon
   - Go to Saved Recipes to verify

5. **Test Dark Mode**
   - Profile → Toggle Dark Mode
   - Navigate between screens (no white flashes)

---

## 🐛 Troubleshooting

### Backend won't start
```powershell
# Check if port 5002 is in use
netstat -ano | findstr :5002

# Kill process if needed
taskkill /PID <process_id> /F
```

### Mobile app can't connect to backend
1. **Emulator:** Use `http://localhost:5002`
2. **Physical device:** Use ngrok URL
3. Check firewall isn't blocking port 5002

### Recipe generation fails
- Verify DeepSeek API key is set
- Check backend logs for errors
- Ensure you have inventory items

### Food scanning doesn't work
- ML model files might be missing
- Check `ml_resources/` folder has model files
- Model is ~6GB, may need to download separately

---

## 📊 What to Test

### Critical Features ✅
- [ ] Login/Register
- [ ] Add/Edit/Delete inventory items
- [ ] Generate recipes (5 recipes: 3 simple, 2 normal)
- [ ] Save recipes
- [ ] View saved recipes
- [ ] Dark mode (no white flashes)

### Optional Features
- [ ] Food scanning (if ML model available)
- [ ] Meal directions toggle
- [ ] Cook recipe (deletes ingredients)

---

## 🎯 Success Criteria

Your local version is ready for backup if:

1. ✅ Backend health check passes
2. ✅ Recipe generation works (gets 5 recipes)
3. ✅ Mobile app connects to backend
4. ✅ Can register/login
5. ✅ Inventory CRUD works
6. ✅ Data persists in Supabase
7. ✅ Dark mode works without flashes

---

## 📝 Next Steps

Once testing is complete:

1. **Document any issues** in `LOCAL_VERSION_TESTING.md`
2. **Fix critical bugs** (if any)
3. **Re-test** to confirm fixes
4. **Backup to GitHub** using commands in `README.md`

---

## 🆘 Need Help?

- Check `LOCAL_VERSION_TESTING.md` for detailed testing steps
- Review `README.md` for full documentation
- Check backend logs for API errors
- Check Expo console for mobile app errors

---

**Estimated Time:** 15-30 minutes for full testing  
**Last Updated:** December 18, 2024
