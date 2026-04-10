@echo off
title Restart Backend Server
color 0B

REM Navigate to project root
set "PROJECT_ROOT=%~dp0.."
cd /d "%PROJECT_ROOT%"

echo.
echo  ============================================================
echo    Restarting Backend Server
echo  ============================================================
echo.

REM Kill any node processes on port 5000
echo  [..] Stopping existing backend...
for /f "tokens=5" %%p in ('netstat -ano ^| findstr ":5000 " ^| findstr "LISTENING"') do (
    taskkill /PID %%p /F >nul 2>&1
    echo  [OK] Stopped process %%p
)
timeout /t 2 /nobreak >nul

REM Start backend
echo  [..] Starting backend server...
cd /d "%PROJECT_ROOT%\backend"
start "eNOC Backend" cmd /k "node server.js"

echo.
echo  [..] Waiting for backend to start...
timeout /t 3 /nobreak >nul

REM Test connection
powershell -NoProfile -Command ^
  "try { $r = Invoke-RestMethod -Uri 'http://localhost:5000/api/health' -TimeoutSec 5; Write-Host '  [OK] Backend is running at http://localhost:5000/api' -ForegroundColor Green; Write-Host ''; Write-Host '  Status: ' -NoNewline; Write-Host $r.status -ForegroundColor Cyan; Write-Host '  Message: ' -NoNewline; Write-Host $r.message -ForegroundColor Cyan } catch { Write-Host '  [ERROR] Backend failed to start' -ForegroundColor Red; Write-Host '  Error: ' -NoNewline; Write-Host $_.Exception.Message -ForegroundColor Yellow }"

echo.
echo  Press any key to close this window...
pause >nul
