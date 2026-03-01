import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Package } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface ProdutoEstoque {
  id: string;
  nome: string;
  categoria: string | null;
  estoque_atual: number;
  unidade_medida: string;
}

export default function EstoqueVisualizacao() {
  const { toast } = useToast();
  const [produtos, setProdutos] = useState<ProdutoEstoque[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    carregarProdutos();
  }, []);

  const carregarProdutos = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('produtos')
        .select('id, nome, categoria, estoque_atual, unidade_medida')
        .eq('ativo', true)
        .order('nome');

      if (error) throw error;

      setProdutos(data || []);
    } catch (error) {
      console.error('Erro ao carregar produtos:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar visualização do estoque",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card className="bg-card shadow-elegant-md border-0 rounded-xl">
        <CardHeader>
          <div className="animate-pulse space-y-3">
            <div className="h-6 bg-muted rounded w-1/2"></div>
            <div className="h-4 bg-muted rounded w-3/4"></div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="animate-pulse">
                <div className="h-16 bg-muted rounded-xl"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-card shadow-elegant-md border-0 rounded-xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Package className="h-5 w-5 text-primary" />
          Visualização do Estoque
        </CardTitle>
        <CardDescription>
          Consulta rápida dos produtos em estoque (somente leitura)
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {produtos.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Package className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>Nenhum produto cadastrado</p>
            </div>
          ) : (
            produtos.map((produto) => (
              <div 
                key={produto.id} 
                className="flex items-center justify-between p-4 rounded-xl bg-muted/30 border border-muted hover:bg-muted/50 transition-colors"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-medium text-sm">{produto.nome}</h4>
                    {produto.categoria && (
                      <Badge variant="outline" className="text-xs">
                        {produto.categoria}
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Package className="h-3 w-3" />
                      {produto.estoque_atual} {produto.unidade_medida}
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
        <div className="mt-4 pt-4 border-t border-muted">
          <p className="text-xs text-muted-foreground text-center">
            Esta é uma visualização somente leitura. Para alterações, use o lançamento manual ou upload de nota fiscal.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}