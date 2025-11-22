-- supabase/sql/008_admin_dashboard_functions.sql

-- Função para obter a contagem mensal de novos usuários para o gráfico do dashboard
CREATE OR REPLACE FUNCTION get_monthly_user_signups()
RETURNS TABLE(name TEXT, "NovosUsuários" BIGINT) AS $$
BEGIN
    RETURN QUERY
    WITH months AS (
        SELECT date_trunc('month', T.day)::date AS month
        FROM generate_series(
            CURRENT_DATE - interval '5 months',
            CURRENT_DATE,
            '1 month'
        ) AS T(day)
    )
    SELECT
        to_char(m.month, 'YYYY-MM-01') AS name,
        COUNT(u.id) AS "NovosUsuários"
    FROM months m
    LEFT JOIN auth.users u ON date_trunc('month', u.created_at) = m.month
    GROUP BY m.month
    ORDER BY m.month;
END;
$$ LANGUAGE plpgsql;
