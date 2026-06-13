-- Update get_os_tracking to expose scooter model and OS total price
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
    'vehicle_label',        COALESCE(
                              NULLIF(concat_ws(' ', os.vehicle_brand, os.vehicle_model), ''),
                              NULLIF(concat_ws(' ', v.brand, v.model), ''),
                              v.type
                            ),
    'vehicle_model',        COALESCE(os.vehicle_model, v.model),
    'total',                os.total,
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
