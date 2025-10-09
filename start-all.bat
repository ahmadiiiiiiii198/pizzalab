@echo off
echo ========================================
echo   RURAL PIZZA - Complete System
echo ========================================
echo.
echo Starting Print Server...
start "Print Server" cmd /k "node print-server.cjs"
timeout /t 3 /nobreak > nul

echo Starting Web Application...
start "Web App" cmd /k "npm run dev"

echo.
echo ========================================
echo   Both servers are starting!
echo ========================================
echo.
echo Print Server: http://localhost:3001
echo Web App: http://localhost:5173
echo.
echo Auto-print is ENABLED by default
echo Orders will print automatically!
echo.
pause
