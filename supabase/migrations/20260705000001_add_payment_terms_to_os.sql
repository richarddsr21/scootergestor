-- Adds a simple "payment terms" field chosen when the service order is opened
-- (e.g. cash on delivery, installments, negotiated) — informational only,
-- the actual payment breakdown still happens in payServiceOrderAction.

ALTER TABLE service_orders
  ADD COLUMN IF NOT EXISTS payment_terms text;
