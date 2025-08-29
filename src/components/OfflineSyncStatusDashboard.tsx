import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { apiClient } from '@/lib/api-client';
import { useSession } from '@/hooks/use-session';
import {
  Wifi,
  WifiOff,
  RefreshCw,
  Download,
  Upload,
  AlertTriangle,
  CheckCircle,
  Clock,
  Database,
  Smartphone,
  Loader2,
  Sync
} from 'lucide-react';

interface OfflineSyncStatus {
  device_id: string;
  device_name: string;
  last_sync: string;
  sync_status: 'online' | 'offline' | 'syncing' | 'error';
  pending_uploads: number;
  pending_downloads: number;
  total_data_size: number;
  last_error?: string;
  battery_level?: number;
  storage_available: number;
}

interface SyncStats {
  total_devices: number;
  online_devices: number;
  syncing_devices: number;
  offline_devices: number;
  total_pending_uploads: number;
  total_pending_downloads: number;
  last_global_sync: string;
}

export function OfflineSyncStatusDashboard() {
  const { session } = useSession();
  const { toast } = useToast();

  // State management
  const [syncStatus, setSyncStatus] = useState<OfflineSyncStatus[]>([]);
  const [stats, setStats] = useState<SyncStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncingDevice, setSyncingDevice] = useState<string | null>(null);
  const [globalSyncing, setGlobalSyncing] = useState(false);

  // Fetch sync status
  const fetchSyncStatus = useCallback(async () => {
    try {
      const [statusResponse, statsResponse] = await Promise.all([
        apiClient.get('/offline/sync/status'),
        apiClient.get('/offline/sync/stats')
      ]);

      setSyncStatus(statusResponse.data.devices || []);
      setStats(statsResponse.data);
    } catch (error) {
      console.error('Failed to fetch sync status:', error);
      toast({
        title: "Error",
        description: "Failed to load sync status",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  // Sync specific device
  const syncDevice = useCallback(async (deviceId: string) => {
    setSyncingDevice(deviceId);
    try {
      await apiClient.post(`/offline/sync/device/${deviceId}`);

      toast({
        title: "Sync Started",
        description: "Device synchronization has been initiated",
      });

      // Refresh status after a short delay
      setTimeout(fetchSyncStatus, 2000);
    } catch (error) {
      console.error('Failed to sync device:', error);
      toast({
        title: "Sync Error",
        description: "Failed to synchronize device",
        variant: "destructive",
      });
    } finally {
      setSyncingDevice(null);
    }
  }, [toast, fetchSyncStatus]);

  // Global sync all devices
  const globalSync = useCallback(async () => {
    setGlobalSyncing(true);
    try {
      await apiClient.post('/offline/sync/all');

      toast({
        title: "Global Sync Started",
        description: "Synchronization initiated for all devices",
      });

      // Refresh status after a short delay
      setTimeout(fetchSyncStatus, 3000);
    } catch (error) {
      console.error('Failed to perform global sync:', error);
      toast({
        title: "Sync Error",
        description: "Failed to perform global synchronization",
        variant: "destructive",
      });
    } finally {
      setGlobalSyncing(false);
    }
  }, [toast, fetchSyncStatus]);

  // Force sync conflicted data
  const resolveConflicts = useCallback(async (deviceId: string) => {
    try {
      await apiClient.post(`/offline/sync/resolve/${deviceId}`);

      toast({
        title: "Conflicts Resolved",
        description: "Data conflicts have been resolved",
      });

      fetchSyncStatus();
    } catch (error) {
      console.error('Failed to resolve conflicts:', error);
      toast({
        title: "Error",
        description: "Failed to resolve data conflicts",
        variant: "destructive",
      });
    }
  }, [toast, fetchSyncStatus]);

  // Get sync status color
  const getSyncStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'bg-green-100 text-green-800';
      case 'syncing': return 'bg-blue-100 text-blue-800';
      case 'offline': return 'bg-gray-100 text-gray-800';
      case 'error': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Get sync status icon
  const getSyncStatusIcon = (status: string) => {
    switch (status) {
      case 'online': return <Wifi className="w-4 h-4" />;
      case 'syncing': return <RefreshCw className="w-4 h-4 animate-spin" />;
      case 'offline': return <WifiOff className="w-4 h-4" />;
      case 'error': return <AlertTriangle className="w-4 h-4" />;
      default: return <Database className="w-4 h-4" />;
    }
  };

  // Format data size
  const formatDataSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Load data on component mount
  useEffect(() => {
    fetchSyncStatus();

    // Set up periodic refresh
    const interval = setInterval(fetchSyncStatus, 30000); // Every 30 seconds

    return () => clearInterval(interval);
  }, [fetchSyncStatus]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin" />
        <span className="ml-2">Loading sync status...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Offline Sync Status</h2>
          <p className="text-muted-foreground">
            Monitor and manage offline device synchronization
          </p>
        </div>
        <Button
          onClick={globalSync}
          disabled={globalSyncing}
        >
          {globalSyncing ? (
            <Loader2 className="w-4 h-4 animate-spin mr-2" />
          ) : (
            <Sync className="w-4 h-4 mr-2" />
          )}
          Global Sync
        </Button>
      </div>

      {/* Global Stats */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Devices</CardTitle>
              <Smartphone className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total_devices}</div>
              <p className="text-xs text-muted-foreground">Registered devices</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Online Devices</CardTitle>
              <Wifi className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.online_devices}</div>
              <p className="text-xs text-muted-foreground">Currently online</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Uploads</CardTitle>
              <Upload className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total_pending_uploads}</div>
              <p className="text-xs text-muted-foreground">Data to upload</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Downloads</CardTitle>
              <Download className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total_pending_downloads}</div>
              <p className="text-xs text-muted-foreground">Data to download</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Last Global Sync */}
      {stats?.last_global_sync && (
        <Alert>
          <Clock className="h-4 w-4" />
          <AlertDescription>
            Last global synchronization: {new Date(stats.last_global_sync).toLocaleString()}
          </AlertDescription>
        </Alert>
      )}

      {/* Device Status Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {syncStatus.map((device) => (
          <Card key={device.device_id} className="relative">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Smartphone className="w-5 h-5" />
                  {device.device_name}
                </CardTitle>
                <Badge className={getSyncStatusColor(device.sync_status)}>
                  {getSyncStatusIcon(device.sync_status)}
                  <span className="ml-1 capitalize">{device.sync_status}</span>
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Sync Progress */}
              {device.sync_status === 'syncing' && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Sync Progress</span>
                    <span>{Math.round((device.pending_uploads + device.pending_downloads) / (device.pending_uploads + device.pending_downloads + 10) * 100)}%</span>
                  </div>
                  <Progress value={Math.round((device.pending_uploads + device.pending_downloads) / (device.pending_uploads + device.pending_downloads + 10) * 100)} />
                </div>
              )}

              {/* Device Info */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Last Sync</p>
                  <p className="font-medium">
                    {new Date(device.last_sync).toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Data Size</p>
                  <p className="font-medium">
                    {formatDataSize(device.total_data_size)}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Pending Uploads</p>
                  <p className="font-medium">{device.pending_uploads}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Pending Downloads</p>
                  <p className="font-medium">{device.pending_downloads}</p>
                </div>
              </div>

              {/* Battery Level */}
              {device.battery_level !== undefined && (
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Battery Level</span>
                    <span>{device.battery_level}%</span>
                  </div>
                  <Progress value={device.battery_level} />
                </div>
              )}

              {/* Storage Available */}
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Storage Available</span>
                  <span>{formatDataSize(device.storage_available)}</span>
                </div>
                <Progress value={Math.min(100, (device.storage_available / (1024 * 1024 * 1024)) * 100)} />
              </div>

              {/* Error Message */}
              {device.last_error && (
                <Alert className="border-red-200 bg-red-50">
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                  <AlertDescription className="text-red-800">
                    {device.last_error}
                  </AlertDescription>
                </Alert>
              )}

              {/* Action Buttons */}
              <div className="flex gap-2 pt-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => syncDevice(device.device_id)}
                  disabled={syncingDevice === device.device_id || device.sync_status === 'syncing'}
                  className="flex-1"
                >
                  {syncingDevice === device.device_id ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : (
                    <RefreshCw className="w-4 h-4 mr-2" />
                  )}
                  Sync Now
                </Button>

                {(device.pending_uploads > 0 || device.pending_downloads > 0) && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => resolveConflicts(device.device_id)}
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Resolve
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Empty State */}
      {syncStatus.length === 0 && (
        <Card>
          <CardContent className="text-center py-8">
            <Database className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-medium mb-2">No Devices Found</h3>
            <p className="text-muted-foreground">
              No offline devices are currently registered for synchronization.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Connection Status Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wifi className="w-5 h-5" />
            Connection Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {syncStatus.filter(d => d.sync_status === 'online').length}
              </div>
              <p className="text-sm text-muted-foreground">Online</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {syncStatus.filter(d => d.sync_status === 'syncing').length}
              </div>
              <p className="text-sm text-muted-foreground">Syncing</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-600">
                {syncStatus.filter(d => d.sync_status === 'offline').length}
              </div>
              <p className="text-sm text-muted-foreground">Offline</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">
                {syncStatus.filter(d => d.sync_status === 'error').length}
              </div>
              <p className="text-sm text-muted-foreground">Error</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
