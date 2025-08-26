// API Client for React + FastAPI + Gunicorn architecture
// Provides authentication and API client functionality for the React frontend
// Connects to the FastAPI backend running with Gunicorn

const API_BASE_URL = process.env.VITE_API_URL || 'http://localhost:8000';

export interface User {
  id: string;
  email: string;
  created_at: string;
}

export interface Session {
  user: User;
  access_token: string;
  refresh_token: string;
  session?: any; // For backward compatibility
}

export interface ApiResponse<T = any> {
  data: T | null;
  error: string | null;
}

class ApiClient {
  private accessToken: string | null = null;
  private refreshToken: string | null = null;

  constructor() {
    // Load tokens from localStorage on initialization
    this.accessToken = localStorage.getItem('access_token');
    this.refreshToken = localStorage.getItem('refresh_token');
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
    const url = `${API_BASE_URL}${endpoint}`;
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (this.accessToken) {
      headers['Authorization'] = `Bearer ${this.accessToken}`;
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      if (response.status === 401 && this.refreshToken) {
        // Try to refresh token
        const refreshResponse = await this.refreshAuth();
        if (refreshResponse.data) {
          // Retry the original request with new token
          return this.request(endpoint, options);
        }
      }

      if (!response.ok) {
        const error = await response.text();
        return { data: null, error: error || `HTTP ${response.status}` };
      }

      const data = await response.json();
      return { data, error: null };
    } catch (error) {
      return { data: null, error: error instanceof Error ? error.message : 'Network error' };
    }
  }

  // Auth methods
  async signInWithPassword(email: string, password: string): Promise<ApiResponse<Session>> {
    const response = await this.request<Session>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

    if (response.data) {
      this.accessToken = response.data.access_token;
      this.refreshToken = response.data.refresh_token;
      localStorage.setItem('access_token', this.accessToken!);
      localStorage.setItem('refresh_token', this.refreshToken!);
    }

    return response;
  }

  async signUp(email: string, password: string): Promise<ApiResponse<Session>> {
    const response = await this.request<Session>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

    if (response.data) {
      this.accessToken = response.data.access_token;
      this.refreshToken = response.data.refresh_token;
      localStorage.setItem('access_token', this.accessToken!);
      localStorage.setItem('refresh_token', this.refreshToken!);
    }

    return response;
  }

  async signOut(): Promise<ApiResponse<void>> {
    const response = await this.request<void>('/auth/logout', {
      method: 'POST',
    });

    this.accessToken = null;
    this.refreshToken = null;
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');

    return response;
  }

  async getSession(): Promise<ApiResponse<Session>> {
    return this.request<Session>('/auth/session');
  }

  async getUser(): Promise<ApiResponse<User>> {
    const response = await this.request<User>('/auth/user');
    return response;
  }

  async refreshAuth(): Promise<ApiResponse<Session>> {
    if (!this.refreshToken) {
      return { data: null, error: 'No refresh token available' };
    }

    const response = await this.request<Session>('/auth/refresh', {
      method: 'POST',
      body: JSON.stringify({ refresh_token: this.refreshToken }),
    });

    if (response.data) {
      this.accessToken = response.data.access_token;
      this.refreshToken = response.data.refresh_token;
      localStorage.setItem('access_token', this.accessToken!);
      localStorage.setItem('refresh_token', this.refreshToken!);
    }

    return response;
  }

  // API methods for different resources
  async getVisitors(): Promise<ApiResponse<any[]>> {
    return this.request<any[]>('/api/visitors');
  }

  async createVisitor(visitorData: any): Promise<ApiResponse<any>> {
    return this.request<any>('/api/visitors', {
      method: 'POST',
      body: JSON.stringify(visitorData),
    });
  }

  async getAccessCodes(): Promise<ApiResponse<any[]>> {
    return this.request<any[]>('/api/access-codes');
  }

  async generateAccessCode(visitorId: string): Promise<ApiResponse<any>> {
    return this.request<any>('/api/access-codes/generate', {
      method: 'POST',
      body: JSON.stringify({ visitorId }),
    });
  }

  async verifyAccessCode(code: string, pin?: string): Promise<ApiResponse<any>> {
    return this.request<any>('/api/access-codes/verify', {
      method: 'POST',
      body: JSON.stringify({ code, pin }),
    });
  }

  async getAccessLogs(): Promise<ApiResponse<any[]>> {
    return this.request<any[]>('/api/access-logs');
  }

  async getIncidents(): Promise<ApiResponse<any[]>> {
    return this.request<any[]>('/api/incidents');
  }

  async getAnalytics(): Promise<ApiResponse<any>> {
    return this.request<any>('/api/analytics');
  }
}

// Create and export a singleton instance
export const apiClient = new ApiClient();

// For backward compatibility with existing code that expects a supabase-like interface
export const supabase = {
  auth: {
    signInWithPassword: (credentials: { email: string; password: string }) => 
      apiClient.signInWithPassword(credentials.email, credentials.password),
    signUp: (credentials: { email: string; password: string }) => 
      apiClient.signUp(credentials.email, credentials.password),
    signOut: () => apiClient.signOut(),
    getSession: () => apiClient.getSession(),
    getUser: () => apiClient.getUser(),
  },
  from: (table: string) => {
    // Create a proper promise-like object that supports method chaining
    const queryBuilder = {
      select: (columns: string) => queryBuilder,
      eq: (column: string, value: any) => queryBuilder,
      single: () => queryBuilder,
      update: (data: any) => queryBuilder,
      then: (onFulfilled: (value: { data: any; error: string | null }) => any) => {
        // Return a promise that resolves with the mock response
        return Promise.resolve({ data: null, error: 'Database queries not implemented in API client' }).then(onFulfilled);
      },
      catch: (onRejected: (reason: any) => any) => {
        return Promise.reject('Database queries not implemented in API client').catch(onRejected);
      }
    };
    return queryBuilder;
  },
};

export default apiClient;
