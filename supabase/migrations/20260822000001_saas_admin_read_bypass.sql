-- ===========================================================================
-- A página /admin/[id] usava is_saas_admin() só em companies/profiles.
-- Nas tabelas de dados operacionais a policy de SELECT só liberava
-- company_id = get_current_company_id(), então o admin da plataforma via
-- 0 clientes/produtos/OS/vendas para qualquer empresa que não fosse a dele,
-- mesmo com dados reais no banco (RLS filtra silenciosamente, sem erro).
-- ===========================================================================

ALTER POLICY "suppliers_select" ON suppliers
  USING (company_id = get_current_company_id() OR is_saas_admin());

ALTER POLICY "customers_select" ON customers
  USING (company_id = get_current_company_id() OR is_saas_admin());

ALTER POLICY "product_categories_select" ON product_categories
  USING (company_id = get_current_company_id() OR is_saas_admin());

ALTER POLICY "products_select" ON products
  USING (company_id = get_current_company_id() OR is_saas_admin());

ALTER POLICY "vehicles_select" ON vehicles
  USING (company_id = get_current_company_id() OR is_saas_admin());

ALTER POLICY "stock_movements_select" ON stock_movements
  USING (company_id = get_current_company_id() OR is_saas_admin());

ALTER POLICY "payment_methods_select" ON payment_methods
  USING (company_id = get_current_company_id() OR is_saas_admin());

ALTER POLICY "sales_select" ON sales
  USING (company_id = get_current_company_id() OR is_saas_admin());

ALTER POLICY "sale_items_select" ON sale_items
  USING (company_id = get_current_company_id() OR is_saas_admin());

ALTER POLICY "service_order_statuses_select" ON service_order_statuses
  USING (company_id = get_current_company_id() OR is_saas_admin());

ALTER POLICY "service_orders_select" ON service_orders
  USING (company_id = get_current_company_id() OR is_saas_admin());

ALTER POLICY "payments_select" ON payments
  USING (company_id = get_current_company_id() OR is_saas_admin());

ALTER POLICY "service_order_items_select" ON service_order_items
  USING (company_id = get_current_company_id() OR is_saas_admin());

ALTER POLICY "checklist_templates_select" ON checklist_templates
  USING (company_id = get_current_company_id() OR is_saas_admin());

ALTER POLICY "checklist_template_items_select" ON checklist_template_items
  USING (company_id = get_current_company_id() OR is_saas_admin());

ALTER POLICY "service_order_checklists_select" ON service_order_checklists
  USING (company_id = get_current_company_id() OR is_saas_admin());

ALTER POLICY "service_order_photos_select" ON service_order_photos
  USING (company_id = get_current_company_id() OR is_saas_admin());

ALTER POLICY "quotes_select" ON quotes
  USING (company_id = get_current_company_id() OR is_saas_admin());

ALTER POLICY "quote_items_select" ON quote_items
  USING (company_id = get_current_company_id() OR is_saas_admin());

ALTER POLICY "warranties_select" ON warranties
  USING (company_id = get_current_company_id() OR is_saas_admin());

ALTER POLICY "warranty_rules_select" ON warranty_rules
  USING (company_id = get_current_company_id() OR is_saas_admin());

ALTER POLICY "services_select" ON services
  USING (company_id = get_current_company_id() OR is_saas_admin());

ALTER POLICY "financial_categories_select" ON financial_categories
  USING (company_id = get_current_company_id() OR is_saas_admin());

ALTER POLICY "financial_transactions_select" ON financial_transactions
  USING (company_id = get_current_company_id() OR is_saas_admin());

ALTER POLICY "message_templates_select" ON message_templates
  USING (company_id = get_current_company_id() OR is_saas_admin());

ALTER POLICY "activity_logs_select" ON activity_logs
  USING (company_id = get_current_company_id() OR is_saas_admin());

ALTER POLICY "revision_schedules_select" ON revision_schedules
  USING (company_id = get_current_company_id() OR is_saas_admin());

ALTER POLICY "revision_reminders_select" ON revision_reminders
  USING (company_id = get_current_company_id() OR is_saas_admin());

ALTER POLICY "cash_registers_select" ON cash_registers
  USING (company_id = get_current_company_id() OR is_saas_admin());

ALTER POLICY "cash_movements_select" ON cash_movements
  USING (company_id = get_current_company_id() OR is_saas_admin());
