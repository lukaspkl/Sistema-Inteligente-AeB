import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  ShoppingCart,
  Plus,
  FileText,
  Users,
  AlertTriangle,
  Download,
  Clock
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

interface Produto {
  id: string;
  nome: string;
  estoque_atual: number;
  quantidade_minima: number;
  unidade_medida: string;
  fornecedor_id?: string;
}

interface Fornecedor {
  id: string;
  nome: string;
  contato: string;
  condicoes_pagamento: string;
  prazo_entrega: string;
}

export default function ABCompras() {
  const { toast } = useToast();
  const [produtosBaixos, setProdutosBaixos] = useState<Produto[]>([]);
  const [fornecedores, setFornecedores] = useState<Fornecedor[]>([]);
  const [loading, setLoading] = useState(false);

  // Form para novo fornecedor
  const [fornecedorForm, setFornecedorForm] = useState({
    nome: "",
    contato: "",
    condicoes_pagamento: "",
    prazo_entrega: ""
  });

  // Form para pedido de compra
  const [pedidoForm, setPedidoForm] = useState({
    fornecedor_id: "",
    observacoes: "",
    itens_selecionados: [] as string[],
    quantidades_personalizadas: {} as Record<string, string>
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [pedidosRegistrados, setPedidosRegistrados] = useState<any[]>([]);

  useEffect(() => {
    fetchProdutosBaixos();
    fetchFornecedores();
    fetchPedidosRegistrados();
  }, []);

  const fetchProdutosBaixos = async () => {
    try {
      const { data, error } = await supabase
        .from('produtos')
        .select('id, nome, estoque_atual, quantidade_minima, unidade_medida, fornecedor_id')
        .eq('ativo', true)
        .order('estoque_atual', { ascending: true });

      if (error) throw error;

      // Filtrar produtos com estoque baixo
      const baixos = data?.filter(p => p.estoque_atual <= p.quantidade_minima) || [];
      setProdutosBaixos(baixos);
    } catch (error) {
      console.error('Erro ao buscar produtos:', error);
    }
  };

  const fetchFornecedores = async () => {
    try {
      const { data, error } = await supabase
        .from('fornecedores')
        .select('*');

      if (error) throw error;
      setFornecedores(data || []);
    } catch (error) {
      console.error('Erro ao buscar fornecedores:', error);
    }
  };

  const fetchPedidosRegistrados = async () => {
    try {
      const { data, error } = await supabase
        .from('pedidos')
        .select(`*`);

      if (error) throw error;
      // In the mockup we just grab raw data and will format it basicly to show history.
      setPedidosRegistrados(data || []);
    } catch (error) {
      console.error('Erro ao buscar pedidos registrados:', error);
    }
  }

  const handleCadastroFornecedor = async () => {
    if (!fornecedorForm.nome || !fornecedorForm.contato) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha nome e contato do fornecedor.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('fornecedores')
        .insert([{
          nome: fornecedorForm.nome,
          contato: fornecedorForm.contato,
          condicoes_pagamento: fornecedorForm.condicoes_pagamento || '-',
          prazo_entrega: fornecedorForm.prazo_entrega || '-'
        }]);

      if (error) throw error;

      toast({
        title: "Sucesso!",
        description: "Fornecedor cadastrado com sucesso."
      });

      setFornecedorForm({ nome: "", contato: "", condicoes_pagamento: "", prazo_entrega: "" });
      fetchFornecedores();
    } catch (error) {
      toast({
        title: "Erro",
        description: "Falha ao registrar fornecedor.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGerarPedido = async () => {
    if (!pedidoForm.fornecedor_id) {
      toast({
        title: "Atenção",
        description: "Selecione um fornecedor validado.",
        variant: "destructive"
      });
      return;
    }

    const itemsToBuy = pedidoForm.itens_selecionados.length > 0
      ? produtosBaixos.filter(p => pedidoForm.itens_selecionados.includes(p.id))
      : produtosBaixos;

    if (itemsToBuy.length === 0) {
      toast({
        title: "Atenção",
        description: "Nenhum produto com baixa quantidade ou selecionado.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      // 1. Gerar Pedido
      const { data: pedido, error: errorPedido } = await supabase
        .from('pedidos')
        .insert([{
          setor: 'A&B',
          responsavel: 'João Silva', // Mocked do user da header
          status: 'pendente',
          observacoes: pedidoForm.observacoes,
          fornecedor_id: pedidoForm.fornecedor_id
        }])
        .select()
        .single();

      if (errorPedido) throw errorPedido;

      // 2. Gerar Itens (Quantidade personalizada ou por padrão)
      const mockItems = itemsToBuy.map(item => {
        const customQtd = parseInt(pedidoForm.quantidades_personalizadas[item.id]);
        const calculatedQtd = Math.max(item.quantidade_minima - item.estoque_atual, 5); // comprar no minimo 5
        const finalQtd = (!isNaN(customQtd) && customQtd > 0) ? customQtd : calculatedQtd;

        return {
          pedido_id: pedido.id,
          produto_id: item.id,
          quantidade: finalQtd
        };
      });

      const { error: errItems } = await supabase
        .from('itens_pedido')
        .insert(mockItems);

      if (errItems) throw errItems;

      // --- PDF Generation ---
      const doc = new jsPDF();
      const fornecedor = fornecedores.find(f => f.id === pedidoForm.fornecedor_id);
      const dataEmissao = new Date().toLocaleDateString('pt-BR');

      // Cabeçalho
      doc.setFontSize(20);
      doc.setTextColor(59, 130, 246); // Primary Color
      doc.text("Ordem de Compra - A&B", 14, 22);

      doc.setFontSize(10);
      doc.setTextColor(100, 100, 100);
      doc.text(`Pedido Nº: #${pedido.id.substring(0, 8).toUpperCase()}`, 14, 30);
      doc.text(`Data de Emissão: ${dataEmissao}`, 14, 35);
      doc.text(`Responsável: João Silva`, 14, 40);

      // Info Fornecedor
      doc.setFontSize(12);
      doc.setTextColor(40, 40, 40);
      doc.text("Dados do Fornecedor:", 14, 52);

      doc.setFontSize(10);
      doc.setTextColor(80, 80, 80);
      doc.text(`Nome: ${fornecedor?.nome || 'N/A'}`, 14, 58);
      doc.text(`Contato: ${fornecedor?.contato || 'N/A'}`, 14, 64);
      doc.text(`Condições: ${fornecedor?.condicoes_pagamento || '-'}`, 110, 58);
      doc.text(`Frete: ${fornecedor?.prazo_entrega || '-'}`, 110, 64);

      // Tabela de Itens
      const tableData = mockItems.map(item => {
        const prod = itemsToBuy.find(p => p.id === item.produto_id);
        return [
          prod?.nome || 'Desconhecido',
          item.quantidade.toString(),
          prod?.unidade_medida || 'UN'
        ];
      });

      autoTable(doc, {
        startY: 72,
        head: [['Produto Solicitado', 'Qtd', 'Unidade']],
        body: tableData,
        theme: 'grid',
        headStyles: { fillColor: [59, 130, 246] },
        styles: { fontSize: 10, cellPadding: 4 }
      });

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const finalY = (doc as any).lastAutoTable.finalY || 72;

      // Observações
      if (pedidoForm.observacoes) {
        doc.setFontSize(12);
        doc.setTextColor(40, 40, 40);
        doc.text("Observações:", 14, finalY + 15);
        doc.setFontSize(10);
        doc.setTextColor(100, 100, 100);

        const splitText = doc.splitTextToSize(pedidoForm.observacoes, 180);
        doc.text(splitText, 14, finalY + 22);
      }

      // Rodapé
      doc.setFontSize(8);
      doc.setTextColor(150, 150, 150);
      doc.text("Sistema Inteligente A&B - Documento gerado automaticamente", 105, 290, { align: 'center' });

      // Open PDF in new window automatically
      window.open(doc.output('bloburl'), '_blank');
      // ----------------------

      toast({
        title: "Pedido de Compra Gerado!",
        description: `O PDF foi aberto em uma nova aba para envio. (${mockItems.length} itens)`,
      });

      setPedidoForm({
        fornecedor_id: "",
        observacoes: "",
        itens_selecionados: [],
        quantidades_personalizadas: {}
      });
      fetchPedidosRegistrados();
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível gerar pedido.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleItemPedido = (produtoId: string) => {
    const produtoClicado = produtosBaixos.find(p => p.id === produtoId);

    setPedidoForm(prev => {
      const isSelecting = !prev.itens_selecionados.includes(produtoId);

      let novosItens = [];
      if (isSelecting) {
        novosItens = [...prev.itens_selecionados, produtoId];
      } else {
        novosItens = prev.itens_selecionados.filter(id => id !== produtoId);
      }

      let novoFornecedorId = prev.fornecedor_id;

      // Auto-selecionar o fornecedor se for o primeiro
      if (isSelecting && novosItens.length === 1 && produtoClicado?.fornecedor_id) {
        novoFornecedorId = produtoClicado.fornecedor_id;
      }
      // Resetar caso limpe tudo
      else if (novosItens.length === 0) {
        novoFornecedorId = "";
      }

      return {
        ...prev,
        itens_selecionados: novosItens,
        fornecedor_id: novoFornecedorId
      };
    });
  };

  const handleFornecedorChange = (value: string) => {
    // If the user manually overrides the supplier, clear conflicting items
    const invalidItemsList = pedidoForm.itens_selecionados.filter(id => {
      const prod = produtosBaixos.find(p => p.id === id);
      return prod && prod.fornecedor_id && prod.fornecedor_id !== value;
    });

    setPedidoForm(prev => ({
      ...prev,
      fornecedor_id: value,
      itens_selecionados: invalidItemsList.length > 0 ? [] : prev.itens_selecionados
    }));
  };

  const isCheckboxDisabled = (produto: Produto) => {
    if (pedidoForm.itens_selecionados.length > 0) {
      if (!pedidoForm.itens_selecionados.includes(produto.id) &&
        produto.fornecedor_id &&
        pedidoForm.fornecedor_id &&
        produto.fornecedor_id !== pedidoForm.fornecedor_id) {
        return true;
      }
    }
    return false;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <ShoppingCart className="h-6 w-6" />
            </div>
            Compras A&B
          </h1>
          <p className="text-muted-foreground">
            Gestão de pedidos de compra e fornecedores
          </p>
        </div>

        {produtosBaixos.length > 0 && (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-orange-50 border border-orange-200">
            <AlertTriangle className="h-4 w-4 text-orange-600" />
            <span className="text-sm text-orange-700 font-medium">
              {produtosBaixos.length} produtos com estoque baixo
            </span>
          </div>
        )}
      </div>

      {/* Conteúdo Principal */}
      <Tabs defaultValue="pedidos" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 bg-muted">
          <TabsTrigger value="pedidos" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Pedidos de Compra
          </TabsTrigger>
          <TabsTrigger value="fornecedores" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Fornecedores
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pedidos" className="space-y-6">
          {/* Estoque Baixo */}
          {produtosBaixos.length > 0 && (
            <Card className="bg-card shadow-elegant-md border-0 rounded-xl border-l-4 border-l-orange-500">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-orange-600" />
                  Produtos com Estoque Baixo
                </CardTitle>
                <CardDescription>
                  Produtos que precisam ser reabastecidos
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="rounded-xl border overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Selecionar</TableHead>
                        <TableHead>Produto</TableHead>
                        <TableHead>Estoque Atual</TableHead>
                        <TableHead>Mínimo</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="w-[120px]">Qtd. Pedido</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {produtosBaixos.map((produto) => {
                        const isSelected = pedidoForm.itens_selecionados.includes(produto.id);
                        const isDisabled = isCheckboxDisabled(produto);

                        return (
                          <TableRow
                            key={produto.id}
                            onClick={() => !isDisabled && toggleItemPedido(produto.id)}
                            className={`transition-all duration-200 ${isDisabled
                              ? "opacity-50 bg-muted/20 cursor-not-allowed"
                              : isSelected
                                ? "bg-primary/5 hover:bg-primary/10 cursor-pointer"
                                : "hover:bg-muted/50 cursor-pointer"
                              }`}
                          >
                            <TableCell>
                              <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${isDisabled ? 'border-muted-foreground/30 bg-muted/50' :
                                isSelected ? 'bg-primary border-primary text-primary-foreground' : 'border-input bg-background'
                                }`}>
                                {isSelected && (
                                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="w-3 h-3"><polyline points="20 6 9 17 4 12"></polyline></svg>
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="font-medium">{produto.nome}</TableCell>
                            <TableCell>
                              {produto.estoque_atual} {produto.unidade_medida}
                            </TableCell>
                            <TableCell>
                              {produto.quantidade_minima} {produto.unidade_medida}
                            </TableCell>
                            <TableCell>
                              <Badge variant="destructive">Baixo</Badge>
                            </TableCell>
                            <TableCell onClick={(e) => e.stopPropagation()}>
                              {isSelected ? (
                                <Input
                                  type="number"
                                  className="h-8 w-20 text-center"
                                  value={pedidoForm.quantidades_personalizadas[produto.id] !== undefined ? pedidoForm.quantidades_personalizadas[produto.id] : Math.max(produto.quantidade_minima - produto.estoque_atual, 5)}
                                  onChange={(e) => setPedidoForm(prev => ({
                                    ...prev,
                                    quantidades_personalizadas: {
                                      ...prev.quantidades_personalizadas,
                                      [produto.id]: e.target.value
                                    }
                                  }))}
                                  min="1"
                                />
                              ) : (
                                <span className="text-muted-foreground opacity-50">-</span>
                              )}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Gerar Pedido */}
          <Card className="bg-card shadow-elegant-md border-0 rounded-xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="h-5 w-5 text-primary" />
                Gerar Pedido de Compra
              </CardTitle>
              <CardDescription>
                Criar novo pedido baseado no estoque baixo ou personalizado
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="fornecedor">Fornecedor *</Label>
                <Select value={pedidoForm.fornecedor_id} onValueChange={handleFornecedorChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um fornecedor" />
                  </SelectTrigger>
                  <SelectContent>
                    {fornecedores.map((fornecedor) => (
                      <SelectItem key={fornecedor.id} value={fornecedor.id}>
                        {fornecedor.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="observacoes">Observações</Label>
                <Textarea
                  id="observacoes"
                  value={pedidoForm.observacoes}
                  onChange={(e) => setPedidoForm({ ...pedidoForm, observacoes: e.target.value })}
                  placeholder="Observações adicionais para o pedido..."
                  className="min-h-20"
                />
              </div>

              <div className="flex items-center gap-2 p-3 rounded-xl bg-blue-50 border border-blue-200">
                <Clock className="h-4 w-4 text-blue-600" />
                <p className="text-sm text-blue-700">
                  {pedidoForm.itens_selecionados.length > 0
                    ? `${pedidoForm.itens_selecionados.length} itens selecionados`
                    : `Todos os ${produtosBaixos.length} produtos com estoque baixo serão incluídos`
                  }
                </p>
              </div>

              <Button
                onClick={handleGerarPedido}
                disabled={loading || produtosBaixos.length === 0}
                className="w-full bg-primary hover:bg-primary/90"
              >
                {loading ? "Gerando..." : "Gerar Requisito de Pedido"}
              </Button>
            </CardContent>
          </Card>

          {pedidosRegistrados.length > 0 && (
            <Card className="bg-card shadow-elegant-md border-0 rounded-xl mt-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-primary" />
                  Histórico de Pedidos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="rounded-xl border overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Data</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Setor</TableHead>
                        <TableHead>Observações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {pedidosRegistrados.map((ped) => (
                        <TableRow key={ped.id}>
                          <TableCell className="font-medium text-xs">
                            {new Date(ped.data_pedido).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            <Badge variant={ped.status === 'pendente' ? 'secondary' : 'outline'}>{ped.status?.toUpperCase()}</Badge>
                          </TableCell>
                          <TableCell>{ped.setor}</TableCell>
                          <TableCell>{ped.observacoes || "-"}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="fornecedores" className="space-y-6">
          {/* Cadastro de Fornecedor */}
          <Card className="bg-card shadow-elegant-md border-0 rounded-xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="h-5 w-5 text-primary" />
                Cadastrar Fornecedor
              </CardTitle>
              <CardDescription>
                Adicionar novo fornecedor ao sistema
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="nome_fornecedor">Nome do Fornecedor *</Label>
                  <Input
                    id="nome_fornecedor"
                    value={fornecedorForm.nome}
                    onChange={(e) => setFornecedorForm({ ...fornecedorForm, nome: e.target.value })}
                    placeholder="Ex: Distribuidora ABC"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="contato">Contato *</Label>
                  <Input
                    id="contato"
                    value={fornecedorForm.contato}
                    onChange={(e) => setFornecedorForm({ ...fornecedorForm, contato: e.target.value })}
                    placeholder="Telefone, email ou WhatsApp"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="condicoes_pagamento">Condições de Pagamento</Label>
                  <Input
                    id="condicoes_pagamento"
                    value={fornecedorForm.condicoes_pagamento}
                    onChange={(e) => setFornecedorForm({ ...fornecedorForm, condicoes_pagamento: e.target.value })}
                    placeholder="Ex: 30 dias"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="prazo_entrega">Prazo de Entrega</Label>
                  <Input
                    id="prazo_entrega"
                    value={fornecedorForm.prazo_entrega}
                    onChange={(e) => setFornecedorForm({ ...fornecedorForm, prazo_entrega: e.target.value })}
                    placeholder="Ex: 2-3 dias úteis"
                  />
                </div>
              </div>

              <Button
                onClick={handleCadastroFornecedor}
                disabled={loading}
                className="w-full bg-success hover:bg-success/90"
              >
                {loading ? "Cadastrando..." : "Cadastrar Fornecedor"}
              </Button>
            </CardContent>
          </Card>

          {/* Lista de Fornecedores */}
          <Card className="bg-card shadow-elegant-md border-0 rounded-xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                Fornecedores Cadastrados
              </CardTitle>
              <CardDescription>
                Lista de fornecedores ativos no sistema
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-xl border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>Contato</TableHead>
                      <TableHead>Pagamento</TableHead>
                      <TableHead>Entrega</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {fornecedores.map((fornecedor) => (
                      <TableRow key={fornecedor.id}>
                        <TableCell className="font-medium">{fornecedor.nome}</TableCell>
                        <TableCell>{fornecedor.contato}</TableCell>
                        <TableCell>{fornecedor.condicoes_pagamento}</TableCell>
                        <TableCell>{fornecedor.prazo_entrega}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}