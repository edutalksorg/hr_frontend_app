@echo off
REM HR System - Dual Launch Script (Web + Expo)
REM This script starts both the web app and Expo mobile app

echo ========================================
echo HR System - Mobile & Web Launcher
echo ========================================
echo.

REM Check if we're in the right directory
if not exist "app-7vshm2afcow1" (
    echo ERROR: Please run this script from the hr_frontend_app root directory
    pause
    exit /b 1
)

echo Starting HR System in 2 terminals...
echo.

REM Start Web App in one terminal
echo [1] Starting Web App (port 5173)...
start cmd /k "cd app-7vshm2afcow1 && npx vite --host 0.0.0.0 --port 5173"

timeout /t 3 /nobreak

REM Start Expo in another terminal
echo [2] Starting Expo Mobile App (port 8081)...
start cmd /k "cd expo-wrapper && npx expo start --clear"

echo.
echo ========================================
echo IMPORTANT BEFORE SCANNING QR CODE:
echo ========================================
echo.
echo 1. UPDATE YOUR MACHINE IP IN: expo-wrapper/App.js
echo    - Find: const WEB_URL = 'http://192.168.0.113:5173'
echo    - Replace 192.168.0.113 with YOUR machine's IP
echo.
echo 2. Get your IP with: ipconfig (look for IPv4 Address)
echo.
echo 3. Both terminals should show "ready" messages
echo.
echo 4. Scan the QR code from Expo terminal with Expo Go app
echo.
echo ========================================
pause
