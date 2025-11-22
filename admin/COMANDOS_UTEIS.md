# 🛠️ Comandos Úteis - Painel Admin

## 📦 Instalação

```bash
# Instalar dependências
cd admin
npm install

# Instalar dependência específica
npm install nome-do-pacote

# Atualizar dependências
npm update
```

---

## 🏃 Execução

```bash
# Desenvolvimento (hot reload)
npm run dev

# Build para produção
npm run build

# Preview do build
npm run preview

# Lint
npm run lint
```

---

## 🗄️ SQL (Supabase)

### Criar Tabela de Presença
```sql
-- Execute no Supabase SQL Editor
-- Conteúdo em: TABELA_USER_PRESENCE.sql
```

### Criar Usuário Admin
```sql
-- Opção 1: Por user_id
UPDATE profiles 
SET role = 'admin' 
WHERE user_id = 'abc-123-def-456';

-- Opção 2: Por email
UPDATE profiles 
SET role = 'admin' 
WHERE user_id = (
  SELECT id FROM auth.users 
  WHERE email = 'admin@email.com'
);
```

### Verificar Admins
```sql
SELECT 
  p.user_id,
  p.full_name,
  au.email,
  p.role
FROM profiles p
JOIN auth.users au ON au.id = p.user_id
WHERE p.role = 'admin';
```

### Ver Usuários Online
```sql
SELECT 
  up.user_id,
  p.full_name,
  p.email,
  up.status,
  up.device_type,
  up.last_seen,
  e.name as establishment
FROM user_presence up
JOIN profiles p ON p.user_id = up.user_id
LEFT JOIN establishments e ON e.id = up.establishment_id
WHERE up.status = 'online';
```

### Limpar Presença Offline
```sql
-- Manual
UPDATE user_presence 
SET status = 'offline' 
WHERE updated_at < now() - interval '5 minutes';

-- Automático (função já criada)
SELECT cleanup_offline_presence();
```

---

## 🔧 Troubleshooting

### Limpar node_modules e reinstalar
```bash
cd admin
rm -rf node_modules package-lock.json
npm install
```

### Limpar cache do Vite
```bash
rm -rf node_modules/.vite
npm run dev
```

### Ver logs detalhados
```bash
npm run dev -- --debug
```

---

## 📊 Supabase CLI

### Instalar Supabase CLI
```bash
npm install -g supabase
```

### Login no Supabase
```bash
supabase login
```

### Gerar Types
```bash
supabase gen types typescript --project-id SEU_PROJECT_ID > src/types/supabase.ts
```

---

## 🚀 Deploy

### Vercel
```bash
# Instalar CLI
npm i -g vercel

# Login
vercel login

# Deploy
npm run build
vercel --prod
```

### Netlify
```bash
# Instalar CLI
npm i -g netlify-cli

# Login
netlify login

# Deploy
npm run build
netlify deploy --prod --dir=dist
```

---

## 🧪 Testes

### Testar build localmente
```bash
npm run build
npm run preview
```

### Verificar variáveis de ambiente
```bash
# Linux/Mac
cat .env

# Windows
type .env
```

---

## 📝 Git

### Commit inicial
```bash
cd admin
git add .
git commit -m "feat: adicionar painel admin"
```

### Push para repositório
```bash
git push origin main
```

---

## 🔑 Variáveis de Ambiente

### Desenvolvimento (.env)
```env
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=ey...
VITE_API_URL=http://localhost:3000
```

### Produção (plataforma de deploy)
- Vercel: Settings → Environment Variables
- Netlify: Site settings → Build & deploy → Environment
- Render: Environment → Environment Variables

---

## 🎨 Customização

### Mudar cores (tailwind.config.js)
```javascript
colors: {
  brand: {
    // Suas cores personalizadas
    500: '#seu-hex',
    600: '#seu-hex',
  },
}
```

### Adicionar nova página
```bash
# 1. Criar arquivo
touch src/pages/MinhaPage.tsx

# 2. Adicionar rota em src/App.tsx
<Route path="/minha-page" element={<MinhaPage />} />

# 3. Adicionar no Sidebar
// src/components/layout/Sidebar.tsx
```

---

## 📚 Recursos

### Documentação
- React: https://react.dev
- TypeScript: https://www.typescriptlang.org
- Vite: https://vitejs.dev
- TailwindCSS: https://tailwindcss.com
- Supabase: https://supabase.com/docs

### Bibliotecas Instaladas
- React Router: https://reactrouter.com
- React Hot Toast: https://react-hot-toast.com
- Recharts: https://recharts.org

---

## 🆘 Comandos de Emergência

### App não inicia
```bash
# 1. Limpar tudo
cd admin
rm -rf node_modules package-lock.json .vite dist

# 2. Reinstalar
npm install

# 3. Tentar novamente
npm run dev
```

### Erro de porta em uso
```bash
# Windows
netstat -ano | findstr :3001
taskkill /PID <PID> /F

# Linux/Mac
lsof -ti:3001 | xargs kill -9
```

### Reset completo
```bash
# Voltar ao estado inicial
cd admin
git checkout .
rm -rf node_modules package-lock.json
npm install
npm run dev
```

---

## 💡 Dicas

1. **Sempre** rode `npm install` após pull do Git
2. **Sempre** crie `.env` antes de rodar
3. **Sempre** execute o SQL antes do primeiro uso
4. Use `npm run dev` para desenvolvimento
5. Use `npm run build` antes de deploy
6. Consulte os arquivos MD para dúvidas

---

**Esses comandos cobrem 99% dos casos de uso!** 🚀

