@echo off
echo ========================================
echo  Rebuild Mobile App
echo ========================================
echo.

echo 1. Build do frontend...
call npm run build

echo.
echo 2. Sincronizando com Capacitor...
call npx cap sync

echo.
echo 3. Abrindo Android Studio...
call npx cap open android

echo.
echo ========================================
echo  Pronto! Agora compile no Android Studio
echo ========================================
pause

