-- Adiciona a coluna link_agendamento à tabela servicos
ALTER TABLE servicos
    ADD COLUMN IF NOT EXISTS link_agendamento TEXT;
