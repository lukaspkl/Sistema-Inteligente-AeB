export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.12 (cd3cf9e)"
  }
  public: {
    Tables: {
      estoque_movimentacoes: {
        Row: {
          data_movimentacao: string
          id: string
          motivo: string | null
          produto_id: string | null
          quantidade: number
          responsavel: string | null
          tipo_movimentacao: string | null
        }
        Insert: {
          data_movimentacao?: string
          id?: string
          motivo?: string | null
          produto_id?: string | null
          quantidade: number
          responsavel?: string | null
          tipo_movimentacao?: string | null
        }
        Update: {
          data_movimentacao?: string
          id?: string
          motivo?: string | null
          produto_id?: string | null
          quantidade?: number
          responsavel?: string | null
          tipo_movimentacao?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "estoque_movimentacoes_produto_id_fkey"
            columns: ["produto_id"]
            isOneToOne: false
            referencedRelation: "produtos"
            referencedColumns: ["id"]
          },
        ]
      }
      itens_nota_fiscal: {
        Row: {
          id: string
          nacionalidade: string | null
          ncm: string | null
          nota_fiscal_id: string | null
          produto_id: string | null
          quantidade: number
          valor_total: number | null
          valor_unitario: number | null
        }
        Insert: {
          id?: string
          nacionalidade?: string | null
          ncm?: string | null
          nota_fiscal_id?: string | null
          produto_id?: string | null
          quantidade: number
          valor_total?: number | null
          valor_unitario?: number | null
        }
        Update: {
          id?: string
          nacionalidade?: string | null
          ncm?: string | null
          nota_fiscal_id?: string | null
          produto_id?: string | null
          quantidade?: number
          valor_total?: number | null
          valor_unitario?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "itens_nota_fiscal_nota_fiscal_id_fkey"
            columns: ["nota_fiscal_id"]
            isOneToOne: false
            referencedRelation: "notas_fiscais"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "itens_nota_fiscal_produto_id_fkey"
            columns: ["produto_id"]
            isOneToOne: false
            referencedRelation: "produtos"
            referencedColumns: ["id"]
          },
        ]
      }
      itens_pedido: {
        Row: {
          id: string
          pedido_id: string | null
          produto_id: string | null
          quantidade: number
        }
        Insert: {
          id?: string
          pedido_id?: string | null
          produto_id?: string | null
          quantidade: number
        }
        Update: {
          id?: string
          pedido_id?: string | null
          produto_id?: string | null
          quantidade?: number
        }
        Relationships: [
          {
            foreignKeyName: "itens_pedido_pedido_id_fkey"
            columns: ["pedido_id"]
            isOneToOne: false
            referencedRelation: "pedidos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "itens_pedido_produto_id_fkey"
            columns: ["produto_id"]
            isOneToOne: false
            referencedRelation: "produtos"
            referencedColumns: ["id"]
          },
        ]
      }
      notas_fiscais: {
        Row: {
          data_cadastro: string
          data_emissao: string | null
          fornecedor: string | null
          id: string
          numero_nota: string
          observacoes: string | null
          valor_total: number | null
        }
        Insert: {
          data_cadastro?: string
          data_emissao?: string | null
          fornecedor?: string | null
          id?: string
          numero_nota: string
          observacoes?: string | null
          valor_total?: number | null
        }
        Update: {
          data_cadastro?: string
          data_emissao?: string | null
          fornecedor?: string | null
          id?: string
          numero_nota?: string
          observacoes?: string | null
          valor_total?: number | null
        }
        Relationships: []
      }
      pedidos: {
        Row: {
          data_pedido: string
          id: string
          observacoes: string | null
          responsavel: string | null
          setor: string | null
          status: string | null
        }
        Insert: {
          data_pedido?: string
          id?: string
          observacoes?: string | null
          responsavel?: string | null
          setor?: string | null
          status?: string | null
        }
        Update: {
          data_pedido?: string
          id?: string
          observacoes?: string | null
          responsavel?: string | null
          setor?: string | null
          status?: string | null
        }
        Relationships: []
      }
      perdas: {
        Row: {
          atualizou_estoque: boolean | null
          data_perda: string
          id: string
          id_produto: string
          motivo: string | null
          observacoes: string | null
          quantidade: number
          responsavel: string | null
          valor_perda: number | null
        }
        Insert: {
          atualizou_estoque?: boolean | null
          data_perda?: string
          id?: string
          id_produto: string
          motivo?: string | null
          observacoes?: string | null
          quantidade?: number
          responsavel?: string | null
          valor_perda?: number | null
        }
        Update: {
          atualizou_estoque?: boolean | null
          data_perda?: string
          id?: string
          id_produto?: string
          motivo?: string | null
          observacoes?: string | null
          quantidade?: number
          responsavel?: string | null
          valor_perda?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "perdas_id_produto_fkey"
            columns: ["id_produto"]
            isOneToOne: false
            referencedRelation: "produtos"
            referencedColumns: ["id"]
          },
        ]
      }
      produtos: {
        Row: {
          ativo: boolean | null
          categoria: string | null
          data_cadastro: string
          estoque_atual: number | null
          id: string
          nome: string
          quantidade_minima: number | null
          unidade_medida: string | null
          valor_unitario: number | null
        }
        Insert: {
          ativo?: boolean | null
          categoria?: string | null
          data_cadastro?: string
          estoque_atual?: number | null
          id?: string
          nome: string
          quantidade_minima?: number | null
          unidade_medida?: string | null
          valor_unitario?: number | null
        }
        Update: {
          ativo?: boolean | null
          categoria?: string | null
          data_cadastro?: string
          estoque_atual?: number | null
          id?: string
          nome?: string
          quantidade_minima?: number | null
          unidade_medida?: string | null
          valor_unitario?: number | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
