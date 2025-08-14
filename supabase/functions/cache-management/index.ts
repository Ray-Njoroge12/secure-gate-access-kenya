import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

interface CacheRequest {
  action: 'get' | 'set' | 'delete' | 'invalidate' | 'stats' | 'cleanup';
  key?: string;
  value?: any;
  ttl?: number;
  tags?: string[];
  cache_type?: 'redis' | 'browser' | 'database';
}

interface CacheResponse {
  success: boolean;
  data?: any;
  cache_hit?: boolean;
  error?: string;
  performance?: {
    response_time_ms: number;
    cache_size_bytes: number;
  };
}

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

// Redis client simulation (replace with actual Redis client)
class RedisCache {
  private cache = new Map<string, { value: any; expires: number; size: number }>();

  async get(key: string): Promise<any> {
    const item = this.cache.get(key);
    if (!item || item.expires < Date.now()) {
      this.cache.delete(key);
      return null;
    }
    return item.value;
  }

  async set(key: string, value: any, ttl: number = 3600): Promise<boolean> {
    const serialized = JSON.stringify(value);
    const size = new Blob([serialized]).size;
    
    this.cache.set(key, {
      value: value,
      expires: Date.now() + (ttl * 1000),
      size: size
    });
    
    return true;
  }

  async delete(key: string): Promise<boolean> {
    return this.cache.delete(key);
  }

  async clear(): Promise<boolean> {
    this.cache.clear();
    return true;
  }

  async keys(pattern: string = '*'): Promise<string[]> {
    const keys = Array.from(this.cache.keys());
    if (pattern === '*') return keys;
    
    // Simple pattern matching
    const regex = new RegExp(pattern.replace(/\*/g, '.*'));
    return keys.filter(key => regex.test(key));
  }

  async size(): Promise<number> {
    return Array.from(this.cache.values())
      .reduce((total, item) => total + item.size, 0);
  }
}

const redis = new RedisCache();

async function updateCacheStatistics(
  cacheKey: string, 
  hit: boolean, 
  responseTime: number, 
  sizeBytes: number = 0
): Promise<void> {
  try {
    const today = new Date().toISOString().split('T')[0];
    
    // Upsert cache statistics
    const { error } = await supabase
      .from('cache_statistics')
      .upsert({
        cache_key: cacheKey,
        hit_count: hit ? 1 : 0,
        miss_count: hit ? 0 : 1,
        total_size_bytes: sizeBytes,
        avg_response_time_ms: responseTime,
        last_accessed: new Date().toISOString(),
        date_bucket: today
      }, {
        onConflict: 'cache_key,date_bucket',
        ignoreDuplicates: false
      });

    if (error) {
      console.error('Failed to update cache statistics:', error);
    }
  } catch (error) {
    console.error('Cache statistics update error:', error);
  }
}

async function getCacheConfig(cacheKey: string): Promise<any> {
  const { data, error } = await supabase
    .from('cache_config')
    .select('*')
    .eq('cache_key', cacheKey)
    .eq('is_active', true)
    .single();

  if (error) {
    console.warn('Cache config not found for key:', cacheKey);
    return {
      cache_type: 'redis',
      ttl_seconds: 3600,
      compression_enabled: true
    };
  }

  return data;
}

async function handleCacheGet(request: CacheRequest): Promise<CacheResponse> {
  const startTime = Date.now();
  const cacheKey = request.key!;
  
  try {
    const config = await getCacheConfig(cacheKey);
    let value = null;
    let cacheHit = false;

    switch (config.cache_type) {
      case 'redis':
        value = await redis.get(cacheKey);
        cacheHit = value !== null;
        break;
      
      case 'database':
        // Database-level caching (query result caching)
        const { data } = await supabase
          .from('cache_data')
          .select('value, expires_at')
          .eq('cache_key', cacheKey)
          .single();
        
        if (data && new Date(data.expires_at) > new Date()) {
          value = data.value;
          cacheHit = true;
        }
        break;
      
      default:
        value = await redis.get(cacheKey);
        cacheHit = value !== null;
    }

    const responseTime = Date.now() - startTime;
    await updateCacheStatistics(cacheKey, cacheHit, responseTime, 
      value ? new Blob([JSON.stringify(value)]).size : 0);

    return {
      success: true,
      data: value,
      cache_hit: cacheHit,
      performance: {
        response_time_ms: responseTime,
        cache_size_bytes: value ? new Blob([JSON.stringify(value)]).size : 0
      }
    };
  } catch (error) {
    const responseTime = Date.now() - startTime;
    await updateCacheStatistics(cacheKey, false, responseTime);
    
    return {
      success: false,
      error: `Cache get failed: ${error.message}`,
      cache_hit: false
    };
  }
}

async function handleCacheSet(request: CacheRequest): Promise<CacheResponse> {
  const startTime = Date.now();
  const cacheKey = request.key!;
  const value = request.value;
  
  try {
    const config = await getCacheConfig(cacheKey);
    const ttl = request.ttl || config.ttl_seconds || 3600;
    
    let success = false;
    const serializedValue = JSON.stringify(value);
    const sizeBytes = new Blob([serializedValue]).size;

    switch (config.cache_type) {
      case 'redis':
        success = await redis.set(cacheKey, value, ttl);
        break;
      
      case 'database':
        const expiresAt = new Date(Date.now() + (ttl * 1000)).toISOString();
        const { error } = await supabase
          .from('cache_data')
          .upsert({
            cache_key: cacheKey,
            value: value,
            expires_at: expiresAt,
            size_bytes: sizeBytes
          });
        success = !error;
        break;
      
      default:
        success = await redis.set(cacheKey, value, ttl);
    }

    const responseTime = Date.now() - startTime;
    await updateCacheStatistics(cacheKey, false, responseTime, sizeBytes);

    return {
      success: success,
      data: { cached: success, ttl: ttl },
      performance: {
        response_time_ms: responseTime,
        cache_size_bytes: sizeBytes
      }
    };
  } catch (error) {
    return {
      success: false,
      error: `Cache set failed: ${error.message}`
    };
  }
}

