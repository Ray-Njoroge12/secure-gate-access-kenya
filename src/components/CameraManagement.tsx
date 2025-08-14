import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import { useToast } from '@/hooks/use-toast';
import { 
  Camera, 
  Eye, 
  EyeOff, 
  Play, 
  Pause, 
  Square, 
  RotateCw, 
  ZoomIn, 
  ZoomOut, 
  Download, 
  Upload, 
  Settings, 
  Monitor, 
  User, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  Wifi, 
  WifiOff, 
  Moon, 
  Sun, 
  Activity, 
  BarChart3, 
  Users, 
  FileImage, 
  Video, 
  HardDrive, 
  Cpu, 
  Gauge,
  MapPin,
  RefreshCw,
  Search,
  Filter,
  Calendar,
  Archive,
  Shield,
  Scan,
  Focus,
  Image as ImageIcon
} from 'lucide-react';

interface CameraDevice {
  id: string;
  camera_name: string;
  location: string;
  status: 'online' | 'offline' | 'recording' | 'maintenance' | 'error';
  is_recording: boolean;
  is_streaming: boolean;
  has_motion: boolean;
  health_score: number;
  firmware_version: string;
  last_capture_at: string;
  captures_today: number;
  storage_used_mb: number;
  configuration: {
    resolution: string;
    fps: number;
    night_vision: boolean;
    motion_detection: boolean;
    facial_recognition: boolean;
    recording_enabled: boolean;
    motion_sensitivity: number;
    retention_days: number;
  };
  capabilities: {
    zoom: boolean;
    pan_tilt: boolean;
    audio: boolean;
    infrared: boolean;
    weather_resistant: boolean;
  };
}

interface CameraCapture {
  id: string;
  camera_id: string;
  camera_name: string;
  capture_type: 'motion_triggered' | 'scheduled' | 'manual' | 'face_detected' | 'visitor_triggered';
  file_type: 'image' | 'video';
  file_size_mb: number;
  duration_seconds?: number;
  thumbnail_url?: string;
  created_at: string;
  metadata: {
    faces_detected?: number;
    motion_confidence?: number;
    visitor_id?: string;
    weather_conditions?: string;
  };
}

interface FacialRecognition {
  id: string;
  visitor_name: string;
  confidence: number;
  first_seen: string;
  last_seen: string;
  total_detections: number;
  is_authorized: boolean;
  profile_image_url?: string;
}

