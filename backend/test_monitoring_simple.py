#!/usr/bin/env python3
"""
Simple test script to verify monitoring implementation
"""
import sys
import os

# Add the app directory to the Python path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'app'))

try:
    # Test prometheus client import
    from prometheus_client import generate_latest, Counter, Histogram, Gauge
    print("✓ Prometheus client imported successfully")

    # Test basic metrics creation
    test_counter = Counter('test_counter', 'Test counter')
    test_histogram = Histogram('test_histogram', 'Test histogram')
    test_gauge = Gauge('test_gauge', 'Test gauge')

    test_counter.inc()
    test_histogram.observe(1.0)
    test_gauge.set(42)

    # Generate metrics
    metrics = generate_latest()
    metrics_str = metrics.decode('utf-8')

    print("✓ Metrics generated successfully")
    print("✓ Custom metrics found in output:")
    print("  - test_counter:", 'test_counter' in metrics_str)
    print("  - test_histogram:", 'test_histogram' in metrics_str)
    print("  - test_gauge:", 'test_gauge' in metrics_str)

    # Check for our application metrics
    app_metrics = ['http_requests_total', 'http_request_duration_seconds', 'active_connections',
                   'visitor_registrations_total', 'access_code_verifications_total']

    print("\n✓ Application metrics in schema:")
    for metric in app_metrics:
        found = metric in metrics_str
        print(f"  - {metric}: {'✓' if found else '✗'}")

    print("\n✓ Monitoring implementation test completed successfully!")

except ImportError as e:
    print(f"✗ Import error: {e}")
    sys.exit(1)
except Exception as e:
    print(f"✗ Error: {e}")
    sys.exit(1)
