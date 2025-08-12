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

interface Produto {
  id: string;
  nome: string;
  estoque_atual: number;
  quantidade_minima: number;
  unidade_medida: string;
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
    itens_selecionados: [] as string[]
  });

  useEffect(() => {
    fetchProdutosBaixos();
    fetchFornecedores();
  }, []);

  const fetchProdutosBaixos = async () => {
    try {
      const { data, error } = await supabase
        .from('produtos')
        .select('id, nome, estoque_atual, quantidade_minima, unidade_medida')
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
    // Simular dados de fornecedores por enquanto
    setFornecedores([
      { id: '1', nome: 'Fornecedor A', contato: '(11) 99999-9999', condicoes_pagamento: '30 dias', prazo_entrega: '2-3 dias' },
      { id: '2', nome: 'Fornecedor B', contato: '(11) 88888-8888', condicoes_pagamento: '15 dias', prazo_entrega: '1-2 dias' }
    ]);
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

    toast({
      title: "Em desenvolvimento",
      description: "Cadastro de fornecedores será implementado em breve."
    });
  };

  const handleGerarPedido = async () => {
    toast({
      title: "Em desenvolvimento",
      description: "Geração de pedidos será implementada em breve."
    });
  };

  const toggleItemPedido = (produtoId: string) => {
    setPedidoForm(prev => ({
      ...prev,
      itens_selecionados: prev.itens_selecionados.includes(produtoId)
        ? prev.itens_selecionados.filter(id => id !== produtoId)
        : [...prev.itens_selecionados, produtoId]
    }));
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
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {produtosBaixos.map((produto) => (
                        <TableRow key={produto.id}>
                          <TableCell>
                            <input
                              type="checkbox"
                              checked={pedidoForm.itens_selecionados.includes(produto.id)}
                              onChange={() => toggleItemPedido(produto.id)}
                              className="rounded"
                            />
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
                        </TableRow>
                      ))}
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
                <Select value={pedidoForm.fornecedor_id} onValueChange={(value) => setPedidoForm({...pedidoForm, fornecedor_id: value})}>
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
                  onChange={(e) => setPedidoForm({...pedidoForm, observacoes: e.target.value})}
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
                disabled={loading}
                className="w-full bg-primary hover:bg-primary/90"
              >
                {loading ? "Gerando..." : "Gerar Pedido"}
              </Button>
            </CardContent>
          </Card>
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
                    onChange={(e) => setFornecedorForm({...fornecedorForm, nome: e.target.value})}
                    placeholder="Ex: Distribuidora ABC"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="contato">Contato *</Label>
                  <Input
                    id="contato"
                    value={fornecedorForm.contato}
                    onChange={(e) => setFornecedorForm({...fornecedorForm, contato: e.target.value})}
                    placeholder="Telefone, email ou WhatsApp"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="condicoes_pagamento">Condições de Pagamento</Label>
                  <Input
                    id="condicoes_pagamento"
                    value={fornecedorForm.condicoes_pagamento}
                    onChange={(e) => setFornecedorForm({...fornecedorForm, condicoes_pagamento: e.target.value})}
                    placeholder="Ex: 30 dias"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="prazo_entrega">Prazo de Entrega</Label>
                  <Input
                    id="prazo_entrega"
                    value={fornecedorForm.prazo_entrega}
                    onChange={(e) => setFornecedorForm({...fornecedorForm, prazo_entrega: e.target.value})}
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