-- AR Integration System - Medium Priority Phase
-- Augmented Reality Features for Enhanced User Experience

-- 1. AR Content Types and Assets
CREATE TABLE ar_content_types (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  content_type_name VARCHAR(100) UNIQUE NOT NULL,
  content_category VARCHAR(50) NOT NULL CHECK (content_category IN ('navigation', 'information', 'interactive', 'security', 'maintenance', 'training', 'entertainment')),
  description TEXT,
  supported_formats TEXT[] DEFAULT ARRAY['3d_model', 'video', 'image', 'text', 'audio'],
  rendering_complexity VARCHAR(20) DEFAULT 'medium' CHECK (rendering_complexity IN ('low', 'medium', 'high', 'ultra')),
  performance_impact INTEGER DEFAULT 3 CHECK (performance_impact BETWEEN 1 AND 5),
  device_requirements JSONB DEFAULT '{}',
  interaction_methods TEXT[] DEFAULT ARRAY['tap', 'gesture', 'voice', 'gaze'],
  tracking_type VARCHAR(50) DEFAULT 'marker' CHECK (tracking_type IN ('marker', 'markerless', 'slam', 'gps', 'imu')),
  occlusion_handling BOOLEAN DEFAULT false,
  lighting_adaptation BOOLEAN DEFAULT true,
  multi_user_support BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. AR Scenes and Experiences
CREATE TABLE ar_scenes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  scene_name VARCHAR(200) NOT NULL,
  scene_type VARCHAR(50) NOT NULL CHECK (scene_type IN ('wayfinding', 'visitor_guide', 'security_overlay', 'device_status', 'maintenance_guide', 'emergency_info')),
  target_location JSONB, -- GPS coordinates or indoor positioning
  trigger_conditions JSONB DEFAULT '{}',
  ar_content_ids UUID[] NOT NULL,
  scene_configuration JSONB DEFAULT '{}',
  interaction_flow JSONB DEFAULT '{}',
  accessibility_features JSONB DEFAULT '{}',
  localization_data JSONB DEFAULT '{}', -- Multi-language support
  performance_optimization JSONB DEFAULT '{}',
  analytics_tracking BOOLEAN DEFAULT true,
  privacy_settings JSONB DEFAULT '{}',
  content_rating VARCHAR(10) DEFAULT 'G' CHECK (content_rating IN ('G', 'PG', 'PG-13', 'R')),
  is_public BOOLEAN DEFAULT false,
  requires_authentication BOOLEAN DEFAULT true,
  expiry_date TIMESTAMPTZ,
  version_number VARCHAR(20) DEFAULT '1.0',
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. AR Assets and 3D Models
CREATE TABLE ar_assets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  asset_name VARCHAR(200) NOT NULL,
  asset_type VARCHAR(50) NOT NULL CHECK (asset_type IN ('3d_model', 'texture', 'animation', 'audio', 'video', 'shader', 'script')),
  file_format VARCHAR(20) NOT NULL,
  file_size_bytes BIGINT NOT NULL,
  file_url TEXT NOT NULL,
  thumbnail_url TEXT,
  asset_hash VARCHAR(128) NOT NULL,
  compression_format VARCHAR(50),
  quality_level VARCHAR(20) DEFAULT 'medium' CHECK (quality_level IN ('low', 'medium', 'high', 'ultra')),
  polygon_count INTEGER, -- For 3D models
  texture_resolution VARCHAR(20), -- e.g., '1024x1024'
  animation_duration_seconds DECIMAL(8,2),
  audio_bitrate INTEGER,
  video_codec VARCHAR(20),
  licensing_info JSONB DEFAULT '{}',
  attribution_required BOOLEAN DEFAULT false,
  usage_rights TEXT,
  metadata JSONB DEFAULT '{}',
  tags TEXT[],
  optimization_flags JSONB DEFAULT '{}',
  platform_compatibility TEXT[] DEFAULT ARRAY['ios', 'android', 'web'],
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. AR Markers and Tracking Points
CREATE TABLE ar_markers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  marker_name VARCHAR(200) NOT NULL,
  marker_type VARCHAR(50) NOT NULL CHECK (marker_type IN ('qr_code', 'image_marker', 'object_marker', 'location_marker', 'nfc_tag')),
  marker_data TEXT NOT NULL, -- QR code data, image URL, etc.
  marker_identifier VARCHAR(100) UNIQUE NOT NULL,
  physical_location JSONB, -- GPS or indoor coordinates
  installation_date DATE DEFAULT CURRENT_DATE,
  marker_size_cm DECIMAL(6,2), -- Physical size in centimeters
  detection_distance_meters DECIMAL(6,2) DEFAULT 5.0,
  detection_angle_degrees INTEGER DEFAULT 45,
  associated_ar_scene_id UUID REFERENCES ar_scenes(id) ON DELETE SET NULL,
  tracking_configuration JSONB DEFAULT '{}',
  performance_metrics JSONB DEFAULT '{}',
  maintenance_schedule JSONB DEFAULT '{}',
  replacement_date DATE,
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'maintenance', 'damaged')),
  visibility_conditions TEXT[] DEFAULT ARRAY['daylight', 'artificial_light'],
  environmental_factors JSONB DEFAULT '{}',
  security_features JSONB DEFAULT '{}',
  installation_instructions TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. AR User Sessions and Analytics
