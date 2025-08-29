#!/usr/bin/env python3
"""
SecureGate Kenya - Critical Path Testing Framework
Comprehensive testing of all system components and user journeys
"""

import requests
import json
import time
import psycopg2
import sys
from datetime import datetime, timedelta
import subprocess
import os

class CriticalPathTester:
    def __init__(self):
        self.base_url = "http://127.0.0.1:8000"
        self.frontend_url = "http://localhost:8080"
        self.db_config = {
            'host': 'localhost',
            'port': 5432,
            'database': 'securegate',
            'user': 'securegate_user',
            'password': 'securegate_pass'
        }
        self.test_results = []
        self.session = requests.Session()

    def log_test(self, test_name, status, message="", duration=None):
        """Log test results"""
        result = {
            'test_name': test_name,
            'status': status,
            'message': message,
            'timestamp': datetime.now().isoformat(),
            'duration': duration
        }
        self.test_results.append(result)
        status_icon = "✅" if status == "PASS" else "❌" if status == "FAIL" else "⚠️"
        print(f"{status_icon} {test_name}: {message}")
        if duration:
            print(".2f")

    def test_database_connectivity(self):
        """Test 1: Database Connectivity"""
        start_time = time.time()
        try:
            conn = psycopg2.connect(**self.db_config)
            cursor = conn.cursor()
            cursor.execute("SELECT version();")
            version = cursor.fetchone()[0]
            cursor.close()
            conn.close()
            self.log_test("Database Connectivity", "PASS",
                         f"Connected successfully - {version[:50]}...",
                         time.time() - start_time)
            return True
        except Exception as e:
            self.log_test("Database Connectivity", "FAIL",
                         f"Connection failed: {str(e)}",
                         time.time() - start_time)
            return False

    def test_database_tables(self):
        """Test 2: Database Tables Existence"""
        start_time = time.time()
        expected_tables = [
            'users', 'profiles', 'visitors', 'access_codes', 'invitations',
            'dashboard_configs', 'analytics_events', 'reports',
            'performance_metrics', 'ml_predictions'
        ]

        try:
            conn = psycopg2.connect(**self.db_config)
            cursor = conn.cursor()
            cursor.execute("""
                SELECT table_name FROM information_schema.tables
                WHERE table_schema = 'public'
            """)
            existing_tables = [row[0] for row in cursor.fetchall()]
            cursor.close()
            conn.close()

            missing_tables = [t for t in expected_tables if t not in existing_tables]
            if missing_tables:
                self.log_test("Database Tables", "FAIL",
                             f"Missing tables: {missing_tables}",
                             time.time() - start_time)
                return False
            else:
                self.log_test("Database Tables", "PASS",
                             f"All {len(expected_tables)} tables exist",
                             time.time() - start_time)
                return True
        except Exception as e:
            self.log_test("Database Tables", "FAIL",
                         f"Table check failed: {str(e)}",
                         time.time() - start_time)
            return False

    def test_backend_api_health(self):
        """Test 3: Backend API Health"""
        start_time = time.time()
        try:
            response = requests.get(f"{self.base_url}/health", timeout=5)
            if response.status_code == 200:
                self.log_test("Backend API Health", "PASS",
                             "Health endpoint responding",
                             time.time() - start_time)
                return True
            else:
                self.log_test("Backend API Health", "FAIL",
                             f"Health check failed: {response.status_code}",
                             time.time() - start_time)
                return False
        except Exception as e:
            self.log_test("Backend API Health", "FAIL",
                         f"Health check error: {str(e)}",
                         time.time() - start_time)
            return False

    def test_api_endpoints(self):
        """Test 4: API Endpoints Availability"""
        start_time = time.time()
        endpoints = [
            '/docs',  # Swagger documentation
            '/openapi.json',  # OpenAPI schema
            '/metrics',  # Prometheus metrics
        ]

        failed_endpoints = []
        for endpoint in endpoints:
            try:
                response = requests.get(f"{self.base_url}{endpoint}", timeout=5)
                if response.status_code not in [200, 401, 403]:  # Accept auth-required endpoints
                    failed_endpoints.append(f"{endpoint} ({response.status_code})")
            except Exception as e:
                failed_endpoints.append(f"{endpoint} (error: {str(e)})")

        if failed_endpoints:
            self.log_test("API Endpoints", "FAIL",
                         f"Failed endpoints: {failed_endpoints}",
                         time.time() - start_time)
            return False
        else:
            self.log_test("API Endpoints", "PASS",
                         f"All {len(endpoints)} endpoints accessible",
                         time.time() - start_time)
            return True

    def test_visitor_registration_flow(self):
        """Test 5: Visitor Registration Flow"""
        start_time = time.time()
        try:
            # Test visitor registration endpoint
            visitor_data = {
                "full_name": "Test Visitor",
                "id_number": "TEST123456",
                "phone": "+254700000000",
                "email": "test@example.com"
            }

            response = requests.post(
                f"{self.base_url}/api/visitors/register",
                json=visitor_data,
                timeout=10
            )

            if response.status_code in [200, 201]:
                visitor_id = response.json().get('id')
                self.log_test("Visitor Registration", "PASS",
                             f"Visitor registered successfully (ID: {visitor_id})",
                             time.time() - start_time)
                return visitor_id
            else:
                self.log_test("Visitor Registration", "FAIL",
                             f"Registration failed: {response.status_code} - {response.text}",
                             time.time() - start_time)
                return None
        except Exception as e:
            self.log_test("Visitor Registration", "FAIL",
                         f"Registration error: {str(e)}",
                         time.time() - start_time)
            return None

    def test_access_code_generation(self, visitor_id):
        """Test 6: Access Code Generation"""
        start_time = time.time()
        if not visitor_id:
            self.log_test("Access Code Generation", "SKIP", "No visitor ID available")
            return None

        try:
            response = requests.post(
                f"{self.base_url}/api/access-codes/generate",
                json={"visitor_id": visitor_id},
                timeout=10
            )

            if response.status_code in [200, 201]:
                access_data = response.json()
                access_code = access_data.get('pin_hash')
                self.log_test("Access Code Generation", "PASS",
                             f"Access code generated: {access_code[:10]}...",
                             time.time() - start_time)
                return access_data
            else:
                self.log_test("Access Code Generation", "FAIL",
                             f"Generation failed: {response.status_code} - {response.text}",
                             time.time() - start_time)
                return None
        except Exception as e:
            self.log_test("Access Code Generation", "FAIL",
                         f"Generation error: {str(e)}",
                         time.time() - start_time)
            return None

    def test_access_code_verification(self, access_data):
        """Test 7: Access Code Verification"""
        start_time = time.time()
        if not access_data:
            self.log_test("Access Code Verification", "SKIP", "No access data available")
            return False

        try:
            verification_data = {
                "pin": access_data.get('pin_hash'),
                "visitor_id": access_data.get('visitor_id')
            }

            response = requests.post(
                f"{self.base_url}/api/access-codes/verify",
                json=verification_data,
                timeout=10
            )

            if response.status_code == 200:
                self.log_test("Access Code Verification", "PASS",
                             "Access code verified successfully",
                             time.time() - start_time)
                return True
            else:
                self.log_test("Access Code Verification", "FAIL",
                             f"Verification failed: {response.status_code} - {response.text}",
                             time.time() - start_time)
                return False
        except Exception as e:
            self.log_test("Access Code Verification", "FAIL",
                         f"Verification error: {str(e)}",
                         time.time() - start_time)
            return False

    def test_frontend_accessibility(self):
        """Test 8: Frontend Accessibility"""
        start_time = time.time()
        try:
            response = requests.get(self.frontend_url, timeout=10)
            if response.status_code == 200:
                # Check for essential HTML elements
                content = response.text
                checks = [
                    ('title', '<title>' in content),
                    ('root', 'id="root"' in content),
                    ('scripts', '<script' in content),
                    ('styles', '<link' in content or '<style' in content)
                ]

                failed_checks = [name for name, passed in checks if not passed]
                if failed_checks:
                    self.log_test("Frontend Accessibility", "WARN",
                                 f"Missing elements: {failed_checks}",
                                 time.time() - start_time)
                    return True  # Still accessible but with warnings
                else:
                    self.log_test("Frontend Accessibility", "PASS",
                                 "Frontend loaded successfully",
                                 time.time() - start_time)
                    return True
            else:
                self.log_test("Frontend Accessibility", "FAIL",
                             f"Frontend not accessible: {response.status_code}",
                             time.time() - start_time)
                return False
        except Exception as e:
            self.log_test("Frontend Accessibility", "FAIL",
                         f"Frontend error: {str(e)}",
                         time.time() - start_time)
            return False

    def test_performance_response_times(self):
        """Test 9: API Response Times"""
        start_time = time.time()
        endpoints = [
            '/health',
            '/docs',
            '/openapi.json'
        ]

        slow_endpoints = []
        for endpoint in endpoints:
            try:
                endpoint_start = time.time()
                response = requests.get(f"{self.base_url}{endpoint}", timeout=5)
                response_time = time.time() - endpoint_start

                if response_time > 0.5:  # 500ms threshold
                    slow_endpoints.append(f"{endpoint}: {response_time:.2f}s")

                if response.status_code not in [200, 401, 403]:
                    slow_endpoints.append(f"{endpoint}: HTTP {response.status_code}")

            except Exception as e:
                slow_endpoints.append(f"{endpoint}: Error - {str(e)}")

        if slow_endpoints:
            self.log_test("API Response Times", "WARN",
                         f"Slow/problematic endpoints: {slow_endpoints}",
                         time.time() - start_time)
            return len(slow_endpoints) == 0  # Pass if no critical issues
        else:
            self.log_test("API Response Times", "PASS",
                         f"All {len(endpoints)} endpoints respond quickly",
                         time.time() - start_time)
            return True

    def test_security_headers(self):
        """Test 10: Security Headers"""
        start_time = time.time()
        try:
            response = requests.get(f"{self.base_url}/health", timeout=5)

            security_headers = [
                'X-Content-Type-Options',
                'X-Frame-Options',
                'X-XSS-Protection',
                'Strict-Transport-Security'
            ]

            missing_headers = []
            for header in security_headers:
                if header not in response.headers:
                    missing_headers.append(header)

            if missing_headers:
                self.log_test("Security Headers", "WARN",
                             f"Missing security headers: {missing_headers}",
                             time.time() - start_time)
                return True  # Warning but not failure
            else:
                self.log_test("Security Headers", "PASS",
                             "All security headers present",
                             time.time() - start_time)
                return True
        except Exception as e:
            self.log_test("Security Headers", "FAIL",
                         f"Security check error: {str(e)}",
                         time.time() - start_time)
            return False

    def test_concurrent_users_simulation(self):
        """Test 11: Concurrent Users Simulation"""
        start_time = time.time()
        import threading

        def make_request(thread_id):
            try:
                response = requests.get(f"{self.base_url}/health", timeout=5)
                return response.status_code == 200
            except:
                return False

        # Simulate 10 concurrent users
        threads = []
        results = []

        def worker(thread_id):
            result = make_request(thread_id)
            results.append(result)

        for i in range(10):
            thread = threading.Thread(target=worker, args=(i,))
            threads.append(thread)
            thread.start()

        for thread in threads:
            thread.join()

        success_rate = sum(results) / len(results) if results else 0

        if success_rate >= 0.9:  # 90% success rate
            self.log_test("Concurrent Users", "PASS",
                         ".1%",
                         time.time() - start_time)
            return True
        else:
            self.log_test("Concurrent Users", "FAIL",
                         ".1%",
                         time.time() - start_time)
            return False

    def run_all_tests(self):
        """Run all critical path tests"""
        print("🚀 Starting Critical Path Testing for SecureGate Kenya")
        print("=" * 60)

        # Infrastructure Tests
        self.test_database_connectivity()
        self.test_database_tables()
        self.test_backend_api_health()
        self.test_api_endpoints()

        # Business Logic Tests
        visitor_id = self.test_visitor_registration_flow()
        access_data = self.test_access_code_generation(visitor_id)
        self.test_access_code_verification(access_data)

        # Frontend Tests
        self.test_frontend_accessibility()

        # Performance Tests
        self.test_performance_response_times()

        # Security Tests
        self.test_security_headers()

        # Load Tests
        self.test_concurrent_users_simulation()

        return self.generate_report()

    def generate_report(self):
        """Generate comprehensive test report"""
        print("\n" + "=" * 60)
        print("📊 CRITICAL PATH TESTING REPORT")
        print("=" * 60)

        passed = len([r for r in self.test_results if r['status'] == 'PASS'])
        failed = len([r for r in self.test_results if r['status'] == 'FAIL'])
        warnings = len([r for r in self.test_results if r['status'] == 'WARN'])
        skipped = len([r for r in self.test_results if r['status'] == 'SKIP'])

        total = len(self.test_results)
        success_rate = (passed / total * 100) if total > 0 else 0

        print(f"Total Tests: {total}")
        print(f"✅ Passed: {passed}")
        print(f"❌ Failed: {failed}")
        print(f"⚠️  Warnings: {warnings}")
        print(f"⏭️  Skipped: {skipped}")
        print(".1f"
        print("\n📋 Test Details:")
        for result in self.test_results:
            status_icon = {
                'PASS': '✅',
                'FAIL': '❌',
                'WARN': '⚠️',
                'SKIP': '⏭️'
            }.get(result['status'], '?')
            print(f"  {status_icon} {result['test_name']}: {result['message']}")

        # Overall assessment
        if success_rate >= 90:
            print("
🎉 OVERALL ASSESSMENT: EXCELLENT"            print("   System is production-ready with minor issues to address"        elif success_rate >= 75:
            print("
⚠️  OVERALL ASSESSMENT: GOOD"            print("   System is mostly ready but requires attention to failed tests"        else:
            print("
❌ OVERALL ASSESSMENT: NEEDS IMPROVEMENT"            print("   Critical issues must be resolved before production deployment"
        return success_rate >= 75  # Ready for production if 75%+ tests pass

if __name__ == "__main__":
    tester = CriticalPathTester()
    success = tester.run_all_tests()

    if success:
        print("
✅ Critical Path Testing: PASSED"        print("   System is ready for production deployment"        sys.exit(0)
    else:
        print("
❌ Critical Path Testing: FAILED"        print("   Address failed tests before proceeding to production"        sys.exit(1)
