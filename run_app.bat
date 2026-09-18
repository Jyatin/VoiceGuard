<# :
@echo off
powershell -NoProfile -ExecutionPolicy Bypass -Command "Invoke-Expression ([System.IO.File]::ReadAllText('%~f0'))"
exit /b
#>

Write-Host "================================================================" -ForegroundColor Cyan
Write-Host "       VOICEGUARD AI - REAL-TIME 3D VOICE DEFENSE               " -ForegroundColor Yellow
Write-Host "               Smart India Hackathon 2026                       " -ForegroundColor Green
Write-Host "================================================================" -ForegroundColor Cyan
Write-Host ""

$Root = Split-Path -Parent $MyInvocation.MyCommand.Path
if (-not $Root) { $Root = $PSScriptRoot }
if (-not $Root) { $Root = Get-Location }

Write-Host "[1/3] Launching FastAPI Backend on Port 8000..." -ForegroundColor Cyan
Start-Process -FilePath "cmd.exe" -ArgumentList "/c cd /d `"$Root\backend`" && venv\Scripts\python.exe -m uvicorn main:app --host 127.0.0.1 --port 8000" -WindowStyle Minimized

Start-Sleep -Seconds 2

Write-Host "[2/3] Launching Vite Frontend on Port 5173..." -ForegroundColor Cyan
Start-Process -FilePath "cmd.exe" -ArgumentList "/c cd /d `"$Root\frontend`" && npm.cmd run dev" -WindowStyle Minimized

Start-Sleep -Seconds 2

Write-Host "[3/3] Opening VoiceGuard in your browser..." -ForegroundColor Green
Start-Process "http://localhost:5173"

Write-Host ""
Write-Host "VoiceGuard is running smoothly! Keep the background windows open." -ForegroundColor Yellow
