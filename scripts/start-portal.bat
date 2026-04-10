@echo off
setlocal EnableDelayedExpansion
title eNOC Portal Launcher
color 0A

echo.
echo  ============================================================
echo    eNOC Portal - Full Stack Launcher
echo    CHARUSAT University
echo  ============================================================
echo.

REM Get project root (one level up from scripts/)
set "PROJECT_ROOT=%~dp0.."
cd /d "%PROJECT_ROOT%"

REM ── Step 1: Check Node.js is installed ──────────────────────
where node >nul 2>&1
if errorlevel 1 (
    color 0C
    echo  [ERROR] Node.js is NOT installed!
    echo  Download from: https://nodejs.org
    pause
    exit /b 1
)
for /f "tokens=*" %%v in ('node --version') do set NODE_VER=%%v
echo  [OK] Node.js %NODE_VER% found

REM ── Step 2: Kill stale node processes on ports 5000 & 8080 ──
echo  [..] Clearing ports 5000 and 8080...
for /f "tokens=5" %%p in ('netstat -ano ^| findstr ":5000 " ^| findstr "LISTENING"') do (
    taskkill /PID %%p /F >nul 2>&1
)
for /f "tokens=5" %%p in ('netstat -ano ^| findstr ":8080 " ^| findstr "LISTENING"') do (
    taskkill /PID %%p /F >nul 2>&1
)
timeout /t 1 /nobreak >nul
echo  [OK] Ports cleared

REM ── Step 3: Install backend dependencies if needed ──────────
echo  [..] Checking backend dependencies...
if not exist "backend\node_modules" (
    echo  [..] Installing backend packages (first time only)...
    cd backend
    call npm install --silent
    cd ..
    echo  [OK] Backend packages installed
) else (
    echo  [OK] Backend packages already installed
)

REM ── Step 4: Validate .env file ──────────────────────────────
if not exist "backend\.env" (
    color 0E
    echo  [WARN] backend\.env not found - copying from .env.example
    copy "backend\.env.example" "backend\.env" >nul
    echo  [WARN] Please edit backend\.env with your database credentials
)
echo  [OK] .env file present

REM ── Step 5: Start Backend ────────────────────────────────────
echo.
echo  [1/2] Starting Backend Server on port 5000...
start "eNOC Backend (port 5000)" cmd /k "cd /d "%PROJECT_ROOT%\backend" && echo Starting backend... && node server.js"
echo  [..] Waiting for backend to be ready...

REM Poll until /api/health responds (max 30 seconds)
set /a TRIES=0
:WAIT_BACKEND
set /a TRIES+=1
if %TRIES% GTR 15 (
    color 0E
    echo  [WARN] Backend taking longer than expected...
    echo  [WARN] Check the backend window for errors.
    goto START_FRONTEND
)
timeout /t 2 /nobreak >nul
powershell -NoProfile -Command ^
  "try { $r = Invoke-WebRequest -Uri 'http://localhost:5000/api/health' -UseBasicParsing -TimeoutSec 2 -EA Stop; exit 0 } catch { exit 1 }" >nul 2>&1
if errorlevel 1 (
    echo  [..] Attempt %TRIES%/15 - backend not ready yet...
    goto WAIT_BACKEND
)
echo  [OK] Backend is UP at http://localhost:5000/api

REM ── Step 6: Start Frontend ───────────────────────────────────
:START_FRONTEND
echo.
echo  [2/2] Starting Frontend Server on port 8080...
start "eNOC Frontend (port 8080)" cmd /k "cd /d "%PROJECT_ROOT%" && node frontend-server.js"
timeout /t 2 /nobreak >nul

REM ── Step 7: Open browser ────────────────────────────────────
echo  [..] Opening browser...
start "" "http://localhost:8080"

echo.
echo  ============================================================
echo    eNOC Portal is RUNNING!
echo  ============================================================
echo.
echo    Frontend : http://localhost:8080
echo    Backend  : http://localhost:5000/api
echo    Health   : http://localhost:5000/api/health
echo.
echo    IMPORTANT: Always use http://localhost:8080
echo    Do NOT open index.html directly (file://)
echo.
echo    To stop: Close the Backend and Frontend windows
echo  ============================================================
echo.
pause
