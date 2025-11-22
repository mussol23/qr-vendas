# 🏢 Análise: Multi-Tenancy e Estrutura do Banco

## 🔍 Situação Atual

Sua estrutura tem **DOIS NÍVEIS** de multi-tenancy:
1. **`tenants`** (opcional, nível superior)
2. **`establishments`** (estabelecimentos)

Mas **apenas `establishments` está sendo usado**.

## 📊 Estrutura Encontrada

### 1. Tabela `tenants` (EXISTE mas NÃO USA)
```sql
-- supabase/sql/009_tenants.sql
create table public.tenants (
  id uuid primary key,
  name text not null,
  -- Tabela existe mas NUNCA é usada!
);
```

**Status:** ❌ Tabela existe mas **VAZIA**

### 2. Tabela `establishments` (EM USO)
```sql
-- supabase/sql/002_establishments.sql
create table public.establishments (
  id uuid primary key,
  name text not null,
  document text,
  tenant_id uuid, -- ⚠️ Campo existe mas SEMPRE NULL
  -- Este É o nível principal de multi-tenancy
);
```

**Status:** ✅ Usada, mas `tenant_id` sempre NULL

### 3. Tabela `profiles`
```sql
-- supabase/sql/003_profiles.sql
create table public.profiles (
  user_id uuid primary key,
  role text not null default 'user',
  tenant_id uuid, -- ⚠️ SEMPRE NULL
  establishment_id uuid, -- ✅ ESTE É USADO
);
```

**Status:** `establishment_id` usado, `tenant_id` não

### 4. Tabelas de Dados (Products, Clients, Sales, etc)
```sql
create table public.products (
  establishment_id uuid, -- ✅ Isolamento por estabelecimento
  -- Não tem tenant_id
);

create table public.sales (
  establishment_id uuid, -- ✅ Isolamento por estabelecimento
);
```

**Status:** ✅ Todos usam `establishment_id`

### 5. Tabela `doc_sequences`
```sql
create table public.doc_sequences (
  establishment_id uuid not null,
  doc_type sale_type not null,
  current_number integer not null default 0,
  unique (establishment_id, doc_type)
);
```

**Status:** ⚠️ **Criada AUTOMATICAMENTE** pelo trigger quando faz primeira venda

## 🎯 Por Que `doc_sequences` e `tenants` Estão Vazios?

### `doc_sequences` - É NORMAL estar vazia inicialmente!

**Como funciona:**
1. Usuário faz uma venda
2. Trigger `trg_sales_number` dispara
3. Função `next_doc_number()` é chamada
4. Se não existe registro em `doc_sequences`, **cria automaticamente**
5. Gera número: `RC-0001`, `FT-0001`, etc

**Quando será preenchida:**
- ✅ Automaticamente na **primeira venda** de cada tipo
- ✅ Para cada `establishment_id` diferente
- ✅ Incrementa a cada nova venda

**Exemplo:**
```sql
-- Primeira venda tipo 'receipt' do estabelecimento abc:
-- doc_sequences: establishment_id=abc, doc_type='receipt', current_number=1

-- Segunda venda:
-- doc_sequences: current_number=2 (incrementa)
```

### `tenants` - Não está sendo usada!

A tabela `tenants` existe mas:
- ❌ Nenhum código cria tenants
- ❌ `tenant_id` sempre NULL em profiles e establishments
- ❌ Sistema não usa este nível de hierarquia

## 🏗️ Arquitetura Atual vs Ideal

### Arquitetura Atual (O que você tem):
```
User (profiles)
  └─ establishment_id ──> Establishment
                             └─ Products, Clients, Sales, etc
```

- ✅ **Funciona para um estabelecimento por usuário**
- ✅ **Multi-establishment** (vários estabelecimentos independentes)
- ⚠️ `tenant_id` existe mas não é usado

### Arquitetura com Tenants (Se quisesse usar):
```
User (profiles)
  ├─ tenant_id ──> Tenant (empresa matriz)
  └─ establishment_id ──> Establishment (filial/loja)
                             └─ Products, Clients, Sales, etc
```

- 🏢 **Tenant** = Empresa (ex: "Rede de Lojas ABC")
- 🏪 **Establishment** = Filial (ex: "Loja Shopping Norte", "Loja Centro")
- 👤 **User** pertence a um Tenant e pode gerenciar vários Establishments

## ✅ Seu Sistema SUPORTA Multi-Establishment?

**SIM!** ✅ Mas apenas no nível de `establishment`.