CREATE TABLE ar_user_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  session_start TIMESTAMPTZ DEFAULT NOW(),
  session_end TIMESTAMPTZ,
  device_info JSONB NOT NULL,
  ar_capability_score INTEGER CHECK (ar_capability_score BETWEEN 0 AND 100),
  scenes_accessed UUID[],
  markers_detected UUID[],
  interactions_count INTEGER DEFAULT 0,
  session_duration_seconds INTEGER,
  performance_metrics JSONB DEFAULT '{}',
  user_feedback JSONB DEFAULT '{}',
  technical_issues JSONB DEFAULT '{}',
  location_data JSONB DEFAULT '{}',
  network_conditions JSONB DEFAULT '{}',
  battery_usage_percent DECIMAL(5,2),
  data_usage_mb DECIMAL(10,2),
  user_satisfaction_score INTEGER CHECK (user_satisfaction_score BETWEEN 1 AND 5),
  accessibility_features_used TEXT[],
  privacy_settings_applied JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. AR Interaction Events
CREATE TABLE ar_interaction_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  ar_session_id UUID REFERENCES ar_user_sessions(id) ON DELETE CASCADE,
  scene_id UUID REFERENCES ar_scenes(id) ON DELETE CASCADE,
  marker_id UUID REFERENCES ar_markers(id) ON DELETE SET NULL,
  event_timestamp TIMESTAMPTZ DEFAULT NOW(),
  interaction_type VARCHAR(50) NOT NULL CHECK (interaction_type IN ('view', 'tap', 'gesture', 'voice_command', 'gaze', 'proximity')),
  interaction_target VARCHAR(200),
  interaction_duration_seconds DECIMAL(8,2),
  gesture_data JSONB DEFAULT '{}',
  voice_command TEXT,
  gaze_duration_seconds DECIMAL(6,2),
  object_manipulation JSONB DEFAULT '{}',
  user_position JSONB DEFAULT '{}',
  device_orientation JSONB DEFAULT '{}',
  environmental_context JSONB DEFAULT '{}',
  interaction_success BOOLEAN DEFAULT true,
  error_details TEXT,
  user_intent_prediction VARCHAR(100),
  next_action_suggestion VARCHAR(200),
  interaction_quality_score DECIMAL(3,2) DEFAULT 1.0
);

