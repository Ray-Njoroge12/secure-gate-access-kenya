import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Eye, 
  Camera, 
  Navigation, 
  Zap, 
  Users, 
  BarChart3, 
  Settings, 
  MapPin,
  Smartphone,
  Clock,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  XCircle,
  RefreshCw
} from 'lucide-react';

interface ARScene {
  id: string;
  scene_name: string;
  scene_type: string;
  target_location?: { lat: number; lng: number };
  is_public: boolean;
  requires_authentication: boolean;
  created_at: string;
}

interface ARSession {
  id: string;
  user_id: string;
  session_start: string;
  session_end?: string;
  session_duration_seconds?: number;
  device_info: any;
  ar_capability_score?: number;
  scenes_accessed?: string[];
  interactions_count: number;
  user_satisfaction_score?: number;
}

interface ARAnalytics {
  totalSessions: number;
  uniqueUsers: number;
  averageSessionDuration: number;
  totalInteractions: number;
  interactionsPerSession: number;
  mostPopularScene: string;
  mostPopularSceneViews: number;
}

interface DeviceCapabilities {
  arFramework: string;
  performanceScore: number;
  supportedFeatures: string[];
  cameraResolution?: string;
  trackingAccuracy?: number;
}

const ARDashboard: React.FC = () => {
  const [arScenes, setArScenes] = useState<ARScene[]>([]);
  const [recentSessions, setRecentSessions] = useState<ARSession[]>([]);
  const [analytics, setAnalytics] = useState<ARAnalytics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedScene, setSelectedScene] = useState<string | null>(null);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [deviceCapabilities, setDeviceCapabilities] = useState<DeviceCapabilities | null>(null);
  const [arSessionId, setArSessionId] = useState<string | null>(null);
  const [isARActive, setIsARActive] = useState(false);

  const arViewRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadDashboardData();
    detectDeviceCapabilities();
    getCurrentLocation();
  }, []);

  const loadDashboardData = async () => {
    try {
      setIsLoading(true);
      
      // Load AR scenes
      const { data: scenes, error: scenesError } = await supabase
        .from('ar_scenes')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);

      if (scenesError) throw scenesError;
      setArScenes(scenes || []);

      // Load recent AR sessions
      const { data: sessions, error: sessionsError } = await supabase
        .from('ar_user_sessions')
        .select('*')
        .order('session_start', { ascending: false })
        .limit(10);

      if (sessionsError) throw sessionsError;
      setRecentSessions(sessions || []);

      // Load analytics
      const { data: analyticsData, error: analyticsError } = await supabase
        .rpc('analyze_ar_performance', {
          p_tenant_id: 'current-tenant', // Replace with actual tenant ID
          p_analysis_days: 7
        });

      if (analyticsError) throw analyticsError;
      setAnalytics(analyticsData);

    } catch (err) {
      console.error('Error loading AR dashboard data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load dashboard data');
    } finally {
      setIsLoading(false);
    }
  };

  const detectDeviceCapabilities = () => {
    const userAgent = navigator.userAgent;
    const isIOS = /iPad|iPhone|iPod/.test(userAgent);
    const isAndroid = /Android/.test(userAgent);
    
    let arFramework = 'WebXR';
    let performanceScore = 50;
    let supportedFeatures = ['basic_tracking', 'plane_detection'];

    if (isIOS) {
      arFramework = 'ARKit';
      performanceScore = 80;
      supportedFeatures = ['advanced_tracking', 'plane_detection', 'face_tracking', 'object_tracking'];
    } else if (isAndroid) {
      arFramework = 'ARCore';
      performanceScore = 70;
      supportedFeatures = ['advanced_tracking', 'plane_detection', 'light_estimation'];
    }

    // Check for additional capabilities
    if ('xr' in navigator) {
      supportedFeatures.push('webxr_support');
      performanceScore += 10;
    }

    if ('mediaDevices' in navigator && 'getUserMedia' in navigator.mediaDevices) {
      supportedFeatures.push('camera_access');
    }

    setDeviceCapabilities({
      arFramework,
      performanceScore,
      supportedFeatures,
      cameraResolution: '1920x1080', // Mock value
      trackingAccuracy: performanceScore / 100
    });
  };

  const getCurrentLocation = () => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (error) => {
          console.warn('Geolocation error:', error);
          // Use mock location for demo
          setUserLocation({ lat: -1.2921, lng: 36.8219 }); // Nairobi coordinates
        }
      );
    } else {
      // Use mock location for demo
      setUserLocation({ lat: -1.2921, lng: 36.8219 });
    }
  };

  const startARSession = async (sceneId: string) => {
    if (!userLocation || !deviceCapabilities) {
      setError('Location and device capabilities required for AR session');
      return;
    }

    try {
      // Get AR scene recommendations
      const response = await fetch(`${supabase.supabaseUrl}/functions/v1/ar-scene-recommendation`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabase.supabaseKey}`
        },
        body: JSON.stringify({
          userId: 'current-user', // Replace with actual user ID
          currentLocation: userLocation,
          deviceCapabilities
        })
      });

      if (!response.ok) {
        throw new Error('Failed to start AR session');
      }

      const data = await response.json();
      setArSessionId(data.sessionId);
      setIsARActive(true);
      setSelectedScene(sceneId);

      // Mock AR session start
      console.log('AR Session started:', data);
      
    } catch (err) {
      console.error('Error starting AR session:', err);
      setError(err instanceof Error ? err.message : 'Failed to start AR session');
    }
  };

  const stopARSession = async () => {
    if (!arSessionId) return;

    try {
      // Update AR session
      const response = await fetch(`${supabase.supabaseUrl}/functions/v1/ar-interaction-tracking`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabase.supabaseKey}`
        },
        body: JSON.stringify({
          action: 'update_session',
          update: {
            sessionId: arSessionId,
            sessionEnd: new Date().toISOString(),
            userSatisfactionScore: 4, // Mock rating
            performanceMetrics: {
              fps: 30,
              memoryUsage: 150,
              batteryDrain: 5
            }
          }
        })
      });

      if (response.ok) {
        const data = await response.json();
        console.log('AR Session ended:', data);
      }

      setIsARActive(false);
      setArSessionId(null);
      setSelectedScene(null);
      
      // Refresh dashboard data
      loadDashboardData();

    } catch (err) {
      console.error('Error stopping AR session:', err);
    }
  };

  const trackARInteraction = async (interactionType: string, target?: string) => {
    if (!arSessionId || !selectedScene) return;

    try {
      await fetch(`${supabase.supabaseUrl}/functions/v1/ar-interaction-tracking`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabase.supabaseKey}`
        },
        body: JSON.stringify({
          action: 'track_interaction',
          event: {
            sessionId: arSessionId,
            sceneId: selectedScene,
            interactionType,
            interactionTarget: target,
            userPosition: userLocation,
            interactionSuccess: true
          }
        })
      });
    } catch (err) {
      console.error('Error tracking AR interaction:', err);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading AR Dashboard...</span>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">AR Dashboard</h1>
          <p className="text-muted-foreground">
            Augmented Reality content management and analytics
          </p>
        </div>
        <div className="flex items-center space-x-2">
          {deviceCapabilities && (
            <Badge variant="outline" className="px-3 py-1">
              <Smartphone className="h-3 w-3 mr-1" />
              {deviceCapabilities.arFramework}
            </Badge>
          )}
          {isARActive ? (
            <Button onClick={stopARSession} variant="destructive" size="sm">
              <XCircle className="h-4 w-4 mr-1" />
              Stop AR
            </Button>
          ) : (
            <Badge variant="secondary">AR Inactive</Badge>
          )}
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* AR Performance Overview */}
      {analytics && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total AR Sessions</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics.totalSessions}</div>
              <p className="text-xs text-muted-foreground">
                {analytics.uniqueUsers} unique users
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Session Duration</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {Math.round(analytics.averageSessionDuration / 60)}m
              </div>
              <p className="text-xs text-muted-foreground">
                {analytics.averageSessionDuration}s total
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Interactions</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics.totalInteractions}</div>
              <p className="text-xs text-muted-foreground">
                {analytics.interactionsPerSession.toFixed(1)} per session
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Most Popular Scene</CardTitle>
              <Eye className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-sm font-bold truncate">{analytics.mostPopularScene}</div>
              <p className="text-xs text-muted-foreground">
                {analytics.mostPopularSceneViews} views
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs defaultValue="scenes" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="scenes">AR Scenes</TabsTrigger>
          <TabsTrigger value="live">Live AR View</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="scenes" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Available AR Scenes</CardTitle>
              <CardDescription>
                Manage and launch AR experiences
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {arScenes.map((scene) => (
                  <Card key={scene.id} className="cursor-pointer hover:shadow-md transition-shadow">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">{scene.scene_name}</CardTitle>
                        <Badge variant={scene.is_public ? "default" : "secondary"}>
                          {scene.is_public ? "Public" : "Private"}
                        </Badge>
                      </div>
                      <CardDescription>{scene.scene_type}</CardDescription>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center text-sm text-muted-foreground">
                          {scene.target_location ? (
                            <>
                              <MapPin className="h-3 w-3 mr-1" />
                              Location-based
                            </>
                          ) : (
                            <>
                              <Camera className="h-3 w-3 mr-1" />
                              Marker-based
                            </>
                          )}
                        </div>
                        <Button
                          size="sm"
                          onClick={() => startARSession(scene.id)}
                          disabled={isARActive}
                        >
                          <Zap className="h-3 w-3 mr-1" />
                          Launch AR
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="live" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Live AR View</CardTitle>
              <CardDescription>
                {isARActive ? "AR session is active" : "Start an AR session to see live view"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div 
                ref={arViewRef}
                className="w-full h-96 bg-gray-100 rounded-lg flex items-center justify-center border-2 border-dashed border-gray-300"
              >
                {isARActive ? (
                  <div className="text-center space-y-4">
                    <div className="animate-pulse">
                      <Camera className="h-16 w-16 mx-auto text-blue-500" />
                    </div>
                    <div>
                      <p className="text-lg font-semibold">AR Session Active</p>
                      <p className="text-sm text-muted-foreground">
                        Scene: {arScenes.find(s => s.id === selectedScene)?.scene_name}
                      </p>
                    </div>
                    <div className="flex justify-center space-x-2">
                      <Button 
                        size="sm" 
                        onClick={() => trackARInteraction('tap', 'demo_button')}
                      >
                        Demo Interaction
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => trackARInteraction('navigation', 'wayfinding')}
                      >
                        Test Navigation
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center">
                    <Eye className="h-16 w-16 mx-auto text-gray-400 mb-4" />
                    <p className="text-lg font-semibold text-gray-600">No Active AR Session</p>
                    <p className="text-sm text-muted-foreground">
                      Launch an AR scene to see the live view
                    </p>
                  </div>
                )}
              </div>

              {deviceCapabilities && (
                <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                  <h4 className="font-semibold mb-2">Device Capabilities</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium">AR Framework:</span> {deviceCapabilities.arFramework}
                    </div>
                    <div>
                      <span className="font-medium">Performance Score:</span> {deviceCapabilities.performanceScore}/100
                    </div>
                    <div className="col-span-2">
                      <span className="font-medium">Supported Features:</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {deviceCapabilities.supportedFeatures.map((feature) => (
                          <Badge key={feature} variant="outline" className="text-xs">
                            {feature.replace('_', ' ')}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                  <Progress 
                    value={deviceCapabilities.performanceScore} 
                    className="mt-2"
                  />
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Recent AR Sessions</CardTitle>
                <CardDescription>Latest user AR experiences</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {recentSessions.map((session) => (
                    <div key={session.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">Session {session.id.slice(-8)}</p>
                        <p className="text-sm text-muted-foreground">
                          {session.interactions_count} interactions
                          {session.session_duration_seconds && (
                            <> • {Math.round(session.session_duration_seconds / 60)}m duration</>
                          )}
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        {session.user_satisfaction_score && (
                          <Badge variant="outline">
                            {session.user_satisfaction_score}/5 ⭐
                          </Badge>
                        )}
                        <Badge variant={session.session_end ? "default" : "secondary"}>
                          {session.session_end ? "Completed" : "Active"}
                        </Badge>
                      </div>
                    </div>
                  ))}
                  {recentSessions.length === 0 && (
                    <p className="text-center text-muted-foreground py-8">
                      No AR sessions recorded yet
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Performance Metrics</CardTitle>
                <CardDescription>AR system performance overview</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">System Health</span>
                    <Badge variant="default" className="bg-green-500">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Excellent
                    </Badge>
                  </div>

                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>AR Rendering Performance</span>
                      <span>85%</span>
                    </div>
                    <Progress value={85} className="h-2" />
                  </div>

                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>User Engagement Rate</span>
                      <span>73%</span>
                    </div>
                    <Progress value={73} className="h-2" />
                  </div>

                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Content Load Success Rate</span>
                      <span>96%</span>
                    </div>
                    <Progress value={96} className="h-2" />
                  </div>

                  <div className="pt-4 border-t">
                    <p className="text-sm text-muted-foreground">
                      Last updated: {new Date().toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>AR System Settings</CardTitle>
              <CardDescription>Configure AR experience parameters</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Default AR Quality</label>
                  <select className="w-full p-2 border rounded-md">
                    <option value="low">Low (Better Performance)</option>
                    <option value="medium" selected>Medium (Balanced)</option>
                    <option value="high">High (Better Quality)</option>
                    <option value="ultra">Ultra (Best Quality)</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Tracking Mode</label>
                  <select className="w-full p-2 border rounded-md">
                    <option value="marker">Marker-based</option>
                    <option value="markerless" selected>Markerless</option>
                    <option value="slam">SLAM</option>
                    <option value="hybrid">Hybrid</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-between py-2">
                <div>
                  <p className="font-medium">Enable Location-based AR</p>
                  <p className="text-sm text-muted-foreground">
                    Use GPS for location-aware AR experiences
                  </p>
                </div>
                <input type="checkbox" className="toggle" defaultChecked />
              </div>

              <div className="flex items-center justify-between py-2">
                <div>
                  <p className="font-medium">Analytics Collection</p>
                  <p className="text-sm text-muted-foreground">
                    Collect usage data for system optimization
                  </p>
                </div>
                <input type="checkbox" className="toggle" defaultChecked />
              </div>

              <div className="flex items-center justify-between py-2">
                <div>
                  <p className="font-medium">Offline Mode</p>
                  <p className="text-sm text-muted-foreground">
                    Cache AR content for offline use
                  </p>
                </div>
                <input type="checkbox" className="toggle" />
              </div>

              <div className="pt-4">
                <Button className="w-full">
                  <Settings className="h-4 w-4 mr-2" />
                  Save AR Settings
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ARDashboard;