### O que funciona:
- ✅ Vários estabelecimentos independentes
- ✅ Cada usuário vinculado a um estabelecimento
- ✅ Dados isolados por `establishment_id`
- ✅ `doc_sequences` automático por estabelecimento
- ✅ Numeração independente (RC-0001 para cada estabelecimento)

### O que NÃO funciona:
- ❌ Hierarquia Tenant → Establishments
- ❌ Usuário gerenciar múltiplos estabelecimentos
- ❌ Relatórios consolidados de um grupo de estabelecimentos

## 🔧 Recomendações

### Opção 1: Manter Simples (Recomendado) ⭐
```sql
-- Remover referências a tenant_id (limpeza)
ALTER TABLE profiles DROP COLUMN tenant_id;
ALTER TABLE establishments DROP COLUMN tenant_id;

-- Já funciona assim!
```

**Vantagens:**
- ✅ Estrutura mais simples
- ✅ Menos confusão
- ✅ Já funciona perfeitamente

**Limitações:**
- ❌ Não suporta hierarquia tenant/estabelecimento

### Opção 2: Implementar Tenants Completo
```sql
-- Criar tenant ao registrar
-- Vincular establishment ao tenant
-- Permitir usuário acessar múltiplos establishments do mesmo tenant
```

**Vantagens:**
- ✅ Suporta hierarquia (empresa → filiais)
- ✅ Relatórios consolidados
- ✅ Usuário admin pode gerenciar várias filiais

**Desvantagens:**
- ❌ Mais complexo
- ❌ Precisa reescrever várias partes do código

### Opção 3: Manter Como Está (Fazer nada)
```
Deixar tenant_id existir mas não usar
```

**Status:** Funciona, mas confuso

## 🧪 Como Testar doc_sequences

### Teste 1: Verificar se está vazia
```sql
SELECT * FROM doc_sequences;
-- Deve estar vazia se nunca fez venda
```

### Teste 2: Fazer uma venda
```bash
# No app, faça uma venda (checkout)
# O trigger vai criar automaticamente em doc_sequences
```

### Teste 3: Verificar criação automática
```sql
SELECT * FROM doc_sequences;
-- Deve ter:
-- establishment_id | doc_type | current_number | prefix
-- abc-123...       | receipt  | 1              | RC
```

### Teste 4: Fazer segunda venda
```bash
# Faça outra venda
```

### Teste 5: Verificar incremento
```sql
SELECT * FROM doc_sequences;
-- current_number deve ser 2 agora
```

## 📋 Checklist de Verificação

### Estabelecimento Configurado?
```sql
-- 1. Verificar se profile tem establishment_id
SELECT user_id, establishment_id FROM profiles WHERE user_id = 'SEU_USER_ID';

-- 2. Verificar se establishment existe
SELECT * FROM establishments WHERE id = 'SEU_ESTABLISHMENT_ID';
```

### Dados Vinculados?
```sql
-- 3. Produtos têm establishment_id?
SELECT id, name, establishment_id FROM products LIMIT 5;

-- 4. Vendas têm establishment_id?
SELECT id, number, establishment_id FROM sales LIMIT 5;
```

### doc_sequences Funciona?
```sql
-- 5. Fazer venda e verificar
-- Antes da venda:
SELECT * FROM doc_sequences;

-- Depois da venda:
SELECT * FROM doc_sequences;
-- Deve ter registro criado automaticamente
```

## 🎯 Conclusão

### Seu Sistema:
- ✅ **Suporta multi-establishment** (via `establishment_id`)
- ✅ **doc_sequences funciona** (criado automaticamente)
- ⚠️ **tenants não está implementado** (tabela vazia)
- ⚠️ **tenant_id não é usado** (sempre NULL)

### Próximos Passos:

**Se quer simplicidade:**
1. Deixe como está (funciona perfeitamente)
2. Ignore `tenants` e `tenant_id`
3. Use apenas `establishment_id`

**Se quer hierarquia tenant/estabelecimentos:**
1. Implementar lógica de tenants
2. Criar tenants ao registrar
3. Permitir usuário ter múltiplos establishments
4. Adicionar filtros por tenant

---

**TL;DR:**
- ✅ `doc_sequences` vazia é **NORMAL** - preenche automaticamente na primeira venda
- ⚠️ `tenants` vazia porque **não está implementado** - apenas `establishments` é usado
- ✅ Sistema **SUPORTA multi-establishment** via `establishment_id`
- 🎯 Após fazer deploy e adicionar venda, `doc_sequences` será preenchido automaticamente

