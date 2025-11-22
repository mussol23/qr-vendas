@echo off
echo ========================================
echo  Instalando Tailwind CSS
echo ========================================
echo.

echo 1. Instalando dependencias...
call npm install

echo.
echo 2. Buildando o projeto...
call npm run build

echo.
echo ========================================
echo  Tailwind CSS instalado com sucesso!
echo ========================================
echo.
echo Agora voce pode executar: npm run dev
pause

