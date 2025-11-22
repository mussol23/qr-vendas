-- supabase/sql/010_get_online_users_function.sql

CREATE OR REPLACE FUNCTION get_online_users()
RETURNS TABLE(
    user_id uuid,
    last_seen timestamptz,
    full_name text,
    email text,
    establishment_name text
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        up.user_id,
        up.last_seen,
        p.full_name,
        p.email,
        e.name as establishment_name
    FROM
        public.user_presence up
    LEFT JOIN
        public.profiles p ON up.user_id = p.id
    LEFT JOIN
        public.establishments e ON p.establishment_id = e.id
    WHERE
        up.status = 'online'
    ORDER BY
        up.last_seen DESC;
END;
$$ LANGUAGE plpgsql;
