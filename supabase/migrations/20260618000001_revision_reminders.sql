-- =============================================================================
-- Revision Reminders: agendamento de lembretes de revisão por cliente
-- =============================================================================

-- TABLE: revision_schedules
-- Uma agenda ativa por cliente por empresa. Quando o cliente faz uma revisão,
-- a agenda anterior é cancelada e uma nova é criada.
CREATE TABLE IF NOT EXISTS revision_schedules (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id      uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  customer_id     uuid NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  source_os_id    uuid REFERENCES service_orders(id) ON DELETE SET NULL,
  source_sale_id  uuid REFERENCES sales(id) ON DELETE SET NULL,
  started_at      timestamptz NOT NULL DEFAULT NOW(),
  is_active       boolean NOT NULL DEFAULT TRUE,
  cancelled_at    timestamptz,
  created_at      timestamptz NOT NULL DEFAULT NOW(),
  updated_at      timestamptz NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_revision_schedules_company  ON revision_schedules(company_id);
CREATE INDEX idx_revision_schedules_customer ON revision_schedules(company_id, customer_id);
CREATE INDEX idx_revision_schedules_active   ON revision_schedules(company_id, is_active);

ALTER TABLE revision_schedules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "revision_schedules_select" ON revision_schedules FOR SELECT USING (company_id = get_current_company_id());
CREATE POLICY "revision_schedules_insert" ON revision_schedules FOR INSERT WITH CHECK (company_id = get_current_company_id());
CREATE POLICY "revision_schedules_update" ON revision_schedules FOR UPDATE
  USING (company_id = get_current_company_id()) WITH CHECK (company_id = get_current_company_id());
CREATE POLICY "revision_schedules_delete" ON revision_schedules FOR DELETE USING (company_id = get_current_company_id());

-- TABLE: revision_reminders
-- Múltiplos lembretes por agenda. Cada lembrete tem uma data e define
-- se deve notificar o cliente (WhatsApp) e/ou a loja (sino de notificações).
CREATE TABLE IF NOT EXISTS revision_reminders (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  schedule_id     uuid NOT NULL REFERENCES revision_schedules(id) ON DELETE CASCADE,
  company_id      uuid NOT NULL,
  remind_on       date NOT NULL,
  notify_customer boolean NOT NULL DEFAULT TRUE,
  notify_store    boolean NOT NULL DEFAULT TRUE,
  sent_at         timestamptz,
  created_at      timestamptz NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_revision_reminders_schedule ON revision_reminders(schedule_id);
CREATE INDEX idx_revision_reminders_company  ON revision_reminders(company_id);
CREATE INDEX idx_revision_reminders_due      ON revision_reminders(company_id, remind_on) WHERE sent_at IS NULL;

ALTER TABLE revision_reminders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "revision_reminders_select" ON revision_reminders FOR SELECT USING (company_id = get_current_company_id());
CREATE POLICY "revision_reminders_insert" ON revision_reminders FOR INSERT WITH CHECK (company_id = get_current_company_id());
CREATE POLICY "revision_reminders_update" ON revision_reminders FOR UPDATE
  USING (company_id = get_current_company_id()) WITH CHECK (company_id = get_current_company_id());
CREATE POLICY "revision_reminders_delete" ON revision_reminders FOR DELETE USING (company_id = get_current_company_id());
