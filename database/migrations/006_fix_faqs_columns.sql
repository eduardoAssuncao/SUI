-- Adiciona valor padrão para a coluna ativo na tabela faqs
ALTER TABLE faqs 
ALTER COLUMN ativo SET DEFAULT true;

-- Atualiza registros existentes para definir ativo como true se for NULL
UPDATE faqs SET ativo = true WHERE ativo IS NULL;
