/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable prefer-const */
// This file provides a mocked version of the Supabase client using localStorage.
// It bypasses the real database from Lovable to avoid connection errors.

// Bump this version to force a full reset of all mock data
const MOCK_DB_VERSION = "v5";

const hoje = new Date();
const dateStr = (dias: number) => new Date(hoje.getTime() + dias * 86400000).toISOString().split('T')[0];

// Run version migration on startup
if (localStorage.getItem('mock_db_version') !== MOCK_DB_VERSION) {
  const keysToRemove = Object.keys(localStorage).filter(k => k.startsWith('mock_db_'));
  keysToRemove.forEach(k => localStorage.removeItem(k));
  localStorage.setItem('mock_db_version', MOCK_DB_VERSION);
}

const setTable = (table: string, data: any[]) => {
  localStorage.setItem(`mock_db_${table}`, JSON.stringify(data));
};

const getTable = (table: string) => {
  const data = localStorage.getItem(`mock_db_${table}`);
  const parsedData = data ? JSON.parse(data) : null;
  if (parsedData) return parsedData;

  if (table === 'produtos') {
    const defaultProdutos = [
      { id: '1', nome: 'Cerveja Artesanal Lata 350ml', categoria: 'Bebidas', unidade_medida: 'UN', estoque_atual: 24, quantidade_minima: 50, valor_unitario: 8.50, ativo: true, validade: dateStr(5), fornecedor_id: '1' },
      { id: '2', nome: 'Arroz Branco 5kg Tio João', categoria: 'Geral', unidade_medida: 'PCT', estoque_atual: 8, quantidade_minima: 15, valor_unitario: 22.90, ativo: true, validade: dateStr(12), fornecedor_id: '2' },
      { id: '3', nome: 'Picanha Bovina (Peça)', categoria: 'Carnes', unidade_medida: 'KG', estoque_atual: 15.5, quantidade_minima: 10, valor_unitario: 85.00, ativo: true, validade: dateStr(2), fornecedor_id: '3' },
      { id: '4', nome: 'Vodka Absolut 1L', categoria: 'Bebidas', unidade_medida: 'GF', estoque_atual: 5, quantidade_minima: 12, valor_unitario: 95.00, ativo: true, validade: dateStr(28), fornecedor_id: '1' },
      { id: '5', nome: 'Tomate Pellati', categoria: 'Cozinha', unidade_medida: 'LT', estoque_atual: 45, quantidade_minima: 20, valor_unitario: 14.50, ativo: true, validade: dateStr(45), fornecedor_id: '2' },
    ];
    setTable(table, defaultProdutos);
    return defaultProdutos;
  }

  if (table === 'estoque_movimentacoes') {
    const defaultMovs = [
      { id: '1', produto_id: '1', tipo_movimentacao: 'entrada_inicial', quantidade: 50, responsavel: 'Sistema', data_movimentacao: new Date(Date.now() - 86400000).toISOString() },
      { id: '2', produto_id: '2', tipo_movimentacao: 'saida', quantidade: -5, responsavel: 'João Silva', motivo: 'Consumo do restaurante', data_movimentacao: new Date().toISOString() },
    ];
    setTable(table, defaultMovs);
    return defaultMovs;
  }

  if (table === 'fornecedores') {
    const defaultFornecedores = [
      { id: '1', nome: 'Distribuidora Premium Bebidas', contato: '(11) 98888-7777', condicoes_pagamento: '30, 60 e 90 dias', prazo_entrega: '1 a 2 dias', data_cadastro: new Date().toISOString() },
      { id: '2', nome: 'Bazar Central Embalagens', contato: 'vendas@bazar.com', condicoes_pagamento: 'À vista', prazo_entrega: 'Imediato', data_cadastro: new Date().toISOString() },
      { id: '3', nome: 'Frigorífico Boi Gordo', contato: '(11) 3333-4444', condicoes_pagamento: '15 dias', prazo_entrega: 'Semanal (Segunda)', data_cadastro: new Date().toISOString() },
    ];
    setTable(table, defaultFornecedores);
    return defaultFornecedores;
  }

  if (table === 'pedidos') {
    const defaultPedidos = [
      { id: '1', setor: 'A&B', responsavel: 'João Silva', status: 'pendente', observacoes: 'Pedido quinzenal de bebidas de alto giro', fornecedor_id: '1', data_pedido: new Date().toISOString() }
    ];
    setTable(table, defaultPedidos);
    return defaultPedidos;
  }

  if (table === 'itens_pedido') {
    const defaultItens = [
      { id: '1', pedido_id: '1', produto_id: '1', quantidade: 100 },
      { id: '2', pedido_id: '1', produto_id: '4', quantidade: 12 }
    ];
    setTable(table, defaultItens);
    return defaultItens;
  }

  return [];
};


