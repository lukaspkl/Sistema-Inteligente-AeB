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
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <ShoppingCart className="h-6 w-6" />
            </div>
            Alimentos & Bebidas
          </h1>
          <p className="text-muted-foreground">
            Gestão inteligente de estoque, compras e operações
          </p>
        </div>

      </div>

      {/* Métricas Principais */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-card shadow-elegant-md border-0 rounded-xl hover-lift">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Vendas Hoje</CardTitle>
            <TrendingUp className="h-5 w-5 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-success mb-1">{metricas.vendasDia}</div>
            <p className="text-xs text-muted-foreground">+15.2% vs ontem</p>
          </CardContent>
        </Card>

        <Card className="bg-card shadow-elegant-md border-0 rounded-xl hover-lift">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">CMV</CardTitle>
            <BarChart3 className="h-5 w-5 text-secondary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-secondary mb-1">{metricas.cmv}</div>
            <p className="text-xs text-muted-foreground">Meta: 30%</p>
          </CardContent>
        </Card>

        <Card className="bg-card shadow-elegant-md border-0 rounded-xl hover-lift">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Estoque</CardTitle>
            <Package className="h-5 w-5 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-primary mb-1">{metricas.itensEstoque}</div>
            <p className="text-xs text-muted-foreground">Valor: {metricas.estoqueValor}</p>
          </CardContent>
        </Card>

        <Card className="bg-card shadow-elegant-md border-0 rounded-xl hover-lift">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Perdas</CardTitle>
            <TrendingDown className="h-5 w-5 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-destructive mb-1">{metricas.perdas}</div>
            <p className="text-xs text-muted-foreground">{metricas.perdasPercentual} do total</p>
          </CardContent>
        </Card>
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