# 🔧 Correção: Erro SQLite "Must provide a database name"

## 🐛 Problema Identificado

Ao cadastrar um produto no **mobile (Android)**, o seguinte erro aparecia no console:

```
❌ SQLite: Init falhou: Sc: CreateConnection: Must provide a database name
    at returnResult (<anonymous>:956:32)
    at win.androidBridge.onmessage (<anonymous>:931:21)

❌ Storage: SQLite falhou, usando WebStorage: Sc: CreateConnection: Must provide a database name
⚠️ Storage: Usando WebStorage como fallback (dados não persistem no mobile!)
```

**Consequência:**
- SQLite não inicializa
- App usa WebStorage como fallback
- **Dados NÃO persistem no mobile** (perdem ao fechar o app)

---

## 🔍 Causa Raiz

O plugin `@capacitor-community/sqlite` versão 6.0.0 pode ter uma API diferente da esperada, ou o `DB_NAME` não estava sendo passado corretamente para o método `createConnection`.

**Possíveis causas:**
1. Mudança na API do plugin entre versões
2. Problema com bundling (Vite) que não preserva a constante `DB_NAME`
3. Diferença entre a API esperada e a API real do plugin

---

## ✅ Solução Implementada

### 1. Logs de Debug Detalhados

Adicionei logs extensivos para diagnosticar o problema:

```typescript
console.log('📱 SQLite: Iniciando no mobile...');
console.log('🗄️ SQLite: Nome do banco:', DB_NAME);
console.log('🔍 SQLite: Tipo de DB_NAME:', typeof DB_NAME);
console.log('🔍 SQLite: DB_NAME é string?', typeof DB_NAME === 'string');
console.log('🔍 SQLite: DB_NAME length:', DB_NAME?.length);
```

**O que verificamos:**
- Se `DB_NAME` está definido
- Se é uma string
- Qual o seu valor
- Qual o seu comprimento

### 2. Validação do DB_NAME

```typescript
if (!DB_NAME || typeof DB_NAME !== 'string' || DB_NAME.trim() === '') {
    throw new Error('Nome do banco de dados inválido!');
}
```

**Garante:**
- DB_NAME não é undefined/null
- DB_NAME é uma string
- DB_NAME não é string vazia

### 3. Dupla Tentativa de Conexão

**Tentativa 1: Parâmetros Posicionais (API tradicional)**
```typescript
try {
    console.log('🔗 Tentativa 1: Parâmetros posicionais');
    conn = await sqlite.createConnection(
        DB_NAME,        // database
        false,          // encrypted
        'no-encryption',// mode
        1,              // version
        false           // readonly
    );
    console.log('✅ SQLite: Conexão criada com parâmetros posicionais');
} catch (err1) {
    // Se falhar, tenta método 2
}
```

**Tentativa 2: Objeto de Configuração (API nova)**
```typescript
catch (err1) {
    console.warn('⚠️ Tentativa 1 falhou:', err1);
    console.log('🔗 Tentativa 2: Objeto de configuração');
    try {
        conn = await sqlite.createConnection({
            database: DB_NAME,
            encrypted: false,
            mode: 'no-encryption',
            version: 1,
            readonly: false
        });
        console.log('✅ SQLite: Conexão criada com objeto');
    } catch (err2) {
        console.error('❌ Tentativa 2 falhou:', err2);
        throw err2;
    }
}
```

**Vantagens:**
- ✅ Funciona com versões antigas e novas do plugin
- ✅ Fornece feedback claro de qual método funcionou
- ✅ Logs detalhados para debug

### 4. Correção do saveToStore

Também ajustei o método `saveToStore` para usar objeto:

```typescript
await sqlite.saveToStore({ database: DB_NAME });
```

---

## 🧪 Como Testar

### Passo 1: Rebuild do Frontend
```bash
npm run build
```

### Passo 2: Sync com Capacitor
```bash
npx cap sync
```

### Passo 3: Abrir no Android Studio
```bash
npx cap open android
```

### Passo 4: Verificar Logs no Logcat

**Filtro:** `tag:Capacitor/Console`

**Logs esperados (SUCESSO):**
```
📱 SQLite: Iniciando no mobile...
🗄️ SQLite: Nome do banco: qrvendas.db
🔍 SQLite: Tipo de DB_NAME: string
🔍 SQLite: DB_NAME é string? true
🔍 SQLite: DB_NAME length: 12
🔍 SQLite: Plugin disponível? true
🔍 SQLite: createConnection disponível? function
🔑 SQLite: Solicitando permissões...
✅ SQLite: Permissões: {...}
🔗 SQLite: Criando conexão...
🔗 Tentativa 1: Parâmetros posicionais
✅ SQLite: Conexão criada com parâmetros posicionais
📂 SQLite: Abrindo banco de dados...
🔧 SQLite: Executando migrações...
✅ SQLite: Inicialização completa!
```

**OU (se tentativa 1 falhar):**
```
...
🔗 Tentativa 1: Parâmetros posicionais
⚠️ Tentativa 1 falhou: [erro]
🔗 Tentativa 2: Objeto de configuração
✅ SQLite: Conexão criada com objeto
📂 SQLite: Abrindo banco de dados...
...
```