async function handleCacheDelete(request: CacheRequest): Promise<CacheResponse> {
  const cacheKey = request.key!;
  
  try {
    const config = await getCacheConfig(cacheKey);
    let success = false;

    switch (config.cache_type) {
      case 'redis':
        success = await redis.delete(cacheKey);
        break;
      
      case 'database':
        const { error } = await supabase
          .from('cache_data')
          .delete()
          .eq('cache_key', cacheKey);
        success = !error;
        break;
      
      default:
        success = await redis.delete(cacheKey);
    }

    return {
      success: success,
      data: { deleted: success }
    };
  } catch (error) {
    return {
      success: false,
      error: `Cache delete failed: ${error.message}`
    };
  }
}

async function handleCacheInvalidate(request: CacheRequest): Promise<CacheResponse> {
  try {
    const tags = request.tags || [];
    
    if (tags.length === 0) {
      return {
        success: false,
        error: 'No tags provided for invalidation'
      };
    }

    // Use the database function to invalidate by tags
    const { data, error } = await supabase.rpc('invalidate_cache_by_tags', {
      p_tags: tags,
      p_reason: 'API invalidation request'
    });

    if (error) throw error;

    // Get the cache keys to invalidate from Redis/other caches
    const { data: cacheConfigs } = await supabase
      .from('cache_config')
      .select('cache_key, cache_type')
      .overlaps('cache_tags', tags)
      .eq('is_active', true);

    let invalidatedCount = 0;
    for (const config of cacheConfigs || []) {
      try {
        switch (config.cache_type) {
          case 'redis':
            await redis.delete(config.cache_key);
            invalidatedCount++;
            break;
          
          case 'database':
            await supabase
              .from('cache_data')
              .delete()
              .eq('cache_key', config.cache_key);
            invalidatedCount++;
            break;
        }
      } catch (error) {
        console.error(`Failed to invalidate cache key ${config.cache_key}:`, error);
      }
    }

    return {
      success: true,
      data: {
        invalidated_count: invalidatedCount,
        database_invalidated: data || 0
      }
    };
  } catch (error) {
    return {
      success: false,
      error: `Cache invalidation failed: ${error.message}`
    };
  }
}

async function handleCacheStats(): Promise<CacheResponse> {
  try {
    // Get cache performance summary
    const { data: performanceSummary } = await supabase
      .from('cache_performance_summary')
      .select('*');

    // Get cache efficiency report
    const { data: efficiencyReport } = await supabase
      .from('cache_efficiency_report')
      .select('*')
      .limit(20);

    // Get Redis cache size
    const redisSizeBytes = await redis.size();
    const redisKeys = await redis.keys();

    return {
      success: true,
      data: {
        performance_summary: performanceSummary,
        efficiency_report: efficiencyReport,
        redis_stats: {
          total_keys: redisKeys.length,
          total_size_bytes: redisSizeBytes,
          total_size_mb: Math.round(redisSizeBytes / 1024 / 1024 * 100) / 100
        }
      }
    };
  } catch (error) {
    return {
      success: false,
      error: `Cache stats failed: ${error.message}`
    };
  }
}

async function handleCacheCleanup(): Promise<CacheResponse> {
  try {
    // Clean up expired cache statistics
    const { data: cleanupResult, error } = await supabase.rpc('cleanup_expired_cache_stats');
    
    if (error) throw error;

    // Clean up expired Redis entries
    const redisKeys = await redis.keys();
    let expiredCount = 0;
    
    for (const key of redisKeys) {
      const value = await redis.get(key);
      if (value === null) {
        expiredCount++;
      }
    }

    return {
      success: true,
      data: {
        database_cleanup_count: cleanupResult || 0,
        redis_expired_count: expiredCount,
        total_cleaned: (cleanupResult || 0) + expiredCount
      }
    };
  } catch (error) {
    return {
      success: false,
      error: `Cache cleanup failed: ${error.message}`
    };
  }
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ 
      success: false, 
      error: 'Method not allowed' 
    }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const request: CacheRequest = await req.json();
    let response: CacheResponse;

    switch (request.action) {
      case 'get':
        if (!request.key) {
          throw new Error('Cache key is required for get operation');
        }
        response = await handleCacheGet(request);
        break;

      case 'set':
        if (!request.key || request.value === undefined) {
          throw new Error('Cache key and value are required for set operation');
        }
        response = await handleCacheSet(request);
        break;

      case 'delete':
        if (!request.key) {
          throw new Error('Cache key is required for delete operation');
        }
        response = await handleCacheDelete(request);
        break;

      case 'invalidate':
        response = await handleCacheInvalidate(request);
        break;

      case 'stats':
        response = await handleCacheStats();
        break;

      case 'cleanup':
        response = await handleCacheCleanup();
        break;

      default:
        throw new Error(`Unknown cache action: ${request.action}`);
    }

    return new Response(JSON.stringify(response), {
      status: response.success ? 200 : 400,
      headers: { 
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate'
      },
    });

  } catch (error) {
    console.error('Cache management error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: `Cache management failed: ${error.message}`
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});
