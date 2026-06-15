-- =============================================================================
-- Cash Registers: abrir/fechar caixa + movimentações
-- =============================================================================

-- TABLE: cash_registers
CREATE TABLE IF NOT EXISTS cash_registers (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id        uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  opened_by         uuid NOT NULL REFERENCES profiles(id),
  opened_at         timestamptz NOT NULL DEFAULT NOW(),
  closed_by         uuid REFERENCES profiles(id),
  closed_at         timestamptz,
  initial_amount    numeric(10,2) NOT NULL DEFAULT 0,
  actual_cash_amount numeric(10,2),
  status            text NOT NULL DEFAULT 'open',
  notes             text,
  created_at        timestamptz NOT NULL DEFAULT NOW(),
  CONSTRAINT cash_registers_status_check CHECK (status IN ('open', 'closed'))
);

CREATE INDEX idx_cash_registers_company ON cash_registers(company_id);
CREATE INDEX idx_cash_registers_status  ON cash_registers(company_id, status);

ALTER TABLE cash_registers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "cash_registers_select" ON cash_registers FOR SELECT USING (company_id = get_current_company_id());
CREATE POLICY "cash_registers_insert" ON cash_registers FOR INSERT WITH CHECK (company_id = get_current_company_id());
CREATE POLICY "cash_registers_update" ON cash_registers FOR UPDATE
  USING (company_id = get_current_company_id()) WITH CHECK (company_id = get_current_company_id());
CREATE POLICY "cash_registers_delete" ON cash_registers FOR DELETE USING (company_id = get_current_company_id());

-- TABLE: cash_movements
CREATE TABLE IF NOT EXISTS cash_movements (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id       uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  cash_register_id uuid NOT NULL REFERENCES cash_registers(id) ON DELETE CASCADE,
  type             text NOT NULL, -- 'entry' | 'sangria'
  payment_method   text NOT NULL DEFAULT 'cash',
  amount           numeric(10,2) NOT NULL,
  description      text,
  source_type      text, -- 'service_order' | 'sale' | 'manual'
  source_id        uuid,
  created_by       uuid REFERENCES profiles(id),
  created_at       timestamptz NOT NULL DEFAULT NOW(),
  CONSTRAINT cash_movements_type_check CHECK (type IN ('entry', 'sangria'))
);

CREATE INDEX idx_cash_movements_register ON cash_movements(cash_register_id);
CREATE INDEX idx_cash_movements_company  ON cash_movements(company_id);

ALTER TABLE cash_movements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "cash_movements_select" ON cash_movements FOR SELECT USING (company_id = get_current_company_id());
CREATE POLICY "cash_movements_insert" ON cash_movements FOR INSERT WITH CHECK (company_id = get_current_company_id());
CREATE POLICY "cash_movements_update" ON cash_movements FOR UPDATE
  USING (company_id = get_current_company_id()) WITH CHECK (company_id = get_current_company_id());
CREATE POLICY "cash_movements_delete" ON cash_movements FOR DELETE USING (company_id = get_current_company_id());
