@echo off
echo ========================================
echo   Backend Server Status Check
echo ========================================
echo.

echo Checking if backend is running on port 5000...
echo.

powershell -Command "$response = try { Invoke-WebRequest -Uri 'http://localhost:5000/api/health' -Method GET -TimeoutSec 5 -ErrorAction Stop; $response.StatusCode } catch { 0 }; if ($response -eq 200) { Write-Host '✓ Backend is RUNNING and responding!' -ForegroundColor Green; Write-Host '  URL: http://localhost:5000/api/health' -ForegroundColor Cyan; exit 0 } else { Write-Host '✗ Backend is NOT running!' -ForegroundColor Red; Write-Host '  Please run start-portal.bat to start the server' -ForegroundColor Yellow; exit 1 }"

echo.
pause
