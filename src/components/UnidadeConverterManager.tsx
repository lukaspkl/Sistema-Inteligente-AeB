import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trash2, Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface UnidadeConversao {
  id: string;
  unidade: string;
  fator_conversao: number;
  produto_id: string;
}

interface UnidadeConverterManagerProps {
  produtoId: string;
  unidadeBase: string;
  onUpdate?: () => void;
}

export default function UnidadeConverterManager({ 
  produtoId, 
  unidadeBase, 
  onUpdate 
}: UnidadeConverterManagerProps) {
  const [conversoes, setConversoes] = useState<UnidadeConversao[]>([]);
  const [novaUnidade, setNovaUnidade] = useState("");
  const [novoFator, setNovoFator] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchConversoes();
  }, [produtoId]);

  const fetchConversoes = async () => {
    setLoading(true);
    try {
      // Por enquanto, usar dados simulados
      // TODO: Implementar busca real na tabela unidades_conversao
      const conversoesPadrao = getConversoesPadrao(unidadeBase);
      setConversoes(conversoesPadrao);
    } catch (error) {
      console.error('Erro ao buscar conversões:', error);
    } finally {
      setLoading(false);
    }
  };

  const getConversoesPadrao = (unidadeBase: string): UnidadeConversao[] => {
    const conversoes: UnidadeConversao[] = [];
    
    if (unidadeBase === 'UN') {
      conversoes.push(
        { id: 'cx-12', unidade: 'CX', fator_conversao: 12, produto_id: produtoId },
        { id: 'pacote-6', unidade: 'PACOTE', fator_conversao: 6, produto_id: produtoId }
      );
    } else if (unidadeBase === 'KG') {
      conversoes.push(
        { id: 'cx-20', unidade: 'CX', fator_conversao: 20, produto_id: produtoId }
      );
    } else if (unidadeBase === 'L') {
      conversoes.push(
        { id: 'caixa-12', unidade: 'CAIXA', fator_conversao: 12, produto_id: produtoId }
      );
    }
    
    return conversoes;
  };

  const adicionarConversao = async () => {
    if (!novaUnidade || !novoFator || parseFloat(novoFator) <= 0) {
      toast.error("Preencha todos os campos corretamente");
      return;
    }

    // Verificar se a unidade já existe
    if (conversoes.some(c => c.unidade === novaUnidade.toUpperCase())) {
      toast.error("Esta unidade já está cadastrada");
      return;
    }

    const novaConversao: UnidadeConversao = {
      id: `custom-${Date.now()}`,
      unidade: novaUnidade.toUpperCase(),
      fator_conversao: parseFloat(novoFator),
      produto_id: produtoId
    };

    setConversoes([...conversoes, novaConversao]);
    setNovaUnidade("");
    setNovoFator("");
    
    toast.success("Conversão adicionada com sucesso");
    onUpdate?.();
  };

  const removerConversao = (id: string) => {
    setConversoes(conversoes.filter(c => c.id !== id));
    toast.success("Conversão removida");
    onUpdate?.();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Configurar Conversões de Unidades</CardTitle>
        <p className="text-sm text-muted-foreground">
          Unidade base: <Badge variant="outline">{unidadeBase}</Badge>
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Conversões existentes */}
        <div className="space-y-2">
          <Label>Conversões Cadastradas</Label>
          {conversoes.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Nenhuma conversão cadastrada
            </p>
          ) : (
            <div className="space-y-2">
              {conversoes.map((conversao) => (
                <div key={conversao.id} className="flex items-center justify-between p-2 border rounded">
                  <span className="text-sm">
                    1 {conversao.unidade} = {conversao.fator_conversao} {unidadeBase}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removerConversao(conversao.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Adicionar nova conversão */}
        <div className="space-y-3 pt-4 border-t">
          <Label>Adicionar Nova Conversão</Label>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Input
                placeholder="Unidade (ex: CX)"
                value={novaUnidade}
                onChange={(e) => setNovaUnidade(e.target.value)}
              />
            </div>
            <div>
              <Input
                type="number"
                step="0.01"
                placeholder={`Fator (quantos ${unidadeBase})`}
                value={novoFator}
                onChange={(e) => setNovoFator(e.target.value)}
              />
            </div>
          </div>
          <Button 
            onClick={adicionarConversao}
            className="w-full"
            disabled={loading}
          >
            <Plus className="h-4 w-4 mr-2" />
            Adicionar Conversão
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}