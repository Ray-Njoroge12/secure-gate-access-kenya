"""
Prometheus metrics configuration
"""
import os
from prometheus_client import Counter, Histogram, Gauge

# Prometheus metrics
if os.getenv('DISABLE_PROMETHEUS_METRICS', 'false').lower() == 'true':
    # Disable metrics for testing
    REQUEST_COUNT = None
    REQUEST_LATENCY = None
    ACTIVE_CONNECTIONS = None
    VISITOR_REGISTRATIONS = None
    ACCESS_CODE_VERIFICATIONS = None
else:
    REQUEST_COUNT = Counter('http_requests_total', 'Total HTTP requests', ['method', 'endpoint', 'status'])
    REQUEST_LATENCY = Histogram('http_request_duration_seconds', 'HTTP request latency', ['method', 'endpoint'])
    ACTIVE_CONNECTIONS = Gauge('active_connections', 'Number of active connections')
    VISITOR_REGISTRATIONS = Counter('visitor_registrations_total', 'Total visitor registrations')
    ACCESS_CODE_VERIFICATIONS = Counter('access_code_verifications_total', 'Total access code verifications', ['result'])
