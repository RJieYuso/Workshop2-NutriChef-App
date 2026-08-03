# 📦 GitHub Backup Checklist

## Pre-Backup Verification

### ✅ Testing Complete
- [ ] Backend health check passes
- [ ] Recipe generation works (5 recipes)
- [ ] Mobile app runs successfully
- [ ] Authentication flows work
- [ ] Inventory CRUD operations functional
- [ ] Data persists in Supabase
- [ ] Dark mode works without issues
- [ ] All critical features tested (see `LOCAL_VERSION_TESTING.md`)

### ✅ Code Quality
- [ ] No sensitive data in code (API keys, passwords)
- [ ] Environment variables properly configured
- [ ] `.gitignore` file created
- [ ] README.md is complete and accurate
- [ ] Comments added for complex logic
- [ ] Console.log statements removed (or minimal)

### ✅ Documentation
- [ ] `README.md` - Project overview and setup
- [ ] `QUICK_START.md` - Fast testing guide
- [ ] `LOCAL_VERSION_TESTING.md` - Comprehensive test plan
- [ ] `setup-local-testing.md` - Original setup notes
- [ ] Code comments where needed

---

## Backup Process

### Step 1: Initialize Git Repository
```powershell
cd "c:/Users/ASUS/OneDrive - Personal-423/U info/Year3Sem1(Latest)/Workshop2/TestRun"

# Initialize git
git init
```

### Step 2: Verify .gitignore
```powershell
# Check .gitignore exists
cat .gitignore

# Should exclude:
# - node_modules/
# - .venv/
# - .env files
# - *.zip files
# - ML model files (*.h5, *.keras)
```

### Step 3: Stage Files
```powershell
# Add all files (respecting .gitignore)
git add .

# Check what will be committed
git status
```

**⚠️ IMPORTANT: Verify no sensitive files are staged!**
- No `.env` files
- No API keys in code
- No large binary files (>100MB)

### Step 4: Create Initial Commit
```powershell
git commit -m "Initial commit: Local development version - Tested and verified

Features:
- Custom authentication system
- AI recipe generation (DeepSeek API)
- Food freshness detection (ML model)
- Inventory management
- Saved recipes
- Meal directions/dietary preferences
- Dark mode support

Tested on: $(Get-Date -Format 'yyyy-MM-dd')
Status: All critical features working"
```

### Step 5: Add Remote Repository
```powershell
# Set main branch
git branch -M main

# Add remote
git remote add origin https://github.com/RJieYuso/nutrichef-api-back-up.git

# Verify remote
git remote -v
```

### Step 6: Push to GitHub
```powershell
# Push to GitHub
git push -u origin main
```

**If repository already exists:**
```powershell
# Force push (⚠️ WARNING: This will overwrite remote)
git push -u origin main --force
```

---

## Post-Backup Verification

### ✅ GitHub Repository Check
- [ ] Visit: https://github.com/RJieYuso/nutrichef-api-back-up
- [ ] Verify all files uploaded
- [ ] Check README.md displays correctly
- [ ] Confirm no sensitive data visible
- [ ] Verify `.gitignore` is working (no node_modules/, .env, etc.)

### ✅ File Count Verification
Expected structure:
```
nutrichef-api-back-up/
├── .gitignore
├── README.md
├── QUICK_START.md
├── LOCAL_VERSION_TESTING.md
├── setup-local-testing.md
├── deploy-backend.sh
├── nutrichef-global/
│   ├── src/
│   ├── assets/
│   ├── ml_resources/ (without large .h5/.keras files)
│   ├── App.js
│   ├── package.json
│   └── ... (other config files)
└── Healthy-Food-Recipe-Planning--main/
    └── Healthy-Food-Recipe-Planning--main/
        └── backend/
            └── api/
                ├── *.py files
                └── requirements-prod.txt
```

### ✅ Clone Test (Optional but Recommended)
```powershell
# Clone to a different location to verify
cd C:\Temp
git clone https://github.com/RJieYuso/nutrichef-api-back-up.git test-clone
cd test-clone

# Verify files are complete
ls -R
```

---

## Maintenance

### Regular Backups
After making significant changes:

```powershell
cd "c:/Users/ASUS/OneDrive - Personal-423/U info/Year3Sem1(Latest)/Workshop2/TestRun"

# Check what changed
git status

# Add changes
git add .

# Commit with descriptive message
git commit -m "Update: [describe changes]"

# Push to GitHub
git push
```

### Tagging Versions
For major milestones:

```powershell
# Create a tag
git tag -a v1.0-local -m "Local version 1.0 - Fully tested"

# Push tag
git push origin v1.0-local
```

---

## Troubleshooting

### Large Files Error
If Git rejects large files (>100MB):

```powershell
# Find large files
Get-ChildItem -Recurse | Where-Object {$_.Length -gt 100MB} | Select-Object FullName, Length

# Add to .gitignore
# Then remove from staging:
git rm --cached path/to/large/file
```

### Authentication Issues
```powershell
# Use GitHub Personal Access Token
# Settings → Developer settings → Personal access tokens
# Use token as password when prompted
```

### Merge Conflicts
```powershell
# If remote has changes:
git pull origin main
# Resolve conflicts
git add .
git commit -m "Resolved merge conflicts"
git push
```

---

## Security Checklist

### ⚠️ CRITICAL: Never Commit
- [ ] `.env` files
- [ ] API keys (DeepSeek, Supabase)
- [ ] Database passwords
- [ ] Private keys
- [ ] User data

### ✅ Safe to Commit
- [ ] Source code (.js, .py)
- [ ] Configuration templates (without actual keys)
- [ ] Documentation (.md files)
- [ ] Package files (package.json, requirements.txt)
- [ ] Small assets (icons, images <1MB)

---

## Backup Confirmation

### Final Checklist
- [ ] Git repository initialized
- [ ] All files committed
- [ ] Pushed to GitHub successfully
- [ ] Repository visible at: https://github.com/RJieYuso/nutrichef-api-back-up
- [ ] README displays correctly
- [ ] No sensitive data exposed
- [ ] `.gitignore` working properly
- [ ] Clone test successful (optional)

### Sign-off
**Backed up by:** _______________  
**Date:** _______________  
**Commit Hash:** _______________  
**Status:** ⬜ Complete

---

## Next Steps

After successful backup:

1. **Tag this version** (optional)
   ```powershell
   git tag -a v1.0-local -m "Local development version"
   git push origin v1.0-local
   ```

2. **Update production version** (if applicable)
   - Deploy to Railway/GlobalHost
   - Update production repository separately

3. **Document any differences**
   - Note differences between local and production
   - Update deployment docs

4. **Set up regular backup schedule**
   - Daily/Weekly commits for active development
   - Tag major milestones

---

**Repository URL:** https://github.com/RJieYuso/nutrichef-api-back-up.git  
**Purpose:** Local development backup (separate from production)  
**Last Updated:** December 18, 2024
