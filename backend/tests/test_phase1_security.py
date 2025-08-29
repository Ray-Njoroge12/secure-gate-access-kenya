#!/usr/bin/env python3
"""
Phase 1 Security Implementation Test Suite
Tests all security enhancements implemented in Phase 1
"""
import requests
import json
import time
import threading
from typing import Dict, List
import sys
import os

# Add backend to path
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'app'))


class SecurityTestSuite:
    """Comprehensive security testing suite for Phase 1 improvements"""

    def __init__(self, base_url: str = "http://localhost:8000"):
        self.base_url = base_url
        self.test_results = []

    def log_test_result(self, test_name: str, passed: bool, details: str = "", error: str = ""):
        """Log test result"""
        result = {
            "test": test_name,
            "passed": passed,
            "details": details,
            "error": error,
            "timestamp": time.time()
        }
        self.test_results.append(result)
        status = "✅ PASS" if passed else "❌ FAIL"
        print(f"{status}: {test_name}")
        if details:
            print(f"   Details: {details}")
        if error:
            print(f"   Error: {error}")

    def test_security_headers(self):
        """Test security headers implementation"""
        try:
            response = requests.get(f"{self.base_url}/healthz")
            headers = response.headers

            # Check essential security headers
            required_headers = [
                'X-Content-Type-Options',
                'X-Frame-Options',
                'X-XSS-Protection',
                'Content-Security-Policy',
                'Referrer-Policy'
            ]

            missing_headers = []
            for header in required_headers:
                if header not in headers:
                    missing_headers.append(header)

            if missing_headers:
                self.log_test_result(
                    "Security Headers",
                    False,
                    f"Missing headers: {missing_headers}"
                )
            else:
                self.log_test_result(
                    "Security Headers",
                    True,
                    f"All required security headers present: {len(required_headers)} headers"
                )

        except Exception as e:
            self.log_test_result("Security Headers", False, error=str(e))

    def test_input_validation(self):
        """Test input validation with malicious payloads"""
        test_cases = [
            {
                "name": "SQL Injection Attempt",
                "payload": {"test": "'; DROP TABLE users; --"},
                "should_block": True
            },
            {
                "name": "XSS Attempt",
                "payload": {"test": "<script>alert('xss')</script>"},
                "should_block": True
            },
            {
                "name": "Path Traversal Attempt",
                "payload": {"test": "../../../etc/passwd"},
                "should_block": True
            },
            {
                "name": "Valid Input",
                "payload": {"name": "John Doe", "email": "john@example.com"},
                "should_block": False
            }
        ]

        for test_case in test_cases:
            try:
                # Test with POST request to trigger validation
                response = requests.post(
                    f"{self.base_url}/api/visitors",
                    json=test_case["payload"],
                    headers={"Content-Type": "application/json"}
                )
                is_blocked = response.status_code in [400, 403]

                if is_blocked == test_case["should_block"]:
                    self.log_test_result(
                        f"Input Validation - {test_case['name']}",
                        True,
                        f"Correctly {'blocked' if is_blocked else 'allowed'} input"
                    )
                else:
                    self.log_test_result(
                        f"Input Validation - {test_case['name']}",
                        False,
                        f"Expected {'block' if test_case['should_block'] else 'allow'}, got {'block' if is_blocked else 'allow'}"
                    )

            except Exception as e:
                self.log_test_result(
                    f"Input Validation - {test_case['name']}",
                    False,
                    error=str(e)
                )

    def test_rate_limiting(self):
        """Test rate limiting functionality"""
        try:
            # Make multiple rapid requests to trigger rate limiting
            success_count = 0
            rate_limited_count = 0

            # Use threading to make concurrent requests
            def make_request():
                nonlocal success_count, rate_limited_count
                try:
                    response = requests.get(f"{self.base_url}/healthz")
                    if response.status_code == 429:
                        rate_limited_count += 1
                    elif response.status_code == 200:
                        success_count += 1
                except Exception:
                    pass

            # Create multiple threads to make concurrent requests
            threads = []
            for i in range(15):
                thread = threading.Thread(target=make_request)
                threads.append(thread)
                thread.start()

            # Wait for all threads to complete
            for thread in threads:
                thread.join()

            if rate_limited_count > 0:
                self.log_test_result(
                    "Rate Limiting",
                    True,
                    f"Rate limiting working: {success_count} allowed, {rate_limited_count} blocked"
                )
            else:
                self.log_test_result(
                    "Rate Limiting",
                    False,
                    "Rate limiting not triggered - may not be active"
                )

        except Exception as e:
            self.log_test_result("Rate Limiting", False, error=str(e))

    def test_health_endpoints(self):
        """Test enhanced health check endpoints"""
        endpoints = ["/healthz", "/health", "/ready"]

        for endpoint in endpoints:
            try:
                response = requests.get(f"{self.base_url}{endpoint}")

                if response.status_code == 200:
                    try:
                        data = response.json()

                        if endpoint == "/health":
                            # Check if comprehensive health data is returned
                            required_fields = ["status", "system", "application", "security"]
                            missing_fields = [field for field in required_fields if field not in data]

                            if not missing_fields:
                                self.log_test_result(
                                    f"Health Endpoint - {endpoint}",
                                    True,
                                    f"Comprehensive health data returned with {len(data)} fields"
                                )
                            else:
                                self.log_test_result(
                                    f"Health Endpoint - {endpoint}",
                                    False,
                                    f"Missing fields: {missing_fields}"
                                )
                        else:
                            self.log_test_result(
                                f"Health Endpoint - {endpoint}",
                                True,
                                f"Basic health check working: {data}"
                            )
                    except json.JSONDecodeError:
                        self.log_test_result(
                            f"Health Endpoint - {endpoint}",
                            False,
                            "Invalid JSON response"
                        )
                else:
                    self.log_test_result(
                        f"Health Endpoint - {endpoint}",
                        False,
                        f"Unexpected status: {response.status_code}"
                    )

            except Exception as e:
                self.log_test_result(
                    f"Health Endpoint - {endpoint}",
                    False,
                    error=str(e)
                )

    def test_security_monitoring_endpoints(self):
        """Test security monitoring endpoints"""
        endpoints = ["/security/status", "/security/events"]

        for endpoint in endpoints:
            try:
                response = requests.get(f"{self.base_url}{endpoint}")

                if response.status_code == 200:
                    try:
                        data = response.json()

                        if endpoint == "/security/status":
                            required_fields = ["total_events_24h", "blocked_ips", "severity_summary"]
                            missing_fields = [field for field in required_fields if field not in data]

                            if not missing_fields:
                                self.log_test_result(
                                    f"Security Monitoring - {endpoint}",
                                    True,
                                    f"Security stats returned: {len(data)} metrics"
                                )
                            else:
                                self.log_test_result(
                                    f"Security Monitoring - {endpoint}",
                                    False,
                                    f"Missing fields: {missing_fields}"
                                )
                        else:  # /security/events
                            if "events" in data and "total_count" in data:
                                self.log_test_result(
                                    f"Security Monitoring - {endpoint}",
                                    True,
                                    f"Security events returned: {data['total_count']} events"
                                )
                            else:
                                self.log_test_result(
                                    f"Security Monitoring - {endpoint}",
                                    False,
                                    "Missing events data structure"
                                )
                    except json.JSONDecodeError:
                        self.log_test_result(
                            f"Security Monitoring - {endpoint}",
                            False,
                            "Invalid JSON response"
                        )
                else:
                    self.log_test_result(
                        f"Security Monitoring - {endpoint}",
                        False,
                        f"Unexpected status: {response.status_code}"
                    )

            except Exception as e:
                self.log_test_result(
                    f"Security Monitoring - {endpoint}",
                    False,
                    error=str(e)
                )

    def test_pydantic_validation(self):
        """Test enhanced Pydantic model validation"""
        try:
            # Test with invalid data that should be caught by Pydantic
            invalid_payloads = [
                {"fullName": "", "idNumber": "123", "phone": "123"},  # Too short
                {"fullName": "John", "idNumber": "123456789012345678901", "phone": "123456789012345"},  # Too long
                {"fullName": "John123", "idNumber": "ABC123", "phone": "+1234567890"},  # Invalid characters
            ]

            for i, payload in enumerate(invalid_payloads):
                response = requests.post(
                    f"{self.base_url}/api/visitors",
                    json=payload,
                    headers={"Content-Type": "application/json"}
                )
                if response.status_code in [400, 422]:  # Validation error
                    self.log_test_result(
                        f"Pydantic Validation - Test {i+1}",
                        True,
                        f"Correctly rejected invalid input: {response.status_code}"
                    )
                else:
                    self.log_test_result(
                        f"Pydantic Validation - Test {i+1}",
                        False,
                        f"Should have rejected invalid input, got status: {response.status_code}"
                    )

        except Exception as e:
            self.log_test_result("Pydantic Validation", False, error=str(e))

    def run_all_tests(self):
        """Run all security tests"""
        print("🚀 Starting Phase 1 Security Implementation Tests")
        print("=" * 60)

        test_methods = [
            self.test_security_headers,
            self.test_input_validation,
            self.test_rate_limiting,
            self.test_health_endpoints,
            self.test_security_monitoring_endpoints,
            self.test_pydantic_validation
        ]

        for test_method in test_methods:
            print(f"\n🔍 Running {test_method.__name__}...")
            test_method()

        self.print_summary()

    def print_summary(self):
        """Print test summary"""
        print("\n" + "=" * 60)
        print("📊 PHASE 1 SECURITY TEST SUMMARY")
        print("=" * 60)

        passed = sum(1 for result in self.test_results if result["passed"])
        total = len(self.test_results)

        print(f"Total Tests: {total}")
        print(f"Passed: {passed}")
        print(f"Failed: {total - passed}")
        print(".1f")

        if passed == total:
            print("🎉 ALL TESTS PASSED! Phase 1 security implementation is working correctly.")
        else:
            print("⚠️  Some tests failed. Review the implementation and fix issues.")

        # Show failed tests
        failed_tests = [result for result in self.test_results if not result["passed"]]
        if failed_tests:
            print("\n❌ Failed Tests:")
            for test in failed_tests:
                print(f"   - {test['test']}: {test['error'] or test['details']}")

def main():
    """Main test runner"""
    base_url = os.getenv("TEST_BASE_URL", "http://localhost:8000")

    test_suite = SecurityTestSuite(base_url)
    test_suite.run_all_tests()

if __name__ == "__main__":
    main()
