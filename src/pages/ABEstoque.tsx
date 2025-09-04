import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  Package, 
  Plus,
  Upload,
  AlertCircle,
  Calendar,
  DollarSign
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import UnidadeConverter from "@/components/UnidadeConverter";

interface Produto {
  id: string;
  nome: string;
  categoria: string;
  estoque_atual: number;
  unidade_medida: string;
  valor_unitario: number;
  validade: string | null;
}

export default function ABEstoque() {
  const { toast } = useToast();
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Form para lançamento manual
  const [formData, setFormData] = useState({
    produto_nome: "",
    categoria: "",
    quantidade: "",
    unidade_medida: "",
    valor_unitario: "",
    validade: "",
    responsavel: ""
  });

  // Estados para conversão de unidades
  const [quantidadeBase, setQuantidadeBase] = useState<number>(0);
  const [valorUnitarioBase, setValorUnitarioBase] = useState<number>(0);
  const [unidadeSelecionada, setUnidadeSelecionada] = useState<string>("");
  const [produtoSelecionado, setProdutoSelecionado] = useState<Produto | null>(null);

  useEffect(() => {
    fetchProdutos();
  }, []);

  const fetchProdutos = async () => {
    try {
      const { data, error } = await supabase
        .from('produtos')
        .select('*')
        .eq('ativo', true)
        .order('nome', { ascending: true });

      if (error) throw error;
      
      // Adaptar dados para incluir validade como null se não existir
      const produtosAdaptados = data?.map(produto => ({
        ...produto,
        validade: null // Temporário até implementar campo validade
      })) || [];
      
      setProdutos(produtosAdaptados);
    } catch (error) {
      console.error('Erro ao buscar produtos:', error);
    }
  };

  const handleConversaoChange = (qtdBase: number, valorBase: number, unidade: string) => {
    setQuantidadeBase(qtdBase);
    setValorUnitarioBase(valorBase);
    setUnidadeSelecionada(unidade);
  };

  const handleLancamentoManual = async () => {
    if (!formData.produto_nome || !formData.quantidade || !formData.validade) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha produto, quantidade e validade.",
        variant: "destructive"
      });
      return;
    }

    if (!quantidadeBase || !valorUnitarioBase) {
      toast({
        title: "Conversão de unidade",
        description: "Selecione uma unidade válida e valores corretos.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      // Verificar se produto existe
      let { data: produtoExistente } = await supabase
        .from('produtos')
        .select('id, estoque_atual')
        .eq('nome', formData.produto_nome)
        .eq('ativo', true)
        .single();

      let produtoId;

      if (produtoExistente) {
        // Atualizar produto existente - usar quantidade base
        const novoEstoque = produtoExistente.estoque_atual + quantidadeBase;
        
        const { error: updateError } = await supabase
          .from('produtos')
          .update({ 
            estoque_atual: novoEstoque,
            valor_unitario: valorUnitarioBase
          })
          .eq('id', produtoExistente.id);

        if (updateError) throw updateError;
        produtoId = produtoExistente.id;
      } else {
        // Criar novo produto - usar valores base
        const { data: novoProduto, error: insertError } = await supabase
          .from('produtos')
          .insert([{
            nome: formData.produto_nome,
            categoria: formData.categoria || 'Geral',
            estoque_atual: quantidadeBase,
            unidade_medida: formData.unidade_medida || 'UN',
            valor_unitario: valorUnitarioBase,
            quantidade_minima: 1,
            ativo: true
          }])
          .select('id')
          .single();

        if (insertError) throw insertError;
        produtoId = novoProduto.id;
      }

      // Registrar movimentação
      const { error: movError } = await supabase
        .from('estoque_movimentacoes')
        .insert([{
          produto_id: produtoId,
          tipo_movimentacao: 'entrada_manual',
          quantidade: quantidadeBase,
          motivo: `Lançamento manual: ${formData.quantidade} ${unidadeSelecionada} convertido para ${quantidadeBase} ${formData.unidade_medida || 'UN'}`,
          responsavel: formData.responsavel || 'Sistema'
        }]);

      if (movError) throw movError;

      toast({
        title: "Entrada registrada",
        description: "Estoque atualizado com sucesso."
      });

      // Limpar formulário
      setFormData({
        produto_nome: "",
        categoria: "",
        quantidade: "",
        unidade_medida: "",
        valor_unitario: "",
        validade: "",
        responsavel: ""
      });

      fetchProdutos();
    } catch (error) {
      console.error('Erro ao registrar entrada:', error);
      toast({
        title: "Erro",
        description: "Falha ao registrar entrada no estoque.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const calcularValorTotal = (produto: Produto) => {
    return (produto.estoque_atual * produto.valor_unitario).toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <Package className="h-6 w-6" />
            </div>
            Estoque A&B
          </h1>
          <p className="text-muted-foreground">
            Controle completo do estoque de alimentos e bebidas
          </p>
        </div>
      </div>

      {/* Conteúdo Principal */}
      <Tabs defaultValue="lancamento" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 bg-muted">
          <TabsTrigger value="lancamento" className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Lançamento Manual
          </TabsTrigger>
          <TabsTrigger value="visualizacao" className="flex items-center gap-2">
            <Package className="h-4 w-4" />
            Visualização
          </TabsTrigger>
          <TabsTrigger value="upload" className="flex items-center gap-2">
            <Upload className="h-4 w-4" />
            Upload de Nota
          </TabsTrigger>
        </TabsList>

        <TabsContent value="lancamento" className="space-y-6">
          <Card className="bg-card shadow-elegant-md border-0 rounded-xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="h-5 w-5 text-primary" />
                Lançamento Manual de Entrada
              </CardTitle>
              <CardDescription>
                Registrar entrada manual no estoque (validade obrigatória)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="produto_nome">Nome do Produto *</Label>
                  <Input
                    id="produto_nome"
                    value={formData.produto_nome}
                    onChange={(e) => setFormData({...formData, produto_nome: e.target.value})}
                    placeholder="Ex: Cerveja Skol 350ml"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="categoria">Categoria</Label>
                  <Select value={formData.categoria} onValueChange={(value) => setFormData({...formData, categoria: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a categoria" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Bebidas">Bebidas</SelectItem>
                      <SelectItem value="Cozinha">Cozinha</SelectItem>
                      <SelectItem value="Café da manhã">Café da manhã</SelectItem>
                      <SelectItem value="Limpeza">Limpeza</SelectItem>
                      <SelectItem value="Geral">Geral</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="quantidade">Quantidade *</Label>
                  <Input
                    id="quantidade"
                    type="number"
                    value={formData.quantidade}
                    onChange={(e) => setFormData({...formData, quantidade: e.target.value})}
                    placeholder="Ex: 24"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="unidade_medida">Unidade Base</Label>
                  <Select value={formData.unidade_medida} onValueChange={(value) => setFormData({...formData, unidade_medida: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Unidade base do produto" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="UN">Unidade</SelectItem>
                      <SelectItem value="KG">Quilograma</SelectItem>
                      <SelectItem value="L">Litro</SelectItem>
                      <SelectItem value="G">Grama</SelectItem>
                      <SelectItem value="ML">Mililitro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="valor_unitario">Valor Unitário (R$)</Label>
                  <Input
                    id="valor_unitario"
                    type="number"
                    step="0.01"
                    value={formData.valor_unitario}
                    onChange={(e) => setFormData({...formData, valor_unitario: e.target.value})}
                    placeholder="Ex: 2.50"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="validade">Data de Validade *</Label>
                  <Input
                    id="validade"
                    type="date"
                    value={formData.validade}
                    onChange={(e) => setFormData({...formData, validade: e.target.value})}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="responsavel">Responsável</Label>
                  <Input
                    id="responsavel"
                    value={formData.responsavel}
                    onChange={(e) => setFormData({...formData, responsavel: e.target.value})}
                    placeholder="Nome do responsável"
                  />
                </div>
              </div>

              {/* Conversor de Unidades */}
              {formData.unidade_medida && (
                <div className="p-4 bg-muted/50 rounded-xl">
                  <UnidadeConverter
                    produtoId="novo-produto"
                    unidadeBase={formData.unidade_medida}
                    onConversaoChange={handleConversaoChange}
                    quantidade={formData.quantidade}
                    valorUnitario={formData.valor_unitario}
                  />
                </div>
              )}

              <div className="flex items-center gap-2 p-3 rounded-xl bg-orange-50 border border-orange-200">
                <AlertCircle className="h-4 w-4 text-orange-600" />
                <p className="text-sm text-orange-700">
                  A validade é obrigatória para todos os produtos do estoque A&B
                </p>
              </div>

              <Button 
                onClick={handleLancamentoManual}
                disabled={loading}
                className="w-full bg-primary hover:bg-primary/90"
              >
                {loading ? "Registrando..." : "Registrar Entrada"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="visualizacao" className="space-y-6">
          <Card className="bg-card shadow-elegant-md border-0 rounded-xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5 text-primary" />
                Visualização do Estoque
              </CardTitle>
              <CardDescription>
                Produtos em estoque (somente leitura)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-xl border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Produto</TableHead>
                      <TableHead>Categoria</TableHead>
                      <TableHead>Quantidade</TableHead>
                      <TableHead>Validade</TableHead>
                      <TableHead>Valor Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {produtos.map((produto) => (
                      <TableRow key={produto.id}>
                        <TableCell className="font-medium">{produto.nome}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{produto.categoria}</Badge>
                        </TableCell>
                        <TableCell>
                          {produto.estoque_atual} {produto.unidade_medida}
                        </TableCell>
                        <TableCell>
                          {produto.validade ? (
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4 text-muted-foreground" />
                              {new Date(produto.validade).toLocaleDateString('pt-BR')}
                            </div>
                          ) : (
                            <span className="text-muted-foreground">Não informada</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <DollarSign className="h-4 w-4 text-success" />
                            {calcularValorTotal(produto)}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="upload" className="space-y-6">
          <Card className="bg-card shadow-elegant-md border-0 rounded-xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5 text-primary" />
                Upload de Nota Fiscal
              </CardTitle>
              <CardDescription>
                Enviar imagem ou PDF da nota fiscal (leitura básica)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="border-2 border-dashed border-muted rounded-xl p-8 text-center">
                <Upload className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-lg font-medium mb-2">Arraste arquivos aqui</p>
                <p className="text-muted-foreground mb-4">ou clique para selecionar</p>
                <Button variant="outline">
                  Selecionar Arquivos
                </Button>
              </div>
              
              <div className="text-sm text-muted-foreground">
                <p>• Formatos aceitos: JPG, PNG, PDF</p>
                <p>• Tamanho máximo: 10MB por arquivo</p>
                <p>• A leitura básica identifica produtos conhecidos automaticamente</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}