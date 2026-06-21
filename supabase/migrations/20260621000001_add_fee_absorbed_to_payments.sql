ALTER TABLE payments
  ADD COLUMN IF NOT EXISTS fee_absorbed boolean NOT NULL DEFAULT false;
