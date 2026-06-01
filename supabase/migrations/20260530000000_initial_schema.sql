-- ScooterGestor — Initial Schema
-- Run this in Supabase SQL Editor or via supabase db push

-- ===========================================================================
-- Extensions
-- ===========================================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ===========================================================================
-- updated_at trigger function
-- ===========================================================================
CREATE OR REPLACE FUNCTION trigger_set_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- ===========================================================================
-- RLS helper: is_saas_admin (no table dependency)
-- ===========================================================================
CREATE OR REPLACE FUNCTION is_saas_admin()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT COALESCE((auth.jwt() -> 'app_metadata' ->> 'is_saas_admin')::boolean, false);
$$;

-- ===========================================================================
-- TABLE: companies
-- ===========================================================================
CREATE TABLE IF NOT EXISTS companies (
  id                              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name                            text NOT NULL,
  slug                            text NOT NULL UNIQUE,
  cnpj                            text,
  email                           text,
  phone                           text,
  whatsapp                        text,
  address                         text,
  city                            text,
  state                           text,
  zip_code                        text,
  logo_url                        text,
  plan                            text NOT NULL DEFAULT 'start',
  status                          text NOT NULL DEFAULT 'trial',
  subscription_status             text,
  trial_ends_at                   timestamptz,
  subscription_current_period_end timestamptz,
  created_at                      timestamptz NOT NULL DEFAULT NOW(),
  updated_at                      timestamptz NOT NULL DEFAULT NOW(),
  CONSTRAINT companies_plan_check   CHECK (plan   IN ('start','pro','premium','enterprise')),
  CONSTRAINT companies_status_check CHECK (status IN ('trial','active','suspended','canceled'))
);

CREATE TRIGGER set_updated_at BEFORE UPDATE ON companies
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();
CREATE INDEX idx_companies_slug   ON companies(slug);
CREATE INDEX idx_companies_status ON companies(status);

-- RLS policies for companies are added after profiles table (get_current_company_id depends on it)

-- ===========================================================================
-- TABLE: profiles
-- ===========================================================================
CREATE TABLE IF NOT EXISTS profiles (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name       text NOT NULL,
  email      text NOT NULL,
  phone      text,
  role       text NOT NULL DEFAULT 'technician',
  status     text NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT NOW(),
  updated_at timestamptz NOT NULL DEFAULT NOW(),
  CONSTRAINT profiles_role_check   CHECK (role   IN ('owner','admin','manager','seller','technician','cashier')),
  CONSTRAINT profiles_status_check CHECK (status IN ('active','inactive')),
  UNIQUE(user_id, company_id)
);

CREATE TRIGGER set_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();
CREATE INDEX idx_profiles_user_id    ON profiles(user_id);
CREATE INDEX idx_profiles_company_id ON profiles(company_id);
CREATE INDEX idx_profiles_role       ON profiles(company_id, role);

-- ===========================================================================
-- RLS helper functions that depend on profiles (defined here, after the table)
-- ===========================================================================
CREATE OR REPLACE FUNCTION get_current_company_id()
RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT company_id FROM profiles WHERE user_id = auth.uid() LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION current_user_role()
RETURNS text LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT role FROM profiles WHERE user_id = auth.uid() LIMIT 1;
$$;

-- RLS: companies (now get_current_company_id exists)
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
CREATE POLICY "companies_select" ON companies FOR SELECT
  USING (id = get_current_company_id() OR is_saas_admin());
CREATE POLICY "companies_insert" ON companies FOR INSERT
  WITH CHECK (is_saas_admin());
CREATE POLICY "companies_update" ON companies FOR UPDATE
  USING (id = get_current_company_id() OR is_saas_admin())
  WITH CHECK (id = get_current_company_id() OR is_saas_admin());
CREATE POLICY "companies_delete" ON companies FOR DELETE
  USING (is_saas_admin());

-- RLS: profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profiles_select" ON profiles FOR SELECT
  USING (company_id = get_current_company_id() OR is_saas_admin() OR user_id = auth.uid());
CREATE POLICY "profiles_insert" ON profiles FOR INSERT
  WITH CHECK (company_id = get_current_company_id() OR is_saas_admin());
CREATE POLICY "profiles_update" ON profiles FOR UPDATE
  USING (company_id = get_current_company_id() OR is_saas_admin())
  WITH CHECK (company_id = get_current_company_id() OR is_saas_admin());
CREATE POLICY "profiles_delete" ON profiles FOR DELETE
  USING (company_id = get_current_company_id() OR is_saas_admin());

-- ===========================================================================
-- TABLE: company_settings
-- ===========================================================================
CREATE TABLE IF NOT EXISTS company_settings (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id     uuid NOT NULL UNIQUE REFERENCES companies(id) ON DELETE CASCADE,
  business_name  text,
  legal_name     text,
  cnpj           text,
  phone          text,
  whatsapp       text,
  email          text,
  address        text,
  city           text,
  state          text,
  zip_code       text,
  business_hours text,
  slogan         text,
  notes          text,
  created_at     timestamptz NOT NULL DEFAULT NOW(),
  updated_at     timestamptz NOT NULL DEFAULT NOW()
);

CREATE TRIGGER set_updated_at BEFORE UPDATE ON company_settings
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();
CREATE INDEX idx_company_settings_company_id ON company_settings(company_id);

ALTER TABLE company_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "company_settings_select" ON company_settings FOR SELECT
  USING (company_id = get_current_company_id() OR is_saas_admin());
CREATE POLICY "company_settings_insert" ON company_settings FOR INSERT
  WITH CHECK (company_id = get_current_company_id() OR is_saas_admin());
CREATE POLICY "company_settings_update" ON company_settings FOR UPDATE
  USING (company_id = get_current_company_id() OR is_saas_admin())
  WITH CHECK (company_id = get_current_company_id() OR is_saas_admin());
CREATE POLICY "company_settings_delete" ON company_settings FOR DELETE
  USING (is_saas_admin());

-- ===========================================================================
-- TABLE: company_theme_settings
-- ===========================================================================
CREATE TABLE IF NOT EXISTS company_theme_settings (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id       uuid NOT NULL UNIQUE REFERENCES companies(id) ON DELETE CASCADE,
  primary_color    text,
  secondary_color  text,
  logo_url         text,
  favicon_url      text,
  app_display_name text,
  theme_mode       text NOT NULL DEFAULT 'light',
  created_at       timestamptz NOT NULL DEFAULT NOW(),
  updated_at       timestamptz NOT NULL DEFAULT NOW(),
  CONSTRAINT theme_mode_check CHECK (theme_mode IN ('light','dark','system'))
);

CREATE TRIGGER set_updated_at BEFORE UPDATE ON company_theme_settings
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();
CREATE INDEX idx_company_theme_settings_company_id ON company_theme_settings(company_id);

