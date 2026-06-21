ALTER TABLE quotes
  ADD COLUMN IF NOT EXISTS vehicle_brand text,
  ADD COLUMN IF NOT EXISTS vehicle_model text;
