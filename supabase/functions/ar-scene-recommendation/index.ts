import "jsr:@supabase/functions-js/edge-runtime.d.ts";

interface ARSceneRequest {
  userId: string;
  currentLocation: {
    lat: number;
    lng: number;
  };
  userPreferences?: Record<string, any>;
  deviceCapabilities?: {
    arFramework: string;
    performanceScore: number;
    supportedFeatures: string[];
  };
}

interface ARSceneResponse {
  recommendedScenes: Array<{
    sceneId: string;
    sceneName: string;
    sceneType: string;
    relevanceScore: number;
    estimatedEngagementTime: number;
    distanceMeters: number;
    arContent: any[];
    markers: any[];
    sceneConfiguration?: any;
    interactionFlow?: any;
    accessibilityFeatures?: any;
    localizationData?: any;
    targetLocation?: any;
    triggerConditions?: any;
  }>;
  navigationRoute?: any;
  deviceOptimization: any;
  sessionId?: string;
  timestamp?: string;
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
    const { supabaseClient } = await import('../_shared/supabase.ts');
    
    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        { status: 405, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const {
      userId,
      currentLocation,
      userPreferences = {},
      deviceCapabilities
    }: ARSceneRequest = await req.json();

    if (!userId || !currentLocation) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: userId, currentLocation' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Get recommended AR scenes
    const { data: recommendedScenes, error: scenesError } = await supabaseClient
      .rpc('recommend_ar_scenes', {
        p_user_id: userId,
        p_current_location: currentLocation,
        p_user_preferences: userPreferences
      });

    if (scenesError) {
      throw new Error(`Failed to get recommended scenes: ${scenesError.message}`);
    }

    // Enhance recommendations with full scene details
    const enhancedScenes: ARSceneResponse['recommendedScenes'] = [];
    
    for (const scene of recommendedScenes || []) {
      // Get scene details
      const { data: sceneDetails } = await supabaseClient
        .from('ar_scenes')
        .select(`
          *,
          ar_content_types!inner(*),
          ar_markers(*)
        `)
        .eq('id', scene.scene_id)
        .single();

      if (sceneDetails) {
        // Get associated AR assets
        const { data: arAssets } = await supabaseClient
          .from('ar_assets')
          .select('*')
          .in('id', sceneDetails.ar_content_ids || []);

        enhancedScenes.push({
          sceneId: scene.scene_id,
          sceneName: scene.scene_name,
          sceneType: sceneDetails.scene_type,
          relevanceScore: scene.relevance_score,
          estimatedEngagementTime: scene.estimated_engagement_time,
          distanceMeters: scene.distance_meters,
          sceneConfiguration: sceneDetails.scene_configuration,
          interactionFlow: sceneDetails.interaction_flow,
          accessibilityFeatures: sceneDetails.accessibility_features,
          localizationData: sceneDetails.localization_data,
          arContent: arAssets || [],
          markers: sceneDetails.ar_markers || [],
          targetLocation: sceneDetails.target_location,
          triggerConditions: sceneDetails.trigger_conditions
        });
      }
    }

    // Get device optimization settings
    let deviceOptimization = {
      recommendedQuality: 'medium',
      maxPolygonCount: 10000,
      enableOcclusion: false,
      renderingFps: 30,
      batteryOptimization: true
    };

    if (deviceCapabilities) {
      const { data: deviceProfile } = await supabaseClient
        .from('ar_device_profiles')
        .select('*')
        .eq('ar_framework', deviceCapabilities.arFramework)
        .gte('rendering_performance_score', deviceCapabilities.performanceScore - 10)
        .lte('rendering_performance_score', deviceCapabilities.performanceScore + 10)
        .order('rendering_performance_score', { ascending: false })
        .limit(1)
        .single();

      if (deviceProfile) {
        deviceOptimization = {
          ...deviceOptimization,
          ...deviceProfile.recommended_settings,
          optimizationProfile: deviceProfile.optimization_profiles
        };
      }
    }

    // Generate navigation route if there are nearby scenes
    let navigationRoute = null;
    if (enhancedScenes.length > 0) {
      const nearestScene = enhancedScenes[0];
      if (nearestScene.targetLocation && nearestScene.distanceMeters > 10) {
        const { data: routeData } = await supabaseClient
          .rpc('optimize_ar_navigation_route', {
            p_start_location: currentLocation,
            p_end_location: nearestScene.targetLocation,
            p_user_preferences: userPreferences,
            p_accessibility_requirements: userPreferences.accessibilityRequirements || []
          });

        navigationRoute = routeData;
      }
    }

    // Log AR session start
    const { data: sessionData } = await supabaseClient
      .from('ar_user_sessions')
      .insert({
        user_id: userId,
        device_info: deviceCapabilities || {},
        ar_capability_score: deviceCapabilities?.performanceScore || 50,
        scenes_accessed: enhancedScenes.map(s => s.sceneId),
        session_start: new Date().toISOString()
      })
      .select('id')
      .single();

    const response: ARSceneResponse = {
      recommendedScenes: enhancedScenes,
      navigationRoute,
      deviceOptimization,
      sessionId: sessionData?.id,
      timestamp: new Date().toISOString()
    };

    return new Response(
      JSON.stringify(response),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );

  } catch (error) {
    console.error('AR scene recommendation error:', error);
    
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
