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
  Trash2, 
  Plus,
  TrendingDown,
  Calendar,
  DollarSign,
  AlertTriangle,
  Clock
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface Produto {
  id: string;
  nome: string;
  estoque_atual: number;
  valor_unitario: number;
  unidade_medida: string;
}

interface Perda {
  id: string;
  produto_id: string;
  quantidade: number;
  tipo: string;
  origem_estoque: boolean;
  valor_perda: number;
  data_perda: string;
  responsavel: string;
  observacoes: string;
  produtos: {
    nome: string;
  };
}

export default function ABPerdas() {
  const { toast } = useToast();
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [perdas, setPerdas] = useState<Perda[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Form para registro de perda
  const [perdaForm, setPerdaForm] = useState({
    produto_id: "",
    quantidade: "",
    tipo: "",
    origem_estoque: true,
    valor_externo: "",
    responsavel: "",
    observacoes: ""
  });

  useEffect(() => {
    fetchProdutos();
    fetchPerdas();
  }, []);

  const fetchProdutos = async () => {
    try {
      const { data, error } = await supabase
        .from('produtos')
        .select('id, nome, estoque_atual, valor_unitario, unidade_medida')
        .eq('ativo', true)
        .order('nome', { ascending: true });

      if (error) throw error;
      setProdutos(data || []);
    } catch (error) {
      console.error('Erro ao buscar produtos:', error);
    }
  };

  const fetchPerdas = async () => {
    try {
      const { data, error } = await supabase
        .from('perdas')
        .select(`
          *,
          produtos!inner(nome)
        `)
        .order('data_perda', { ascending: false })
        .limit(50);

      if (error) throw error;
      setPerdas(data || []);
    } catch (error) {
      console.error('Erro ao buscar perdas:', error);
    }
  };

  const handleRegistrarPerda = async () => {
    if (!perdaForm.produto_id && perdaForm.origem_estoque) {
      toast({
        title: "Produto obrigatório",
        description: "Selecione um produto para perda do estoque.",
        variant: "destructive"
      });
      return;
    }

    if (!perdaForm.quantidade || !perdaForm.tipo) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha quantidade e tipo de perda.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      let valorPerda = 0;
      let produtoId = perdaForm.produto_id;

      if (perdaForm.origem_estoque) {
        // Perda do estoque - calcular valor e atualizar estoque
        const produto = produtos.find(p => p.id === perdaForm.produto_id);
        if (!produto) {
          throw new Error('Produto não encontrado');
        }

        const quantidadePerda = parseInt(perdaForm.quantidade);
        if (quantidadePerda > produto.estoque_atual) {
          toast({
            title: "Quantidade inválida",
            description: "A quantidade de perda não pode ser maior que o estoque atual.",
            variant: "destructive"
          });
          return;
        }

        valorPerda = quantidadePerda * produto.valor_unitario;

        // Atualizar estoque
        const novoEstoque = produto.estoque_atual - quantidadePerda;
        const { error: updateError } = await supabase
          .from('produtos')
          .update({ estoque_atual: novoEstoque })
          .eq('id', perdaForm.produto_id);

        if (updateError) throw updateError;
      } else {
        // Perda externa - usar valor informado
        valorPerda = parseFloat(perdaForm.valor_externo || '0');
        produtoId = null;
      }

      // Registrar perda
      const { error } = await supabase
        .from('perdas')
        .insert([{
          produto_id: produtoId,
          quantidade: parseInt(perdaForm.quantidade),
          tipo: perdaForm.tipo,
          origem_estoque: perdaForm.origem_estoque,
          valor_perda: valorPerda,
          responsavel: perdaForm.responsavel || 'Sistema',
          observacoes: perdaForm.observacoes,
          data_perda: new Date().toISOString()
        }]);

      if (error) throw error;

      toast({
        title: "Perda registrada",
        description: `Perda de ${valorPerda.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} registrada com sucesso.`
      });

      // Limpar formulário
      setPerdaForm({
        produto_id: "",
        quantidade: "",
        tipo: "",
        origem_estoque: true,
        valor_externo: "",
        responsavel: "",
        observacoes: ""
      });

      fetchProdutos();
      fetchPerdas();
    } catch (error) {
      console.error('Erro ao registrar perda:', error);
      toast({
        title: "Erro",
        description: "Falha ao registrar perda.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const calcularTotalPerdas = (periodo: 'mes' | 'trimestre') => {
    const hoje = new Date();
    const dataLimite = new Date();
    
    if (periodo === 'mes') {
      dataLimite.setMonth(hoje.getMonth() - 1);
    } else {
      dataLimite.setMonth(hoje.getMonth() - 3);
    }

    return perdas
      .filter(p => new Date(p.data_perda) >= dataLimite)
      .reduce((sum, p) => sum + p.valor_perda, 0);
  };

  const perdasMes = calcularTotalPerdas('mes');
  const perdasTrimestre = calcularTotalPerdas('trimestre');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-destructive text-destructive-foreground">
              <Trash2 className="h-6 w-6" />
            </div>
            Perdas A&B
          </h1>
          <p className="text-muted-foreground">
            Controle de perdas por quebra e validade
          </p>
        </div>
        
        {/* Resumo de Perdas */}
        <div className="flex items-center gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-destructive">
              {perdasMes.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </div>
            <div className="text-xs text-muted-foreground">Este mês</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-muted-foreground">
              {perdasTrimestre.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </div>
            <div className="text-xs text-muted-foreground">Trimestre</div>
          </div>
        </div>
      </div>

      {/* Conteúdo Principal */}
      <Tabs defaultValue="registrar" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 bg-muted">
          <TabsTrigger value="registrar" className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Registrar Perda
          </TabsTrigger>
          <TabsTrigger value="historico" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Histórico
          </TabsTrigger>
        </TabsList>

        <TabsContent value="registrar" className="space-y-6">
          <Card className="bg-card shadow-elegant-md border-0 rounded-xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="h-5 w-5 text-destructive" />
                Registrar Nova Perda
              </CardTitle>
              <CardDescription>
                Registrar perda por quebra, validade ou origem externa
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Origem da Perda */}
              <div className="space-y-2">
                <Label>Origem da Perda</Label>
                <div className="flex items-center gap-4">
                  <label className="flex items-center space-x-2">
                    <input
                      type="radio"
                      checked={perdaForm.origem_estoque}
                      onChange={() => setPerdaForm({...perdaForm, origem_estoque: true})}
                      className="rounded"
                    />
                    <span>Do Estoque</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input
                      type="radio"
                      checked={!perdaForm.origem_estoque}
                      onChange={() => setPerdaForm({...perdaForm, origem_estoque: false})}
                      className="rounded"
                    />
                    <span>Externa</span>
                  </label>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {perdaForm.origem_estoque && (
                  <div className="space-y-2">
                    <Label htmlFor="produto">Produto *</Label>
                    <Select value={perdaForm.produto_id} onValueChange={(value) => setPerdaForm({...perdaForm, produto_id: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o produto" />
                      </SelectTrigger>
                      <SelectContent>
                        {produtos.map((produto) => (
                          <SelectItem key={produto.id} value={produto.id}>
                            {produto.nome} (Estoque: {produto.estoque_atual} {produto.unidade_medida})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="tipo">Tipo de Perda *</Label>
                  <Select value={perdaForm.tipo} onValueChange={(value) => setPerdaForm({...perdaForm, tipo: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="quebra">Quebra</SelectItem>
                      <SelectItem value="validade">Vencimento</SelectItem>
                      <SelectItem value="deterioracao">Deterioração</SelectItem>
                      <SelectItem value="outros">Outros</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="quantidade">Quantidade *</Label>
                  <Input
                    id="quantidade"
                    type="number"
                    value={perdaForm.quantidade}
                    onChange={(e) => setPerdaForm({...perdaForm, quantidade: e.target.value})}
                    placeholder="Ex: 5"
                  />
                </div>

                {!perdaForm.origem_estoque && (
                  <div className="space-y-2">
                    <Label htmlFor="valor_externo">Valor da Perda (R$) *</Label>
                    <Input
                      id="valor_externo"
                      type="number"
                      step="0.01"
                      value={perdaForm.valor_externo}
                      onChange={(e) => setPerdaForm({...perdaForm, valor_externo: e.target.value})}
                      placeholder="Ex: 45.00"
                    />
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="responsavel">Responsável</Label>
                  <Input
                    id="responsavel"
                    value={perdaForm.responsavel}
                    onChange={(e) => setPerdaForm({...perdaForm, responsavel: e.target.value})}
                    placeholder="Nome do responsável"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="observacoes">Observações</Label>
                <Textarea
                  id="observacoes"
                  value={perdaForm.observacoes}
                  onChange={(e) => setPerdaForm({...perdaForm, observacoes: e.target.value})}
                  placeholder="Detalhes sobre a perda..."
                  className="min-h-20"
                />
              </div>

              {perdaForm.origem_estoque && perdaForm.produto_id && (
                <div className="flex items-center gap-2 p-3 rounded-xl bg-blue-50 border border-blue-200">
                  <DollarSign className="h-4 w-4 text-blue-600" />
                  <p className="text-sm text-blue-700">
                    Valor estimado da perda: {(() => {
                      const produto = produtos.find(p => p.id === perdaForm.produto_id);
                      const quantidade = parseInt(perdaForm.quantidade || '0');
                      const valor = produto ? quantidade * produto.valor_unitario : 0;
                      return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
                    })()}
                  </p>
                </div>
              )}

              <Button 
                onClick={handleRegistrarPerda}
                disabled={loading}
                className="w-full bg-destructive hover:bg-destructive/90"
              >
                {loading ? "Registrando..." : "Registrar Perda"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="historico" className="space-y-6">
          {/* Cards de Resumo */}
          <div className="grid gap-4 md:grid-cols-3">
            <Card className="bg-card shadow-elegant-md border-0 rounded-xl">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">Perdas (Mês)</CardTitle>
                <TrendingDown className="h-5 w-5 text-destructive" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-destructive mb-1">
                  {perdasMes.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </div>
                <p className="text-xs text-muted-foreground">Últimos 30 dias</p>
              </CardContent>
            </Card>

            <Card className="bg-card shadow-elegant-md border-0 rounded-xl">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">Perdas (Trimestre)</CardTitle>
                <Calendar className="h-5 w-5 text-secondary" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-secondary mb-1">
                  {perdasTrimestre.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </div>
                <p className="text-xs text-muted-foreground">Últimos 90 dias</p>
              </CardContent>
            </Card>

            <Card className="bg-card shadow-elegant-md border-0 rounded-xl">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total de Registros</CardTitle>
                <Trash2 className="h-5 w-5 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-primary mb-1">{perdas.length}</div>
                <p className="text-xs text-muted-foreground">Perdas registradas</p>
              </CardContent>
            </Card>
          </div>

          {/* Histórico de Perdas */}
          <Card className="bg-card shadow-elegant-md border-0 rounded-xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-primary" />
                Histórico de Perdas
              </CardTitle>
              <CardDescription>
                Últimas perdas registradas no sistema
              </CardDescription>
            </CardHeader>
            <CardContent>
              {perdas.length > 0 ? (
                <div className="rounded-xl border overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Data</TableHead>
                        <TableHead>Produto</TableHead>
                        <TableHead>Tipo</TableHead>
                        <TableHead>Quantidade</TableHead>
                        <TableHead>Valor</TableHead>
                        <TableHead>Responsável</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {perdas.map((perda) => (
                        <TableRow key={perda.id}>
                          <TableCell>
                            {new Date(perda.data_perda).toLocaleDateString('pt-BR')}
                          </TableCell>
                          <TableCell className="font-medium">
                            {perda.origem_estoque ? perda.produtos?.nome || 'N/A' : 'Perda Externa'}
                          </TableCell>
                          <TableCell>
                            <Badge variant={perda.tipo === 'validade' ? 'destructive' : 'secondary'}>
                              {perda.tipo === 'quebra' && 'Quebra'}
                              {perda.tipo === 'validade' && 'Vencimento'}
                              {perda.tipo === 'deterioracao' && 'Deterioração'}
                              {perda.tipo === 'outros' && 'Outros'}
                            </Badge>
                          </TableCell>
                          <TableCell>{perda.quantidade}</TableCell>
                          <TableCell className="text-destructive font-medium">
                            {perda.valor_perda.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                          </TableCell>
                          <TableCell>{perda.responsavel}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-12">
                  <Trash2 className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Nenhuma perda registrada</h3>
                  <p className="text-muted-foreground">
                    As perdas aparecerão aqui após serem registradas
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}