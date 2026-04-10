# 🔐 Authentication Configuration Guide

This guide explains how to properly configure Google Sign-In authentication for the eNOC Portal.

---

## 🎯 Overview

The authentication system requires coordination between:
1. **Frontend** (`js/google-auth.js`) - Handles Google Sign-In button and token generation
2. **Backend** (`backend/routes/auth.js`) - Verifies tokens and issues JWT
3. **Configuration** (`backend/.env`, `js/config.js`) - Stores credentials and settings

---

## ⚠️ CRITICAL: Google Client ID Must Match

The **most common authentication error** is a mismatch between frontend and backend Client IDs.

### ✅ Correct Configuration

**Frontend:** `js/google-auth.js`
```javascript
clientId: '868247521851-cp87aelb3mrkkm33kot9htpflj0ti2ds.apps.googleusercontent.com',
```

**Backend:** `backend/.env`
```bash
GOOGLE_CLIENT_ID=868247521851-cp87aelb3mrkkm33kot9htpflj0ti2ds.apps.googleusercontent.com
```

### ❌ Common Mistakes

1. **Different Client IDs** - Frontend and backend have different IDs
2. **Missing Client ID** - Forgot to set GOOGLE_CLIENT_ID in .env
3. **Extra spaces** - Whitespace before/after the ID
4. **Wrong environment** - Using .env.example instead of .env

### 🔍 How to Verify

1. Open `js/google-auth.js` and find the `clientId` value
2. Open `backend/.env` and find the `GOOGLE_CLIENT_ID` value
3. Compare them character-by-character - they MUST be identical

---

## 🎓 Domain Validation for CHARUSAT

The system validates emails based on the user's role:

### Students
- **Required domain:** `@charusat.edu.in`
- **Subdomains allowed:** Yes (e.g., `@it.charusat.edu.in`, `@ce.charusat.edu.in`)
- **Examples:**
  - ✅ `24it068@charusat.edu.in`
  - ✅ `student@it.charusat.edu.in`
  - ✅ `john@cse.charusat.edu.in`
  - ❌ `student@gmail.com`
  - ❌ `user@othercollege.edu.in`

### Faculty & Admin
- **Required domain:** `@charusat.ac.in`
- **Subdomains allowed:** Yes (e.g., `@ce.charusat.ac.in`)
- **Examples:**
  - ✅ `faculty@charusat.ac.in`
  - ✅ `john.doe@ce.charusat.ac.in`
  - ✅ `admin@it.charusat.ac.in`
  - ❌ `faculty@gmail.com`
  - ❌ `user@charusat.edu.in` (students only)

### Configuration

The domain validation is configured in `backend/.env`:

```bash
# Domain type validation (edu/ac check)
STUDENT_DOMAIN=edu
FACULTY_DOMAIN=ac
ADMIN_DOMAIN=ac
```

**Note:** The system performs TWO checks:
1. **Domain type check** - Validates .edu or .ac (configurable)
2. **Full domain check** - Validates @charusat.edu.in or @charusat.ac.in (hardcoded for security)

---

## 🔌 Backend Port Configuration

### Default Setup

**Backend Port:** `5000` (configured in `backend/.env`)
```bash
PORT=5000
```

**Frontend API URL:** `http://localhost:5000/api` (configured in `js/config.js`)
```javascript
const API_BASE = 'http://localhost:5000/api';
```

### Changing the Port

If you need to run the backend on a different port:

1. **Update backend/.env:**
   ```bash
   PORT=8080
   ```

2. **Update js/config.js:**
   ```javascript
   const API_BASE = 'http://localhost:8080/api';
   ```

3. **Restart the backend:**
   ```bash
   cd backend
   npm start
   ```

### Port Conflicts

If port 5000 is already in use:

1. Find the process using the port:
   ```powershell
   # Windows PowerShell
   Get-Process -Id (Get-NetTCPConnection -LocalPort 5000).OwningProcess
   ```

2. Kill the process or choose a different port

---

## 🛡️ Error Handling

The system gracefully handles various errors:

### Backend Offline

**Symptoms:**
- "Cannot connect to authentication server" error
- Login fails immediately

**Solution:**
1. Open a new terminal
2. Navigate to backend: `cd backend`
3. Start the server: `npm start`
4. Try logging in again

