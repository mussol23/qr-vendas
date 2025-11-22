# 🎛️ QR Vendas - Painel Administrativo

Painel administrativo independente para gerenciar o sistema QR Vendas.

## 🚀 Instalação

```bash
cd admin
npm install
```

## ⚙️ Configuração

1. Crie um arquivo `.env` na raiz da pasta `admin/`:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_API_URL=https://server-qr-vendas.onrender.com
```

2. Execute a migration SQL para criar a tabela de presença:

```sql
-- Execute no Supabase SQL Editor
-- Ver arquivo: ../TABELA_USER_PRESENCE.sql
```

## 🏃‍♂️ Executar

### Desenvolvimento
```bash
npm run dev
```

Acesse: `http://localhost:3001`

### Build
```bash
npm run build
```

### Preview
```bash
npm run preview
```

## 📁 Estrutura

```
admin/
├── src/
│   ├── components/          # Componentes reutilizáveis
│   │   ├── layout/          # Layout (Sidebar, Header)
│   │   ├── ui/              # Componentes UI básicos
│   │   └── dashboard/       # Componentes do dashboard
│   ├── contexts/            # Contexts (Auth, Theme)
│   ├── hooks/               # Custom hooks
│   ├── lib/                 # Utilitários (Supabase, API)
│   ├── pages/               # Páginas
│   ├── types/               # TypeScript types
│   ├── App.tsx              # App principal
│   ├── main.tsx             # Entry point
│   └── index.css            # Estilos globais
├── package.json
├── vite.config.ts
├── tailwind.config.js
└── README.md
```

## 🎯 Funcionalidades

### ✅ Implementado
- [x] Login/Logout
- [x] Dashboard com métricas
- [x] Gestão de Estabelecimentos
- [x] Gestão de Usuários
- [x] Usuários Online em Tempo Real
- [x] Vendas Consolidadas
- [x] Relatórios
- [x] Análise Financeira
- [x] Analytics
- [x] Logs do Sistema
- [x] Configurações
- [x] Dark Mode
- [x] Responsive Design

### 🟡 Em Progresso
- [ ] Exportação de Relatórios (Excel/PDF)
- [ ] Notificações em Tempo Real
- [ ] Busca Global
- [ ] Widgets Customizáveis

## 🔐 Segurança

- Apenas usuários com `role = 'admin'` podem acessar
- Proteção de rotas implementada
- RLS (Row Level Security) no Supabase
- Tokens JWT para autenticação

## 🎨 Design

- **Framework CSS**: TailwindCSS
- **Gráficos**: Recharts
- **Notificações**: React Hot Toast
- **Ícones**: Emojis (pode adicionar lib de ícones)
- **Dark Mode**: Suportado

## 📊 Dados em Tempo Real

O painel utiliza Supabase Realtime para:
- Monitorar usuários online
- Atualizar métricas automaticamente
- Notificar sobre eventos importantes

## 🛠️ Stack Tecnológica

- **React 18** - UI Library
- **TypeScript** - Type Safety
- **Vite** - Build Tool
- **TailwindCSS** - Styling
- **Supabase** - Backend & Realtime
- **Recharts** - Charts
- **React Router v6** - Routing
- **React Hot Toast** - Notifications

## 🤝 Integração com o App Principal

O painel admin é independente mas compartilha:
- Mesmo Supabase
- Mesmo Backend API
- Mesmas tabelas de dados

## 📝 Criar Usuário Admin

Para criar um usuário admin, execute no Supabase SQL Editor:

```sql
-- Atualizar role de um usuário existente
UPDATE profiles 
SET role = 'admin' 
WHERE user_id = 'YOUR_USER_ID_HERE';
```

Ou criar novo usuário e promover:

```sql
-- 1. Registrar usuário normalmente no app
-- 2. Depois promover:
UPDATE profiles 
SET role = 'admin' 
WHERE user_id = (
  SELECT id FROM auth.users 
  WHERE email = 'admin@example.com'
);
```

## 🚀 Deploy

### Vercel/Netlify

1. Build o projeto:
```bash
npm run build
```

2. Deploy a pasta `dist/`

3. Configurar variáveis de ambiente

### Docker

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
EXPOSE 3001
CMD ["npm", "run", "preview"]
```

## 📈 Performance

- Lazy loading de componentes
- Code splitting por rota
- Otimização de imagens
- Cache de dados
- Realtime eficiente (WebSocket)

## 🐛 Troubleshooting

### Erro: Supabase credentials not found
- Verifique se criou o arquivo `.env`
- Confirme as credenciais do Supabase

### Erro: Acesso negado
- Verifique se o usuário tem `role = 'admin'`
- Execute o SQL para promover usuário

### Erro: API not found
- Verifique se o backend está rodando
- Confirme o `VITE_API_URL` no `.env`

## 📞 Suporte

Para dúvidas ou problemas, consulte a documentação principal do projeto.

---

**Versão**: 1.0.0  
**Última atualização**: Novembro 2024

