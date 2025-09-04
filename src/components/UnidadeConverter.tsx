import { useState, useEffect } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";

interface UnidadeConversao {
  id: string;
  unidade: string;
  fator_conversao: number;
  produto_id: string;
}

interface UnidadeConverterProps {
  produtoId: string;
  unidadeBase: string;
  onConversaoChange: (quantidadeBase: number, valorUnitarioBase: number, unidadeSelecionada: string) => void;
  quantidade: string;
  valorUnitario: string;
}

export default function UnidadeConverter({ 
  produtoId, 
  unidadeBase, 
  onConversaoChange, 
  quantidade, 
  valorUnitario 
}: UnidadeConverterProps) {
  const [unidades, setUnidades] = useState<UnidadeConversao[]>([]);
  const [unidadeSelecionada, setUnidadeSelecionada] = useState<string>("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (produtoId) {
      fetchUnidades();
      setUnidadeSelecionada(unidadeBase); // Default para unidade base
    }
  }, [produtoId, unidadeBase]);

  useEffect(() => {
    if (quantidade && valorUnitario && unidadeSelecionada) {
      calcularConversao();
    }
  }, [quantidade, valorUnitario, unidadeSelecionada]);

  const fetchUnidades = async () => {
    setLoading(true);
    try {
      // Sempre incluir a unidade base com fator 1
      const unidadesLista: UnidadeConversao[] = [
        { id: 'base', unidade: unidadeBase, fator_conversao: 1, produto_id: produtoId }
      ];

      // Por enquanto, usar conversões simuladas por produto específico
      // TODO: Implementar tabela unidades_conversao no banco de dados
      const conversoesPorProduto = await getConversoesSimuladas(produtoId, unidadeBase);
      
      unidadesLista.push(...conversoesPorProduto);
      setUnidades(unidadesLista);
    } catch (error) {
      console.error('Erro ao configurar unidades:', error);
    } finally {
      setLoading(false);
    }
  };

  // Função simulada - futuramente substituir por consulta ao banco
  const getConversoesSimuladas = async (produtoId: string, unidadeBase: string): Promise<UnidadeConversao[]> => {
    // Simular busca específica por produto no futuro
    // Por enquanto, retornar conversões baseadas na unidade base
    const conversoes: UnidadeConversao[] = [];
    
    if (unidadeBase === 'UN') {
      conversoes.push(
        { id: 'cx-12', unidade: 'CX', fator_conversao: 12, produto_id: produtoId },
        { id: 'pacote-6', unidade: 'PACOTE', fator_conversao: 6, produto_id: produtoId }
      );
    } else if (unidadeBase === 'KG') {
      conversoes.push(
        { id: 'cx-20', unidade: 'CX', fator_conversao: 20, produto_id: produtoId },
        { id: 'fardo-50', unidade: 'FARDO', fator_conversao: 50, produto_id: produtoId }
      );
    } else if (unidadeBase === 'L') {
      conversoes.push(
        { id: 'caixa-12', unidade: 'CAIXA', fator_conversao: 12, produto_id: produtoId }
      );
    }
    
    return conversoes;
  };

  const calcularConversao = () => {
    const qtd = parseFloat(quantidade || '0');
    const valor = parseFloat(valorUnitario || '0');
    
    if (qtd <= 0 || valor <= 0) {
      onConversaoChange(0, 0, unidadeSelecionada);
      return;
    }

    const unidade = unidades.find(u => u.unidade === unidadeSelecionada);
    if (!unidade) {
      onConversaoChange(0, 0, unidadeSelecionada);
      return;
    }

    // Converter para unidade base
    const quantidadeBase = qtd * unidade.fator_conversao;
    const valorUnitarioBase = valor / unidade.fator_conversao;

    onConversaoChange(quantidadeBase, valorUnitarioBase, unidadeSelecionada);
  };

  const formatarExibicao = (estoqueBase: number, unidadeExibicao: string) => {
    const unidade = unidades.find(u => u.unidade === unidadeExibicao);
    if (!unidade || unidade.fator_conversao === 1) {
      return `${estoqueBase} ${unidadeBase}`;
    }

    const quantidadeUnidade = Math.floor(estoqueBase / unidade.fator_conversao);
    const resto = estoqueBase % unidade.fator_conversao;

    if (resto === 0) {
      return `${quantidadeUnidade} ${unidadeExibicao}`;
    } else {
      return `${quantidadeUnidade} ${unidadeExibicao} e ${resto} ${unidadeBase}`;
    }
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Unidade de Medida</Label>
        <Select 
          value={unidadeSelecionada} 
          onValueChange={setUnidadeSelecionada}
          disabled={loading}
        >
          <SelectTrigger>
            <SelectValue placeholder="Selecione a unidade" />
          </SelectTrigger>
          <SelectContent>
            {unidades.map((unidade) => (
              <SelectItem key={unidade.id} value={unidade.unidade}>
                {unidade.unidade}
                {unidade.fator_conversao !== 1 && (
                  <span className="text-muted-foreground ml-2">
                    (1 {unidade.unidade} = {unidade.fator_conversao} {unidadeBase})
                  </span>
                )}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {quantidade && valorUnitario && unidadeSelecionada && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              Conversão: {quantidade} {unidadeSelecionada} = {(() => {
                const unidade = unidades.find(u => u.unidade === unidadeSelecionada);
                const qtdBase = parseFloat(quantidade) * (unidade?.fator_conversao || 1);
                return qtdBase;
              })()} {unidadeBase}
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              Valor unitário base: {(() => {
                const unidade = unidades.find(u => u.unidade === unidadeSelecionada);
                const valorBase = parseFloat(valorUnitario) / (unidade?.fator_conversao || 1);
                return valorBase.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
              })()} por {unidadeBase}
            </Badge>
          </div>
        </div>
      )}
    </div>
  );
}