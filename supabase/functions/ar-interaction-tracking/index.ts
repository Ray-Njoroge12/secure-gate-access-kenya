import "jsr:@supabase/functions-js/edge-runtime.d.ts";

interface ARInteractionEvent {
  sessionId: string;
  sceneId: string;
  markerId?: string;
  interactionType: 'view' | 'tap' | 'gesture' | 'voice_command' | 'gaze' | 'proximity';
  interactionTarget?: string;
  interactionDuration?: number;
  gestureData?: Record<string, any>;
  voiceCommand?: string;
  gazeDuration?: number;
  objectManipulation?: Record<string, any>;
  userPosition?: {
    lat: number;
    lng: number;
    altitude?: number;
  };
  deviceOrientation?: {
    pitch: number;
    yaw: number;
    roll: number;
  };
  environmentalContext?: Record<string, any>;
  interactionSuccess?: boolean;
  errorDetails?: string;
}

interface ARSessionUpdate {
  sessionId: string;
  sessionEnd?: string;
  performanceMetrics?: Record<string, any>;
  userFeedback?: Record<string, any>;
  technicalIssues?: Record<string, any>;
  batteryUsage?: number;
  dataUsage?: number;
  userSatisfactionScore?: number;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      },
    });
  }

  try {
    const { createClient } = await import('jsr:@supabase/supabase-js@2');
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        { status: 405, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const requestData = await req.json();
    const action = requestData.action;

    if (action === 'track_interaction') {
      const event: ARInteractionEvent = requestData.event;

      if (!event.sessionId || !event.sceneId || !event.interactionType) {
        return new Response(
          JSON.stringify({ error: 'Missing required fields: sessionId, sceneId, interactionType' }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
      }

      // Insert interaction event
      const { data, error } = await supabase
        .from('ar_interaction_events')
        .insert({
          ar_session_id: event.sessionId,
          scene_id: event.sceneId,
          marker_id: event.markerId,
          interaction_type: event.interactionType,
          interaction_target: event.interactionTarget,
          interaction_duration_seconds: event.interactionDuration,
          gesture_data: event.gestureData || {},
          voice_command: event.voiceCommand,
          gaze_duration_seconds: event.gazeDuration,
          object_manipulation: event.objectManipulation || {},
          user_position: event.userPosition || {},
          device_orientation: event.deviceOrientation || {},
          environmental_context: event.environmentalContext || {},
          interaction_success: event.interactionSuccess ?? true,
          error_details: event.errorDetails,
          event_timestamp: new Date().toISOString()
        })
        .select('id')
        .single();

      if (error) {
        throw new Error(`Failed to track interaction: ${error.message}`);
      }

      // Update session interaction count
      await supabase.rpc('increment_session_interactions', {
        p_session_id: event.sessionId
      });

      // Generate user intent prediction and next action suggestion
      const predictions = await generateInteractionPredictions(supabase, event);

      return new Response(
        JSON.stringify({
          success: true,
          interactionId: data.id,
          predictions,
          timestamp: new Date().toISOString()
        }),
        {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        }
      );

    } else if (action === 'update_session') {
      const update: ARSessionUpdate = requestData.update;

      if (!update.sessionId) {
        return new Response(
          JSON.stringify({ error: 'Missing required field: sessionId' }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
      }

      // Calculate session duration if ending session
      let sessionDuration: number | null = null;
      if (update.sessionEnd) {
        const { data: sessionData } = await supabase
          .from('ar_user_sessions')
          .select('session_start')
          .eq('id', update.sessionId)
          .single();

        if (sessionData?.session_start) {
          const startTime = new Date(sessionData.session_start);
          const endTime = new Date(update.sessionEnd);
          sessionDuration = Math.floor((endTime.getTime() - startTime.getTime()) / 1000);
        }
      }

      // Update session
      const updateData: any = {
        updated_at: new Date().toISOString()
      };

      if (update.sessionEnd) {
        updateData.session_end = update.sessionEnd;
        updateData.session_duration_seconds = sessionDuration;
      }
      if (update.performanceMetrics) updateData.performance_metrics = update.performanceMetrics;
      if (update.userFeedback) updateData.user_feedback = update.userFeedback;
      if (update.technicalIssues) updateData.technical_issues = update.technicalIssues;
      if (update.batteryUsage) updateData.battery_usage_percent = update.batteryUsage;
      if (update.dataUsage) updateData.data_usage_mb = update.dataUsage;
      if (update.userSatisfactionScore) updateData.user_satisfaction_score = update.userSatisfactionScore;

      const { error } = await supabase
        .from('ar_user_sessions')
        .update(updateData)
        .eq('id', update.sessionId);

      if (error) {
        throw new Error(`Failed to update session: ${error.message}`);
      }

      // Generate session analytics if ending session
      let analytics: any = null;
      if (update.sessionEnd) {
        analytics = await generateSessionAnalytics(supabase, update.sessionId);
      }

      return new Response(
        JSON.stringify({
          success: true,
          analytics,
          timestamp: new Date().toISOString()
        }),
        {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        }
      );

    } else {
      return new Response(
        JSON.stringify({ error: 'Invalid action. Use "track_interaction" or "update_session"' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

  } catch (error) {
    console.error('AR interaction tracking error:', error);
    
    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  }
});

async function generateInteractionPredictions(supabase: any, event: ARInteractionEvent) {
  try {
    // Get recent interactions for pattern analysis
    const { data: recentInteractions } = await supabase
      .from('ar_interaction_events')
      .select('interaction_type, interaction_target, interaction_success')
      .eq('ar_session_id', event.sessionId)
      .order('event_timestamp', { ascending: false })
      .limit(10);

    // Simple intent prediction logic
    let userIntent = 'exploring';
    let nextActionSuggestion = 'Continue exploring the AR content';

    if (event.interactionType === 'tap' && event.interactionTarget?.includes('navigation')) {
      userIntent = 'navigating';
      nextActionSuggestion = 'Follow the AR navigation arrows to your destination';
    } else if (event.interactionType === 'gaze' && event.gazeDuration && event.gazeDuration > 3) {
      userIntent = 'information_seeking';
      nextActionSuggestion = 'Tap on the information panel to learn more';
    } else if (event.interactionType === 'voice_command') {
      userIntent = 'assistance_seeking';
      nextActionSuggestion = 'Continue speaking or tap for more help options';
    } else if (event.interactionType === 'gesture' && event.gestureData?.type === 'swipe') {
      userIntent = 'browsing';
      nextActionSuggestion = 'Swipe to see more AR content options';
    }

    // Check for interaction patterns
    const failureRate = recentInteractions?.filter(i => !i.interaction_success).length || 0;
    if (failureRate > 3) {
      nextActionSuggestion = 'Need help? Try speaking "Help" or tap the assistance button';
    }

    return {
      userIntent,
      nextActionSuggestion,
      confidence: Math.random() * 0.4 + 0.6, // Mock confidence score
      patternAnalysis: {
        recentInteractionCount: recentInteractions?.length || 0,
        failureRate,
        dominantInteractionType: findMostCommon(recentInteractions?.map(i => i.interaction_type) || [])
      }
    };
  } catch (error) {
    console.error('Error generating predictions:', error);
    return {
      userIntent: 'unknown',
      nextActionSuggestion: 'Continue exploring',
      confidence: 0.5
    };
  }
}

async function generateSessionAnalytics(supabase: any, sessionId: string) {
  try {
    // Get session details
    const { data: session } = await supabase
      .from('ar_user_sessions')
      .select('*')
      .eq('id', sessionId)
      .single();

    // Get interaction events
    const { data: interactions } = await supabase
      .from('ar_interaction_events')
      .select('*')
      .eq('ar_session_id', sessionId);

    if (!session || !interactions) {
      return null;
    }

    const totalInteractions = interactions.length;
    const successfulInteractions = interactions.filter(i => i.interaction_success).length;
    const averageInteractionDuration = interactions
      .filter(i => i.interaction_duration_seconds)
      .reduce((sum, i) => sum + (i.interaction_duration_seconds || 0), 0) / totalInteractions || 0;

    const interactionTypes = interactions.reduce((acc: Record<string, number>, i) => {
      acc[i.interaction_type] = (acc[i.interaction_type] || 0) + 1;
      return acc;
    }, {});

    return {
      sessionDuration: session.session_duration_seconds,
      totalInteractions,
      successRate: totalInteractions > 0 ? successfulInteractions / totalInteractions : 0,
      averageInteractionDuration,
      interactionTypes,
      scenesAccessed: session.scenes_accessed?.length || 0,
      markersDetected: session.markers_detected?.length || 0,
      userSatisfaction: session.user_satisfaction_score,
      performanceScore: calculatePerformanceScore(session, interactions),
      recommendations: generateRecommendations(session, interactions)
    };
  } catch (error) {
    console.error('Error generating session analytics:', error);
    return null;
  }
}

function calculatePerformanceScore(session: any, interactions: any[]) {
  const factors = {
    sessionDuration: Math.min(session.session_duration_seconds / 300, 1) * 0.2, // Up to 5 minutes
    interactionSuccess: interactions.length > 0 ? 
      interactions.filter(i => i.interaction_success).length / interactions.length * 0.3 : 0,
    userSatisfaction: (session.user_satisfaction_score || 3) / 5 * 0.3,
    sceneEngagement: Math.min((session.scenes_accessed?.length || 0) / 3, 1) * 0.2
  };

  return Math.round((factors.sessionDuration + factors.interactionSuccess + 
                   factors.userSatisfaction + factors.sceneEngagement) * 100);
}

function generateRecommendations(session: any, interactions: any[]): string[] {
  const recommendations: string[] = [];

  if (session.session_duration_seconds < 60) {
    recommendations.push('Consider adding more engaging content to increase session duration');
  }

  const failureRate = interactions.filter(i => !i.interaction_success).length / interactions.length;
  if (failureRate > 0.3) {
    recommendations.push('High interaction failure rate detected. Review UI/UX design');
  }

  if ((session.user_satisfaction_score || 0) < 3) {
    recommendations.push('Low user satisfaction. Consider user feedback for improvements');
  }

  if (!recommendations.length) {
    recommendations.push('Great session! AR experience is performing well');
  }

  return recommendations;
}

function findMostCommon(arr: string[]): string {
  const counts = arr.reduce((acc: Record<string, number>, item) => {
    acc[item] = (acc[item] || 0) + 1;
    return acc;
  }, {});

  return Object.keys(counts).reduce((a, b) => counts[a] > counts[b] ? a : b, '');
}
