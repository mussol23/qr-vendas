-- ===================================================================
-- TABELA: user_presence
-- Descrição: Rastreamento de usuários online em tempo real
-- ===================================================================

-- 1. Criar tabela
CREATE TABLE IF NOT EXISTS public.user_presence (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  status text NOT NULL CHECK (status IN ('online', 'away', 'offline')),
  last_seen timestamptz NOT NULL DEFAULT now(),
  device_type text CHECK (device_type IN ('web', 'mobile', 'tablet')),
  platform text, -- 'android' | 'ios' | 'windows' | 'macos' | 'linux'
  current_route text,
  establishment_id uuid REFERENCES establishments(id) ON DELETE SET NULL,
  ip_address text,
  user_agent text,
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 2. Criar índices
CREATE INDEX IF NOT EXISTS user_presence_status_idx 
  ON user_presence(status);
  
CREATE INDEX IF NOT EXISTS user_presence_updated_at_idx 
  ON user_presence(updated_at);
  
CREATE INDEX IF NOT EXISTS user_presence_establishment_idx 
  ON user_presence(establishment_id);

-- 3. Trigger de atualização
CREATE OR REPLACE TRIGGER trg_user_presence_updated
  BEFORE UPDATE ON user_presence
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- 4. Função de limpeza automática (opcional)
CREATE OR REPLACE FUNCTION cleanup_offline_presence()
RETURNS void AS $$
BEGIN
  UPDATE user_presence 
  SET status = 'offline',
      updated_at = now()
  WHERE updated_at < now() - interval '5 minutes'
    AND status != 'offline';
END;
$$ LANGUAGE plpgsql;

-- 5. RLS (Row Level Security)
ALTER TABLE user_presence ENABLE ROW LEVEL SECURITY;

-- Admins podem ver tudo
DROP POLICY IF EXISTS admin_presence_all ON user_presence;
CREATE POLICY admin_presence_all 
  ON user_presence
  FOR ALL 
  TO authenticated
  USING ((auth.jwt() ->> 'role') = 'admin');

-- Users podem atualizar apenas seu próprio status
DROP POLICY IF EXISTS users_presence_self ON user_presence;
CREATE POLICY users_presence_self 
  ON user_presence
  FOR UPDATE 
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users podem inserir apenas seu próprio status
DROP POLICY IF EXISTS users_presence_insert ON user_presence;
CREATE POLICY users_presence_insert 
  ON user_presence
  FOR INSERT 
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- 6. Tabela de histórico (opcional)
CREATE TABLE IF NOT EXISTS public.user_presence_history (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status text NOT NULL,
  device_type text,
  platform text,
  logged_at timestamptz NOT NULL DEFAULT now()
);

-- Índices para histórico
CREATE INDEX IF NOT EXISTS user_presence_history_user_idx 
  ON user_presence_history(user_id);
  
CREATE INDEX IF NOT EXISTS user_presence_history_logged_at_idx 
  ON user_presence_history(logged_at);

-- Trigger para registrar mudanças de status
CREATE OR REPLACE FUNCTION log_presence_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Registrar apenas mudanças de status
  IF NEW.status != OLD.status THEN
    INSERT INTO user_presence_history (user_id, status, device_type, platform)
    VALUES (NEW.user_id, NEW.status, NEW.device_type, NEW.platform);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_log_presence_change
  AFTER UPDATE ON user_presence
  FOR EACH ROW
  EXECUTE FUNCTION log_presence_change();

-- ===================================================================
-- FUNÇÃO HELPER: Obter email do usuário (se auth.users não for acessível)
-- ===================================================================

-- Esta função permite acessar o email de forma segura
-- Se você tiver permissão para acessar auth.users diretamente, pode pular esta função
CREATE OR REPLACE FUNCTION get_user_email(user_uuid uuid)
RETURNS text AS $$
BEGIN
  -- Tenta acessar auth.users (pode falhar se não tiver permissão)
  RETURN (SELECT email FROM auth.users WHERE id = user_uuid);
EXCEPTION
  WHEN OTHERS THEN
    -- Se não conseguir acessar, retorna null
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ===================================================================
-- VERIFICAÇÃO
-- ===================================================================

-- Verificar se tabela foi criada
SELECT 
  table_name, 
  table_type 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('user_presence', 'user_presence_history');

-- Verificar colunas
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'user_presence'
ORDER BY ordinal_position;

-- ===================================================================
-- TESTE
-- ===================================================================

-- Inserir presença de teste (substitua o UUID)
-- INSERT INTO user_presence (user_id, status, device_type, platform)
-- VALUES ('your-user-uuid-here', 'online', 'web', 'windows');

-- Consultar usuários online
-- OPÇÃO 1: Usando JOIN direto com auth.users (pode não funcionar se não tiver permissão)
-- SELECT 
--   up.user_id,
--   p.full_name,
--   u.email,
--   up.status,
--   up.device_type,
--   up.platform,
--   up.last_seen,
--   e.name as establishment_name
-- FROM user_presence up
-- JOIN profiles p ON p.user_id = up.user_id
-- LEFT JOIN auth.users u ON u.id = up.user_id
-- LEFT JOIN establishments e ON e.id = up.establishment_id
-- WHERE up.status = 'online'
-- ORDER BY up.last_seen DESC;

-- OPÇÃO 2: Usando função helper (mais seguro)
SELECT 
  up.user_id,
  p.full_name,
  get_user_email(up.user_id) as email,
  up.status,
  up.device_type,
  up.platform,
  up.last_seen,
  e.name as establishment_name
FROM user_presence up
JOIN profiles p ON p.user_id = up.user_id
LEFT JOIN establishments e ON e.id = up.establishment_id
WHERE up.status = 'online'
ORDER BY up.last_seen DESC;

-- OPÇÃO 3: Sem email (se nenhuma das opções acima funcionar)
-- SELECT 
--   up.user_id,
--   p.full_name,
--   up.status,
--   up.device_type,
--   up.platform,
--   up.last_seen,
--   e.name as establishment_name
-- FROM user_presence up
-- JOIN profiles p ON p.user_id = up.user_id
-- LEFT JOIN establishments e ON e.id = up.establishment_id
-- WHERE up.status = 'online'
-- ORDER BY up.last_seen DESC;

-- ===================================================================
-- FIM
-- ===================================================================

