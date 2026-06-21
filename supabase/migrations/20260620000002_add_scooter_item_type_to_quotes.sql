ALTER TABLE quote_items
  DROP CONSTRAINT IF EXISTS quote_items_type_check,
  ADD CONSTRAINT quote_items_type_check
    CHECK (item_type IN ('scooter','part','service','labor'));
