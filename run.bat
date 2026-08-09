@echo off
title Expense Tracker Launcher
echo ===================================================
echo   Welcome to Expense Tracker (Full-Stack Edition)
echo ===================================================
echo.

:: Check if Node.js is installed
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not installed or not in your system's PATH.
    echo Please download and install Node.js from https://nodejs.org/
    echo after installing, restart this script.
    echo.
    pause
    exit /b
)

:: Install dependencies if node_modules folder is missing
if not exist node_modules (
    echo [INFO] Installing required server dependencies (Express, CORS, SQLite3)...
    call npm install
    echo [INFO] Dependencies installed successfully.
    echo.
)

:: Start the server in a separate background window
echo [INFO] Starting the backend server...
start "Expense Tracker Backend" cmd /c "npm start"

:: Wait for 2 seconds to let the server start up
timeout /t 2 /nobreak >nul

:: Open the index.html in the default browser
echo [INFO] Opening the application in your browser...
start index.html

echo.
echo ===================================================
echo   Application started successfully! 
echo   Keep the backend window open to sync data.
echo ===================================================
echo.
pause
