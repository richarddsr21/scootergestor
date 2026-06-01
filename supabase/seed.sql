-- ScooterGestor — Dev Seed
-- Creates a demo company + owner for local testing.
-- DO NOT run in production.
--
-- Usage: paste in Supabase SQL Editor after running the migration.
-- The user 'demo@scootergestor.com.br' must exist in auth.users first
-- (create via Supabase Auth > Users, or via sign-up flow).
--
-- Replace <AUTH_USER_ID> with the actual UUID from auth.users.

DO $$
DECLARE
  v_user_id    uuid := '<AUTH_USER_ID>';  -- replace before running
  v_company_id uuid;
BEGIN
  -- Company
  INSERT INTO companies (name, slug, email, phone, plan, status, trial_ends_at)
  VALUES (
    'Demo Scooter Shop',
    'demo-scooter-shop',
    'demo@scootergestor.com.br',
    '(21) 99999-0000',
    'pro',
    'trial',
    NOW() + INTERVAL '14 days'
  )
  RETURNING id INTO v_company_id;

  -- Owner profile
  INSERT INTO profiles (user_id, company_id, name, email, role)
  VALUES (v_user_id, v_company_id, 'Proprietário Demo', 'demo@scootergestor.com.br', 'owner');

  -- All default data (statuses, checklist, services, etc.)
  PERFORM setup_company_defaults(v_company_id);

  -- Sample customer
  INSERT INTO customers (company_id, name, phone, whatsapp, email, cpf_cnpj, city, state)
  VALUES (v_company_id, 'João Silva', '(21) 98888-1234', '(21) 98888-1234', 'joao@email.com', '123.456.789-00', 'Rio de Janeiro', 'RJ');

  RAISE NOTICE 'Seed completed. company_id = %', v_company_id;
END;
$$;
