import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  FileText, 
  Upload,
  CheckCircle,
  Clock,
  AlertCircle,
  Download,
  Eye
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface MovimentacaoNota {
  id: string;
  produto_id: string;
  quantidade: number;
  data_movimentacao: string;
  responsavel: string;
  aprovado: boolean;
  produtos: {
    nome: string;
  };
}

export default function ABNotasFiscais() {
  const { toast } = useToast();
  const [movimentacoes, setMovimentacoes] = useState<MovimentacaoNota[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchMovimentacoes();
  }, []);

  const fetchMovimentacoes = async () => {
    try {
      const { data, error } = await supabase
        .from('estoque_movimentacoes')
        .select(`
          *,
          produtos!inner(nome)
        `)
        .eq('tipo_movimentacao', 'entrada_nota')
        .order('data_movimentacao', { ascending: false })
        .limit(20);

      if (error) throw error;
      setMovimentacoes(data || []);
    } catch (error) {
      console.error('Erro ao buscar movimentações:', error);
    }
  };

  const handleAprovarLancamento = async (movimentacaoId: string) => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('estoque_movimentacoes')
        .update({ aprovado: true })
        .eq('id', movimentacaoId);

      if (error) throw error;

      toast({
        title: "Lançamento aprovado",
        description: "A movimentação foi aprovada e o estoque foi atualizado."
      });

      fetchMovimentacoes();
    } catch (error) {
      console.error('Erro ao aprovar lançamento:', error);
      toast({
        title: "Erro",
        description: "Falha ao aprovar o lançamento.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUploadNota = () => {
    toast({
      title: "Em desenvolvimento",
      description: "A funcionalidade de upload de notas fiscais está sendo desenvolvida."
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <FileText className="h-6 w-6" />
            </div>
            Notas Fiscais A&B
          </h1>
          <p className="text-muted-foreground">
            Gestão de upload e lançamentos de notas fiscais
          </p>
        </div>
      </div>

      {/* Conteúdo Principal */}
      <Tabs defaultValue="upload" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 bg-muted">
          <TabsTrigger value="upload" className="flex items-center gap-2">
            <Upload className="h-4 w-4" />
            Upload de Nota
          </TabsTrigger>
          <TabsTrigger value="lancamentos" className="flex items-center gap-2">
            <Eye className="h-4 w-4" />
            Lançamentos Recentes
          </TabsTrigger>
        </TabsList>

        <TabsContent value="upload" className="space-y-6">
          <Card className="bg-card shadow-elegant-md border-0 rounded-xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5 text-primary" />
                Upload de Nota Fiscal
              </CardTitle>
              <CardDescription>
                Enviar nota fiscal para leitura automática e lançamento no estoque
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Área de Upload */}
              <div className="border-2 border-dashed border-muted rounded-xl p-12 text-center bg-muted/20">
                <Upload className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">Arraste sua nota fiscal aqui</h3>
                <p className="text-muted-foreground mb-6">
                  ou clique para selecionar arquivos do seu dispositivo
                </p>
                <Button onClick={handleUploadNota} size="lg" className="mb-4">
                  Selecionar Arquivos
                </Button>
                <div className="text-sm text-muted-foreground space-y-1">
                  <p>• Formatos aceitos: JPG, PNG, PDF</p>
                  <p>• Tamanho máximo: 20MB por arquivo</p>
                  <p>• Múltiplos arquivos podem ser enviados</p>
                </div>
              </div>

              {/* Processo de Leitura */}
              <Card className="border-l-4 border-l-blue-500 bg-blue-50/50">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <AlertCircle className="h-5 w-5 text-blue-600" />
                    Como funciona a leitura automática
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-100 text-blue-600 text-sm font-medium">1</div>
                    <div>
                      <p className="font-medium">Identificação de produtos</p>
                      <p className="text-sm text-muted-foreground">
                        O sistema busca produtos já cadastrados na nota fiscal
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-100 text-blue-600 text-sm font-medium">2</div>
                    <div>
                      <p className="font-medium">Produtos não cadastrados</p>
                      <p className="text-sm text-muted-foreground">
                        Itens desconhecidos ficam marcados para revisão manual
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-100 text-blue-600 text-sm font-medium">3</div>
                    <div>
                      <p className="font-medium">Aprovação manual</p>
                      <p className="text-sm text-muted-foreground">
                        Você pode revisar e aprovar os lançamentos antes de atualizar o estoque
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="lancamentos" className="space-y-6">
          <Card className="bg-card shadow-elegant-md border-0 rounded-xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5 text-primary" />
                Lançamentos Recentes
              </CardTitle>
              <CardDescription>
                Movimentações de estoque oriundas de notas fiscais (somente leitura)
              </CardDescription>
            </CardHeader>
            <CardContent>
              {movimentacoes.length > 0 ? (
                <div className="rounded-xl border overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Produto</TableHead>
                        <TableHead>Quantidade</TableHead>
                        <TableHead>Data</TableHead>
                        <TableHead>Responsável</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {movimentacoes.map((mov) => (
                        <TableRow key={mov.id}>
                          <TableCell className="font-medium">
                            {mov.produtos?.nome || 'Produto não encontrado'}
                          </TableCell>
                          <TableCell>{mov.quantidade}</TableCell>
                          <TableCell>
                            {new Date(mov.data_movimentacao).toLocaleDateString('pt-BR')}
                          </TableCell>
                          <TableCell>{mov.responsavel}</TableCell>
                          <TableCell>
                            {mov.aprovado ? (
                              <Badge variant="default" className="bg-success text-success-foreground">
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Aprovado
                              </Badge>
                            ) : (
                              <Badge variant="secondary">
                                <Clock className="h-3 w-3 mr-1" />
                                Pendente
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            {!mov.aprovado && (
                              <Button
                                size="sm"
                                onClick={() => handleAprovarLancamento(mov.id)}
                                disabled={loading}
                                className="bg-success hover:bg-success/90"
                              >
                                Aprovar
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-12">
                  <FileText className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Nenhum lançamento encontrado</h3>
                  <p className="text-muted-foreground">
                    Os lançamentos de notas fiscais aparecerão aqui após o upload
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Produtos Não Cadastrados */}
          <Card className="bg-card shadow-elegant-md border-0 rounded-xl border-l-4 border-l-orange-500">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-orange-600" />
                Produtos Não Cadastrados
              </CardTitle>
              <CardDescription>
                Itens encontrados nas notas que não estão no cadastro de produtos
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">
                  Nenhum produto não cadastrado encontrado
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}