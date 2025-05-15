-- Adiciona a coluna cep à tabela locais_atendimento
ALTER TABLE locais_atendimento 
ADD COLUMN IF NOT EXISTS cep VARCHAR(10);

-- Comentário para documentação
COMMENT ON COLUMN locais_atendimento.cep IS 'CEP do local de atendimento (formato: 00000-000)';