-- 7. AR Navigation and Wayfinding
CREATE TABLE ar_navigation_routes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  route_name VARCHAR(200) NOT NULL,
  start_location JSONB NOT NULL,
  end_location JSONB NOT NULL,
  waypoints JSONB DEFAULT '[]', -- Array of intermediate points
  route_type VARCHAR(50) DEFAULT 'pedestrian' CHECK (route_type IN ('pedestrian', 'wheelchair', 'emergency', 'maintenance', 'vip')),
  estimated_duration_minutes INTEGER,
  distance_meters DECIMAL(8,2),
  difficulty_level VARCHAR(20) DEFAULT 'easy' CHECK (difficulty_level IN ('easy', 'medium', 'difficult')),
  accessibility_features TEXT[],
  hazards_warnings TEXT[],
  ar_guidance_points JSONB DEFAULT '[]',
  visual_indicators JSONB DEFAULT '{}',
  audio_instructions JSONB DEFAULT '{}',
  language_variants JSONB DEFAULT '{}',
  real_time_updates BOOLEAN DEFAULT true,
  crowd_avoidance BOOLEAN DEFAULT false,
  emergency_protocols JSONB DEFAULT '{}',
  usage_analytics JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. AR Device Capabilities and Compatibility
CREATE TABLE ar_device_profiles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  device_model VARCHAR(200) NOT NULL,
  manufacturer VARCHAR(100) NOT NULL,
  operating_system VARCHAR(50) NOT NULL,
  os_version VARCHAR(20),
  ar_framework VARCHAR(50) NOT NULL CHECK (ar_framework IN ('ARKit', 'ARCore', 'WebXR', 'Vuforia', 'Unity_AR', '8th_Wall')),
  cpu_capabilities JSONB DEFAULT '{}',
  gpu_capabilities JSONB DEFAULT '{}',
  camera_specifications JSONB DEFAULT '{}',
  sensor_capabilities JSONB DEFAULT '{}',
  tracking_accuracy_rating DECIMAL(3,2) DEFAULT 0.8,
  rendering_performance_score INTEGER CHECK (rendering_performance_score BETWEEN 0 AND 100),
  battery_efficiency_score INTEGER CHECK (battery_efficiency_score BETWEEN 0 AND 100),
  supported_features TEXT[],
  limitations TEXT[],
  recommended_settings JSONB DEFAULT '{}',
  optimization_profiles JSONB DEFAULT '{}',
  testing_results JSONB DEFAULT '{}',
  certification_status VARCHAR(50) DEFAULT 'pending',
  last_tested_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(device_model, manufacturer, os_version)
);

-- 9. AR Content Performance Metrics
CREATE TABLE ar_content_performance (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  content_id UUID, -- Can reference ar_scenes, ar_assets, etc.
  content_type VARCHAR(50) NOT NULL,
  measurement_date DATE DEFAULT CURRENT_DATE,
  view_count INTEGER DEFAULT 0,
  interaction_count INTEGER DEFAULT 0,
  average_view_duration_seconds DECIMAL(8,2),
  completion_rate DECIMAL(5,4),
  user_rating DECIMAL(3,2),
  loading_time_ms INTEGER,
  rendering_fps DECIMAL(6,2),
  memory_usage_mb DECIMAL(10,2),
  network_data_usage_mb DECIMAL(10,2),
  error_rate DECIMAL(5,4),
  crash_count INTEGER DEFAULT 0,
  device_compatibility_score DECIMAL(3,2),
  accessibility_usage_percent DECIMAL(5,2),
  localization_effectiveness JSONB DEFAULT '{}',
  user_feedback_summary JSONB DEFAULT '{}',
  performance_optimization_suggestions TEXT[],
  business_impact_metrics JSONB DEFAULT '{}'
);

-- 10. Advanced Indexes for AR Performance
CREATE INDEX idx_ar_sessions_user_start ON ar_user_sessions (user_id, session_start DESC);
CREATE INDEX idx_ar_sessions_tenant_duration ON ar_user_sessions (tenant_id, session_duration_seconds DESC);
CREATE INDEX idx_ar_interactions_session_timestamp ON ar_interaction_events (ar_session_id, event_timestamp DESC);
CREATE INDEX idx_ar_interactions_type_success ON ar_interaction_events (interaction_type, interaction_success, event_timestamp DESC);
CREATE INDEX idx_ar_markers_location ON ar_markers USING GIST ((physical_location::jsonb));
CREATE INDEX idx_ar_scenes_location ON ar_scenes USING GIST ((target_location::jsonb));
CREATE INDEX idx_ar_navigation_route_type ON ar_navigation_routes (route_type, is_active);
CREATE INDEX idx_ar_content_performance_date_type ON ar_content_performance (measurement_date DESC, content_type);

