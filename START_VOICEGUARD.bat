@echo off
title VoiceGuard 3D - AI Deepfake Detector Launcher
color 0B
cls

echo ================================================================
echo        VOICEGUARD AI - REAL-TIME DEEPFAKE DETECTOR
echo               Smart India Hackathon 2026
echo ================================================================
echo.
echo [1/3] Starting Backend Server (FastAPI on Port 8000)...
start "VoiceGuard Backend" cmd /k "cd /d "%~dp0backend" && venv\Scripts\python.exe -m uvicorn main:app --host 127.0.0.1 --port 8000"

echo [2/3] Waiting for Backend to initialize...
timeout /t 3 /nobreak >nul

echo [3/3] Starting Frontend Dev Server (Vite on Port 5173)...
start "VoiceGuard Frontend" cmd /k "cd /d "%~dp0frontend" && npm.cmd run dev"

echo.
echo Waiting for frontend server to be ready...
timeout /t 3 /nobreak >nul

echo.
echo ================================================================
echo  VoiceGuard is RUNNING!
echo  Opening browser at http://localhost:5173 ...
echo ================================================================
start http://localhost:5173

exit
