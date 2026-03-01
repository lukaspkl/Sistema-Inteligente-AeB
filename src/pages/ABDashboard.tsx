import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  ShoppingCart,
  Package,
  CheckSquare,
  BarChart3,
  Camera,
  Brain,
  TrendingDown,
  TrendingUp,
  Plus,
  Upload
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import EstoqueManager from "@/components/EstoqueManager";
import InventoryReports from "@/components/InventoryReports";

export default function ABDashboard() {
  const { toast } = useToast();
  const [aiPrompt, setAiPrompt] = useState("");
  const [isProcessingAI, setIsProcessingAI] = useState(false);
  const [metricas, setMetricas] = useState({
    vendasDia: "R$ 12.450",
    cmv: "32.5%",
    estoqueValor: "R$ 0",
    itensEstoque: 0,
    perdas: "R$ 0",
    perdasPercentual: "0%"
  });

  const sugestoesIA = [
    "Reabastecer cerveja Pilsen - previsão de esgotamento em 2 dias",
    "Promoção de salmão recomendada para reduzir perdas",
    "Compra de vinhos para evento do fim de semana"
  ];

  useEffect(() => {
    fetchMetricas();
  }, []);

  const fetchMetricas = async () => {
    try {
      // Buscar dados do estoque
      const { data: produtos, error: produtosError } = await supabase
        .from('produtos')
        .select('estoque_atual, valor_unitario')
        .eq('ativo', true);

      if (produtosError) throw produtosError;

      // Calcular métricas do estoque
      const totalItens = produtos?.reduce((sum, p) => sum + (p.estoque_atual || 0), 0) || 0;
      const valorEstoque = produtos?.reduce((sum, p) => sum + ((p.estoque_atual || 0) * (p.valor_unitario || 0)), 0) || 0;

      // Buscar dados das perdas (últimos 30 dias)
      const { data: perdas, error: perdasError } = await supabase
        .from('perdas')
        .select('valor_perda')
        .gte('data_perda', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

      if (perdasError) throw perdasError;

      const totalPerdas = perdas?.reduce((sum, p) => sum + (p.valor_perda || 0), 0) || 0;
      const perdasPercentual = valorEstoque > 0 ? ((totalPerdas / valorEstoque) * 100).toFixed(1) : "0";

      setMetricas({
        vendasDia: "R$ 12.450",
        cmv: "32.5%",
        estoqueValor: new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valorEstoque),
        itensEstoque: totalItens,
        perdas: new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalPerdas),
        perdasPercentual: `${perdasPercentual}%`
      });
    } catch (error) {
      console.error('Erro ao buscar métricas:', error);
    }
  };

  const handleAIRequest = async () => {
    if (!aiPrompt.trim()) return;

    setIsProcessingAI(true);

    // Simular processamento de IA
    setTimeout(() => {
      toast({
        title: "IA processada com sucesso",
        description: "Sua consulta foi processada e registrada no sistema.",
      });
      setAiPrompt("");
      setIsProcessingAI(false);
    }, 2000);
  };


  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between animate-in fade-in slide-in-from-top-4 duration-500">
        <div>
          <h1 className="text-3xl md:text-5xl font-black tracking-tighter flex items-center gap-4 mb-2">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/20 hover:scale-105 transition-transform">
              <ShoppingCart className="h-6 w-6" />
            </div>
            Alimentos & Bebidas
          </h1>
          <p className="text-muted-foreground font-medium flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
            Sistema Ativo • Gestão de métricas e operações em tempo real
          </p>
        </div>
      </div>

      {/* Métricas Principais - Assimetria Tipográfica (Bold & Tech) */}
      <div className="grid gap-6 md:grid-cols-3 lg:grid-cols-12 animate-in fade-in slide-in-from-bottom-8 duration-700 fade-in-0">
        {/* BIG Card: Vendas Hoje */}
        <Card className="md:col-span-3 lg:col-span-8 bg-card shadow-elegant-md border-0 rounded-2xl hover-lift relative overflow-hidden group">
          {/* Fundo abstrato tech para trazer vida */}
          <div className="absolute -right-20 -top-20 w-64 h-64 bg-success/5 rounded-full blur-3xl group-hover:bg-success/10 transition-colors duration-700" />
          <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/4 opacity-10 group-hover:opacity-20 transition-opacity duration-500">
            <TrendingUp className="w-64 h-64 text-success" />
          </div>

          <CardHeader className="flex flex-row items-center justify-between pb-2 relative z-10">
            <CardTitle className="text-sm font-bold uppercase tracking-widest text-muted-foreground/80">
              Desempenho Diário
            </CardTitle>
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-success/10">
              <TrendingUp className="h-5 w-5 text-success" />
            </div>
          </CardHeader>
          <CardContent className="relative z-10 pt-4 pb-8">
            <div className="flex items-baseline gap-4 mb-2">
              <div className="text-6xl md:text-7xl lg:text-8xl font-black tracking-tighter text-foreground drop-shadow-sm">
                <span className="text-3xl md:text-4xl text-muted-foreground font-bold mr-1 align-top">R$</span>
                {metricas.vendasDia.replace('R$ ', '')}
              </div>
            </div>
            <div className="flex items-center gap-2 mt-4 inline-flex px-3 py-1.5 rounded-full bg-success/10 text-success border border-success/20">
              <TrendingUp className="h-4 w-4" />
              <span className="text-sm font-bold tracking-wide">+15.2% vs ontem</span>
            </div>
          </CardContent>
        </Card>

        {/* Vertical Stack: Outras Métricas */}
        <div className="md:col-span-3 lg:col-span-4 flex flex-col gap-4">
          <Card className="flex-1 bg-card shadow-elegant-md border-0 rounded-2xl hover-lift group relative overflow-hidden">
            <div className="absolute -right-8 -top-8 w-32 h-32 bg-secondary/5 rounded-full blur-2xl group-hover:bg-secondary/10 transition-colors duration-500" />
            <CardHeader className="flex flex-row items-center justify-between space-y-0 py-3 relative z-10">
              <CardTitle className="text-xs font-semibold uppercase text-muted-foreground">CMV (Custo Mercadoria)</CardTitle>
              <BarChart3 className="h-4 w-4 text-secondary opacity-70 group-hover:opacity-100 transition-opacity" />
            </CardHeader>
            <CardContent className="pb-4 relative z-10">
              <div className="text-3xl font-bold tracking-tight text-foreground">{metricas.cmv}</div>
              <p className="text-xs font-medium text-muted-foreground mt-1">Meta corporativa: <span className="text-secondary/80">30%</span></p>
            </CardContent>
          </Card>

          <Card className="flex-1 bg-card shadow-elegant-md border-0 rounded-2xl hover-lift group relative overflow-hidden">
            <div className="absolute -right-8 -top-8 w-32 h-32 bg-primary/5 rounded-full blur-2xl group-hover:bg-primary/10 transition-colors duration-500" />
            <CardHeader className="flex flex-row items-center justify-between space-y-0 py-3 relative z-10">
              <CardTitle className="text-xs font-semibold uppercase text-muted-foreground">Volume de Estoque</CardTitle>
              <Package className="h-4 w-4 text-primary opacity-70 group-hover:opacity-100 transition-opacity" />
            </CardHeader>
            <CardContent className="pb-4 relative z-10 flex justify-between items-end">
              <div>
                <div className="text-3xl font-bold tracking-tight text-foreground">{metricas.itensEstoque} <span className="text-sm font-normal text-muted-foreground tracking-normal block -mt-1">itens</span></div>
              </div>
              <div className="text-right">
                <p className="text-xs font-medium text-muted-foreground mb-1 uppercase tracking-wider text-[10px]">Capital Alocado</p>
                <p className="text-sm font-bold text-primary">{metricas.estoqueValor}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="flex-1 bg-card shadow-elegant-md border-0 rounded-2xl hover-lift group relative overflow-hidden">
            <div className="absolute -right-8 -top-8 w-32 h-32 bg-destructive/5 rounded-full blur-2xl group-hover:bg-destructive/10 transition-colors duration-500" />
            <CardHeader className="flex flex-row items-center justify-between space-y-0 py-3 relative z-10">
              <CardTitle className="text-xs font-semibold uppercase text-muted-foreground">Controle de Perdas</CardTitle>
              <TrendingDown className="h-4 w-4 text-destructive opacity-70 group-hover:opacity-100 transition-opacity" />
            </CardHeader>
            <CardContent className="pb-4 relative z-10 flex items-center justify-between">
              <div className="text-3xl font-bold tracking-tight text-foreground">{metricas.perdas}</div>
              <div className="px-2 py-1 rounded bg-destructive/10 text-destructive text-xs font-bold border border-destructive/20">
                {metricas.perdasPercentual} do total
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Conteúdo Principal */}
      <Tabs defaultValue="estoque" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5 bg-muted">
          <TabsTrigger value="estoque" className="flex items-center gap-2">
            <Package className="h-4 w-4" />
            Estoque
          </TabsTrigger>
          <TabsTrigger value="compras" className="flex items-center gap-2">
            <ShoppingCart className="h-4 w-4" />
            Compras
          </TabsTrigger>
          <TabsTrigger value="checklist" className="flex items-center gap-2">
            <CheckSquare className="h-4 w-4" />
            Checklist
          </TabsTrigger>
          <TabsTrigger value="relatorios" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Relatórios
          </TabsTrigger>
          <TabsTrigger value="ia" className="flex items-center gap-2">
            <Brain className="h-4 w-4" />
            IA
          </TabsTrigger>
        </TabsList>

        <TabsContent value="estoque" className="space-y-6">
          <EstoqueManager />
        </TabsContent>

        <TabsContent value="compras" className="space-y-6">
          <Card className="bg-card shadow-elegant-md border-0 rounded-xl">
            <CardHeader>
              <CardTitle>Compras Inteligentes</CardTitle>
              <CardDescription>
                Sistema de sugestões automáticas baseado em IA
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {sugestoesIA.map((sugestao, index) => (
                <div key={index} className="flex items-start gap-3 p-4 rounded-xl bg-muted/50 border border-muted">
                  <Brain className="h-5 w-5 text-secondary mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm">{sugestao}</p>
                  </div>
                  <Button size="sm" variant="outline">
                    Aplicar
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="checklist" className="space-y-6">
          <Card className="bg-card shadow-elegant-md border-0 rounded-xl">
            <CardHeader>
              <CardTitle>Checklist Diário A&B</CardTitle>
              <CardDescription>
                Tarefas obrigatórias do setor de alimentos e bebidas
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  "Verificar temperatura das geladeiras",
                  "Conferir validade dos produtos perecíveis",
                  "Limpeza e sanitização da cozinha",
                  "Inventário de bebidas do bar",
                  "Verificar equipamentos de segurança"
                ].map((tarefa, index) => (
                  <div key={index} className="flex items-center space-x-2 p-3 rounded-xl bg-muted/50">
                    <input type="checkbox" className="rounded" />
                    <label className="text-sm flex-1">{tarefa}</label>
                  </div>
                ))}
                <Button className="w-full mt-6 bg-success hover:bg-success/90">
                  <CheckSquare className="mr-2 h-4 w-4" />
                  Finalizar Checklist
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="relatorios" className="space-y-6">
          <InventoryReports />
        </TabsContent>

        <TabsContent value="ia" className="space-y-6">
          <Card className="bg-card shadow-elegant-md border-0 rounded-xl border-l-4 border-l-secondary">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5 text-secondary" />
                Assistente IA para A&B
              </CardTitle>
              <CardDescription>
                Faça perguntas sobre operações, sugestões e análises
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Sua pergunta:</label>
                <Textarea
                  placeholder="Ex: Quais itens devo comprar para o fim de semana? Como reduzir o CMV?"
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  className="min-h-20 rounded-xl"
                />
              </div>
              <Button
                onClick={handleAIRequest}
                disabled={isProcessingAI || !aiPrompt.trim()}
                className="w-full bg-primary hover:bg-primary/90"
              >
                {isProcessingAI ? (
                  "Processando..."
                ) : (
                  <>
                    <Brain className="mr-2 h-4 w-4" />
                    Consultar IA
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}