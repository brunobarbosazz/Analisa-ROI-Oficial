@echo off
title Analisa ROI - Demo local
cd /d "%~dp0"
echo Iniciando Analisa ROI. O servidor informa a URL e a porta disponiveis.
echo Mantenha esta janela aberta enquanto usa a demonstracao.
call npm.cmd run dev
if errorlevel 1 (
  echo.
  echo Nao foi possivel iniciar o servidor. Confira se Node.js 20+ esta instalado.
  pause
)
