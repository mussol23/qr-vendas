# Configuração de Recuperação de Senha no Supabase

Este documento explica como configurar o sistema de recuperação de senha no Supabase para o aplicativo QR Vendas.

## 📋 Funcionalidades Implementadas

1. **Página de Recuperação de Senha** (`/forgot-password`)
   - Formulário para inserir email
   - Envio de email de recuperação via Supabase
   - Feedback visual de sucesso/erro

2. **Página de Redefinição de Senha** (`/reset-password`)
   - Validação do token de recuperação
   - Formulário para definir nova senha
   - Confirmação de senha
   - Redirecionamento automático após sucesso

3. **Footer com Links de Download** (apenas na web)
   - Links para App Store e Google Play
   - Visível apenas quando acessado via navegador web
   - Oculto em dispositivos móveis nativos

## ⚙️ Configuração no Supabase

### 1. Configurar Template de Email

Acesse o painel do Supabase e configure o template de email de recuperação:

1. Vá para **Authentication** → **Email Templates**
2. Selecione **Reset Password**
3. Configure o template com o seguinte conteúdo:

**Subject:**
```
Recuperação de Senha - QR Vendas
```

**Body (HTML):**
```html
<h2>Recuperação de Senha</h2>
<p>Olá,</p>
<p>Você solicitou a recuperação de senha para sua conta no QR Vendas.</p>
<p>Clique no link abaixo para redefinir sua senha:</p>
<p><a href="{{ .ConfirmationURL }}">Redefinir Senha</a></p>
<p>Se você não solicitou esta recuperação, ignore este email.</p>
<p>Este link expira em 1 hora.</p>
<br>
<p>Atenciosamente,<br>Equipe QR Vendas</p>
```

### 2. Configurar URL de Redirecionamento

No código, o redirecionamento já está configurado para:
```typescript
redirectTo: `${window.location.origin}/#/reset-password`
```

Isso significa que o usuário será redirecionado para a página de redefinição de senha após clicar no link do email.

### 3. Configurar Site URL no Supabase

1. Vá para **Settings** → **Authentication**
2. Em **Site URL**, adicione a URL do seu aplicativo:
   - Para desenvolvimento local: `http://localhost:5173`
   - Para produção: `https://seudominio.com`

3. Em **Redirect URLs**, adicione:
   - `http://localhost:5173/#/reset-password` (desenvolvimento)
   - `https://seudominio.com/#/reset-password` (produção)

### 4. Configurar SMTP (Opcional)

Por padrão, o Supabase usa seu próprio serviço de email. Para usar um provedor personalizado:

1. Vá para **Settings** → **Authentication** → **SMTP Settings**
2. Configure seu provedor SMTP (Gmail, SendGrid, etc.)
3. Teste o envio de emails

## 🔐 Fluxo de Recuperação de Senha

1. **Usuário solicita recuperação:**
   - Acessa `/forgot-password`
   - Insere seu email
   - Clica em "Enviar Link de Recuperação"

2. **Sistema envia email:**
   - Supabase gera um token único
   - Envia email com link de recuperação
   - Link expira em 1 hora (padrão)

3. **Usuário recebe email:**
   - Clica no link de recuperação
   - É redirecionado para `/reset-password`

4. **Usuário redefine senha:**
   - Insere nova senha
   - Confirma a senha
   - Clica em "Redefinir Senha"

5. **Sistema atualiza senha:**
   - Valida o token
   - Atualiza a senha no Supabase
   - Redireciona para `/login`

## 🔒 Segurança

- ✅ Token de recuperação expira em 1 hora
- ✅ Senha deve ter no mínimo 6 caracteres
- ✅ Confirmação de senha obrigatória
- ✅ Validação do token antes de permitir redefinição
- ✅ Redirecionamento automático se token inválido

## 📱 Links de Download do App

Os links para App Store e Google Play aparecem no footer apenas quando o app é acessado via navegador web. Em dispositivos móveis nativos (iOS/Android), os links não são exibidos.

**Detecção:**
```typescript
{typeof window !== 'undefined' && !(window as any).Capacitor && (
  // Links de download
)}
```

**URLs configuradas:**
- App Store: `https://apps.apple.com/app/qr-vendas`
- Google Play: `https://play.google.com/store/apps/details?id=com.qrvendas.app`

> **Nota:** Atualize essas URLs quando publicar o app nas lojas.

## 🧪 Testando a Recuperação

1. Execute o app em desenvolvimento:
   ```bash
   npm run dev
   ```

2. Acesse `http://localhost:5173/#/forgot-password`

3. Insira um email válido cadastrado no sistema

4. Verifique a caixa de entrada do email

5. Clique no link de recuperação

6. Defina uma nova senha

7. Faça login com a nova senha

## 🐛 Troubleshooting

### Email não está sendo enviado

- Verifique se o email está cadastrado no Supabase
- Confirme que o SMTP está configurado corretamente
- Verifique a pasta de spam
- Verifique os logs do Supabase

### Link de recuperação não funciona

- Verifique se a URL de redirecionamento está correta
- Confirme que a rota `/reset-password` está configurada
- Verifique se o token não expirou (1 hora)

### Erro ao redefinir senha

- Confirme que a senha tem no mínimo 6 caracteres
- Verifique se as senhas coincidem
- Verifique os logs do console do navegador

## 📝 Notas Adicionais

- O sistema usa Supabase Auth para gerenciar autenticação
- Todos os emails são enviados através do Supabase
- O token de recuperação é gerenciado automaticamente pelo Supabase
- A sessão é criada automaticamente após clicar no link do email