ALTER TABLE company_theme_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "company_theme_settings_select" ON company_theme_settings FOR SELECT
  USING (company_id = get_current_company_id() OR is_saas_admin());
CREATE POLICY "company_theme_settings_insert" ON company_theme_settings FOR INSERT
  WITH CHECK (company_id = get_current_company_id() OR is_saas_admin());
CREATE POLICY "company_theme_settings_update" ON company_theme_settings FOR UPDATE
  USING (company_id = get_current_company_id() OR is_saas_admin())
  WITH CHECK (company_id = get_current_company_id() OR is_saas_admin());
CREATE POLICY "company_theme_settings_delete" ON company_theme_settings FOR DELETE
  USING (is_saas_admin());

-- ===========================================================================
-- TABLE: suppliers
-- ===========================================================================
CREATE TABLE IF NOT EXISTS suppliers (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name       text NOT NULL,
  cnpj       text,
  phone      text,
  whatsapp   text,
  email      text,
  address    text,
  notes      text,
  created_at timestamptz NOT NULL DEFAULT NOW(),
  updated_at timestamptz NOT NULL DEFAULT NOW()
);

CREATE TRIGGER set_updated_at BEFORE UPDATE ON suppliers
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();
CREATE INDEX idx_suppliers_company_id ON suppliers(company_id);

ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "suppliers_select" ON suppliers FOR SELECT USING (company_id = get_current_company_id());
CREATE POLICY "suppliers_insert" ON suppliers FOR INSERT WITH CHECK (company_id = get_current_company_id());
CREATE POLICY "suppliers_update" ON suppliers FOR UPDATE
  USING (company_id = get_current_company_id()) WITH CHECK (company_id = get_current_company_id());
CREATE POLICY "suppliers_delete" ON suppliers FOR DELETE USING (company_id = get_current_company_id());

-- ===========================================================================
-- TABLE: customers
-- ===========================================================================
CREATE TABLE IF NOT EXISTS customers (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name       text NOT NULL,
  phone      text,
  whatsapp   text,
  email      text,
  cpf_cnpj   text,
  address    text,
  city       text,
  state      text,
  zip_code   text,
  notes      text,
  created_at timestamptz NOT NULL DEFAULT NOW(),
  updated_at timestamptz NOT NULL DEFAULT NOW()
);

CREATE TRIGGER set_updated_at BEFORE UPDATE ON customers
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();
CREATE INDEX idx_customers_company_id ON customers(company_id);
CREATE INDEX idx_customers_name       ON customers(company_id, name);
CREATE INDEX idx_customers_phone      ON customers(company_id, phone);

ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "customers_select" ON customers FOR SELECT USING (company_id = get_current_company_id());
CREATE POLICY "customers_insert" ON customers FOR INSERT WITH CHECK (company_id = get_current_company_id());
CREATE POLICY "customers_update" ON customers FOR UPDATE
  USING (company_id = get_current_company_id()) WITH CHECK (company_id = get_current_company_id());
CREATE POLICY "customers_delete" ON customers FOR DELETE USING (company_id = get_current_company_id());

-- ===========================================================================
-- TABLE: product_categories
-- ===========================================================================
CREATE TABLE IF NOT EXISTS product_categories (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id    uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name          text NOT NULL,
  description   text,
  type          text NOT NULL DEFAULT 'product',
  display_order integer NOT NULL DEFAULT 0,
  status        text NOT NULL DEFAULT 'active',
  created_at    timestamptz NOT NULL DEFAULT NOW(),
  updated_at    timestamptz NOT NULL DEFAULT NOW(),
  CONSTRAINT product_categories_type_check   CHECK (type   IN ('product','service')),
  CONSTRAINT product_categories_status_check CHECK (status IN ('active','inactive'))
);

CREATE TRIGGER set_updated_at BEFORE UPDATE ON product_categories
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();
CREATE INDEX idx_product_categories_company_id ON product_categories(company_id);

ALTER TABLE product_categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "product_categories_select" ON product_categories FOR SELECT USING (company_id = get_current_company_id());
CREATE POLICY "product_categories_insert" ON product_categories FOR INSERT WITH CHECK (company_id = get_current_company_id());
CREATE POLICY "product_categories_update" ON product_categories FOR UPDATE
  USING (company_id = get_current_company_id()) WITH CHECK (company_id = get_current_company_id());
CREATE POLICY "product_categories_delete" ON product_categories FOR DELETE USING (company_id = get_current_company_id());

-- ===========================================================================
-- TABLE: products
-- ===========================================================================
CREATE TABLE IF NOT EXISTS products (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id     uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  category_id    uuid REFERENCES product_categories(id) ON DELETE SET NULL,
  supplier_id    uuid REFERENCES suppliers(id) ON DELETE SET NULL,
  name           text NOT NULL,
  sku            text,
  barcode        text,
  brand          text,
  model          text,
  description    text,
  cost_price     numeric(10,2) NOT NULL DEFAULT 0,
  sale_price     numeric(10,2) NOT NULL DEFAULT 0,
  stock_quantity integer NOT NULL DEFAULT 0,
  minimum_stock  integer NOT NULL DEFAULT 0,
  unit           text NOT NULL DEFAULT 'un',
  image_url      text,
  product_type   text NOT NULL DEFAULT 'part',
  status         text NOT NULL DEFAULT 'active',
  created_at     timestamptz NOT NULL DEFAULT NOW(),
  updated_at     timestamptz NOT NULL DEFAULT NOW(),
  CONSTRAINT products_type_check   CHECK (product_type IN ('scooter','helmet','battery','charger','tire','part','accessory','service','other')),
  CONSTRAINT products_status_check CHECK (status IN ('active','inactive'))
);

CREATE TRIGGER set_updated_at BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();
CREATE INDEX idx_products_company_id  ON products(company_id);
CREATE INDEX idx_products_category    ON products(company_id, category_id);
CREATE INDEX idx_products_sku         ON products(company_id, sku) WHERE sku IS NOT NULL;
CREATE INDEX idx_products_stock_low   ON products(company_id)
  WHERE stock_quantity <= minimum_stock AND status = 'active';

ALTER TABLE products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "products_select" ON products FOR SELECT USING (company_id = get_current_company_id());
CREATE POLICY "products_insert" ON products FOR INSERT WITH CHECK (company_id = get_current_company_id());
CREATE POLICY "products_update" ON products FOR UPDATE
  USING (company_id = get_current_company_id()) WITH CHECK (company_id = get_current_company_id());
CREATE POLICY "products_delete" ON products FOR DELETE USING (company_id = get_current_company_id());

