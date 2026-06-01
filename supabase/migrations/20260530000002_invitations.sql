-- FASE 6: company_invitations table
CREATE TABLE IF NOT EXISTS company_invitations (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id   uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  invited_by   uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  email        text NOT NULL,
  role         text NOT NULL DEFAULT 'seller',
  token        uuid NOT NULL DEFAULT gen_random_uuid() UNIQUE,
  status       text NOT NULL DEFAULT 'pending',
  expires_at   timestamptz NOT NULL DEFAULT (now() + interval '7 days'),
  accepted_at  timestamptz,
  created_at   timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT invitations_role_check   CHECK (role   IN ('admin','manager','seller','technician','cashier')),
  CONSTRAINT invitations_status_check CHECK (status IN ('pending','accepted','expired','cancelled'))
);

CREATE INDEX idx_invitations_company ON company_invitations(company_id);
CREATE INDEX idx_invitations_token   ON company_invitations(token);
CREATE INDEX idx_invitations_email   ON company_invitations(company_id, email, status);

ALTER TABLE company_invitations ENABLE ROW LEVEL SECURITY;

-- Company members can view their company's invitations
CREATE POLICY "invitations_select" ON company_invitations FOR SELECT
  USING (company_id = get_current_company_id() OR is_saas_admin());

-- Only owners and admins can create invitations
CREATE POLICY "invitations_insert" ON company_invitations FOR INSERT
  WITH CHECK (
    company_id = get_current_company_id()
    AND current_user_role() IN ('owner', 'admin')
  );

-- Only owners and admins can update (cancel) invitations
CREATE POLICY "invitations_update" ON company_invitations FOR UPDATE
  USING (company_id = get_current_company_id() AND current_user_role() IN ('owner', 'admin'))
  WITH CHECK (company_id = get_current_company_id() AND current_user_role() IN ('owner', 'admin'));

-- Function: accept_invitation
CREATE OR REPLACE FUNCTION accept_invitation(p_token uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_inv company_invitations%ROWTYPE;
  v_user_email text;
  v_user_name  text;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'not_authenticated';
  END IF;

  -- Load valid pending invitation
  SELECT * INTO v_inv
  FROM company_invitations
  WHERE token = p_token
    AND status = 'pending'
    AND expires_at > now();

  IF NOT FOUND THEN
    RAISE EXCEPTION 'invalid_or_expired_token';
  END IF;

  -- Prevent duplicate membership
  IF EXISTS (
    SELECT 1 FROM profiles
    WHERE user_id = auth.uid()
      AND company_id = v_inv.company_id
  ) THEN
    RAISE EXCEPTION 'already_member';
  END IF;

  -- Fetch user metadata
  SELECT email,
         raw_user_meta_data->>'name'
  INTO v_user_email, v_user_name
  FROM auth.users
  WHERE id = auth.uid();

  -- Create profile in the invited company
  INSERT INTO profiles (user_id, company_id, name, email, role)
  VALUES (
    auth.uid(),
    v_inv.company_id,
    COALESCE(v_user_name, split_part(v_user_email, '@', 1)),
    COALESCE(v_user_email, v_inv.email),
    v_inv.role
  );

  -- Mark invitation accepted
  UPDATE company_invitations
  SET status = 'accepted', accepted_at = now()
  WHERE id = v_inv.id;
END;
$$;

-- Function: expire old invitations (call periodically via cron or on-demand)
CREATE OR REPLACE FUNCTION expire_old_invitations()
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE company_invitations
  SET status = 'expired'
  WHERE status = 'pending' AND expires_at < now();
$$;
