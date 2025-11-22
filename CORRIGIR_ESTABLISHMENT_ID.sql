-- ============================================================
-- SCRIPT PARA CORRIGIR establishment_id EM USUÁRIOS EXISTENTES
-- ============================================================
-- 
-- Execute este script no Supabase SQL Editor
-- Dashboard → SQL Editor → New Query → Colar e executar
--
-- O que este script faz:
-- 1. Cria establishments para usuários que não têm
-- 2. Vincula os establishments aos profiles
-- 3. Verifica se todos ficaram corretos
-- ============================================================

-- PASSO 1: Verificar situação atual
-- ====================================
SELECT 
    COUNT(*) as total_usuarios,
    COUNT(establishment_id) as usuarios_com_establishment,
    COUNT(*) - COUNT(establishment_id) as usuarios_sem_establishment
FROM profiles;

-- RESULTADO ESPERADO:
-- Se "usuarios_sem_establishment" > 0, continue com o script


-- PASSO 2: Criar establishments para quem não tem
-- ================================================
-- Cria um establishment para cada profile sem establishment
-- Nome: "Loja de [nome_usuario]" ou "Store [primeiros_8_do_id]"

INSERT INTO establishments (id, name, active, updated_at)
SELECT 
    gen_random_uuid() as id,
    CASE 
        WHEN p.full_name IS NOT NULL AND p.full_name != '' 
        THEN 'Loja de ' || p.full_name
        ELSE 'Loja ' || substring(p.user_id::text, 1, 8)
    END as name,
    true as active,
    now() as updated_at
FROM profiles p
WHERE p.establishment_id IS NULL
ON CONFLICT DO NOTHING;

-- Aguarde alguns segundos...


-- PASSO 3: Vincular establishments aos profiles
-- ==============================================
-- Usa uma lógica de matching pelo nome para vincular

WITH establishments_to_link AS (
    SELECT 
        p.user_id,
        p.full_name,
        (
            SELECT e.id 
            FROM establishments e
            WHERE e.name LIKE 'Loja de ' || p.full_name
               OR e.name LIKE 'Loja ' || substring(p.user_id::text, 1, 8)
            ORDER BY e.updated_at DESC
            LIMIT 1
        ) as establishment_id
    FROM profiles p
    WHERE p.establishment_id IS NULL
)
UPDATE profiles p
SET 
    establishment_id = etl.establishment_id,
    updated_at = now()
FROM establishments_to_link etl
WHERE p.user_id = etl.user_id
  AND etl.establishment_id IS NOT NULL;

-- Aguarde alguns segundos...


-- PASSO 4: Verificar se todos ficaram corretos
-- =============================================
SELECT 
    COUNT(*) as total_usuarios,
    COUNT(establishment_id) as usuarios_com_establishment,
    COUNT(*) - COUNT(establishment_id) as usuarios_sem_establishment
FROM profiles;

-- RESULTADO ESPERADO:
-- usuarios_sem_establishment = 0 (ZERO)


-- PASSO 5: Listar todos os profiles com seus establishments
-- ==========================================================
SELECT 
    p.user_id,
    p.full_name,
    p.establishment_id,
    e.name as establishment_name,
    CASE 
        WHEN p.establishment_id IS NULL THEN '❌ SEM ESTABLISHMENT'
        ELSE '✅ OK'
    END as status
FROM profiles p
LEFT JOIN establishments e ON e.id = p.establishment_id
ORDER BY p.created_at DESC;


-- ============================================================
-- SE AINDA HOUVER USUÁRIOS SEM ESTABLISHMENT
-- ============================================================
-- Execute este bloco adicional para corrigir casos específicos

-- Criar establishment genérico e vincular manualmente
DO $$
DECLARE
    v_profile RECORD;
    v_establishment_id UUID;
BEGIN
    -- Para cada profile sem establishment
    FOR v_profile IN 
        SELECT user_id, full_name 
        FROM profiles 
        WHERE establishment_id IS NULL
    LOOP
        -- Criar establishment
        INSERT INTO establishments (name, active)
        VALUES (
            COALESCE('Loja de ' || v_profile.full_name, 'Loja ' || substring(v_profile.user_id::text, 1, 8)),
            true
        )
        RETURNING id INTO v_establishment_id;
        
        -- Vincular ao profile
        UPDATE profiles
        SET 
            establishment_id = v_establishment_id,
            updated_at = now()
        WHERE user_id = v_profile.user_id;
        
        RAISE NOTICE 'Criado establishment % para user %', v_establishment_id, v_profile.user_id;
    END LOOP;
END $$;


-- ============================================================
-- VERIFICAÇÃO FINAL
-- ============================================================
-- Este SELECT deve retornar ZERO na última coluna

SELECT 
    COUNT(*) as total_usuarios,
    COUNT(establishment_id) as usuarios_com_establishment,
    COUNT(*) FILTER (WHERE establishment_id IS NULL) as usuarios_sem_establishment,
    CASE 
        WHEN COUNT(*) FILTER (WHERE establishment_id IS NULL) = 0 
        THEN '✅ TODOS OS USUÁRIOS TÊM ESTABLISHMENT!'
        ELSE '❌ AINDA HÁ ' || COUNT(*) FILTER (WHERE establishment_id IS NULL) || ' USUÁRIO(S) SEM ESTABLISHMENT'
    END as resultado
FROM profiles;


-- ============================================================
-- BONUS: Atualizar dados antigos com establishment_id
-- ============================================================
-- Se você já tinha dados (produtos, clientes, etc) SEM establishment_id,
-- este bloco vai tentar associá-los ao establishment do usuário que os criou.
-- 
-- ⚠️ ATENÇÃO: Este bloco assume que cada tabela tem alguma forma de 
-- identificar quem criou o registro. Se não tiver, pule esta parte.

-- Exemplo para produtos (adapte conforme necessário):
-- UPDATE products p
-- SET establishment_id = prof.establishment_id
-- FROM profiles prof
-- WHERE p.establishment_id IS NULL
--   AND prof.establishment_id IS NOT NULL
--   -- Adicione aqui a lógica para identificar o dono
--   -- Por exemplo: AND p.created_by = prof.user_id
-- ;

-- ============================================================
-- FIM DO SCRIPT
-- ============================================================
-- 
-- Após executar, verifique:
-- 1. Todos profiles têm establishment_id ✅
-- 2. Todos establishments foram criados ✅
-- 3. Faça logout/login no app
-- 4. Cadastre um produto de teste
-- 5. Verifique no Supabase se tem establishment_id ✅

