@echo off
title Corporate Insights Platform
echo Iniciando Corporate Insights Platform...
echo.

start "BACKEND - API" powershell -NoExit -Command "cd '%~dp0backend'; Write-Host 'Backend iniciando...' -ForegroundColor Cyan; npm run dev"

timeout /t 4 /nobreak >nul

start "FRONTEND - App" powershell -NoExit -Command "cd '%~dp0frontend'; Write-Host 'Frontend iniciando...' -ForegroundColor Green; npm run dev"

echo.
echo Aguardando servidores subirem...
timeout /t 8 /nobreak >nul

start http://localhost:3000/login

echo.
echo ====================================
echo  Sistema iniciado com sucesso!
echo  Acesse: http://localhost:3000
echo ====================================
pause
