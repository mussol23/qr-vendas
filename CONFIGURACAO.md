# 🔧 Configuração do QR Vendas

## 📋 Variáveis de Ambiente Necessárias

Para o sistema funcionar completamente (incluindo sincronização com Supabase), você precisa configurar as seguintes variáveis de ambiente:

### 1. Crie o arquivo `.env` na raiz do projeto

```env
# Supabase Configuration (obrigatório)
VITE_SUPABASE_URL=sua_url_do_supabase_aqui
VITE_SUPABASE_ANON_KEY=sua_chave_anonima_do_supabase_aqui

# Backend API URL (obrigatório para sincronização)
# Web (desenvolvimento local): use http://localhost:8080
# Mobile (desenvolvimento): use o IP da sua máquina
# Produção: use a URL do servidor em produção
VITE_API_URL=http://localhost:8080
```

## ⚠️ IMPORTANTE PARA MOBILE

**No mobile, "localhost" NÃO funciona!** O dispositivo móvel não consegue acessar `localhost` do seu computador.

### Como descobrir o IP da sua máquina:

**Windows:**
```bash
ipconfig
```
Procure por "IPv4 Address" na conexão ativa

**Mac/Linux:**
```bash
ifconfig
# ou
ip addr show
```

**Exemplo de configuração para mobile:**
```env
VITE_API_URL=http://192.168.1.100:8080
```

## 🚀 Configuração Passo a Passo

### 1. Frontend (.env na raiz)

```env
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGc...
VITE_API_URL=http://192.168.1.100:8080
```

### 2. Backend (server/.env)

```env
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_ROLE=eyJhbGc...
PORT=8080
```

**ATENÇÃO:** Use a chave **SERVICE_ROLE** no backend, não a ANON_KEY!

### 3. Iniciar os Serviços

**Terminal 1 - Backend:**
```bash
cd server
npm install
npm run dev
```

**Terminal 2 - Frontend:**
```bash
npm install
npm run dev
```

**Para Mobile:**
```bash
npm run build
npx cap sync
npx cap open android  # ou ios
```

## ✅ Como Verificar se a Sincronização está Funcionando

1. Abra o console do navegador (F12)
2. Faça login no sistema
3. Adicione um produto, cliente ou faça uma venda
4. Observe os logs no console:

### ✅ Logs de Sucesso:
```
📝 DataContext: Salvando produto no storage...
✅ DataContext: Produto salvo no storage
🔔 DataContext: doPushInBackground CHAMADO (addProduct)
📤 Sync: Iniciando push para servidor...
✅ Sync: Push completo!
```

### ❌ Logs de Erro (API não configurada):
```
❌ Sync: API_URL não configurado!
❌ Sync: Dados estão sendo salvos APENAS LOCALMENTE
```

Se ver os logs de erro, verifique:
1. O arquivo `.env` existe na raiz do projeto?
2. O `VITE_API_URL` está configurado?
3. No mobile, está usando IP ao invés de localhost?
4. O servidor backend está rodando?

## 🔍 Diagnóstico de Problemas

### Problema: "API_URL não configurado"
**Solução:** Crie o arquivo `.env` com `VITE_API_URL` configurado

### Problema: Dados não sincronizam no mobile
**Solução:** Use o IP da máquina (ex: 192.168.1.100) ao invés de localhost

### Problema: "Erro 401" ou "Sem autenticação"
**Solução:** Verifique se fez login no sistema e se as credenciais do Supabase estão corretas

### Problema: "CORS error"
**Solução:** O servidor já está configurado para aceitar requisições do Capacitor (`capacitor://localhost`)

## 📱 Sincronização no Mobile

O mobile usa **SQLite local** para armazenar dados offline. Quando o dispositivo está online, o sistema:

1. ✅ Salva dados localmente no SQLite
2. ✅ Envia dados para o Supabase via API backend
3. ✅ Sincroniza automaticamente ao abrir o app (se online)
4. ✅ Tenta sincronizar após cada operação (adicionar, editar, deletar)

**Sem API configurada:** Dados ficam apenas no SQLite local (não sincronizam)

## 🔐 Limpeza de Dados no Logout

O sistema agora limpa **TODOS** os dados locais ao fazer logout:
- SQLite (mobile): deleta todas as tabelas
- localStorage (web): remove todos os backups
- Estado React: limpa todas as variáveis

Isso garante que outro usuário não veja dados de outra pessoa ao fazer login no mesmo dispositivo.

## 📞 Suporte

Se ainda tiver problemas:
1. Verifique os logs do console (F12)
2. Verifique se o servidor backend está rodando
3. Teste a URL do API no navegador: `http://SEU_IP:8080` (deve responder)
4. Verifique se o firewall não está bloqueando a porta 8080

