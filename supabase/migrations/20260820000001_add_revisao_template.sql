-- =============================================================================
-- Adiciona o trigger de template 'lembrete_revisao' (lembrete automático de
-- revisão via WhatsApp), tanto pro seed de empresas novas quanto pras já
-- existentes.
-- =============================================================================

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
      E'\n\n' || '{{telefone_loja}}'),
    (p_company_id, 'Lembrete de Revisão', 'lembrete_revisao',
      'Olá, {{cliente}}! Faz um tempo desde sua última revisão na {{nome_loja}} 🛵' || E'\n\n' ||
      'Que tal agendar uma manutenção preventiva pra deixar sua scooter em dia?' || E'\n\n' ||
      'Qualquer dúvida, é só chamar!' || E'\n' || '{{telefone_loja}}')
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

-- Backfill: cria a linha 'lembrete_revisao' pras empresas que já existem
-- (o seed acima só roda pra empresa nova, via setup_company_defaults).
INSERT INTO message_templates (company_id, name, trigger_key, content)
SELECT
  c.id,
  'Lembrete de Revisão',
  'lembrete_revisao',
  'Olá, {{cliente}}! Faz um tempo desde sua última revisão na {{nome_loja}} 🛵' || E'\n\n' ||
  'Que tal agendar uma manutenção preventiva pra deixar sua scooter em dia?' || E'\n\n' ||
  'Qualquer dúvida, é só chamar!' || E'\n' || '{{telefone_loja}}'
FROM companies c
ON CONFLICT (company_id, trigger_key) DO NOTHING;
