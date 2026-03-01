import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Package,
  Camera,
  AlertCircle,
  Plus,
  Upload,
  TrendingUp,
  BarChart3
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase as supabaseClient } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import EstoqueVisualizacao from "./EstoqueVisualizacao";

interface Produto {
  id: string;
  nome: string;
  categoria: string;
  unidade_medida: string;
  estoque_atual: number;
  quantidade_minima: number;
  ativo: boolean;
}

interface EstoqueBaixo {
  id: string;
  nome: string;
  estoque_atual: number;
  quantidade_minima: number;
  categoria: string;
  unidade_medida: string;
}

interface ResumoEstoque {
  totalProdutos: number;
  valorTotal: number;
  ultimasMovimentacoes: any[];
}

export default function EstoqueManager() {
  const { toast } = useToast();
  const [estoqueBaixo, setEstoqueBaixo] = useState<EstoqueBaixo[]>([]);
  const [resumoEstoque, setResumoEstoque] = useState<ResumoEstoque>({
    totalProdutos: 0,
    valorTotal: 0,
    ultimasMovimentacoes: []
  });
  const [loading, setLoading] = useState(true);
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isCadastroDialogOpen, setIsCadastroDialogOpen] = useState(false);

  // Estados para lançamento manual
  const [produtoSelecionado, setProdutoSelecionado] = useState("");
  const [quantidade, setQuantidade] = useState("");
  const [responsavel, setResponsavel] = useState("");

  // Estados para cadastro de produto
  const [nomeProduto, setNomeProduto] = useState("");
  const [categoria, setCategoria] = useState("");
  const [unidadeMedida, setUnidadeMedida] = useState("");
  const [quantidadeMinima, setQuantidadeMinima] = useState("");
  const [estoqueInicial, setEstoqueInicial] = useState("");
  const [valorCusto, setValorCusto] = useState("");

  useEffect(() => {
    carregarDadosEstoque();
  }, []);

  const carregarDadosEstoque = async () => {
    try {
      setLoading(true);

      // Buscar produtos com estoque baixo
      const { data: produtosEstoqueBaixo, error: errorEstoqueBaixo } = await supabaseClient
        .from('produtos')
        .select('*')
        .eq('ativo', true)
        .order('estoque_atual', { ascending: true });

      if (errorEstoqueBaixo) {
        console.error('Erro ao buscar produtos com estoque baixo:', errorEstoqueBaixo);
      } else if (produtosEstoqueBaixo) {
        const produtosFiltrados = produtosEstoqueBaixo.filter((p: any) =>
          p.estoque_atual < p.quantidade_minima
        );
        setEstoqueBaixo(produtosFiltrados);
      }

      // Buscar todos os produtos ativos para lançamento manual
      const { data: todosProdutos, error: errorProdutos } = await supabaseClient
        .from('produtos')
        .select('*')
        .eq('ativo', true)
        .order('nome');

      if (errorProdutos) {
        console.error('Erro ao buscar produtos:', errorProdutos);
      } else {
        setProdutos(todosProdutos || []);
      }

      // Calcular resumo do estoque
      const { data: resumo, error: errorResumo } = await supabaseClient
        .from('produtos')
        .select('id, estoque_atual')
        .eq('ativo', true);

      if (errorResumo) {
        console.error('Erro ao buscar resumo:', errorResumo);
      } else if (resumo) {
        const totalProdutos = resumo.length;
        const totalEstoque = resumo.reduce((acc: number, p: any) => acc + (p.estoque_atual || 0), 0);

        setResumoEstoque({
          totalProdutos,
          valorTotal: totalEstoque,
          ultimasMovimentacoes: []
        });
      }

      // Buscar últimas movimentações
      const { data: movimentacoes, error: errorMov } = await supabaseClient
        .from('estoque_movimentacoes')
        .select(`
          *,
          produtos!inner(nome)
        `)
        .order('data_movimentacao', { ascending: false })
        .limit(5);

      if (errorMov) {
        console.error('Erro ao buscar movimentações:', errorMov);
      } else {
        setResumoEstoque(prev => ({
          ...prev,
          ultimasMovimentacoes: movimentacoes || []
        }));
      }

    } catch (error) {
      console.error('Erro geral:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar dados do estoque",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const gerarPedidoCompra = async () => {
    if (estoqueBaixo.length === 0) {
      toast({
        title: "Nenhum item",
        description: "Não há itens com estoque baixo para gerar pedido",
        variant: "destructive",
      });
      return;
    }

    try {
      // Criar pedido
      const { data: pedido, error: errorPedido } = await supabaseClient
        .from('pedidos')
        .insert({
          setor: 'A&B',
          responsavel: 'Sistema',
          status: 'pendente',
          observacoes: 'Pedido gerado automaticamente - itens com estoque baixo'
        })
        .select()
        .single();

      if (errorPedido) throw errorPedido;

      // Adicionar itens ao pedido
      const itensPedido = estoqueBaixo.map(item => ({
        pedido_id: pedido!.id,
        produto_id: item.id,
        quantidade: Math.max(item.quantidade_minima - item.estoque_atual, 1)
      }));

      const { error: errorItens } = await supabaseClient
        .from('itens_pedido')
        .insert(itensPedido);

      if (errorItens) throw errorItens;

      toast({
        title: "Pedido criado",
        description: `Pedido de compra criado com ${estoqueBaixo.length} itens`,
      });

      // Recarregar dados
      carregarDadosEstoque();

    } catch (error) {
      console.error('Erro ao gerar pedido:', error);
      toast({
        title: "Erro",
        description: "Erro ao gerar pedido de compra",
        variant: "destructive",
      });
    }
  };

  const handleUploadNota = () => {
    toast({
      title: "Funcionalidade em desenvolvimento",
      description: "Upload de nota fiscal será implementado em breve",
    });
  };

  const lancamentoManual = async () => {
    if (!produtoSelecionado || !quantidade || !responsavel) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha todos os campos",
        variant: "destructive",
      });
      return;
    }

    try {
      const produto = produtos.find(p => p.id === produtoSelecionado);
      if (!produto) throw new Error('Produto não encontrado');

      const qtd = parseFloat(quantidade);
      if (qtd <= 0) throw new Error('Quantidade deve ser maior que zero');

      // Atualizar estoque do produto
      const { error: errorUpdate } = await supabaseClient
        .from('produtos')
        .update({
          estoque_atual: produto.estoque_atual + qtd
        })
        .eq('id', produtoSelecionado);

      if (errorUpdate) throw errorUpdate;

      // Registrar movimentação
      const { error: errorMov } = await supabaseClient
        .from('estoque_movimentacoes')
        .insert({
          produto_id: produtoSelecionado,
          tipo_movimentacao: 'entrada_manual',
          quantidade: qtd,
          responsavel,
          motivo: 'Lançamento manual'
        });

      if (errorMov) throw errorMov;

      toast({
        title: "Lançamento realizado",
        description: `${qtd} ${produto.unidade_medida} de ${produto.nome} adicionado ao estoque`,
      });

      // Limpar form e recarregar
      setProdutoSelecionado("");
      setQuantidade("");
      setResponsavel("");
      setIsDialogOpen(false);
      carregarDadosEstoque();

    } catch (error) {
      console.error('Erro no lançamento:', error);
      toast({
        title: "Erro",
        description: "Erro ao realizar lançamento manual",
        variant: "destructive",
      });
    }
  };

  const cadastrarProduto = async () => {
    if (!nomeProduto || !unidadeMedida) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha o nome do produto e unidade de medida",
        variant: "destructive",
      });
      return;
    }

    try {
      const estoque = estoqueInicial ? parseFloat(estoqueInicial) : 0;
      const qtdMinima = quantidadeMinima ? parseFloat(quantidadeMinima) : 0;

      // Inserir novo produto
      const { data: novoProduto, error: errorProduto } = await supabaseClient
        .from('produtos')
        .insert({
          nome: nomeProduto,
          categoria: categoria || null,
          unidade_medida: unidadeMedida,
          quantidade_minima: qtdMinima,
          estoque_atual: estoque,
          ativo: true
        })
        .select()
        .single();

      if (errorProduto) throw errorProduto;

      // Se tem estoque inicial, criar movimentação
      if (estoque > 0) {
        const { error: errorMov } = await supabaseClient
          .from('estoque_movimentacoes')
          .insert({
            produto_id: novoProduto!.id,
            tipo_movimentacao: 'entrada_inicial',
            quantidade: estoque,
            responsavel: 'Sistema',
            motivo: 'Estoque inicial do cadastro'
          });

        if (errorMov) throw errorMov;
      }

      toast({
        title: "Produto cadastrado",
        description: `${nomeProduto} foi cadastrado com sucesso!`,
      });

      // Limpar form e recarregar
      setNomeProduto("");
      setCategoria("");
      setUnidadeMedida("");
      setQuantidadeMinima("");
      setEstoqueInicial("");
      setValorCusto("");
      setIsCadastroDialogOpen(false);
      carregarDadosEstoque();

    } catch (error) {
      console.error('Erro ao cadastrar produto:', error);
      toast({
        title: "Erro",
        description: "Erro ao cadastrar produto",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 lg:grid-cols-3">
          {[1, 2, 3].map(i => (
            <Card key={i} className="bg-card shadow-elegant-md border-0 rounded-xl">
              <CardContent className="p-6">
                <div className="animate-pulse space-y-3">
                  <div className="h-4 bg-muted rounded w-3/4"></div>
                  <div className="h-8 bg-muted rounded w-1/2"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Resumo do Estoque */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="bg-card shadow-elegant-md border-0 rounded-xl hover-lift">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total de Produtos</CardTitle>
            <Package className="h-5 w-5 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-primary mb-1">{resumoEstoque.totalProdutos}</div>
            <p className="text-xs text-muted-foreground">Produtos ativos</p>
          </CardContent>
        </Card>

        <Card className="bg-card shadow-elegant-md border-0 rounded-xl hover-lift">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Estoque Total</CardTitle>
            <BarChart3 className="h-5 w-5 text-secondary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-secondary mb-1">{resumoEstoque.valorTotal.toFixed(0)}</div>
            <p className="text-xs text-muted-foreground">Unidades em estoque</p>
          </CardContent>
        </Card>

        <Card className="bg-card shadow-elegant-md border-0 rounded-xl hover-lift">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Alertas</CardTitle>
            <AlertCircle className="h-5 w-5 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-destructive mb-1">{estoqueBaixo.length}</div>
            <p className="text-xs text-muted-foreground">Itens com estoque baixo</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Upload de Nota Fiscal */}
        <Card className="bg-card shadow-elegant-md border-0 rounded-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Camera className="h-5 w-5 text-primary" />
              Upload Nota Fiscal
            </CardTitle>
            <CardDescription>
              Fotografe a nota fiscal para adicionar itens automaticamente
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="border-2 border-dashed border-primary/30 rounded-xl p-8 text-center hover:border-primary/50 transition-colors cursor-pointer">
              <Upload className="h-12 w-12 text-secondary mx-auto mb-4" />
              <p className="text-sm text-muted-foreground mb-4">
                Clique ou arraste a foto da nota fiscal
              </p>
              <Button onClick={handleUploadNota} className="bg-primary hover:bg-primary/90">
                <Camera className="mr-2 h-4 w-4" />
                Tirar Foto
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Estoque Baixo */}
        <Card className="bg-card shadow-elegant-md border-0 rounded-xl border-l-4 border-l-secondary">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-secondary">
              <AlertCircle className="h-5 w-5" />
              Estoque Baixo ({estoqueBaixo.length})
            </CardTitle>
            <CardDescription>
              Itens que precisam de reposição urgente
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {estoqueBaixo.length === 0 ? (
              <div className="text-center py-4">
                <p className="text-sm text-muted-foreground">✅ Nenhum item com estoque baixo</p>
              </div>
            ) : (
              <>
                {estoqueBaixo.slice(0, 5).map((item) => (
                  <div key={item.id} className="flex items-center justify-between p-3 rounded-xl bg-muted/50">
                    <div>
                      <p className="font-medium text-sm">{item.nome}</p>
                      <p className="text-xs text-muted-foreground">
                        Mínimo: {item.quantidade_minima} {item.unidade_medida}
                      </p>
                    </div>
                    <Badge variant="destructive">
                      {item.estoque_atual} {item.unidade_medida}
                    </Badge>
                  </div>
                ))}
                {estoqueBaixo.length > 5 && (
                  <p className="text-xs text-muted-foreground text-center">
                    + {estoqueBaixo.length - 5} outros itens
                  </p>
                )}
                <Button
                  className="w-full mt-4"
                  variant="outline"
                  onClick={gerarPedidoCompra}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Gerar Pedido de Compra
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Lançamento Manual */}
      <Card className="bg-card shadow-elegant-md border-0 rounded-xl">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-success" />
                Lançamento Manual
              </CardTitle>
              <CardDescription>
                Adicione produtos ao estoque manualmente
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Dialog open={isCadastroDialogOpen} onOpenChange={setIsCadastroDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="border-primary text-primary hover:bg-primary/10">
                    <Package className="mr-2 h-4 w-4" />
                    Cadastrar Produto
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>Cadastrar Novo Produto</DialogTitle>
                    <DialogDescription>
                      Adicione um novo produto ao catálogo de estoque
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="nomeProduto">Nome do Produto *</Label>
                      <Input
                        id="nomeProduto"
                        placeholder="Ex: Arroz 5kg Tio João"
                        value={nomeProduto}
                        onChange={(e) => setNomeProduto(e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="categoria">Categoria</Label>
                      <Input
                        id="categoria"
                        placeholder="Ex: Grãos, Limpeza, Bebidas"
                        value={categoria}
                        onChange={(e) => setCategoria(e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="unidadeMedida">Unidade de Medida *</Label>
                      <Select value={unidadeMedida} onValueChange={setUnidadeMedida}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione a unidade" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="kg">Quilograma (kg)</SelectItem>
                          <SelectItem value="g">Grama (g)</SelectItem>
                          <SelectItem value="L">Litro (L)</SelectItem>
                          <SelectItem value="ml">Mililitro (ml)</SelectItem>
                          <SelectItem value="un">Unidade (un)</SelectItem>
                          <SelectItem value="cx">Caixa (cx)</SelectItem>
                          <SelectItem value="pct">Pacote (pct)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="quantidadeMinima">Quantidade Mínima</Label>
                      <Input
                        id="quantidadeMinima"
                        type="number"
                        placeholder="Para alertas de estoque baixo"
                        value={quantidadeMinima}
                        onChange={(e) => setQuantidadeMinima(e.target.value)}
                        min="0"
                        step="0.01"
                      />
                    </div>
                    <div>
                      <Label htmlFor="estoqueInicial">Estoque Inicial</Label>
                      <Input
                        id="estoqueInicial"
                        type="number"
                        placeholder="Quantidade atual em estoque"
                        value={estoqueInicial}
                        onChange={(e) => setEstoqueInicial(e.target.value)}
                        min="0"
                        step="0.01"
                      />
                    </div>
                    <div>
                      <Label htmlFor="valorCusto">Valor de Custo</Label>
                      <Input
                        id="valorCusto"
                        type="number"
                        placeholder="Custo por unidade"
                        value={valorCusto}
                        onChange={(e) => setValorCusto(e.target.value)}
                        min="0"
                        step="0.01"
                      />
                    </div>
                    <Button
                      onClick={cadastrarProduto}
                      className="w-full bg-primary hover:bg-primary/90"
                      disabled={!nomeProduto || !unidadeMedida}
                    >
                      Cadastrar Produto
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>

              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-success hover:bg-success/90">
                    <Plus className="mr-2 h-4 w-4" />
                    Lançar Entrada
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Lançamento Manual de Entrada</DialogTitle>
                    <DialogDescription>
                      Adicione produtos ao estoque manualmente
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="produto">Produto</Label>
                      <Select value={produtoSelecionado} onValueChange={setProdutoSelecionado}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione um produto" />
                        </SelectTrigger>
                        <SelectContent>
                          {produtos.map((produto) => (
                            <SelectItem key={produto.id} value={produto.id}>
                              {produto.nome} ({produto.unidade_medida})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="quantidade">Quantidade</Label>
                      <Input
                        id="quantidade"
                        type="number"
                        placeholder="Digite a quantidade"
                        value={quantidade}
                        onChange={(e) => setQuantidade(e.target.value)}
                        min="0.01"
                        step="0.01"
                      />
                    </div>
                    <div>
                      <Label htmlFor="responsavel">Responsável</Label>
                      <Input
                        id="responsavel"
                        placeholder="Nome do responsável"
                        value={responsavel}
                        onChange={(e) => setResponsavel(e.target.value)}
                      />
                    </div>
                    <Button
                      onClick={lancamentoManual}
                      className="w-full bg-success hover:bg-success/90"
                      disabled={!produtoSelecionado || !quantidade || !responsavel}
                    >
                      Confirmar Lançamento
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {resumoEstoque.ultimasMovimentacoes.length > 0 && (
            <div>
              <h4 className="font-medium mb-3">Últimas Movimentações</h4>
              <div className="space-y-2">
                {resumoEstoque.ultimasMovimentacoes.map((mov: any, index: number) => (
                  <div key={index} className="flex items-center justify-between p-2 rounded bg-muted/30">
                    <div>
                      <p className="text-sm font-medium">{mov.produtos?.nome || 'Produto'}</p>
                      <p className="text-xs text-muted-foreground">
                        {mov.tipo_movimentacao} • {new Date(mov.data_movimentacao).toLocaleDateString()}
                      </p>
                    </div>
                    <Badge variant="outline">
                      +{mov.quantidade}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Visualização do Estoque */}
      <EstoqueVisualizacao />
    </div>
  );
}