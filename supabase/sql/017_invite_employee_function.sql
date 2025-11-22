-- Função para criar conta de funcionário com acesso completo
create or replace function public.create_employee_account(
  p_email text,
  p_password text,
  p_full_name text,
  p_phone text,
  p_role text,
  p_establishment_id uuid
)
returns json
language plpgsql
security definer
as $$
declare
  v_user_id uuid;
  v_employee_id uuid;
  v_user_role text;
  v_result json;
begin
  -- Verificar se o usuário atual é owner ou manager
  select ue.role into v_user_role
  from public.user_establishments ue
  where ue.user_id = auth.uid()
  and ue.establishment_id = p_establishment_id;

  if v_user_role not in ('owner', 'manager') then
    raise exception 'Sem permissão para criar funcionários';
  end if;

  -- Validar role
  if p_role not in ('operator', 'manager', 'owner') then
    raise exception 'Role inválida. Use: operator, manager ou owner';
  end if;

  -- Criar usuário no Supabase Auth (usando extensão auth)
  -- Nota: Isso requer que a extensão pgcrypto esteja habilitada
  insert into auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    confirmation_token,
    email_change,
    email_change_token_new,
    recovery_token
  ) values (
    '00000000-0000-0000-0000-000000000000',
    gen_random_uuid(),
    'authenticated',
    'authenticated',
    p_email,
    crypt(p_password, gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}',
    jsonb_build_object('full_name', p_full_name),
    now(),
    now(),
    '',
    '',
    '',
    ''
  ) returning id into v_user_id;

  -- Criar perfil
  insert into public.profiles (user_id, establishment_id)
  values (v_user_id, p_establishment_id);

  -- Criar registro de funcionário
  insert into public.employees (
    user_id,
    establishment_id,
    full_name,
    email,
    phone,
    role,
    created_by
  ) values (
    v_user_id,
    p_establishment_id,
    p_full_name,
    p_email,
    p_phone,
    p_role,
    auth.uid()
  ) returning id into v_employee_id;

  -- Criar vínculo user_establishments
  insert into public.user_establishments (user_id, establishment_id, role)
  values (v_user_id, p_establishment_id, p_role);

  -- Retornar dados de acesso
  v_result := json_build_object(
    'employee_id', v_employee_id,
    'user_id', v_user_id,
    'email', p_email,
    'password', p_password,
    'full_name', p_full_name,
    'role', p_role
  );

  return v_result;
end;
$$;
