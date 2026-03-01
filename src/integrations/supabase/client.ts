/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable prefer-const */
// This file provides a mocked version of the Supabase client using localStorage.
// It bypasses the real database from Lovable to avoid connection errors.

// Bump this version to force a full reset of all mock data
const MOCK_DB_VERSION = "v9_menu_itens";

const hoje = new Date();
const dateStr = (dias: number) => new Date(hoje.getTime() + dias * 86400000).toISOString().split('T')[0];

if (localStorage.getItem('mock_db_version') !== MOCK_DB_VERSION) {
  const keysToRemove = Object.keys(localStorage).filter(k => k.startsWith('mock_db_'));
  keysToRemove.forEach(k => localStorage.removeItem(k));
  // Limpa também qualquer sessão anterior
  localStorage.removeItem('mock_supabase_session');
  localStorage.setItem('mock_db_version', MOCK_DB_VERSION);
}

const getSession = () => {
  const sessionData = localStorage.getItem('mock_supabase_session');
  return sessionData ? JSON.parse(sessionData) : null;
};

const getCompanyId = () => {
  const session = getSession();
  return session?.user?.user_metadata?.company_id || null;
}

const setTable = (table: string, data: any[]) => {
  localStorage.setItem(`mock_db_${table}`, JSON.stringify(data));
};

