// Local in-browser / in-memory replacement for Supabase client.
// Provides a minimal subset of the previous API surface used across the UI
// so the React application can function without the remote Supabase backend.
// NOTE: This is a lightweight stateful stub. For production you should
// replace with a real backend (Express, FastAPI, etc.).

type User = { id: string; email: string };
type Session = { user: User };

interface TableStore {
  [table: string]: any[];
}

const store: TableStore = {
  profiles: [],
  invitations: [],
  visitors: [],
  access_codes: [],
  access_logs: [],
  security_incidents: [],
  api_keys: [],
  webhooks: []
};

// Simple id generators
const newId = () => Math.random().toString(36).slice(2, 11);

// Auth stub
let currentSession: Session | null = null;

function ensureProfile(user: User) {
  const existing = store.profiles.find(p => p.user_id === user.id);
  if (!existing) {
    store.profiles.push({ id: newId(), user_id: user.id, email: user.email, created_at: new Date().toISOString() });
  }
}

// Basic query builder supporting select/eq/insert/update/limit/order
function from(table: string) {
  if (!store[table]) store[table] = [];
  let rows = store[table];
  const filters: ((row: any) => boolean)[] = [];
  return {
    select: () => Promise.resolve({ data: rows.filter(r => filters.every(f => f(r))), error: null }),
    eq: (col: string, value: any) => {
      filters.push(r => r[col] === value);
      return this; // chaining
    },
    insert: (payload: any | any[]) => {
      const items = Array.isArray(payload) ? payload : [payload];
      const withIds = items.map(i => ({ id: i.id || newId(), ...i }));
      store[table].push(...withIds);
      return Promise.resolve({ data: withIds.length === 1 ? withIds[0] : withIds, error: null });
    },
    update: (patch: Record<string, any>) => {
      const filtered = rows.filter(r => filters.every(f => f(r)));
      filtered.forEach(r => Object.assign(r, patch));
      return Promise.resolve({ data: filtered, error: null });
    },
    delete: () => {
      const remaining: any[] = [];
      const removed: any[] = [];
      rows.forEach(r => (filters.every(f => f(r)) ? removed.push(r) : remaining.push(r)));
      store[table] = remaining;
      return Promise.resolve({ data: removed, error: null });
    }
  } as any;
}

// Functions invoke routing: implement only those actually referenced.
const functionHandlers: Record<string, (body: any) => any> = {
  'generate-access-code': (body) => {
    const code = {
      id: newId(),
      code: body?.code || Math.random().toString(36).slice(2, 8).toUpperCase(),
      pin_hash: 'stub',
      expires_at: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
      created_at: new Date().toISOString(),
      used: false
    };
    store.access_codes.push(code);
    return { code };
  },
  'verify-access-code': (body) => {
    const { code, pin } = body || {};
    const found = store.access_codes.find(c => c.code === code && !c.used);
    if (!found) return { ok: false, reason: 'NOT_FOUND' };
    if (new Date(found.expires_at).getTime() < Date.now()) return { ok: false, reason: 'EXPIRED' };
    // PIN is not really checked (no hashing in stub) – accept any if present
    if (pin) {
      found.used = true;
      return { ok: true, method: 'PIN', access_code_id: found.id };
    }
    // treat as QR path
    found.used = true;
    return { ok: true, method: 'QR', access_code_id: found.id };
  },
  'create-invitation': (body) => {
    const invitation = {
      id: newId(),
      visitor_email: body?.visitor_email,
      status: 'PENDING',
      created_at: new Date().toISOString()
    };
    store.invitations.push(invitation);
    return { invitation };
  },
  'encrypt-pii': (body) => ({ encrypted: btoa(JSON.stringify(body || {})) }),
  'decrypt-visitor-data': (body) => {
    try { return { data: JSON.parse(atob(body?.payload || '')) }; } catch { return { data: null }; }
  },
  'manage-2fa': (_body) => ({ ok: true })
};

export const supabase: any = {
  auth: {
    getUser: async () => ({ data: { user: currentSession?.user || null } }),
    getSession: async () => ({ data: { session: currentSession } }),
    signInWithPassword: async ({ email }: { email: string; password: string }) => {
      const user: User = { id: newId(), email };
      currentSession = { user };
      ensureProfile(user);
      return { data: { user }, error: null };
    },
    signUp: async ({ email }: { email: string; password: string }) => {
      const user: User = { id: newId(), email };
      currentSession = { user };
      ensureProfile(user);
      return { data: { user }, error: null };
    },
    signOut: async () => { currentSession = null; return { error: null }; }
  },
  from,
  functions: {
    invoke: async (name: string, { body }: { body?: any } = {}) => {
      const handler = functionHandlers[name];
      if (!handler) return { data: null, error: new Error(`Function ${name} not implemented in local stub`) };
      try {
        const result = handler(body);
        return { data: result, error: null };
      } catch (e: any) {
        return { data: null, error: e };
      }
    }
  },
  rpc: async (name: string, params?: any) => {
    // Map some rpc calls to simple derived data
    switch (name) {
      case 'set_active_community':
        return { data: { ok: true, community_id: params?.p_community_id }, error: null };
      case 'user_has_2fa_enabled':
        return { data: false, error: null };
      default:
        return { data: null, error: new Error(`RPC ${name} not implemented in local stub`) };
    }
  },
  // Expose keys for any code constructing fetch URLs (now meaningless)
  supabaseUrl: 'http://localhost/local-stub',
  supabaseKey: 'local-development-key'
};

export default supabase;

// Convenience helper for tests – allows resetting state
export function __resetLocalSupabase() {
  Object.keys(store).forEach(k => (store as any)[k] = []);
  currentSession = null;
}

export type LocalSupabaseStore = typeof store;