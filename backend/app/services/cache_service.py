"""
Redis caching service for performance optimization
"""
import json
import logging
from typing import Any, Optional, Union
from redis import Redis
from redis.connection import ConnectionPool
from ..config import get_settings

settings = get_settings()
logger = logging.getLogger(__name__)

class CacheService:
    """
    Redis-based caching service with connection pooling and error handling
    """

    def __init__(self):
        self.redis_client: Optional[Redis] = None
        self._connection_pool: Optional[ConnectionPool] = None
        self._initialize_redis()

    def _initialize_redis(self):
        """Initialize Redis connection with connection pooling"""
        try:
            self._connection_pool = ConnectionPool.from_url(
                settings.REDIS_URL,
                max_connections=settings.REDIS_MAX_CONNECTIONS,
                decode_responses=True,
                socket_timeout=5,
                socket_connect_timeout=5,
                retry_on_timeout=True,
                health_check_interval=30
            )
            self.redis_client = Redis(connection_pool=self._connection_pool)
            # Test connection
            self.redis_client.ping()
            logger.info("Redis cache service initialized successfully")
        except Exception as e:
            logger.warning(f"Redis connection failed: {e}. Caching will be disabled.")
            self.redis_client = None

    def get(self, key: str) -> Optional[Any]:
        """Get value from cache"""
        if not self.redis_client:
            return None

        try:
            value = self.redis_client.get(key)
            if value:
                return json.loads(value)
            return None
        except Exception as e:
            logger.error(f"Cache get error for key {key}: {e}")
            return None

    def set(self, key: str, value: Any, ttl: Optional[int] = None) -> bool:
        """Set value in cache with optional TTL"""
        if not self.redis_client:
            return False

        try:
            serialized_value = json.dumps(value)
            ttl_value = ttl or settings.REDIS_CACHE_TTL
            return bool(self.redis_client.setex(key, ttl_value, serialized_value))
        except Exception as e:
            logger.error(f"Cache set error for key {key}: {e}")
            return False

    def delete(self, key: str) -> bool:
        """Delete key from cache"""
        if not self.redis_client:
            return False

        try:
            return bool(self.redis_client.delete(key))
        except Exception as e:
            logger.error(f"Cache delete error for key {key}: {e}")
            return False

    def exists(self, key: str) -> bool:
        """Check if key exists in cache"""
        if not self.redis_client:
            return False

        try:
            return bool(self.redis_client.exists(key))
        except Exception as e:
            logger.error(f"Cache exists error for key {key}: {e}")
            return False

    def get_or_set(self, key: str, default_func, ttl: Optional[int] = None):
        """Get value from cache or set it using default function"""
        cached_value = self.get(key)
        if cached_value is not None:
            return cached_value

        # Compute new value
        new_value = default_func()
        if new_value is not None:
            self.set(key, new_value, ttl)

        return new_value

    def clear_pattern(self, pattern: str) -> int:
        """Clear all keys matching pattern"""
        if not self.redis_client:
            return 0

        try:
            keys = self.redis_client.keys(pattern)
            if keys:
                return self.redis_client.delete(*keys)
            return 0
        except Exception as e:
            logger.error(f"Cache clear pattern error for {pattern}: {e}")
            return 0

    def get_stats(self) -> dict:
        """Get cache statistics"""
        if not self.redis_client:
            return {"status": "disabled"}

        try:
            info = self.redis_client.info()
            return {
                "status": "connected",
                "used_memory": info.get("used_memory_human", "N/A"),
                "connected_clients": info.get("connected_clients", 0),
                "total_connections_received": info.get("total_connections_received", 0),
                "keyspace_hits": info.get("keyspace_hits", 0),
                "keyspace_misses": info.get("keyspace_misses", 0),
            }
        except Exception as e:
            logger.error(f"Cache stats error: {e}")
            return {"status": "error", "error": str(e)}

    def close(self):
        """Close Redis connections"""
        if self._connection_pool:
            self._connection_pool.disconnect()
            logger.info("Redis connections closed")

    async def get_async(self, key: str) -> Optional[Any]:
        """Async version of get method"""
        return self.get(key)

    async def set_async(self, key: str, value: Any, ttl: Optional[int] = None) -> bool:
        """Async version of set method"""
        return self.set(key, value, ttl)

    async def delete_async(self, key: str) -> bool:
        """Async version of delete method"""
        return self.delete(key)

    async def exists_async(self, key: str) -> bool:
        """Async version of exists method"""
        return self.exists(key)

    async def get_stats_async(self) -> dict:
        """Async version of get_stats method"""
        return self.get_stats()

    async def clear_pattern_async(self, pattern: str) -> int:
        """Async version of clear_pattern method"""
        return self.clear_pattern(pattern)

# Global cache service instance
_cache_service = None

def get_cache_service() -> CacheService:
    """Get the global cache service instance"""
    global _cache_service
    if _cache_service is None:
        _cache_service = CacheService()
    return _cache_service

# Convenience functions for common caching operations
def cache_get(key: str) -> Optional[Any]:
    """Get value from cache"""
    return get_cache_service().get(key)

def cache_set(key: str, value: Any, ttl: Optional[int] = None) -> bool:
    """Set value in cache"""
    return get_cache_service().set(key, value, ttl)

def cache_delete(key: str) -> bool:
    """Delete key from cache"""
    return get_cache_service().delete(key)

def cache_exists(key: str) -> bool:
    """Check if key exists in cache"""
    return get_cache_service().exists(key)

def cache_get_or_set(key: str, default_func, ttl: Optional[int] = None):
    """Get from cache or set using default function"""
    return get_cache_service().get_or_set(key, default_func, ttl)
