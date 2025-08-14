import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface VisitorRiskProfile {
  id: string;
  visitor_id: string;
  risk_score: number;
  risk_level: 'low' | 'medium' | 'high' | 'critical';
  total_visits: number;
  successful_visits: number;
  failed_attempts: number;
  incident_count: number;
  behavioral_flags: Record<string, any>;
  last_risk_calculation: string;
}

interface RiskFactors {
  total_visits: number;
  successful_visits: number;
  failed_attempts: number;
  incident_count: number;
  success_rate: number;
  recent_activity_score: number;
  time_pattern_score: number;
  calculation_date: string;
}

interface BehavioralAnomaly {
  visitor_id: string;
  anomaly_type: string;
  anomaly_details: Record<string, any>;
  severity: 'low' | 'medium' | 'high';
}

interface AIRecommendation {
  id: string;
  recommendation_type: string;
  entity_type: string;
  entity_id: string;
  recommendation: Record<string, any>;
  confidence_score: number;
  status: 'pending' | 'accepted' | 'rejected' | 'expired';
  created_at: string;
}

interface RiskAssessmentState {
  isCalculating: boolean;
  lastUpdate: Date | null;
  anomaliesDetected: number;
  pendingRecommendations: number;
}

export function useAIRiskAssessment() {
  const { toast } = useToast();
  const [state, setState] = useState<RiskAssessmentState>({
    isCalculating: false,
    lastUpdate: null,
    anomaliesDetected: 0,
    pendingRecommendations: 0
  });

  // Calculate risk score for a specific visitor
  const calculateVisitorRisk = useCallback(async (visitorId: string): Promise<{
    success: boolean;
    riskProfile?: VisitorRiskProfile;
    factors?: RiskFactors;
    error?: string;
  }> => {
    try {
      setState(prev => ({ ...prev, isCalculating: true }));

      // Call the risk calculation RPC function
      const { data, error } = await (supabase as any).rpc('calculate_visitor_risk_score', {
        p_visitor_id: visitorId
      });

      if (error) throw error;

      if (data && data.length > 0) {
        const riskData = data[0];
        
        // Update the risk profile in the database
        await (supabase as any).rpc('update_visitor_risk_profile', {
          p_visitor_id: visitorId
        });

        // Create a mock profile for now since types aren't available
        const mockProfile: VisitorRiskProfile = {
          id: visitorId,
          visitor_id: visitorId,
          risk_score: riskData.risk_score,
          risk_level: riskData.risk_level,
          total_visits: riskData.factors?.total_visits || 0,
          successful_visits: riskData.factors?.successful_visits || 0,
          failed_attempts: riskData.factors?.failed_attempts || 0,
          incident_count: riskData.factors?.incident_count || 0,
          behavioral_flags: riskData.factors || {},
          last_risk_calculation: new Date().toISOString()
        };

        return {
          success: true,
          riskProfile: mockProfile,
          factors: riskData.factors
        };
      }

      return {
        success: false,
        error: 'No risk data calculated'
      };

    } catch (error) {
      console.error('Risk calculation failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    } finally {
      setState(prev => ({ ...prev, isCalculating: false }));
    }
  }, []);

  // Get risk profile for a visitor (mock implementation for now)
  const getVisitorRiskProfile = useCallback(async (visitorId: string): Promise<{
    success: boolean;
    profile?: VisitorRiskProfile;
    error?: string;
  }> => {
    try {
      // For now, calculate on demand since tables may not exist yet
      const result = await calculateVisitorRisk(visitorId);
      return {
        success: result.success,
        profile: result.riskProfile,
        error: result.error
      };

    } catch (error) {
      console.error('Failed to get risk profile:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }, [calculateVisitorRisk]);

  // Detect behavioral anomalies
  const detectAnomalies = useCallback(async (visitorId?: string): Promise<{
    success: boolean;
    anomalies?: BehavioralAnomaly[];
    error?: string;
  }> => {
    try {
      const { data, error } = await (supabase as any).rpc('detect_behavioral_anomalies', {
        p_visitor_id: visitorId || null
      });

      if (error) throw error;

      if (data && data.length > 0) {
        setState(prev => ({ 
          ...prev, 
          anomaliesDetected: data.length,
          lastUpdate: new Date()
        }));

        if (data.length > 0) {
          toast({
            title: "Anomalies Detected",
            description: `Found ${data.length} behavioral anomalies that require attention`,
            variant: "destructive"
          });
        }
      }

      return {
        success: true,
        anomalies: data || []
      };

    } catch (error) {
      console.error('Anomaly detection failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }, [toast]);

  // Get high-risk visitors (simplified implementation)
  const getHighRiskVisitors = useCallback(async (): Promise<{
    success: boolean;
    visitors?: Array<VisitorRiskProfile & { visitor_name: string }>;
    error?: string;
  }> => {
    try {
      // Get all visitors and calculate their risk
      const { data: visitors, error } = await supabase
        .from('visitors')
        .select('id, full_name_encrypted')
        .limit(20); // Limit for performance

      if (error) throw error;

      const highRiskVisitors: Array<VisitorRiskProfile & { visitor_name: string }> = [];

      // Calculate risk for each visitor
      for (const visitor of visitors || []) {
        const riskResult = await calculateVisitorRisk(visitor.id);
        if (riskResult.success && riskResult.riskProfile) {
          const riskLevel = riskResult.riskProfile.risk_level;
          if (riskLevel === 'high' || riskLevel === 'critical') {
            highRiskVisitors.push({
              ...riskResult.riskProfile,
              visitor_name: 'Visitor (encrypted)' // Don't decrypt here for security
            });
          }
        }
      }

      return {
        success: true,
        visitors: highRiskVisitors
      };

    } catch (error) {
      console.error('Failed to get high-risk visitors:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }, [calculateVisitorRisk]);

  // Create AI recommendation (simplified for now)
  const createRecommendation = useCallback(async (
    type: string,
    entityType: string,
    entityId: string,
    recommendation: Record<string, any>,
    confidence: number = 0.7
  ): Promise<{
    success: boolean;
    recommendationId?: string;
    error?: string;
  }> => {
    try {
      // Store in audit logs for now
      const { error } = await supabase
        .from('audit_logs')
        .insert({
          event_type: 'ai_recommendation',
          entity_type: entityType,
          entity_id: entityId,
          details: {
            recommendation_type: type,
            recommendation,
            confidence_score: confidence,
            created_at: new Date().toISOString()
          }
        });

      if (error) throw error;

      setState(prev => ({ 
        ...prev, 
        pendingRecommendations: prev.pendingRecommendations + 1
      }));

      return {
        success: true,
        recommendationId: 'temp_' + Date.now()
      };

    } catch (error) {
      console.error('Failed to create recommendation:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }, []);

  // Get pending recommendations (simplified)
  const getPendingRecommendations = useCallback(async (): Promise<{
    success: boolean;
    recommendations?: AIRecommendation[];
    error?: string;
  }> => {
    try {
      const { data, error } = await supabase
        .from('audit_logs')
        .select('*')
        .eq('event_type', 'ai_recommendation')
        .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
        .order('created_at', { ascending: false });

      if (error) throw error;

      const recommendations: AIRecommendation[] = (data || []).map(log => {
        const details = log.details as any; // Type assertion for now
        return {
          id: log.id,
          recommendation_type: details?.recommendation_type || 'unknown',
          entity_type: log.entity_type || 'unknown',
          entity_id: log.entity_id || '',
          recommendation: details?.recommendation || {},
          confidence_score: details?.confidence_score || 0.5,
          status: 'pending' as const,
          created_at: log.created_at || new Date().toISOString()
        };
      });

      setState(prev => ({ 
        ...prev, 
        pendingRecommendations: recommendations.length
      }));

      return {
        success: true,
        recommendations
      };

    } catch (error) {
      console.error('Failed to get recommendations:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }, []);

  // Update recommendation status (simplified)
  const updateRecommendationStatus = useCallback(async (
    recommendationId: string,
    status: 'accepted' | 'rejected',
    userId?: string
  ): Promise<{
    success: boolean;
    error?: string;
  }> => {
    try {
      // Update the audit log
      const { error } = await supabase
        .from('audit_logs')
        .update({
          details: {
            status,
            reviewed_by: userId,
            reviewed_at: new Date().toISOString()
          }
        })
        .eq('id', recommendationId);

      if (error) throw error;

      setState(prev => ({ 
        ...prev, 
        pendingRecommendations: Math.max(0, prev.pendingRecommendations - 1)
      }));

      return { success: true };

    } catch (error) {
      console.error('Failed to update recommendation:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }, []);

  // Bulk update risk profiles for all visitors
  const updateAllRiskProfiles = useCallback(async (): Promise<{
    success: boolean;
    updatedCount?: number;
    error?: string;
  }> => {
    try {
      setState(prev => ({ ...prev, isCalculating: true }));

      // Get recent visitors only to avoid overwhelming the system
      const { data: visitors, error: visitorsError } = await supabase
        .from('visitors')
        .select('id')
        .limit(50);

      if (visitorsError) throw visitorsError;

      if (!visitors || visitors.length === 0) {
        return { success: true, updatedCount: 0 };
      }

      // Update risk profiles in smaller batches
      let updatedCount = 0;
      const batchSize = 5;

      for (let i = 0; i < visitors.length; i += batchSize) {
        const batch = visitors.slice(i, i + batchSize);
        
        await Promise.all(
          batch.map(async (visitor) => {
            try {
              const result = await calculateVisitorRisk(visitor.id);
              if (result.success) {
                updatedCount++;
              }
            } catch (error) {
              console.error(`Failed to update risk for visitor ${visitor.id}:`, error);
            }
          })
        );
      }

      setState(prev => ({ 
        ...prev, 
        lastUpdate: new Date()
      }));

      toast({
        title: "Risk Profiles Updated",
        description: `Successfully updated ${updatedCount} visitor risk profiles`,
      });

      return {
        success: true,
        updatedCount
      };

    } catch (error) {
      console.error('Bulk risk update failed:', error);
      toast({
        title: "Update Failed",
        description: "Failed to update risk profiles",
        variant: "destructive"
      });

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    } finally {
      setState(prev => ({ ...prev, isCalculating: false }));
    }
  }, [toast, calculateVisitorRisk]);

  // Initialize and load current state
  useEffect(() => {
    const initializeRiskAssessment = async () => {
      // Load pending recommendations count
      await getPendingRecommendations();
      
      // Detect any new anomalies (skip for now to avoid errors)
      // await detectAnomalies();
    };

    initializeRiskAssessment();
  }, [getPendingRecommendations]);

  return {
    state,
    calculateVisitorRisk,
    getVisitorRiskProfile,
    detectAnomalies,
    getHighRiskVisitors,
    createRecommendation,
    getPendingRecommendations,
    updateRecommendationStatus,
    updateAllRiskProfiles
  };
}
