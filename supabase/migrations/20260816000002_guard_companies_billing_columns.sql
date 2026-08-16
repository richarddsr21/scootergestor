-- Guard billing-related columns on `companies` against being written by an
-- ordinary authenticated company member via the session-scoped Supabase
-- client (e.g. straight from browser devtools).
--
-- The pre-existing `companies_update` RLS policy
-- (supabase/migrations/20260530000000_initial_schema.sql:107-109) allows any
-- member of a company to UPDATE their own company's row — that's correct for
-- columns like name/slug/cnpj/logo_url, but these billing columns are now a
-- paywall gate: a blocked user could otherwise set status = 'active' (or
-- clear payment_overdue_since / trial_ends_at) directly and bypass billing
-- entirely. RLS alone can't distinguish "which columns" within one UPDATE,
-- so this is enforced with a BEFORE UPDATE trigger instead.
--
-- Allowed to change these columns: is_saas_admin() (see
-- 20260530000000_initial_schema.sql:24-27) and the service role (the Asaas
-- webhook and the billing server action both write these columns
-- programmatically via createAdminClient(), which is service-role and
-- therefore NOT subject to RLS — but IS still subject to this trigger, since
-- triggers fire regardless of RLS bypass. auth.role() is Supabase's built-in
-- helper (companion to the auth.jwt() already used by is_saas_admin()) that
-- reads the 'role' claim off the request JWT; PostgREST sets it to
-- 'service_role' for requests authenticated with the service-role key.
CREATE OR REPLACE FUNCTION guard_companies_billing_columns()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF is_saas_admin() OR auth.role() = 'service_role' THEN
    RETURN NEW;
  END IF;

  IF OLD.status IS DISTINCT FROM NEW.status
     OR OLD.trial_ends_at IS DISTINCT FROM NEW.trial_ends_at
     OR OLD.subscription_status IS DISTINCT FROM NEW.subscription_status
     OR OLD.subscription_current_period_end IS DISTINCT FROM NEW.subscription_current_period_end
     OR OLD.asaas_customer_id IS DISTINCT FROM NEW.asaas_customer_id
     OR OLD.asaas_subscription_id IS DISTINCT FROM NEW.asaas_subscription_id
     OR OLD.payment_overdue_since IS DISTINCT FROM NEW.payment_overdue_since
  THEN
    RAISE EXCEPTION 'Not authorized to change billing-related company fields';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_guard_companies_billing_columns ON companies;

CREATE TRIGGER trg_guard_companies_billing_columns
  BEFORE UPDATE ON companies
  FOR EACH ROW
  EXECUTE FUNCTION guard_companies_billing_columns();
