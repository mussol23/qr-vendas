# 🔍 Diagnóstico: Push Não Funciona no Mobile

## 🎯 Problema
- ✅ Pull funciona (dados do Supabase aparecem quando sincroniza manualmente)
- ❌ Push NÃO funciona (produtos, clientes, vendas ficam só localmente)

## 🔧 Causa Raiz

**No mobile, as variáveis de ambiente são compiladas durante o BUILD.**

Se você:
1. Criou/editou o arquivo `.env`
2. MAS não fez rebuild depois

Então o app mobile ainda está usando o build antigo **SEM** a `VITE_API_URL` configurada.

## ✅ Solução Rápida

### Passo 1: Verifique o `.env`

Confirme que o arquivo `.env` existe na **raiz do projeto** com:

```env
VITE_SUPABASE_URL=https://sua_url.supabase.co
VITE_SUPABASE_ANON_KEY=sua_chave_anonima
VITE_API_URL=https://sua-api.onrender.com
```

**⚠️ IMPORTANTE:**
- Use a URL do **Render** (https://...)
- NÃO use `localhost` no mobile!
- NÃO adicione `/` no final da URL

### Passo 2: Rebuild do Projeto

```bash
# 1. Build do frontend com as novas variáveis
npm run build

# 2. Sincronizar com Capacitor (copia o build para o mobile)
npx cap sync

# 3. Abrir no Android Studio
npx cap open android
```

### Passo 3: Rode no Dispositivo/Emulador

No Android Studio:
1. Click em "Run" (▶️) ou pressione `Shift + F10`
2. Aguarde o app instalar e abrir

### Passo 4: Verifique os Logs

Abra o **Logcat** no Android Studio e procure por:

```
🔧 API Configuration:
  - VITE_API_URL: https://sua-api.onrender.com
```

**Se aparecer:**
```
  - VITE_API_URL: ❌ NÃO CONFIGURADO
```

**Então o problema é que:**
- O `.env` não existe OU
- Você não fez `npm run build` depois de criar o `.env` OU
- O `.env` está no lugar errado (deve estar na raiz do projeto)

## 🧪 Teste Completo

1. **Faça login no app mobile**
2. **Adicione um produto**
3. **Verifique o Logcat:**

### ✅ Logs de Sucesso:
```
📝 DataContext: Salvando produto no storage...
✅ DataContext: Produto salvo no storage
🔔 DataContext: doPushInBackground CHAMADO (addProduct)
📤 Sync: Iniciando push para servidor...
📊 Sync: Dados locais: { products: 1, ... }
🔍 Sync: Dados com UUID válido: { products: 1, ... }
📤 Sync: Enviando para servidor: products
✅ Sync: Push completo!
```

### ❌ Logs de Erro (API não configurada):
```
📝 DataContext: Salvando produto no storage...
✅ DataContext: Produto salvo no storage
🔔 DataContext: doPushInBackground CHAMADO (addProduct)
❌ Sync: API_URL não configurado!
❌ Sync: Dados estão sendo salvos APENAS LOCALMENTE
⚠️ DataContext: Sincronização com servidor não disponível
```

4. **Verifique no Supabase:**
   - Abra o painel do Supabase
   - Vá em Table Editor → products
   - O produto deve estar lá!

## 🐛 Problemas Comuns

### Problema 1: "API_URL não configurado" no Logcat

**Causa:** `.env` não foi compilado no build

**Solução:**
```bash
# Certifique-se que o .env existe na raiz
ls -la .env  # ou dir .env no Windows

# Se não existir, crie:
echo VITE_SUPABASE_URL=https://... >> .env
echo VITE_SUPABASE_ANON_KEY=eyJ... >> .env
echo VITE_API_URL=https://sua-api.onrender.com >> .env

# Rebuild
npm run build
npx cap sync
```

### Problema 2: "Failed to fetch" ou "Network Error"

**Causa:** URL da API está incorreta ou servidor está offline

**Solução:**
1. Teste a URL no navegador do celular: `https://sua-api.onrender.com`
2. Deve mostrar: `{"message": "QR Vendas Server API"}`
3. Se não carregar:
   - Verifique se a URL está correta
   - Verifique se o serviço no Render está rodando
   - Serviços gratuitos do Render "dormem" - primeira requisição pode demorar

### Problema 3: Push funciona na Web mas não no Mobile

**Causa:** Variáveis de ambiente diferentes

**Web:** Lê `.env` em tempo real  
**Mobile:** Lê `.env` apenas durante o BUILD

**Solução:**
```bash
# SEMPRE faça isso depois de editar o .env:
npm run build
npx cap sync
```

### Problema 4: "CORS Error" no mobile

**Causa:** Servidor não aceita requisições do mobile

**Solução:** O CORS já foi configurado para aceitar `capacitor://localhost`. Se ainda der erro:
1. Verifique os logs do Render para erros
2. Faça rebuild do servidor no Render
3. Aguarde o deploy completar

## 📝 Checklist Completo

Antes de testar, confirme:

- [ ] Arquivo `.env` existe na **raiz do projeto**
- [ ] `.env` contém `VITE_API_URL=https://sua-api.onrender.com`
- [ ] Executou `npm run build`
- [ ] Executou `npx cap sync`
- [ ] Abriu o app no Android Studio
- [ ] Rodou no dispositivo/emulador
- [ ] Verificou os logs no Logcat
- [ ] API do Render está online (teste no navegador)

## 🎯 Resultado Esperado

Após seguir os passos:

1. ✅ Ao adicionar produto → aparece no Supabase
2. ✅ Ao adicionar cliente → aparece no Supabase
3. ✅ Ao fazer venda → aparece no Supabase
4. ✅ Ao adicionar transação → aparece no Supabase
5. ✅ Logs mostram "Push completo!"
6. ✅ Funciona offline (salva local) e online (sincroniza)

## 💡 Dica Pro

Para facilitar o debug, mantenha o Logcat aberto com filtro:

```
Filtro: DataContext|Sync|API
```

Isso mostra apenas os logs relevantes de sincronização.

## 📞 Ainda Não Funciona?

Se depois de tudo ainda não funcionar:

1. **Cole os logs do Logcat aqui** - ajudarei a diagnosticar
2. **Verifique no navegador do celular:**
   - Abra: `https://sua-api.onrender.com`
   - Deve mostrar: `{"message": "QR Vendas Server API"}`
3. **Teste na web primeiro:**
   - `npm run dev`
   - Adicione um produto
   - Verifique se vai para o Supabase
   - Se funcionar na web mas não no mobile = problema é o build do mobile

---

**TL;DR:** Configure o `.env` → `npm run build` → `npx cap sync` → Rode no Android Studio

