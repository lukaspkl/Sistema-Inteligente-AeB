-- Habilitar RLS em todas as tabelas e criar políticas básicas para permitir acesso público
-- Para um sistema interno de hotel, vamos permitir acesso total por enquanto

-- Tabela produtos
ALTER TABLE public.produtos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all operations on produtos" ON public.produtos FOR ALL USING (true) WITH CHECK (true);

-- Tabela estoque_movimentacoes  
ALTER TABLE public.estoque_movimentacoes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all operations on estoque_movimentacoes" ON public.estoque_movimentacoes FOR ALL USING (true) WITH CHECK (true);

-- Tabela pedidos
ALTER TABLE public.pedidos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all operations on pedidos" ON public.pedidos FOR ALL USING (true) WITH CHECK (true);

-- Tabela itens_pedido
ALTER TABLE public.itens_pedido ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all operations on itens_pedido" ON public.itens_pedido FOR ALL USING (true) WITH CHECK (true);

-- Tabela notas_fiscais
ALTER TABLE public.notas_fiscais ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all operations on notas_fiscais" ON public.notas_fiscais FOR ALL USING (true) WITH CHECK (true);

-- Tabela itens_nota_fiscal
ALTER TABLE public.itens_nota_fiscal ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all operations on itens_nota_fiscal" ON public.itens_nota_fiscal FOR ALL USING (true) WITH CHECK (true);