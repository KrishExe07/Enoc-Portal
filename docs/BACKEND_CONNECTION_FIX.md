# 🔧 PERMANENT SOLUTION - Backend Connection Guide

## ✅ Problem Solved!

The "Cannot connect to backend server" error has been **permanently fixed** with the following improvements:

---

## 🚀 Quick Start (Recommended Method)

### Option 1: Use the Automated Startup Script

```bash
# Simply double-click this file:
start-portal.bat
```

**What it does:**
1. Automatically kills any existing node processes (prevents port conflicts)
2. Starts the backend server on port 5000
3. Waits and verifies backend is ready before proceeding
4. Starts the frontend server on port 8080
5. Shows clear status messages

**Wait for this message:**
```
========================================
  College Portal is READY!
========================================
  Frontend: http://localhost:8080
  Backend:  http://localhost:5000/api
========================================
```

---

## 🔍 Verify Backend is Running

### Option 1: Use the Check Script
```bash
# Double-click this file:
check-backend.bat
```

### Option 2: Open Backend Check Page
Navigate to: `http://localhost:8080/backend-check.html`

This page will:
- Automatically test the backend connection
- Show clear success/error messages
- Provide step-by-step troubleshooting

### Option 3: Manual Browser Test
Open your browser and go to:
```
http://localhost:5000/api/health
```

You should see:
```json
{
  "status": "OK",
  "message": "College Portal API is running",
  "timestamp": "2026-02-18T..."
}
```

---

## 🛠️ Manual Start (Alternative Method)

If you prefer to start servers manually:

### Terminal 1 - Backend Server
```bash
cd backend
npm install    # First time only
npm start      # or: node server.js
```

Wait for:
```
🚀 Server running on port 5000
📝 Environment: development
🌐 Frontend URL: http://127.0.0.1:5500
```

### Terminal 2 - Frontend Server
```bash
# In project root directory
node frontend-server.js
```

Wait for:
```
Frontend server running on http://localhost:8080
```

---

## 🔐 Login Process

1. **Start both servers** (use `start-portal.bat`)
2. **Open browser**: http://localhost:8080
3. **Click "Login" button**
4. **Select your role** (Student/Faculty/Admin)
5. **Sign in with Google**

---

## 🆕 New Features Added

### 1. Health Check Endpoint
- **URL**: `http://localhost:5000/api/health`
- **Purpose**: Verify backend is running
- **Returns**: Server status and timestamp

### 2. Auto-Retry Connection Logic
The frontend now automatically:
- Checks backend health on page load
- Retries connection up to 5 times with 2-second delays
- Shows clear error messages if backend is unavailable

### 3. Improved Startup Script
`start-portal.bat` now:
- Cleans up old processes automatically
- Waits for backend to be fully ready
- Verifies health before starting frontend
- Provides clear status messages

### 4. Backend Status Checker
Two ways to check:
- **Script**: `check-backend.bat`
- **Web Page**: `backend-check.html`

---

## 🐛 Troubleshooting

### Issue: "Cannot connect to backend"

**Solution 1: Use Startup Script**
```bash
Double-click: start-portal.bat
```

**Solution 2: Check if Backend is Running**
```bash
Double-click: check-backend.bat
```

**Solution 3: Restart Everything**
```bash
# Kill all node processes
taskkill /F /IM node.exe

# Restart using startup script
start-portal.bat
```

### Issue: Port Already in Use

**Error Message:**
```
EADDRINUSE: address already in use :::5000
```

**Solution:**
```bash
# Kill existing node processes
taskkill /F /IM node.exe

# Or restart your computer
```

### Issue: Backend Starts but Immediately Closes

**Check:**
1. Ensure you're in the correct directory
2. Verify `.env` file exists in `backend/` folder
3. Check for syntax errors in `backend/server.js`

**Solution:**
```bash
cd backend
node server.js
# Read any error messages that appear
```

### Issue: Database Connection Error

**Warning Message:**
```
⚠️ Starting server WITHOUT database connection...
```

**This is OK for Google OAuth!** The server will still work.