-- 11. AR Scene Recommendation Function
CREATE OR REPLACE FUNCTION recommend_ar_scenes(
  p_user_id UUID,
  p_current_location JSONB,
  p_user_preferences JSONB DEFAULT '{}'
)
RETURNS TABLE (
  scene_id UUID,
  scene_name VARCHAR(200),
  relevance_score DECIMAL(5,2),
  estimated_engagement_time INTEGER,
  distance_meters DECIMAL(8,2)
) AS $$
DECLARE
  user_history RECORD;
  location_lat DECIMAL(10,6);
  location_lng DECIMAL(10,6);
BEGIN
  -- Extract location coordinates
  location_lat := (p_current_location->>'lat')::decimal;
  location_lng := (p_current_location->>'lng')::decimal;

  -- Get user interaction history
  SELECT 
    COUNT(*) as total_sessions,
    AVG(session_duration_seconds) as avg_duration,
    ARRAY_AGG(DISTINCT unnest(scenes_accessed)) as accessed_scenes
  INTO user_history
  FROM ar_user_sessions
  WHERE user_id = p_user_id
    AND session_start > NOW() - INTERVAL '30 days';

  -- Return recommended scenes based on location, preferences, and history
  RETURN QUERY
  SELECT 
    ars.id,
    ars.scene_name,
    CASE 
      -- Higher score for nearby scenes
      WHEN ars.target_location IS NOT NULL THEN
        GREATEST(0, 100 - (
          ST_Distance(
            ST_GeogFromText('POINT(' || location_lng || ' ' || location_lat || ')'),
            ST_GeogFromText('POINT(' || (ars.target_location->>'lng')::decimal || ' ' || (ars.target_location->>'lat')::decimal || ')')
          ) / 10 -- Distance penalty factor
        ))
      ELSE 50 -- Default score for location-independent scenes
    END as relevance_score,
    CASE 
      WHEN ars.scene_type = 'wayfinding' THEN 120 -- 2 minutes
      WHEN ars.scene_type = 'visitor_guide' THEN 300 -- 5 minutes
      WHEN ars.scene_type = 'security_overlay' THEN 60 -- 1 minute
      ELSE 180 -- 3 minutes default
    END as estimated_engagement_time,
    CASE 
      WHEN ars.target_location IS NOT NULL THEN
        ST_Distance(
          ST_GeogFromText('POINT(' || location_lng || ' ' || location_lat || ')'),
          ST_GeogFromText('POINT(' || (ars.target_location->>'lng')::decimal || ' ' || (ars.target_location->>'lat')::decimal || ')')
        )
      ELSE 0
    END as distance_meters
  FROM ar_scenes ars
  WHERE ars.is_public = true 
    OR (ars.requires_authentication = true AND p_user_id IS NOT NULL)
    AND (ars.expiry_date IS NULL OR ars.expiry_date > NOW())
    AND NOT (ars.id = ANY(COALESCE(user_history.accessed_scenes, ARRAY[]::UUID[])))
  ORDER BY relevance_score DESC, distance_meters ASC
  LIMIT 10;
END;
$$ LANGUAGE plpgsql;

-- 12. AR Performance Analytics Function
CREATE OR REPLACE FUNCTION analyze_ar_performance(
  p_tenant_id UUID,
  p_analysis_days INTEGER DEFAULT 7
)
RETURNS JSONB AS $$
DECLARE
  performance_data JSONB;
  total_sessions INTEGER;
  avg_session_duration DECIMAL(8,2);
  total_interactions INTEGER;
  unique_users INTEGER;
  most_popular_scene RECORD;
