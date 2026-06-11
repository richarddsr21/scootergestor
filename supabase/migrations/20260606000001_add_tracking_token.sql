-- Add tracking_token to service_orders for public OS tracking page
ALTER TABLE service_orders
  ADD COLUMN IF NOT EXISTS tracking_token uuid DEFAULT gen_random_uuid();

-- Backfill existing rows that might not have a token
UPDATE service_orders SET tracking_token = gen_random_uuid() WHERE tracking_token IS NULL;

ALTER TABLE service_orders ALTER COLUMN tracking_token SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS service_orders_tracking_token_key ON service_orders(tracking_token);
CREATE INDEX IF NOT EXISTS idx_service_orders_tracking_token ON service_orders(tracking_token);

-- SECURITY DEFINER function — bypasses RLS so anon users can read tracking data.
-- Returns only non-sensitive fields needed for the public tracking page.
CREATE OR REPLACE FUNCTION public.get_os_tracking(p_token uuid)
RETURNS json
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT json_build_object(
    'order_number',         os.order_number,
    'reported_problem',     os.reported_problem,
    'expected_delivery_at', os.expected_delivery_at,
    'created_at',           os.created_at,
    'updated_at',           os.updated_at,
    'status_name',          sos.name,
    'status_slug',          sos.slug,
    'status_color',         sos.color,
    'customer_first_name',  split_part(c.name, ' ', 1),
    'vehicle_label',        COALESCE(NULLIF(concat_ws(' ', v.brand, v.model), ''), v.type),
    'store_name',           cs.business_name,
    'store_whatsapp',       cs.whatsapp
  )
  FROM service_orders os
  LEFT JOIN service_order_statuses sos ON sos.id = os.status_id
  LEFT JOIN customers c ON c.id = os.customer_id
  LEFT JOIN vehicles v ON v.id = os.vehicle_id
  LEFT JOIN company_settings cs ON cs.company_id = os.company_id
  WHERE os.tracking_token = p_token
  LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION public.get_os_tracking(uuid) TO anon, authenticated;
