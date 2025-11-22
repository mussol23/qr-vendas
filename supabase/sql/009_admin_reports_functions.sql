-- supabase/sql/009_admin_reports_functions.sql

-- Função para obter os produtos mais vendidos para o dashboard de relatórios
CREATE OR REPLACE FUNCTION get_top_selling_products(limit_count INT)
RETURNS TABLE(name TEXT, "total_vendido" BIGINT) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.name,
        sum(si.quantity)::BIGINT as total_vendido
    FROM public.sale_items si
    JOIN public.products p ON si.product_id = p.id
    GROUP BY p.name
    ORDER BY total_vendido DESC
    LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;
