@echo off
REM ============================================================
REM  COLLEGE PORTAL - COMPLETE STARTUP SCRIPT
REM  Starts both backend and frontend servers simultaneously
REM ============================================================

echo.
echo ╔══════════════════════════════════════════════════════════╗
echo ║     CHARUSAT College Portal - Starting Application      ║
echo ╚══════════════════════════════════════════════════════════╝
echo.

REM Navigate to project root (one level up from scripts/)
set "PROJECT_ROOT=%~dp0.."
cd /d "%PROJECT_ROOT%"

REM Check if Node.js is installed
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo ❌ ERROR: Node.js is not installed!
    echo.
    echo Please install Node.js from: https://nodejs.org/
    echo Then run this script again.
    pause
    exit /b 1
)

echo ✅ Node.js detected: 
node --version
echo.

REM Check if root package.json exists
if not exist "package.json" (
    echo ❌ ERROR: package.json not found in root directory
    echo.
    echo Please ensure you are in the correct project directory.
    pause
    exit /b 1
)

REM Check if node_modules exists in root
if not exist "node_modules" (
    echo ⚠️  Dependencies not installed. Installing now...
    echo.
    call npm install
    if %errorlevel% neq 0 (
        echo ❌ Failed to install dependencies
        pause
        exit /b 1
    )
    echo ✅ Root dependencies installed
    echo.
)

REM Check if backend node_modules exists
if not exist "backend\node_modules" (
    echo ⚠️  Backend dependencies not installed. Installing now...
    echo.
    cd backend
    call npm install
    if %errorlevel% neq 0 (
        echo ❌ Failed to install backend dependencies
        cd ..
        pause
        exit /b 1
    )
    cd ..
    echo ✅ Backend dependencies installed
    echo.
)

REM Check if backend .env exists
if not exist "backend\.env" (
    echo ⚠️  WARNING: backend\.env file not found!
    echo.
    echo The application may not work correctly without proper configuration.
    echo Please copy backend\.env.example to backend\.env and configure it.
    echo.
    echo Press any key to continue anyway, or Ctrl+C to exit and configure first.
    pause
)

echo ╔══════════════════════════════════════════════════════════╗
echo ║   Starting Backend (Port 5000) and Frontend (Port 8080) ║
echo ╠══════════════════════════════════════════════════════════╣
echo ║  • Backend starts with nodemon (auto-restart)           ║
echo ║  • Frontend waits 2 seconds for backend to initialize   ║
echo ║  • Both servers run independently                        ║
echo ╚══════════════════════════════════════════════════════════╝
echo.
echo 🚀 Backend API: http://localhost:5000/api/health
echo 🌐 Frontend:    http://localhost:8080
echo.
echo 💡 Tip: Backend auto-restarts when you edit code
echo 📌 Press Ctrl+C to stop all servers
echo.

REM Start both servers using npm start
call npm start

REM If we get here, the servers stopped
echo.
echo ╔══════════════════════════════════════════════════════════╗
echo ║              Servers Stopped                             ║
echo ╚══════════════════════════════════════════════════════════╝
echo.
pause
