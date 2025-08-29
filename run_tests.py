#!/usr/bin/env python3
"""
Test runner script for the backend application.
This script properly sets up the Python path and runs pytest.
"""

import sys
import os
from pathlib import Path

# Add the backend directory to Python path
backend_path = Path(__file__).parent / "backend"
sys.path.insert(0, str(backend_path))

# Set environment variables for testing
os.environ.setdefault("INTERNAL_API_KEY", "change_me_internal_key")
os.environ.setdefault("DATABASE_URL", "sqlite:///./test_app.db")
# os.environ.setdefault("DISABLE_PROMETHEUS_METRICS", "true")  # Enable metrics for testing

if __name__ == "__main__":
    import pytest
    sys.exit(pytest.main(sys.argv[1:]))