-- ===========================================================================
-- TABLE: vehicles
-- ===========================================================================
CREATE TABLE IF NOT EXISTS vehicles (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id     uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  customer_id    uuid NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  product_id     uuid REFERENCES products(id) ON DELETE SET NULL,
  type           text NOT NULL DEFAULT 'scooter',
  brand          text,
  model          text,
  serial_number  text,
  color          text,
  battery_type   text,
  voltage        text,
  power          text,
  autonomy       text,
  purchase_date  date,
  warranty_until date,
  notes          text,
  created_at     timestamptz NOT NULL DEFAULT NOW(),
  updated_at     timestamptz NOT NULL DEFAULT NOW()
);

CREATE TRIGGER set_updated_at BEFORE UPDATE ON vehicles
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();
CREATE INDEX idx_vehicles_company_id ON vehicles(company_id);
CREATE INDEX idx_vehicles_customer   ON vehicles(company_id, customer_id);
CREATE INDEX idx_vehicles_serial     ON vehicles(company_id, serial_number) WHERE serial_number IS NOT NULL;

ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "vehicles_select" ON vehicles FOR SELECT USING (company_id = get_current_company_id());
CREATE POLICY "vehicles_insert" ON vehicles FOR INSERT WITH CHECK (company_id = get_current_company_id());
CREATE POLICY "vehicles_update" ON vehicles FOR UPDATE
  USING (company_id = get_current_company_id()) WITH CHECK (company_id = get_current_company_id());
CREATE POLICY "vehicles_delete" ON vehicles FOR DELETE USING (company_id = get_current_company_id());

-- ===========================================================================
-- TABLE: stock_movements  (append-only — no UPDATE/DELETE policies)
-- ===========================================================================
CREATE TABLE IF NOT EXISTS stock_movements (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id        uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  product_id        uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  type              text NOT NULL,
  reason            text NOT NULL,
  quantity          integer NOT NULL,
  previous_quantity integer NOT NULL,
  new_quantity      integer NOT NULL,
  reference_type    text,
  reference_id      uuid,
  user_id           uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  notes             text,
  created_at        timestamptz NOT NULL DEFAULT NOW(),
  CONSTRAINT stock_movements_type_check   CHECK (type   IN ('entrada','saida','ajuste','perda','devolucao')),
  CONSTRAINT stock_movements_reason_check CHECK (reason IN ('venda','ordem_servico','compra_fornecedor','ajuste_manual','perda_quebra','devolucao_cliente'))
);

CREATE INDEX idx_stock_movements_company_id ON stock_movements(company_id);
CREATE INDEX idx_stock_movements_product    ON stock_movements(company_id, product_id);
CREATE INDEX idx_stock_movements_created_at ON stock_movements(company_id, created_at DESC);

ALTER TABLE stock_movements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "stock_movements_select" ON stock_movements FOR SELECT USING (company_id = get_current_company_id());
CREATE POLICY "stock_movements_insert" ON stock_movements FOR INSERT WITH CHECK (company_id = get_current_company_id());

-- ===========================================================================
-- TABLE: payment_methods
-- ===========================================================================
CREATE TABLE IF NOT EXISTS payment_methods (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name       text NOT NULL,
  type       text NOT NULL,
  active     boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT NOW(),
  updated_at timestamptz NOT NULL DEFAULT NOW()
);

CREATE TRIGGER set_updated_at BEFORE UPDATE ON payment_methods
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();
CREATE INDEX idx_payment_methods_company_id ON payment_methods(company_id);

ALTER TABLE payment_methods ENABLE ROW LEVEL SECURITY;
CREATE POLICY "payment_methods_select" ON payment_methods FOR SELECT USING (company_id = get_current_company_id());
CREATE POLICY "payment_methods_insert" ON payment_methods FOR INSERT WITH CHECK (company_id = get_current_company_id());
CREATE POLICY "payment_methods_update" ON payment_methods FOR UPDATE
  USING (company_id = get_current_company_id()) WITH CHECK (company_id = get_current_company_id());
CREATE POLICY "payment_methods_delete" ON payment_methods FOR DELETE USING (company_id = get_current_company_id());

-- ===========================================================================
-- TABLE: sales
-- ===========================================================================
CREATE TABLE IF NOT EXISTS sales (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id     uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  customer_id    uuid REFERENCES customers(id) ON DELETE SET NULL,
  user_id        uuid NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  sale_number    text NOT NULL,
  subtotal       numeric(10,2) NOT NULL DEFAULT 0,
  discount       numeric(10,2) NOT NULL DEFAULT 0,
  total          numeric(10,2) NOT NULL DEFAULT 0,
  payment_status text NOT NULL DEFAULT 'pendente',
  status         text NOT NULL DEFAULT 'pendente',
  notes          text,
  created_at     timestamptz NOT NULL DEFAULT NOW(),
  updated_at     timestamptz NOT NULL DEFAULT NOW(),
  CONSTRAINT sales_payment_status_check CHECK (payment_status IN ('pendente','pago','parcial')),
  CONSTRAINT sales_status_check         CHECK (status         IN ('pendente','concluida','cancelada')),
  UNIQUE(company_id, sale_number)
);

CREATE TRIGGER set_updated_at BEFORE UPDATE ON sales
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();
CREATE INDEX idx_sales_company_id  ON sales(company_id);
CREATE INDEX idx_sales_customer    ON sales(company_id, customer_id);
CREATE INDEX idx_sales_created_at  ON sales(company_id, created_at DESC);
CREATE INDEX idx_sales_status      ON sales(company_id, status);

ALTER TABLE sales ENABLE ROW LEVEL SECURITY;
CREATE POLICY "sales_select" ON sales FOR SELECT USING (company_id = get_current_company_id());
CREATE POLICY "sales_insert" ON sales FOR INSERT WITH CHECK (company_id = get_current_company_id());
CREATE POLICY "sales_update" ON sales FOR UPDATE
  USING (company_id = get_current_company_id()) WITH CHECK (company_id = get_current_company_id());
CREATE POLICY "sales_delete" ON sales FOR DELETE USING (company_id = get_current_company_id());

