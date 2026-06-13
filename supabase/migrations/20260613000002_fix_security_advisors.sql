-- =============================================================================
-- Fix Supabase Security Advisor warnings
-- =============================================================================

-- 1. trigger_set_updated_at — faltava SET search_path (mutable search_path)
CREATE OR REPLACE FUNCTION trigger_set_updated_at()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- 2. setup_company_defaults — só deve ser chamada internamente por
--    create_company_with_owner, nunca via REST. Revoga PUBLIC e não regrant ninguém.
REVOKE EXECUTE ON FUNCTION setup_company_defaults(uuid) FROM PUBLIC;

-- 3. expire_old_invitations — função de manutenção (cron), ninguém chama via REST
REVOKE EXECUTE ON FUNCTION expire_old_invitations() FROM PUBLIC;

-- 4. create_company_with_owner — só authenticated cria empresas (onboarding pós-cadastro)
--    Revoga PUBLIC e dá de volta apenas para authenticated
REVOKE EXECUTE ON FUNCTION create_company_with_owner(text, text, text, text) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION create_company_with_owner(text, text, text, text) TO authenticated;

-- =============================================================================
-- Funções mantidas intencionalmente acessíveis:
--
-- accept_invitation(uuid)   → anon precisa aceitar convite antes de logar
-- get_os_tracking(uuid)     → página pública de acompanhamento sem auth
-- get_current_company_id()  → helper de RLS; anon precisa executar p/ avaliar policies
-- current_user_role()       → idem (retorna null p/ anon, sem risco)
-- is_saas_admin()           → idem (retorna false p/ anon, sem risco)
--
-- auth_leaked_password_protection → ativar no Dashboard:
--   Authentication → Settings → Password Protection → Enable
-- =============================================================================
