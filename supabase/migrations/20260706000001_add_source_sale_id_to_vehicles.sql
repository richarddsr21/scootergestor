-- Rastreia qual venda originou um veículo criado automaticamente
-- (compra de scooter com cliente vinculado), para permitir limpeza
-- completa ao excluir a venda.
ALTER TABLE vehicles
  ADD COLUMN IF NOT EXISTS source_sale_id uuid REFERENCES sales(id) ON DELETE SET NULL;
