-- Número de chassi para venda de scooters
ALTER TABLE products   ADD COLUMN IF NOT EXISTS requires_chassis boolean NOT NULL DEFAULT false;
ALTER TABLE sale_items ADD COLUMN IF NOT EXISTS chassis_number   text;
