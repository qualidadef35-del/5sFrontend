@echo off
chcp 65001 > nul
cd /d "%~dp0"
echo ===============================================
echo     HEMU 5S - Frontend React em desenvolvimento
echo ===============================================
echo.
where node >nul 2>nul
if errorlevel 1 (
  echo ERRO: Instale o Node.js 20 ou superior.
  pause
  exit /b 1
)
if not exist "node_modules" (
  echo Instalando as dependencias...
  call npm install
  if errorlevel 1 (
    echo Falha ao instalar dependencias. Confirme o acesso a internet.
    pause
    exit /b 1
  )
)
echo.
echo A API deve estar funcionando em http://localhost:3333
start "" "http://localhost:5173"
call npm run dev
pause
