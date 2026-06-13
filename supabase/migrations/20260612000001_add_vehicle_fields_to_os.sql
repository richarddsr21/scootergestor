-- Add vehicle info fields directly on service orders
-- (mileage changes per visit; brand/model/chassis allow quick entry without a vehicles record)

ALTER TABLE service_orders
  ADD COLUMN IF NOT EXISTS vehicle_brand   text,
  ADD COLUMN IF NOT EXISTS vehicle_model   text,
  ADD COLUMN IF NOT EXISTS vehicle_chassis text,
  ADD COLUMN IF NOT EXISTS mileage_km      integer;
