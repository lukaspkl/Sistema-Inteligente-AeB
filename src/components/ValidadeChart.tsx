import { useState, useEffect } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, Calendar, Package } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { addDays, isBefore, isAfter } from "date-fns";

interface ValidadeData {
  categoria: string;
  quantidade: number;
  produtos: string[];
}

interface ProdutoValidade {
  nome: string;
  validade: string | null;
  estoque_atual: number;
  categoria: string | null;
}

export default function ValidadeChart() {
  const { toast } = useToast();
  const [validadeData, setValidadeData] = useState<ValidadeData[]>([]);
  const [produtosVencendo, setProdutosVencendo] = useState<ProdutoValidade[]>([]);
  const [loading, setLoading] = useState(true);

  const cores = [
    '#ef4444', // Vermelho para 7 dias
    '#f97316', // Laranja para 15 dias  
    '#eab308', // Amarelo para 30 dias
    '#22c55e'  // Verde para válidos
  ];

  useEffect(() => {
    carregarDadosValidade();
  }, []);

  const carregarDadosValidade = async () => {
    try {
      setLoading(true);

      const { data: produtos, error } = await supabase
        .from('produtos')
        .select('nome, estoque_atual, categoria')
        .eq('ativo', true)
        .gt('estoque_atual', 0);

      if (error) throw error;

      const hoje = new Date();
      const seteDias = addDays(hoje, 7);
      const quinzeDias = addDays(hoje, 15);
      const trintaDias = addDays(hoje, 30);

      let venceEm7 = 0;
      let venceEm15 = 0;
      let venceEm30 = 0;
      let semValidade = 0;
      let vencidos = 0;
      let validos = 0;

      const produtosVencendoList: ProdutoValidade[] = [];
      const produtos7: string[] = [];
      const produtos15: string[] = [];
      const produtos30: string[] = [];

      // Simular dados para demonstração já que validade ainda não foi implementada
      produtos?.forEach(produto => {
        // Por enquanto, todos os produtos sem validade cadastrada
        semValidade++;
      });

      const dadosGrafico: ValidadeData[] = [
        { categoria: "Vencidos", quantidade: vencidos, produtos: [] },
        { categoria: "Vencem em 7 dias", quantidade: venceEm7, produtos: produtos7 },
        { categoria: "Vencem em 15 dias", quantidade: venceEm15, produtos: produtos15 },
        { categoria: "Vencem em 30 dias", quantidade: venceEm30, produtos: produtos30 },
        { categoria: "Sem validade", quantidade: semValidade, produtos: [] },
        { categoria: "Válidos", quantidade: validos, produtos: [] }
      ].filter(item => item.quantidade > 0);

      setValidadeData(dadosGrafico);
      setProdutosVencendo(produtosVencendoList);

    } catch (error) {
      console.error('Erro ao carregar dados de validade:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar dados de validade dos produtos",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-background border rounded-lg p-3 shadow-lg">
          <p className="font-medium">{data.categoria}</p>
          <p className="text-sm text-muted-foreground">
            {data.quantidade} produto{data.quantidade !== 1 ? 's' : ''}
          </p>
          {data.produtos && data.produtos.length > 0 && (
            <div className="text-xs mt-2">
              <strong>Produtos:</strong>
              <ul className="list-disc list-inside">
                {data.produtos.slice(0, 3).map((produto: string, index: number) => (
                  <li key={index}>{produto}</li>
                ))}
                {data.produtos.length > 3 && (
                  <li>+ {data.produtos.length - 3} outros</li>
                )}
              </ul>
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex justify-center">
          <div className="animate-pulse h-64 w-64 bg-muted rounded-full"></div>
        </div>
        <div className="space-y-2">
          {[1, 2, 3].map(i => (
            <div key={i} className="animate-pulse h-16 bg-muted rounded-xl"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Gráfico de Pizza */}
      <div className="flex justify-center">
        <ResponsiveContainer width={350} height={300}>
          <PieChart>
            <Pie
              data={validadeData}
              cx="50%"
              cy="50%"
              outerRadius={100}
              fill="#8884d8"
              dataKey="quantidade"
              label={({ categoria, quantidade }) => `${categoria}: ${quantidade}`}
            >
              {validadeData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={cores[index % cores.length]} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Gráfico de Barras */}
      <ResponsiveContainer width="100%" height={250}>
        <BarChart data={validadeData}>
          <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
          <XAxis 
            dataKey="categoria" 
            angle={-45}
            textAnchor="end"
            height={100}
          />
          <YAxis />
          <Tooltip content={<CustomTooltip />} />
          <Bar dataKey="quantidade" fill="hsl(var(--primary))" />
        </BarChart>
      </ResponsiveContainer>

      {/* Lista de Produtos Críticos */}
      {produtosVencendo.length > 0 && (
        <div className="space-y-3">
          <h4 className="font-semibold text-destructive flex items-center gap-2">
            <AlertCircle className="h-4 w-4" />
            Produtos Críticos (Vencidos ou Vencem em 7 dias)
          </h4>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {produtosVencendo.map((produto, index) => {
              const isVencido = produto.validade ? isBefore(new Date(produto.validade), new Date()) : false;
              
              return (
                <div key={index} className="flex items-center justify-between p-3 bg-destructive/10 rounded-xl border border-destructive/20">
                  <div className="flex-1">
                    <div className="font-medium">{produto.nome}</div>
                    <div className="text-sm text-muted-foreground">
                      Categoria: {produto.categoria || 'Sem categoria'} | Estoque: {produto.estoque_atual}
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge variant={isVencido ? "destructive" : "outline"} className="mb-1">
                      {isVencido ? "VENCIDO" : "VENCE EM BREVE"}
                    </Badge>
                    {produto.validade && (
                      <div className="text-xs text-muted-foreground">
                        {new Date(produto.validade).toLocaleDateString('pt-BR')}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {validadeData.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>Campo de validade será implementado em breve</p>
          <p className="text-sm mt-2">Aguarde a próxima atualização para monitoramento completo de validades</p>
        </div>
      )}
    </div>
  );
}