const CameraManagement: React.FC = () => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('live');
  const [cameras, setCameras] = useState<CameraDevice[]>([]);
  const [selectedCamera, setSelectedCamera] = useState<CameraDevice | null>(null);
  const [recentCaptures, setRecentCaptures] = useState<CameraCapture[]>([]);
  const [recognizedFaces, setRecognizedFaces] = useState<FacialRecognition[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [streamUrl, setStreamUrl] = useState<string>('');

  useEffect(() => {
    loadCameraData();
    
    // Set up real-time refresh
    const interval = setInterval(loadCameraData, 5000);
    
    return () => clearInterval(interval);
  }, []);

  const loadCameraData = async () => {
    try {
      // Simulate camera device data
      const mockCameras: CameraDevice[] = [
        {
          id: 'cam-1',
          camera_name: 'Main Gate Camera',
          location: 'Main entrance view',
          status: 'recording',
          is_recording: true,
          is_streaming: true,
          has_motion: false,
          health_score: 95,
          firmware_version: '1.8.3',
          last_capture_at: new Date(Date.now() - 120000).toISOString(),
          captures_today: 142,
          storage_used_mb: 2048,
          configuration: {
            resolution: '1080p',
            fps: 30,
            night_vision: true,
            motion_detection: true,
            facial_recognition: true,
            recording_enabled: true,
            motion_sensitivity: 75,
            retention_days: 30
          },
          capabilities: {
            zoom: true,
            pan_tilt: true,
            audio: true,
            infrared: true,
            weather_resistant: true
          }
        },
        {
          id: 'cam-2',
          camera_name: 'Parking Area Camera',
          location: 'Visitor parking overview',
          status: 'online',
          is_recording: false,
          is_streaming: true,
          has_motion: true,
          health_score: 88,
          firmware_version: '1.7.9',
          last_capture_at: new Date(Date.now() - 300000).toISOString(),
          captures_today: 89,
          storage_used_mb: 1536,
          configuration: {
            resolution: '720p',
            fps: 25,
            night_vision: true,
            motion_detection: true,
            facial_recognition: false,
            recording_enabled: false,
            motion_sensitivity: 60,
            retention_days: 14
          },
          capabilities: {
            zoom: false,
            pan_tilt: false,
            audio: false,
            infrared: true,
            weather_resistant: true
          }
        },
        {
          id: 'cam-3',
          camera_name: 'Guard Booth Interior',
          location: 'Security office monitoring',
          status: 'online',
          is_recording: true,
          is_streaming: false,
          has_motion: false,
          health_score: 92,
          firmware_version: '1.8.1',
          last_capture_at: new Date(Date.now() - 600000).toISOString(),
          captures_today: 34,
          storage_used_mb: 512,
          configuration: {
            resolution: '1080p',
            fps: 15,
            night_vision: false,
            motion_detection: true,
            facial_recognition: true,
            recording_enabled: true,
            motion_sensitivity: 50,
            retention_days: 7
          },
          capabilities: {
            zoom: false,
            pan_tilt: false,
            audio: true,
            infrared: false,
            weather_resistant: false
          }
        },
        {
          id: 'cam-4',
          camera_name: 'Perimeter Camera East',
          location: 'Eastern boundary fence',
          status: 'maintenance',
          is_recording: false,
          is_streaming: false,
          has_motion: false,
          health_score: 45,
          firmware_version: '1.6.2',
          last_capture_at: new Date(Date.now() - 7200000).toISOString(),
          captures_today: 0,
          storage_used_mb: 0,
          configuration: {
            resolution: '720p',
            fps: 20,
            night_vision: true,
            motion_detection: true,
            facial_recognition: false,
            recording_enabled: false,
            motion_sensitivity: 80,
            retention_days: 21
          },
          capabilities: {
            zoom: true,
            pan_tilt: true,
            audio: false,
            infrared: true,
            weather_resistant: true
          }
        }
      ];

      setCameras(mockCameras);
      
      if (!selectedCamera) {
        setSelectedCamera(mockCameras[0]);
      }

      // Mock recent captures
      setRecentCaptures([
        {
          id: '1',
          camera_id: 'cam-1',
          camera_name: 'Main Gate Camera',
          capture_type: 'visitor_triggered',
          file_type: 'image',
          file_size_mb: 2.4,
          created_at: new Date(Date.now() - 120000).toISOString(),
          metadata: {
            faces_detected: 1,
            visitor_id: 'visitor-123',
            motion_confidence: 95
          }
        },
        {
          id: '2',
          camera_id: 'cam-2',
          camera_name: 'Parking Area Camera',
          capture_type: 'motion_triggered',
          file_type: 'video',
          file_size_mb: 15.7,
          duration_seconds: 45,
          created_at: new Date(Date.now() - 300000).toISOString(),
          metadata: {
            motion_confidence: 88,
            weather_conditions: 'clear'
          }
        },
        {
          id: '3',
          camera_id: 'cam-1',
          camera_name: 'Main Gate Camera',
          capture_type: 'face_detected',
          file_type: 'image',
          file_size_mb: 1.9,
          created_at: new Date(Date.now() - 450000).toISOString(),
          metadata: {
            faces_detected: 2,
            motion_confidence: 92
          }
        },
        {
          id: '4',
          camera_id: 'cam-3',
          camera_name: 'Guard Booth Interior',
          capture_type: 'scheduled',
          file_type: 'image',
          file_size_mb: 1.2,
          created_at: new Date(Date.now() - 600000).toISOString(),
          metadata: {}
        }
      ]);

      // Mock facial recognition data
      setRecognizedFaces([
        {
          id: '1',
          visitor_name: 'John Doe',
          confidence: 98.5,
          first_seen: new Date(Date.now() - 86400000).toISOString(),
          last_seen: new Date(Date.now() - 120000).toISOString(),
          total_detections: 5,
          is_authorized: true
        },
        {
          id: '2',
          visitor_name: 'Jane Smith',
          confidence: 94.2,
          first_seen: new Date(Date.now() - 172800000).toISOString(),
          last_seen: new Date(Date.now() - 300000).toISOString(),
          total_detections: 12,
          is_authorized: true
        },
        {
          id: '3',
          visitor_name: 'Unknown Person #1',
          confidence: 87.3,
          first_seen: new Date(Date.now() - 450000).toISOString(),
          last_seen: new Date(Date.now() - 450000).toISOString(),
          total_detections: 1,
          is_authorized: false
        }
      ]);

    } catch (error) {
      console.error('Error loading camera data:', error);
      toast({
        title: "Error",
        description: "Failed to load camera system data",
        variant: "destructive",
      });
    }
  };

  const controlCamera = async (action: string, value?: any) => {
    if (!selectedCamera) return;
    
    setIsLoading(true);
    try {
      // In a real implementation, this would call camera control APIs
      
      switch (action) {
        case 'start_recording':
          setSelectedCamera(prev => prev ? { ...prev, is_recording: true, status: 'recording' } : null);
          break;
        case 'stop_recording':
          setSelectedCamera(prev => prev ? { ...prev, is_recording: false, status: 'online' } : null);
          break;
        case 'start_streaming':
          setSelectedCamera(prev => prev ? { ...prev, is_streaming: true } : null);
          setStreamUrl('rtmp://camera-stream-url/live');
          break;
        case 'stop_streaming':
          setSelectedCamera(prev => prev ? { ...prev, is_streaming: false } : null);
          setStreamUrl('');
          break;
        case 'capture_photo':
          const newCapture: CameraCapture = {
            id: Date.now().toString(),
            camera_id: selectedCamera.id,
            camera_name: selectedCamera.camera_name,
            capture_type: 'manual',
            file_type: 'image',
            file_size_mb: 2.1,
            created_at: new Date().toISOString(),
            metadata: {}
          };
          setRecentCaptures(prev => [newCapture, ...prev.slice(0, 9)]);
          setSelectedCamera(prev => prev ? { 
            ...prev, 
            captures_today: prev.captures_today + 1,
            last_capture_at: new Date().toISOString()
          } : null);
          break;
      }

      toast({
        title: "Camera Control",
        description: `${action.replace('_', ' ')} executed successfully`,
      });
    } catch (error) {
      toast({
        title: "Control Failed",
        description: "Failed to execute camera command",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const updateConfiguration = async (config: Partial<CameraDevice['configuration']>) => {
    if (!selectedCamera) return;
    
    setSelectedCamera(prev => prev ? {
      ...prev,
      configuration: { ...prev.configuration, ...config }
    } : null);

    toast({
      title: "Configuration Updated",
      description: "Camera settings have been saved",
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'online': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'recording': return <Video className="h-4 w-4 text-red-500" />;
      case 'offline': return <WifiOff className="h-4 w-4 text-red-500" />;
      case 'maintenance': return <Settings className="h-4 w-4 text-yellow-500" />;
      case 'error': return <AlertTriangle className="h-4 w-4 text-red-500" />;
      default: return <Camera className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'text-green-600';
      case 'recording': return 'text-red-600';
      case 'offline': return 'text-red-600';
      case 'maintenance': return 'text-yellow-600';
      case 'error': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getHealthColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 70) return 'text-yellow-600';
    if (score >= 50) return 'text-orange-600';
    return 'text-red-600';
  };

  const getCaptureTypeIcon = (type: string) => {
    switch (type) {
      case 'motion_triggered': return <Activity className="h-4 w-4" />;
      case 'face_detected': return <User className="h-4 w-4" />;
      case 'visitor_triggered': return <Users className="h-4 w-4" />;
      case 'scheduled': return <Clock className="h-4 w-4" />;
      case 'manual': return <Camera className="h-4 w-4" />;
      default: return <ImageIcon className="h-4 w-4" />;
    }
  };

  const filteredCaptures = recentCaptures.filter(capture => {
    const matchesSearch = capture.camera_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         capture.capture_type.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filterType === 'all' || capture.file_type === filterType;
    return matchesSearch && matchesFilter;
  });

  const totalCameras = cameras.length;
  const onlineCameras = cameras.filter(c => c.status === 'online' || c.status === 'recording').length;
  const recordingCameras = cameras.filter(c => c.is_recording).length;
  const totalCapturestoday = cameras.reduce((sum, c) => sum + c.captures_today, 0);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Camera Management System</h1>
          <p className="text-muted-foreground">
            Monitor and control security camera network
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="text-sm">
            Phase 9 - Smart Infrastructure
          </Badge>
          <Button variant="outline" size="sm" onClick={loadCameraData} disabled={isLoading}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* System Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Online Cameras</CardTitle>
            <Camera className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{onlineCameras}</div>
            <p className="text-xs text-muted-foreground">
              of {totalCameras} total cameras
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Recording</CardTitle>
            <Video className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{recordingCameras}</div>
            <p className="text-xs text-muted-foreground">
              actively recording
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Captures Today</CardTitle>
            <FileImage className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalCapturestoday}</div>
            <p className="text-xs text-muted-foreground">
              images and videos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Face Detections</CardTitle>
            <Scan className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{recognizedFaces.length}</div>
            <p className="text-xs text-muted-foreground">
              unique individuals
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Camera Selector */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Camera Selection
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {cameras.map((camera) => (
              <div
                key={camera.id}
                className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                  selectedCamera?.id === camera.id 
                    ? 'border-primary bg-primary/5' 
                    : 'hover:border-primary/50'
                }`}
                onClick={() => setSelectedCamera(camera)}
              >
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-medium">{camera.camera_name}</h3>
                  {getStatusIcon(camera.status)}
                </div>
                <p className="text-sm text-muted-foreground mb-2">{camera.location}</p>
                <div className="flex items-center justify-between text-sm">
                  <span>Health: <span className={getHealthColor(camera.health_score)}>
                    {camera.health_score}%
                  </span></span>
                  <div className="flex gap-1">
                    {camera.is_recording && <Badge variant="destructive" className="text-xs">REC</Badge>}
                    {camera.is_streaming && <Badge variant="default" className="text-xs">LIVE</Badge>}
                    {camera.has_motion && <Badge variant="secondary" className="text-xs">MOTION</Badge>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {selectedCamera && (
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="live" className="flex items-center gap-2">
              <Eye className="h-4 w-4" />
              Live View
            </TabsTrigger>
            <TabsTrigger value="captures" className="flex items-center gap-2">
              <FileImage className="h-4 w-4" />
              Captures
            </TabsTrigger>
            <TabsTrigger value="recognition" className="flex items-center gap-2">
              <Scan className="h-4 w-4" />
              Recognition
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Analytics
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Settings
            </TabsTrigger>
          </TabsList>

          <TabsContent value="live" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Live Video Feed */}
              <div className="lg:col-span-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span>Live Video Feed</span>
                      <div className="flex items-center gap-2">
                        <Badge variant={selectedCamera.is_streaming ? 'default' : 'secondary'}>
                          {selectedCamera.is_streaming ? 'LIVE' : 'OFFLINE'}
                        </Badge>
                        {selectedCamera.is_recording && (
                          <Badge variant="destructive">REC</Badge>
                        )}
                      </div>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="aspect-video bg-gray-900 rounded-lg flex items-center justify-center mb-4">
                      {selectedCamera.is_streaming ? (
                        <div className="text-center text-white">
                          <Camera className="h-16 w-16 mx-auto mb-4" />
                          <p className="text-lg font-medium">{selectedCamera.camera_name}</p>
                          <p className="text-sm opacity-75">{selectedCamera.configuration.resolution} @ {selectedCamera.configuration.fps}fps</p>
                          <div className="mt-4 flex items-center justify-center gap-2">
                            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                            <span className="text-sm">LIVE STREAM</span>
                          </div>
                        </div>
                      ) : (
                        <div className="text-center text-gray-400">
                          <EyeOff className="h-16 w-16 mx-auto mb-4" />
                          <p className="text-lg">Camera Offline</p>
                          <p className="text-sm">No video feed available</p>
                        </div>
                      )}
                    </div>
                    
                    {/* Camera Controls */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Button
                          variant={selectedCamera.is_streaming ? 'destructive' : 'default'}
                          size="sm"
                          onClick={() => controlCamera(selectedCamera.is_streaming ? 'stop_streaming' : 'start_streaming')}
                          disabled={isLoading || selectedCamera.status === 'offline'}
                        >
                          {selectedCamera.is_streaming ? <EyeOff className="h-4 w-4 mr-2" /> : <Eye className="h-4 w-4 mr-2" />}
                          {selectedCamera.is_streaming ? 'Stop Stream' : 'Start Stream'}
                        </Button>
                        
                        <Button
                          variant={selectedCamera.is_recording ? 'destructive' : 'outline'}
                          size="sm"
                          onClick={() => controlCamera(selectedCamera.is_recording ? 'stop_recording' : 'start_recording')}
                          disabled={isLoading || selectedCamera.status === 'offline'}
                        >
                          {selectedCamera.is_recording ? <Square className="h-4 w-4 mr-2" /> : <Video className="h-4 w-4 mr-2" />}
                          {selectedCamera.is_recording ? 'Stop Recording' : 'Start Recording'}
                        </Button>
                        
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => controlCamera('capture_photo')}
                          disabled={isLoading || selectedCamera.status === 'offline'}
                        >
                          <Camera className="h-4 w-4 mr-2" />
                          Capture
                        </Button>
                      </div>
                      
                      {selectedCamera.capabilities.pan_tilt && (
                        <div className="flex items-center gap-2">
                          <Button variant="outline" size="sm" disabled={isLoading}>
                            <ZoomOut className="h-4 w-4" />
                          </Button>
                          <Button variant="outline" size="sm" disabled={isLoading}>
                            <ZoomIn className="h-4 w-4" />
                          </Button>
                          <Button variant="outline" size="sm" disabled={isLoading}>
                            <RotateCw className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Camera Status */}
              <div className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Camera Status</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Status</span>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(selectedCamera.status)}
                        <span className={`text-sm font-medium ${getStatusColor(selectedCamera.status)}`}>
                          {selectedCamera.status.toUpperCase()}
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Health Score</span>
                      <span className={`text-sm font-medium ${getHealthColor(selectedCamera.health_score)}`}>
                        {selectedCamera.health_score}%
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Firmware</span>
                      <span className="text-sm font-medium">{selectedCamera.firmware_version}</span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Captures Today</span>
                      <span className="text-sm font-medium">{selectedCamera.captures_today}</span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Storage Used</span>
                      <span className="text-sm font-medium">{(selectedCamera.storage_used_mb / 1024).toFixed(1)} GB</span>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Capabilities</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {Object.entries(selectedCamera.capabilities).map(([key, value]) => (
                        <div key={key} className="flex items-center justify-between">
                          <span className="text-sm capitalize">{key.replace('_', ' ')}</span>
                          <Badge variant={value ? 'default' : 'secondary'} className="text-xs">
                            {value ? 'Yes' : 'No'}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="captures" className="space-y-6">
            {/* Search and Filter */}
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search captures..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="image">Images</SelectItem>
                  <SelectItem value="video">Videos</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Captures Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredCaptures.map((capture) => (
                <Card key={capture.id}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {getCaptureTypeIcon(capture.capture_type)}
                        <span className="text-sm font-medium capitalize">
                          {capture.capture_type.replace('_', ' ')}
                        </span>
                      </div>
                      <Badge variant={capture.file_type === 'video' ? 'default' : 'secondary'}>
                        {capture.file_type.toUpperCase()}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {/* Thumbnail placeholder */}
                    <div className="aspect-video bg-gray-100 rounded-lg flex items-center justify-center">
                      {capture.file_type === 'video' ? (
                        <Video className="h-8 w-8 text-gray-400" />
                      ) : (
                        <ImageIcon className="h-8 w-8 text-gray-400" />
                      )}
                    </div>
                    
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Camera:</span>
                        <span className="font-medium">{capture.camera_name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Size:</span>
                        <span>{capture.file_size_mb.toFixed(1)} MB</span>
                      </div>
                      {capture.duration_seconds && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Duration:</span>
                          <span>{capture.duration_seconds}s</span>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Created:</span>
                        <span>{new Date(capture.created_at).toLocaleTimeString()}</span>
                      </div>
                    </div>
                    
                    {/* Metadata */}
                    {Object.keys(capture.metadata).length > 0 && (
                      <div className="pt-2 border-t">
                        <div className="space-y-1">
                          {capture.metadata.faces_detected && (
                            <div className="flex items-center gap-2 text-xs">
                              <User className="h-3 w-3" />
                              <span>{capture.metadata.faces_detected} faces detected</span>
                            </div>
                          )}
                          {capture.metadata.motion_confidence && (
                            <div className="flex items-center gap-2 text-xs">
                              <Activity className="h-3 w-3" />
                              <span>{capture.metadata.motion_confidence}% motion confidence</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                    
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" className="flex-1">
                        <Eye className="h-4 w-4 mr-2" />
                        View
                      </Button>
                      <Button variant="outline" size="sm">
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="recognition" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Scan className="h-5 w-5" />
                  Facial Recognition Results
                </CardTitle>
                <CardDescription>
                  Identified individuals and recognition statistics
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recognizedFaces.map((face) => (
                    <div key={face.id} className="flex items-center space-x-4 p-4 border rounded-lg">
                      <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                        <User className="h-6 w-6 text-gray-400" />
                      </div>
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center justify-between">
                          <h3 className="font-medium">{face.visitor_name}</h3>
                          <div className="flex items-center gap-2">
                            <Badge variant={face.is_authorized ? 'default' : 'destructive'}>
                              {face.is_authorized ? 'Authorized' : 'Unknown'}
                            </Badge>
                            <span className="text-sm text-muted-foreground">
                              {face.confidence.toFixed(1)}% confidence
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span>First seen: {new Date(face.first_seen).toLocaleDateString()}</span>
                          <span>Last seen: {new Date(face.last_seen).toLocaleString()}</span>
                          <span>Detections: {face.total_detections}</span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        {!face.is_authorized && (
                          <Button variant="outline" size="sm">
                            <Shield className="h-4 w-4 mr-2" />
                            Authorize
                          </Button>
                        )}
                        <Button variant="outline" size="sm">
                          <Eye className="h-4 w-4 mr-2" />
                          View History
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Detection Activity</CardTitle>
                  <CardDescription>Motion and facial detection trends</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[200px] flex items-center justify-center text-muted-foreground">
                    <div className="text-center">
                      <BarChart3 className="h-8 w-8 mx-auto mb-2" />
                      <p>Analytics chart visualization</p>
                      <p className="text-xs">Chart integration needed</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Storage Usage</CardTitle>
                  <CardDescription>Camera storage consumption</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {cameras.map((camera) => (
                    <div key={camera.id} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">{camera.camera_name}</span>
                        <span className="text-sm font-medium">
                          {(camera.storage_used_mb / 1024).toFixed(1)} GB
                        </span>
                      </div>
                      <Progress value={(camera.storage_used_mb / 5120) * 100} className="h-2" />
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>System Performance</CardTitle>
                <CardDescription>Camera network performance metrics</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-4 border rounded-lg">
                    <Camera className="h-6 w-6 mx-auto mb-2 text-blue-500" />
                    <div className="text-lg font-bold">{onlineCameras}/{totalCameras}</div>
                    <div className="text-sm text-muted-foreground">Cameras Online</div>
                  </div>
                  <div className="text-center p-4 border rounded-lg">
                    <Video className="h-6 w-6 mx-auto mb-2 text-red-500" />
                    <div className="text-lg font-bold">{recordingCameras}</div>
                    <div className="text-sm text-muted-foreground">Recording</div>
                  </div>
                  <div className="text-center p-4 border rounded-lg">
                    <FileImage className="h-6 w-6 mx-auto mb-2 text-green-500" />
                    <div className="text-lg font-bold">{totalCapturestoday}</div>
                    <div className="text-sm text-muted-foreground">Captures Today</div>
                  </div>
                  <div className="text-center p-4 border rounded-lg">
                    <HardDrive className="h-6 w-6 mx-auto mb-2 text-purple-500" />
                    <div className="text-lg font-bold">
                      {(cameras.reduce((sum, c) => sum + c.storage_used_mb, 0) / 1024).toFixed(1)} GB
                    </div>
                    <div className="text-sm text-muted-foreground">Total Storage</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Camera Configuration</CardTitle>
                <CardDescription>
                  Adjust camera settings and recording parameters
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="resolution">Video Resolution</Label>
                      <Select 
                        value={selectedCamera.configuration.resolution}
                        onValueChange={(value) => updateConfiguration({ resolution: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="4K">4K (3840x2160)</SelectItem>
                          <SelectItem value="1080p">1080p (1920x1080)</SelectItem>
                          <SelectItem value="720p">720p (1280x720)</SelectItem>
                          <SelectItem value="480p">480p (854x480)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="fps">Frame Rate (FPS)</Label>
                      <Select 
                        value={selectedCamera.configuration.fps.toString()}
                        onValueChange={(value) => updateConfiguration({ fps: parseInt(value) })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="60">60 FPS</SelectItem>
                          <SelectItem value="30">30 FPS</SelectItem>
                          <SelectItem value="25">25 FPS</SelectItem>
                          <SelectItem value="15">15 FPS</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="retention">Retention Period (Days)</Label>
                      <Input
                        id="retention"
                        type="number"
                        value={selectedCamera.configuration.retention_days}
                        onChange={(e) => updateConfiguration({ retention_days: parseInt(e.target.value) })}
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="recording">Recording Enabled</Label>
                        <Switch
                          id="recording"
                          checked={selectedCamera.configuration.recording_enabled}
                          onCheckedChange={(checked) => updateConfiguration({ recording_enabled: checked })}
                        />
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <Label htmlFor="night-vision">Night Vision</Label>
                        <Switch
                          id="night-vision"
                          checked={selectedCamera.configuration.night_vision}
                          onCheckedChange={(checked) => updateConfiguration({ night_vision: checked })}
                        />
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <Label htmlFor="motion-detection">Motion Detection</Label>
                        <Switch
                          id="motion-detection"
                          checked={selectedCamera.configuration.motion_detection}
                          onCheckedChange={(checked) => updateConfiguration({ motion_detection: checked })}
                        />
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <Label htmlFor="facial-recognition">Facial Recognition</Label>
                        <Switch
                          id="facial-recognition"
                          checked={selectedCamera.configuration.facial_recognition}
                          onCheckedChange={(checked) => updateConfiguration({ facial_recognition: checked })}
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="motion-sensitivity">
                        Motion Sensitivity: {selectedCamera.configuration.motion_sensitivity}%
                      </Label>
                      <Slider
                        id="motion-sensitivity"
                        min={0}
                        max={100}
                        step={5}
                        value={[selectedCamera.configuration.motion_sensitivity]}
                        onValueChange={(value) => updateConfiguration({ motion_sensitivity: value[0] })}
                      />
                    </div>
                  </div>
                </div>
                
                <div className="flex gap-4">
                  <Button disabled={isLoading}>
                    <Settings className="h-4 w-4 mr-2" />
                    Save Configuration
                  </Button>
                  <Button variant="outline" disabled={isLoading}>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Reset to Defaults
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
};

export default CameraManagement;
