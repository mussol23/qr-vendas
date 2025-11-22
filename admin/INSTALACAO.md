# 🚀 Guia de Instalação - Painel Admin QR Vendas

## 📋 Pré-requisitos

- Node.js 18+ instalado
- Acesso ao Supabase (URL e chave)
- Backend API rodando (opcional, mas recomendado)
- Usuário com role 'admin' no banco

---

## 1️⃣ Instalação

```bash
# Entrar na pasta admin
cd admin

# Instalar dependências
npm install
```

---

## 2️⃣ Configuração do Supabase

### A. Executar SQL para Tabela de Presença

1. Acesse o **Supabase Dashboard**
2. Vá em **SQL Editor**
3. Crie uma nova query
4. Cole o conteúdo do arquivo `TABELA_USER_PRESENCE.sql`
5. Execute

**Verificar:** Deve aparecer mensagem de sucesso para cada comando

### B. Criar Usuário Admin

Execute no SQL Editor:

```sql
-- Opção 1: Promover usuário existente
UPDATE profiles 
SET role = 'admin' 
WHERE user_id = 'SEU_USER_ID_AQUI';

-- Opção 2: Promover por email
UPDATE profiles 
SET role = 'admin' 
WHERE user_id = (
  SELECT id FROM auth.users 
  WHERE email = 'seu@email.com'
);

-- Verificar
SELECT 
  user_id, 
  full_name, 
  email, 
  role 
FROM profiles 
WHERE role = 'admin';
```

---

## 3️⃣ Configuração de Variáveis de Ambiente

Crie um arquivo `.env` na pasta `admin/`:

```env
# Supabase (obrigatório)
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua_chave_anonima_aqui

# API Backend (opcional)
VITE_API_URL=https://server-qr-vendas.onrender.com
```

**Onde encontrar as credenciais do Supabase:**
1. Dashboard Supabase → Project Settings → API
2. Copiar: Project URL e anon/public key

---

## 4️⃣ Executar

### Desenvolvimento

```bash
npm run dev
```

Acesse: `http://localhost:3001`

### Build para Produção

```bash
npm run build
```

Os arquivos estarão em `admin/dist/`

### Preview do Build

```bash
npm run preview
```

---

## 5️⃣ Primeiro Acesso

1. Acesse `http://localhost:3001`
2. Você será redirecionado para `/login`
3. Entre com as credenciais do usuário admin criado no passo 2️⃣
4. Após login bem-sucedido, você será redirecionado para `/dashboard`

---

## 6️⃣ Estrutura do Projeto

```
admin/
├── src/
│   ├── components/
│   │   └── layout/
│   │       ├── AdminLayout.tsx
│   │       ├── Sidebar.tsx
│   │       └── Header.tsx
│   ├── contexts/
│   │   ├── AuthContext.tsx
│   │   └── ThemeContext.tsx
│   ├── lib/
│   │   ├── supabase.ts
│   │   └── api.ts
│   ├── pages/
│   │   ├── Login.tsx
│   │   ├── Dashboard.tsx
│   │   ├── Establishments.tsx
│   │   ├── Users.tsx
│   │   ├── UsersOnline.tsx
│   │   ├── Sales.tsx
│   │   ├── Reports.tsx
│   │   ├── Finance.tsx
│   │   ├── Analytics.tsx
│   │   ├── Settings.tsx
│   │   └── Logs.tsx
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
├── package.json
├── vite.config.ts
├── tailwind.config.js
├── README.md
├── INSTALACAO.md (este arquivo)
└── TABELA_USER_PRESENCE.sql
```

---

## 7️⃣ Funcionalidades Disponíveis

### ✅ Implementado

- [x] Login/Logout com Supabase Auth
- [x] Dashboard com métricas básicas
- [x] Layout responsivo (Sidebar + Header)
- [x] Dark Mode
- [x] Proteção de rotas (apenas admins)
- [x] Páginas placeholder para todas as seções

### 🟡 Próximos Passos (Expansão)

- [ ] Implementar CRUD completo de Estabelecimentos
- [ ] Implementar CRUD completo de Usuários
- [ ] Sistema de Presença em Tempo Real (hooks já preparados)
- [ ] Gráficos com Recharts
- [ ] Exportação de Relatórios (Excel/PDF)
- [ ] Busca Global
- [ ] Notificações Push

---

## 8️⃣ Troubleshooting

### Erro: "Supabase credentials not found"

**Causa:** Arquivo `.env` não criado ou variáveis erradas

**Solução:**
1. Verificar se o arquivo `.env` existe na pasta `admin/`
2. Verificar se as variáveis começam com `VITE_`
3. Reiniciar o servidor de dev após criar/editar `.env`

### Erro: "Acesso negado"

**Causa:** Usuário não tem role 'admin'

**Solução:**
```sql
-- No Supabase SQL Editor
UPDATE profiles 
SET role = 'admin' 
WHERE user_id = 'SEU_USER_ID';
```

### Erro: "Cannot read properties of null"

**Causa:** Tabela `user_presence` não foi criada

**Solução:**
1. Executar `TABELA_USER_PRESENCE.sql` no Supabase
2. Verificar se tabela foi criada:
```sql
SELECT * FROM information_schema.tables 
WHERE table_name = 'user_presence';
```

### Erro de CORS

**Causa:** Backend não aceita requisições do admin

**Solução:**
No backend (`server/src/index.ts`), adicionar origem:
```typescript
const allowedOrigins = [
  'http://localhost:3001', // Admin local
  // ... outras origens
];
```

---

## 9️⃣ Deploy

### Vercel

```bash
# 1. Build
npm run build

# 2. Install Vercel CLI
npm i -g vercel

# 3. Deploy
vercel --prod
```

### Netlify

```bash
# 1. Build
npm run build

# 2. Install Netlify CLI
npm i -g netlify-cli

# 3. Deploy
netlify deploy --prod --dir=dist
```

### Variáveis de Ambiente no Deploy

Não esqueça de configurar as variáveis de ambiente na plataforma:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_API_URL`

---

## 🆘 Suporte

Para dúvidas ou problemas:
1. Verifique o `README.md`
2. Consulte `ARQUIVOS_COMPLETOS.md` para exemplos
3. Verifique os logs do navegador (F12 → Console)
4. Verifique os logs do Supabase (Dashboard → Logs)

---

## ✅ Checklist Final

- [ ] Node.js instalado
- [ ] Dependências instaladas (`npm install`)
- [ ] `.env` criado com credenciais corretas
- [ ] Tabela `user_presence` criada no Supabase
- [ ] Usuário admin criado
- [ ] Servidor de dev rodando (`npm run dev`)
- [ ] Login funcionando
- [ ] Dashboard carregando métricas

---

**Parabéns! Seu painel admin está pronto!** 🎉

Acesse `http://localhost:3001` e comece a gerenciar seu sistema QR Vendas.

