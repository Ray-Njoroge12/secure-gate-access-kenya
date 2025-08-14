import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Smartphone, 
  Fingerprint, 
  CameraIcon, 
  WifiOff, 
  Download,
  Vibrate,
  Bell,
  MapPin,
  QrCode,
  Users,
  Clock,
  Shield
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface MobileFeature {
  id: string;
  name: string;
  description: string;
  status: 'available' | 'unavailable' | 'disabled';
  icon: React.ReactNode;
  category: 'authentication' | 'camera' | 'offline' | 'location' | 'notification';
}

interface BiometricData {
  type: 'fingerprint' | 'face' | 'voice';
  data: string;
  confidence: number;
  timestamp: string;
}

interface OfflineData {
  visitors: any[];
  invitations: any[];
  lastSync: string;
  pendingUploads: number;
}

const MobileFeatureManager: React.FC = () => {
  const [features, setFeatures] = useState<MobileFeature[]>([]);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [offlineData, setOfflineData] = useState<OfflineData | null>(null);
  const [biometricSupport, setBiometricSupport] = useState(false);
  const [locationPermission, setLocationPermission] = useState<'granted' | 'denied' | 'prompt'>('prompt');
  const [cameraPermission, setCameraPermission] = useState<'granted' | 'denied' | 'prompt'>('prompt');
  const [notificationPermission, setNotificationPermission] = useState<'granted' | 'denied' | 'default'>('default');
  const { toast } = useToast();

  useEffect(() => {
    initializeMobileFeatures();
    checkPermissions();
    setupNetworkListeners();
    
    return () => {
      // Cleanup listeners
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const initializeMobileFeatures = () => {
    const mobileFeatures: MobileFeature[] = [
      {
        id: 'biometric_auth',
        name: 'Biometric Authentication',
        description: 'Fingerprint and face recognition for secure access',
        status: 'available',
        icon: <Fingerprint className="w-6 h-6" />,
        category: 'authentication'
      },
      {
        id: 'camera_capture',
        name: 'Advanced Camera',
        description: 'High-quality photo capture with auto-focus and flash',
        status: 'available',
        icon: <CameraIcon className="w-6 h-6" />,
        category: 'camera'
      },
      {
        id: 'offline_mode',
        name: 'Offline Functionality',
        description: 'Continue working without internet connection',
        status: isOnline ? 'available' : 'unavailable',
        icon: <WifiOff className="w-6 h-6" />,
        category: 'offline'
      },
      {
        id: 'geolocation',
        name: 'Location Services',
        description: 'GPS tracking and geo-fencing capabilities',
        status: 'available',
        icon: <MapPin className="w-6 h-6" />,
        category: 'location'
      },
      {
        id: 'push_notifications',
        name: 'Push Notifications',
        description: 'Real-time alerts and updates',
        status: 'available',
        icon: <Bell className="w-6 h-6" />,
        category: 'notification'
      },
      {
        id: 'qr_scanner',
        name: 'QR Code Scanner',
        description: 'Fast and accurate QR code scanning',
        status: 'available',
        icon: <QrCode className="w-6 h-6" />,
        category: 'camera'
      },
      {
        id: 'haptic_feedback',
        name: 'Haptic Feedback',
        description: 'Tactile responses for better user experience',
        status: 'available',
        icon: <Vibrate className="w-6 h-6" />,
        category: 'notification'
      }
    ];

    setFeatures(mobileFeatures);
  };

  const checkPermissions = async () => {
    // Check biometric support
    if ('credentials' in navigator && 'PublicKeyCredential' in window) {
      setBiometricSupport(true);
    }

    // Check camera permission
    try {
      const cameraPermissionStatus = await navigator.permissions.query({ name: 'camera' as PermissionName });
      setCameraPermission(cameraPermissionStatus.state);
    } catch (error) {
      console.warn('Camera permission check failed:', error);
    }

    // Check location permission
    try {
      const locationPermissionStatus = await navigator.permissions.query({ name: 'geolocation' as PermissionName });
      setLocationPermission(locationPermissionStatus.state);
    } catch (error) {
      console.warn('Location permission check failed:', error);
    }

    // Check notification permission
    if ('Notification' in window) {
      setNotificationPermission(Notification.permission);
    }
  };

  const setupNetworkListeners = () => {
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
  };

  const handleOnline = () => {
    setIsOnline(true);
    syncOfflineData();
    toast({
      title: "Back Online",
      description: "Syncing offline data...",
    });
  };

  const handleOffline = () => {
    setIsOnline(false);
    toast({
      title: "Offline Mode",
      description: "Working offline. Data will sync when connection is restored.",
      variant: "destructive",
    });
  };

  const enableBiometricAuth = async () => {
    try {
      if (!biometricSupport) {
        throw new Error('Biometric authentication not supported');
      }

      const publicKeyCredentialCreationOptions: PublicKeyCredentialCreationOptions = {
        challenge: new TextEncoder().encode('challenge'),
        rp: {
          name: "Secure Gate Access",
          id: window.location.hostname,
        },
        user: {
          id: new TextEncoder().encode('user123'),
          name: "user@example.com",
          displayName: "User",
        },
        pubKeyCredParams: [{alg: -7, type: "public-key"}],
        authenticatorSelection: {
          authenticatorAttachment: "platform",
          userVerification: "required"
        },
        timeout: 60000,
        attestation: "direct"
      };

      const credential = await navigator.credentials.create({
        publicKey: publicKeyCredentialCreationOptions
      });

      if (credential) {
        toast({
          title: "Biometric Setup Complete",
          description: "Biometric authentication is now enabled",
        });
        
        // Store biometric credential
        await supabase
          .from('user_biometrics')
          .insert({
            user_id: 'current_user_id', // Replace with actual user ID
            credential_id: credential.id,
            public_key: 'encoded_public_key',
            created_at: new Date().toISOString()
          });
      }
    } catch (error) {
      console.error('Biometric setup failed:', error);
      toast({
        title: "Biometric Setup Failed",
        description: "Unable to setup biometric authentication",
        variant: "destructive",
      });
    }
  };

  const requestCameraPermission = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: 'environment',
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        } 
      });
      
      // Stop the stream immediately as we just wanted permission
      stream.getTracks().forEach(track => track.stop());
      
      setCameraPermission('granted');
      toast({
        title: "Camera Access Granted",
        description: "High-quality photo capture is now available",
      });
    } catch (error) {
      setCameraPermission('denied');
      toast({
        title: "Camera Access Denied",
        description: "Please enable camera access in your browser settings",
        variant: "destructive",
      });
    }
  };

  const requestLocationPermission = async () => {
    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 60000
        });
      });

      setLocationPermission('granted');
      toast({
        title: "Location Access Granted",
        description: `Location: ${position.coords.latitude.toFixed(6)}, ${position.coords.longitude.toFixed(6)}`,
      });

      // Store location data
      await supabase
        .from('user_locations')
        .insert({
          user_id: 'current_user_id', // Replace with actual user ID
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          timestamp: new Date().toISOString()
        });

    } catch (error) {
      setLocationPermission('denied');
      toast({
        title: "Location Access Denied",
        description: "Please enable location access for geo-fencing features",
        variant: "destructive",
      });
    }
  };

  const requestNotificationPermission = async () => {
    try {
      if (!('Notification' in window)) {
        throw new Error('Notifications not supported');
      }

      const permission = await Notification.requestPermission();
      setNotificationPermission(permission);

      if (permission === 'granted') {
        // Test notification
        new Notification('Notifications Enabled', {
          body: 'You will now receive real-time updates',
          icon: '/favicon.ico',
          tag: 'test-notification'
        });

        toast({
          title: "Notifications Enabled",
          description: "You will receive real-time alerts",
        });
      } else {
        toast({
          title: "Notifications Denied",
          description: "Please enable notifications in your browser settings",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Notification Setup Failed",
        description: "Unable to setup push notifications",
        variant: "destructive",
      });
    }
  };

  const capturePhoto = async () => {
    try {
      if (cameraPermission !== 'granted') {
        await requestCameraPermission();
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: 'environment',
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        } 
      });

      // Create video element for capture
      const video = document.createElement('video');
      video.srcObject = stream;
      video.play();

      // Wait for video to be ready
      await new Promise((resolve) => {
        video.onloadedmetadata = resolve;
      });

      // Create canvas for capture
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      // Capture frame
      context?.drawImage(video, 0, 0);
      const imageData = canvas.toDataURL('image/jpeg', 0.9);

      // Stop stream
      stream.getTracks().forEach(track => track.stop());

      // Upload photo
      const blob = await fetch(imageData).then(r => r.blob());
      const fileName = `photo_${Date.now()}.jpg`;
      
      const { data, error } = await supabase.storage
        .from('visitor-photos')
        .upload(fileName, blob);

      if (error) throw error;

      toast({
        title: "Photo Captured",
        description: "High-quality photo saved successfully",
      });

      return data.path;
    } catch (error) {
      console.error('Photo capture failed:', error);
      toast({
        title: "Photo Capture Failed",
        description: "Unable to capture photo",
        variant: "destructive",
      });
    }
  };

  const enableHapticFeedback = () => {
    if ('vibrate' in navigator) {
      // Test vibration pattern
      navigator.vibrate([200, 100, 200]);
      toast({
        title: "Haptic Feedback Enabled",
        description: "You should feel a vibration pattern",
      });
    } else {
      toast({
        title: "Haptic Feedback Unavailable",
        description: "Your device doesn't support haptic feedback",
        variant: "destructive",
      });
    }
  };

  const syncOfflineData = async () => {
    try {
      const storedData = localStorage.getItem('offline_data');
      if (!storedData) return;

      const offlineData: OfflineData = JSON.parse(storedData);
      
      // Sync pending visitors
      for (const visitor of offlineData.visitors) {
        await supabase.from('visitors').insert(visitor);
      }

      // Sync pending invitations
      for (const invitation of offlineData.invitations) {
        await supabase.from('invitations').insert(invitation);
      }

      // Clear offline data
      localStorage.removeItem('offline_data');
      
      toast({
        title: "Sync Complete",
        description: `Synced ${offlineData.visitors.length + offlineData.invitations.length} records`,
      });
    } catch (error) {
      console.error('Sync failed:', error);
      toast({
        title: "Sync Failed",
        description: "Some data may not have been synced",
        variant: "destructive",
      });
    }
  };

  const downloadOfflineData = async () => {
    try {
      // Download essential data for offline use
      const { data: visitors } = await supabase
        .from('visitors')
        .select('*')
        .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

      const { data: invitations } = await supabase
        .from('invitations')
        .select('*')
        .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

      const offlineData: OfflineData = {
        visitors: visitors || [],
        invitations: invitations || [],
        lastSync: new Date().toISOString(),
        pendingUploads: 0
      };

      localStorage.setItem('offline_data', JSON.stringify(offlineData));
      setOfflineData(offlineData);

      toast({
        title: "Offline Data Downloaded",
        description: `Downloaded ${(visitors?.length || 0) + (invitations?.length || 0)} records`,
      });
    } catch (error) {
      console.error('Download failed:', error);
      toast({
        title: "Download Failed",
        description: "Unable to download offline data",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Mobile Features</h2>
          <p className="text-muted-foreground">Enhanced mobile capabilities and native features</p>
        </div>
        <Badge variant={isOnline ? "default" : "destructive"}>
          {isOnline ? "Online" : "Offline"}
        </Badge>
      </div>

      {/* Network Status Alert */}
      {!isOnline && (
        <Alert>
          <WifiOff className="h-4 w-4" />
          <AlertDescription>
            You're working offline. Some features may be limited until connection is restored.
          </AlertDescription>
        </Alert>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Button onClick={enableBiometricAuth} disabled={!biometricSupport} className="h-auto p-4 flex-col">
          <Fingerprint className="w-8 h-8 mb-2" />
          <span>Setup Biometrics</span>
        </Button>
        
        <Button onClick={capturePhoto} variant="outline" className="h-auto p-4 flex-col">
          <CameraIcon className="w-8 h-8 mb-2" />
          <span>Capture Photo</span>
        </Button>
        
        <Button onClick={downloadOfflineData} variant="outline" className="h-auto p-4 flex-col">
          <Download className="w-8 h-8 mb-2" />
          <span>Download for Offline</span>
        </Button>
        
        <Button onClick={enableHapticFeedback} variant="outline" className="h-auto p-4 flex-col">
          <Vibrate className="w-8 h-8 mb-2" />
          <span>Test Haptics</span>
        </Button>
      </div>

      {/* Feature Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {features.map((feature) => (
          <Card key={feature.id} className="relative">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  {feature.icon}
                  <CardTitle className="text-lg">{feature.name}</CardTitle>
                </div>
                <Badge 
                  variant={
                    feature.status === 'available' ? 'default' : 
                    feature.status === 'unavailable' ? 'destructive' : 'secondary'
                  }
                >
                  {feature.status}
                </Badge>
              </div>
              <CardDescription>{feature.description}</CardDescription>
            </CardHeader>
            <CardContent>
              {feature.id === 'biometric_auth' && (
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">
                    Support: {biometricSupport ? 'Available' : 'Not Available'}
                  </p>
                  <Button 
                    onClick={enableBiometricAuth} 
                    disabled={!biometricSupport}
                    size="sm"
                    className="w-full"
                  >
                    Setup Biometric Auth
                  </Button>
                </div>
              )}

              {feature.id === 'camera_capture' && (
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">
                    Permission: {cameraPermission}
                  </p>
                  {cameraPermission !== 'granted' && (
                    <Button 
                      onClick={requestCameraPermission}
                      size="sm"
                      className="w-full"
                    >
                      Grant Camera Access
                    </Button>
                  )}
                </div>
              )}

              {feature.id === 'geolocation' && (
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">
                    Permission: {locationPermission}
                  </p>
                  {locationPermission !== 'granted' && (
                    <Button 
                      onClick={requestLocationPermission}
                      size="sm"
                      className="w-full"
                    >
                      Grant Location Access
                    </Button>
                  )}
                </div>
              )}

              {feature.id === 'push_notifications' && (
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">
                    Permission: {notificationPermission}
                  </p>
                  {notificationPermission !== 'granted' && (
                    <Button 
                      onClick={requestNotificationPermission}
                      size="sm"
                      className="w-full"
                    >
                      Enable Notifications
                    </Button>
                  )}
                </div>
              )}

              {feature.id === 'offline_mode' && offlineData && (
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">
                    Last Sync: {new Date(offlineData.lastSync).toLocaleString()}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Records: {offlineData.visitors.length + offlineData.invitations.length}
                  </p>
                  <Button 
                    onClick={syncOfflineData}
                    size="sm"
                    className="w-full"
                    disabled={!isOnline}
                  >
                    Sync Data
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Permissions Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Shield className="w-5 h-5" />
            <span>Permissions Summary</span>
          </CardTitle>
          <CardDescription>Current status of device permissions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
              <span>Camera</span>
              <Badge variant={cameraPermission === 'granted' ? 'default' : 'destructive'}>
                {cameraPermission}
              </Badge>
            </div>
            <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
              <span>Location</span>
              <Badge variant={locationPermission === 'granted' ? 'default' : 'destructive'}>
                {locationPermission}
              </Badge>
            </div>
            <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
              <span>Notifications</span>
              <Badge variant={notificationPermission === 'granted' ? 'default' : 'destructive'}>
                {notificationPermission}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default MobileFeatureManager;
