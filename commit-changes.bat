@echo off
echo ========================================
echo  Commit e Push para GitHub
echo ========================================
echo.

echo 1. Verificando mudanças...
git status

echo.
echo 2. Adicionando arquivos...
git add .

echo.
echo 3. Fazendo commit...
git commit -m "fix: items disappearing, auto-push on mobile, and labels PDF on mobile"

echo.
echo 4. Fazendo push...
git push

echo.
echo ========================================
echo  Mudanças enviadas para o GitHub!
echo ========================================
echo.
echo Agora acesse o Render para verificar o deploy do backend.
pause