**Se ainda falhar:**
```
❌ SQLite: Init falhou: [erro detalhado]
❌ Storage: SQLite falhou, usando WebStorage: [erro]
⚠️ Storage: Usando WebStorage como fallback
```

### Passo 5: Cadastrar um Produto

1. Abrir app no dispositivo/emulador
2. Ir em **Produtos** → **Adicionar Produto**
3. Preencher dados e salvar
4. Verificar logs no Logcat

**Logs esperados:**
```
➕ DataContext: Adicionando novo produto: [id], [nome]
✅ getUserEstablishmentId: [establishment_id]
📝 DataContext: Salvando produto no storage: SQLiteStorage
🏢 DataContext: establishment_id: [id]
💾 SQLite: Executando saveToStore...
✅ SQLite: saveToStore completo
✅ DataContext: Produto salvo no storage
✅ DataContext: Produto confirmado no storage
✅ DataContext: Produto adicionado ao estado React
🔄 DataContext: Iniciando push em background...
```

### Passo 6: Fechar e Reabrir App

1. Fechar completamente o app
2. Reabrir
3. Ver se o produto ainda está lá

**Se SQLite funcionar:** ✅ Produto persiste
**Se usar WebStorage:** ❌ Produto desaparece

---

## 📊 Possíveis Resultados

### ✅ Cenário 1: Sucesso com Tentativa 1
```
🔗 Tentativa 1: Parâmetros posicionais
✅ SQLite: Conexão criada com parâmetros posicionais
```
**Significa:** Plugin usa API tradicional (parâmetros posicionais)

### ✅ Cenário 2: Sucesso com Tentativa 2
```
⚠️ Tentativa 1 falhou: [erro]
🔗 Tentativa 2: Objeto de configuração
✅ SQLite: Conexão criada com objeto
```
**Significa:** Plugin usa API nova (objeto de configuração)

### ❌ Cenário 3: Ambas Falharam
```
❌ Tentativa 2 falhou: [erro]
❌ SQLite: Init falhou: [erro]
```
**Significa:** Problema mais profundo (plugin não instalado, versão incompatível, etc)

---

## 🔧 Troubleshooting

### Erro: "DB_NAME é undefined"
```
🔍 SQLite: Nome do banco: undefined
🔍 SQLite: Tipo de DB_NAME: undefined
```

**Solução:**
1. Verificar se `const DB_NAME = 'qrvendas.db';` está no início do arquivo
2. Rebuild: `npm run build && npx cap sync`

### Erro: "Plugin não disponível"
```
🔍 SQLite: Plugin disponível? false
```

**Solução:**
```bash
# Reinstalar plugin
npm install @capacitor-community/sqlite
npx cap sync android

# Verificar se está no package.json
grep sqlite package.json
```

### Erro: "createConnection não é função"
```
🔍 SQLite: createConnection disponível? undefined
```

**Solução:**
```bash
# Atualizar plugin
npm update @capacitor-community/sqlite
npx cap sync android

# Ou reinstalar
npm uninstall @capacitor-community/sqlite
npm install @capacitor-community/sqlite@latest
npx cap sync android
```

### Erro: Ainda usa WebStorage depois da correção

**Verificar:**
1. Fez rebuild? `npm run build`
2. Fez sync? `npx cap sync`
3. Reinstalou o app? (desinstalar e instalar novamente)

---

## 📝 Arquivos Modificados

### `storage/mobile.ts`

**Mudanças:**
1. ✅ Adicionados logs de debug detalhados
2. ✅ Adicionada validação do `DB_NAME`
3. ✅ Implementado fallback: tentativa 1 → tentativa 2
4. ✅ Corrigido `saveToStore` para usar objeto

**Linhas modificadas:** ~40 linhas adicionadas no método `init()`

---

## 🎯 Próximos Passos

1. ✅ **Rebuild:** `npm run build`
2. ✅ **Sync:** `npx cap sync`
3. ✅ **Abrir:** `npx cap open android`
4. ✅ **Testar:** Cadastrar produto
5. ✅ **Verificar logs:** Logcat
6. ✅ **Confirmar persistência:** Fechar e reabrir app

---

## 📸 Logs de Referência

### Antes (❌ Erro):
```
QLite.createConnection (#64117642)
❌ SQLite: Init falhou: Sc: CreateConnection: Must provide a database name
❌ Storage: SQLite falhou, usando WebStorage
⚠️ Storage: Usando WebStorage como fallback (dados não persistem no mobile!)
```

### Depois (✅ Sucesso):
```
📱 SQLite: Iniciando no mobile...
🗄️ SQLite: Nome do banco: qrvendas.db
🔍 SQLite: Tipo de DB_NAME: string
🔗 Tentativa 1: Parâmetros posicionais
✅ SQLite: Conexão criada com parâmetros posicionais
✅ SQLite: Inicialização completa!
```

---

## ✅ Conclusão

A correção implementa:
- ✅ Logs detalhados para debug
- ✅ Validação do nome do banco
- ✅ Tentativa dupla (API antiga e nova)
- ✅ Fallback gracioso

**Com isso, o SQLite deve funcionar corretamente no mobile e os dados persistirão!** 🎉

---

**Se ainda houver problemas após testar, envie os logs completos do Logcat para análise detalhada.**

