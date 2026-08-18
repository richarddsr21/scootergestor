-- supabase/migrations/20260817000001_add_support_chat.sql

CREATE TABLE support_conversations (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id            uuid NOT NULL UNIQUE REFERENCES companies(id) ON DELETE CASCADE,
  company_last_read_at  timestamptz NOT NULL DEFAULT now(),
  admin_last_read_at    timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE support_messages (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id   uuid NOT NULL REFERENCES support_conversations(id) ON DELETE CASCADE,
  sender_type       text NOT NULL CHECK (sender_type IN ('company', 'admin')),
  sender_profile_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  body              text NOT NULL CHECK (char_length(trim(body)) > 0),
  created_at        timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_support_messages_conversation ON support_messages(conversation_id, created_at);
CREATE INDEX idx_support_conversations_updated ON support_conversations(updated_at DESC);

CREATE OR REPLACE FUNCTION support_touch_conversation()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  UPDATE support_conversations SET updated_at = now() WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$;

CREATE TRIGGER support_messages_touch_conversation
AFTER INSERT ON support_messages
FOR EACH ROW EXECUTE FUNCTION support_touch_conversation();

ALTER TABLE support_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_messages      ENABLE ROW LEVEL SECURITY;

CREATE POLICY support_conversations_select ON support_conversations FOR SELECT
  USING (company_id = get_current_company_id() OR is_saas_admin());

CREATE POLICY support_conversations_insert ON support_conversations FOR INSERT
  WITH CHECK (company_id = get_current_company_id() OR is_saas_admin());

CREATE POLICY support_conversations_update ON support_conversations FOR UPDATE
  USING (company_id = get_current_company_id() OR is_saas_admin())
  WITH CHECK (company_id = get_current_company_id() OR is_saas_admin());

CREATE POLICY support_messages_select ON support_messages FOR SELECT
  USING (
    is_saas_admin()
    OR conversation_id IN (SELECT id FROM support_conversations WHERE company_id = get_current_company_id())
  );

CREATE POLICY support_messages_insert_company ON support_messages FOR INSERT
  WITH CHECK (
    sender_type = 'company'
    AND conversation_id IN (SELECT id FROM support_conversations WHERE company_id = get_current_company_id())
  );

CREATE POLICY support_messages_insert_admin ON support_messages FOR INSERT
  WITH CHECK (sender_type = 'admin' AND is_saas_admin());

ALTER PUBLICATION supabase_realtime ADD TABLE support_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE support_conversations;
