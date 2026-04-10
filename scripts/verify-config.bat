@echo off
setlocal EnableDelayedExpansion
title Configuration Verification
color 0E

REM Navigate to project root
set "PROJECT_ROOT=%~dp0.."
cd /d "%PROJECT_ROOT%"

echo.
echo  ============================================================
echo    eNOC Portal - Configuration Verification
echo  ============================================================
echo.

REM Check Node.js
where node >nul 2>&1
if errorlevel 1 (
    echo  [ERROR] Node.js is NOT installed
    echo          Download from: https://nodejs.org
) else (
    for /f "tokens=*" %%v in ('node --version') do echo  [OK] Node.js %%v installed
)

echo.
echo  --- File Verification ---
if exist "backend\.env" (
    echo  [OK] backend\.env exists
) else (
    echo  [ERROR] backend\.env NOT FOUND
    echo          Run: copy backend\.env.example backend\.env
)

if exist "backend\routes\auth.js" (
    echo  [OK] backend\routes\auth.js exists
) else (
    echo  [ERROR] backend\routes\auth.js NOT FOUND
)

if exist "client\js\google-auth.js" (
    echo  [OK] client\js\google-auth.js exists
) else (
    echo  [ERROR] client\js\google-auth.js NOT FOUND
)

if exist "client\js\config.js" (
    echo  [OK] client\js\config.js exists
) else (
    echo  [ERROR] client\js\config.js NOT FOUND
)

echo.
echo  --- Backend Configuration Check ---
if exist "backend\.env" (
    findstr /C:"GOOGLE_CLIENT_ID=868247521851" "backend\.env" >nul 2>&1
    if errorlevel 1 (
        echo  [WARN] GOOGLE_CLIENT_ID may not be set correctly
    ) else (
        echo  [OK] GOOGLE_CLIENT_ID is configured
    )
    
    findstr /C:"PORT=5000" "backend\.env" >nul 2>&1
    if errorlevel 1 (
        echo  [WARN] PORT may not be set to 5000
    ) else (
        echo  [OK] PORT is set to 5000
    )
)

echo.
echo  --- Port Status Check ---
netstat -ano | findstr ":5000 " | findstr "LISTENING" >nul 2>&1
if errorlevel 1 (
    echo  [INFO] Port 5000: Available (backend not running)
) else (
    echo  [OK] Port 5000: In use (backend is running)
)

netstat -ano | findstr ":8080 " | findstr "LISTENING" >nul 2>&1
if errorlevel 1 (
    echo  [INFO] Port 8080: Available (frontend not running)
) else (
    echo  [OK] Port 8080: In use (frontend is running)
)

echo.
echo  --- Backend API Test ---
powershell -NoProfile -Command ^
  "try { $r = Invoke-RestMethod -Uri 'http://localhost:5000/api/health' -TimeoutSec 3; Write-Host '  [OK] Backend API is responding' -ForegroundColor Green; Write-Host '       Status: ' -NoNewline; Write-Host $r.status -ForegroundColor Cyan; Write-Host '       Message: ' -NoNewline; Write-Host $r.message -ForegroundColor Cyan } catch { Write-Host '  [INFO] Backend not responding (may not be running)' -ForegroundColor Yellow }"

echo.
echo  ============================================================
echo    Verification Complete
echo  ============================================================
echo.
echo  To start the portal, run: scripts\start-portal.bat
echo  To restart backend only: scripts\restart-backend.bat
echo.
pause
