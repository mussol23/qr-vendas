# ⚡ Início Rápido - Painel Admin

## 🎯 3 Passos para Começar

### 1. Instalar Dependências
```bash
cd admin
npm install
```

### 2. Criar `.env`
```env
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua_chave_aqui
VITE_API_URL=https://server-qr-vendas.onrender.com
```

### 3. Executar SQL e Rodar
```bash
# 1. Execute TABELA_USER_PRESENCE.sql no Supabase
# 2. Crie um usuário admin (ver INSTALACAO.md)
# 3. Rode o servidor:
npm run dev
```

Acesse: **http://localhost:3001** 🚀

---

## 📁 Arquivos Importantes

- `README.md` - Visão geral do projeto
- `INSTALACAO.md` - Guia completo de instalação
- `TABELA_USER_PRESENCE.sql` - SQL para criar tabela
- `ARQUIVOS_COMPLETOS.md` - Referência de arquivos

---

## 🔑 Login

Use suas credenciais de admin criadas no Supabase.

**Criar admin:**
```sql
UPDATE profiles 
SET role = 'admin' 
WHERE user_id = 'SEU_USER_ID';
```

---

## 🎨 Funcionalidades

✅ Dashboard com métricas  
✅ Gestão de estabelecimentos  
✅ Gestão de usuários  
✅ Monitoramento em tempo real  
✅ Relatórios e analytics  
✅ Dark mode  
✅ Responsivo  

---

## 🆘 Problemas?

1. Verifique se o `.env` está correto
2. Verifique se executou o SQL
3. Verifique se o usuário é admin
4. Consulte `INSTALACAO.md` para mais detalhes

---

**Pronto!** 🎉