class MockQueryBuilder {
  table: string;
  action: 'select' | 'insert' | 'update' | 'delete' | null = null;
  payload: any = null;
  filters: any[] = [];
  isSingle = false;

  constructor(table: string) { this.table = table; }

  select(_columns?: string) { this.action = 'select'; return this; }
  insert(payload: any) { this.action = 'insert'; this.payload = payload; return this; }
  update(payload: any) { this.action = 'update'; this.payload = payload; return this; }
  delete() { this.action = 'delete'; return this; }

  eq(column: string, value: any) { this.filters.push({ col: column, op: 'eq', val: value }); return this; }
  gt(column: string, value: any) { this.filters.push({ col: column, op: 'gt', val: value }); return this; }
  gte(column: string, value: any) { this.filters.push({ col: column, op: 'gte', val: value }); return this; }
  lt(column: string, value: any) { this.filters.push({ col: column, op: 'lt', val: value }); return this; }
  lte(column: string, value: any) { this.filters.push({ col: column, op: 'lte', val: value }); return this; }
  is(column: string, value: any) { this.filters.push({ col: column, op: 'is', val: value }); return this; }
  order() { return this; }
  limit() { return this; }
  single() { this.isSingle = true; return this; }

  private matchRow(row: any): boolean {
    return this.filters.every(f => {
      const v = row[f.col];
      switch (f.op) {
        case 'eq': return v === f.val;
        case 'gt': return v > f.val;
        case 'gte': return v >= f.val;
        case 'lt': return v < f.val;
        case 'lte': return v <= f.val;
        case 'is': return f.val === null ? v == null : v === f.val;
        default: return true;
      }
    });
  }

  async then(resolve: any, _reject: any) {
    try {
      let rows = getTable(this.table);
      if (this.action === 'select') {
        const result = rows.filter((r: any) => this.matchRow(r));
        if (this.isSingle) resolve({ data: result[0] || null, error: null });
        else resolve({ data: result, error: null });
      } else if (this.action === 'insert') {
        const newRows = Array.isArray(this.payload) ? this.payload : [this.payload];
        const withIds = newRows.map((r: any) => ({ ...r, id: Math.random().toString(36).substring(7), data_cadastro: new Date().toISOString(), data_pedido: r.data_pedido || new Date().toISOString() }));
        rows = [...rows, ...withIds];
        setTable(this.table, rows);
        if (this.isSingle) resolve({ data: withIds[0], error: null });
        else resolve({ data: withIds, error: null });
      } else if (this.action === 'update') {
        const updated: any[] = [];
        rows = rows.map((r: any) => {
          if (this.matchRow(r)) {
            const newR = { ...r, ...this.payload };
            updated.push(newR);
            return newR;
          }
          return r;
        });
        setTable(this.table, rows);
        if (this.isSingle) resolve({ data: updated[0] || null, error: null });
        else resolve({ data: updated, error: null });
      } else if (this.action === 'delete') {
        rows = rows.filter((r: any) => !this.matchRow(r));
        setTable(this.table, rows);
        resolve({ data: null, error: null });
      } else {
        resolve({ data: [], error: null });
      }
    } catch (e) {
      resolve({ data: null, error: e });
    }
  }
}

export const supabase = {
  from: (table: string) => new MockQueryBuilder(table),
  auth: {
    getSession: async () => ({ data: { session: null }, error: null }),
    onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => { } } } }),
    signOut: async () => ({ error: null }),
  }
} as any;