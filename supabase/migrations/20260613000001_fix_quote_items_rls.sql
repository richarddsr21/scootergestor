-- quote_items estava sem policies de UPDATE e DELETE — DELETE silenciosamente bloqueado pelo RLS
CREATE POLICY "quote_items_update" ON quote_items FOR UPDATE
  USING (company_id = get_current_company_id())
  WITH CHECK (company_id = get_current_company_id());

CREATE POLICY "quote_items_delete" ON quote_items FOR DELETE
  USING (company_id = get_current_company_id());
