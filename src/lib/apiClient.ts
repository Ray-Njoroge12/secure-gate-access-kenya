const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

interface ApiResponse<T = any> {
  data?: T;
  error?: string;
}

class ApiClient {
  private baseURL: string;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseURL}${endpoint}`;
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    // Add auth token if available
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers = {
        ...config.headers,
        Authorization: `Bearer ${token}`,
      };
    }

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        return { error: data.error || 'Request failed' };
      }

      return { data };
    } catch (error) {
      return { error: error instanceof Error ? error.message : 'Network error' };
    }
  }

  // Generic HTTP methods
  async get<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'GET' });
  }

  async post<T>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async put<T>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }

  async signup(email: string, password: string, fullName: string, unitNumber?: string, phone?: string) {
    const result = await this.request<{ token: string; user: any }>('/api/auth/signup', {
      method: 'POST',
      body: JSON.stringify({ email, password, fullName, unitNumber, phone }),
    });
    
    if (result.data?.token) {
      localStorage.setItem('authToken', result.data.token);
    }
    
    return result;
  }

  async getProfile() {
    return this.request<{ user: any }>('/api/auth/profile');
  }

  async logout() {
    localStorage.removeItem('authToken');
    return { data: { success: true } };
  }

  // Legacy methods for backward compatibility (will be removed)
  functions = {
    invoke: async (functionName: string, options: { body: any }) => {
      // Map old function names to new endpoints
      const endpointMap: Record<string, string> = {
        'generate-access-code': '/api/access-codes/generate',
        'verify-access-code': '/api/access-codes/verify',
        'create-invitation': '/api/invitations',
        'manage-2fa': '/api/2fa/manage'
      };

      const endpoint = endpointMap[functionName];
      if (!endpoint) {
        throw new Error(`Unknown function: ${functionName}`);
      }

      return this.request(endpoint, {
        method: 'POST',
        body: JSON.stringify(options.body),
      });
    }
  };

  auth = {
    getUser: async () => {
      const result = await this.getProfile();
      if (result.error) {
        throw new Error(result.error);
      }
      return result.data?.user;
    }
  };

  // Keep existing method signatures for compatibility
  generateAccessCode(code?: string) {
    return this.request<{ code: string; expires_at: string }>('/api/access-codes/generate', {
      method: 'POST',
      body: JSON.stringify({ code })
    });
  }

  twoFASetup(userId: string) {
    return this.request<{ secret: string }>('/api/2fa/setup', {
      method: 'POST',
      body: JSON.stringify({ userId })
    });
  }

  twoFAEnable(userId: string) {
    return this.request<{ enabled: boolean }>('/api/2fa/enable', {
      method: 'POST',
      body: JSON.stringify({ userId })
    });
  }

  twoFADisable(userId: string) {
    return this.request<{ enabled: boolean }>('/api/2fa/disable', {
      method: 'POST',
      body: JSON.stringify({ userId })
    });
  }

  // Resident dashboard methods
  getResidentStats() {
    return this.request<{ activeInvitations: number; totalInvitations: number; pendingInvitations: number; completedVisits: number; recentVisitors: number }>('/api/auth/resident/stats');
  }

  getResidentInvitations() {
    return this.request<Array<{ id: string; visitor_email: string; status: string; created_at: string; visitor_name?: string }>>('/api/auth/resident/invitations');
  }

  // Analytics methods
  getDashboardAnalytics(period: string = 'week') {
    return this.request<{
      summary: {
        totalInvitations: number;
        activeInvitations: number;
        completedVisits: number;
        averageVisitDuration: string;
        weeklyGrowth: number;
        monthlyGrowth: number;
        peakHours: Array<{hour: number; count: number}>;
        popularPurposes: Array<{purpose: string; count: number}>;
        securityIncidents: number;
      };
      timeBasedData: Array<{
        date: string;
        invitations: number;
        visits: number;
        incidents: number;
      }>;
    }>(`/api/analytics/dashboard?period=${period}`);
  }

  getVisitorsAnalytics(startDate?: string) {
    const query = startDate ? `?start_date=${startDate}` : '';
    return this.request<Array<any>>(`/api/analytics/visitors${query}`);
  }

  getAccessCodesAnalytics(startDate?: string) {
    const query = startDate ? `?start_date=${startDate}` : '';
    return this.request<Array<any>>(`/api/analytics/access-codes${query}`);
  }

  getSecurityIncidentsAnalytics(startDate?: string) {
    const query = startDate ? `?start_date=${startDate}` : '';
    return this.request<Array<any>>(`/api/analytics/security-incidents${query}`);
  }

  // Security methods
  getSecurityStats() {
    return this.request<{
      todaysVisitors: number;
      pendingVerifications: number;
      usedCodes: number;
      systemStatus: string;
    }>('/api/security/stats');
  }

  getRecentActivity(limit: number = 10) {
    return this.request<Array<{
      id: string;
      type: string;
      description: string;
      timestamp: string;
      status: string;
    }>>(`/api/security/recent-activity?limit=${limit}`);
  }

  verifyAccessCode(code: string, method: 'pin' | 'qr') {
    return this.request<{
      success: boolean;
      valid: boolean;
      visitorName?: string;
      accessCodeId?: string;
      error?: string;
    }>('/api/security/verify-access', {
      method: 'POST',
      body: JSON.stringify({ code, method })
    });
  }

  // Role management methods
  getRolePermissions() {
    return this.request<Array<{
      role: string;
      permissions: string[];
      description: string;
    }>>('/api/roles/permissions');
  }

  assignUserRole(userEmail: string, newRole: string) {
    return this.request<{
      user_id: string;
      email: string;
      current_role: string;
      updated: boolean;
    }>('/api/roles/assign', {
      method: 'PUT',
      body: JSON.stringify({ user_email: userEmail, new_role: newRole })
    });
  }

  getUserRole(userId: string) {
    return this.request<{
      user_id: string;
      email: string;
      role: string;
      permissions: string[];
      full_name: string | null;
      unit_number: string | null;
    }>(`/api/roles/user/${userId}`);
  }

  listUsersWithRoles() {
    return this.request<Array<{
      user_id: string;
      email: string;
      role: string;
      permissions: string[];
      full_name: string | null;
      unit_number: string | null;
      created_at: string;
    }>>('/api/roles/users');
  }

  getMyRole() {
    return this.request<{
      user_id: string;
      email: string;
      role: string;
      permissions: string[];
      full_name: string | null;
    }>('/api/roles/my-role');
  }

  // Invitation management methods
  createInvitation(invitationData: {
    visitor_full_name: string;
    visitor_email: string;
    visitor_phone_number: string;
    visit_date: string;
    visit_purpose?: string;
    visit_duration_hours?: number;
  }) {
    return this.request<{
      id: string;
      resident_id: string;
      visitor_full_name: string;
      visitor_email: string;
      visitor_phone_number: string;
      visit_date: string;
      visit_purpose: string | null;
      visit_duration_hours: number | null;
      invitation_token: string;
      token_expires_at: string;
      status: string;
      created_at: string;
    }>('/api/invitations', {
      method: 'POST',
      body: JSON.stringify(invitationData)
    });
  }

  listInvitations() {
    return this.request<Array<{
      id: string;
      resident_id: string;
      visitor_full_name: string;
      visitor_email: string;
      visitor_phone_number: string;
      visit_date: string;
      visit_purpose: string | null;
      visit_duration_hours: number | null;
      invitation_token: string;
      token_expires_at: string;
      status: string;
      created_at: string;
    }>>('/api/invitations');
  }

  validateInvitationToken(token: string) {
    return this.request<{
      valid: boolean;
      invitation: {
        id: string;
        resident_id: string;
        visitor_full_name: string;
        visitor_email: string;
        visitor_phone_number: string;
        visit_date: string;
        visit_purpose: string | null;
        visit_duration_hours: number | null;
        invitation_token: string;
        token_expires_at: string;
        status: string;
        created_at: string;
      } | null;
      error: string | null;
    }>('/api/invitations/validate-token', {
      method: 'POST',
      body: JSON.stringify({ token })
    });
  }

  cancelInvitation(invitationId: string) {
    return this.request<{
      message: string;
    }>(`/api/invitations/${invitationId}/cancel`, {
      method: 'PUT'
    });
  }

  getInvitation(invitationId: string) {
    return this.request<{
      id: string;
      resident_id: string;
      visitor_full_name: string;
      visitor_email: string;
      visitor_phone_number: string;
      visit_date: string;
      visit_purpose: string | null;
      visit_duration_hours: number | null;
      invitation_token: string;
      token_expires_at: string;
      status: string;
      created_at: string;
    }>(`/api/invitations/${invitationId}`);
  }

  registerVisitorWithInvitation(registrationData: {
    invitation_token: string;
    full_name: string;
    id_number: string;
    phone_number: string;
    visitor_email: string;
    consent: boolean;
    photo_url?: string;
  }) {
    return this.request<{
      visitor: {
        id: string;
        created_at: string;
      };
      access_code: {
        id: string;
        qr_token: string;
        pin: string;
        expires_at: string;
      };
      invitation: {
        id: string;
        visitor_full_name: string;
        visit_date: string;
        visit_purpose: string | null;
      };
    }>('/api/visitors/register-with-invitation', {
      method: 'POST',
      body: JSON.stringify(registrationData)
    });
  }
}

export const apiClient = new ApiClient(API_BASE_URL);
export default apiClient;
