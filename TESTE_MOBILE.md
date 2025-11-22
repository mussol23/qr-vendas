# 🧪 Guia de Teste - Mobile

## ✅ Correções Implementadas

### 1. Permissão de Câmera
- ✅ Adicionado `READ_EXTERNAL_STORAGE`
- ✅ Adicionado `WRITE_EXTERNAL_STORAGE`

### 2. Logs Detalhados
- ✅ SQLite com logs completos de inicialização
- ✅ DataContext com logs de salvamento
- ✅ Storage com verificação de provider

---

## 🚀 Como Rebuildar o App

### Windows:
```bash
rebuild-mobile.bat
```

### Manual:
```bash
npm run build
npx cap sync
npx cap open android
```

---

## 🔍 Como Verificar os Logs no Android Studio

1. **Abrir Logcat**: `View > Tool Windows > Logcat`
2. **Filtrar por "Console"** ou "Chromium"
3. **Procurar pelos emojis**: 📱 🔄 ✅ ❌ 💾 📦

---

## 📋 Checklist de Teste

### Teste 1: Inicialização do SQLite
**Ao abrir o app, procure no Logcat:**
```
📱 Storage: Plataforma nativa detectada, tentando SQLite...
📱 SQLite: Iniciando no mobile...
🔑 SQLite: Solicitando permissões...
✅ SQLite: Permissões: ...
🔗 SQLite: Criando conexão...
📂 SQLite: Abrindo banco de dados...
🔧 SQLite: Executando migrações...
✅ SQLite: Inicialização completa!
✅ Storage: SQLite inicializado com sucesso
```

**Se aparecer:**
```
❌ Storage: SQLite falhou, usando WebStorage
⚠️ Storage: Usando WebStorage como fallback (dados não persistem no mobile!)
```
**PROBLEMA: SQLite não inicializou!** Me envie o erro completo.

---

### Teste 2: Salvar Produto
**Cadastre um produto e procure no Logcat:**
```
➕ DataContext: Adicionando novo produto: [id] [nome]
📝 DataContext: Salvando produto no storage: MobileSQLiteStorage
💾 SQLite: Salvando produto: [id] [nome]
✅ SQLite: Produto salvo e commitado
💾 SQLite: Executando saveToStore...
✅ SQLite: saveToStore completo
✅ DataContext: Produto salvo no storage
🔍 DataContext: Verificação - 1 produtos no storage
✅ DataContext: Produto confirmado no storage
✅ DataContext: Produto adicionado ao estado React
```

**Se aparecer:**
```
❌ DataContext: Produto NÃO foi encontrado após salvar!
```
**PROBLEMA: SQLite não está persistindo!** Me envie os logs completos.

---

### Teste 3: Fechar e Reabrir o App
1. **Cadastre 2-3 produtos**
2. **Feche o app completamente** (swipe no gerenciador de tarefas)
3. **Reabra o app**
4. **Procure no Logcat:**
```
🔄 DataContext: Carregando dados do storage...
✅ DataContext: Storage obtido: MobileSQLiteStorage
📦 SQLite: Carregando produtos...
✅ SQLite: 3 produtos carregados
📦 Dados carregados do storage: {products: 3, clients: 0, sales: 0, transactions: 0}
```

**Se aparecer:**
```
📦 SQLite: Carregando produtos...
✅ SQLite: 0 produtos carregados
```
**PROBLEMA: Dados não persistiram!** Me envie os logs de quando salvou E de quando reabriu.

---

### Teste 4: Sincronização com Supabase
**Após carregar os dados, aguarde 2 segundos e procure:**
```
🔄 Iniciando sincronização automática...
```

**Se aparecer erro de conexão:**
```
POST https://server-qr-vendas.onrender.com/sync/push net::ERR_CONNECTION_REFUSED
```
**Verifique a conexão com a internet.**

---

### Teste 5: Câmera
1. **Abrir o scanner no POS**
2. **Permitir câmera quando solicitado**
3. **Procure no Logcat:**
```
📷 Inicializando scanner...
📱 Plataforma nativa detectada, solicitando permissão Capacitor...
✅ Resultado da permissão Capacitor: {camera: 'granted'}
🌐 Solicitando permissão do navegador...
✅ Permissão do navegador concedida
📷 Câmeras encontradas: 1
🎥 Iniciando scanner...
✅ Scanner iniciado com sucesso!
```

**Se aparecer erro:**
```
❌ Permissão da câmera negada
```
**Vá em:** Configurações > Apps > QR Vendas > Permissões > Ativar Câmera

---

## 🐛 Problemas Conhecidos

### Se o SQLite não inicializar:
1. **Verifique se o plugin está instalado:**
   ```bash
   npm list @capacitor-community/sqlite
   ```
2. **Reinstale o plugin:**
   ```bash
   npm install @capacitor-community/sqlite@^6.0.0
   npx cap sync
   ```

### Se os dados não persistirem:
1. **Limpe o cache do app:**
   - Configurações > Apps > QR Vendas > Armazenamento > Limpar dados
2. **Reinstale o app completamente**
3. **Me envie TODOS os logs do Logcat**

---

## 📤 O Que Enviar em Caso de Erro

1. **Logs completos do Logcat** (desde a abertura do app até o erro)
2. **Screenshot do erro** (se houver)
3. **Qual teste falhou** (1, 2, 3, 4 ou 5)
4. **Versão do Android**

---

## ✅ Se Tudo Funcionar

Me envie:
```
✅ Teste 1: SQLite inicializado
✅ Teste 2: Produto salvo
✅ Teste 3: Produto persistiu após fechar/abrir
✅ Teste 4: Sincronização funcionou
✅ Teste 5: Câmera funcionou
```

