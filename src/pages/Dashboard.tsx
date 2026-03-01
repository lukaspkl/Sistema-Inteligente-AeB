import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChefHat, TrendingUp, AlertTriangle, DollarSign, Package, Clock, Users, Star } from "lucide-react";
import { NavLink } from "react-router-dom";
export default function Dashboard() {
  // Dados simulados para o dashboard
  const metrics = {
    vendas: "R$ 45.320",
    vendasVariacao: "+12.3%",
    estoque: "87%",
    estoqueStatus: "normal",
    funcionarios: 23,
    funcionariosAtivos: 21,
    avaliacaoMedia: 4.8
  };
  const alertas = [{
    tipo: "warning",
    titulo: "Estoque baixo",
    descricao: "Cerveja Pilsen - 12 unidades restantes"
  }, {
    tipo: "info",
    titulo: "Entrega programada",
    descricao: "Fornecedor ABC - Hoje às 14h"
  }, {
    tipo: "success",
    titulo: "Meta atingida",
    descricao: "Vendas do restaurante superaram expectativa"
  }];
  const atividades = ["João adicionou 50kg de carne ao estoque", "Maria gerou relatório de CMV mensal", "Sistema sugeriu compra de bebidas", "Checklist diário A&B concluído"];
  return <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-secondary">Dashboard Geral</h1>
          <p className="text-muted-foreground">
            Visão geral das operações do hotel
          </p>
        </div>
        <div className="flex gap-2">
          <Badge variant="secondary" className="h-8 px-3 bg-secondary/20 text-secondary border-secondary/30 shadow-sm">
            Hotel Plaza Premium
          </Badge>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-card border-border shadow-lg rounded-2xl">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-secondary">Vendas Hoje</CardTitle>
            <DollarSign className="h-4 w-4 text-card-foreground opacity-80" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-card-foreground">{metrics.vendas}</div>
            <p className="text-xs text-muted-foreground">
              {metrics.vendasVariacao} em relação a ontem
            </p>
          </CardContent>
        </Card>

        <Card className="bg-card border-border shadow-lg rounded-2xl">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-secondary">Nível Estoque</CardTitle>
            <Package className="h-4 w-4 text-card-foreground opacity-80" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-card-foreground">{metrics.estoque}</div>
            <p className="text-xs text-muted-foreground">
              Status: {metrics.estoqueStatus}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-muted border-border shadow-lg rounded-2xl">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Funcionários</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {metrics.funcionariosAtivos}/{metrics.funcionarios}
            </div>
            <p className="text-xs text-muted-foreground">
              Ativos no turno atual
            </p>
          </CardContent>
        </Card>

        <Card className="bg-muted border-border shadow-lg rounded-2xl">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Avaliação</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{metrics.avaliacaoMedia}</div>
            <p className="text-xs text-muted-foreground">
              Média geral do hotel
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Setor A&B Ativo */}
        <Card className="lg:col-span-1 bg-gradient-card shadow-elegant-lg border-primary/20">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                <ChefHat className="h-6 w-6" />
              </div>
              <div>
                <CardTitle className="flex items-center gap-2">
                  Setor A&B 
                  <Badge variant="secondary">Ativo</Badge>
                </CardTitle>
                <CardDescription>
                  Alimentos e Bebidas - Totalmente funcional
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-center">
              <div className="rounded-lg bg-background/50 p-3">
                <div className="text-2xl font-bold text-primary">R$ 12.450</div>
                <div className="text-sm text-muted-foreground">Vendas hoje</div>
              </div>
              <div className="rounded-lg bg-background/50 p-3">
                <div className="text-2xl font-bold text-secondary">342</div>
                <div className="text-sm text-muted-foreground">Itens estoque</div>
              </div>
            </div>
            <NavLink to="/ab">
              <Button className="w-full bg-primary hover:bg-primary-glow text-primary-foreground font-semibold rounded-xl shadow-md transition-all duration-200">
                Acessar Dashboard A&B
              </Button>
            </NavLink>
          </CardContent>
        </Card>

        {/* Alertas e Notificações */}
        <Card className="bg-gradient-card shadow-elegant-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-secondary font-bold">
              <AlertTriangle className="h-5 w-5 text-secondary" />
              Alertas Importantes
            </CardTitle>
            <CardDescription className="text-left">
              Notificações que precisam de atenção
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {alertas.map((alerta, index) => <div key={index} className="flex items-start gap-3 rounded-lg bg-background/50 p-3 shadow-sm">
                {alerta.tipo === 'warning' && <span className="text-warning">🔶</span>}
                {alerta.tipo === 'info' && <span className="text-primary">🔵</span>}
                {alerta.tipo === 'success' && <span className="text-success">✅</span>}
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">{alerta.titulo}</p>
                  <p className="text-xs text-muted-foreground">{alerta.descricao}</p>
                </div>
              </div>)}
          </CardContent>
        </Card>

        {/* Atividades Recentes */}
        <Card className="bg-gradient-card shadow-elegant-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-accent" />
              Atividades Recentes
            </CardTitle>
            <CardDescription>
              Últimas ações no sistema
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {atividades.map((atividade, index) => <div key={index} className="flex items-center gap-3 rounded-lg bg-background/50 p-3">
                <div className="h-2 w-2 rounded-full bg-primary" />
                <p className="text-sm">{atividade}</p>
              </div>)}
          </CardContent>
        </Card>

        {/* Módulos Premium */}
        <Card className="bg-gradient-card shadow-elegant-md border-secondary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-secondary">
              <TrendingUp className="h-5 w-5" />
              Módulos Premium
            </CardTitle>
            <CardDescription>
              Desbloqueie funcionalidades avançadas
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="text-sm text-muted-foreground">
              Módulos disponíveis no plano superior:
            </div>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-secondary" />
                Governança e Quartos
              </li>
              <li className="flex items-center gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-secondary" />
                Gestão de Compras
              </li>
              <li className="flex items-center gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-secondary" />
                Manutenção Inteligente
              </li>
            </ul>
            <Button variant="outline" className="w-full border-secondary text-secondary hover:bg-secondary/10">
              Falar com Desenvolvedor
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>;
}