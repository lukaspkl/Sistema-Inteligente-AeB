import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Lock, Crown, Star, Zap } from "lucide-react";

interface PremiumModuleProps {
  moduleName: string;
  moduleIcon: React.ComponentType<{ className?: string }>;
  description: string;
  features: string[];
}

export default function PremiumModule({ 
  moduleName, 
  moduleIcon: Icon, 
  description, 
  features 
}: PremiumModuleProps) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary text-secondary-foreground">
              <Icon className="h-6 w-6" />
            </div>
            {moduleName}
          </h1>
          <p className="text-muted-foreground">
            {description}
          </p>
        </div>
        <Badge variant="outline" className="h-8 px-4 border-secondary text-secondary">
          <Lock className="mr-1 h-3 w-3" />
          Premium
        </Badge>
      </div>

      {/* Premium Content */}
      <div className="max-w-4xl mx-auto">
        <Card className="bg-gradient-card shadow-elegant-xl border-secondary/20">
          <CardHeader className="text-center pb-6">
            <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-secondary/10 ring-8 ring-secondary/5">
              <Crown className="h-10 w-10 text-secondary" />
            </div>
            <CardTitle className="text-2xl">Módulo Premium</CardTitle>
            <CardDescription className="text-base">
              Este módulo está disponível apenas no plano superior
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-8">
            {/* Features Preview */}
            <div>
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Zap className="h-5 w-5 text-secondary" />
                Funcionalidades Incluídas:
              </h3>
              <div className="grid gap-3 md:grid-cols-2">
                {features.map((feature, index) => (
                  <div key={index} className="flex items-center gap-3 p-3 rounded-lg bg-background/50">
                    <Star className="h-4 w-4 text-secondary flex-shrink-0" />
                    <span className="text-sm">{feature}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Benefits */}
            <div className="rounded-xl bg-secondary/5 p-6 border border-secondary/20">
              <h4 className="font-semibold mb-3 text-secondary">Vantagens do Plano Premium:</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-center gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-secondary" />
                  Acesso completo a todos os módulos operacionais
                </li>
                <li className="flex items-center gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-secondary" />
                  Relatórios avançados e analytics em tempo real
                </li>
                <li className="flex items-center gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-secondary" />
                  Suporte prioritário e atualizações exclusivas
                </li>
                <li className="flex items-center gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-secondary" />
                  Integração com sistemas externos (PMS, POS, etc.)
                </li>
                <li className="flex items-center gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-secondary" />
                  Consultoria especializada para implementação
                </li>
              </ul>
            </div>

            {/* CTA */}
            <div className="text-center space-y-4">
              <Button size="lg" className="bg-secondary hover:bg-secondary/90 text-secondary-foreground shadow-glow">
                <Crown className="mr-2 h-5 w-5" />
                Falar com Desenvolvedor
              </Button>
              <p className="text-xs text-muted-foreground">
                Entre em contato para conhecer os planos e liberar este módulo
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}