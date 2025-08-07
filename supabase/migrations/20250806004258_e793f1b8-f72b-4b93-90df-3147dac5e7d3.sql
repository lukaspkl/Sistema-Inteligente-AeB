-- Add valor_unitario to produtos table for cost calculation
ALTER TABLE produtos ADD COLUMN valor_unitario NUMERIC DEFAULT 0;

-- Add valor_perda and observacoes to perdas table
ALTER TABLE perdas ADD COLUMN valor_perda NUMERIC DEFAULT 0;
ALTER TABLE perdas ADD COLUMN observacoes TEXT;

-- Update existing perdas records to have valor_perda based on produtos
UPDATE perdas 
SET valor_perda = (
  SELECT COALESCE(produtos.valor_unitario, 0) * perdas.quantidade 
  FROM produtos 
  WHERE produtos.id = perdas.id_produto
);

-- Create index for better performance on perdas queries
CREATE INDEX IF NOT EXISTS idx_perdas_data_perda ON perdas(data_perda);
CREATE INDEX IF NOT EXISTS idx_perdas_produto ON perdas(id_produto);

-- Enable RLS on perdas table
ALTER TABLE perdas ENABLE ROW LEVEL SECURITY;

-- Create policy for perdas table
CREATE POLICY "Allow all operations on perdas" 
ON perdas 
FOR ALL 
USING (true) 
WITH CHECK (true);