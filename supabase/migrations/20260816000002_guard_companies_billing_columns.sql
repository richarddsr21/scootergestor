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
-- triggers fire regardless of RLS bypass. We check current_user (the actual
-- Postgres role executing the statement) instead of auth.role(): auth.role()
-- reads the 'role' claim off the request JWT, which is NULL outside of a
-- PostgREST/Supabase-authenticated request — e.g. the Supabase Dashboard SQL
-- Editor runs as plain Postgres role `postgres` with no JWT context at all,
-- so auth.role() = 'service_role' would evaluate to NULL there (not false),
-- and combined with is_saas_admin() also being false/NULL, the whole
-- condition is NULL, which does NOT satisfy the IF — so the SQL Editor would
-- be wrongly blocked, including the plan's own manual-verification UPDATE
-- statements. current_user correctly reflects `postgres` (SQL Editor),
-- `service_role` (service-role API calls) and `supabase_admin`, so none of
-- those are blocked.
CREATE OR REPLACE FUNCTION guard_companies_billing_columns()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF is_saas_admin() OR current_user IN ('service_role', 'postgres', 'supabase_admin') THEN
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