BEGIN
  -- Calculate basic metrics
  SELECT 
    COUNT(*) as sessions,
    AVG(session_duration_seconds) as avg_duration,
    COUNT(DISTINCT user_id) as users
  INTO total_sessions, avg_session_duration, unique_users
  FROM ar_user_sessions
  WHERE tenant_id = p_tenant_id
    AND session_start > NOW() - INTERVAL '1 day' * p_analysis_days;

  -- Get total interactions
  SELECT COUNT(*) INTO total_interactions
  FROM ar_interaction_events aie
  JOIN ar_user_sessions aus ON aie.ar_session_id = aus.id
  WHERE aus.tenant_id = p_tenant_id
    AND aie.event_timestamp > NOW() - INTERVAL '1 day' * p_analysis_days;

  -- Find most popular scene
  SELECT 
    ars.scene_name,
    COUNT(*) as view_count
  INTO most_popular_scene
  FROM ar_user_sessions aus
  JOIN ar_scenes ars ON ars.id = ANY(aus.scenes_accessed)
  WHERE aus.tenant_id = p_tenant_id
    AND aus.session_start > NOW() - INTERVAL '1 day' * p_analysis_days
  GROUP BY ars.id, ars.scene_name
  ORDER BY view_count DESC
  LIMIT 1;

  performance_data := jsonb_build_object(
    'analysis_period_days', p_analysis_days,
    'total_sessions', COALESCE(total_sessions, 0),
    'unique_users', COALESCE(unique_users, 0),
    'average_session_duration_seconds', COALESCE(avg_session_duration, 0),
    'total_interactions', COALESCE(total_interactions, 0),
    'interactions_per_session', CASE 
      WHEN total_sessions > 0 THEN ROUND(total_interactions::decimal / total_sessions, 2)
      ELSE 0 
    END,
    'most_popular_scene', COALESCE(most_popular_scene.scene_name, 'None'),
    'most_popular_scene_views', COALESCE(most_popular_scene.view_count, 0),
    'analysis_timestamp', NOW()
  );

  RETURN performance_data;
END;
$$ LANGUAGE plpgsql;

-- 13. AR Navigation Route Optimization
CREATE OR REPLACE FUNCTION optimize_ar_navigation_route(
  p_start_location JSONB,
  p_end_location JSONB,
  p_user_preferences JSONB DEFAULT '{}',
  p_accessibility_requirements TEXT[] DEFAULT ARRAY[]::TEXT[]
)
RETURNS JSONB AS $$
DECLARE
  optimized_route JSONB;
  route_waypoints JSONB[];
  estimated_time INTEGER;
  total_distance DECIMAL(8,2);
BEGIN
  -- Calculate basic route parameters
  total_distance := ST_Distance(
    ST_GeogFromText('POINT(' || (p_start_location->>'lng')::decimal || ' ' || (p_start_location->>'lat')::decimal || ')'),
    ST_GeogFromText('POINT(' || (p_end_location->>'lng')::decimal || ' ' || (p_end_location->>'lat')::decimal || ')')
  );

  -- Estimate walking time (assuming 1.4 m/s average walking speed)
  estimated_time := CEIL(total_distance / 1.4 / 60); -- Convert to minutes

  -- Add waypoints for AR guidance (simplified - would use actual pathfinding)
  route_waypoints := ARRAY[
    p_start_location,
    jsonb_build_object(
      'lat', ((p_start_location->>'lat')::decimal + (p_end_location->>'lat')::decimal) / 2,
      'lng', ((p_start_location->>'lng')::decimal + (p_end_location->>'lng')::decimal) / 2,
      'type', 'intermediate',
      'ar_guidance', 'Continue straight ahead'
    ),
    p_end_location
  ];

  optimized_route := jsonb_build_object(
    'start_location', p_start_location,
    'end_location', p_end_location,
    'waypoints', route_waypoints,
    'total_distance_meters', total_distance,
    'estimated_duration_minutes', estimated_time,
    'route_type', CASE 
      WHEN 'wheelchair' = ANY(p_accessibility_requirements) THEN 'wheelchair'
      ELSE 'pedestrian'
    END,
    'accessibility_features', p_accessibility_requirements,
    'ar_guidance_points', jsonb_build_array(
      jsonb_build_object('type', 'start', 'message', 'Begin navigation'),
      jsonb_build_object('type', 'waypoint', 'message', 'Continue following the AR path'),
      jsonb_build_object('type', 'destination', 'message', 'You have arrived at your destination')
    ),
    'generated_at', NOW()
  );

  RETURN optimized_route;
