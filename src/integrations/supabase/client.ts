// API Client for authentication and data operations
// This replaces the original Supabase client with a custom implementation
// that works with the new Express.js backend API

interface ApiResponse<T = any> {
  data?: T;
  error?: { message: string };
}

interface AuthSession {
  user?: {
    id: string;
    email: string;
    profile?: {
      role?: string;
      fullName?: string;
    };
  };
  access_token?: string;
}

interface AuthCredentials {
  email: string;
  password: string;
}

class ApiClient {
  private baseURL: string;
  private token: string | null = null;

  constructor() {
    this.baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';
    this.token = localStorage.getItem('authToken');
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
    try {
      const url = `${this.baseURL}${endpoint}`;
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
        ...options.headers,
      };

      // Add authorization header if token exists
      if (this.token) {
        headers['Authorization'] = `Bearer ${this.token}`;
      }

      const response = await fetch(url, {
        ...options,
        headers,
        credentials: 'include',
      });

      if (!response.ok) {
        const errorText = await response.text();
        return { error: { message: errorText || `HTTP ${response.status}` } };
      }

      const data = await response.json();
      return { data };
    } catch (error) {
      return { error: { message: (error as Error).message } };
    }
  }

  // Auth methods
  async signIn(credentials: AuthCredentials): Promise<ApiResponse<{ token: string; user: any }>> {
    const response = await this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });

    if (response.data?.token) {
      this.token = response.data.token;
      localStorage.setItem('authToken', this.token);
    }

    return response;
  }

  async signUp(credentials: AuthCredentials & { fullName: string; unitNumber?: string; phone?: string }): Promise<ApiResponse<{ token: string; user: any }>> {
    const response = await this.request('/auth/signup', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });

    if (response.data?.token) {
      this.token = response.data.token;
      localStorage.setItem('authToken', this.token);
    }

    return response;
  }

  async signOut(): Promise<ApiResponse> {
    this.token = null;
    localStorage.removeItem('authToken');
    return { data: { message: 'Signed out successfully' } };
  }

  async getSession(): Promise<ApiResponse<AuthSession>> {
    if (!this.token) {
      return { data: { user: null } };
    }

    try {
      const response = await this.request('/auth/profile');
      if (response.data) {
        return {
          data: {
            user: response.data.user,
            access_token: this.token
          }
        };
      }
      return { data: { user: null } };
    } catch {
      return { data: { user: null } };
    }
  }

  // Data operations - these will be implemented as needed
  async from(table: string): Promise<{ 
    select: (columns?: string) => Promise<ApiResponse>;
    limit: (count: number) => Promise<ApiResponse>;
    order: (column: string, options?: { ascending?: boolean }) => Promise<ApiResponse>;
    eq: (column: string, value: any) => Promise<ApiResponse>;
  }> {
    return {
      select: async (columns = '*') => {
        return this.request(`/data/${table}?select=${columns}`);
      },
      limit: async (count: number) => {
        return this.request(`/data/${table}?limit=${count}`);
      },
      order: async (column: string, options?: { ascending?: boolean }) => {
        const order = options?.ascending === false ? 'desc' : 'asc';
        return this.request(`/data/${table}?order=${column}.${order}`);
      },
      eq: async (column: string, value: any) => {
        return this.request(`/data/${table}?${column}=eq.${value}`);
      }
    };
  }
}

// Create and export the API client instance
const apiClient = new ApiClient();
export default apiClient;
