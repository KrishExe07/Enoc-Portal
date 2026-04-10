# 🚀 Quick Start - College Portal

## ONE Command to Start Everything

```bash
npm start
```

That's it! Both backend and frontend start automatically.

---

## 📋 First Time Setup

```bash
# 1. Install dependencies
npm run install-all

# 2. Configure backend
# Copy backend/.env.example to backend/.env
# Add your Google Client ID (see GOOGLE_OAUTH_SETUP.md)

# 3. Start the application
npm start
```

---

## 🌐 Access the Application

- **Frontend**: http://localhost:8080
- **Backend Health**: http://localhost:5000/api/health

---

## ⚙️ What Happens

1. **Backend starts** with nodemon on port 5000 (auto-restarts on code changes)
2. **Frontend waits** 2 seconds, then starts on port 8080
3. **Both run** independently with color-coded logs
4. **Opens** http://localhost:8080 in your browser
5. **Sign in** with @charusat.edu.in or @charusat.ac.in email

---

## 🛑 Stopping Servers

Press `Ctrl+C` in the terminal (stops both servers)

---

## 🔧 Other Commands

```bash
# Backend only (development mode with auto-restart)
npm run backend

# Frontend only
npm run frontend

# Install all dependencies (root + backend)
npm run install-all

# Development mode (same as start, but explicit)
npm run dev
```

---

## ❗ Key Features of This Fix

### ✅ What Works Now

1. **Auto-Start**: One command starts both servers
2. **Auto-Restart**: Backend restarts automatically when you edit code (nodemon)
3. **Proper Timing**: Frontend waits for backend to initialize (2s delay)
4. **Graceful Errors**: No page crashes when backend is temporarily down
5. **Independent**: Either server can restart without affecting the other
6. **Persistent**: Works after VS Code restart - same command every time

### ❌ What's Fixed

- ~~Manual backend startup required~~
- ~~ERR_CONNECTION_REFUSED errors~~
- ~~Port mismatch problems~~
- ~~Google Sign-In backend mismatch~~
- ~~"Authentication server unavailable" blocking errors~~
- ~~Frontend crashes when backend is down~~

---

## 📊 Server Status Check

### Backend Health
```bash
curl http://localhost:5000/api/health
```

Expected response:
```json
{
  "success": true,
  "status": "OK",
  "message": "eNOC Portal API is running"
}
```

### Frontend Check
```bash
curl http://localhost:8080
```

Returns the index.html page.

---

## 🆘 Troubleshooting

### "Port 5000 already in use"
```powershell
netstat -ano | findstr :5000
taskkill /PID <PID> /F
```

### "Cannot find module 'concurrently'"
```bash
npm install
```

### "Backend not responding"
1. Wait 5-10 seconds (backend may still be starting)
2. Check backend console for errors
3. Verify `backend/.env` exists
4. Restart: `npm start`

### "Google Sign-In not working"
1. Check Google Client ID matches in:
   - `backend/.env` → `GOOGLE_CLIENT_ID`
   - `js/google-auth.js` → `clientId`
2. Verify internet connection (Google CDN required)
3. Check browser console for errors

---

## 📚 More Documentation

- **[STARTUP_FIX_COMPLETE.md](STARTUP_FIX_COMPLETE.md)** - Detailed fix documentation
- **[GOOGLE_OAUTH_SETUP.md](GOOGLE_OAUTH_SETUP.md)** - OAuth setup instructions
- **[README.md](README.md)** - Full project documentation
- **[TESTING_GUIDE.md](TESTING_GUIDE.md)** - How to test the application

---

## ✅ Verification

After running `npm start`, check:

- [ ] Backend console shows "eNOC Portal Backend API"
- [ ] Frontend console shows "FRONTEND SERVER READY"
- [ ] No errors in terminal
- [ ] http://localhost:8080 loads
- [ ] Google Sign-In button appears
- [ ] Can sign in with institutional email

---

**Need help?** See the troubleshooting section above or check STARTUP_FIX_COMPLETE.md for detailed solutions.
