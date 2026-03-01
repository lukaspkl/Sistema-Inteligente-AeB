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
  const [fornecedores, setFornecedores] = useState<any[]>([]);



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

      // Buscar fornecedores para o EstoqueVisualizacao
      const { data: forns } = await supabaseClient.from('fornecedores').select('id, nome');
      setFornecedores(forns || []);

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


      {/* Visualização do Estoque */}
      <EstoqueVisualizacao fornecedores={fornecedores} />
    </div>
  );
}