-- ===========================================================================
-- TABLE: sale_items  (append-only)
-- ===========================================================================
CREATE TABLE IF NOT EXISTS sale_items (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  sale_id    uuid NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  quantity   integer NOT NULL,
  unit_price numeric(10,2) NOT NULL,
  cost_price numeric(10,2) NOT NULL DEFAULT 0,
  discount   numeric(10,2) NOT NULL DEFAULT 0,
  total      numeric(10,2) NOT NULL,
  created_at timestamptz NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_sale_items_company_id ON sale_items(company_id);
CREATE INDEX idx_sale_items_sale       ON sale_items(sale_id);

ALTER TABLE sale_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "sale_items_select" ON sale_items FOR SELECT USING (company_id = get_current_company_id());
CREATE POLICY "sale_items_insert" ON sale_items FOR INSERT WITH CHECK (company_id = get_current_company_id());

-- ===========================================================================
-- TABLE: service_order_statuses
-- ===========================================================================
CREATE TABLE IF NOT EXISTS service_order_statuses (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id    uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name          text NOT NULL,
  slug          text NOT NULL,
  color         text NOT NULL DEFAULT '#6366f1',
  display_order integer NOT NULL DEFAULT 0,
  is_default    boolean NOT NULL DEFAULT false,
  is_final      boolean NOT NULL DEFAULT false,
  status        text NOT NULL DEFAULT 'active',
  created_at    timestamptz NOT NULL DEFAULT NOW(),
  updated_at    timestamptz NOT NULL DEFAULT NOW(),
  CONSTRAINT service_order_statuses_status_check CHECK (status IN ('active','inactive')),
  UNIQUE(company_id, slug)
);

CREATE TRIGGER set_updated_at BEFORE UPDATE ON service_order_statuses
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();
CREATE INDEX idx_service_order_statuses_company_id ON service_order_statuses(company_id);

ALTER TABLE service_order_statuses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "service_order_statuses_select" ON service_order_statuses FOR SELECT USING (company_id = get_current_company_id());
CREATE POLICY "service_order_statuses_insert" ON service_order_statuses FOR INSERT WITH CHECK (company_id = get_current_company_id());
CREATE POLICY "service_order_statuses_update" ON service_order_statuses FOR UPDATE
  USING (company_id = get_current_company_id()) WITH CHECK (company_id = get_current_company_id());
CREATE POLICY "service_order_statuses_delete" ON service_order_statuses FOR DELETE USING (company_id = get_current_company_id());

-- ===========================================================================
-- TABLE: service_orders
-- ===========================================================================
CREATE TABLE IF NOT EXISTS service_orders (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id           uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  order_number         text NOT NULL,
  customer_id          uuid NOT NULL REFERENCES customers(id) ON DELETE RESTRICT,
  vehicle_id           uuid REFERENCES vehicles(id) ON DELETE SET NULL,
  technician_id        uuid REFERENCES profiles(id) ON DELETE SET NULL,
  created_by           uuid NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  status_id            uuid REFERENCES service_order_statuses(id) ON DELETE SET NULL,
  priority             text NOT NULL DEFAULT 'normal',
  reported_problem     text NOT NULL,
  technical_diagnosis  text,
  internal_notes       text,
  customer_notes       text,
  labor_total          numeric(10,2) NOT NULL DEFAULT 0,
  parts_total          numeric(10,2) NOT NULL DEFAULT 0,
  discount             numeric(10,2) NOT NULL DEFAULT 0,
  total                numeric(10,2) NOT NULL DEFAULT 0,
  payment_status       text NOT NULL DEFAULT 'pendente',
  warranty_days        integer NOT NULL DEFAULT 0,
  opened_at            timestamptz NOT NULL DEFAULT NOW(),
  expected_delivery_at timestamptz,
  completed_at         timestamptz,
  delivered_at         timestamptz,
  created_at           timestamptz NOT NULL DEFAULT NOW(),
  updated_at           timestamptz NOT NULL DEFAULT NOW(),
  CONSTRAINT service_orders_priority_check       CHECK (priority       IN ('baixa','normal','alta','urgente')),
  CONSTRAINT service_orders_payment_status_check CHECK (payment_status IN ('pendente','pago','parcial')),
  UNIQUE(company_id, order_number)
);

CREATE TRIGGER set_updated_at BEFORE UPDATE ON service_orders
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();
CREATE INDEX idx_service_orders_company_id  ON service_orders(company_id);
CREATE INDEX idx_service_orders_customer    ON service_orders(company_id, customer_id);
CREATE INDEX idx_service_orders_status      ON service_orders(company_id, status_id);
CREATE INDEX idx_service_orders_technician  ON service_orders(company_id, technician_id);
CREATE INDEX idx_service_orders_opened_at   ON service_orders(company_id, opened_at DESC);

ALTER TABLE service_orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "service_orders_select" ON service_orders FOR SELECT USING (company_id = get_current_company_id());
CREATE POLICY "service_orders_insert" ON service_orders FOR INSERT WITH CHECK (company_id = get_current_company_id());
CREATE POLICY "service_orders_update" ON service_orders FOR UPDATE
  USING (company_id = get_current_company_id()) WITH CHECK (company_id = get_current_company_id());
CREATE POLICY "service_orders_delete" ON service_orders FOR DELETE USING (company_id = get_current_company_id());

-- ===========================================================================
-- TABLE: payments
-- ===========================================================================
CREATE TABLE IF NOT EXISTS payments (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id       uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  sale_id          uuid REFERENCES sales(id) ON DELETE CASCADE,
  service_order_id uuid REFERENCES service_orders(id) ON DELETE CASCADE,
  method           text NOT NULL,
  amount           numeric(10,2) NOT NULL,
  installments     integer NOT NULL DEFAULT 1,
  paid_at          timestamptz,
  created_at       timestamptz NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_payments_company_id       ON payments(company_id);
CREATE INDEX idx_payments_sale             ON payments(sale_id);
CREATE INDEX idx_payments_service_order    ON payments(service_order_id);

ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "payments_select" ON payments FOR SELECT USING (company_id = get_current_company_id());
CREATE POLICY "payments_insert" ON payments FOR INSERT WITH CHECK (company_id = get_current_company_id());
CREATE POLICY "payments_update" ON payments FOR UPDATE
  USING (company_id = get_current_company_id()) WITH CHECK (company_id = get_current_company_id());
CREATE POLICY "payments_delete" ON payments FOR DELETE USING (company_id = get_current_company_id());

-- ===========================================================================
-- TABLE: service_order_items
-- ===========================================================================
CREATE TABLE IF NOT EXISTS service_order_items (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id       uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  service_order_id uuid NOT NULL REFERENCES service_orders(id) ON DELETE CASCADE,
  product_id       uuid REFERENCES products(id) ON DELETE SET NULL,
  item_type        text NOT NULL DEFAULT 'part',
  description      text NOT NULL,
  quantity         numeric(10,3) NOT NULL DEFAULT 1,
  unit_price       numeric(10,2) NOT NULL,
  cost_price       numeric(10,2) NOT NULL DEFAULT 0,
  total            numeric(10,2) NOT NULL,
  created_at       timestamptz NOT NULL DEFAULT NOW(),
  CONSTRAINT service_order_items_type_check CHECK (item_type IN ('part','service','labor'))
);

CREATE INDEX idx_service_order_items_company_id ON service_order_items(company_id);
CREATE INDEX idx_service_order_items_order      ON service_order_items(service_order_id);

ALTER TABLE service_order_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "service_order_items_select" ON service_order_items FOR SELECT USING (company_id = get_current_company_id());
CREATE POLICY "service_order_items_insert" ON service_order_items FOR INSERT WITH CHECK (company_id = get_current_company_id());
CREATE POLICY "service_order_items_update" ON service_order_items FOR UPDATE
  USING (company_id = get_current_company_id()) WITH CHECK (company_id = get_current_company_id());
CREATE POLICY "service_order_items_delete" ON service_order_items FOR DELETE USING (company_id = get_current_company_id());

-- ===========================================================================
-- TABLE: checklist_templates
-- ===========================================================================
CREATE TABLE IF NOT EXISTS checklist_templates (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id  uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name        text NOT NULL,
  description text,
  is_default  boolean NOT NULL DEFAULT false,
  status      text NOT NULL DEFAULT 'active',
  created_at  timestamptz NOT NULL DEFAULT NOW(),
  updated_at  timestamptz NOT NULL DEFAULT NOW(),
  CONSTRAINT checklist_templates_status_check CHECK (status IN ('active','inactive'))
);

CREATE TRIGGER set_updated_at BEFORE UPDATE ON checklist_templates
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();
CREATE INDEX idx_checklist_templates_company_id ON checklist_templates(company_id);

ALTER TABLE checklist_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "checklist_templates_select" ON checklist_templates FOR SELECT USING (company_id = get_current_company_id());
CREATE POLICY "checklist_templates_insert" ON checklist_templates FOR INSERT WITH CHECK (company_id = get_current_company_id());
CREATE POLICY "checklist_templates_update" ON checklist_templates FOR UPDATE
  USING (company_id = get_current_company_id()) WITH CHECK (company_id = get_current_company_id());
CREATE POLICY "checklist_templates_delete" ON checklist_templates FOR DELETE USING (company_id = get_current_company_id());

-- ===========================================================================
-- TABLE: checklist_template_items
-- ===========================================================================
CREATE TABLE IF NOT EXISTS checklist_template_items (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id    uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  template_id   uuid NOT NULL REFERENCES checklist_templates(id) ON DELETE CASCADE,
  label         text NOT NULL,
  input_type    text NOT NULL DEFAULT 'yes_no_na',
  required      boolean NOT NULL DEFAULT false,
  display_order integer NOT NULL DEFAULT 0,
  options       jsonb,
  status        text NOT NULL DEFAULT 'active',
  created_at    timestamptz NOT NULL DEFAULT NOW(),
  updated_at    timestamptz NOT NULL DEFAULT NOW(),
  CONSTRAINT checklist_template_items_input_type_check CHECK (input_type IN ('yes_no_na','text','number','checkbox','select')),
  CONSTRAINT checklist_template_items_status_check     CHECK (status     IN ('active','inactive'))
);

CREATE TRIGGER set_updated_at BEFORE UPDATE ON checklist_template_items
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();
CREATE INDEX idx_checklist_template_items_company_id ON checklist_template_items(company_id);
CREATE INDEX idx_checklist_template_items_template   ON checklist_template_items(template_id);

ALTER TABLE checklist_template_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "checklist_template_items_select" ON checklist_template_items FOR SELECT USING (company_id = get_current_company_id());
CREATE POLICY "checklist_template_items_insert" ON checklist_template_items FOR INSERT WITH CHECK (company_id = get_current_company_id());
CREATE POLICY "checklist_template_items_update" ON checklist_template_items FOR UPDATE
  USING (company_id = get_current_company_id()) WITH CHECK (company_id = get_current_company_id());
CREATE POLICY "checklist_template_items_delete" ON checklist_template_items FOR DELETE USING (company_id = get_current_company_id());

-- ===========================================================================
-- TABLE: service_order_checklists  (values saved per-OS; updatable for corrections)
-- ===========================================================================
CREATE TABLE IF NOT EXISTS service_order_checklists (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id       uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  service_order_id uuid NOT NULL REFERENCES service_orders(id) ON DELETE CASCADE,
  template_item_id uuid REFERENCES checklist_template_items(id) ON DELETE SET NULL,
  item_key         text NOT NULL,
  label            text NOT NULL,
  value            text,
  notes            text,
  created_at       timestamptz NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_service_order_checklists_company_id ON service_order_checklists(company_id);
CREATE INDEX idx_service_order_checklists_order      ON service_order_checklists(service_order_id);

ALTER TABLE service_order_checklists ENABLE ROW LEVEL SECURITY;
CREATE POLICY "service_order_checklists_select" ON service_order_checklists FOR SELECT USING (company_id = get_current_company_id());
CREATE POLICY "service_order_checklists_insert" ON service_order_checklists FOR INSERT WITH CHECK (company_id = get_current_company_id());
CREATE POLICY "service_order_checklists_update" ON service_order_checklists FOR UPDATE
  USING (company_id = get_current_company_id()) WITH CHECK (company_id = get_current_company_id());

-- ===========================================================================
-- TABLE: service_order_photos
-- ===========================================================================
CREATE TABLE IF NOT EXISTS service_order_photos (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id       uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  service_order_id uuid NOT NULL REFERENCES service_orders(id) ON DELETE CASCADE,
  file_url         text NOT NULL,
  description      text,
  created_by       uuid NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  created_at       timestamptz NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_service_order_photos_company_id ON service_order_photos(company_id);
CREATE INDEX idx_service_order_photos_order      ON service_order_photos(service_order_id);

ALTER TABLE service_order_photos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "service_order_photos_select" ON service_order_photos FOR SELECT USING (company_id = get_current_company_id());
CREATE POLICY "service_order_photos_insert" ON service_order_photos FOR INSERT WITH CHECK (company_id = get_current_company_id());
CREATE POLICY "service_order_photos_delete" ON service_order_photos FOR DELETE USING (company_id = get_current_company_id());

-- ===========================================================================
-- TABLE: quotes
-- ===========================================================================
CREATE TABLE IF NOT EXISTS quotes (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id       uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  quote_number     text NOT NULL,
  customer_id      uuid NOT NULL REFERENCES customers(id) ON DELETE RESTRICT,
  service_order_id uuid REFERENCES service_orders(id) ON DELETE SET NULL,
  status           text NOT NULL DEFAULT 'pendente',
  subtotal         numeric(10,2) NOT NULL DEFAULT 0,
  discount         numeric(10,2) NOT NULL DEFAULT 0,
  total            numeric(10,2) NOT NULL DEFAULT 0,
  valid_until      date,
  notes            text,
  created_at       timestamptz NOT NULL DEFAULT NOW(),
  approved_at      timestamptz,
  rejected_at      timestamptz,
  CONSTRAINT quotes_status_check CHECK (status IN ('pendente','aprovado','rejeitado','expirado')),
  UNIQUE(company_id, quote_number)
);

CREATE INDEX idx_quotes_company_id ON quotes(company_id);
CREATE INDEX idx_quotes_customer   ON quotes(company_id, customer_id);
CREATE INDEX idx_quotes_status     ON quotes(company_id, status);

ALTER TABLE quotes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "quotes_select" ON quotes FOR SELECT USING (company_id = get_current_company_id());
CREATE POLICY "quotes_insert" ON quotes FOR INSERT WITH CHECK (company_id = get_current_company_id());
CREATE POLICY "quotes_update" ON quotes FOR UPDATE
  USING (company_id = get_current_company_id()) WITH CHECK (company_id = get_current_company_id());
CREATE POLICY "quotes_delete" ON quotes FOR DELETE USING (company_id = get_current_company_id());

-- ===========================================================================
-- TABLE: quote_items  (append-only)
-- ===========================================================================
CREATE TABLE IF NOT EXISTS quote_items (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id  uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  quote_id    uuid NOT NULL REFERENCES quotes(id) ON DELETE CASCADE,
  product_id  uuid REFERENCES products(id) ON DELETE SET NULL,
  item_type   text NOT NULL DEFAULT 'part',
  description text NOT NULL,
  quantity    numeric(10,3) NOT NULL DEFAULT 1,
  unit_price  numeric(10,2) NOT NULL,
  total       numeric(10,2) NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT NOW(),
  CONSTRAINT quote_items_type_check CHECK (item_type IN ('part','service','labor'))
);

CREATE INDEX idx_quote_items_company_id ON quote_items(company_id);
CREATE INDEX idx_quote_items_quote      ON quote_items(quote_id);

ALTER TABLE quote_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "quote_items_select" ON quote_items FOR SELECT USING (company_id = get_current_company_id());
CREATE POLICY "quote_items_insert" ON quote_items FOR INSERT WITH CHECK (company_id = get_current_company_id());

-- ===========================================================================
-- TABLE: warranties
-- ===========================================================================
CREATE TABLE IF NOT EXISTS warranties (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id       uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  customer_id      uuid NOT NULL REFERENCES customers(id) ON DELETE RESTRICT,
  product_id       uuid REFERENCES products(id) ON DELETE SET NULL,
  vehicle_id       uuid REFERENCES vehicles(id) ON DELETE SET NULL,
  service_order_id uuid REFERENCES service_orders(id) ON DELETE SET NULL,
  warranty_type    text NOT NULL,
  start_date       date NOT NULL,
  end_date         date NOT NULL,
  status           text NOT NULL DEFAULT 'active',
  notes            text,
  created_at       timestamptz NOT NULL DEFAULT NOW(),
  CONSTRAINT warranties_type_check   CHECK (warranty_type IN ('produto','servico','bateria','carregador','scooter')),
  CONSTRAINT warranties_status_check CHECK (status        IN ('active','expired','claimed'))
);

CREATE INDEX idx_warranties_company_id ON warranties(company_id);
CREATE INDEX idx_warranties_customer   ON warranties(company_id, customer_id);
CREATE INDEX idx_warranties_end_date   ON warranties(company_id, end_date);

ALTER TABLE warranties ENABLE ROW LEVEL SECURITY;
CREATE POLICY "warranties_select" ON warranties FOR SELECT USING (company_id = get_current_company_id());
CREATE POLICY "warranties_insert" ON warranties FOR INSERT WITH CHECK (company_id = get_current_company_id());
CREATE POLICY "warranties_update" ON warranties FOR UPDATE
  USING (company_id = get_current_company_id()) WITH CHECK (company_id = get_current_company_id());
CREATE POLICY "warranties_delete" ON warranties FOR DELETE USING (company_id = get_current_company_id());

-- ===========================================================================
-- TABLE: warranty_rules
-- ===========================================================================
CREATE TABLE IF NOT EXISTS warranty_rules (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id    uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name          text NOT NULL,
  warranty_type text NOT NULL,
  duration_days integer NOT NULL DEFAULT 30,
  description   text,
  status        text NOT NULL DEFAULT 'active',
  created_at    timestamptz NOT NULL DEFAULT NOW(),
  updated_at    timestamptz NOT NULL DEFAULT NOW(),
  CONSTRAINT warranty_rules_type_check   CHECK (warranty_type IN ('produto','servico','bateria','carregador','scooter')),
  CONSTRAINT warranty_rules_status_check CHECK (status        IN ('active','inactive'))
);

CREATE TRIGGER set_updated_at BEFORE UPDATE ON warranty_rules
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();
CREATE INDEX idx_warranty_rules_company_id ON warranty_rules(company_id);

ALTER TABLE warranty_rules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "warranty_rules_select" ON warranty_rules FOR SELECT USING (company_id = get_current_company_id());
CREATE POLICY "warranty_rules_insert" ON warranty_rules FOR INSERT WITH CHECK (company_id = get_current_company_id());
CREATE POLICY "warranty_rules_update" ON warranty_rules FOR UPDATE
  USING (company_id = get_current_company_id()) WITH CHECK (company_id = get_current_company_id());
CREATE POLICY "warranty_rules_delete" ON warranty_rules FOR DELETE USING (company_id = get_current_company_id());

-- ===========================================================================
-- TABLE: services
-- ===========================================================================
CREATE TABLE IF NOT EXISTS services (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id        uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name              text NOT NULL,
  description       text,
  default_price     numeric(10,2) NOT NULL DEFAULT 0,
  estimated_minutes integer NOT NULL DEFAULT 60,
  warranty_days     integer NOT NULL DEFAULT 30,
  status            text NOT NULL DEFAULT 'active',
  created_at        timestamptz NOT NULL DEFAULT NOW(),
  updated_at        timestamptz NOT NULL DEFAULT NOW(),
  CONSTRAINT services_status_check CHECK (status IN ('active','inactive'))
);

CREATE TRIGGER set_updated_at BEFORE UPDATE ON services
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();
CREATE INDEX idx_services_company_id ON services(company_id);

ALTER TABLE services ENABLE ROW LEVEL SECURITY;
CREATE POLICY "services_select" ON services FOR SELECT USING (company_id = get_current_company_id());
CREATE POLICY "services_insert" ON services FOR INSERT WITH CHECK (company_id = get_current_company_id());
CREATE POLICY "services_update" ON services FOR UPDATE
  USING (company_id = get_current_company_id()) WITH CHECK (company_id = get_current_company_id());
CREATE POLICY "services_delete" ON services FOR DELETE USING (company_id = get_current_company_id());

-- ===========================================================================
-- TABLE: financial_categories
-- ===========================================================================
CREATE TABLE IF NOT EXISTS financial_categories (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name       text NOT NULL,
  type       text NOT NULL,
  status     text NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT NOW(),
  updated_at timestamptz NOT NULL DEFAULT NOW(),
  CONSTRAINT financial_categories_type_check   CHECK (type   IN ('entrada','saida')),
  CONSTRAINT financial_categories_status_check CHECK (status IN ('active','inactive'))
);

CREATE TRIGGER set_updated_at BEFORE UPDATE ON financial_categories
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();
CREATE INDEX idx_financial_categories_company_id ON financial_categories(company_id);

ALTER TABLE financial_categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "financial_categories_select" ON financial_categories FOR SELECT USING (company_id = get_current_company_id());
CREATE POLICY "financial_categories_insert" ON financial_categories FOR INSERT WITH CHECK (company_id = get_current_company_id());
CREATE POLICY "financial_categories_update" ON financial_categories FOR UPDATE
  USING (company_id = get_current_company_id()) WITH CHECK (company_id = get_current_company_id());
CREATE POLICY "financial_categories_delete" ON financial_categories FOR DELETE USING (company_id = get_current_company_id());

-- ===========================================================================
-- TABLE: financial_transactions  (append-only)
-- ===========================================================================
CREATE TABLE IF NOT EXISTS financial_transactions (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id       uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  type             text NOT NULL,
  category_id      uuid REFERENCES financial_categories(id) ON DELETE SET NULL,
  description      text NOT NULL,
  amount           numeric(10,2) NOT NULL,
  payment_method   text,
  reference_type   text,
  reference_id     uuid,
  transaction_date date NOT NULL DEFAULT CURRENT_DATE,
  created_by       uuid NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  created_at       timestamptz NOT NULL DEFAULT NOW(),
  CONSTRAINT financial_transactions_type_check CHECK (type IN ('entrada','saida'))
);

CREATE INDEX idx_financial_transactions_company_id ON financial_transactions(company_id);
CREATE INDEX idx_financial_transactions_date       ON financial_transactions(company_id, transaction_date DESC);
CREATE INDEX idx_financial_transactions_type       ON financial_transactions(company_id, type);

ALTER TABLE financial_transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "financial_transactions_select" ON financial_transactions FOR SELECT USING (company_id = get_current_company_id());
CREATE POLICY "financial_transactions_insert" ON financial_transactions FOR INSERT WITH CHECK (company_id = get_current_company_id());

-- ===========================================================================
-- TABLE: message_templates
-- ===========================================================================
CREATE TABLE IF NOT EXISTS message_templates (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id  uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name        text NOT NULL,
  trigger_key text NOT NULL,
  content     text NOT NULL,
  status      text NOT NULL DEFAULT 'active',
  created_at  timestamptz NOT NULL DEFAULT NOW(),
  updated_at  timestamptz NOT NULL DEFAULT NOW(),
  CONSTRAINT message_templates_status_check CHECK (status IN ('active','inactive')),
  UNIQUE(company_id, trigger_key)
);

CREATE TRIGGER set_updated_at BEFORE UPDATE ON message_templates
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();
CREATE INDEX idx_message_templates_company_id ON message_templates(company_id);

ALTER TABLE message_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "message_templates_select" ON message_templates FOR SELECT USING (company_id = get_current_company_id());
CREATE POLICY "message_templates_insert" ON message_templates FOR INSERT WITH CHECK (company_id = get_current_company_id());
CREATE POLICY "message_templates_update" ON message_templates FOR UPDATE
  USING (company_id = get_current_company_id()) WITH CHECK (company_id = get_current_company_id());
CREATE POLICY "message_templates_delete" ON message_templates FOR DELETE USING (company_id = get_current_company_id());

-- ===========================================================================
-- TABLE: activity_logs  (append-only)
-- ===========================================================================
CREATE TABLE IF NOT EXISTS activity_logs (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id  uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  user_id     uuid NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  action      text NOT NULL,
  entity_type text NOT NULL,
  entity_id   uuid,
  metadata    jsonb,
  created_at  timestamptz NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_activity_logs_company_id ON activity_logs(company_id);
CREATE INDEX idx_activity_logs_user       ON activity_logs(company_id, user_id);
CREATE INDEX idx_activity_logs_entity     ON activity_logs(company_id, entity_type, entity_id);
CREATE INDEX idx_activity_logs_created_at ON activity_logs(company_id, created_at DESC);

ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "activity_logs_select" ON activity_logs FOR SELECT USING (company_id = get_current_company_id());
CREATE POLICY "activity_logs_insert" ON activity_logs FOR INSERT WITH CHECK (company_id = get_current_company_id());

-- ===========================================================================
-- FUNCTION: setup_company_defaults(company_id)
-- Called during onboarding to seed default data for a new company
-- ===========================================================================
CREATE OR REPLACE FUNCTION setup_company_defaults(p_company_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_template_id uuid;
BEGIN
  INSERT INTO company_settings (company_id)
    VALUES (p_company_id) ON CONFLICT (company_id) DO NOTHING;

  INSERT INTO company_theme_settings (company_id, theme_mode)
    VALUES (p_company_id, 'light') ON CONFLICT (company_id) DO NOTHING;

  INSERT INTO service_order_statuses (company_id, name, slug, color, display_order, is_default, is_final) VALUES
    (p_company_id, 'Aberta',                  'aberta',                 '#6366f1', 1, true,  false),
    (p_company_id, 'Aguardando Diagnóstico',   'aguardando-diagnostico', '#f59e0b', 2, false, false),
    (p_company_id, 'Aguardando Aprovação',     'aguardando-aprovacao',   '#f97316', 3, false, false),
    (p_company_id, 'Aprovada',                 'aprovada',               '#3b82f6', 4, false, false),
    (p_company_id, 'Em Manutenção',            'em-manutencao',          '#8b5cf6', 5, false, false),
    (p_company_id, 'Aguardando Peça',          'aguardando-peca',        '#ef4444', 6, false, false),
    (p_company_id, 'Concluída',                'concluida',              '#10b981', 7, false, false),
    (p_company_id, 'Entregue',                 'entregue',               '#059669', 8, false, true),
    (p_company_id, 'Cancelada',                'cancelada',              '#64748b', 9, false, true)
  ON CONFLICT (company_id, slug) DO NOTHING;

  INSERT INTO checklist_templates (company_id, name, is_default)
    VALUES (p_company_id, 'Checklist Padrão', true)
    RETURNING id INTO v_template_id;

  INSERT INTO checklist_template_items (company_id, template_id, label, input_type, required, display_order) VALUES
    (p_company_id, v_template_id, 'Scooter liga?',            'yes_no_na', true,  1),
    (p_company_id, v_template_id, 'Painel funciona?',         'yes_no_na', true,  2),
    (p_company_id, v_template_id, 'Bateria carrega?',         'yes_no_na', true,  3),
    (p_company_id, v_template_id, 'Carregador foi entregue?', 'yes_no_na', false, 4),
    (p_company_id, v_template_id, 'Cliente deixou chave?',    'yes_no_na', false, 5),
    (p_company_id, v_template_id, 'Freio dianteiro funciona?','yes_no_na', true,  6),
    (p_company_id, v_template_id, 'Freio traseiro funciona?', 'yes_no_na', true,  7),
    (p_company_id, v_template_id, 'Pneu dianteiro está bom?', 'yes_no_na', false, 8),
    (p_company_id, v_template_id, 'Pneu traseiro está bom?',  'yes_no_na', false, 9),
    (p_company_id, v_template_id, 'Possui riscos?',           'yes_no_na', false, 10),
    (p_company_id, v_template_id, 'Possui amassados?',        'yes_no_na', false, 11),
    (p_company_id, v_template_id, 'Possui peças quebradas?',  'yes_no_na', false, 12),
    (p_company_id, v_template_id, 'Possui barulho estranho?', 'yes_no_na', false, 13),
    (p_company_id, v_template_id, 'Acelerador funciona?',     'yes_no_na', true,  14),
    (p_company_id, v_template_id, 'Luzes funcionam?',         'yes_no_na', false, 15),
    (p_company_id, v_template_id, 'Buzina funciona?',         'yes_no_na', false, 16),
    (p_company_id, v_template_id, 'Fotos anexadas?',          'yes_no_na', false, 17);

  INSERT INTO payment_methods (company_id, name, type, active) VALUES
    (p_company_id, 'Dinheiro',          'cash',         true),
    (p_company_id, 'Pix',               'pix',          true),
    (p_company_id, 'Cartão de Débito',  'debit_card',   true),
    (p_company_id, 'Cartão de Crédito', 'credit_card',  true),
    (p_company_id, 'Link de Pagamento', 'payment_link', true),
    (p_company_id, 'Boleto',            'bank_slip',    false);

  INSERT INTO financial_categories (company_id, name, type) VALUES
    (p_company_id, 'Aluguel',          'saida'),
    (p_company_id, 'Energia',          'saida'),
    (p_company_id, 'Internet',         'saida'),
    (p_company_id, 'Funcionários',     'saida'),
    (p_company_id, 'Fornecedor',       'saida'),
    (p_company_id, 'Compra de Estoque','saida'),
    (p_company_id, 'Marketing',        'saida'),
    (p_company_id, 'Ferramentas',      'saida'),
    (p_company_id, 'Manutenção',       'saida'),
    (p_company_id, 'Outros Gastos',    'saida'),
    (p_company_id, 'Venda de Produto', 'entrada'),
    (p_company_id, 'Serviço de Oficina','entrada'),
    (p_company_id, 'Venda de Scooter', 'entrada'),
    (p_company_id, 'Garantia',         'entrada'),
    (p_company_id, 'Outras Receitas',  'entrada');

  INSERT INTO warranty_rules (company_id, name, warranty_type, duration_days) VALUES
    (p_company_id, 'Serviço',      'servico',    30),
    (p_company_id, 'Peça',         'produto',    90),
    (p_company_id, 'Bateria',      'bateria',   180),
    (p_company_id, 'Scooter Nova', 'scooter',   365),
    (p_company_id, 'Carregador',   'carregador',  90);

  INSERT INTO services (company_id, name, description, default_price, estimated_minutes, warranty_days) VALUES
    (p_company_id, 'Troca de Pneu',        'Troca de pneu dianteiro ou traseiro',    50,  30, 30),
    (p_company_id, 'Troca de Bateria',     'Substituição da bateria principal',       80,  45, 90),
    (p_company_id, 'Troca de Controladora','Substituição da controladora elétrica',  120,  60, 90),
    (p_company_id, 'Revisão Geral',        'Revisão completa da scooter elétrica',   150,  90, 30),
    (p_company_id, 'Ajuste de Freio',      'Ajuste e regulagem dos freios',           30,  20, 30),
    (p_company_id, 'Troca de Acelerador',  'Substituição do manete acelerador',       60,  30, 60),
    (p_company_id, 'Diagnóstico Elétrico', 'Diagnóstico do sistema elétrico',         50,  60,  0),
    (p_company_id, 'Troca de Carregador',  'Substituição do carregador',              40,  15, 90),
    (p_company_id, 'Manutenção Preventiva','Manutenção preventiva completa',          100, 60, 30);

  INSERT INTO message_templates (company_id, name, trigger_key, content) VALUES
    (p_company_id, 'OS Aberta', 'os_aberta',
      'Olá, {{cliente}}! Sua ordem de serviço nº {{numero_os}} foi aberta com sucesso.' || E'\n\n' ||
      'Equipamento: {{modelo}}' || E'\n' || 'Status: Aguardando diagnóstico.' || E'\n\n' ||
      'Atenciosamente,' || E'\n' || '{{nome_loja}}'),
    (p_company_id, 'Orçamento Pronto', 'orcamento_pronto',
      'Olá, {{cliente}}! O orçamento da sua scooter ficou pronto.' || E'\n\n' ||
      'OS: {{numero_os}}' || E'\n' || 'Valor total: R$ {{valor}}' || E'\n\n' ||
      'Podemos seguir com o serviço?'),
    (p_company_id, 'OS em Manutenção', 'os_manutencao',
      'Olá, {{cliente}}! Informamos que sua scooter já está em manutenção.' || E'\n\n' ||
      'OS: {{numero_os}}' || E'\n' || 'Previsão de entrega: {{data_previsao}}' || E'\n\n' ||
      'Atenciosamente,' || E'\n' || '{{nome_loja}}'),
    (p_company_id, 'OS Concluída', 'os_concluida',
      'Olá, {{cliente}}! Sua scooter está pronta para retirada.' || E'\n\n' ||
      'OS: {{numero_os}}' || E'\n' || 'Valor total: R$ {{valor}}' || E'\n\n' ||
      'Atenciosamente,' || E'\n' || '{{nome_loja}}'),
    (p_company_id, 'Aguardando Peça', 'os_aguardando_peca',
      'Olá, {{cliente}}! Informamos que sua OS {{numero_os}} está aguardando a chegada de uma peça.' || E'\n\n' ||
      'Atenciosamente,' || E'\n' || '{{nome_loja}}'),
    (p_company_id, 'Agradecimento após Compra', 'agradecimento_compra',
      'Olá, {{cliente}}! Obrigado pela sua compra na {{nome_loja}}! Qualquer dúvida, estamos à disposição.' ||
      E'\n\n' || '{{telefone_loja}}')
  ON CONFLICT (company_id, trigger_key) DO NOTHING;

  INSERT INTO product_categories (company_id, name, type, display_order) VALUES
    (p_company_id, 'Scooter Elétrica', 'product', 1),
    (p_company_id, 'Bateria',          'product', 2),
    (p_company_id, 'Carregador',       'product', 3),
    (p_company_id, 'Pneu/Câmara',      'product', 4),
    (p_company_id, 'Capacete',         'product', 5),
    (p_company_id, 'Peças',            'product', 6),
    (p_company_id, 'Acessórios',       'product', 7),
    (p_company_id, 'Serviços',         'service', 8);
END;
$$;

-- ===========================================================================
-- Storage buckets (run in Supabase Dashboard > Storage, or via CLI)
-- ===========================================================================
-- bucket: company-logos  | public  | max 2MB  | image/*
-- bucket: product-images | public  | max 5MB  | image/*
-- bucket: os-photos      | private | max 10MB | image/*
