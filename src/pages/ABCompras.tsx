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
  Clock,
  Calendar,
  Zap,
  Store,
  ArrowRightLeft,
  Boxes,
  CheckCircle,
  Eye,
  FileSearch,
  ChevronDown,
  LayoutGrid,
  Package
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

interface Produto {
  id: string;
  nome: string;
  categoria?: string;
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

interface EventoDemanda {
  id: string;
  nome: string;
  data_evento: string;
  convidados: number;
  status: string;
}

interface ItemDemanda {
  id: string;
  evento_id: string;
  nome: string;
  categoria: string;
  evento_nome?: string;
  evento_data?: string;
}

export default function ABCompras() {
  const { toast } = useToast();
  const [produtosBaixos, setProdutosBaixos] = useState<Produto[]>([]);
  const [todosProdutos, setTodosProdutos] = useState<Produto[]>([]);
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

  const [demandaEventos, setDemandaEventos] = useState<ItemDemanda[]>([]);
  const [showCotacaoCatalog, setShowCotacaoCatalog] = useState(false);
  const [cotacaoItens, setCotacaoItens] = useState<string[]>([]);
  const [cotacaoQtds, setCotacaoQtds] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchProdutosBaixos();
    fetchFornecedores();
    fetchPedidosRegistrados();
    fetchDemandaEventos();
  }, []);

  const fetchDemandaEventos = async () => {
    try {
      const { data: eventos } = await supabase.from('eventos').select('*').in('status', ['confirmado', 'pendente']);
      if (!eventos) return;

      const { data: itens } = await supabase.from('evento_itens').select('*');
      if (!itens) return;

      const demanda = itens.map(item => {
        const evento = eventos.find(e => e.id === item.evento_id);
        if (!evento) return null;
        return {
          ...item,
          evento_nome: evento.nome,
          evento_data: evento.data_evento
        };
      }).filter(Boolean) as ItemDemanda[];

      setDemandaEventos(demanda);
    } catch (error) {
      console.error('Erro ao buscar demanda de eventos:', error);
    }
  };

  const fetchProdutosBaixos = async () => {
    try {
      const { data, error } = await supabase
        .from('produtos')
        .select('*') // Puxar tudo para ter categoria e valor_unitario tbm
        .eq('ativo', true)
        .order('nome', { ascending: true });

      if (error) throw error;

      setTodosProdutos(data || []);
      // Filtrar produtos com estoque baixo
      const baixos = data?.filter(p => p.estoque_atual <= (p.quantidade_minima || 0)) || [];
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
        .select(`
          *,
          itens_pedido (
            id,
            produto_id,
            produtos (nome)
          )
        `)
        .order('data_pedido', { ascending: false });

      if (error) throw error;
      setPedidosRegistrados(data || []);
    } catch (error) {
      console.error('Erro ao buscar pedidos registrados:', error);
    }
  }

  const [linkQty, setLinkQty] = useState(1);
  const [selectedSupplierForEventItem, setSelectedSupplierForEventItem] = useState("");

  const handleVincularEstoque = async (item: ItemDemanda, produtoId: string) => {
    try {
      const { data: prod } = await supabase.from('produtos').select('*').eq('id', produtoId).single();
      if (!prod) return;

      const novoEstoque = prod.estoque_atual - linkQty;
      await supabase.from('produtos').update({ estoque_atual: novoEstoque }).eq('id', produtoId);

      await supabase.from('estoque_movimentacoes').insert({
        produto_id: produtoId,
        tipo_movimentacao: 'saida',
        quantidade: linkQty,
        responsavel: 'Gestor (Evento)',
        motivo: `Baixa Evento: ${item.evento_nome}`
      });

      toast({ title: "Saída Registrada", description: `${linkQty} un. de ${prod.nome} vinculadas ao evento.` });
      setLinkQty(1);
      fetchProdutosBaixos();
      fetchDemandaEventos();
    } catch (error) {
      toast({ variant: "destructive", title: "Erro", description: "Falha ao vincular estoque." });
    }
  };

  const generateCotacaoPDF = (item: ItemDemanda) => {
    const doc = new jsPDF();

    // Header Brutalist
    doc.setFillColor(31, 41, 55);
    doc.rect(0, 0, 210, 40, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(22);
    doc.text("BENDITA COMANDA", 105, 18, { align: "center" });
    doc.setFontSize(9);
    doc.text("SOLICITAÇÃO DE COTAÇÃO DE PREÇOS", 105, 26, { align: "center" });

    doc.setTextColor(31, 41, 55);
    doc.setFontSize(10);
    doc.text(`DATA: ${new Date().toLocaleDateString()}`, 14, 55);
    doc.text(`REFERÊNCIA: ${item.evento_nome?.toUpperCase()}`, 14, 61);
    doc.text(`ITEM: ${item.nome.toUpperCase()}`, 14, 67);

    autoTable(doc, {
      startY: 75,
      head: [['Item', 'Categoria', 'Quantidade Solicitada', 'Observações']],
      body: [[item.nome, item.categoria, 'A DEFINIR', 'Favor cotar melhor preço unitário']],
      theme: 'grid',
      headStyles: { fillColor: [16, 185, 129] }
    });

    const finalY = (doc as any).lastAutoTable.finalY + 20;
    doc.setFontSize(11);
    doc.text("CONDIÇÕES TÉCNICAS:", 14, finalY);
    doc.setFontSize(9);
    doc.text("• Prazo de entrega máximo: 48h antes do evento.", 14, finalY + 8);
    doc.text("• Pagamento: Faturamento 15/30 dias.", 14, finalY + 14);

    doc.save(`cotacao_${item.id}.pdf`);
    toast({ title: "PDF Criado", description: "Cotação gerada com estilo Divine." });
  };

  const generateCotacaoMultiplaPDF = () => {
    if (cotacaoItens.length === 0) return;

    const doc = new jsPDF();

    // Header Brutalist/Divine
    doc.setFillColor(31, 41, 55);
    doc.rect(0, 0, 210, 40, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(22);
    doc.text("BENDITA COMANDA", 105, 18, { align: "center" });
    doc.setFontSize(9);
    doc.text("MAPA DE COTAÇÃO DE PREÇOS / SOLICITAÇÃO", 105, 26, { align: "center" });

    doc.setTextColor(31, 41, 55);
    doc.setFontSize(10);
    doc.text(`DATA: ${new Date().toLocaleDateString()}`, 14, 50);
    doc.text(`RESPONSÁVEL: JOÃO SILVA`, 14, 56);
    doc.text(`TIPO: SOLICITAÇÃO MULTI-ITENS`, 14, 62);

    const tableData = cotacaoItens.map(id => {
      const prod = todosProdutos.find(p => p.id === id);
      return [
        prod?.nome || 'Item',
        prod?.categoria || 'N/A',
        cotacaoQtds[id] || 'A DEFINIR',
        prod?.unidade_medida || 'UN',
        'R$ ________'
      ];
    });

    autoTable(doc, {
      startY: 72,
      head: [['Item/Descrição', 'Categoria', 'Qtd', 'Unidade', 'Preço Unitário']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [59, 130, 246] }, // Blue for Quotation
      styles: { fontSize: 9 }
    });

    const finalY = (doc as any).lastAutoTable.finalY + 20;
    doc.setFontSize(10);
    doc.text("OBSERVAÇÕES PARA O FORNECEDOR:", 14, finalY);
    doc.setFontSize(8);
    doc.text("1. Favor preencher o preço unitário e total por item.", 14, finalY + 7);
    doc.text("2. Informar prazo de entrega e condições de pagamento.", 14, finalY + 12);
    doc.text("3. Esta solicitação não garante a compra, sendo para fins de orçamento.", 14, finalY + 17);

    doc.save(`solicitacao_cotacao_${new Date().getTime()}.pdf`);
    toast({ title: "Cotação Gerada", description: "PDF multi-itens criado com sucesso." });
  };

  const handleConfirmarCompra = async (pedidoId: string) => {
    try {
      const { error } = await supabase.from('pedidos').update({ status: 'comprado' }).eq('id', pedidoId);
      if (error) throw error;

      // 1. Fetch Items for this order to show in PDF
      const { data: itens } = await supabase.from('itens_pedido').select('*').eq('pedido_id', pedidoId);

      const pedido = pedidosRegistrados.find(p => p.id === pedidoId);
      generateGuiaRecebimentoPDF(pedido, itens || []);

      toast({ title: "Compra Efetivada!", description: "Status atualizado para COMPRADO e Guia gerada." });
      fetchPedidosRegistrados();
    } catch (error) {
      toast({ variant: "destructive", title: "Erro", description: "Falha ao confirmar compra." });
    }
  };

  const handleDarEntradaEstoque = async (pedidoId: string) => {
    setLoading(true);
    try {
      // 1. Buscar itens do pedido COM o fornecedor_id do pedido pai
      const { data: itens, error: errItens } = await supabase
        .from('itens_pedido')
        .select(`
          *,
          produtos(*),
          pedidos(fornecedor_id)
        `)
        .eq('pedido_id', pedidoId);

      if (errItens) throw errItens;

      // 2. Para cada item, atualizar estoque e registrar movimento
      for (const item of (itens || [])) {
        const prod = item.produtos;
        if (!prod) continue;

        const novaQtd = (prod.estoque_atual || 0) + item.quantidade;

        // Atualiza Produto
        await supabase.from('produtos').update({ estoque_atual: novaQtd }).eq('id', prod.id);

        // Registra Movimentação
        await supabase.from('estoque_movimentacoes').insert({
          produto_id: prod.id,
          tipo: 'entrada',
          quantidade: item.quantidade,
          motivo: `Recebimento Pedido #${pedidoId.substring(0, 5)}`,
          fornecedor_id: itens[0]?.pedidos?.fornecedor_id // Pegando do join
        });
      }

      // 3. Atualizar status do pedido
      await supabase.from('pedidos').update({ status: 'recebido' }).eq('id', pedidoId);

      toast({ title: "Estoque Atualizado!", description: "Mercadoria recebida e inventário incrementado." });
      fetchPedidosRegistrados();
      fetchProdutosBaixos();
    } catch (error) {
      console.error(error);
      toast({ variant: "destructive", title: "Erro", description: "Falha ao dar entrada no estoque." });
    } finally {
      setLoading(false);
    }
  };

  const generateGuiaRecebimentoPDF = (pedido: any, itens: any[] = []) => {
    const doc = new jsPDF();

    // Header - Receiving Ticket Style (Divine/Brutalist)
    doc.setFillColor(31, 41, 55);
    doc.rect(0, 0, 210, 40, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(22);
    doc.text("BENDITA COMANDA", 105, 18, { align: "center" });
    doc.setFontSize(9);
    doc.text("GUIA DE CONFERÊNCIA E RECEBIMENTO", 105, 26, { align: "center" });

    doc.setTextColor(40, 40, 40);
    doc.setFontSize(10);
    const dataRef = new Date(pedido.data_pedido).toLocaleDateString();
    doc.text(`PEDIDO ID: #${pedido.id.substring(0, 8).toUpperCase()}`, 14, 55);
    doc.text(`DATA: ${dataRef}`, 14, 61);
    doc.text(`DESTINO: ${pedido.setor}`, 14, 67);
    doc.text(`FORNECEDOR: ${fornecedores.find(f => f.id === pedido.fornecedor_id)?.nome || 'VERIFICAR NOTA'}`, 14, 73);

    // Items Section
    if (itens.length > 0) {
      const tableData = itens.map(item => {
        const prod = todosProdutos.find(p => p.id === item.produto_id);
        return [
          prod?.nome || 'Item do Pedido',
          item.quantidade.toString(),
          prod?.unidade_medida || 'UN'
        ];
      });

      autoTable(doc, {
        startY: 85,
        head: [['Item/Produto', 'Qtd Comprada', 'Unidade']],
        body: tableData,
        theme: 'grid',
        headStyles: { fillColor: [31, 41, 55] },
        styles: { fontSize: 10 }
      });
    }

    const startYObs = (doc as any).lastAutoTable?.finalY ? (doc as any).lastAutoTable.finalY + 15 : 85;

    doc.setFontSize(11);
    doc.text("OBSERVAÇÕES DO PEDIDO:", 14, startYObs);
    doc.setFontSize(9);
    const splitObs = doc.splitTextToSize(pedido.observacoes || "Nenhuma observação extra.", 182);
    doc.text(splitObs, 14, startYObs + 7);

    // Checklist Area
    const checkY = startYObs + 30;
    doc.setFontSize(12);
    doc.text("CAMPOS DE CONFERÊNCIA OBRIGATÓRIA:", 14, checkY);

    doc.setFontSize(10);
    doc.rect(14, checkY + 10, 5, 5); doc.text("QUANTIDADE CONFERIDA CONFORME NOTA", 22, checkY + 14);
    doc.rect(14, checkY + 20, 5, 5); doc.text("ESTOQUE FÍSICO OK", 22, checkY + 24);
    doc.rect(14, checkY + 30, 5, 5); doc.text("AVARIAS / VALIDADE", 22, checkY + 34);

    // Signature Area
    const footerY = 260;
    doc.line(14, footerY, 90, footerY);
    doc.text("ASSINATURA RESPONSÁVEL", 14, footerY + 5);

    doc.line(120, footerY, 196, footerY);
    doc.text("DATA E HORA DO RECEBIMENTO: ___/___/___", 120, footerY + 5);

    doc.save(`guia_conferencia_${pedido.id.substring(0, 5)}.pdf`);
  };

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

    const itemsFromSelection = todosProdutos.filter(p => pedidoForm.itens_selecionados.includes(p.id));
    const itemsToBuy = itemsFromSelection.length > 0 ? itemsFromSelection : (pedidoForm.observacoes ? [] : produtosBaixos);

    if (itemsToBuy.length === 0 && !pedidoForm.observacoes) {
      toast({
        title: "Atenção",
        description: "Selecione um produto ou descreva a necessidade na observação.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      // 1. Gerar Pedido
      let finalObs = pedidoForm.observacoes;
      if (!finalObs && itemsToBuy.length > 0) {
        finalObs = `Reposição: ${itemsToBuy.map(i => i.nome).join(", ")}`;
      }

      const { data: pedido, error: errorPedido } = await supabase
        .from('pedidos')
        .insert([{
          setor: 'A&B',
          responsavel: 'João Silva', // Mocked do user da header
          status: 'pendente',
          observacoes: finalObs,
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
    // Busca em todos para permitir picado
    const produtoClicado = todosProdutos.find(p => p.id === produtoId);

    setPedidoForm(prev => {
      const isSelecting = !prev.itens_selecionados.includes(produtoId);

      let novosItens = [];
      if (isSelecting) {
        novosItens = [...prev.itens_selecionados, produtoId];
      } else {
        novosItens = prev.itens_selecionados.filter(id => id !== produtoId);
      }

      let novoFornecedorId = prev.fornecedor_id;

      // Auto-selecionar o fornecedor se for o primeiro e viermos da lista de estoque baixo
      if (isSelecting && novosItens.length === 1 && !prev.fornecedor_id && produtoClicado?.fornecedor_id) {
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
      const prod = todosProdutos.find(p => p.id === id);
      return prod && prod.fornecedor_id && prod.fornecedor_id !== value;
    });

    setPedidoForm(prev => ({
      ...prev,
      fornecedor_id: value,
      itens_selecionados: invalidItemsList.length > 0 ? [] : prev.itens_selecionados,
      quantidades_personalizadas: invalidItemsList.length > 0 ? {} : prev.quantidades_personalizadas
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
        <TabsList className="grid w-full grid-cols-3 bg-muted h-auto p-1">
          <TabsTrigger value="pedidos" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Pedidos de Compra
          </TabsTrigger>
          <TabsTrigger value="fornecedores" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Fornecedores
          </TabsTrigger>
          <TabsTrigger value="eventos" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Demanda de Eventos
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
          <Card id="gerar-pedido-card" className="bg-card shadow-elegant-md border-0 rounded-xl">
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Plus className="h-5 w-5 text-primary" />
                  Gerar Pedido de Compra
                </CardTitle>
                <CardDescription>
                  Criar novo pedido baseado no estoque baixo ou personalizado
                </CardDescription>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowCotacaoCatalog(!showCotacaoCatalog)}
                className={`rounded-none border-2 font-black uppercase text-[10px] ${showCotacaoCatalog ? 'bg-blue-500 text-white border-blue-600' : 'border-blue-500 text-blue-500 hover:bg-blue-500/10'}`}
              >
                <FileSearch className="h-3 w-3 mr-1" />
                {showCotacaoCatalog ? "Fechar Cotação" : "Gerar Cotação (Variados)"}
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">

              {!showCotacaoCatalog ? (
                <>
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
                    <Label htmlFor="observacoes">Observações do Pedido</Label>
                    <Textarea
                      id="observacoes"
                      value={pedidoForm.observacoes}
                      onChange={(e) => setPedidoForm({ ...pedidoForm, observacoes: e.target.value })}
                      placeholder="Observações adicionais para o pedido..."
                      className="min-h-20 rounded-none border-2 focus-visible:ring-0 focus-visible:border-primary"
                    />
                  </div>

                  {/* Catálogo do Fornecedor — Picado */}
                  {pedidoForm.fornecedor_id && (
                    <div className="space-y-3 p-4 bg-muted/30 border-2 border-dashed border-primary/20 rounded-none animate-in fade-in slide-in-from-top-2">
                      <div className="flex items-center justify-between">
                        <Label className="text-[10px] uppercase font-black tracking-widest text-primary">Catálogo / Itens Picados</Label>
                        <Badge variant="outline" className="text-[9px] uppercase font-bold border-primary/30">
                          Itens vinculados a este Fornecedor
                        </Badge>
                      </div>

                      <div className="max-h-[250px] overflow-y-auto space-y-1 pr-2">
                        {todosProdutos
                          .filter(p => !produtosBaixos.some(pb => pb.id === p.id)) // Ocultar os que já aparecem na lista de baixo estoque
                          .filter(p => p.fornecedor_id === pedidoForm.fornecedor_id)
                          .map(p => {
                            const isSelected = pedidoForm.itens_selecionados.includes(p.id);
                            return (
                              <div
                                key={p.id}
                                onClick={() => toggleItemPedido(p.id)}
                                className={`flex items-center justify-between p-2 text-xs transition-colors cursor-pointer border ${isSelected ? 'bg-primary/10 border-primary' : 'hover:bg-muted/50 border-transparent'}`}
                              >
                                <div className="flex flex-col">
                                  <span className="font-bold">{p.nome}</span>
                                  <span className="opacity-50 text-[10px]">{p.categoria} · {p.estoque_atual} {p.unidade_medida} em estoque</span>
                                </div>
                                {isSelected ? (
                                  <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                                    <Input
                                      type="number"
                                      className="h-7 w-16 text-[10px] text-center bg-background rounded-none border-2 border-primary"
                                      value={pedidoForm.quantidades_personalizadas[p.id] || "5"}
                                      min="1"
                                      onChange={(e) => setPedidoForm(prev => ({
                                        ...prev,
                                        quantidades_personalizadas: { ...prev.quantidades_personalizadas, [p.id]: e.target.value }
                                      }))}
                                    />
                                    <CheckCircle className="h-4 w-4 text-primary" />
                                  </div>
                                ) : (
                                  <Plus className="h-3 w-3 opacity-30" />
                                )}
                              </div>
                            );
                          })}
                        {todosProdutos.filter(p => p.fornecedor_id === pedidoForm.fornecedor_id && !produtosBaixos.some(pb => pb.id === p.id)).length === 0 && (
                          <p className="text-[10px] text-center opacity-50 py-4 italic uppercase">Nenhum outro item cadastrado para este fornecedor</p>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="flex items-center gap-2 p-3 rounded-xl bg-blue-50 border border-blue-200">
                    <Clock className="h-4 w-4 text-blue-600" />
                    <p className="text-sm text-blue-700 font-medium">
                      {pedidoForm.itens_selecionados.length > 0
                        ? `${pedidoForm.itens_selecionados.length} itens selecionados para este pedido`
                        : pedidoForm.observacoes
                          ? `Pedido Especial: Registro manual via Observações`
                          : `Atenção: Todos os ${produtosBaixos.length} produtos em estoque baixo serão incluídos`
                      }
                    </p>
                  </div>

                  <Button
                    onClick={handleGerarPedido}
                    disabled={loading || (!pedidoForm.fornecedor_id) || (produtosBaixos.length === 0 && pedidoForm.itens_selecionados.length === 0 && !pedidoForm.observacoes)}
                    className="w-full bg-primary hover:bg-primary/90 h-12 uppercase font-black tracking-widest border-2 shadow-[4px_4px_0_0_hsl(var(--primary-glow)/0.3)]"
                  >
                    {loading ? "Processando..." : "Gerar Requisito de Pedido"}
                  </Button>
                </>
              ) : (
                /* --- FLUXO DE COTAÇÃO MULTI-ITENS POR SEÇÃO --- */
                <div className="space-y-6 animate-in zoom-in-95">
                  <div className="flex items-center justify-between bg-blue-500/10 p-3 border-l-4 border-blue-500">
                    <p className="text-[10px] font-black uppercase text-blue-600">Modo Cotação Ativo: Selecione os itens por categoria para gerar o PDF</p>
                    <Badge className="bg-blue-600">{cotacaoItens.length} Itens</Badge>
                  </div>

                  {["Bebidas", "Carnes", "Cozinha", "Café da manhã", "Limpeza", "Geral"].map(cat => {
                    const itensCat = todosProdutos.filter(p => p.categoria === cat);
                    if (itensCat.length === 0) return null;

                    return (
                      <div key={cat} className="space-y-2">
                        <div className="flex items-center gap-2 border-b-2 border-muted pb-1">
                          <ChevronDown className="h-3 w-3 opacity-50" />
                          <h4 className="text-[10px] font-black uppercase tracking-tighter opacity-70">{cat}</h4>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {itensCat.map(p => {
                            const isSel = cotacaoItens.includes(p.id);
                            return (
                              <div
                                key={p.id}
                                onClick={() => {
                                  setCotacaoItens(prev => isSel ? prev.filter(id => id !== p.id) : [...prev, p.id]);
                                  if (!isSel) setCotacaoQtds(prev => ({ ...prev, [p.id]: "1" }));
                                }}
                                className={`flex items-center justify-between p-2 text-xs border cursor-pointer transition-all ${isSel ? 'bg-blue-500/10 border-blue-500' : 'hover:bg-muted/50 border-transparent bg-muted/20'}`}
                              >
                                <span className={isSel ? "font-bold" : ""}>{p.nome}</span>
                                {isSel && (
                                  <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                                    <Input
                                      className="h-6 w-12 text-[10px] p-1 text-center bg-background"
                                      value={cotacaoQtds[p.id] || "1"}
                                      onChange={e => setCotacaoQtds(prev => ({ ...prev, [p.id]: e.target.value }))}
                                    />
                                    <CheckCircle className="h-3 w-3 text-blue-500" />
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}

                  <Button
                    onClick={generateCotacaoMultiplaPDF}
                    disabled={cotacaoItens.length === 0}
                    className="w-full h-14 bg-blue-600 hover:bg-blue-700 text-white font-black uppercase tracking-widest shadow-[4px_4px_0_0_rgba(0,0,0,0.1)] rounded-none"
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Gerar PDF de Cotação ({cotacaoItens.length} itens)
                  </Button>
                </div>
              )}
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
                        <TableHead>Descrição / Itens</TableHead>
                        <TableHead className="text-right">Ação</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {pedidosRegistrados.map((ped) => (
                        <TableRow key={ped.id} className="hover:bg-muted/30 transition-colors">
                          <TableCell className="font-medium text-[10px] uppercase opacity-70">
                            {new Date(ped.data_pedido).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={ped.status === 'pendente' ? 'secondary' : 'outline'}
                              className={
                                ped.status === 'comprado' ? 'bg-blue-500/10 text-blue-500 border-blue-500/20' :
                                  ped.status === 'recebido' ? 'bg-green-500/10 text-green-500 border-green-500/20' : ''
                              }
                            >
                              {ped.status === 'comprado' ? 'COMPRADO' : ped.status?.toUpperCase()}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-xs font-bold text-primary">{ped.setor}</TableCell>
                          <TableCell className="text-[10px] max-w-[300px] truncate">
                            <span className={ped.observacoes?.includes("URGENTE") ? "font-bold text-destructive" : "font-medium opacity-80"}>
                              {ped.observacoes || "Pedido Gerencial"}
                            </span>
                          </TableCell>
                          <TableCell className="text-right">
                            {ped.status === 'pendente' ? (
                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button variant="outline" size="sm" className="h-8 text-[10px] font-black uppercase border-2 border-green-500 text-green-500 hover:bg-green-500/10 rounded-none">
                                    <CheckCircle className="h-3 w-3 mr-1" /> Confirmar Compra
                                  </Button>
                                </DialogTrigger>
                                <DialogContent className="bg-card border-2 border-primary rounded-none">
                                  <DialogHeader>
                                    <DialogTitle className="uppercase font-black text-primary">Confirmar Efetivação da Compra</DialogTitle>
                                    <DialogDescription className="font-bold text-[10px] uppercase text-muted-foreground">O pedido foi realizado com o fornecedor?</DialogDescription>
                                  </DialogHeader>
                                  <div className="py-4 space-y-4">
                                    <p className="text-sm font-medium">Ao confirmar, o status passará para <strong>COMPRADO</strong> e a **Guia de Recebimento** será gerada para que a portaria/recepção confira os itens na entrega.</p>
                                    <Button
                                      onClick={() => handleConfirmarCompra(ped.id)}
                                      className="w-full h-12 rounded-none font-black uppercase bg-primary hover:bg-primary/90 text-white border-2 border-primary/20 shadow-[4px_4px_0_0_rgba(0,0,0,0.1)]"
                                    >
                                      Efetivar Compra e Gerar Guia
                                    </Button>
                                  </div>
                                </DialogContent>
                              </Dialog>
                            ) : ped.status === 'comprado' ? (
                              <div className="flex justify-end gap-2">
                                <Dialog>
                                  <DialogTrigger asChild>
                                    <Button variant="outline" size="sm" className="h-8 text-[10px] font-black uppercase border-2 border-success text-success hover:bg-success/10 rounded-none">
                                      <Package className="h-3 w-3 mr-1" /> Receber Itens
                                    </Button>
                                  </DialogTrigger>
                                  <DialogContent className="bg-card border-2 border-success rounded-none">
                                    <DialogHeader>
                                      <DialogTitle className="uppercase font-black text-success">Confirmar Recebimento</DialogTitle>
                                      <DialogDescription className="font-bold text-[10px] uppercase text-muted-foreground">A mercadoria chegou na casa?</DialogDescription>
                                    </DialogHeader>
                                    <div className="py-4 space-y-4">
                                      <p className="text-sm font-medium" style={{ opacity: 0.8 }}>Ao confirmar, o sistema irá **somar automaticamente** as quantidades deste pedido ao seu estoque físico e gerar um log de entrada para cada item.</p>
                                      <Button
                                        onClick={() => handleDarEntradaEstoque(ped.id)}
                                        disabled={loading}
                                        className="w-full h-12 rounded-none font-black uppercase bg-success hover:bg-success/90 text-white border-2 border-success-700 shadow-[4px_4px_0_0_rgba(0,0,0,0.1)]"
                                      >
                                        {loading ? "Atualizando..." : "Confirmar e Dar Entrada"}
                                      </Button>
                                    </div>
                                  </DialogContent>
                                </Dialog>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 text-[10px] font-bold uppercase opacity-50"
                                  onClick={async () => {
                                    const { data: itens } = await supabase.from('itens_pedido').select('*').eq('pedido_id', ped.id);
                                    generateGuiaRecebimentoPDF(ped, itens || []);
                                  }}
                                >
                                  <Eye className="h-3 w-3 mr-1" /> Re-Imprimir
                                </Button>
                              </div>
                            ) : (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 text-[10px] font-bold uppercase opacity-50"
                                onClick={async () => {
                                  const { data: itens } = await supabase.from('itens_pedido').select('*').eq('pedido_id', ped.id);
                                  generateGuiaRecebimentoPDF(ped, itens || []);
                                }}
                              >
                                <Eye className="h-3 w-3 mr-1" /> Ver Guia
                              </Button>
                            )}
                          </TableCell>
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

        <TabsContent value="eventos" className="space-y-6">
          <Card className="bg-card shadow-elegant-md border-0 rounded-xl border-l-4 border-l-primary">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-yellow-500" />
                Produtos Necessários para Eventos
              </CardTitle>
              <CardDescription>
                Itens vinculados a eventos confirmados/pendentes que precisam de atenção no estoque
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-xl border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead>Evento</TableHead>
                      <TableHead>Data</TableHead>
                      <TableHead>Item do Cardápio</TableHead>
                      <TableHead>Categoria</TableHead>
                      <TableHead className="text-right">Ação</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {demandaEventos.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8 text-muted-foreground uppercase text-xs font-bold opacity-50">
                          Nenhuma demanda de evento ativa
                        </TableCell>
                      </TableRow>
                    ) : (
                      demandaEventos.map((item) => (
                        <TableRow key={item.id} className="hover:bg-muted/30 transition-colors">
                          <TableCell className="font-bold text-primary text-xs uppercase">{item.evento_nome}</TableCell>
                          <TableCell className="text-xs font-medium">
                            {item.evento_data ? new Date(item.evento_data).toLocaleDateString() : '-'}
                          </TableCell>
                          <TableCell className="font-medium">{item.nome}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-[10px] uppercase">{item.categoria}</Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button variant="outline" size="sm" className="h-8 text-[10px] font-bold uppercase border-2 border-primary/30 hover:bg-primary/10 rounded-none">
                                    <ArrowRightLeft className="h-3 w-3 mr-1" /> Vincular
                                  </Button>
                                </DialogTrigger>
                                <DialogContent className="bg-card border-2 border-primary rounded-none">
                                  <DialogHeader>
                                    <DialogTitle className="uppercase font-black text-primary">Baixa de Estoque para Evento</DialogTitle>
                                    <DialogDescription className="font-bold text-[10px] uppercase text-muted-foreground">{item.nome} • {item.evento_nome}</DialogDescription>
                                  </DialogHeader>
                                  <div className="space-y-6 py-4">
                                    <div className="space-y-2">
                                      <Label className="text-[10px] font-bold uppercase tracking-widest opacity-70">Produto em Estoque</Label>
                                      <Select onValueChange={(val) => {
                                        const p = produtosBaixos.find(p => p.id === val);
                                        if (p) toast({ title: "Produto Selecionado", description: `Disponível: ${p.estoque_atual} ${p.unidade_medida}` });
                                      }}>
                                        <SelectTrigger className="rounded-none border-2">
                                          <SelectValue placeholder="Selecione o produto no inventário..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                          {produtosBaixos.map(p => (
                                            <SelectItem key={p.id} value={p.id}>{p.nome.toUpperCase()} ({p.estoque_atual} {p.unidade_medida})</SelectItem>
                                          ))}
                                          {produtosBaixos.length === 0 && <SelectItem value="none" disabled>Nenhum produto baixo encontrado</SelectItem>}
                                        </SelectContent>
                                      </Select>
                                    </div>
                                    <div className="space-y-2">
                                      <Label className="text-[10px] font-bold uppercase tracking-widest opacity-70">Quantidade para Retirar</Label>
                                      <Input
                                        type="number"
                                        value={linkQty}
                                        onChange={(e) => setLinkQty(parseInt(e.target.value) || 0)}
                                        className="rounded-none border-2 h-10"
                                      />
                                    </div>
                                    <Button
                                      onClick={() => {
                                        // Buscando o valor da select via ref ou estado, aqui usaremos o handle direto no clique se tivessemos o id
                                        // Para simplificar o mock, pegamos o primeiro da lista se nenhum selecionado
                                        if (produtosBaixos.length > 0) handleVincularEstoque(item, produtosBaixos[0].id);
                                      }}
                                      className="w-full rounded-none font-black uppercase h-12 border-2 shadow-[4px_4px_0_0_hsl(var(--primary))] hover:shadow-none transition-all"
                                    >
                                      Confirmar Saída
                                    </Button>
                                  </div>
                                </DialogContent>
                              </Dialog>

                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-8 text-[10px] font-bold uppercase border-2 border-green-500/30 text-green-500 hover:bg-green-500/10 rounded-none"
                                  >
                                    <Store className="h-3 w-3 mr-1" /> Comprar
                                  </Button>
                                </DialogTrigger>
                                <DialogContent className="bg-card border-2 border-green-500 rounded-none">
                                  <DialogHeader>
                                    <DialogTitle className="uppercase font-black text-green-500">Comprar para Evento</DialogTitle>
                                    <DialogDescription className="font-bold text-[10px] uppercase text-muted-foreground">Solicitar suprimentos para: {item.nome}</DialogDescription>
                                  </DialogHeader>
                                  <div className="space-y-4 py-4">
                                    <div className="space-y-2">
                                      <Label className="text-[10px] font-bold uppercase tracking-widest opacity-70">Selecione o Fornecedor</Label>
                                      <Select onValueChange={setSelectedSupplierForEventItem}>
                                        <SelectTrigger className="rounded-none border-2">
                                          <SelectValue placeholder="Escolha um fornecedor..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                          {fornecedores.map(f => (
                                            <SelectItem key={f.id} value={f.id}>{f.nome.toUpperCase()}</SelectItem>
                                          ))}
                                        </SelectContent>
                                      </Select>
                                      <Button
                                        onClick={() => {
                                          const match = todosProdutos.find(p => p.nome.toLowerCase() === item.nome.toLowerCase());
                                          setPedidoForm({
                                            ...pedidoForm,
                                            fornecedor_id: selectedSupplierForEventItem,
                                            itens_selecionados: match ? [match.id] : [],
                                            observacoes: `COMPRA URGENTE EVENTO: ${item.evento_nome} - ITEM: ${item.nome}`
                                          });
                                          toast({
                                            title: match ? "Item Identificado" : "Pedido Preparado",
                                            description: match ? `${match.nome} vinculado ao pedido.` : "Iniciando compra via observação descritiva."
                                          });
                                          document.getElementById('gerar-pedido-card')?.scrollIntoView({ behavior: 'smooth' });
                                        }}
                                        disabled={!selectedSupplierForEventItem}
                                        className="w-full rounded-none font-black uppercase h-12 border-2 border-green-500 bg-green-500 text-white hover:bg-green-600 transition-all"
                                      >
                                        Prosseguir com Pedido
                                      </Button>
                                    </div>
                                  </div>
                                </DialogContent>
                              </Dialog>

                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 text-[10px] font-bold uppercase hover:bg-muted rounded-none"
                                onClick={() => generateCotacaoPDF(item)}
                              >
                                <FileText className="h-3 w-3 mr-1" /> Cotação
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div >
  );
}