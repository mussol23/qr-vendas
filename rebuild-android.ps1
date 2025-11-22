# Script PowerShell para rebuild do app Android
# Execute: .\rebuild-android.ps1

Write-Host "=== 1. Instalando dependências do frontend ===" -ForegroundColor Cyan
npm install

Write-Host "`n=== 2. Build do projeto ===" -ForegroundColor Cyan
npm run build

Write-Host "`n=== 3. Sincronizando Capacitor ===" -ForegroundColor Cyan
npx cap sync

Write-Host "`n=== 4. Abrindo Android Studio ===" -ForegroundColor Cyan
npx cap open android

Write-Host "`n=== 5. Verificando plataformas instaladas ===" -ForegroundColor Cyan
npx cap ls

Write-Host "`n=== 6. Status do Git (opcional) ===" -ForegroundColor Cyan
git status

Write-Host "`n✅ Concluído! Agora:" -ForegroundColor Green
Write-Host "   1. No Android Studio, faça 'Build > Rebuild Project'" -ForegroundColor Yellow
Write-Host "   2. Execute o app no dispositivo/emulador" -ForegroundColor Yellow
Write-Host "   3. Teste a câmera, persistência de dados e geração de PDF" -ForegroundColor Yellow

