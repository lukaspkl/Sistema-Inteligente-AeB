import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell
} from "recharts";
import { 
  Package, 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  Clock,
  DollarSign,
  Activity,
  AlertCircle,
  Trash2
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import ValidadeChart from "./ValidadeChart";

interface EstoqueOverview {
  totalProdutos: number;
  totalItensEstoque: number;
  valorTotalEstimado: number;
  ultimaAtualizacao: string | null;
}

interface MovimentacaoSemanal {
  semana: string;
  entradas: number;
  saidas: number;
}

interface ProdutoMovimentado {
  nome: string;
  totalMovimentacao: number;
  tipo: string;
}

interface ProdutoParado {
  nome: string;
  estoqueAtual: number;
  ultimaMovimentacao: string | null;
}

export default function InventoryReports() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [overview, setOverview] = useState<EstoqueOverview>({
    totalProdutos: 0,
    totalItensEstoque: 0,
    valorTotalEstimado: 0,
    ultimaAtualizacao: null
  });
  const [movimentacaoSemanal, setMovimentacaoSemanal] = useState<MovimentacaoSemanal[]>([]);
  const [produtosMaisMovimentados, setProdutosMaisMovimentados] = useState<ProdutoMovimentado[]>([]);
  const [produtosParados, setProdutosParados] = useState<ProdutoParado[]>([]);
  const [lossesData, setLossesData] = useState<any[]>([]);
  const [lossesTotal, setLossesTotal] = useState(0);
  const [lossesPercentage, setLossesPercentage] = useState(0);

  const carregarDados = async () => {
    try {
      setLoading(true);

      // 1. Visão geral do estoque
      const { data: produtos, error: produtosError } = await supabase
        .from('produtos')
        .select('*')
        .eq('ativo', true);

      if (produtosError) throw produtosError;

      const totalProdutos = produtos?.length || 0;
      const totalItensEstoque = produtos?.reduce((sum, p) => sum + (Number(p.estoque_atual) || 0), 0) || 0;

      // Última movimentação
      const { data: ultimaMovimentacao } = await supabase
        .from('estoque_movimentacoes')
        .select('data_movimentacao')
        .order('data_movimentacao', { ascending: false })
        .limit(1);

      setOverview({
        totalProdutos,
        totalItensEstoque,
        valorTotalEstimado: totalItensEstoque * 15, // Valor estimado
        ultimaAtualizacao: ultimaMovimentacao?.[0]?.data_movimentacao || null
      });

      // 2. Movimentação semanal - últimos 30 dias
      const dataLimite = new Date();
      dataLimite.setDate(dataLimite.getDate() - 30);

      const { data: movimentacoes, error: movError } = await supabase
        .from('estoque_movimentacoes')
        .select(`
          tipo_movimentacao,
          quantidade,
          data_movimentacao,
          produtos!inner(nome)
        `)
        .gte('data_movimentacao', dataLimite.toISOString());

      if (movError) throw movError;

      // Agrupar por semana
      const semanas = new Map<string, { entradas: number; saidas: number }>();
      
      movimentacoes?.forEach(mov => {
        const data = new Date(mov.data_movimentacao);
        const inicioSemana = new Date(data);
        inicioSemana.setDate(data.getDate() - data.getDay());
        const chave = inicioSemana.toISOString().split('T')[0];
        
        if (!semanas.has(chave)) {
          semanas.set(chave, { entradas: 0, saidas: 0 });
        }
        
        const week = semanas.get(chave)!;
        const quantidade = Number(mov.quantidade) || 0;
        
        if (mov.tipo_movimentacao?.includes('entrada')) {
          week.entradas += quantidade;
        } else {
          week.saidas += quantidade;
        }
      });

      const dadosSemana = Array.from(semanas.entries())
        .map(([semana, dados]) => ({
          semana: new Date(semana).toLocaleDateString('pt-BR'),
          ...dados
        }))
        .sort((a, b) => new Date(a.semana).getTime() - new Date(b.semana).getTime());

      setMovimentacaoSemanal(dadosSemana);

      // 3. Produtos mais movimentados
      const movimentacaoPorProduto = new Map<string, number>();
      
      movimentacoes?.forEach(mov => {
        const nome = mov.produtos?.nome || 'Produto desconhecido';
        const quantidade = Number(mov.quantidade) || 0;
        movimentacaoPorProduto.set(nome, (movimentacaoPorProduto.get(nome) || 0) + quantidade);
      });

      const rankingProdutos = Array.from(movimentacaoPorProduto.entries())
        .map(([nome, total]) => ({
          nome,
          totalMovimentacao: total,
          tipo: 'movimento'
        }))
        .sort((a, b) => b.totalMovimentacao - a.totalMovimentacao)
        .slice(0, 10);

      setProdutosMaisMovimentados(rankingProdutos);

      // 4. Produtos parados (sem movimentação em 30 dias)
      const produtosComMovimentacao = new Set(movimentacoes?.map(m => m.produtos?.nome));
      
      const produtosSemMovimentacao = produtos?.filter(p => 
        !produtosComMovimentacao.has(p.nome) && Number(p.estoque_atual) > 0
      ).map(p => ({
        nome: p.nome,
        estoqueAtual: Number(p.estoque_atual) || 0,
        ultimaMovimentacao: null
      })) || [];

      setProdutosParados(produtosSemMovimentacao);

      // 5. Buscar dados de perdas (últimos 30 dias)
      const { data: perdas, error: perdasError } = await supabase
        .from('perdas')
        .select(`
          *,
          produtos!inner(nome)
        `)
        .gte('data_perda', dataLimite.toISOString())
        .order('data_perda', { ascending: false });

      if (perdasError) throw perdasError;

      const totalPerdas = perdas?.reduce((sum, perda) => sum + (perda.valor_perda || 0), 0) || 0;
      
      // Calcular percentual das perdas sobre o valor total do estoque
      const valorTotalEstoque = produtos?.reduce((sum, p) => 
        sum + ((Number(p.estoque_atual) || 0) * (Number(p.valor_unitario) || 0)), 0) || 0;

      const percentualPerdas = valorTotalEstoque > 0 ? (totalPerdas / valorTotalEstoque) * 100 : 0;

      setLossesData(perdas || []);
      setLossesTotal(totalPerdas);
      setLossesPercentage(percentualPerdas);

    } catch (error) {
      console.error('Erro ao carregar dados dos relatórios:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os dados dos relatórios.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregarDados();
  }, []);

  const cores = [
    'hsl(var(--primary))',
    'hsl(var(--secondary))', 
    'hsl(var(--accent))',
    'hsl(var(--muted))',
    'hsl(var(--destructive))'
  ];

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="bg-card shadow-elegant-md border-0 rounded-xl">
              <CardHeader>
                <Skeleton className="h-4 w-20" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-24 mb-2" />
                <Skeleton className="h-3 w-16" />
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="grid gap-6 lg:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="bg-card shadow-elegant-md border-0 rounded-xl">
              <CardHeader>
                <Skeleton className="h-6 w-32" />
                <Skeleton className="h-4 w-48" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-64 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Bloco 1: Visão Geral do Estoque */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-card shadow-elegant-md border-0 rounded-xl hover-lift">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total de Produtos
            </CardTitle>
            <Package className="h-5 w-5 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-primary mb-1">
              {overview.totalProdutos}
            </div>
            <p className="text-xs text-muted-foreground">Produtos cadastrados</p>
          </CardContent>
        </Card>

        <Card className="bg-card shadow-elegant-md border-0 rounded-xl hover-lift">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Itens em Estoque
            </CardTitle>
            <Activity className="h-5 w-5 text-secondary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-secondary mb-1">
              {overview.totalItensEstoque.toFixed(0)}
            </div>
            <p className="text-xs text-muted-foreground">Unidades totais</p>
          </CardContent>
        </Card>

        <Card className="bg-card shadow-elegant-md border-0 rounded-xl hover-lift">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Valor Estimado
            </CardTitle>
            <DollarSign className="h-5 w-5 text-accent" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-accent mb-1">
              R$ {overview.valorTotalEstimado.toLocaleString('pt-BR')}
            </div>
            <p className="text-xs text-muted-foreground">Valor total estimado</p>
          </CardContent>
        </Card>

        <Card className="bg-card shadow-elegant-md border-0 rounded-xl hover-lift">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Última Atualização
            </CardTitle>
            <Clock className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-semibold mb-1">
              {overview.ultimaAtualizacao ? 
                new Date(overview.ultimaAtualizacao).toLocaleDateString('pt-BR') 
                : 'Sem dados'
              }
            </div>
            <p className="text-xs text-muted-foreground">
              {overview.ultimaAtualizacao ? 
                new Date(overview.ultimaAtualizacao).toLocaleTimeString('pt-BR')
                : 'Nenhuma movimentação'
              }
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Bloco 2 e 3: Movimentação Semanal */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="bg-card shadow-elegant-md border-0 rounded-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-success" />
              Entradas por Semana
            </CardTitle>
            <CardDescription>Evolução do abastecimento - últimos 30 dias</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={movimentacaoSemanal}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis dataKey="semana" />
                <YAxis />
                <Tooltip />
                <Line 
                  type="monotone" 
                  dataKey="entradas" 
                  stroke="hsl(var(--success))" 
                  strokeWidth={2}
                  dot={{ fill: 'hsl(var(--success))' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="bg-card shadow-elegant-md border-0 rounded-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingDown className="h-5 w-5 text-destructive" />
              Saídas por Semana
            </CardTitle>
            <CardDescription>Evolução do consumo - últimos 30 dias</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={movimentacaoSemanal}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis dataKey="semana" />
                <YAxis />
                <Tooltip />
                <Line 
                  type="monotone" 
                  dataKey="saidas" 
                  stroke="hsl(var(--destructive))" 
                  strokeWidth={2}
                  dot={{ fill: 'hsl(var(--destructive))' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Bloco 4 e 5: Ranking e Produtos Parados */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="bg-card shadow-elegant-md border-0 rounded-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart className="h-5 w-5 text-primary" />
              Top 10 Produtos Mais Movimentados
            </CardTitle>
            <CardDescription>Ranking de rotatividade - últimos 30 dias</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={produtosMaisMovimentados} layout="horizontal">
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis type="number" />
                <YAxis dataKey="nome" type="category" width={120} />
                <Tooltip />
                <Bar dataKey="totalMovimentacao" fill="hsl(var(--primary))" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="bg-card shadow-elegant-md border-0 rounded-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Produtos Parados
            </CardTitle>
            <CardDescription>Sem movimentação nos últimos 30 dias</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-72 overflow-y-auto">
              {produtosParados.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Package className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>Todos os produtos têm movimentação recente!</p>
                </div>
              ) : (
                produtosParados.map((produto, index) => (
                  <div 
                    key={index} 
                    className="flex items-center justify-between p-3 rounded-xl bg-destructive/10 border border-destructive/20"
                  >
                    <div className="flex-1">
                      <p className="font-medium text-sm">{produto.nome}</p>
                      <p className="text-xs text-muted-foreground">
                        Estoque: {produto.estoqueAtual} unidades
                      </p>
                    </div>
                    <Badge variant="destructive" className="text-xs">
                      <AlertCircle className="h-3 w-3 mr-1" />
                      Parado
                    </Badge>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bloco 6: Relatório de Perdas */}
      <Card className="bg-card shadow-elegant-md border-0 rounded-xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trash2 className="h-5 w-5 text-destructive" />
            Relatório de Perdas (Últimos 30 dias)
          </CardTitle>
          <CardDescription>
            Controle de produtos perdidos, danificados ou extraviados
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Resumo das perdas */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="text-center p-4 bg-destructive/10 rounded-xl border border-destructive/20">
                <div className="text-2xl font-bold text-destructive">
                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(lossesTotal)}
                </div>
                <div className="text-sm text-muted-foreground">Valor Total das Perdas</div>
              </div>
              <div className="text-center p-4 bg-destructive/10 rounded-xl border border-destructive/20">
                <div className="text-2xl font-bold text-destructive">
                  {lossesPercentage.toFixed(2)}%
                </div>
                <div className="text-sm text-muted-foreground">% do Valor do Estoque</div>
              </div>
              <div className="text-center p-4 bg-destructive/10 rounded-xl border border-destructive/20">
                <div className="text-2xl font-bold text-destructive">
                  {lossesData.length}
                </div>
                <div className="text-sm text-muted-foreground">Total de Registros</div>
              </div>
            </div>

            {/* Lista de perdas */}
            <div className="space-y-3">
              <h4 className="font-semibold">Detalhamento das Perdas</h4>
              {lossesData.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Trash2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Nenhuma perda registrada nos últimos 30 dias</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {lossesData.map((perda, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-muted/50 rounded-xl border">
                      <div className="flex-1">
                        <div className="font-medium">{perda.produtos.nome}</div>
                        <div className="text-sm text-muted-foreground">
                          Qtd: {perda.quantidade} | Responsável: {perda.responsavel}
                          {perda.atualizou_estoque && (
                            <Badge variant="secondary" className="ml-2">Descontado do estoque</Badge>
                          )}
                        </div>
                        {perda.observacoes && (
                          <div className="text-xs text-muted-foreground mt-1">
                            {perda.observacoes}
                          </div>
                        )}
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-destructive">
                          {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(perda.valor_perda || 0)}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {new Date(perda.data_perda).toLocaleDateString('pt-BR')}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Gráfico de Produtos com Validade Próxima */}
      <Card className="bg-card shadow-elegant-md border-0 rounded-xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-destructive" />
            Produtos com Validade Próxima
          </CardTitle>
          <CardDescription>
            Monitoramento de vencimentos para prevenir perdas
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ValidadeChart />
        </CardContent>
      </Card>

      {/* Botão de Atualização */}
      <div className="flex justify-center">
        <Button 
          onClick={carregarDados}
          variant="outline"
          className="flex items-center gap-2"
        >
          <Activity className="h-4 w-4" />
          Atualizar Relatórios
        </Button>
      </div>
    </div>
  );
}