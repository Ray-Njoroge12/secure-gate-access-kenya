"""
Performance monitoring service for tracking system performance metrics
"""
import logging
import time
import psutil
import asyncio
from typing import Dict, Any, List, Optional
from datetime import datetime, timedelta
from dataclasses import dataclass
from collections import defaultdict

logger = logging.getLogger(__name__)

@dataclass
class PerformanceMetric:
    """Performance metric data structure"""
    name: str
    value: float
    timestamp: datetime
    tags: Dict[str, str] = None

    def __post_init__(self):
        if self.tags is None:
            self.tags = {}

class PerformanceMonitoringService:
    """
    Service for monitoring system performance and tracking improvements
    """

    def __init__(self):
        self.metrics = []
        self.baseline_metrics = {}
        self.performance_history = defaultdict(list)
        self.collection_interval = 60  # seconds
        self.max_history_size = 1000

    def start_monitoring(self):
        """Start background performance monitoring"""
        asyncio.create_task(self._monitor_system_performance())

    async def _monitor_system_performance(self):
        """Background task for collecting system performance metrics"""
        while True:
            try:
                metrics = self._collect_system_metrics()
                for metric in metrics:
                    self._store_metric(metric)

                await asyncio.sleep(self.collection_interval)

            except Exception as e:
                logger.error(f"Performance monitoring error: {e}")
                await asyncio.sleep(self.collection_interval)

    def _collect_system_metrics(self) -> List[PerformanceMetric]:
        """Collect current system performance metrics"""
        metrics = []
        timestamp = datetime.now()

        try:
            # CPU metrics
            cpu_percent = psutil.cpu_percent(interval=1)
            metrics.append(PerformanceMetric(
                name="system.cpu.usage",
                value=cpu_percent,
                timestamp=timestamp,
                tags={"type": "usage"}
            ))

            # Memory metrics
            memory = psutil.virtual_memory()
            metrics.append(PerformanceMetric(
                name="system.memory.usage",
                value=memory.percent,
                timestamp=timestamp,
                tags={"type": "usage"}
            ))

            metrics.append(PerformanceMetric(
                name="system.memory.used_mb",
                value=memory.used / 1024 / 1024,
                timestamp=timestamp,
                tags={"type": "used"}
            ))

            # Disk metrics
            disk = psutil.disk_usage('/')
            metrics.append(PerformanceMetric(
                name="system.disk.usage",
                value=disk.percent,
                timestamp=timestamp,
                tags={"type": "usage"}
            ))

            # Network metrics (if available)
            try:
                network = psutil.net_io_counters()
                if network:
                    metrics.append(PerformanceMetric(
                        name="system.network.bytes_sent",
                        value=network.bytes_sent,
                        timestamp=timestamp,
                        tags={"type": "bytes_sent"}
                    ))
                    metrics.append(PerformanceMetric(
                        name="system.network.bytes_recv",
                        value=network.bytes_recv,
                        timestamp=timestamp,
                        tags={"type": "bytes_recv"}
                    ))
            except Exception:
                pass  # Network metrics might not be available

        except Exception as e:
            logger.error(f"Error collecting system metrics: {e}")

        return metrics

    def record_api_metric(
        self,
        endpoint: str,
        method: str,
        response_time: float,
        status_code: int,
        user_id: Optional[str] = None
    ):
        """Record API endpoint performance metric"""
        timestamp = datetime.now()

        metric = PerformanceMetric(
            name="api.endpoint.response_time",
            value=response_time,
            timestamp=timestamp,
            tags={
                "endpoint": endpoint,
                "method": method,
                "status_code": str(status_code),
                "user_id": user_id or "anonymous"
            }
        )

        self._store_metric(metric)

    def record_database_metric(
        self,
        operation: str,
        table: str,
        execution_time: float,
        rows_affected: Optional[int] = None
    ):
        """Record database operation performance metric"""
        timestamp = datetime.now()

        metric = PerformanceMetric(
            name="database.operation.execution_time",
            value=execution_time,
            timestamp=timestamp,
            tags={
                "operation": operation,
                "table": table,
                "rows_affected": str(rows_affected) if rows_affected else "unknown"
            }
        )

        self._store_metric(metric)

    def record_cache_metric(
        self,
        operation: str,
        key: str,
        hit: bool,
        response_time: Optional[float] = None
    ):
        """Record cache operation performance metric"""
        timestamp = datetime.now()

        metric = PerformanceMetric(
            name="cache.operation.response_time",
            value=response_time or 0.0,
            timestamp=timestamp,
            tags={
                "operation": operation,
                "key": key,
                "hit": str(hit)
            }
        )

        self._store_metric(metric)

    def _store_metric(self, metric: PerformanceMetric):
        """Store metric in history"""
        self.metrics.append(metric)
        self.performance_history[metric.name].append(metric)

        # Maintain history size limit
        if len(self.performance_history[metric.name]) > self.max_history_size:
            self.performance_history[metric.name] = self.performance_history[metric.name][-self.max_history_size:]

    def get_performance_summary(self, hours: int = 24) -> Dict[str, Any]:
        """Get performance summary for the last N hours"""
        cutoff_time = datetime.now() - timedelta(hours=hours)

        # Filter recent metrics
        recent_metrics = [m for m in self.metrics if m.timestamp > cutoff_time]

        if not recent_metrics:
            return {"error": "No metrics available for the specified time period"}

        # Group metrics by name
        grouped_metrics = defaultdict(list)
        for metric in recent_metrics:
            grouped_metrics[metric.name].append(metric)

        summary = {
            "period_hours": hours,
            "total_metrics": len(recent_metrics),
            "metrics_summary": {}
        }

        # Calculate statistics for each metric type
        for metric_name, metrics_list in grouped_metrics.items():
            values = [m.value for m in metrics_list]

            summary["metrics_summary"][metric_name] = {
                "count": len(values),
                "average": sum(values) / len(values) if values else 0,
                "min": min(values) if values else 0,
                "max": max(values) if values else 0,
                "latest": values[-1] if values else 0,
                "tags": metrics_list[0].tags if metrics_list else {}
            }

        return summary

    def get_performance_trends(self, metric_name: str, hours: int = 24) -> Dict[str, Any]:
        """Get performance trends for a specific metric"""
        cutoff_time = datetime.now() - timedelta(hours=hours)

        # Filter metrics
        relevant_metrics = [
            m for m in self.performance_history.get(metric_name, [])
            if m.timestamp > cutoff_time
        ]

        if not relevant_metrics:
            return {"error": f"No data available for metric: {metric_name}"}

        # Sort by timestamp
        relevant_metrics.sort(key=lambda m: m.timestamp)

        # Calculate trends
        values = [m.value for m in relevant_metrics]
        timestamps = [m.timestamp for m in relevant_metrics]

        trend = {
            "metric_name": metric_name,
            "data_points": len(values),
            "start_time": timestamps[0].isoformat(),
            "end_time": timestamps[-1].isoformat(),
            "values": values,
            "timestamps": [t.isoformat() for t in timestamps]
        }

        # Calculate trend direction (simplified)
        if len(values) >= 2:
            first_half = values[:len(values)//2]
            second_half = values[len(values)//2:]

            avg_first = sum(first_half) / len(first_half)
            avg_second = sum(second_half) / len(second_half)

            if avg_second > avg_first * 1.05:  # 5% increase
                trend["trend"] = "increasing"
            elif avg_second < avg_first * 0.95:  # 5% decrease
                trend["trend"] = "decreasing"
            else:
                trend["trend"] = "stable"

        return trend

    def set_baseline(self, metric_name: str, value: float):
        """Set baseline value for a metric"""
        self.baseline_metrics[metric_name] = value

    def get_baseline_comparison(self, metric_name: str) -> Dict[str, Any]:
        """Compare current performance to baseline"""
        if metric_name not in self.baseline_metrics:
            return {"error": f"No baseline set for metric: {metric_name}"}

        baseline = self.baseline_metrics[metric_name]

        # Get recent metrics
        recent_metrics = self.performance_history.get(metric_name, [])
        if not recent_metrics:
            return {"error": f"No recent data for metric: {metric_name}"}

        current_avg = sum(m.value for m in recent_metrics[-10:]) / min(10, len(recent_metrics))

        return {
            "metric_name": metric_name,
            "baseline": baseline,
            "current_average": current_avg,
            "improvement": baseline - current_avg,
            "improvement_percentage": ((baseline - current_avg) / baseline * 100) if baseline > 0 else 0
        }

    def export_metrics(self, format: str = "json") -> str:
        """Export metrics in specified format"""
        if format.lower() == "json":
            import json
            return json.dumps({
                "metrics": [
                    {
                        "name": m.name,
                        "value": m.value,
                        "timestamp": m.timestamp.isoformat(),
                        "tags": m.tags
                    } for m in self.metrics[-100:]  # Last 100 metrics
                ],
                "export_time": datetime.now().isoformat()
            }, indent=2)
        else:
            return "Format not supported"

# Global performance monitoring service instance
_performance_service = None

def get_performance_service() -> PerformanceMonitoringService:
    """Get the global performance monitoring service instance"""
    global _performance_service
    if _performance_service is None:
        _performance_service = PerformanceMonitoringService()
    return _performance_service

# Convenience functions
def record_api_metric(*args, **kwargs):
    """Record API performance metric"""
    get_performance_service().record_api_metric(*args, **kwargs)

def record_database_metric(*args, **kwargs):
    """Record database performance metric"""
    get_performance_service().record_database_metric(*args, **kwargs)

def record_cache_metric(*args, **kwargs):
    """Record cache performance metric"""
    get_performance_service().record_cache_metric(*args, **kwargs)
