# 🔧 Fix Mobile App Connection - Quick Guide

## Problem
Mobile app is trying to connect to old ngrok URL:
```
https://joesph-corvine-ickily.ngrok-free.dev
```

But your backend is running locally on `http://localhost:5002`

---

## Solution: Update Config with New Ngrok URL

### Step 1: Get Ngrok URL

Look at the **ngrok terminal** (the one running `ngrok http 5002`).

You should see something like:
```
Forwarding    https://abc-123-def.ngrok-free.app -> http://localhost:5002
```

**Copy that HTTPS URL** (e.g., `https://abc-123-def.ngrok-free.app`)

---

### Step 2: Update Config File

Open: `nutrichef-global/src/config.js`

**Change line 7 from:**
```javascript
PYTHON_BACKEND_URL: 'https://joesph-corvine-ickily.ngrok-free.dev',
```

**To your new ngrok URL:**
```javascript
PYTHON_BACKEND_URL: 'https://YOUR-NEW-NGROK-URL.ngrok-free.app',
```

**Save the file.**

---

### Step 3: Restart Expo

In the Expo terminal:
1. Press `Ctrl+C` to stop
2. Run: `npx expo start --clear --tunnel`
3. Reload the app on your phone

---

## Alternative: Use Local Network (If on Same WiFi)

If your phone and computer are on the **same WiFi network**:

### Step 1: Find Your Computer's IP Address
```powershell
ipconfig
```

Look for "IPv4 Address" under your WiFi adapter (e.g., `192.168.1.100`)

### Step 2: Update Config
```javascript
PYTHON_BACKEND_URL: 'http://192.168.1.100:5002',  // Use your actual IP
```

### Step 3: Update Backend CORS (if needed)
The backend should already allow all origins, so this should work.

---

## Quick Test After Update

Once you've updated the config and restarted:

1. **Open the app**
2. **Try scanning food** or **generating recipes**
3. **Check if it connects**

You should see requests in the backend terminal:
```
🎯 API CALL RECEIVED: /api/scan-food
```

---

## Current Status

✅ **Backend running:** `http://localhost:5002`  
✅ **Ngrok tunnel:** Running (get URL from terminal)  
✅ **Mobile app:** Running (needs config update)  
⏳ **Connection:** Waiting for config update

---

## After Fixing

Once connected, test these features:
- [ ] Food scanning
- [ ] Recipe generation
- [ ] Save recipes
- [ ] Inventory management

See [LOCAL_VERSION_TESTING.md](./LOCAL_VERSION_TESTING.md) for full checklist.
