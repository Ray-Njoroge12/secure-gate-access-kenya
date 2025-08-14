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
import { Slider } from '@/components/ui/slider';
import { useToast } from '@/hooks/use-toast';
import { 
  Thermometer, 
  Droplets, 
  Wind, 
  Sun, 
  Cloud, 
  CloudRain, 
  Eye, 
  Volume2, 
  VolumeX, 
  Activity, 
  AlertTriangle, 
  CheckCircle, 
  Settings, 
  Bell, 
  BellOff, 
  Gauge, 
  TrendingUp, 
  TrendingDown, 
  Minus, 
  MapPin, 
  Clock, 
  Calendar, 
  BarChart3, 
  LineChart, 
  Zap, 
  Lightbulb, 
  Wind as AirIcon,
  Waves,
  ShieldAlert,
  RadioIcon,
  Wifi,
  WifiOff,
  RefreshCw,
  Download,
  Filter,
  Search,
  Archive,
  Target,
  Cpu,
  HardDrive
} from 'lucide-react';

interface EnvironmentalSensor {
  id: string;
  sensor_name: string;
  location: string;
  sensor_type: 'multi_environmental' | 'temperature' | 'humidity' | 'air_quality' | 'noise' | 'light' | 'motion';
  status: 'online' | 'offline' | 'maintenance' | 'error' | 'calibrating';
  health_score: number;
  battery_level?: number;
  firmware_version: string;
  last_reading_at: string;
  readings_today: number;
  is_critical: boolean;
  alert_thresholds: {
    temperature_min: number;
    temperature_max: number;
    humidity_min: number;
    humidity_max: number;
    air_quality_max: number;
    noise_max: number;
    light_min: number;
    light_max: number;
  };
}

interface EnvironmentalReading {
  id: string;
  sensor_id: string;
  sensor_name: string;
  reading_type: 'temperature' | 'humidity' | 'air_quality' | 'noise_level' | 'light_level' | 'motion_detected' | 'atmospheric_pressure';
  value: number;
  unit: string;
  is_alert: boolean;
  alert_level: 'normal' | 'warning' | 'critical';
  timestamp: string;
  location: string;
}

interface WeatherCondition {
  temperature: number;
  humidity: number;
  atmospheric_pressure: number;
  wind_speed: number;
  wind_direction: string;
  weather_condition: 'clear' | 'cloudy' | 'rain' | 'storm' | 'fog';
  visibility: number;
  uv_index: number;
  timestamp: string;
}

interface AlertConfiguration {
  id: string;
  sensor_id: string;
  reading_type: string;
  condition: 'above' | 'below' | 'equals';
  threshold_value: number;
  alert_level: 'warning' | 'critical';
  notification_enabled: boolean;
  email_enabled: boolean;
  sms_enabled: boolean;
  auto_response?: string;
}

