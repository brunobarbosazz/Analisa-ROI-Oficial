@echo off
title Reiniciar Vytrix Analytics
cd /d "%~dp0"
echo Encerrando somente o processo que usa a porta 3000...
for /f "tokens=5" %%P in ('netstat -ano ^| findstr ":3000"') do taskkill /PID %%P /F >nul 2>&1
timeout /t 1 /nobreak >nul
echo Iniciando a versão atual do projeto...
start "Vytrix Analytics" /D "%~dp0" cmd /k node server.js
echo.
echo Servidor atualizado em http://localhost:3000
pause
