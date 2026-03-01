import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface Produto {
  id: string;
  nome: string;
  estoque_atual: number;
  valor_unitario: number;
  unidade_medida: string;
}

interface PerdasValidadeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export default function PerdasValidadeDialog({ open, onOpenChange, onSuccess }: PerdasValidadeDialogProps) {
  const { toast } = useToast();
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  const [produtoSelecionado, setProdutoSelecionado] = useState("");
  const [quantidade, setQuantidade] = useState("");
  const [responsavel, setResponsavel] = useState("");
  const [localPerda, setLocalPerda] = useState("estoque");
  const [observacoes, setObservacoes] = useState("");
  const [origemEstoque, setOrigemEstoque] = useState(true);

  useEffect(() => {
    if (open) {
      fetchProdutos();
      resetForm();
    }
  }, [open]);

  const fetchProdutos = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('produtos')
        .select('id, nome, estoque_atual, valor_unitario, unidade_medida')
        .eq('ativo', true)
        .order('nome');

      if (error) throw error;
      setProdutos(data || []);
    } catch (error) {
      console.error('Erro ao buscar produtos:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar produtos",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setProdutoSelecionado("");
    setQuantidade("");
    setResponsavel("");
    setLocalPerda("estoque");
    setObservacoes("");
    setOrigemEstoque(true);
  };

  const handleSubmit = async () => {
    if (!produtoSelecionado || !quantidade || !responsavel) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha produto, quantidade e responsável",
        variant: "destructive",
      });
      return;
    }

    const qtd = parseFloat(quantidade);
    if (qtd <= 0) {
      toast({
        title: "Quantidade inválida",
        description: "A quantidade deve ser maior que zero",
        variant: "destructive",
      });
      return;
    }

    const produto = produtos.find(p => p.id === produtoSelecionado);
    if (!produto) {
      toast({
        title: "Produto não encontrado",
        description: "Selecione um produto válido",
        variant: "destructive",
      });
      return;
    }

    if (origemEstoque && qtd > produto.estoque_atual) {
      toast({
        title: "Quantidade insuficiente",
        description: `Estoque atual: ${produto.estoque_atual} ${produto.unidade_medida}`,
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);
    try {
      const valorPerda = qtd * (produto.valor_unitario || 0);

      // Registrar perda
      const { error: perdasError } = await supabase
        .from('perdas')
        .insert({
          id_produto: produtoSelecionado,
          quantidade: qtd,
          valor_perda: valorPerda,
          responsavel,
          motivo: 'Perda por validade',
          tipo: 'validade',
          observacoes: observacoes || `Local da perda: ${localPerda}`,
          atualizou_estoque: origemEstoque,
        });

      if (perdasError) throw perdasError;

      // Se a perda foi do estoque, atualizar quantidade
      if (origemEstoque) {
        const { error: estoqueError } = await supabase
          .from('produtos')
          .update({ 
            estoque_atual: produto.estoque_atual - qtd 
          })
          .eq('id', produtoSelecionado);

        if (estoqueError) throw estoqueError;

        // Registrar movimentação de saída
        const { error: movError } = await supabase
          .from('estoque_movimentacoes')
          .insert({
            produto_id: produtoSelecionado,
            tipo_movimentacao: 'saida_perda',
            quantidade: qtd,
            responsavel,
            motivo: 'Perda por validade'
          });

        if (movError) throw movError;
      }

      toast({
        title: "Perda registrada",
        description: `Perda de ${qtd} ${produto.unidade_medida} de ${produto.nome} registrada com sucesso`,
      });

      onOpenChange(false);
      onSuccess?.();

    } catch (error) {
      console.error('Erro ao registrar perda:', error);
      toast({
        title: "Erro",
        description: "Erro ao registrar perda por validade",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const produtoSelecionadoData = produtos.find(p => p.id === produtoSelecionado);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Registrar Perda por Validade</DialogTitle>
          <DialogDescription>
            Registre produtos perdidos por vencimento ou validade próxima
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="produto">Produto *</Label>
            <Select value={produtoSelecionado} onValueChange={setProdutoSelecionado}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o produto" />
              </SelectTrigger>
              <SelectContent>
                {produtos.map((produto) => (
                  <SelectItem key={produto.id} value={produto.id}>
                    {produto.nome} (Estoque: {produto.estoque_atual} {produto.unidade_medida})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="quantidade">Quantidade Perdida *</Label>
            <Input
              id="quantidade"
              type="number"
              step="0.01"
              min="0"
              value={quantidade}
              onChange={(e) => setQuantidade(e.target.value)}
              placeholder="Ex: 2.5"
            />
            {produtoSelecionadoData && (
              <p className="text-xs text-muted-foreground">
                Unidade: {produtoSelecionadoData.unidade_medida} | 
                Estoque atual: {produtoSelecionadoData.estoque_atual}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="responsavel">Responsável *</Label>
            <Input
              id="responsavel"
              value={responsavel}
              onChange={(e) => setResponsavel(e.target.value)}
              placeholder="Nome do responsável"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="local">Local da Perda</Label>
            <Select value={localPerda} onValueChange={setLocalPerda}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="estoque">Estoque</SelectItem>
                <SelectItem value="cozinha">Cozinha</SelectItem>
                <SelectItem value="bar">Bar</SelectItem>
                <SelectItem value="geladeira">Geladeira</SelectItem>
                <SelectItem value="outros">Outros</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="origem-estoque"
              checked={origemEstoque}
              onCheckedChange={(checked) => setOrigemEstoque(checked === true)}
            />
            <Label htmlFor="origem-estoque" className="text-sm">
              Esta perda é do estoque atual (atualizar quantidade)
            </Label>
          </div>

          <div className="space-y-2">
            <Label htmlFor="observacoes">Observações</Label>
            <Textarea
              id="observacoes"
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              placeholder="Informações adicionais sobre a perda..."
              rows={3}
            />
          </div>

          {produtoSelecionadoData && quantidade && (
            <div className="p-3 bg-muted/50 rounded-xl">
              <p className="text-sm font-medium">Resumo da Perda:</p>
              <p className="text-xs text-muted-foreground">
                Valor estimado: R$ {((parseFloat(quantidade) || 0) * (produtoSelecionadoData.valor_unitario || 0)).toFixed(2)}
              </p>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={submitting}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={submitting || loading}
            className="bg-destructive hover:bg-destructive/90"
          >
            {submitting ? "Registrando..." : "Registrar Perda"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}