const getTable = (table: string) => {
  const data = localStorage.getItem(`mock_db_${table}`);
  const parsedData = data ? JSON.parse(data) : null;
  if (parsedData) return parsedData;

  // INITIAL SEEDS - Multi-tenant enabled
  if (table === 'produtos') {
    const defaultProdutos = [
      // HOTEL GRAND (company_id: hotel-1)
      { id: '1', company_id: 'hotel-1', nome: 'Picanha Premium Exportação', categoria: 'Carnes', unidade_medida: 'KG', estoque_atual: 45, quantidade_minima: 20, valor_unitario: 120.00, ativo: true, validade: dateStr(10), fornecedor_id: '1' },
      { id: '2', company_id: 'hotel-1', nome: 'Espumante Chandon', categoria: 'Bebidas', unidade_medida: 'GF', estoque_atual: 120, quantidade_minima: 50, valor_unitario: 145.00, ativo: true, validade: dateStr(365), fornecedor_id: '1' },
      { id: '3', company_id: 'hotel-1', nome: 'Salmão Fresco (Preparo de Evento)', categoria: 'Frutos do Mar', unidade_medida: 'KG', estoque_atual: 15, quantidade_minima: 10, valor_unitario: 95.00, ativo: true, validade: dateStr(2), fornecedor_id: '3' },

      // BISTRO PEQUENO (company_id: bistro-1)
      { id: '4', company_id: 'bistro-1', nome: 'Cerveja Artesanal Lata 350ml', categoria: 'Bebidas', unidade_medida: 'UN', estoque_atual: 12, quantidade_minima: 24, valor_unitario: 8.50, ativo: true, validade: dateStr(30), fornecedor_id: '2' },
      { id: '5', company_id: 'bistro-1', nome: 'Arroz Branco 5kg', categoria: 'Geral', unidade_medida: 'PCT', estoque_atual: 4, quantidade_minima: 10, valor_unitario: 22.90, ativo: true, validade: dateStr(90), fornecedor_id: '2' },
    ];
    setTable(table, defaultProdutos);
    return defaultProdutos;
  }

  if (table === 'estoque_movimentacoes') {
    const defaultMovs = [
      { id: '1', company_id: 'hotel-1', produto_id: '1', tipo_movimentacao: 'entrada_inicial', quantidade: 45, responsavel: 'Sistema', data_movimentacao: new Date().toISOString() },
      { id: '2', company_id: 'bistro-1', produto_id: '4', tipo_movimentacao: 'entrada_inicial', quantidade: 12, responsavel: 'Sistema', data_movimentacao: new Date().toISOString() },
    ];
    setTable(table, defaultMovs);
    return defaultMovs;
  }

  if (table === 'fornecedores') {
    const defaultFornecedores = [
      { id: '1', company_id: 'hotel-1', nome: 'Distribuidora Premium Hoteleira', contato: '(11) 98888-7777', data_cadastro: new Date().toISOString() },
      { id: '2', company_id: 'bistro-1', nome: 'Mercadão Central', contato: 'vendas@mercadao.com', data_cadastro: new Date().toISOString() },
    ];
    setTable(table, defaultFornecedores);
    return defaultFornecedores;
  }

  if (table === 'pedidos') {
    const defaultPedidos = [
      { id: '1', company_id: 'hotel-1', setor: 'A&B / Eventos', responsavel: 'Chef Roberto', status: 'pendente', observacoes: 'Pedido quinzenal banquetes', fornecedor_id: '1', data_pedido: new Date().toISOString() }
    ];
    setTable(table, defaultPedidos);
    return defaultPedidos;
  }

  if (table === 'itens_pedido') {
    const defaultItens = [
      { id: '1', company_id: 'hotel-1', pedido_id: '1', produto_id: '1', quantidade: 50 },
    ];
    setTable(table, defaultItens);
    return defaultItens;
  }

  if (table === 'eventos') {
    const defaultEventos = [
      { id: 'ev-1', company_id: 'hotel-1', nome: 'Casamento Família Souza', data_evento: dateStr(5), convidados: 150, local: 'Salão Real', status: 'confirmado', responsavel: 'Liciane (Eventos)' },
      { id: 'ev-2', company_id: 'hotel-1', nome: 'Coffee Break Tech Conf', data_evento: dateStr(2), convidados: 45, local: 'Sala VIP 2', status: 'pendente', responsavel: 'Marcio K.' },
      { id: 'ev-3', company_id: 'hotel-1', nome: 'Banquete Reunião Diretoria', data_evento: dateStr(-1), convidados: 12, local: 'Sala VIP 1', status: 'finalizado', responsavel: 'Alice' },
    ];
    setTable(table, defaultEventos);
    return defaultEventos;
  }

  if (table === 'evento_itens') {
    const defaultItensEvento = [
      // Casamento Família Souza (ev-1)
      { id: 'ei-1', company_id: 'hotel-1', evento_id: 'ev-1', nome: 'Picanha ao Alho', categoria: 'Prato Principal', preco_sugerido: 85.00 },
      { id: 'ei-2', company_id: 'hotel-1', evento_id: 'ev-1', nome: 'Risoto de Funghi', categoria: 'Acompanhamento', preco_sugerido: 45.00 },
      { id: 'ei-3', company_id: 'hotel-1', evento_id: 'ev-1', nome: 'Espumante Chandon', categoria: 'Bebidas', preco_sugerido: 145.00 },

      // Coffee Break Tech Conf (ev-2)
      { id: 'ei-4', company_id: 'hotel-1', evento_id: 'ev-2', nome: 'Mini Sanduíches', categoria: 'Salgados', preco_sugerido: 12.00 },
      { id: 'ei-5', company_id: 'hotel-1', evento_id: 'ev-2', nome: 'Café Expresso', categoria: 'Bebidas', preco_sugerido: 8.00 },
    ];
    setTable(table, defaultItensEvento);
    return defaultItensEvento;
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

  select(_columns?: string) { if (!this.action) this.action = 'select'; return this; }
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
  in(column: string, values: any[]) { this.filters.push({ col: column, op: 'in', val: values }); return this; }

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
        case 'in': return Array.isArray(f.val) ? f.val.includes(v) : false;
        default: return true;
      }
    });
  }

  async then(resolve: any, _reject: any) {
    // SECURITY: ROW LEVEL SECURITY MOCK ENFORCEMENT
    const cid = getCompanyId();
    if (!cid && this.table !== 'auth') {
      console.warn("RLS Violation: Attempting to access DB without an active company session context", this.table);
      // Simulating Supabase returning empty arrays when RLS fails
      return resolve({ data: this.action === 'select' && !this.isSingle ? [] : null, error: null });
    }

    try {
      let rows = getTable(this.table);

      // 1. FILTER RLS AUTOMATICALLY - Only see your company's records!
      rows = rows.filter((r: any) => r.company_id === cid);

      if (this.action === 'select') {
        const result = rows.filter((r: any) => this.matchRow(r));
        if (this.isSingle) resolve({ data: result[0] || null, error: null });
        else resolve({ data: result, error: null });
      } else if (this.action === 'insert') {
        const newRows = Array.isArray(this.payload) ? this.payload : [this.payload];
        // Inject company_id into inserts
        const withIds = newRows.map((r: any) => ({ ...r, company_id: cid, id: Math.random().toString(36).substring(7), data_cadastro: new Date().toISOString(), data_pedido: r.data_pedido || new Date().toISOString() }));
        const currentData = getTable(this.table);
        const updatedTableData = [...currentData, ...withIds];
        setTable(this.table, updatedTableData);
        if (this.isSingle) resolve({ data: withIds[0], error: null });
        else resolve({ data: withIds, error: null });
      } else if (this.action === 'update') {
        let updated: any[] = [];
        const currentData = getTable(this.table);
        const nextData = currentData.map((r: any) => {
          if (r.company_id === cid && this.matchRow(r)) {
            const newR = { ...r, ...this.payload };
            updated.push(newR);
            return newR;
          }
          return r;
        });
        setTable(this.table, nextData);
        if (this.isSingle) resolve({ data: updated[0] || null, error: null });
        else resolve({ data: updated, error: null });
      } else if (this.action === 'delete') {
        const currentData = getTable(this.table);
        // Only delete if it belongs to current tenant and matches filter
        const nextData = currentData.filter((r: any) => !(r.company_id === cid && this.matchRow(r)));
        setTable(this.table, nextData);
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
    getSession: async () => ({ data: { session: getSession() }, error: null }),
    signInWithPassword: async ({ email, password }: any) => {
      // Mocked authentication process
      let session = null;
      if (email === 'admin@hotel.com') { // Grand Hotel Plan
        session = { user: { id: 'u1', email, user_metadata: { company_id: 'hotel-1', company_name: 'Grand Hotel Resort', plan: 'hotel' } }, access_token: 'mock-token' };
      } else if (email === 'admin@bistro.com') { // Bistrô Plan
        session = { user: { id: 'u2', email, user_metadata: { company_id: 'bistro-1', company_name: 'Bistrô Esquina', plan: 'bistro' } }, access_token: 'mock-token' };
      } else {
        return { data: { user: null, session: null }, error: { message: "Credenciais inválidas" } };
      }
      localStorage.setItem('mock_supabase_session', JSON.stringify(session));
      // Dispatch event so components can detect login state easily
      window.dispatchEvent(new Event('auth_changed'));
      return { data: { user: session.user, session }, error: null };
    },
    onAuthStateChange: (cb: any) => {
      const listener = () => cb('SIGNED_IN', getSession());
      window.addEventListener('auth_changed', listener);
      return { data: { subscription: { unsubscribe: () => window.removeEventListener('auth_changed', listener) } } };
    },
    signOut: async () => {
      localStorage.removeItem('mock_supabase_session');
      window.dispatchEvent(new Event('auth_changed'));
      return { error: null };
    },
  }
} as any;