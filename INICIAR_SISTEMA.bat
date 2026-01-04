
@echo off
echo ==========================================
echo    INICIANDO SISTEMA DE GESTAO + IA
echo ==========================================
echo.
echo 1. Iniciando Servidor Backend (API Proxy e Banco)...
start "Servidor Backend" cmd /k "node server/index.cjs"
timeout /t 2 >nul

echo 2. Iniciando Frontend (Interface Visual)...
start "Frontend App" cmd /k "npm run dev"

echo.
echo ==========================================
echo    SISTEMA INICIADO COM SUCESSO!
echo    Mantenha as janelas pretas abertas.
echo ==========================================
pause
