// Generic API abstraction layer.
// Initially backed by in-memory stub data; replace implementations to call real backend later.

export interface SessionUser { id: string; email: string; role?: string; }
export interface AuthSession { user: SessionUser | null }

export interface InvitationInput {
  residentId: string;
  visitorFullName: string;
  visitorEmail: string;
  visitorPhone: string;
  visitDate: string; // ISO
  visitPurpose?: string;
}

export interface Invitation {
  id: string;
  residentId: string;
  token: string;
  visitorFullName: string;
  visitDate: string;
}

export interface ApiClient {
  auth: {
    getSession(): Promise<AuthSession>;
    signIn(email: string, password: string): Promise<AuthSession>;
    signOut(): Promise<void>;
  };
  invitations: {
    create(input: InvitationInput): Promise<Invitation>;
    list(): Promise<Invitation[]>;
  };
}

// Simple in-memory backing store (non-persistent)
const memory = {
  user: null as SessionUser | null,
  invitations: [] as Invitation[],
};

function randomId() { return Math.random().toString(36).slice(2, 12); }

export const api: ApiClient = {
  auth: {
    async getSession() { return { user: memory.user }; },
    async signIn(email: string, _password: string) {
      memory.user = { id: randomId(), email };
      return { user: memory.user };
    },
    async signOut() { memory.user = null; },
  },
  invitations: {
    async create(input: InvitationInput) {
      const inv: Invitation = {
        id: randomId(),
        residentId: input.residentId,
        token: randomId(),
        visitorFullName: input.visitorFullName,
        visitDate: input.visitDate,
      };
      memory.invitations.push(inv);
      return inv;
    },
    async list() { return [...memory.invitations]; },
  },
};

export type { ApiClient as ApiClientType };
