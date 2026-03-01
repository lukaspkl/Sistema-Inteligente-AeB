import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";

interface Produto {
  id: string;
  nome: string;
  estoque_atual: number;
  valor_unitario: number;
}

interface PerdasDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export default function PerdasDialog({ open, onOpenChange, onSuccess }: PerdasDialogProps) {
  const { toast } = useToast();
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    produto_id: "",
    quantidade: "",
    responsavel: "",
    data_perda: new Date().toISOString().split('T')[0],
    observacoes: "",
    origem_estoque: false
  });

  useEffect(() => {
    if (open) {
      fetchProdutos();
    }
  }, [open]);

  const fetchProdutos = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('produtos')
        .select('id, nome, estoque_atual, valor_unitario')
        .eq('ativo', true)
        .order('nome');

      if (error) throw error;
      setProdutos(data || []);
    } catch (error) {
      console.error('Erro ao buscar produtos:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os produtos.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.produto_id || !formData.quantidade || !formData.responsavel) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha todos os campos obrigatórios.",
        variant: "destructive",
      });
      return;
    }

    const produto = produtos.find(p => p.id === formData.produto_id);
    if (!produto) return;

    const quantidade = parseFloat(formData.quantidade);
    const valor_perda = produto.valor_unitario * quantidade;

    setSubmitting(true);
    try {
      // Inserir perda
      const { error: perda_error } = await supabase
        .from('perdas')
        .insert({
          id_produto: formData.produto_id,
          quantidade: quantidade,
          responsavel: formData.responsavel,
          data_perda: formData.data_perda,
          observacoes: formData.observacoes || null,
          atualizou_estoque: formData.origem_estoque,
          valor_perda: valor_perda
        });

      if (perda_error) throw perda_error;

      // Se origem_estoque = true, atualizar estoque
      if (formData.origem_estoque) {
        const novo_estoque = produto.estoque_atual - quantidade;
        const { error: estoque_error } = await supabase
          .from('produtos')
          .update({ estoque_atual: Math.max(0, novo_estoque) })
          .eq('id', formData.produto_id);

        if (estoque_error) throw estoque_error;
      }

      toast({
        title: "Perda registrada",
        description: `Perda de ${quantidade} ${produto.nome} registrada com sucesso.`,
      });

      // Reset form
      setFormData({
        produto_id: "",
        quantidade: "",
        responsavel: "",
        data_perda: new Date().toISOString().split('T')[0],
        observacoes: "",
        origem_estoque: false
      });

      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      console.error('Erro ao registrar perda:', error);
      toast({
        title: "Erro",
        description: "Não foi possível registrar a perda.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Registrar Perda</DialogTitle>
          <DialogDescription>
            Registre itens danificados, extraviados ou inutilizados
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="produto">Produto *</Label>
            <Select
              value={formData.produto_id}
              onValueChange={(value) => setFormData({ ...formData, produto_id: value })}
              disabled={loading}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione um produto" />
              </SelectTrigger>
              <SelectContent>
                {loading ? (
                  <SelectItem value="loading" disabled>
                    <div className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Carregando...
                    </div>
                  </SelectItem>
                ) : (
                  produtos.map((produto) => (
                    <SelectItem key={produto.id} value={produto.id}>
                      {produto.nome} (Estoque: {produto.estoque_atual})
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="quantidade">Quantidade *</Label>
            <Input
              id="quantidade"
              type="number"
              step="0.01"
              min="0"
              value={formData.quantidade}
              onChange={(e) => setFormData({ ...formData, quantidade: e.target.value })}
              placeholder="Ex: 5"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="responsavel">Responsável *</Label>
            <Input
              id="responsavel"
              value={formData.responsavel}
              onChange={(e) => setFormData({ ...formData, responsavel: e.target.value })}
              placeholder="Nome do responsável"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="data_perda">Data da Perda</Label>
            <Input
              id="data_perda"
              type="date"
              value={formData.data_perda}
              onChange={(e) => setFormData({ ...formData, data_perda: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="observacoes">Observações</Label>
            <Textarea
              id="observacoes"
              value={formData.observacoes}
              onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
              placeholder="Descreva o motivo da perda..."
              rows={3}
            />
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="origem_estoque"
              checked={formData.origem_estoque}
              onCheckedChange={(checked) => 
                setFormData({ ...formData, origem_estoque: checked as boolean })
              }
            />
            <Label htmlFor="origem_estoque" className="text-sm">
              Essa perda ocorreu com produto ainda no estoque?
            </Label>
          </div>
        </form>

        <DialogFooter>
          <Button
            type="button"
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
            {submitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Registrando...
              </>
            ) : (
              "Registrar Perda"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}