ALTER TABLE payment_methods
  ADD COLUMN IF NOT EXISTS fee_percent      numeric(5,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS installment_fees jsonb;

ALTER TABLE payments
  ADD COLUMN IF NOT EXISTS fee_amount numeric(10,2) NOT NULL DEFAULT 0;
