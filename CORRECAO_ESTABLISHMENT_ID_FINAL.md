# 🔧 Correção Final: establishment_id NULL nas Tabelas

## 🐛 Problema

Mesmo após as correções anteriores, o `establishment_id` **ainda vem NULL** no Supabase para produtos, clientes, vendas e transações.

## 🔍 Causa Raiz

Existem **DUAS** causas possíveis:

### 1. Usuário Não Tem `establishment_id` no Profile ⚠️

Se o usuário não tem `establishment_id` no profile, **NENHUM** dado pode ser criado com `establishment_id`.

**Como verificar:**
```sql
-- No Supabase SQL Editor
SELECT 
    user_id, 
    full_name, 
    establishment_id
FROM profiles
WHERE establishment_id IS NULL;
```

**Se retornar registros:** ❌ Usuários sem establishment

### 2. Servidor Rodando Código Antigo ⚠️

Se você não fez deploy no Render, o servidor ainda está com o código antigo que **não** injeta o `establishment_id`.

---

## ✅ Correções Implementadas

### 1. Servidor: FORÇAR establishment_id (server/src/routes/sync.ts)

**Mudança principal:**
```typescript
// ANTES (podia sobrescrever com null)
processedRows = rows.map(row => ({
  ...row,
  establishment_id: establishmentId,
}));

// AGORA (SEMPRE força o correto)
processedRows = rows.map(row => {
  const { establishment_id: _, ...rowWithoutEstablishment } = row;
  return {
    ...rowWithoutEstablishment,
    establishment_id: establishmentId, // FORÇA
  };
});
```

**O que faz:**
1. Remove qualquer `establishment_id` que vem do cliente
2. Injeta o `establishment_id` do usuário autenticado
3. Se usuário não tem `establishment_id`, **REJEITA** o push

**Logs adicionados:**
```
📤 Push from user abc-123, establishment: xyz-789
📤 User object: { id: "...", email: "...", establishment_id: "..." }
🔒 FORÇADO establishment_id xyz-789 em 5 registros de products
```

### 2. Bootstrap: SEMPRE Criar Establishment (server/src/routes/user.bootstrap.ts)

**Mudanças:**
1. ✅ Verifica se usuário já tem establishment
2. ✅ Se não tem, **cria automaticamente**
3. ✅ Se tem store name, usa; senão usa `"Loja de [nome]"`
4. ✅ SEMPRE inclui `establishment_id` no upsert do profile
5. ✅ Logs detalhados em cada passo

**Logs adicionados:**
```
🔧 Bootstrap: User abc-123 (user@email.com)
🔍 Bootstrap: Establishment existente: nenhum
🏪 Bootstrap: Criando establishment "Minha Loja"
✅ Bootstrap: Establishment criado: xyz-789
👤 Bootstrap: Atualizando profile com establishment_id: xyz-789
✅ Bootstrap: Completo para user abc-123
```

---

## 🔧 Como Corrigir Usuários Existentes

### Opção 1: Script SQL Automático (Recomendado) ⭐

Execute no **Supabase SQL Editor:**

```sql
-- 1. Criar establishments para usuários que não têm
INSERT INTO establishments (id, name, active, updated_at)
SELECT 
    gen_random_uuid() as id,
    COALESCE(p.full_name || '''s Store', 'Store ' || substring(p.user_id::text, 1, 8)) as name,
    true as active,
    now() as updated_at
FROM profiles p
WHERE p.establishment_id IS NULL
ON CONFLICT DO NOTHING;

-- 2. Linkar os establishments aos profiles
WITH new_establishments AS (
    SELECT 
        p.user_id,
        e.id as establishment_id
    FROM profiles p
    CROSS JOIN LATERAL (
        SELECT id 
        FROM establishments e
        WHERE e.name LIKE '%' || COALESCE(p.full_name, substring(p.user_id::text, 1, 8)) || '%'
        LIMIT 1
    ) e
    WHERE p.establishment_id IS NULL
)
UPDATE profiles p
SET 
    establishment_id = ne.establishment_id,
    updated_at = now()
FROM new_establishments ne
WHERE p.user_id = ne.user_id;

-- 3. Verificar resultados
SELECT 
    COUNT(*) as total_profiles,
    COUNT(establishment_id) as profiles_with_establishment,
    COUNT(*) - COUNT(establishment_id) as profiles_without_establishment
FROM profiles;
```

