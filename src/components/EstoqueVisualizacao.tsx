import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Package, ArrowUpRight, Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface ProdutoEstoque {
  id: string;
  nome: string;
  categoria: string | null;
  estoque_atual: number;
  unidade_medida: string;
  validade?: string | null;
  validade_anterior?: string | null;
  valor_unitario?: number;
}

interface SaidaForm {
  data: string;
  quantidade: string;
  destino: string;
  responsavel: string;
}

const DESTINOS = [
  "Cozinha",
  "Bar",
  "Sala / Salão",
  "Camareira",
  "Manutenção",
  "Evento Interno",
  "Degustação",
  "Outro",
];

export default function EstoqueVisualizacao({ fornecedores = [] }: { fornecedores?: any[] }) {
  const { toast } = useToast();
  const [produtos, setProdutos] = useState<ProdutoEstoque[]>([]);
  const [loading, setLoading] = useState(true);
  const [produtoSelecionado, setProdutoSelecionado] = useState<ProdutoEstoque | null>(null);
  const [modo, setModo] = useState<'entrada' | 'saida'>('saida');
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<any>({
    data: new Date().toISOString().split("T")[0],
    quantidade: "",
    destino: "",
    responsavel: "",
    fornecedor_id: "",
    validade: ""
  });

  useEffect(() => {
    carregarProdutos();
  }, []);

  const carregarProdutos = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("produtos")
        .select("id, nome, categoria, estoque_atual, unidade_medida, validade, validade_anterior, valor_unitario")
        .eq("ativo", true)
        .order("nome");

      if (error) throw error;
      setProdutos(data || []);
    } catch (error) {
      console.error("Erro ao carregar produtos:", error);
      toast({ title: "Erro", description: "Erro ao carregar estoque", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const abrirDialog = (produto: ProdutoEstoque, m: 'entrada' | 'saida') => {
    setProdutoSelecionado(produto);
    setModo(m);
    setForm({
      data: new Date().toISOString().split("T")[0],
      quantidade: "",
      destino: "",
      responsavel: "",
      fornecedor_id: "",
      validade: produto.validade || ""
    });
  };

  const fecharDialog = () => {
    setProdutoSelecionado(null);
  };

  const handleRegistrarMovimentacao = async () => {
    if (!produtoSelecionado) return;

    const qtd = parseFloat(form.quantidade);
    if (!form.quantidade || isNaN(qtd) || qtd <= 0) {
      toast({ title: "Quantidade inválida", variant: "destructive" });
      return;
    }

    if (modo === 'saida' && qtd > produtoSelecionado.estoque_atual) {
      toast({ title: "Estoque insuficiente", variant: "destructive" });
      return;
    }

    if (modo === 'entrada' && !form.fornecedor_id) {
      toast({ title: "Fornecedor obrigatório", description: "Para rastreabilidade, selecione quem forneceu o item.", variant: "destructive" });
      return;
    }

    try {
      setSaving(true);

      const finalQtd = modo === 'entrada' ? qtd : -qtd;

      // 1. Registrar movimentação com fornecedor se for entrada
      const { error: movErr } = await supabase
        .from("estoque_movimentacoes")
        .insert({
          produto_id: produtoSelecionado.id,
          tipo_movimentacao: modo === 'entrada' ? "entrada_manual" : "saida",
          quantidade: finalQtd,
          responsavel: form.responsavel || "Gestor A&B",
          data_movimentacao: new Date(form.data).toISOString(),
          motivo: modo === 'entrada' ? `Entrada Manual via Nota/Compra` : `Saída para: ${form.destino}`,
          fornecedor_id: modo === 'entrada' ? form.fornecedor_id : null
        });

      if (movErr) throw movErr;

      // 2. Atualizar estoque e validade (se entrada)
      const novoEstoque = produtoSelecionado.estoque_atual + finalQtd;
      const updateData: any = { estoque_atual: novoEstoque };

      if (modo === 'entrada' && form.validade) {
        updateData.validade_anterior = produtoSelecionado.validade;
        updateData.validade = form.validade;
      }

      const { error: updErr } = await supabase
        .from("produtos")
        .update(updateData)
        .eq("id", produtoSelecionado.id);

      if (updErr) throw updErr;

      toast({
        title: modo === 'entrada' ? "✅ Entrada registrada!" : "✅ Saída registrada!",
        description: `${qtd} ${produtoSelecionado.unidade_medida} de "${produtoSelecionado.nome}" processados.`,
      });

      fecharDialog();
      carregarProdutos();
    } catch (err) {
      console.error(err);
      toast({ title: "Erro ao registrar movimentação", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const renderValidades = (produto: ProdutoEstoque) => {
    if (!produto.validade && !produto.validade_anterior) {
      return <span className="text-muted-foreground text-xs">—</span>;
    }

    const renderDateStr = (dateStr: string) => {
      const valDate = new Date(dateStr);
      const formattedDate = valDate.toLocaleDateString('pt-BR');
      const hoje = new Date();
      hoje.setHours(0, 0, 0, 0);

      const diffDays = Math.ceil((valDate.getTime() + valDate.getTimezoneOffset() * 60000 - hoje.getTime()) / 86400000);

      let colorClass = "text-muted-foreground";
      if (diffDays < 0) colorClass = "text-destructive font-bold";
      else if (diffDays <= 7) colorClass = "text-destructive font-medium";
      else if (diffDays <= 15) colorClass = "text-orange-500 font-medium";

      return <span className={`text-xs ${colorClass}`}>{formattedDate}</span>;
    };

    return (
      <div className="flex flex-col items-center gap-1">
        {produto.validade ? renderDateStr(produto.validade) : <span className="text-muted-foreground text-xs">—</span>}
        {produto.validade_anterior && (
          <div className="text-[10px] text-muted-foreground bg-muted/50 px-2 py-0.5 rounded-md flex items-center gap-1">
            <span>Último Lote: {new Date(produto.validade_anterior).toLocaleDateString('pt-BR')}</span>
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <Card className="bg-card shadow-elegant-md border-0 rounded-xl">
        <CardHeader>
          <div className="animate-pulse space-y-3">
            <div className="h-6 bg-muted rounded w-1/2"></div>
            <div className="h-4 bg-muted rounded w-3/4"></div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="animate-pulse">
                <div className="h-16 bg-muted rounded-xl"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="bg-card shadow-elegant-md border-0 rounded-xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5 text-primary" />
            Visualização do Estoque
          </CardTitle>
          <CardDescription>
            Controle de estoque. Use <strong>Entrada</strong> para repor itens (vinculando ao fornecedor) ou <strong>Saída</strong> para consumo.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Cabeçalho da tabela */}
          <div className="grid grid-cols-[minmax(150px,2fr)_minmax(80px,1fr)_minmax(80px,1fr)_minmax(80px,1fr)_auto] md:grid-cols-[3fr_1fr_1fr_1fr_auto] gap-4 px-4 pb-2 text-xs font-semibold text-primary uppercase tracking-wide border-b border-muted mb-2 items-center">
            <span>Produto</span>
            <span className="text-center">Categoria</span>
            <span className="text-center">Quantidade</span>
            <span className="text-center">Validade</span>
            <span className="text-right">Ação</span>
          </div>

          <div className="space-y-1 max-h-[420px] overflow-y-auto pr-1">
            {produtos.length === 0 ? (
              <div className="text-center py-10 text-muted-foreground">
                <Package className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>Nenhum produto cadastrado</p>
              </div>
            ) : (
              produtos.map((produto) => (
                <div
                  key={produto.id}
                  className="grid grid-cols-[minmax(150px,2fr)_minmax(80px,1fr)_minmax(80px,1fr)_minmax(80px,1fr)_auto] md:grid-cols-[3fr_1fr_1fr_1fr_auto] gap-4 items-center px-4 py-3 rounded-xl hover:bg-muted/40 transition-colors"
                >
                  <span className="font-medium text-sm truncate pr-2" title={produto.nome}>{produto.nome}</span>

                  <span className="text-center">
                    {produto.categoria ? (
                      <Badge variant="outline" className="text-xs">{produto.categoria}</Badge>
                    ) : <span className="text-muted-foreground text-xs">—</span>}
                  </span>

                  <span className="text-center text-sm font-mono">
                    {produto.estoque_atual} <span className="text-muted-foreground text-xs">{produto.unidade_medida}</span>
                  </span>

                  <span className="text-center">
                    {renderValidades(produto)}
                  </span>

                  <span className="flex justify-end gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 px-3 text-xs gap-1 border-primary/40 text-primary hover:bg-primary/10 hover:border-primary"
                      onClick={() => abrirDialog(produto, 'entrada')}
                    >
                      <Plus className="h-3 w-3" />
                      Entrada
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 px-3 text-xs gap-1 border-destructive/40 text-destructive hover:bg-destructive/10 hover:border-destructive"
                      onClick={() => abrirDialog(produto, 'saida')}
                    >
                      <ArrowUpRight className="h-3 w-3" />
                      Saída
                    </Button>
                  </span>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Dialog de Saída */}
      <Dialog open={!!produtoSelecionado} onOpenChange={(open) => !open && fecharDialog()}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {modo === 'entrada' ? <Plus className="h-5 w-5 text-primary" /> : <ArrowUpRight className="h-5 w-5 text-destructive" />}
              {modo === 'entrada' ? 'Registrar Entrada (Compra)' : 'Registrar Saída (Consumo)'}
            </DialogTitle>
            <DialogDescription>
              <span className="font-semibold text-foreground">{produtoSelecionado?.nome}</span>
              <span className="text-muted-foreground"> — Atual: </span>
              <span className="font-semibold text-primary">
                {produtoSelecionado?.estoque_atual} {produtoSelecionado?.unidade_medida}
              </span>
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="saida-data">Data</Label>
                <Input
                  id="saida-data"
                  type="date"
                  value={form.data}
                  onChange={e => setForm(f => ({ ...f, data: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="saida-qtd">
                  Quantidade <span className="text-muted-foreground text-xs">({produtoSelecionado?.unidade_medida})</span>
                </Label>
                <Input
                  id="saida-qtd"
                  type="number"
                  min="0.01"
                  step="0.01"
                  placeholder="0"
                  value={form.quantidade}
                  onChange={e => setForm(f => ({ ...f, quantidade: e.target.value }))}
                />
              </div>
            </div>

            {modo === 'saida' ? (
              <div className="space-y-1.5">
                <Label htmlFor="saida-destino">Destino</Label>
                <Select onValueChange={v => setForm((f: any) => ({ ...f, destino: v }))} value={form.destino}>
                  <SelectTrigger id="saida-destino">
                    <SelectValue placeholder="Selecione o destino…" />
                  </SelectTrigger>
                  <SelectContent>
                    {DESTINOS.map(d => (
                      <SelectItem key={d} value={d}>{d}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : (
              <>
                <div className="space-y-1.5">
                  <Label htmlFor="entrada-fornecedor">Fornecedor da Nota/Compra</Label>
                  <Select onValueChange={v => setForm((f: any) => ({ ...f, fornecedor_id: v }))} value={form.fornecedor_id}>
                    <SelectTrigger id="entrada-fornecedor">
                      <SelectValue placeholder="Selecione o fornecedor…" />
                    </SelectTrigger>
                    <SelectContent>
                      {fornecedores.map(f => (
                        <SelectItem key={f.id} value={f.id}>{f.nome.toUpperCase()}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="entrada-validade">Nova Data de Validade</Label>
                  <Input
                    id="entrada-validade"
                    type="date"
                    value={form.validade}
                    onChange={e => setForm((f: any) => ({ ...f, validade: e.target.value }))}
                  />
                </div>
              </>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="saida-resp">Responsável <span className="text-muted-foreground text-xs">(opcional)</span></Label>
              <Input
                id="saida-resp"
                placeholder="Nome do operador"
                value={form.responsavel}
                onChange={e => setForm((f: any) => ({ ...f, responsavel: e.target.value }))}
              />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={fecharDialog} disabled={saving}>
              Cancelar
            </Button>
            <Button
              onClick={handleRegistrarMovimentacao}
              disabled={saving}
              className={modo === 'entrada' ? "bg-primary hover:bg-primary/90" : "bg-destructive hover:bg-destructive/90 text-destructive-foreground"}
            >
              {saving ? "Processando…" : "Confirmar Lançamento"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}