END;
$$ LANGUAGE plpgsql;

-- 14. Insert Sample AR Content Types
INSERT INTO ar_content_types (content_type_name, content_category, description, supported_formats, tracking_type) VALUES
('Wayfinding Arrows', 'navigation', '3D arrow indicators for navigation guidance', ARRAY['3d_model'], 'slam'),
('Information Panels', 'information', 'Interactive information displays', ARRAY['text', 'image', 'video'], 'marker'),
('Device Status Overlay', 'maintenance', 'Real-time device status and diagnostics', ARRAY['text', '3d_model'], 'marker'),
('Security Alert Indicators', 'security', 'Visual security alerts and warnings', ARRAY['3d_model', 'audio'], 'markerless'),
('Interactive Tutorials', 'training', 'Step-by-step training experiences', ARRAY['video', 'audio', '3d_model'], 'marker'),
('Virtual Reception', 'information', 'Virtual receptionist and assistance', ARRAY['3d_model', 'audio'], 'markerless'),
('Emergency Exit Guide', 'navigation', 'Emergency evacuation route guidance', ARRAY['3d_model', 'audio'], 'slam'),
('Visitor Badge Scanner', 'interactive', 'AR-enhanced visitor badge scanning', ARRAY['image', 'text'], 'marker');

-- 15. RLS Policies
ALTER TABLE ar_content_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE ar_scenes ENABLE ROW LEVEL SECURITY;
ALTER TABLE ar_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE ar_markers ENABLE ROW LEVEL SECURITY;
ALTER TABLE ar_user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE ar_interaction_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE ar_navigation_routes ENABLE ROW LEVEL SECURITY;
ALTER TABLE ar_device_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE ar_content_performance ENABLE ROW LEVEL SECURITY;

-- Tenant isolation policies
CREATE POLICY ar_scenes_tenant_isolation ON ar_scenes
  USING (tenant_id = auth.jwt() ->> 'tenant_id'::text);

CREATE POLICY ar_markers_tenant_isolation ON ar_markers
  USING (tenant_id = auth.jwt() ->> 'tenant_id'::text);

CREATE POLICY ar_user_sessions_tenant_isolation ON ar_user_sessions
  USING (tenant_id = auth.jwt() ->> 'tenant_id'::text);

CREATE POLICY ar_navigation_routes_tenant_isolation ON ar_navigation_routes
  USING (tenant_id = auth.jwt() ->> 'tenant_id'::text);

-- Public access for content types and device profiles
CREATE POLICY ar_content_types_public ON ar_content_types
  USING (true);

CREATE POLICY ar_device_profiles_public ON ar_device_profiles
  USING (true);

-- Service role access
CREATE POLICY ar_assets_service_role ON ar_assets
  USING (auth.role() = 'service_role');

CREATE POLICY ar_content_performance_service_role ON ar_content_performance
  USING (auth.role() = 'service_role');

COMMENT ON TABLE ar_content_types IS 'Types and categories of AR content with technical specifications';
COMMENT ON TABLE ar_scenes IS 'AR experiences and scenes for different use cases';
COMMENT ON TABLE ar_assets IS '3D models, textures, and media assets for AR content';
COMMENT ON TABLE ar_markers IS 'Physical markers and tracking points for AR triggers';
COMMENT ON TABLE ar_user_sessions IS 'User AR session tracking and analytics';
COMMENT ON TABLE ar_interaction_events IS 'Detailed AR interaction event logging';
COMMENT ON TABLE ar_navigation_routes IS 'AR-enhanced navigation and wayfinding routes';
COMMENT ON TABLE ar_device_profiles IS 'AR device capabilities and compatibility matrix';
COMMENT ON TABLE ar_content_performance IS 'Performance metrics and analytics for AR content';
