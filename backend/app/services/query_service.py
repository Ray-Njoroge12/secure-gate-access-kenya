"""
Query optimization service for database performance improvements
"""
import logging
import time
from typing import Any, Dict, List, Optional, Tuple
from sqlalchemy import text, select, func
from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError

from ..database import get_session
from .cache_service import get_cache_service

logger = logging.getLogger(__name__)

class QueryOptimizationService:
    """
    Service for optimizing database queries with caching and performance monitoring
    """

    def __init__(self):
        self.cache_service = get_cache_service()
        self.query_stats = {}
        self.slow_query_threshold = 1.0  # seconds

    async def execute_cached_query(
        self,
        query_key: str,
        query_func,
        ttl: int = 300,
        force_refresh: bool = False
    ) -> Any:
        """
        Execute a query with caching support

        Args:
            query_key: Unique key for caching
            query_func: Function that executes the query
            ttl: Time to live in seconds
            force_refresh: Force cache refresh

        Returns:
            Query result
        """
        # Check cache first
        if not force_refresh:
            cached_result = await self.cache_service.get(query_key)
            if cached_result is not None:
                logger.info(f"Cache hit for query: {query_key}")
                return cached_result

        # Execute query
        start_time = time.time()
        try:
            result = await query_func()
            execution_time = time.time() - start_time

            # Log slow queries
            if execution_time > self.slow_query_threshold:
                logger.warning(f"Slow query detected: {query_key} ({execution_time:.2f}s)")

            # Update query statistics
            self._update_query_stats(query_key, execution_time)

            # Cache result
            await self.cache_service.set(query_key, result, ttl)
            logger.info(f"Query executed and cached: {query_key}")

            return result

        except Exception as e:
            logger.error(f"Query execution error for {query_key}: {e}")
            raise

    def execute_optimized_select(
        self,
        session: Session,
        query,
        use_cache: bool = True,
        cache_key: Optional[str] = None,
        ttl: int = 300
    ) -> List:
        """
        Execute SELECT query with optimization

        Args:
            session: Database session
            query: SQLAlchemy query
            use_cache: Whether to use caching
            cache_key: Custom cache key
            ttl: Cache TTL

        Returns:
            Query results
        """
        if not use_cache:
            return session.execute(query).fetchall()

        # Generate cache key if not provided
        if cache_key is None:
            cache_key = f"query:{hash(str(query))}"

        # Check cache
        cached_result = self.cache_service.get_sync(cache_key)
        if cached_result is not None:
            return cached_result

        # Execute query
        start_time = time.time()
        result = session.execute(query).fetchall()
        execution_time = time.time() - start_time

        # Log performance
        if execution_time > self.slow_query_threshold:
            logger.warning(f"Slow SELECT query: {execution_time:.2f}s")

        # Cache result
        self.cache_service.set_sync(cache_key, result, ttl)

        return result

    def get_query_statistics(self) -> Dict[str, Any]:
        """Get query performance statistics"""
        return {
            'query_stats': self.query_stats,
            'slow_query_threshold': self.slow_query_threshold,
            'total_queries': len(self.query_stats)
        }

    def _update_query_stats(self, query_key: str, execution_time: float):
        """Update query statistics"""
        if query_key not in self.query_stats:
            self.query_stats[query_key] = {
                'count': 0,
                'total_time': 0.0,
                'avg_time': 0.0,
                'max_time': 0.0,
                'min_time': float('inf')
            }

        stats = self.query_stats[query_key]
        stats['count'] += 1
        stats['total_time'] += execution_time
        stats['avg_time'] = stats['total_time'] / stats['count']
        stats['max_time'] = max(stats['max_time'], execution_time)
        stats['min_time'] = min(stats['min_time'], execution_time)

    async def invalidate_cache_pattern(self, pattern: str):
        """Invalidate cache entries matching a pattern"""
        await self.cache_service.delete_pattern(pattern)
        logger.info(f"Invalidated cache pattern: {pattern}")

    async def warmup_cache(self, queries: List[Tuple[str, callable]]):
        """Warm up cache with frequently used queries"""
        for cache_key, query_func in queries:
            try:
                await self.execute_cached_query(cache_key, query_func, force_refresh=True)
                logger.info(f"Warmed up cache for: {cache_key}")
            except Exception as e:
                logger.error(f"Cache warmup failed for {cache_key}: {e}")

    def optimize_query_with_hints(self, query, hints: Dict[str, Any]) -> str:
        """
        Add optimization hints to raw SQL query

        Args:
            query: Raw SQL query string
            hints: Dictionary of optimization hints

        Returns:
            Optimized query string
        """
        optimized_query = query

        # Add index hints
        if 'use_index' in hints:
            index_name = hints['use_index']
            optimized_query = f"/*+ INDEX(table_name {index_name}) */ {query}"

        # Add query hints
        if 'query_hints' in hints:
            hint_str = " ".join(f"/*+ {hint} */" for hint in hints['query_hints'])
            optimized_query = f"{hint_str} {query}"

        return optimized_query

# Global query optimization service instance
_query_service = None

def get_query_service() -> QueryOptimizationService:
    """Get the global query optimization service instance"""
    global _query_service
    if _query_service is None:
        _query_service = QueryOptimizationService()
    return _query_service

# Convenience functions
async def cached_query(query_key: str, query_func, **kwargs):
    """Execute cached query"""
    return await get_query_service().execute_cached_query(query_key, query_func, **kwargs)

def optimized_select(session: Session, query, **kwargs):
    """Execute optimized SELECT query"""
    return get_query_service().execute_optimized_select(session, query, **kwargs)
