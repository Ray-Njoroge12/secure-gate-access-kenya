import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { 
  Database, 
  Zap, 
  HardDrive, 
  Trash2,
  RefreshCw,
  TrendingUp,
  Clock,
  FileText,
  Globe,
  Smartphone,
  Settings,
  BarChart3
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface CacheStats {
  cache_type: string;
  cache_count: number;
  avg_hit_rate: number;
  total_hits: number;
  total_misses: number;
  total_size_mb: number;
}

interface CacheEfficiency {
  cache_key: string;
  cache_type: string;
  hit_rate: number;
  total_requests: number;
  size_mb: number;
  avg_response_time_ms: number;
  last_accessed: string;
}

interface CacheConfig {
  id: string;
  cache_key: string;
  cache_type: string;
  ttl_seconds: number;
  cache_tags: string[];
  is_active: boolean;
}

const CacheManagementDashboard: React.FC = () => {
  const [cacheStats, setCacheStats] = useState<CacheStats[]>([]);
  const [cacheEfficiency, setCacheEfficiency] = useState<CacheEfficiency[]>([]);
  const [cacheConfigs, setCacheConfigs] = useState<CacheConfig[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [newCacheKey, setNewCacheKey] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    loadCacheData();
  }, []);

  const loadCacheData = async () => {
    setIsLoading(true);
    try {
      // Load cache performance summary
      const { data: stats, error: statsError } = await supabase
        .from('cache_performance_summary')
        .select('*');

      if (statsError) throw statsError;
      setCacheStats(stats || []);

      // Load cache efficiency report
      const { data: efficiency, error: efficiencyError } = await supabase
        .from('cache_efficiency_report')
        .select('*')
        .limit(20);

      if (efficiencyError) throw efficiencyError;
      setCacheEfficiency(efficiency || []);

      // Load cache configurations
      const { data: configs, error: configsError } = await supabase
        .from('cache_config')
        .select('*')
        .eq('is_active', true)
        .order('cache_key');

      if (configsError) throw configsError;
      setCacheConfigs(configs || []);

    } catch (error) {
      console.error('Failed to load cache data:', error);
      toast({
        title: "Failed to Load Cache Data",
        description: "Unable to retrieve cache performance metrics",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const invalidateCache = async () => {
    if (selectedTags.length === 0) {
      toast({
        title: "No Tags Selected",
        description: "Please select cache tags to invalidate",
        variant: "destructive",
      });
      return;
    }

    try {
      const { data, error } = await supabase.rpc('invalidate_cache_by_tags', {
        p_tags: selectedTags,
        p_reason: 'Manual invalidation from dashboard'
      });

      if (error) throw error;

      toast({
        title: "Cache Invalidated",
        description: `Invalidated ${data || 0} cache entries`,
      });

      // Reload data
      await loadCacheData();
    } catch (error) {
      console.error('Cache invalidation failed:', error);
      toast({
        title: "Invalidation Failed",
        description: "Unable to invalidate cache",
        variant: "destructive",
      });
    }
  };

  const cleanupExpiredCache = async () => {
    try {
      const { data, error } = await supabase.rpc('cleanup_expired_cache_stats');

      if (error) throw error;

      toast({
        title: "Cache Cleanup Complete",
        description: `Cleaned up ${data || 0} expired entries`,
      });

      // Reload data
      await loadCacheData();
    } catch (error) {
      console.error('Cache cleanup failed:', error);
      toast({
        title: "Cleanup Failed",
        description: "Unable to cleanup expired cache entries",
        variant: "destructive",
      });
    }
  };

  const deleteCacheEntry = async (cacheKey: string) => {
    try {
      // Call cache management function
      const response = await fetch('/api/cache-management', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'delete',
          key: cacheKey
        })
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error);
      }

      toast({
        title: "Cache Entry Deleted",
        description: `Deleted cache entry: ${cacheKey}`,
      });

      // Reload data
      await loadCacheData();
    } catch (error) {
      console.error('Cache deletion failed:', error);
      toast({
        title: "Deletion Failed",
        description: "Unable to delete cache entry",
        variant: "destructive",
      });
    }
  };

  const getCacheTypeIcon = (cacheType: string) => {
    switch (cacheType) {
      case 'redis':
        return <Database className="w-5 h-5 text-red-500" />;
      case 'browser':
        return <Smartphone className="w-5 h-5 text-blue-500" />;
      case 'cdn':
        return <Globe className="w-5 h-5 text-green-500" />;
      case 'database':
        return <HardDrive className="w-5 h-5 text-purple-500" />;
      default:
        return <FileText className="w-5 h-5 text-gray-500" />;
    }
  };

  const getHitRateColor = (hitRate: number) => {
    if (hitRate >= 80) return 'text-green-600';
    if (hitRate >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const formatBytes = (bytes: number) => {
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 Bytes';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  const uniqueTags = Array.from(
    new Set(cacheConfigs.flatMap(config => config.cache_tags || []))
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Cache Management</h2>
          <p className="text-muted-foreground">Monitor and manage multi-layer caching performance</p>
        </div>
        <div className="flex space-x-2">
          <Button onClick={cleanupExpiredCache} variant="outline">
            <Trash2 className="w-4 h-4 mr-2" />
            Cleanup
          </Button>
          <Button onClick={loadCacheData} variant="outline">
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="configuration">Configuration</TabsTrigger>
          <TabsTrigger value="management">Management</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          {/* Cache Type Performance Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {cacheStats.map((stat) => (
              <Card key={stat.cache_type}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium capitalize">
                    {stat.cache_type} Cache
                  </CardTitle>
                  {getCacheTypeIcon(stat.cache_type)}
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-center mb-2">
                    <span className={getHitRateColor(stat.avg_hit_rate)}>
                      {stat.avg_hit_rate.toFixed(1)}%
                    </span>
                  </div>
                  <Progress value={stat.avg_hit_rate} className="mb-2" />
                  <div className="text-xs text-muted-foreground space-y-1">
                    <div className="flex justify-between">
                      <span>Entries:</span>
                      <span>{stat.cache_count}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Size:</span>
                      <span>{stat.total_size_mb.toFixed(1)} MB</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Hits:</span>
                      <span>{stat.total_hits.toLocaleString()}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Overall Performance Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Cache Hits</CardTitle>
                <TrendingUp className="w-4 h-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {cacheStats.reduce((sum, stat) => sum + stat.total_hits, 0).toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground">
                  Successful cache retrievals
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Cache Size</CardTitle>
                <HardDrive className="w-4 h-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {cacheStats.reduce((sum, stat) => sum + stat.total_size_mb, 0).toFixed(1)} MB
                </div>
                <p className="text-xs text-muted-foreground">
                  Across all cache layers
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Cache Keys</CardTitle>
                <BarChart3 className="w-4 h-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {cacheStats.reduce((sum, stat) => sum + stat.cache_count, 0)}
                </div>
                <p className="text-xs text-muted-foreground">
                  Configured cache entries
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Cache Efficiency Report</CardTitle>
              <CardDescription>Performance metrics for individual cache keys</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {cacheEfficiency.map((entry, index) => (
                  <div key={entry.cache_key} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      {getCacheTypeIcon(entry.cache_type)}
                      <div>
                        <div className="font-medium">{entry.cache_key}</div>
                        <div className="text-sm text-muted-foreground">
                          {entry.total_requests.toLocaleString()} requests • 
                          {entry.avg_response_time_ms.toFixed(1)}ms avg • 
                          {entry.size_mb.toFixed(2)} MB
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <div className={`font-medium ${getHitRateColor(entry.hit_rate)}`}>
                          {entry.hit_rate.toFixed(1)}%
                        </div>
                        <div className="text-sm text-muted-foreground">hit rate</div>
                      </div>
                      <Button 
                        onClick={() => deleteCacheEntry(entry.cache_key)}
                        size="sm" 
                        variant="outline"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="configuration" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Cache Configuration</CardTitle>
              <CardDescription>Manage cache settings and configurations</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {cacheConfigs.map((config) => (
                  <div key={config.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      {getCacheTypeIcon(config.cache_type)}
                      <div>
                        <div className="font-medium">{config.cache_key}</div>
                        <div className="text-sm text-muted-foreground">
                          TTL: {config.ttl_seconds}s • 
                          Tags: {config.cache_tags?.join(', ') || 'None'}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant={config.is_active ? "default" : "secondary"}>
                        {config.is_active ? "Active" : "Inactive"}
                      </Badge>
                      <Badge variant="outline">{config.cache_type}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="management" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Cache Invalidation</CardTitle>
                <CardDescription>Invalidate cache entries by tags</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Select Tags to Invalidate:</label>
                  <div className="mt-2 space-y-2">
                    {uniqueTags.map((tag) => (
                      <label key={tag} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={selectedTags.includes(tag)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedTags([...selectedTags, tag]);
                            } else {
                              setSelectedTags(selectedTags.filter(t => t !== tag));
                            }
                          }}
                          className="rounded"
                        />
                        <span className="text-sm">{tag}</span>
                      </label>
                    ))}
                  </div>
                </div>
                <Button 
                  onClick={invalidateCache} 
                  disabled={selectedTags.length === 0}
                  className="w-full"
                >
                  <Zap className="w-4 h-4 mr-2" />
                  Invalidate Selected Caches
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Cache Operations</CardTitle>
                <CardDescription>Manual cache management operations</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Alert>
                  <Clock className="h-4 w-4" />
                  <AlertDescription>
                    Cache cleanup removes expired statistics older than 30 days.
                  </AlertDescription>
                </Alert>
                
                <Button onClick={cleanupExpiredCache} variant="outline" className="w-full">
                  <Trash2 className="w-4 h-4 mr-2" />
                  Cleanup Expired Entries
                </Button>
                
                <Button onClick={loadCacheData} variant="outline" className="w-full">
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Refresh All Data
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CacheManagementDashboard;