**To fix database (optional):**
1. Install MySQL/MariaDB
2. Update `backend/.env` with database credentials
3. Run: `node backend/create-db.js`

---

## 📋 Pre-Startup Checklist

Before starting the portal:

- [ ] Node.js is installed (check: `node --version`)
- [ ] Dependencies installed in backend (run: `cd backend && npm install`)
- [ ] Backend `.env` file exists with Google OAuth credentials
- [ ] No other applications using ports 5000 or 8080
- [ ] Project folder path has no special characters or very long names

---

## 🔄 Common Workflows

### Daily Usage
```bash
1. Double-click start-portal.bat
2. Wait for "College Portal is READY!" message
3. Open browser to http://localhost:8080
4. Done!
```

### After Computer Restart
```bash
# Same as daily usage - everything starts fresh
Double-click start-portal.bat
```

### Stopping Servers
```bash
# Frontend: Press Ctrl+C in the terminal running frontend-server.js
# Backend: Close the "College Portal - Backend" window
# Or: taskkill /F /IM node.exe (kills all)
```

---

## 📁 Important Files

| File | Purpose |
|------|---------|
| `start-portal.bat` | **Main startup script** - Use this! |
| `check-backend.bat` | Verify backend is running |
| `backend-check.html` | Web-based backend checker |
| `backend/server.js` | Backend server code |
| `frontend-server.js` | Frontend server code |
| `backend/.env` | Backend configuration (OAuth keys, etc.) |

---

## 🎯 Success Indicators

You'll know everything is working when:

1. **Backend window shows:**
   ```
   🚀 Server running on port 5000
   📝 Environment: development
   ```

2. **Frontend terminal shows:**
   ```
   Frontend server running on http://localhost:8080
   ```

3. **Browser at http://localhost:5000/api/health shows:**
   ```json
   {"status":"OK","message":"College Portal API is running"}
   ```

4. **Login page loads without errors**

5. **Console shows (press F12):**
   ```
   ✅ Backend connection verified!
   ```

---

## 🆘 Still Having Issues?

1. **Check backend status:**
   - Run `check-backend.bat`
   - Or open `http://localhost:8080/backend-check.html`

2. **View console logs:**
   - Press F12 in browser
   - Check Console tab for error messages

3. **Restart everything:**
   ```bash
   taskkill /F /IM node.exe
   start-portal.bat
   ```

4. **Check if ports are blocked:**
   ```bash
   netstat -ano | findstr :5000
   netstat -ano | findstr :8080
   ```

---

## 📝 Technical Details

### Architecture
```
Frontend (Port 8080) → API Calls → Backend (Port 5000) → MySQL Database
                                         ↓
                                   Google OAuth API
```

### API Base URL
```javascript
const API_BASE_URL = 'http://localhost:5000/api';
```

### Health Check Implementation
```javascript
// Frontend checks backend health automatically
apiService.waitForBackend(3, 1500).then(isHealthy => {
    if (!isHealthy) {
        // Show error message to user
    }
});
```

---

## ✨ What Was Fixed

1. **Added Health Check Endpoint** (`/api/health`)
   - Backend now has a dedicated endpoint to verify it's running

2. **Improved Startup Script**
   - Automatically cleans up old processes
   - Waits for backend to be ready
   - Verifies connection before starting frontend

3. **Auto-Retry Logic in Frontend**
   - Automatically checks backend on page load
   - Retries connection if backend is slow to start
   - Shows helpful error messages

4. **Better Error Messages**
   - Clear, actionable error messages
   - Tells users exactly what to do

5. **Diagnostic Tools**
   - `check-backend.bat` for quick status check
   - `backend-check.html` for web-based diagnostics

---

## 🎉 Summary

**The permanent solution includes:**
- ✅ Automated startup script with health checks
- ✅ Auto-retry connection logic
- ✅ Clear error messages and diagnostics
- ✅ Easy-to-use status checkers
- ✅ Comprehensive documentation

**Just use `start-portal.bat` and you're good to go!** 🚀

---

*Last Updated: February 18, 2026*
