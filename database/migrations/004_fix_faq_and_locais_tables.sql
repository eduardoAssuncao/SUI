-- Verifica se a tabela faq existe e a renomeia para faqs
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'faq') THEN
        ALTER TABLE faq RENAME TO faqs;
        -- Corrige a referência à sequência
        IF EXISTS (SELECT 1 FROM information_schema.sequences WHERE sequence_name = 'faq_id_seq') THEN
            ALTER SEQUENCE faq_id_seq RENAME TO faqs_id_seq;
        END IF;
    END IF;
END $$;

-- Remove a coluna servico_id da tabela locais_atendimento se existir
ALTER TABLE locais_atendimento DROP COLUMN IF EXISTS servico_id;

-- Adiciona a coluna servico_id à tabela faqs
ALTER TABLE faqs ADD COLUMN IF NOT EXISTS servico_id INTEGER REFERENCES servicos(id) ON DELETE CASCADE;

-- Cria índice para melhorar a performance das consultas
CREATE INDEX IF NOT EXISTS idx_faqs_servico_id ON faqs(servico_id);

-- Atualiza a tabela de relacionamento para usar os nomes corretos
ALTER TABLE servico_locais RENAME COLUMN local_id TO local_atendimento_id;

-- Adiciona índices para melhorar a performance
CREATE INDEX IF NOT EXISTS idx_servico_locais_servico_id ON servico_locais(servico_id);
CREATE INDEX IF NOT EXISTS idx_servico_locais_local_id ON servico_locais(local_atendimento_id);
