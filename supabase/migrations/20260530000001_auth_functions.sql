-- ScooterGestor — Auth Functions
-- Run after 20260530000000_initial_schema.sql

-- ===========================================================================
-- FUNCTION: create_company_with_owner
-- Creates a company + owner profile + default data atomically.
-- Called during onboarding; runs as SECURITY DEFINER so the user doesn't
-- need INSERT permission on companies (RLS only allows is_saas_admin).
-- ===========================================================================
CREATE OR REPLACE FUNCTION create_company_with_owner(
  p_company_name text,
  p_company_slug text,
  p_owner_name   text,
  p_owner_email  text
) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_user_id    uuid;
  v_company_id uuid;
BEGIN
  v_user_id := auth.uid();

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'not_authenticated';
  END IF;

  IF EXISTS (SELECT 1 FROM profiles WHERE user_id = v_user_id) THEN
    RAISE EXCEPTION 'already_has_company';
  END IF;

  IF EXISTS (SELECT 1 FROM companies WHERE slug = p_company_slug) THEN
    RAISE EXCEPTION 'slug_taken';
  END IF;

  INSERT INTO companies (name, slug, plan, status, trial_ends_at)
  VALUES (
    p_company_name,
    p_company_slug,
    'start',
    'trial',
    NOW() + INTERVAL '14 days'
  )
  RETURNING id INTO v_company_id;

  INSERT INTO profiles (user_id, company_id, name, email, role)
  VALUES (v_user_id, v_company_id, p_owner_name, p_owner_email, 'owner');

  PERFORM setup_company_defaults(v_company_id);

  RETURN v_company_id;
END;
$$;
