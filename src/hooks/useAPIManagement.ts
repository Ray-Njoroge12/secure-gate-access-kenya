import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface APIKey {
  id: string;
  name: string;
  description?: string;
  api_key_prefix: string;
  permissions: Record<string, string[]>;
  rate_limit: number;
  is_active: boolean;
  expires_at?: string;
  last_used_at?: string;
  created_at: string;
}

export interface Webhook {
  id: string;
  name: string;
  url: string;
  events: string[];
  headers: Record<string, string>;
  secret?: string;
  is_active: boolean;
  retry_count: number;
  timeout_seconds: number;
  last_triggered_at?: string;
  created_at: string;
}

export interface APIRequestLog {
  id: string;
  endpoint: string;
  method: string;
  status_code: number;
  request_size: number;
  response_size: number;
  response_time_ms: number;
  ip_address?: string;
  user_agent?: string;
  error_message?: string;
  created_at: string;
}

export interface WebhookDelivery {
  id: string;
  webhook_id: string;
  event_type: string;
  payload: Record<string, any>;
  status: 'pending' | 'success' | 'failed' | 'retrying';
  response_status?: number;
  response_body?: string;
  error_message?: string;
  attempt_count: number;
  delivered_at?: string;
  created_at: string;
}

export const useAPIManagement = () => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const generateAPIKey = useCallback(async (data: {
    name: string;
    description?: string;
    permissions: Record<string, string[]>;
    rate_limit: number;
    expires_at?: string;
  }) => {
    setIsLoading(true);
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('Not authenticated');

      const { data: profile } = await supabase
        .from('profiles')
        .select('tenant_id')
        .eq('id', user.user.id)
        .single();

      if (!profile) throw new Error('Profile not found');

      const { data: result, error } = await supabase.rpc('generate_api_key', {
        p_tenant_id: profile.tenant_id,
        p_name: data.name,
        p_description: data.description || null,
        p_permissions: data.permissions,
        p_rate_limit: data.rate_limit,
        p_expires_at: data.expires_at || null,
        p_created_by: user.user.id
      });

      if (error) throw error;

      if (result && result[0]?.success) {
        return {
          success: true,
          api_key_id: result[0].api_key_id,
          api_key: result[0].api_key
        };
      } else {
        throw new Error(result?.[0]?.error || 'Failed to generate API key');
      }
    } catch (error) {
      console.error('Error generating API key:', error);
      toast({
        title: "Error",
        description: "Failed to generate API key",
        variant: "destructive",
      });
      return { success: false, error: error.message };
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  const getAPIKeys = useCallback(async (): Promise<{ success: boolean; data?: APIKey[]; error?: string }> => {
    try {
      const { data, error } = await supabase
        .from('api_keys')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return { success: true, data: data || [] };
    } catch (error) {
      console.error('Error fetching API keys:', error);
      return { success: false, error: error.message };
    }
  }, []);

  const updateAPIKey = useCallback(async (id: string, updates: Partial<APIKey>) => {
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('api_keys')
        .update(updates)
        .eq('id', id);

      if (error) throw error;
      
      toast({
        title: "Success",
        description: "API key updated successfully",
      });
      return { success: true };
    } catch (error) {
      console.error('Error updating API key:', error);
      toast({
        title: "Error",
        description: "Failed to update API key",
        variant: "destructive",
      });
      return { success: false, error: error.message };
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  const deleteAPIKey = useCallback(async (id: string) => {
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('api_keys')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      toast({
        title: "Success",
        description: "API key deleted successfully",
      });
      return { success: true };
    } catch (error) {
      console.error('Error deleting API key:', error);
      toast({
        title: "Error",
        description: "Failed to delete API key",
        variant: "destructive",
      });
      return { success: false, error: error.message };
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  const createWebhook = useCallback(async (data: {
    name: string;
    url: string;
    events: string[];
    headers?: Record<string, string>;
    secret?: string;
    retry_count?: number;
    timeout_seconds?: number;
  }) => {
    setIsLoading(true);
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('Not authenticated');

      const { data: profile } = await supabase
        .from('profiles')
        .select('tenant_id')
        .eq('id', user.user.id)
        .single();

      if (!profile) throw new Error('Profile not found');

      const { data: result, error } = await supabase.rpc('create_webhook', {
        p_tenant_id: profile.tenant_id,
        p_name: data.name,
        p_url: data.url,
        p_events: data.events,
        p_headers: data.headers || {},
        p_secret: data.secret || null,
        p_created_by: user.user.id
      });

      if (error) throw error;

      if (result && result[0]?.success) {
        toast({
          title: "Success",
          description: "Webhook created successfully",
        });
        return { success: true, webhook_id: result[0].webhook_id };
      } else {
        throw new Error(result?.[0]?.error_message || 'Failed to create webhook');
      }
    } catch (error) {
      console.error('Error creating webhook:', error);
      toast({
        title: "Error",
        description: "Failed to create webhook",
        variant: "destructive",
      });
      return { success: false, error: error.message };
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  const getWebhooks = useCallback(async (): Promise<{ success: boolean; data?: Webhook[]; error?: string }> => {
    try {
      const { data, error } = await supabase
        .from('webhooks')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return { success: true, data: data || [] };
    } catch (error) {
      console.error('Error fetching webhooks:', error);
      return { success: false, error: error.message };
    }
  }, []);

  const updateWebhook = useCallback(async (id: string, updates: Partial<Webhook>) => {
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('webhooks')
        .update(updates)
        .eq('id', id);

      if (error) throw error;
      
      toast({
        title: "Success",
        description: "Webhook updated successfully",
      });
      return { success: true };
    } catch (error) {
      console.error('Error updating webhook:', error);
      toast({
        title: "Error",
        description: "Failed to update webhook",
        variant: "destructive",
      });
      return { success: false, error: error.message };
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  const deleteWebhook = useCallback(async (id: string) => {
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('webhooks')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      toast({
        title: "Success",
        description: "Webhook deleted successfully",
      });
      return { success: true };
    } catch (error) {
      console.error('Error deleting webhook:', error);
      toast({
        title: "Error",
        description: "Failed to delete webhook",
        variant: "destructive",
      });
      return { success: false, error: error.message };
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  const getAPIRequestLogs = useCallback(async (filters?: {
    limit?: number;
    offset?: number;
    endpoint?: string;
    method?: string;
    status_code?: number;
    from_date?: string;
    to_date?: string;
  }): Promise<{ success: boolean; data?: APIRequestLog[]; error?: string }> => {
    try {
      let query = supabase
        .from('api_request_logs')
        .select('*');

      if (filters?.endpoint) {
        query = query.ilike('endpoint', `%${filters.endpoint}%`);
      }
      if (filters?.method) {
        query = query.eq('method', filters.method);
      }
      if (filters?.status_code) {
        query = query.eq('status_code', filters.status_code);
      }
      if (filters?.from_date) {
        query = query.gte('created_at', filters.from_date);
      }
      if (filters?.to_date) {
        query = query.lte('created_at', filters.to_date);
      }

      const limit = filters?.limit || 50;
      const offset = filters?.offset || 0;

      query = query
        .range(offset, offset + limit - 1)
        .order('created_at', { ascending: false });

      const { data, error } = await query;

      if (error) throw error;
      return { success: true, data: data || [] };
    } catch (error) {
      console.error('Error fetching API request logs:', error);
      return { success: false, error: error.message };
    }
  }, []);

  const getWebhookDeliveries = useCallback(async (webhookId?: string): Promise<{ success: boolean; data?: WebhookDelivery[]; error?: string }> => {
    try {
      let query = supabase
        .from('webhook_deliveries')
        .select('*');

      if (webhookId) {
        query = query.eq('webhook_id', webhookId);
      }

      query = query
        .order('created_at', { ascending: false })
        .limit(100);

      const { data, error } = await query;

      if (error) throw error;
      return { success: true, data: data || [] };
    } catch (error) {
      console.error('Error fetching webhook deliveries:', error);
      return { success: false, error: error.message };
    }
  }, []);

  const testWebhook = useCallback(async (webhookId: string, testPayload?: Record<string, any>) => {
    setIsLoading(true);
    try {
      // Get webhook details
      const { data: webhook, error: webhookError } = await supabase
        .from('webhooks')
        .select('*')
        .eq('id', webhookId)
        .single();

      if (webhookError) throw webhookError;

      const payload = testPayload || {
        event: 'test.webhook',
        data: {
          message: 'This is a test webhook delivery',
          timestamp: new Date().toISOString()
        },
        tenant_id: webhook.tenant_id
      };

      // Create a test delivery
      const { error: deliveryError } = await supabase
        .from('webhook_deliveries')
        .insert({
          webhook_id: webhookId,
          event_type: 'test.webhook',
          payload,
          status: 'pending'
        });

      if (deliveryError) throw deliveryError;

      toast({
        title: "Test Webhook Sent",
        description: "Test webhook has been queued for delivery",
      });
      return { success: true };
    } catch (error) {
      console.error('Error testing webhook:', error);
      toast({
        title: "Error",
        description: "Failed to test webhook",
        variant: "destructive",
      });
      return { success: false, error: error.message };
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  const getAPIAnalytics = useCallback(async (period: 'day' | 'week' | 'month' = 'week') => {
    try {
      const now = new Date();
      const periodDays = period === 'day' ? 1 : period === 'week' ? 7 : 30;
      const fromDate = new Date(now.getTime() - periodDays * 24 * 60 * 60 * 1000);

      const { data, error } = await supabase
        .from('api_request_logs')
        .select('endpoint, method, status_code, response_time_ms, created_at')
        .gte('created_at', fromDate.toISOString())
        .lte('created_at', now.toISOString());

      if (error) throw error;

      // Process analytics data
      const totalRequests = data?.length || 0;
      const successfulRequests = data?.filter(log => log.status_code >= 200 && log.status_code < 300).length || 0;
      const averageResponseTime = totalRequests > 0 
        ? Math.round((data?.reduce((sum, log) => sum + (log.response_time_ms || 0), 0) || 0) / totalRequests)
        : 0;

      const endpointStats = data?.reduce((acc, log) => {
        const key = `${log.method} ${log.endpoint}`;
        if (!acc[key]) {
          acc[key] = { count: 0, avgResponseTime: 0, successRate: 0 };
        }
        acc[key].count++;
        acc[key].avgResponseTime += log.response_time_ms || 0;
        if (log.status_code >= 200 && log.status_code < 300) {
          acc[key].successRate++;
        }
        return acc;
      }, {} as Record<string, any>) || {};

      // Calculate averages
      Object.keys(endpointStats).forEach(key => {
        const stats = endpointStats[key];
        stats.avgResponseTime = Math.round(stats.avgResponseTime / stats.count);
        stats.successRate = Math.round((stats.successRate / stats.count) * 100);
      });

      return {
        success: true,
        data: {
          period,
          totalRequests,
          successfulRequests,
          successRate: totalRequests > 0 ? Math.round((successfulRequests / totalRequests) * 100) : 0,
          averageResponseTime,
          endpointStats
        }
      };
    } catch (error) {
      console.error('Error fetching API analytics:', error);
      return { success: false, error: error.message };
    }
  }, []);

  return {
    isLoading,
    generateAPIKey,
    getAPIKeys,
    updateAPIKey,
    deleteAPIKey,
    createWebhook,
    getWebhooks,
    updateWebhook,
    deleteWebhook,
    getAPIRequestLogs,
    getWebhookDeliveries,
    testWebhook,
    getAPIAnalytics
  };
};