**What happens:**
- ✅ Page remains functional (doesn't crash)
- ✅ Subtle banner shows offline status
- ✅ Auto-reconnect attempts every 15 seconds
- ✅ Clear error message guides user to start backend

### Client ID Mismatch

**Symptoms:**
- "Invalid token signature" error
- "Audience mismatch" error
- Token verification fails

**Solution:**
1. Check `js/google-auth.js` → `clientId`
2. Check `backend/.env` → `GOOGLE_CLIENT_ID`
3. Ensure they match exactly
4. Restart backend after changing .env

### Invalid Email Domain

**Symptoms:**
- "Invalid email domain for student/faculty" error
- Login blocked with modal popup

**What happens:**
- ✅ Clear error message explains required domain
- ✅ Shows user's email and expected format
- ✅ Provides examples of valid emails
- ✅ Auto-logout to prevent incorrect role access

---

## 📋 Configuration Checklist

Use this checklist to ensure everything is configured correctly:

### Google OAuth Setup

- [ ] Created Google Cloud project
- [ ] Enabled Google Identity Services API
- [ ] Configured OAuth consent screen
- [ ] Added test users (if app not published)
- [ ] Created OAuth 2.0 Client ID (Web application)
- [ ] Added authorized JavaScript origins:
  - `http://localhost:8080`
  - `http://127.0.0.1:5500`
- [ ] Copied Client ID to both locations:
  - [ ] `js/google-auth.js` → `clientId`
  - [ ] `backend/.env` → `GOOGLE_CLIENT_ID`
- [ ] Verified both Client IDs match exactly

### Backend Configuration

- [ ] Copied `backend/.env.example` to `backend/.env`
- [ ] Set `GOOGLE_CLIENT_ID` (matches frontend)
- [ ] Set `GOOGLE_CLIENT_SECRET`
- [ ] Set `JWT_SECRET` (random string)
- [ ] Set `PORT=5000`
- [ ] Configured database settings (if using DB)
- [ ] Set domain validation:
  - [ ] `STUDENT_DOMAIN=edu`
  - [ ] `FACULTY_DOMAIN=ac`

### Frontend Configuration

- [ ] Updated `js/google-auth.js` → `clientId` (matches backend)
- [ ] Verified `js/config.js` → `API_BASE_URL` points to correct port
- [ ] Included Google Identity Services script in HTML:
  ```html
  <script src="https://accounts.google.com/gsi/client" async defer></script>
  ```

### Testing

- [ ] Backend starts without errors: `cd backend && npm start`
- [ ] Frontend loads at `http://localhost:8080`
- [ ] Google Sign-In button appears
- [ ] Can login with student email (@charusat.edu.in)
- [ ] Can login with faculty email (@charusat.ac.in)
- [ ] Invalid domain shows clear error
- [ ] Backend offline shows graceful error (not crash)

---

## 🚀 Quick Start Commands

### Start Backend
```powershell
cd backend
npm install    # First time only
npm start
```

### Start Frontend
```powershell
# From project root
.\start-portal.bat

# Or manually:
node frontend-server.js
```

### Check Backend Status
```powershell
# Test health endpoint
curl http://localhost:5000/api/health

# Should return:
# {"status":"OK","timestamp":"..."}
```

---

## 🔧 Troubleshooting

### "The server cannot process the request because it is malformed"

**Cause:** Google OAuth not properly configured

**Solution:** Follow `GOOGLE_OAUTH_SETUP.md` to set up OAuth

### "Token used too late"

**Cause:** System clock out of sync or token expired

**Solution:**
1. Check system time is correct
2. Try signing in again (generates new token)

### "Cannot connect to backend server"

**Cause:** Backend not running

**Solution:**
```powershell
cd backend
npm start
```

### "Invalid email domain for student"

**Cause:** Trying to login as student with non-student email

**Solution:** Use email ending with `@charusat.edu.in`

### "Invalid email domain for faculty"

**Cause:** Trying to login as faculty with non-faculty email

**Solution:** Use email ending with `@charusat.ac.in`

---

## 📚 Related Documentation

- [`GOOGLE_OAUTH_SETUP.md`](./GOOGLE_OAUTH_SETUP.md) - Detailed Google OAuth setup guide
- [`QUICKSTART.md`](./QUICKSTART.md) - Quick start guide
- [`README.md`](./README.md) - Project overview and features
- [`backend/README.md`](./backend/README.md) - Backend API documentation

---

## 🆘 Getting Help

If you encounter issues:

1. **Check Console Logs:**
   - Browser DevTools → Console (F12)
   - Backend terminal output

2. **Verify Configuration:**
   - Use the checklist above
   - Double-check Client IDs match

3. **Common Error Messages:**
   - All error messages now include helpful hints
   - Check console for detailed debugging info

4. **Test in Isolation:**
   - Test backend health: `curl http://localhost:5000/api/health`
   - Test frontend loads: `http://localhost:8080`
   - Test Google Sign-In appears: Check for button on login page

---

**Last Updated:** February 18, 2026  
**Version:** 2.0.0
