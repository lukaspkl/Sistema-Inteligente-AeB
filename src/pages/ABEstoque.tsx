import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Package,
  Plus,
  Upload,
  AlertCircle,
  Calendar,
  DollarSign,
  ArrowUpRight,
  Search,
  CheckCircle2
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";



interface Produto {
  id: string;
  nome: string;
  categoria: string;
  estoque_atual: number;
  unidade_medida: string;
  valor_unitario: number;
  validade: string | null;
  validade_anterior?: string | null;
  quantidade_minima: number;
}

export default function ABEstoque() {
  const { toast } = useToast();
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [fornecedores, setFornecedores] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Estado da aba Saída
  const [buscaSaida, setBuscaSaida] = useState("");
  const [produtoSelecionadoSaida, setProdutoSelecionadoSaida] = useState<Produto | null>(null);
  const [saidaForm, setSaidaForm] = useState({ quantidade: "", destino: "", responsavel: "", data: new Date().toISOString().split("T")[0] });
  const [saidasHoje, setSaidasHoje] = useState<{ nome: string; qtd: number; unidade: string; destino: string; hora: string }[]>([]);
  const [savingSaida, setSavingSaida] = useState(false);
  const DESTINOS = ["Cozinha", "Bar", "Sala / Salão", "Camareira", "Manutenção", "Evento Interno", "Degustação", "Outro"];
  // Form para lançamento manual
  const [formData, setFormData] = useState({
    produto_nome: "",
    categoria: "",
    quantidade: "",
    unidade_medida: "",
    valor_unitario: "",
    validade: "",
    responsavel: "",
    fornecedor_id: "",
    quantidade_minima: "1"
  });


  // Autocomplete do lançamento manual
  const [autocompleteFocus, setAutocompleteFocus] = useState(false);
  const [produtoExistenteVinculado, setProdutoExistenteVinculado] = useState<Produto | null>(null);

  const sugestoesAutocomplete = autocompleteFocus && formData.produto_nome.length >= 2
    ? produtos.filter(p => p.nome.toLowerCase().includes(formData.produto_nome.toLowerCase())).slice(0, 6)
    : [];

  const handleSelecionarProdutoExistente = (p: Produto) => {
    setProdutoExistenteVinculado(p);
    setAutocompleteFocus(false);
    setFormData(f => ({
      ...f,
      produto_nome: p.nome,
      categoria: p.categoria || "",
      unidade_medida: p.unidade_medida,
      valor_unitario: String(p.valor_unitario || ""),
    }));
  };

  const handleNomeProdutoChange = (value: string) => {
    if (produtoExistenteVinculado && value !== produtoExistenteVinculado.nome) {
      setProdutoExistenteVinculado(null);
      setFormData(f => ({ ...f, produto_nome: value, categoria: "", unidade_medida: "", valor_unitario: "" }));
    } else {
      setFormData(f => ({ ...f, produto_nome: value }));
    }
  };


  useEffect(() => {
    fetchProdutos();
    fetchFornecedores();
  }, []);

  const fetchFornecedores = async () => {
    try {
      const { data } = await supabase.from('fornecedores').select('id, nome');
      setFornecedores(data || []);
    } catch (e) { console.error(e); }
  };

  const fetchProdutos = async () => {
    try {
      const { data, error } = await supabase
        .from('produtos')
        .select('*')
        .eq('ativo', true)
        .order('nome', { ascending: true });

      if (error) throw error;

      setProdutos(data || []);
    } catch (error) {
      console.error('Erro ao buscar produtos:', error);
    }
  };



  const handleLancamentoManual = async () => {
    if (!formData.produto_nome || !formData.quantidade || !formData.validade || !formData.fornecedor_id) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha produto, quantidade, validade e FORNECEDOR.",
        variant: "destructive"
      });
      return;
    }

    // Calcular quantidades finais diretamente do formulário
    const qtdFinal = parseFloat(formData.quantidade) || 0;
    const valorFinal = parseFloat(formData.valor_unitario) || 0;

    if (qtdFinal <= 0) {
      toast({
        title: "Quantidade inválida",
        description: "Informe uma quantidade maior que zero.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      // Usar produto vinculado pelo autocomplete (já resolvido), ou buscar pelo nome
      let produtoExistente = produtoExistenteVinculado
        ? { id: produtoExistenteVinculado.id, estoque_atual: produtoExistenteVinculado.estoque_atual, validade: produtoExistenteVinculado.validade }
        : null;

      // Se não veio do autocomplete, tenta buscar pelo nome exato
      if (!produtoExistente) {
        const { data: found } = await supabase
          .from('produtos')
          .select('id, estoque_atual, validade')
          .eq('nome', formData.produto_nome)
          .eq('ativo', true)
          .single();
        produtoExistente = found;
      }

      let produtoId;

      if (produtoExistente) {
        // Incrementar estoque existente
        const novoEstoque = (produtoExistente.estoque_atual || 0) + qtdFinal;

        const updatePayload: any = {
          estoque_atual: novoEstoque,
          valor_unitario: valorFinal > 0 ? valorFinal : undefined,
        };

        if (formData.validade) {
          if (produtoExistente.validade && produtoExistente.validade !== formData.validade) {
            updatePayload.validade_anterior = produtoExistente.validade;
          }
          updatePayload.validade = formData.validade;
        }

        const { error: updateError } = await supabase
          .from('produtos')
          .update(updatePayload)
          .eq('id', produtoExistente.id);

        if (updateError) throw updateError;
        produtoId = produtoExistente.id;
      } else {
        if (!formData.unidade_medida) {
          toast({ title: "Selecione a unidade", description: "A unidade de medida é obrigatória para novos produtos.", variant: "destructive" });
          setLoading(false);
          return;
        }
        // Criar novo produto
        const { data: novoProduto, error: insertError } = await supabase
          .from('produtos')
          .insert([{
            nome: formData.produto_nome,
            categoria: formData.categoria || 'Geral',
            estoque_atual: qtdFinal,
            unidade_medida: formData.unidade_medida,
            valor_unitario: valorFinal,
            validade: formData.validade || null,
            quantidade_minima: parseFloat(formData.quantidade_minima) || 1,
            ativo: true
          }])
          .select('id')
          .single();

        if (insertError) throw insertError;
        produtoId = novoProduto?.id;
      }


      // Registrar movimentação
      const { error: movError } = await supabase
        .from('estoque_movimentacoes')
        .insert([{
          produto_id: produtoId,
          tipo_movimentacao: 'entrada_manual',
          quantidade: qtdFinal,
          fornecedor_id: formData.fornecedor_id,
          motivo: `Lançamento manual: ${qtdFinal} ${formData.unidade_medida || 'UN'}`,
          responsavel: formData.responsavel || 'Sistema'
        }]);

      if (movError) throw movError;

      toast({
        title: "✅ Entrada registrada!",
        description: `${qtdFinal} ${formData.unidade_medida || 'UN'} de "${formData.produto_nome}" adicionados ao estoque.`
      });

      // Limpar formulário
      setFormData({
        produto_nome: "",
        categoria: "",
        quantidade: "",
        unidade_medida: "",
        valor_unitario: "",
        validade: "",
        responsavel: "",
        fornecedor_id: "",
        quantidade_minima: "1"
      });
      setProdutoExistenteVinculado(null);

      fetchProdutos();
    } catch (error) {
      console.error('Erro ao registrar entrada:', error);
      toast({
        title: "Erro",
        description: "Falha ao registrar entrada no estoque.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const calcularValorTotal = (produto: Produto) => {
    return (produto.estoque_atual * produto.valor_unitario).toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    });
  };

  const handleRegistrarSaida = async () => {
    if (!produtoSelecionadoSaida) { toast({ title: "Selecione um produto", variant: "destructive" }); return; }
    const qtd = parseFloat(saidaForm.quantidade);
    if (!saidaForm.quantidade || isNaN(qtd) || qtd <= 0) { toast({ title: "Quantidade inválida", variant: "destructive" }); return; }
    if (qtd > produtoSelecionadoSaida.estoque_atual) { toast({ title: "Estoque insuficiente", description: `Disponível: ${produtoSelecionadoSaida.estoque_atual} ${produtoSelecionadoSaida.unidade_medida}`, variant: "destructive" }); return; }
    if (!saidaForm.destino) { toast({ title: "Selecione o destino", variant: "destructive" }); return; }
    setSavingSaida(true);
    try {
      await supabase.from("estoque_movimentacoes").insert({
        produto_id: produtoSelecionadoSaida.id,
        tipo_movimentacao: "saida",
        quantidade: -qtd,
        responsavel: saidaForm.responsavel || "Não informado",
        data_movimentacao: new Date(saidaForm.data).toISOString(),
        motivo: `Saída para: ${saidaForm.destino}`,
      });
      await supabase.from("produtos").update({ estoque_atual: produtoSelecionadoSaida.estoque_atual - qtd }).eq("id", produtoSelecionadoSaida.id);
      setSaidasHoje(prev => [{ nome: produtoSelecionadoSaida.nome, qtd, unidade: produtoSelecionadoSaida.unidade_medida, destino: saidaForm.destino, hora: new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }) }, ...prev]);
      toast({ title: "✅ Saída registrada!", description: `${qtd} ${produtoSelecionadoSaida.unidade_medida} de "${produtoSelecionadoSaida.nome}" → ${saidaForm.destino}` });
      setSaidaForm({ quantidade: "", destino: "", responsavel: "", data: new Date().toISOString().split("T")[0] });
      setProdutoSelecionadoSaida(null);
      setBuscaSaida("");
      fetchProdutos();
    } catch { toast({ title: "Erro ao registrar saída", variant: "destructive" }); }
    finally { setSavingSaida(false); }
  };

  const getUrgenciaValidade = (validade: string | null) => {
    if (!validade) return null;
    const hoje = new Date(); hoje.setHours(0, 0, 0, 0);
    const val = new Date(validade);
    const diff = Math.ceil((val.getTime() + val.getTimezoneOffset() * 60000 - hoje.getTime()) / 86400000);
    if (diff < 0) return <Badge variant="destructive" className="text-[10px]">Vencido</Badge>;
    if (diff <= 7) return <Badge variant="destructive" className="text-[10px]">{diff}d</Badge>;
    if (diff <= 15) return <Badge className="bg-orange-500 text-white border-0 text-[10px]">{diff}d</Badge>;
    return null;
  };

  const produtosFiltrados = produtos.filter(p =>
    p.nome.toLowerCase().includes(buscaSaida.toLowerCase()) ||
    (p.categoria ?? "").toLowerCase().includes(buscaSaida.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <Package className="h-6 w-6" />
            </div>
            Estoque A&B
          </h1>
          <p className="text-muted-foreground">
            Controle completo do estoque de alimentos e bebidas
          </p>
        </div>
      </div>

      {/* Conteúdo Principal */}
      <Tabs defaultValue="lancamento" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 bg-muted">
          <TabsTrigger value="lancamento" className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Lançamento
          </TabsTrigger>
          <TabsTrigger value="saida" className="flex items-center gap-2">
            <ArrowUpRight className="h-4 w-4" />
            Saída
          </TabsTrigger>
          <TabsTrigger value="visualizacao" className="flex items-center gap-2">
            <Package className="h-4 w-4" />
            Visualização
          </TabsTrigger>
          <TabsTrigger value="upload" className="flex items-center gap-2">
            <Upload className="h-4 w-4" />
            Upload de Nota
          </TabsTrigger>
        </TabsList>

        <TabsContent value="lancamento" className="space-y-6">
          <Card className="bg-card shadow-elegant-md border-0 rounded-xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="h-5 w-5 text-primary" />
                Lançamento Manual de Entrada
              </CardTitle>
              <CardDescription>
                Registrar entrada manual no estoque (validade obrigatória)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Nome com autocomplete — span 2 colunas */}
                <div className="space-y-2 relative md:col-span-2">
                  <Label htmlFor="produto_nome">
                    Nome do Produto *{" "}
                    {produtoExistenteVinculado
                      ? <span className="ml-1 text-xs font-normal px-1.5 py-0.5 rounded bg-primary/15 text-primary">Produto existente — unidade bloqueada</span>
                      : formData.produto_nome.length > 2
                        ? <span className="ml-1 text-xs font-normal px-1.5 py-0.5 rounded bg-orange-100 text-orange-700">Novo produto</span>
                        : null}
                  </Label>
                  <Input
                    id="produto_nome"
                    value={formData.produto_nome}
                    onChange={e => handleNomeProdutoChange(e.target.value)}
                    onFocus={() => setAutocompleteFocus(true)}
                    onBlur={() => setTimeout(() => setAutocompleteFocus(false), 150)}
                    placeholder="Digite para buscar produto existente ou criar novo…"
                    autoComplete="off"
                  />
                  {sugestoesAutocomplete.length > 0 && (
                    <div className="absolute z-50 left-0 right-0 top-full mt-1 bg-card border border-border rounded-xl shadow-xl overflow-hidden">
                      {sugestoesAutocomplete.map(p => (
                        <button
                          key={p.id}
                          type="button"
                          onMouseDown={() => handleSelecionarProdutoExistente(p)}
                          className="w-full text-left px-4 py-2.5 hover:bg-primary/10 transition-colors flex items-center justify-between text-sm border-b border-muted last:border-0"
                        >
                          <span className="font-medium">{p.nome}</span>
                          <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                            {p.unidade_medida} · {p.categoria}
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Categoria — bloqueada se produto existente */}
                <div className="space-y-2">
                  <Label htmlFor="categoria">
                    Categoria{produtoExistenteVinculado && <span className="ml-1 text-xs text-muted-foreground">(bloqueada)</span>}
                  </Label>
                  <Select
                    value={formData.categoria}
                    onValueChange={v => !produtoExistenteVinculado && setFormData({ ...formData, categoria: v })}
                    disabled={!!produtoExistenteVinculado}
                  >
                    <SelectTrigger className={produtoExistenteVinculado ? "opacity-60 cursor-not-allowed" : ""}>
                      <SelectValue placeholder="Selecione a categoria" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Bebidas">Bebidas</SelectItem>
                      <SelectItem value="Carnes">Carnes</SelectItem>
                      <SelectItem value="Cozinha">Cozinha</SelectItem>
                      <SelectItem value="Café da manhã">Café da manhã</SelectItem>
                      <SelectItem value="Limpeza">Limpeza</SelectItem>
                      <SelectItem value="Geral">Geral</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="quantidade">Quantidade *</Label>
                  <Input
                    id="quantidade"
                    type="number"
                    value={formData.quantidade}
                    onChange={e => setFormData({ ...formData, quantidade: e.target.value })}
                    placeholder="Ex: 24"
                  />
                </div>

                {/* Unidade — bloqueada se produto existente */}
                <div className="space-y-2">
                  <Label htmlFor="unidade_medida">
                    Unidade{produtoExistenteVinculado && <span className="ml-1 text-xs text-muted-foreground">(bloqueada)</span>}
                  </Label>
                  <Select
                    value={formData.unidade_medida}
                    onValueChange={v => !produtoExistenteVinculado && setFormData({ ...formData, unidade_medida: v })}
                    disabled={!!produtoExistenteVinculado}
                  >
                    <SelectTrigger className={produtoExistenteVinculado ? "opacity-60 cursor-not-allowed" : ""}>
                      <SelectValue placeholder="Unidade base do produto" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="UN">Unidade (UN)</SelectItem>
                      <SelectItem value="KG">Quilograma (KG)</SelectItem>
                      <SelectItem value="L">Litro (L)</SelectItem>
                      <SelectItem value="PCT">Pacote (PCT)</SelectItem>
                      <SelectItem value="CX">Caixa (CX)</SelectItem>
                      <SelectItem value="GF">Garrafa (GF)</SelectItem>
                      <SelectItem value="LT">Lata (LT)</SelectItem>
                      <SelectItem value="G">Grama (G)</SelectItem>
                      <SelectItem value="ML">Mililitro (ML)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="valor_unitario">Valor Unitário (R$)</Label>
                  <Input
                    id="valor_unitario"
                    type="number"
                    step="0.01"
                    value={formData.valor_unitario}
                    onChange={e => setFormData({ ...formData, valor_unitario: e.target.value })}
                    placeholder="Ex: 2.50"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="validade">Data de Validade *</Label>
                  <Input
                    id="validade"
                    type="date"
                    value={formData.validade}
                    onChange={e => setFormData({ ...formData, validade: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="fornecedor">Fornecedor da Compra *</Label>
                  <Select
                    value={formData.fornecedor_id}
                    onValueChange={v => setFormData({ ...formData, fornecedor_id: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o fornecedor" />
                    </SelectTrigger>
                    <SelectContent>
                      {fornecedores.map(f => (
                        <SelectItem key={f.id} value={f.id}>{f.nome.toUpperCase()}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="responsavel">Responsável pelo Lançamento</Label>
                  <Input
                    id="responsavel"
                    value={formData.responsavel}
                    onChange={e => setFormData({ ...formData, responsavel: e.target.value })}
                    placeholder="Nome do operador"
                  />
                </div>

                {!produtoExistenteVinculado && (
                  <div className="space-y-2">
                    <Label htmlFor="quantidade_minima" className="text-orange-600 font-bold">Estoque Mínimo (Alerta) *</Label>
                    <Input
                      id="quantidade_minima"
                      type="number"
                      value={formData.quantidade_minima}
                      onChange={e => setFormData({ ...formData, quantidade_minima: e.target.value })}
                      placeholder="Qtd para alerta"
                      className="border-orange-200 focus:border-orange-500"
                    />
                  </div>
                )}
              </div>


              {/* Preview de confirmação — aparece assim que nome e quantidade estão preenchidos */}
              {formData.produto_nome && formData.quantidade && (
                <div className={`flex items-start gap-3 p-4 rounded-xl border ${produtoExistenteVinculado
                  ? "bg-primary/5 border-primary/30"
                  : "bg-orange-50 border-orange-200"
                  }`}>
                  <AlertCircle className={`h-4 w-4 mt-0.5 shrink-0 ${produtoExistenteVinculado ? "text-primary" : "text-orange-600"}`} />
                  <p className={`text-sm ${produtoExistenteVinculado ? "text-primary" : "text-orange-700"}`}>
                    {produtoExistenteVinculado
                      ? <>Adicionando <strong>{formData.quantidade} {formData.unidade_medida || produtoExistenteVinculado.unidade_medida}</strong> ao produto existente <strong>"{formData.produto_nome}"</strong>. Unidade <strong>{produtoExistenteVinculado.unidade_medida}</strong> mantida do cadastro original.</>
                      : <>Criando <strong>novo produto</strong> <strong>"{formData.produto_nome}"</strong>{formData.unidade_medida ? <> com unidade <strong>{formData.unidade_medida}</strong></> : " — selecione a unidade abaixo"}. Confirme que ele não existe no sistema com outro nome.</>
                    }
                  </p>
                </div>
              )}


              <Button
                onClick={handleLancamentoManual}
                disabled={loading}
                className="w-full bg-primary hover:bg-primary/90"
              >
                {loading ? "Registrando..." : "Registrar Entrada"}
              </Button>
            </CardContent>

          </Card>
        </TabsContent>

        {/* ===== ABA SAÍDA ===== */}
        <TabsContent value="saida" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Coluna esquerda: busca e seleção */}
            <Card className="bg-card shadow-elegant-md border-0 rounded-xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Search className="h-5 w-5 text-primary" />
                  Selecionar Produto
                </CardTitle>
                <CardDescription>Busque e clique no produto que está saindo</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Input placeholder="Buscar por nome ou categoria…" value={buscaSaida} onChange={e => setBuscaSaida(e.target.value)} />
                <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
                  {produtosFiltrados.map(p => {
                    const sel = produtoSelecionadoSaida?.id === p.id;
                    const sem = p.estoque_atual <= 0;
                    return (
                      <button
                        key={p.id}
                        disabled={sem}
                        onClick={() => { setProdutoSelecionadoSaida(sel ? null : p); setSaidaForm(f => ({ ...f, quantidade: "" })); }}
                        className={`w-full text-left px-4 py-3 rounded-xl border transition-all ${sem ? "opacity-40 cursor-not-allowed bg-muted/20 border-muted" :
                          sel ? "bg-primary/10 border-primary ring-1 ring-primary" :
                            "hover:bg-muted/50 border-muted/60"
                          }`}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-sm">{p.nome}</p>
                            <p className="text-xs text-muted-foreground">{p.categoria} · {p.estoque_atual} {p.unidade_medida} disponíveis</p>
                          </div>
                          <div className="flex items-center gap-2">
                            {getUrgenciaValidade(p.validade)}
                            {sel && <CheckCircle2 className="h-4 w-4 text-primary" />}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Coluna direita: formulário + log */}
            <div className="space-y-4">
              <Card className="bg-card shadow-elegant-md border-0 rounded-xl">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ArrowUpRight className="h-5 w-5 text-destructive" />
                    Dados da Saída
                  </CardTitle>
                  <CardDescription>
                    {produtoSelecionadoSaida
                      ? <><span className="font-semibold text-foreground">{produtoSelecionadoSaida.nome}</span> — <span className="text-primary font-semibold">{produtoSelecionadoSaida.estoque_atual} {produtoSelecionadoSaida.unidade_medida}</span> disponíveis</>
                      : "Selecione um produto ao lado"}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label htmlFor="es-data">Data</Label>
                      <Input id="es-data" type="date" value={saidaForm.data} onChange={e => setSaidaForm(f => ({ ...f, data: e.target.value }))} />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="es-qtd">Quantidade {produtoSelecionadoSaida && <span className="text-xs text-muted-foreground">({produtoSelecionadoSaida.unidade_medida})</span>}</Label>
                      <Input id="es-qtd" type="number" min="0.01" step="0.01" placeholder="0" value={saidaForm.quantidade} disabled={!produtoSelecionadoSaida} onChange={e => setSaidaForm(f => ({ ...f, quantidade: e.target.value }))} />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="es-destino">Destino</Label>
                    <Select value={saidaForm.destino} onValueChange={v => setSaidaForm(f => ({ ...f, destino: v }))} disabled={!produtoSelecionadoSaida}>
                      <SelectTrigger id="es-destino"><SelectValue placeholder="Selecione o destino…" /></SelectTrigger>
                      <SelectContent>
                        {DESTINOS.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="es-resp">Responsável <span className="text-xs text-muted-foreground">(opcional)</span></Label>
                    <Input id="es-resp" placeholder="Nome de quem retirou" value={saidaForm.responsavel} disabled={!produtoSelecionadoSaida} onChange={e => setSaidaForm(f => ({ ...f, responsavel: e.target.value }))} />
                  </div>
                  <Button className="w-full bg-destructive hover:bg-destructive/90 text-destructive-foreground" onClick={handleRegistrarSaida} disabled={savingSaida || !produtoSelecionadoSaida}>
                    <ArrowUpRight className="h-4 w-4 mr-2" />
                    {savingSaida ? "Registrando…" : "Confirmar Saída"}
                  </Button>
                </CardContent>
              </Card>

              {saidasHoje.length > 0 && (
                <Card className="bg-card shadow-elegant-md border-0 rounded-xl">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-primary" />
                      Saídas desta Sessão
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 max-h-48 overflow-y-auto">
                    {saidasHoje.map((s, i) => (
                      <div key={i} className="flex items-center justify-between text-sm px-3 py-2 rounded-lg bg-muted/40">
                        <div>
                          <span className="font-medium">{s.nome}</span>
                          <span className="text-muted-foreground"> · {s.destino}</span>
                        </div>
                        <div className="text-right">
                          <span className="font-mono text-destructive">−{s.qtd} {s.unidade}</span>
                          <span className="text-xs text-muted-foreground block">{s.hora}</span>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </TabsContent>

        {/* ===== ABA VISUALIZAÇÃO ===== */}
        <TabsContent value="visualizacao" className="space-y-6">
          <Card className="bg-card shadow-elegant-md border-0 rounded-xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5 text-primary" />
                Visualização do Estoque
              </CardTitle>
              <CardDescription>
                Produtos em estoque (somente leitura)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-xl border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Produto</TableHead>
                      <TableHead>Categoria</TableHead>
                      <TableHead>Quantidade</TableHead>
                      <TableHead>Mínimo</TableHead>
                      <TableHead>Validade</TableHead>
                      <TableHead>Valor Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {produtos.map((produto) => (
                      <TableRow key={produto.id}>
                        <TableCell className="font-medium">{produto.nome}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{produto.categoria}</Badge>
                        </TableCell>
                        <TableCell>
                          <span className={produto.estoque_atual <= produto.quantidade_minima ? "text-destructive font-bold" : ""}>
                            {produto.estoque_atual} {produto.unidade_medida}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary" className="font-mono">{produto.quantidade_minima} {produto.unidade_medida}</Badge>
                        </TableCell>
                        <TableCell>
                          {produto.validade ? (
                            <div className="flex flex-col gap-1">
                              <div className="flex items-center gap-2">
                                <Calendar className="h-4 w-4 text-muted-foreground" />
                                {new Date(produto.validade).toLocaleDateString('pt-BR')}
                              </div>
                              {produto.validade_anterior && (
                                <div className="text-xs text-muted-foreground flex items-center gap-1">
                                  <span className="font-medium">Lote anterior:</span>
                                  {new Date(produto.validade_anterior).toLocaleDateString('pt-BR')}
                                </div>
                              )}
                            </div>
                          ) : (
                            <span className="text-muted-foreground">Não informada</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <DollarSign className="h-4 w-4 text-success" />
                            {calcularValorTotal(produto)}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="upload" className="space-y-6">
          <Card className="bg-card shadow-elegant-md border-0 rounded-xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5 text-primary" />
                Upload de Nota Fiscal
              </CardTitle>
              <CardDescription>
                Enviar imagem ou PDF da nota fiscal (leitura básica)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="border-2 border-dashed border-muted rounded-xl p-8 text-center">
                <Upload className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-lg font-medium mb-2">Arraste arquivos aqui</p>
                <p className="text-muted-foreground mb-4">ou clique para selecionar</p>
                <Button variant="outline">
                  Selecionar Arquivos
                </Button>
              </div>

              <div className="text-sm text-muted-foreground">
                <p>• Formatos aceitos: JPG, PNG, PDF</p>
                <p>• Tamanho máximo: 10MB por arquivo</p>
                <p>• A leitura básica identifica produtos conhecidos automaticamente</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}