**Resultado esperado:**
```
total_profiles | profiles_with_establishment | profiles_without_establishment
--------------+-----------------------------+-------------------------------
      5      |              5              |              0
```

### Opção 2: Correção Manual por Usuário

```sql
-- 1. Criar establishment
INSERT INTO establishments (name, active) 
VALUES ('Minha Loja', true) 
RETURNING id;

-- 2. Copiar o ID retornado e atualizar profile
UPDATE profiles 
SET establishment_id = 'ID_COPIADO_AQUI', updated_at = now()
WHERE user_id = 'USER_ID_AQUI';
```

### Opção 3: Fazer Login/Logout (Automático)

O bootstrap melhorado **cria automaticamente** se não existir:

1. Usuário faz logout
2. Usuário faz login novamente
3. Bootstrap é chamado automaticamente
4. Se não tem establishment, cria um
5. Atualiza o profile

---

## 🚀 Deploy e Teste

### Passo 1: Deploy no Render

```bash
cd server
git add .
git commit -m "fix: forçar establishment_id e melhorar bootstrap"
git push origin main
```

**OU no painel do Render:**
1. Dashboard → `server-qr-vendas`
2. "Manual Deploy" → "Deploy latest commit"
3. Aguardar 2-5 minutos

### Passo 2: Verificar Deploy

Acessar: `https://server-qr-vendas.onrender.com`

Deve ver: `{"message": "QR Vendas Server API"}`

### Passo 3: Corrigir Usuários Existentes

Execute o **Script SQL Opção 1** no Supabase.

### Passo 4: Fazer Logout/Login no App

1. Abrir app (web ou mobile)
2. Fazer logout
3. Fazer login novamente
4. Bootstrap será chamado

### Passo 5: Cadastrar Produto de Teste

1. Ir em Produtos → Adicionar Produto
2. Preencher e salvar
3. Aguardar sync

### Passo 6: Verificar Logs do Servidor

**Render Dashboard → Logs:**

```
📤 Push from user abc-123, establishment: xyz-789
📤 User object: {
  "id": "abc-123",
  "email": "user@test.com",
  "establishment_id": "xyz-789",
  "role": "user"
}
🔒 FORÇADO establishment_id xyz-789 em 1 registros de products
✅ Successfully upserted 1 rows to products
```

**Se ver isso:** ✅ Está funcionando!

**Se ver:**
```
⚠️ ATENÇÃO: Usuário abc-123 (user@test.com) NÃO TEM establishment_id!
❌ User abc-123 não tem establishment_id, mas tentou fazer push em products
```

**Então:** ❌ Usuário ainda não tem establishment → Executar Script SQL

### Passo 7: Verificar no Supabase

**Table Editor → products:**

| id | name | price | establishment_id |
|----|------|-------|------------------|
| 123| Test | 10.00 | **xyz-789** ✅   |

**Se `establishment_id` está preenchido:** ✅ SUCESSO!

---

## 🧪 Testes Completos

### Teste 1: Verificar Profile
```sql
-- Seu user_id do Supabase Auth
SELECT * FROM profiles WHERE user_id = 'SEU_USER_ID';
```

**Esperado:**
- `establishment_id`: ✅ Preenchido (UUID)

**Se NULL:**
- Execute Script SQL Opção 1
- OU faça logout/login no app

### Teste 2: Cadastrar Produto
1. Cadastrar produto no app
2. Verificar logs do servidor (Render)
3. Verificar no Supabase

