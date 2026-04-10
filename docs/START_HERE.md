# 🚀 Quick Start Guide

## Starting the College Portal

### Method 1: Automated Startup (Recommended)
1. Double-click `start-portal.bat` in the project root folder
2. Two windows will open:
   - Backend Server (port 5000)
   - Frontend Server (port 8080)
3. Open your browser and go to: **http://localhost:8080**

### Method 2: Manual Startup
1. **Start Backend:**
   ```
   cd backend
   node server.js
   ```

2. **Start Frontend (in a new terminal):**
   ```
   python -m http.server 8080
   ```
   OR if you have Live Server extension in VS Code:
   - Right-click on `index.html`
   - Select "Open with Live Server"

3. Open browser: **http://localhost:8080** (for Python server)
   OR **http://localhost:5500** (for Live Server)

## ⚠️ Important Notes

- **DO NOT open HTML files directly** (file:// protocol won't work)
- Always use a local web server (http://localhost)
- Keep both terminal windows open while using the portal
- Press `Ctrl+C` in the terminal windows to stop the servers

## 🔧 Troubleshooting

### "Port already in use" error
- Backend is already running! Just open http://localhost:8080
- Or kill the process and restart

### "Cannot connect to backend" error
- Make sure backend is running on port 5000
- Check if `backend/node_modules` folder exists
- If not, run `cd backend` then `npm install`

### Authentication not working
- Ensure you're accessing via http://localhost (not file://)
- Check browser console for errors (F12)
- Verify backend terminal shows "Server running on port 5000"

## 📱 Default Access

- **Students:** Use college email (@edu domain)
- **Faculty/Admin:** Use institutional email (@ac domain)
- First-time users will be auto-registered

---

**Happy Learning! 🎓**
