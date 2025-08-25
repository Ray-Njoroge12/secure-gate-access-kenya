// Simple API client wrapper to replace supabase.functions.invoke calls.
// Provides typed helper methods for migrated endpoints.

interface ApiOptions {
  method?: string;
  body?: any;
  headers?: Record<string, string>;
}

async function request<T>(path: string, options: ApiOptions = {}): Promise<T> {
  const res = await fetch(path, {
    method: options.method || (options.body ? 'POST' : 'GET'),
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    },
    body: options.body ? JSON.stringify(options.body) : undefined
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`API ${res.status} ${res.statusText}: ${text}`);
  }
  return res.json();
}

export const api = {
  generateAccessCode: (code?: string) =>
    request<{ code: string; expires_at: string }>(`/api/access-codes/generate`, { body: { code } }),
  verifyAccessCode: (code: string, pin?: string) =>
    request<{ ok: boolean; method?: string; access_code_id?: string; reason?: string }>(`/api/access-codes/verify`, { body: { code, pin } }),
  createInvitation: (visitor_email: string) =>
    request<{ invitation: { id: string; visitorEmail: string; status: string } }>(`/api/invitations`, { body: { visitor_email } }),
  twoFASetup: (userId: string) => request<{ secret: string }>(`/api/2fa/setup`, { body: { userId } }),
  twoFAEnable: (userId: string) => request<{ enabled: boolean }>(`/api/2fa/enable`, { body: { userId } }),
  twoFADisable: (userId: string) => request<{ enabled: boolean }>(`/api/2fa/disable`, { body: { userId } })
};

export default api;
