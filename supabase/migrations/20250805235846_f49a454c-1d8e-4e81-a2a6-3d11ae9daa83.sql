-- Corrigir constraint de tipo_movimentacao para permitir todos os tipos usados pelo sistema
ALTER TABLE public.estoque_movimentacoes 
DROP CONSTRAINT estoque_movimentacoes_tipo_movimentacao_check;

-- Adicionar nova constraint com todos os tipos de movimentação necessários
ALTER TABLE public.estoque_movimentacoes 
ADD CONSTRAINT estoque_movimentacoes_tipo_movimentacao_check 
CHECK (tipo_movimentacao = ANY (ARRAY[
  'entrada'::text, 
  'saida'::text, 
  'ajuste'::text,
  'entrada_manual'::text,
  'entrada_inicial'::text,
  'entrada_nota'::text,
  'saida_manual'::text,
  'perda'::text
]));