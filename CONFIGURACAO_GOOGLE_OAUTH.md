# Configuração Google OAuth - Supabase (Web + Mobile)

Este guia explica como configurar o Google OAuth no Supabase para funcionar tanto na **Web** quanto no **Mobile** (iOS e Android).

---

## 📋 Pré-requisitos

1. Conta no [Google Cloud Console](https://console.cloud.google.com/)
2. Projeto no Supabase
3. App ID do Capacitor: `com.qr.vendas`

---

## 🔧 Parte 1: Configurar Google Cloud Console

### 1.1 Criar Projeto no Google Cloud

1. Acesse: https://console.cloud.google.com/
2. Clique em **"Select a project"** → **"New Project"**
3. Nome do projeto: `QR Vendas`
4. Clique em **"Create"**

### 1.2 Ativar Google+ API

1. No menu lateral, vá em: **APIs & Services** → **Library**
2. Procure por: `Google+ API`
3. Clique em **"Enable"**

### 1.3 Configurar OAuth Consent Screen

1. Vá em: **APIs & Services** → **OAuth consent screen**
2. Escolha: **External** (para permitir qualquer usuário Google)
3. Clique em **"Create"**
4. Preencha:
   - **App name**: `QR Vendas`
   - **User support email**: seu email
   - **Developer contact email**: seu email
5. Clique em **"Save and Continue"**
6. Em **Scopes**, clique em **"Add or Remove Scopes"**
   - Adicione: `email`, `profile`, `openid`
7. Clique em **"Save and Continue"**
8. Em **Test users** (opcional para desenvolvimento):
   - Adicione emails de teste se quiser
9. Clique em **"Save and Continue"** → **"Back to Dashboard"**

### 1.4 Criar Credenciais OAuth 2.0

#### **Para Web:**

1. Vá em: **APIs & Services** → **Credentials**
2. Clique em **"Create Credentials"** → **"OAuth client ID"**
3. Application type: **Web application**
4. Name: `QR Vendas - Web`
5. **Authorized JavaScript origins**:
   ```
   http://localhost:3000
   https://seu-dominio.com
   https://<seu-projeto>.supabase.co
   ```
6. **Authorized redirect URIs**:
   ```
   http://localhost:3000/auth/callback
   https://seu-dominio.com/auth/callback
   https://<seu-projeto>.supabase.co/auth/v1/callback
   ```
7. Clique em **"Create"**
8. **Copie e guarde**:
   - ✅ **Client ID**
   - ✅ **Client Secret**

#### **Para Android:**

1. Clique em **"Create Credentials"** → **"OAuth client ID"**
2. Application type: **Android**
3. Name: `QR Vendas - Android`
4. **Package name**: `com.qr.vendas`
5. **SHA-1 certificate fingerprint**:
   
   Para obter o SHA-1, execute no terminal:
   ```bash
   # Debug keystore (desenvolvimento)
   keytool -list -v -keystore ~/.android/debug.keystore -alias androiddebugkey -storepass android -keypass android
   
   # Release keystore (produção)
   keytool -list -v -keystore caminho/para/seu/release.keystore -alias seu-alias
   ```
   
   Copie o valor de **SHA1** e cole no campo
6. Clique em **"Create"**

#### **Para iOS:**

1. Clique em **"Create Credentials"** → **"OAuth client ID"**
2. Application type: **iOS**
3. Name: `QR Vendas - iOS`
4. **Bundle ID**: `com.qr.vendas`
5. Clique em **"Create"**

---

## 🔐 Parte 2: Configurar Supabase

### 2.1 Adicionar Google Provider

1. Acesse seu projeto no [Supabase Dashboard](https://app.supabase.com/)
2. Vá em: **Authentication** → **Providers**
3. Encontre **Google** e clique para expandir
4. **Ative** o toggle "Enable Sign in with Google"
5. Preencha:
   - **Client ID (for OAuth)**: Cole o Client ID da credencial **Web**
   - **Client Secret (for OAuth)**: Cole o Client Secret da credencial **Web**
6. Clique em **"Save"**

### 2.2 Configurar URLs de Redirecionamento

1. Ainda em **Authentication** → **URL Configuration**
2. **Site URL**: 
   ```
   https://seu-dominio.com
   ```
   (Para desenvolvimento local, use: `http://localhost:3000`)

3. **Redirect URLs** (adicione todas estas):
   ```
   http://localhost:3000/**
   https://seu-dominio.com/**
   com.qr.vendas://**
   ```

---

## 📱 Parte 3: Configurar Deep Links no App Mobile

### 3.1 Atualizar `capacitor.config.ts`

Adicione a configuração de deep linking:

```typescript
import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.qr.vendas',
  appName: 'QR Vendas',
  webDir: 'dist',
  bundledWebRuntime: false,
  server: {
    androidScheme: 'https',
  },
  plugins: {
    CapacitorSQLite: {
      iosDatabaseLocation: 'Library/CapacitorDatabase',
      iosIsEncryption: false,
      androidIsEncryption: false,
    },
    // Configuração para deep links OAuth
    App: {
      appUrlScheme: 'com.qr.vendas',
    },
  },
};

export default config;
```

### 3.2 Android - Configurar Deep Links

Edite `android/app/src/main/AndroidManifest.xml`:

```xml
<activity
    android:name=".MainActivity"
    android:configChanges="orientation|keyboardHidden|keyboard|screenSize|locale|smallestScreenSize|screenLayout|uiMode"
    android:label="@string/title_activity_main"
    android:launchMode="singleTask"
    android:theme="@style/AppTheme.NoActionBarLaunch">

    <intent-filter>
        <action android:name="android.intent.action.MAIN" />
        <category android:name="android.intent.category.LAUNCHER" />
    </intent-filter>

    <!-- Deep Link para OAuth -->
    <intent-filter android:autoVerify="true">
        <action android:name="android.intent.action.VIEW" />
        <category android:name="android.intent.category.DEFAULT" />
        <category android:name="android.intent.category.BROWSABLE" />
        <data android:scheme="com.qr.vendas" />
    </intent-filter>

</activity>
```

### 3.3 iOS - Configurar Deep Links

Edite `ios/App/App/Info.plist`:

```xml
<key>CFBundleURLTypes</key>
<array>
    <dict>
        <key>CFBundleURLSchemes</key>
        <array>
            <string>com.qr.vendas</string>
        </array>
        <key>CFBundleURLName</key>
        <string>com.qr.vendas</string>
    </dict>
</array>
```

---

## 🔄 Parte 4: Atualizar Código da Aplicação

### 4.1 Detectar Plataforma e Usar Redirect Correto

Atualize o método `signInWithGoogle` no `AuthContext.tsx`:

```typescript
const signInWithGoogle: AuthContextType['signInWithGoogle'] = async () => {
  // Detecta se está rodando no Capacitor (mobile)
  const isCapacitor = !!(window as any).Capacitor;
  
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      // Se for mobile, usa deep link; se for web, usa URL normal
      redirectTo: isCapacitor 
        ? 'com.qr.vendas://auth/callback' 
        : `${window.location.origin}/pos`,
    },
  });
  
  return { error: error?.message };
};
```

### 4.2 Criar Página de Callback (Opcional para Web)

Crie `pages/AuthCallback.tsx`:

```typescript
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

const AuthCallback = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Supabase automaticamente processa o hash da URL
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session) {
        navigate('/pos');
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-4">Autenticando...</h2>
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-600 mx-auto"></div>
      </div>
    </div>
  );
};

export default AuthCallback;
```

Adicione a rota no `App.tsx`:

```typescript
<Route path="/auth/callback" element={<AuthCallback />} />
```

---

## ✅ Resumo das URLs de Redirecionamento

### **No Google Cloud Console:**

**Web Application - Authorized redirect URIs:**
```
http://localhost:3000/auth/callback
https://seu-dominio.com/auth/callback
https://<seu-projeto>.supabase.co/auth/v1/callback
```

### **No Supabase - Redirect URLs:**
```
http://localhost:3000/**
https://seu-dominio.com/**
com.qr.vendas://**
```

### **No Código (AuthContext):**
```typescript
// Mobile (Capacitor)
redirectTo: 'com.qr.vendas://auth/callback'

// Web
redirectTo: 'https://seu-dominio.com/pos'
```

---

## 🧪 Testar

### **Web (localhost):**
1. Execute: `npm run dev`
2. Acesse: `http://localhost:3000/login`
3. Clique em "Continuar com Google"
4. Faça login com sua conta Google
5. Deve redirecionar para `/pos`

### **Mobile (Android/iOS):**
1. Build: `npm run build`
2. Sync: `npx cap sync`
3. Abra no Android Studio ou Xcode
4. Execute no dispositivo/emulador
5. Clique em "Continuar com Google"
6. Faça login
7. Deve retornar ao app e redirecionar para a tela principal

---

## 🐛 Troubleshooting

### Erro: "redirect_uri_mismatch"
- ✅ Verifique se a URL de redirect está **exatamente** igual no Google Cloud Console
- ✅ Certifique-se de incluir `https://<seu-projeto>.supabase.co/auth/v1/callback`

### Mobile não abre o app após login
- ✅ Verifique se o deep link está configurado corretamente no `AndroidManifest.xml` ou `Info.plist`
- ✅ Confirme que o `appUrlScheme` está correto no `capacitor.config.ts`

### Login funciona na web mas não no mobile
- ✅ Certifique-se de ter criado credenciais OAuth separadas para Android e iOS
- ✅ Verifique se o SHA-1 do Android está correto
- ✅ Confirme que o Bundle ID do iOS está correto

---

## 📚 Referências

- [Supabase Auth - Google](https://supabase.com/docs/guides/auth/social-login/auth-google)
- [Google OAuth 2.0](https://developers.google.com/identity/protocols/oauth2)
- [Capacitor Deep Links](https://capacitorjs.com/docs/guides/deep-links)

---

**Configuração criada em:** 2025-11-23  
**App ID:** `com.qr.vendas`  
**App Name:** `QR Vendas`
