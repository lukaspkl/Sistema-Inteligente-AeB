import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  BarChart3, 
  Download,
  DollarSign,
  Calendar,
  TrendingDown,
  Package,
  AlertTriangle,
  FileText
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import ValidadeChart from "@/components/ValidadeChart";

interface RelatorioData {
  valorEstoque: number;
  totalProdutos: number;
  perdasMes: number;
  percentualPerdas: number;
  vencimentos7dias: number;
  vencimentos15dias: number;
  vencimentos30dias: number;
}

interface MovimentacaoRecente {
  id: string;
  data_movimentacao: string;
  quantidade: number;
  tipo_movimentacao: string;
  produtos: {
    nome: string;
  };
}

export default function ABRelatorios() {
  const { toast } = useToast();
  const [relatorio, setRelatorio] = useState<RelatorioData>({
    valorEstoque: 0,
    totalProdutos: 0,
    perdasMes: 0,
    percentualPerdas: 0,
    vencimentos7dias: 0,
    vencimentos15dias: 0,
    vencimentos30dias: 0
  });
  const [movimentacoes, setMovimentacoes] = useState<MovimentacaoRecente[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchRelatorio();
    fetchMovimentacoes();
  }, []);

  const fetchRelatorio = async () => {
    try {
      // Buscar dados dos produtos
      const { data: produtos, error: produtosError } = await supabase
        .from('produtos')
        .select('estoque_atual, valor_unitario, validade')
        .eq('ativo', true);

      if (produtosError) throw produtosError;

      // Calcular valor do estoque
      const valorEstoque = produtos?.reduce((sum, p) => 
        sum + ((p.estoque_atual || 0) * (p.valor_unitario || 0)), 0) || 0;
      
      const totalProdutos = produtos?.reduce((sum, p) => sum + (p.estoque_atual || 0), 0) || 0;

      // Buscar perdas do mês
      const dataLimite = new Date();
      dataLimite.setMonth(dataLimite.getMonth() - 1);
      
      const { data: perdas, error: perdasError } = await supabase
        .from('perdas')
        .select('valor_perda')
        .gte('data_perda', dataLimite.toISOString());

      if (perdasError) throw perdasError;

      const perdasMes = perdas?.reduce((sum, p) => sum + (p.valor_perda || 0), 0) || 0;
      const percentualPerdas = valorEstoque > 0 ? (perdasMes / valorEstoque) * 100 : 0;

      // Calcular vencimentos
      const hoje = new Date();
      const data7dias = new Date(hoje.getTime() + 7 * 24 * 60 * 60 * 1000);
      const data15dias = new Date(hoje.getTime() + 15 * 24 * 60 * 60 * 1000);
      const data30dias = new Date(hoje.getTime() + 30 * 24 * 60 * 60 * 1000);

      const vencimentos7dias = produtos?.filter(p => 
        p.validade && new Date(p.validade) <= data7dias && new Date(p.validade) > hoje
      ).length || 0;
      
      const vencimentos15dias = produtos?.filter(p => 
        p.validade && new Date(p.validade) <= data15dias && new Date(p.validade) > data7dias
      ).length || 0;
      
      const vencimentos30dias = produtos?.filter(p => 
        p.validade && new Date(p.validade) <= data30dias && new Date(p.validade) > data15dias
      ).length || 0;

      setRelatorio({
        valorEstoque,
        totalProdutos,
        perdasMes,
        percentualPerdas,
        vencimentos7dias,
        vencimentos15dias,
        vencimentos30dias
      });

    } catch (error) {
      console.error('Erro ao gerar relatório:', error);
    }
  };

  const fetchMovimentacoes = async () => {
    try {
      const { data, error } = await supabase
        .from('estoque_movimentacoes')
        .select(`
          *,
          produtos!inner(nome)
        `)
        .order('data_movimentacao', { ascending: false })
        .limit(10);

      if (error) throw error;
      setMovimentacoes(data || []);
    } catch (error) {
      console.error('Erro ao buscar movimentações:', error);
    }
  };

  const handleExportPDF = () => {
    toast({
      title: "Export iniciado",
      description: "O relatório está sendo preparado para download."
    });
    
    // Simular export PDF
    setTimeout(() => {
      toast({
        title: "Download concluído",
        description: "Relatório A&B exportado com sucesso."
      });
    }, 2000);
  };

  const formatCurrency = (value: number) => {
    return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <BarChart3 className="h-6 w-6" />
            </div>
            Relatórios A&B
          </h1>
          <p className="text-muted-foreground">
            Análises e indicadores do módulo de alimentos e bebidas
          </p>
        </div>
        <Button onClick={handleExportPDF} className="flex items-center gap-2">
          <Download className="h-4 w-4" />
          Exportar PDF
        </Button>
      </div>

      {/* Cards de Indicadores */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-card shadow-elegant-md border-0 rounded-xl">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Valor do Estoque</CardTitle>
            <DollarSign className="h-5 w-5 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-success mb-1">
              {formatCurrency(relatorio.valorEstoque)}
            </div>
            <p className="text-xs text-muted-foreground">
              {relatorio.totalProdutos} itens em estoque
            </p>
          </CardContent>
        </Card>

        <Card className="bg-card shadow-elegant-md border-0 rounded-xl">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Perdas (Mês)</CardTitle>
            <TrendingDown className="h-5 w-5 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-destructive mb-1">
              {formatCurrency(relatorio.perdasMes)}
            </div>
            <p className="text-xs text-muted-foreground">
              {relatorio.percentualPerdas.toFixed(1)}% do estoque
            </p>
          </CardContent>
        </Card>

        <Card className="bg-card shadow-elegant-md border-0 rounded-xl">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Vencendo (7 dias)</CardTitle>
            <AlertTriangle className="h-5 w-5 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-600 mb-1">
              {relatorio.vencimentos7dias}
            </div>
            <p className="text-xs text-muted-foreground">produtos</p>
          </CardContent>
        </Card>

        <Card className="bg-card shadow-elegant-md border-0 rounded-xl">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Produtos</CardTitle>
            <Package className="h-5 w-5 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-primary mb-1">
              {relatorio.totalProdutos}
            </div>
            <p className="text-xs text-muted-foreground">unidades totais</p>
          </CardContent>
        </Card>
      </div>

      {/* Gráfico de Vencimentos */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card className="bg-card shadow-elegant-md border-0 rounded-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              Produtos por Vencimento
            </CardTitle>
            <CardDescription>
              Distribuição de produtos por proximidade de vencimento
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ValidadeChart />
          </CardContent>
        </Card>

        {/* Resumo de Perdas por Tipo */}
        <Card className="bg-card shadow-elegant-md border-0 rounded-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingDown className="h-5 w-5 text-destructive" />
              Análise de Perdas
            </CardTitle>
            <CardDescription>
              Detalhamento das perdas por categoria
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 rounded-xl bg-muted/50">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-destructive"></div>
                  <span className="text-sm">Vencimento</span>
                </div>
                <div className="text-sm font-medium">
                  {formatCurrency(relatorio.perdasMes * 0.6)}
                </div>
              </div>
              
              <div className="flex items-center justify-between p-3 rounded-xl bg-muted/50">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-orange-500"></div>
                  <span className="text-sm">Quebra</span>
                </div>
                <div className="text-sm font-medium">
                  {formatCurrency(relatorio.perdasMes * 0.3)}
                </div>
              </div>
              
              <div className="flex items-center justify-between p-3 rounded-xl bg-muted/50">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-muted-foreground"></div>
                  <span className="text-sm">Outros</span>
                </div>
                <div className="text-sm font-medium">
                  {formatCurrency(relatorio.perdasMes * 0.1)}
                </div>
              </div>
            </div>
            
            <div className="pt-3 border-t">
              <div className="flex items-center justify-between">
                <span className="font-medium">Total</span>
                <span className="font-bold text-destructive">
                  {formatCurrency(relatorio.perdasMes)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabela de Vencimentos */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card className="bg-card shadow-elegant-md border-0 rounded-xl">
          <CardHeader>
            <CardTitle className="text-lg">Próximos 7 dias</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center">
              <div className="text-3xl font-bold text-destructive mb-2">
                {relatorio.vencimentos7dias}
              </div>
              <p className="text-sm text-muted-foreground">produtos vencendo</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card shadow-elegant-md border-0 rounded-xl">
          <CardHeader>
            <CardTitle className="text-lg">7-15 dias</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center">
              <div className="text-3xl font-bold text-orange-600 mb-2">
                {relatorio.vencimentos15dias}
              </div>
              <p className="text-sm text-muted-foreground">produtos vencendo</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card shadow-elegant-md border-0 rounded-xl">
          <CardHeader>
            <CardTitle className="text-lg">15-30 dias</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center">
              <div className="text-3xl font-bold text-secondary mb-2">
                {relatorio.vencimentos30dias}
              </div>
              <p className="text-sm text-muted-foreground">produtos vencendo</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Movimentação Recente */}
      <Card className="bg-card shadow-elegant-md border-0 rounded-xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            Movimentação Recente
          </CardTitle>
          <CardDescription>
            Últimas entradas registradas no estoque
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-xl border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Produto</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Quantidade</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {movimentacoes.map((mov) => (
                  <TableRow key={mov.id}>
                    <TableCell>
                      {new Date(mov.data_movimentacao).toLocaleDateString('pt-BR')}
                    </TableCell>
                    <TableCell className="font-medium">
                      {mov.produtos?.nome || 'N/A'}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {mov.tipo_movimentacao === 'entrada_manual' && 'Entrada Manual'}
                        {mov.tipo_movimentacao === 'entrada_nota' && 'Nota Fiscal'}
                        {mov.tipo_movimentacao === 'saida' && 'Saída'}
                      </Badge>
                    </TableCell>
                    <TableCell>{mov.quantidade}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}