import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  Settings, 
  Upload,
  Save,
  Building,
  Package,
  AlertCircle
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";

export default function ABConfiguracoes() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  
  // Configurações do hotel/negócio
  const [hotelConfig, setHotelConfig] = useState({
    nome: "Hotel Excellence",
    logo_url: "",
    endereco: "",
    telefone: "",
    email: ""
  });

  // Parâmetros A&B
  const [abConfig, setAbConfig] = useState({
    quantidade_minima_padrao: "5",
    dias_aviso_vencimento: "7",
    percentual_alerta_perdas: "3",
    responsavel_padrao: "",
    observacoes_gerais: ""
  });

  const handleSalvarHotel = async () => {
    setLoading(true);
    try {
      // Simular salvamento das configurações
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast({
        title: "Configurações salvas",
        description: "As informações do hotel foram atualizadas com sucesso."
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Falha ao salvar configurações do hotel.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSalvarAB = async () => {
    setLoading(true);
    try {
      // Simular salvamento dos parâmetros A&B
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast({
        title: "Parâmetros salvos",
        description: "Os parâmetros do módulo A&B foram atualizados."
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Falha ao salvar parâmetros A&B.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUploadLogo = () => {
    toast({
      title: "Em desenvolvimento",
      description: "A funcionalidade de upload de logo está sendo desenvolvida."
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <Settings className="h-6 w-6" />
            </div>
            Configurações A&B
          </h1>
          <p className="text-muted-foreground">
            Configurações básicas do hotel e parâmetros do módulo A&B
          </p>
        </div>
      </div>

      {/* Configurações do Hotel */}
      <Card className="bg-card shadow-elegant-md border-0 rounded-xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building className="h-5 w-5 text-primary" />
            Informações do Hotel/Negócio
          </CardTitle>
          <CardDescription>
            Dados básicos que aparecem no header e relatórios
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Upload de Logo */}
          <div className="space-y-2">
            <Label>Logo do Hotel</Label>
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 rounded-xl border-2 border-dashed border-muted flex items-center justify-center bg-muted/20">
                {hotelConfig.logo_url ? (
                  <img 
                    src={hotelConfig.logo_url} 
                    alt="Logo" 
                    className="w-full h-full object-cover rounded-xl"
                  />
                ) : (
                  <Upload className="h-8 w-8 text-muted-foreground" />
                )}
              </div>
              <div className="space-y-2">
                <Button onClick={handleUploadLogo} variant="outline" size="sm">
                  <Upload className="h-4 w-4 mr-2" />
                  Enviar Logo
                </Button>
                <p className="text-xs text-muted-foreground">
                  Formatos aceitos: JPG, PNG (máx. 2MB)
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="nome_hotel">Nome do Hotel/Negócio</Label>
              <Input
                id="nome_hotel"
                value={hotelConfig.nome}
                onChange={(e) => setHotelConfig({...hotelConfig, nome: e.target.value})}
                placeholder="Ex: Hotel Excellence"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="telefone">Telefone</Label>
              <Input
                id="telefone"
                value={hotelConfig.telefone}
                onChange={(e) => setHotelConfig({...hotelConfig, telefone: e.target.value})}
                placeholder="(11) 99999-9999"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                type="email"
                value={hotelConfig.email}
                onChange={(e) => setHotelConfig({...hotelConfig, email: e.target.value})}
                placeholder="contato@hotel.com"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="endereco">Endereço</Label>
            <Textarea
              id="endereco"
              value={hotelConfig.endereco}
              onChange={(e) => setHotelConfig({...hotelConfig, endereco: e.target.value})}
              placeholder="Endereço completo do hotel..."
              className="min-h-20"
            />
          </div>

          <Button 
            onClick={handleSalvarHotel}
            disabled={loading}
            className="w-full bg-primary hover:bg-primary/90"
          >
            {loading ? "Salvando..." : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Salvar Informações do Hotel
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Parâmetros A&B */}
      <Card className="bg-card shadow-elegant-md border-0 rounded-xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5 text-primary" />
            Parâmetros do Módulo A&B
          </CardTitle>
          <CardDescription>
            Configurações específicas para o controle de estoque e operações
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="qtd_minima">Quantidade Mínima Padrão</Label>
              <Input
                id="qtd_minima"
                type="number"
                value={abConfig.quantidade_minima_padrao}
                onChange={(e) => setAbConfig({...abConfig, quantidade_minima_padrao: e.target.value})}
                placeholder="5"
              />
              <p className="text-xs text-muted-foreground">
                Quantidade mínima padrão para novos produtos
              </p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="dias_aviso">Dias de Aviso de Vencimento</Label>
              <Input
                id="dias_aviso"
                type="number"
                value={abConfig.dias_aviso_vencimento}
                onChange={(e) => setAbConfig({...abConfig, dias_aviso_vencimento: e.target.value})}
                placeholder="7"
              />
              <p className="text-xs text-muted-foreground">
                Quantos dias antes do vencimento alertar
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="percentual_perdas">% Alerta de Perdas</Label>
              <Input
                id="percentual_perdas"
                type="number"
                step="0.1"
                value={abConfig.percentual_alerta_perdas}
                onChange={(e) => setAbConfig({...abConfig, percentual_alerta_perdas: e.target.value})}
                placeholder="3.0"
              />
              <p className="text-xs text-muted-foreground">
                Percentual máximo de perdas sobre o estoque
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="responsavel_padrao">Responsável Padrão</Label>
              <Input
                id="responsavel_padrao"
                value={abConfig.responsavel_padrao}
                onChange={(e) => setAbConfig({...abConfig, responsavel_padrao: e.target.value})}
                placeholder="Nome do responsável padrão"
              />
              <p className="text-xs text-muted-foreground">
                Nome usado automaticamente nos lançamentos
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="observacoes_gerais">Observações Gerais</Label>
            <Textarea
              id="observacoes_gerais"
              value={abConfig.observacoes_gerais}
              onChange={(e) => setAbConfig({...abConfig, observacoes_gerais: e.target.value})}
              placeholder="Observações e instruções gerais para o módulo A&B..."
              className="min-h-24"
            />
          </div>

          <div className="flex items-center gap-2 p-4 rounded-xl bg-blue-50 border border-blue-200">
            <AlertCircle className="h-4 w-4 text-blue-600" />
            <div className="text-sm text-blue-700">
              <p className="font-medium">Configurações simplificadas</p>
              <p>Este módulo mantém apenas as configurações essenciais. Funcionalidades avançadas como usuários e permissões serão adicionadas em versões futuras.</p>
            </div>
          </div>

          <Button 
            onClick={handleSalvarAB}
            disabled={loading}
            className="w-full bg-success hover:bg-success/90"
          >
            {loading ? "Salvando..." : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Salvar Parâmetros A&B
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Informações do Sistema */}
      <Card className="bg-card shadow-elegant-md border-0 rounded-xl border-l-4 border-l-secondary">
        <CardHeader>
          <CardTitle className="text-lg">Informações do Sistema</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Versão do Módulo A&B:</span>
            <Badge variant="secondary">1.0.0</Badge>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Última Atualização:</span>
            <span className="text-sm">08/12/2024</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Status do Sistema:</span>
            <Badge variant="default" className="bg-success">Ativo</Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}