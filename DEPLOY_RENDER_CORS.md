# 🚀 Deploy da Correção de CORS no Render

## ❌ Problema Identificado

O mobile está sendo **bloqueado por CORS**:
```
Access to fetch at 'https://server-qr-vendas.onrender.com/sync/push' 
from origin 'https://localhost' has been blocked by CORS policy
```

**Causa:** O Capacitor mobile faz requisições de `https://localhost`, mas o servidor no Render não estava aceitando essa origem.

## ✅ Correção Aplicada

Adicionei `https://localhost` à lista de origens permitidas no CORS:

```typescript
const allowedOrigins = [
  'http://localhost:3000',
  'https://localhost:3000',
  'http://localhost:5173',
  'https://localhost:5173',
  'https://localhost', // ⭐ Capacitor mobile
  'capacitor://localhost',
  'ionic://localhost',
];
```

## 🔧 Como Fazer Deploy no Render

### Opção 1: Via Git (Recomendado)

**Se o servidor está conectado ao Git:**

```bash
# 1. Na pasta do servidor
cd server

# 2. Commit as mudanças
git add src/index.ts
git commit -m "fix: adicionar CORS para Capacitor mobile (https://localhost)"

# 3. Push para o repositório
git push origin main
# ou
git push origin master
```

**4. O Render vai fazer deploy automático!**
- Vai detectar o push
- Vai fazer rebuild automaticamente
- Aguarde 2-5 minutos

### Opção 2: Deploy Manual no Painel do Render

**Se não estiver usando Git ou quiser deploy manual:**

1. **Acesse o painel do Render**
   - https://dashboard.render.com

2. **Selecione seu serviço**
   - Clique em "server-qr-vendas" (ou nome do seu serviço)

3. **Atualize o código**
   - Método A: Conecte ao Git e faça push
   - Método B: Use "Manual Deploy" → "Clear build cache & deploy"

4. **Aguarde o deploy**
   - Status: "Building..." → "Live"
   - Tempo: 2-5 minutos

### Opção 3: Atualizar Código Manualmente no Render

**Se o código não está no Git:**

1. **Copie o arquivo `server/src/index.ts` atualizado**

2. **No painel do Render:**
   - Vá em "Shell" ou "Console"
   - Ou use FTP/SSH se configurado

3. **Substitua o arquivo**
   - Cole o conteúdo do `index.ts` atualizado

4. **Reinicie o serviço**
   - "Manual Deploy" → "Deploy latest commit"

## 🧪 Como Testar Se Funcionou

### Teste 1: Verificar se o Deploy Terminou

1. Acesse: `https://server-qr-vendas.onrender.com`
2. Deve ver: `{"message": "QR Vendas Server API"}`
3. Verifique os logs no Render

### Teste 2: Verificar CORS nos Logs do Render

No painel do Render, vá em "Logs" e procure por:
```
✅ Server running on port 8080
📡 CORS enabled for multiple origins
```

### Teste 3: Testar do Mobile

```bash
# 1. No frontend (NÃO precisa rebuild!)
# O frontend já está correto, só faltava o servidor aceitar

# 2. Abra o app mobile
npx cap open android

# 3. Adicione um produto

# 4. Verifique o console/Logcat:
```

**✅ Se funcionou:**
```
📤 Sync: Iniciando push para servidor...
⏰ Sync: Chamando apiPost...
✅ Sync: Resposta recebida: { ok: true }
🎉 Sync: Push completo com sucesso!
```

**❌ Se ainda der erro:**
```
Access to fetch blocked by CORS
```
→ Deploy ainda não terminou ou não foi aplicado

### Teste 4: Verificar no Supabase

1. Adicione um produto no mobile
2. Vá no Supabase → Table Editor → products
3. O produto deve aparecer!

## 🔥 Solução Rápida (Se Tiver Acesso ao Código no Render)

Se você tem acesso direto ao código do servidor no Render:

```bash
# No terminal do Render (Shell):
cd /opt/render/project/src
nano index.ts

# Adicione 'https://localhost' na linha 20 (dentro de allowedOrigins)

# Salve (Ctrl+O, Enter, Ctrl+X)

# Reinicie o serviço
npm run build
pm2 restart all
```

## ⚡ Verificação Rápida

Execute este comando no terminal para verificar se o CORS aceita o mobile:

```bash
curl -H "Origin: https://localhost" \
     -H "Access-Control-Request-Method: POST" \
     -H "Access-Control-Request-Headers: Content-Type, Authorization" \
     -X OPTIONS \
     --verbose \
     https://server-qr-vendas.onrender.com/sync/push
```

**✅ Deve ver:**
```
< HTTP/2 204
< access-control-allow-origin: https://localhost
< access-control-allow-methods: GET, POST, PUT, PATCH, DELETE, OPTIONS
```

**❌ Se não ver `access-control-allow-origin`:**
→ Deploy ainda não foi aplicado

## 📝 Checklist de Deploy

- [ ] Código atualizado em `server/src/index.ts`
- [ ] Commit feito (se usando Git)
- [ ] Push para o repositório (se usando Git)
- [ ] Deploy iniciado no Render
- [ ] Deploy completado (status "Live")
- [ ] Logs do Render mostram "Server running"
- [ ] URL da API responde: `https://server-qr-vendas.onrender.com`
- [ ] Teste CORS com curl passou
- [ ] Teste do mobile passou
- [ ] Produto apareceu no Supabase

## 🎉 Depois do Deploy

1. **NÃO precisa rebuild do frontend!**
   - O frontend já está correto
   - Era só o servidor que precisava aceitar

2. **Teste imediatamente:**
   - Abra o app mobile
   - Adicione um produto
   - Deve sincronizar!

3. **Verifique os logs:**
   - Console mobile: ✅ Push completo
   - Logs Render: Nenhum erro de CORS
   - Supabase: Dados aparecem

## 🆘 Se Ainda Não Funcionar

1. **Confirme que o deploy terminou:**
   - Status deve ser "Live" no Render
   - Não pode estar "Building"

2. **Teste a URL diretamente:**
   ```bash
   curl https://server-qr-vendas.onrender.com
   ```
   Deve retornar: `{"message":"QR Vendas Server API"}`

3. **Verifique os logs do Render:**
   - Procure por erros
   - Deve ver "Server running on port 8080"

4. **Clear cache do Render:**
   - "Manual Deploy" → "Clear build cache & deploy"

5. **Se nada funcionar:**
   - Me envie os logs do Render
   - Me envie os logs do mobile
   - Vamos debugar juntos!

---

**TL;DR:** 
1. Faça commit e push do código atualizado
2. Aguarde deploy no Render (2-5 min)
3. Teste no mobile - deve funcionar! ✅