const EnvironmentalMonitoring: React.FC = () => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [sensors, setSensors] = useState<EnvironmentalSensor[]>([]);
  const [recentReadings, setRecentReadings] = useState<EnvironmentalReading[]>([]);
  const [weatherData, setWeatherData] = useState<WeatherCondition | null>(null);
  const [alertConfigs, setAlertConfigs] = useState<AlertConfiguration[]>([]);
  const [selectedSensor, setSelectedSensor] = useState<EnvironmentalSensor | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [timeRange, setTimeRange] = useState('24h');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadEnvironmentalData();
    
    // Set up real-time refresh
    const interval = setInterval(loadEnvironmentalData, 10000); // Update every 10 seconds
    
    return () => clearInterval(interval);
  }, []);

  const loadEnvironmentalData = async () => {
    try {
      // Mock environmental sensor data
      const mockSensors: EnvironmentalSensor[] = [
        {
          id: 'env-1',
          sensor_name: 'Main Gate Environmental',
          location: 'Main entrance checkpoint',
          sensor_type: 'multi_environmental',
          status: 'online',
          health_score: 95,
          battery_level: 87,
          firmware_version: '2.1.4',
          last_reading_at: new Date(Date.now() - 30000).toISOString(),
          readings_today: 1440, // Every minute
          is_critical: true,
          alert_thresholds: {
            temperature_min: 10,
            temperature_max: 40,
            humidity_min: 20,
            humidity_max: 80,
            air_quality_max: 150,
            noise_max: 70,
            light_min: 50,
            light_max: 2000
          }
        },
        {
          id: 'env-2',
          sensor_name: 'Guard Booth Climate',
          location: 'Security office interior',
          sensor_type: 'multi_environmental',
          status: 'online',
          health_score: 92,
          firmware_version: '2.0.8',
          last_reading_at: new Date(Date.now() - 60000).toISOString(),
          readings_today: 1436,
          is_critical: false,
          alert_thresholds: {
            temperature_min: 18,
            temperature_max: 26,
            humidity_min: 40,
            humidity_max: 60,
            air_quality_max: 100,
            noise_max: 50,
            light_min: 300,
            light_max: 1000
          }
        },
        {
          id: 'env-3',
          sensor_name: 'Parking Area Monitor',
          location: 'Visitor parking area',
          sensor_type: 'multi_environmental',
          status: 'online',
          health_score: 89,
          battery_level: 65,
          firmware_version: '2.1.2',
          last_reading_at: new Date(Date.now() - 45000).toISOString(),
          readings_today: 1438,
          is_critical: false,
          alert_thresholds: {
            temperature_min: 5,
            temperature_max: 45,
            humidity_min: 10,
            humidity_max: 90,
            air_quality_max: 200,
            noise_max: 80,
            light_min: 10,
            light_max: 3000
          }
        },
        {
          id: 'env-4',
          sensor_name: 'Perimeter Noise Monitor',
          location: 'Eastern boundary fence',
          sensor_type: 'noise',
          status: 'maintenance',
          health_score: 45,
          battery_level: 23,
          firmware_version: '1.9.1',
          last_reading_at: new Date(Date.now() - 3600000).toISOString(),
          readings_today: 720,
          is_critical: false,
          alert_thresholds: {
            temperature_min: 0,
            temperature_max: 50,
            humidity_min: 0,
            humidity_max: 100,
            air_quality_max: 300,
            noise_max: 85,
            light_min: 0,
            light_max: 5000
          }
        }
      ];

      setSensors(mockSensors);
      
      if (!selectedSensor) {
        setSelectedSensor(mockSensors[0]);
      }

      // Mock recent readings
      const now = new Date();
      const mockReadings: EnvironmentalReading[] = [
        {
          id: '1',
          sensor_id: 'env-1',
          sensor_name: 'Main Gate Environmental',
          reading_type: 'temperature',
          value: 28.5,
          unit: '°C',
          is_alert: false,
          alert_level: 'normal',
          timestamp: new Date(now.getTime() - 30000).toISOString(),
          location: 'Main entrance checkpoint'
        },
        {
          id: '2',
          sensor_id: 'env-1',
          sensor_name: 'Main Gate Environmental',
          reading_type: 'humidity',
          value: 65,
          unit: '%',
          is_alert: false,
          alert_level: 'normal',
          timestamp: new Date(now.getTime() - 30000).toISOString(),
          location: 'Main entrance checkpoint'
        },
        {
          id: '3',
          sensor_id: 'env-1',
          sensor_name: 'Main Gate Environmental',
          reading_type: 'air_quality',
          value: 45,
          unit: 'AQI',
          is_alert: false,
          alert_level: 'normal',
          timestamp: new Date(now.getTime() - 30000).toISOString(),
          location: 'Main entrance checkpoint'
        },
        {
          id: '4',
          sensor_id: 'env-1',
          sensor_name: 'Main Gate Environmental',
          reading_type: 'noise_level',
          value: 52,
          unit: 'dB',
          is_alert: false,
          alert_level: 'normal',
          timestamp: new Date(now.getTime() - 30000).toISOString(),
          location: 'Main entrance checkpoint'
        },
        {
          id: '5',
          sensor_id: 'env-2',
          sensor_name: 'Guard Booth Climate',
          reading_type: 'temperature',
          value: 24.2,
          unit: '°C',
          is_alert: false,
          alert_level: 'normal',
          timestamp: new Date(now.getTime() - 60000).toISOString(),
          location: 'Security office interior'
        },
        {
          id: '6',
          sensor_id: 'env-3',
          sensor_name: 'Parking Area Monitor',
          reading_type: 'noise_level',
          value: 78,
          unit: 'dB',
          is_alert: true,
          alert_level: 'warning',
          timestamp: new Date(now.getTime() - 45000).toISOString(),
          location: 'Visitor parking area'
        }
      ];

      setRecentReadings(mockReadings);

      // Mock weather data
      setWeatherData({
        temperature: 29.1,
        humidity: 68,
        atmospheric_pressure: 1013.2,
        wind_speed: 12.5,
        wind_direction: 'NE',
        weather_condition: 'cloudy',
        visibility: 8.5,
        uv_index: 6,
        timestamp: new Date().toISOString()
      });

      // Mock alert configurations
      setAlertConfigs([
        {
          id: '1',
          sensor_id: 'env-1',
          reading_type: 'temperature',
          condition: 'above',
          threshold_value: 35,
          alert_level: 'warning',
          notification_enabled: true,
          email_enabled: true,
          sms_enabled: false
        },
        {
          id: '2',
          sensor_id: 'env-1',
          reading_type: 'air_quality',
          condition: 'above',
          threshold_value: 100,
          alert_level: 'critical',
          notification_enabled: true,
          email_enabled: true,
          sms_enabled: true,
          auto_response: 'Increase ventilation'
        }
      ]);

    } catch (error) {
      console.error('Error loading environmental data:', error);
      toast({
        title: "Error",
        description: "Failed to load environmental monitoring data",
        variant: "destructive",
      });
    }
  };

  const getReadingIcon = (type: string) => {
    switch (type) {
      case 'temperature': return <Thermometer className="h-5 w-5" />;
      case 'humidity': return <Droplets className="h-5 w-5" />;
      case 'air_quality': return <Wind className="h-5 w-5" />;
      case 'noise_level': return <Volume2 className="h-5 w-5" />;
      case 'light_level': return <Lightbulb className="h-5 w-5" />;
      case 'atmospheric_pressure': return <Gauge className="h-5 w-5" />;
      case 'motion_detected': return <Activity className="h-5 w-5" />;
      default: return <Target className="h-5 w-5" />;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'online': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'offline': return <WifiOff className="h-4 w-4 text-red-500" />;
      case 'maintenance': return <Settings className="h-4 w-4 text-yellow-500" />;
      case 'error': return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'calibrating': return <RefreshCw className="h-4 w-4 text-blue-500" />;
      default: return <Wifi className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'text-green-600';
      case 'offline': return 'text-red-600';
      case 'maintenance': return 'text-yellow-600';
      case 'error': return 'text-red-600';
      case 'calibrating': return 'text-blue-600';
      default: return 'text-gray-600';
    }
  };

  const getAlertColor = (level: string) => {
    switch (level) {
      case 'critical': return 'text-red-600 bg-red-50 border-red-200';
      case 'warning': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'normal': return 'text-green-600 bg-green-50 border-green-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getHealthColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 70) return 'text-yellow-600';
    if (score >= 50) return 'text-orange-600';
    return 'text-red-600';
  };

  const getWeatherIcon = (condition: string) => {
    switch (condition) {
      case 'clear': return <Sun className="h-6 w-6 text-yellow-500" />;
      case 'cloudy': return <Cloud className="h-6 w-6 text-gray-500" />;
      case 'rain': return <CloudRain className="h-6 w-6 text-blue-500" />;
      case 'storm': return <CloudRain className="h-6 w-6 text-purple-500" />;
      case 'fog': return <Cloud className="h-6 w-6 text-gray-400" />;
      default: return <Sun className="h-6 w-6 text-yellow-500" />;
    }
  };

  const getTrendIcon = (value: number, threshold: number) => {
    if (value > threshold * 1.1) return <TrendingUp className="h-4 w-4 text-red-500" />;
    if (value < threshold * 0.9) return <TrendingDown className="h-4 w-4 text-blue-500" />;
    return <Minus className="h-4 w-4 text-green-500" />;
  };

  const onlineSensors = sensors.filter(s => s.status === 'online');
  const alertReadings = recentReadings.filter(r => r.is_alert);
  const criticalAlerts = alertReadings.filter(r => r.alert_level === 'critical');
  const averageHealth = sensors.length > 0 
    ? Math.round(sensors.reduce((sum, s) => sum + s.health_score, 0) / sensors.length)
    : 0;

  const currentReadings = recentReadings.filter(r => 
    new Date(r.timestamp).getTime() > Date.now() - 300000 // Last 5 minutes
  );

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Environmental Monitoring</h1>
          <p className="text-muted-foreground">
            Real-time environmental sensor data and alerts
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="text-sm">
            Phase 9 - Smart Infrastructure
          </Badge>
          <Button variant="outline" size="sm" onClick={loadEnvironmentalData} disabled={isLoading}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* System Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Sensors</CardTitle>
            <Target className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{onlineSensors.length}</div>
            <p className="text-xs text-muted-foreground">
              of {sensors.length} total sensors
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">System Health</CardTitle>
            <Gauge className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getHealthColor(averageHealth)}`}>
              {averageHealth}%
            </div>
            <Progress value={averageHealth} className="mt-2 h-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Alerts</CardTitle>
            <AlertTriangle className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{alertReadings.length}</div>
            <p className="text-xs text-muted-foreground">
              {criticalAlerts.length} critical alerts
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Current Temperature</CardTitle>
            <Thermometer className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {weatherData?.temperature.toFixed(1)}°C
            </div>
            <p className="text-xs text-muted-foreground">
              Feels like {weatherData ? (weatherData.temperature + 2).toFixed(1) : '0'}°C
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="dashboard" className="flex items-center gap-2">
            <Gauge className="h-4 w-4" />
            Dashboard
          </TabsTrigger>
          <TabsTrigger value="sensors" className="flex items-center gap-2">
            <Target className="h-4 w-4" />
            Sensors
          </TabsTrigger>
          <TabsTrigger value="weather" className="flex items-center gap-2">
            <Cloud className="h-4 w-4" />
            Weather
          </TabsTrigger>
          <TabsTrigger value="alerts" className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            Alerts
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Analytics
          </TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="space-y-6">
          {/* Current Readings Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {currentReadings.slice(0, 8).map((reading) => (
              <Card key={reading.id} className={`border ${getAlertColor(reading.alert_level)}`}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium capitalize">
                    {reading.reading_type.replace('_', ' ')}
                  </CardTitle>
                  {getReadingIcon(reading.reading_type)}
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {reading.value}
                    <span className="text-sm font-normal ml-1">{reading.unit}</span>
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <p className="text-xs text-muted-foreground">{reading.sensor_name}</p>
                    <Badge variant={reading.is_alert ? 'destructive' : 'default'} className="text-xs">
                      {reading.alert_level}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Real-time Alerts */}
          {alertReadings.length > 0 && (
            <Alert className="border-yellow-200 bg-yellow-50">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <div className="space-y-2">
                  <div className="font-medium">Active Environmental Alerts</div>
                  {alertReadings.slice(0, 3).map((alert) => (
                    <div key={alert.id} className="text-sm">
                      • {alert.sensor_name}: {alert.reading_type.replace('_', ' ')} at {alert.value}{alert.unit} 
                      <Badge variant="destructive" className="ml-2 text-xs">
                        {alert.alert_level}
                      </Badge>
                    </div>
                  ))}
                  {alertReadings.length > 3 && (
                    <div className="text-sm text-muted-foreground">
                      +{alertReadings.length - 3} more alerts
                    </div>
                  )}
                </div>
              </AlertDescription>
            </Alert>
          )}

          {/* Sensor Status Overview */}
          <Card>
            <CardHeader>
              <CardTitle>Sensor Network Status</CardTitle>
              <CardDescription>
                Real-time status of all environmental sensors
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {sensors.map((sensor) => (
                  <div key={sensor.id} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Target className="h-5 w-5" />
                        <span className="font-medium">{sensor.sensor_name}</span>
                      </div>
                      {getStatusIcon(sensor.status)}
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Location:</span>
                        <span className="text-muted-foreground">{sensor.location}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Health:</span>
                        <span className={getHealthColor(sensor.health_score)}>
                          {sensor.health_score}%
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Status:</span>
                        <Badge variant={sensor.status === 'online' ? 'default' : 'secondary'}>
                          {sensor.status}
                        </Badge>
                      </div>
                      {sensor.battery_level && (
                        <div className="flex justify-between">
                          <span>Battery:</span>
                          <span className={sensor.battery_level < 30 ? 'text-red-600' : 'text-green-600'}>
                            {sensor.battery_level}%
                          </span>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span>Last Reading:</span>
                        <span>{new Date(sensor.last_reading_at).toLocaleTimeString()}</span>
                      </div>
                    </div>
                    {sensor.is_critical && (
                      <Badge variant="destructive" className="mt-2 text-xs">
                        Critical Sensor
                      </Badge>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sensors" className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold">Sensor Management</h2>
            <Button>
              <Target className="h-4 w-4 mr-2" />
              Add Sensor
            </Button>
          </div>

          <div className="grid gap-4">
            {sensors.map((sensor) => (
              <Card key={sensor.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Target className="h-6 w-6" />
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          {sensor.sensor_name}
                          {getStatusIcon(sensor.status)}
                          {sensor.is_critical && (
                            <Badge variant="destructive" className="text-xs">Critical</Badge>
                          )}
                        </CardTitle>
                        <CardDescription>{sensor.location}</CardDescription>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => setSelectedSensor(sensor)}
                      >
                        <Settings className="h-4 w-4 mr-2" />
                        Configure
                      </Button>
                      <Button variant="outline" size="sm">
                        <Activity className="h-4 w-4 mr-2" />
                        Calibrate
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="font-medium">Type:</span>
                      <p className="capitalize">{sensor.sensor_type.replace('_', ' ')}</p>
                    </div>
                    <div>
                      <span className="font-medium">Firmware:</span>
                      <p>{sensor.firmware_version}</p>
                    </div>
                    <div>
                      <span className="font-medium">Health Score:</span>
                      <p className={getHealthColor(sensor.health_score)}>
                        {sensor.health_score}%
                      </p>
                    </div>
                    <div>
                      <span className="font-medium">Readings Today:</span>
                      <p>{sensor.readings_today.toLocaleString()}</p>
                    </div>
                  </div>
                  
                  {sensor.battery_level && (
                    <div className="mt-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">Battery Level</span>
                        <span className={`text-sm ${sensor.battery_level < 30 ? 'text-red-600' : 'text-green-600'}`}>
                          {sensor.battery_level}%
                        </span>
                      </div>
                      <Progress 
                        value={sensor.battery_level} 
                        className={`h-2 ${sensor.battery_level < 30 ? 'text-red-600' : ''}`}
                      />
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="weather" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {weatherData && getWeatherIcon(weatherData.weather_condition)}
                Current Weather Conditions
              </CardTitle>
              <CardDescription>
                Real-time weather data from environmental sensors
              </CardDescription>
            </CardHeader>
            <CardContent>
              {weatherData && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="text-center p-4 border rounded-lg">
                    <Thermometer className="h-8 w-8 mx-auto mb-2 text-orange-500" />
                    <div className="text-2xl font-bold">{weatherData.temperature.toFixed(1)}°C</div>
                    <div className="text-sm text-muted-foreground">Temperature</div>
                  </div>
                  
                  <div className="text-center p-4 border rounded-lg">
                    <Droplets className="h-8 w-8 mx-auto mb-2 text-blue-500" />
                    <div className="text-2xl font-bold">{weatherData.humidity}%</div>
                    <div className="text-sm text-muted-foreground">Humidity</div>
                  </div>
                  
                  <div className="text-center p-4 border rounded-lg">
                    <Gauge className="h-8 w-8 mx-auto mb-2 text-purple-500" />
                    <div className="text-2xl font-bold">{weatherData.atmospheric_pressure.toFixed(1)}</div>
                    <div className="text-sm text-muted-foreground">hPa Pressure</div>
                  </div>
                  
                  <div className="text-center p-4 border rounded-lg">
                    <Wind className="h-8 w-8 mx-auto mb-2 text-green-500" />
                    <div className="text-2xl font-bold">{weatherData.wind_speed.toFixed(1)}</div>
                    <div className="text-sm text-muted-foreground">km/h {weatherData.wind_direction}</div>
                  </div>
                  
                  <div className="text-center p-4 border rounded-lg">
                    <Eye className="h-8 w-8 mx-auto mb-2 text-gray-500" />
                    <div className="text-2xl font-bold">{weatherData.visibility.toFixed(1)}</div>
                    <div className="text-sm text-muted-foreground">km Visibility</div>
                  </div>
                  
                  <div className="text-center p-4 border rounded-lg">
                    <Sun className="h-8 w-8 mx-auto mb-2 text-yellow-500" />
                    <div className="text-2xl font-bold">{weatherData.uv_index}</div>
                    <div className="text-sm text-muted-foreground">UV Index</div>
                  </div>
                  
                  <div className="text-center p-4 border rounded-lg">
                    {getWeatherIcon(weatherData.weather_condition)}
                    <div className="text-lg font-bold capitalize">{weatherData.weather_condition}</div>
                    <div className="text-sm text-muted-foreground">Conditions</div>
                  </div>
                  
                  <div className="text-center p-4 border rounded-lg">
                    <Clock className="h-8 w-8 mx-auto mb-2 text-blue-500" />
                    <div className="text-lg font-bold">
                      {new Date(weatherData.timestamp).toLocaleTimeString()}
                    </div>
                    <div className="text-sm text-muted-foreground">Last Updated</div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Weather Trends */}
          <Card>
            <CardHeader>
              <CardTitle>24-Hour Weather Trends</CardTitle>
              <CardDescription>
                Historical weather data and patterns
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[200px] flex items-center justify-center text-muted-foreground">
                <div className="text-center">
                  <LineChart className="h-8 w-8 mx-auto mb-2" />
                  <p>Weather trend visualization</p>
                  <p className="text-xs">Chart integration needed</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="alerts" className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold">Alert Management</h2>
            <Button>
              <Bell className="h-4 w-4 mr-2" />
              Create Alert Rule
            </Button>
          </div>

          {/* Active Alerts */}
          <Card>
            <CardHeader>
              <CardTitle>Active Alerts</CardTitle>
              <CardDescription>
                Current environmental alerts and warnings
              </CardDescription>
            </CardHeader>
            <CardContent>
              {alertReadings.length > 0 ? (
                <div className="space-y-4">
                  {alertReadings.map((alert) => (
                    <div key={alert.id} className={`p-4 border rounded-lg ${getAlertColor(alert.alert_level)}`}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {getReadingIcon(alert.reading_type)}
                          <div>
                            <h3 className="font-medium">
                              {alert.reading_type.replace('_', ' ').toUpperCase()} Alert
                            </h3>
                            <p className="text-sm text-muted-foreground">
                              {alert.sensor_name} - {alert.location}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-bold">
                            {alert.value} {alert.unit}
                          </div>
                          <Badge variant={alert.alert_level === 'critical' ? 'destructive' : 'secondary'}>
                            {alert.alert_level}
                          </Badge>
                        </div>
                      </div>
                      <div className="mt-3 flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">
                          {new Date(alert.timestamp).toLocaleString()}
                        </span>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm">
                            <Bell className="h-4 w-4 mr-2" />
                            Acknowledge
                          </Button>
                          <Button variant="outline" size="sm">
                            <Settings className="h-4 w-4 mr-2" />
                            Configure
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-500" />
                  <p className="text-lg font-medium">No Active Alerts</p>
                  <p className="text-sm">All environmental parameters are within normal ranges</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Alert Configuration */}
          <Card>
            <CardHeader>
              <CardTitle>Alert Rules</CardTitle>
              <CardDescription>
                Configure thresholds and notification settings
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {alertConfigs.map((config) => (
                  <div key={config.id} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium capitalize">
                          {config.reading_type.replace('_', ' ')} {config.condition} {config.threshold_value}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {sensors.find(s => s.id === config.sensor_id)?.sensor_name}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={config.alert_level === 'critical' ? 'destructive' : 'secondary'}>
                          {config.alert_level}
                        </Badge>
                        <Switch checked={config.notification_enabled} />
                      </div>
                    </div>
                    <div className="mt-3 flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Bell className="h-3 w-3" />
                        <span>Notifications: {config.notification_enabled ? 'On' : 'Off'}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span>Email: {config.email_enabled ? 'On' : 'Off'}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span>SMS: {config.sms_enabled ? 'On' : 'Off'}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold">Environmental Analytics</h2>
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1h">Last Hour</SelectItem>
                <SelectItem value="24h">Last 24h</SelectItem>
                <SelectItem value="7d">Last 7 days</SelectItem>
                <SelectItem value="30d">Last 30 days</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Analytics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Temperature Trends</CardTitle>
                <CardDescription>Temperature variations over time</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[200px] flex items-center justify-center text-muted-foreground">
                  <div className="text-center">
                    <Thermometer className="h-8 w-8 mx-auto mb-2" />
                    <p>Temperature chart</p>
                    <p className="text-xs">Chart integration needed</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Air Quality Index</CardTitle>
                <CardDescription>Air quality measurements</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[200px] flex items-center justify-center text-muted-foreground">
                  <div className="text-center">
                    <Wind className="h-8 w-8 mx-auto mb-2" />
                    <p>AQI chart</p>
                    <p className="text-xs">Chart integration needed</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Noise Levels</CardTitle>
                <CardDescription>Sound level monitoring</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[200px] flex items-center justify-center text-muted-foreground">
                  <div className="text-center">
                    <Volume2 className="h-8 w-8 mx-auto mb-2" />
                    <p>Noise level chart</p>
                    <p className="text-xs">Chart integration needed</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Summary Statistics */}
          <Card>
            <CardHeader>
              <CardTitle>System Performance Summary</CardTitle>
              <CardDescription>
                Environmental monitoring system statistics
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-4 border rounded-lg">
                  <Target className="h-6 w-6 mx-auto mb-2 text-blue-500" />
                  <div className="text-lg font-bold">{onlineSensors.length}/{sensors.length}</div>
                  <div className="text-sm text-muted-foreground">Sensors Online</div>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <Activity className="h-6 w-6 mx-auto mb-2 text-green-500" />
                  <div className="text-lg font-bold">
                    {sensors.reduce((sum, s) => sum + s.readings_today, 0).toLocaleString()}
                  </div>
                  <div className="text-sm text-muted-foreground">Readings Today</div>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <AlertTriangle className="h-6 w-6 mx-auto mb-2 text-yellow-500" />
                  <div className="text-lg font-bold">{alertReadings.length}</div>
                  <div className="text-sm text-muted-foreground">Active Alerts</div>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <Gauge className="h-6 w-6 mx-auto mb-2 text-purple-500" />
                  <div className="text-lg font-bold">{averageHealth}%</div>
                  <div className="text-sm text-muted-foreground">Average Health</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default EnvironmentalMonitoring;