**Esperado:**
- Logs: `🔒 FORÇADO establishment_id`
- Supabase: `establishment_id` preenchido

### Teste 3: Cadastrar Cliente
Mesmo fluxo do Teste 2

### Teste 4: Fazer Venda
1. Adicionar produtos ao carrinho
2. Fazer checkout
3. Verificar no Supabase

**Tabelas para verificar:**
- `sales` → `establishment_id`
- `sale_items` → (não tem, é OK)

### Teste 5: Criar Transação
1. Ir em Finanças
2. Adicionar transação
3. Verificar no Supabase

**Esperado:**
- `financial_transactions.establishment_id` ✅

---

## 📊 Checklist de Verificação

### Backend (Servidor)
- [ ] Código atualizado no repositório
- [ ] Deploy feito no Render
- [ ] Servidor responde (teste URL base)
- [ ] Logs aparecem no Render Dashboard

### Banco de Dados
- [ ] Script SQL executado
- [ ] Todos profiles têm `establishment_id`
- [ ] Query de verificação retorna 0 sem establishment

### Usuário de Teste
- [ ] Fez logout/login
- [ ] Bootstrap foi chamado (ver logs servidor)
- [ ] Profile tem `establishment_id` no Supabase

### Dados
- [ ] Cadastrou produto → `establishment_id` OK
- [ ] Cadastrou cliente → `establishment_id` OK
- [ ] Fez venda → `establishment_id` OK
- [ ] Criou transação → `establishment_id` OK

---

## ⚠️ Troubleshooting

### Problema: Usuário não tem establishment_id após login

**Solução 1: Executar Bootstrap Manualmente**
```bash
# No terminal (com curl)
curl -X POST https://server-qr-vendas.onrender.com/user/bootstrap \
  -H "Authorization: Bearer SEU_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "full_name": "Seu Nome",
    "store": {
      "name": "Minha Loja"
    }
  }'
```

**Solução 2: Executar Script SQL**
```sql
-- Opção 1 (Automático) do documento
```

### Problema: Servidor rejeita push com "não tem establishment_id"

**Causa:** Profile sem establishment_id

**Solução:**
1. Executar Script SQL
2. Fazer logout/login
3. Tentar novamente

### Problema: establishment_id ainda NULL no Supabase

**Verificar:**
1. Deploy foi feito? (Render logs devem mostrar novo código)
2. Profile tem establishment_id?
3. Logs do servidor mostram "FORÇADO"?

**Se logs mostram "FORÇADO" mas Supabase continua NULL:**
- ❌ Problema no Supabase (permissões? RLS?)
- Verificar policies das tabelas

---

## 📝 Resumo das Mudanças

### Arquivos Modificados
1. ✅ `server/src/routes/sync.ts` (~30 linhas)
   - Remove `establishment_id` do payload
   - FORÇA o do usuário
   - Rejeita se usuário não tem
   - Logs detalhados

2. ✅ `server/src/routes/user.bootstrap.ts` (~40 linhas)
   - Verifica establishment existente
   - Cria automaticamente se não existe
   - SEMPRE inclui no profile
   - Logs em cada etapa

### SQL Scripts Criados
1. ✅ Script de correção para usuários existentes
2. ✅ Script de verificação

---

## 🎯 Resultado Esperado

Após aplicar todas as correções:

1. ✅ Todo usuário TEM `establishment_id` no profile
2. ✅ Servidor FORÇA `establishment_id` correto
3. ✅ TODOS produtos/clientes/vendas/transações têm `establishment_id`
4. ✅ Dados isolados por estabelecimento (multi-tenancy)
5. ✅ `doc_sequences` funciona (precisa de `establishment_id`)

---

**TL;DR:**
1. ⚠️ Execute o **Script SQL** para corrigir usuários existentes
2. 🚀 Faça **deploy** do servidor no Render
3. 🔄 Faça **logout/login** no app
4. ✅ Cadastre produto e **verifique** no Supabase
5. 🎉 `establishment_id` deve estar preenchido!

