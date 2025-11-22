# 🚀 Configuração com API no Render

Se você já tem a API deployada no Render, siga este guia para configurar o frontend (web e mobile).

## 📋 Passo a Passo

### 1. Descubra a URL do seu serviço no Render

No painel do Render, copie a URL do seu serviço. Deve ser algo como:
```
https://qr-vendas-api.onrender.com
```

### 2. Configure o arquivo `.env` no frontend

Crie ou edite o arquivo `.env` na **raiz do projeto** (não dentro da pasta `server`):

```env
# Supabase (obrigatório)
VITE_SUPABASE_URL=https://sua_url.supabase.co
VITE_SUPABASE_ANON_KEY=sua_chave_anonima_aqui

# URL da API no Render (obrigatório para sincronização)
VITE_API_URL=https://qr-vendas-api.onrender.com
```

**⚠️ IMPORTANTE:**
- Use `https://` (com S) - Render sempre usa HTTPS
- Não adicione barra `/` no final
- Substitua `qr-vendas-api.onrender.com` pela sua URL real do Render

### 3. Configure as variáveis de ambiente no Render

No painel do Render, adicione estas variáveis de ambiente:

```
SUPABASE_URL=https://sua_url.supabase.co
SUPABASE_SERVICE_ROLE=sua_service_role_key_aqui
PORT=8080
```

**⚠️ ATENÇÃO:**
- Use a chave **SERVICE_ROLE**, não a ANON_KEY!
- Encontre a service role key no painel do Supabase em: Settings → API → service_role key

### 4. Rebuild e Deploy

Depois de atualizar as variáveis de ambiente no Render:
1. Vá no painel do Render
2. Clique em "Manual Deploy" → "Deploy latest commit"
3. Aguarde o deploy finalizar

### 5. Para Web (desenvolvimento)

```bash
# Na raiz do projeto
npm install
npm run dev
```

Abra `http://localhost:3000` e faça o teste:
1. Faça login
2. Adicione um produto
3. Verifique o console (F12) - deve ver:
   ```
   ✅ Sync: Push completo!
   ```

### 6. Para Mobile

```bash
# Build do frontend
npm run build

# Sincronizar com Capacitor
npx cap sync

# Abrir no Android Studio ou Xcode
npx cap open android
# ou
npx cap open ios
```

No mobile, abra o Logcat (Android) ou Console (iOS) e verifique os logs de sincronização.

## ✅ Testando a Conexão

### Teste 1: API está online?

Abra no navegador:
```
https://qr-vendas-api.onrender.com
```

Deve ver:
```json
{"message": "QR Vendas Server API"}
```

Se não carregar, verifique:
- O deploy no Render está ativo?
- As variáveis de ambiente estão configuradas?
- Há erros nos logs do Render?

### Teste 2: Sincronização funciona?

1. No frontend, abra o console (F12)
2. Adicione um produto
3. Procure nos logs:

**✅ Sucesso:**
```
📝 DataContext: Salvando produto no storage...
✅ DataContext: Produto salvo no storage
📤 Sync: Iniciando push para servidor...
📊 Sync: Dados locais: { products: 1, ... }
✅ Sync: Push completo!
```

**❌ Erro comum 1: CORS**
```
Access to fetch at 'https://...' from origin '...' has been blocked by CORS
```
**Solução:** O servidor já foi atualizado para aceitar requisições do mobile. Faça rebuild no Render.

**❌ Erro comum 2: 401 Unauthorized**
```
❌ Sync: Erro ao fazer push: HTTP 401
```
**Solução:** 
- Verifique se fez login no sistema
- Verifique se `SUPABASE_URL` e `SUPABASE_SERVICE_ROLE` estão corretos no Render

**❌ Erro comum 3: Network Error**
```
TypeError: Failed to fetch
```
**Solução:**
- Verifique se a URL no `.env` está correta
- Verifique se o serviço no Render está rodando
- Verifique se tem internet

## 🔧 Troubleshooting Avançado

### Problema: "Service Unavailable" no Render

O Render coloca serviços gratuitos para "dormir" após 15 minutos de inatividade. A primeira requisição pode demorar 30-60 segundos para acordar o serviço.

**Soluções:**
1. Aguarde a primeira requisição completar
2. Considere upgrade para plano pago se precisa de 24/7 uptime
3. Use um serviço como [UptimeRobot](https://uptimerobot.com/) para fazer ping a cada 5 minutos

### Problema: Mobile não conecta mas web funciona

1. Verifique se está usando HTTPS na URL (não HTTP)
2. Teste abrir a URL da API no navegador do celular
3. Verifique se o celular tem internet
4. Rebuild o servidor no Render (CORS foi atualizado)

### Problema: Dados não aparecem após sincronizar

1. Verifique se o usuário está logado com a mesma conta
2. Verifique se os dados estão no Supabase (painel → Table Editor)
3. Force uma sincronização manual (botão de sync no header)
4. Veja os logs do servidor no Render para erros

## 📱 Configuração Específica do Mobile

O mobile faz requisições de `capacitor://localhost`, que é tratado pelo servidor como uma requisição sem "origin". O CORS foi configurado para permitir isso.

**Não precisa mudar nada no código do mobile!** Apenas configure o `.env` com a URL do Render e faça `npm run build` + `npx cap sync`.

## 🔐 Segurança

**Nunca commite o arquivo `.env` para o git!**

O arquivo `.gitignore` já está configurado para ignorar `.env`, mas sempre confira antes de fazer commit.

Para o Render:
- Configure as variáveis de ambiente no painel web
- Use a SERVICE_ROLE key apenas no backend
- Use a ANON_KEY apenas no frontend

## 🎉 Pronto!

Com isso configurado, o sistema deve:
1. ✅ Salvar dados localmente (SQLite no mobile, localStorage na web)
2. ✅ Sincronizar automaticamente com Supabase via API do Render
3. ✅ Funcionar offline (salva local) e online (sincroniza)
4. ✅ Limpar dados ao fazer logout

## 📞 Problemas?

Se ainda tiver problemas:
1. Confira os logs no painel do Render
2. Confira o console do navegador (F12)
3. Confira o Logcat no Android Studio
4. Teste a URL da API diretamente no navegador
5. Verifique se as variáveis de ambiente estão corretas no Render e no `.env`

