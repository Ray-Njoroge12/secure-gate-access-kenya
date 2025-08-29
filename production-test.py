#!/usr/bin/env python3
"""
SecureGate Kenya - Production Testing Report
Comprehensive system functionality verification
"""

import json
import requests
from datetime import datetime
from pathlib import Path

class ProductionTester:
    def __init__(self):
        self.backend_url = "http://127.0.0.1:8000"
        self.frontend_url = "http://127.0.0.1:3000"
        self.test_results = {
            "timestamp": datetime.now().isoformat(),
            "system_tests": {},
            "api_tests": {},
            "frontend_tests": {},
            "integration_tests": {},
            "performance_tests": {}
        }

    def log_test(self, category, test_name, result, details=None):
        """Log test result"""
        if category not in self.test_results:
            self.test_results[category] = {}

        self.test_results[category][test_name] = {
            "result": "PASS" if result else "FAIL",
            "details": details or "",
            "timestamp": datetime.now().isoformat()
        }

        status = "✅ PASS" if result else "❌ FAIL"
        print(f"{status} {category}.{test_name}: {details or 'Completed'}")

    def test_backend_health(self):
        """Test backend health endpoint"""
        try:
            response = requests.get(f"{self.backend_url}/healthz", timeout=10)
            result = response.status_code == 200
            details = f"Status: {response.status_code}, Response: {response.json()}"
            self.log_test("system_tests", "backend_health", result, details)
            return result
        except Exception as e:
            self.log_test("system_tests", "backend_health", False, str(e))
            return False

    def test_api_documentation(self):
        """Test API documentation accessibility"""
        try:
            response = requests.get(f"{self.backend_url}/docs", timeout=10)
            result = response.status_code == 200
            details = f"API docs accessible, content length: {len(response.text)}"
            self.log_test("api_tests", "api_documentation", result, details)
            return result
        except Exception as e:
            self.log_test("api_tests", "api_documentation", False, str(e))
            return False

    def test_visitor_registration(self):
        """Test visitor registration functionality"""
        try:
            payload = {
                "visitor": {
                    "fullName": "Test User",
                    "idNumber": "12345678",
                    "phone": "+254700000000"
                }
            }
            response = requests.post(
                f"{self.backend_url}/api/visitors/register",
                json=payload,
                timeout=10
            )
            result = response.status_code == 200
            if result:
                data = response.json()
                details = f"Visitor registered with ID: {data['visitor']['id']}"
            else:
                details = f"Registration failed: {response.text}"
            self.log_test("api_tests", "visitor_registration", result, details)
            return result
        except Exception as e:
            self.log_test("api_tests", "visitor_registration", False, str(e))
            return False

    def test_access_code_verification(self):
        """Test access code verification"""
        try:
            payload = {"pin": "1234", "qr_token": "test"}
            response = requests.post(
                f"{self.backend_url}/api/access-codes/verify",
                json=payload,
                timeout=10
            )
            result = response.status_code == 200
            if result:
                data = response.json()
                details = f"Verification response: {data.get('reason', 'processed')}"
            else:
                details = f"Verification failed: {response.text}"
            self.log_test("api_tests", "access_code_verification", result, details)
            return result
        except Exception as e:
            self.log_test("api_tests", "access_code_verification", False, str(e))
            return False

    def test_metrics_endpoint(self):
        """Test Prometheus metrics endpoint"""
        try:
            response = requests.get(f"{self.backend_url}/metrics", timeout=10)
            result = response.status_code == 200
            details = f"Metrics data length: {len(response.text)} bytes"
            self.log_test("api_tests", "metrics_endpoint", result, details)
            return result
        except Exception as e:
            self.log_test("api_tests", "metrics_endpoint", False, str(e))
            return False

    def test_frontend_accessibility(self):
        """Test frontend application accessibility"""
        try:
            response = requests.get(self.frontend_url, timeout=10)
            result = response.status_code == 200
            if result:
                is_react_app = "Secure Gate Access Kenya" in response.text
                details = f"React app loaded: {is_react_app}"
                result = result and is_react_app
            else:
                details = f"Frontend not accessible: {response.status_code}"
            self.log_test("frontend_tests", "frontend_accessibility", result, details)
            return result
        except Exception as e:
            self.log_test("frontend_tests", "frontend_accessibility", False, str(e))
            return False

    def test_security_headers(self):
        """Test security headers on all endpoints"""
        endpoints = [
            f"{self.backend_url}/healthz",
            f"{self.backend_url}/docs",
            self.frontend_url
        ]

        security_headers = [
            'x-content-type-options',
            'x-frame-options',
            'x-xss-protection',
            'referrer-policy'
        ]

        all_passed = True
        for endpoint in endpoints:
            try:
                response = requests.get(endpoint, timeout=10)
                missing_headers = []
                for header in security_headers:
                    if header not in response.headers:
                        missing_headers.append(header)

                if missing_headers:
                    details = f"Missing security headers: {', '.join(missing_headers)}"
                    self.log_test("security_tests", f"security_headers_{endpoint.split('/')[-1]}", False, details)
                    all_passed = False
                else:
                    details = "All security headers present"
                    self.log_test("security_tests", f"security_headers_{endpoint.split('/')[-1]}", True, details)
            except Exception as e:
                self.log_test("security_tests", f"security_headers_{endpoint.split('/')[-1]}", False, str(e))
                all_passed = False

        return all_passed

    def test_database_connectivity(self):
        """Test database connectivity through API"""
        try:
            # Test visitor registration which requires DB connection
            payload = {
                "visitor": {
                    "fullName": "DB Test User",
                    "idNumber": "87654321",
                    "phone": "+254711111111"
                }
            }
            response = requests.post(
                f"{self.backend_url}/api/visitors/register",
                json=payload,
                timeout=10
            )
            result = response.status_code == 200
            if result:
                data = response.json()
                details = f"Database connection confirmed - visitor created with ID: {data['visitor']['id']}"
            else:
                details = f"Database connection failed: {response.text}"
            self.log_test("integration_tests", "database_connectivity", result, details)
            return result
        except Exception as e:
            self.log_test("integration_tests", "database_connectivity", False, str(e))
            return False

    def generate_report(self):
        """Generate comprehensive test report"""
        # Calculate summary statistics
        total_tests = 0
        passed_tests = 0
        failed_tests = 0

        for category, tests in self.test_results.items():
            if isinstance(tests, dict):
                for test_name, test_data in tests.items():
                    if isinstance(test_data, dict) and 'result' in test_data:
                        total_tests += 1
                        if test_data['result'] == 'PASS':
                            passed_tests += 1
                        else:
                            failed_tests += 1

        # Create summary
        summary = {
            "test_summary": {
                "total_tests": total_tests,
                "passed_tests": passed_tests,
                "failed_tests": failed_tests,
                "success_rate": f"{(passed_tests/total_tests*100):.1f}%" if total_tests > 0 else "0%"
            },
            "system_status": "PRODUCTION READY" if failed_tests == 0 else "REQUIRES ATTENTION",
            "tested_endpoints": {
                "backend_health": f"{self.backend_url}/healthz",
                "api_docs": f"{self.backend_url}/docs",
                "visitor_registration": f"{self.backend_url}/api/visitors/register",
                "access_verification": f"{self.backend_url}/api/access-codes/verify",
                "metrics": f"{self.backend_url}/metrics",
                "frontend": self.frontend_url
            }
        }

        # Save detailed report
        report_path = Path("PRODUCTION_TEST_REPORT.json")
        with open(report_path, 'w') as f:
            json.dump({**summary, **self.test_results}, f, indent=2)

        return summary, self.test_results

    def run_all_tests(self):
        """Run comprehensive test suite"""
        print("🚀 Starting SecureGate Kenya Production Testing")
        print("=" * 60)

        # System Tests
        print("\n📊 SYSTEM TESTS")
        self.test_backend_health()

        # API Tests
        print("\n🔗 API TESTS")
        self.test_api_documentation()
        self.test_visitor_registration()
        self.test_access_code_verification()
        self.test_metrics_endpoint()

        # Frontend Tests
        print("\n🌐 FRONTEND TESTS")
        self.test_frontend_accessibility()

        # Security Tests
        print("\n🔒 SECURITY TESTS")
        self.test_security_headers()

        # Integration Tests
        print("\n🔄 INTEGRATION TESTS")
        self.test_database_connectivity()

        # Generate Report
        print("\n📋 GENERATING TEST REPORT")
        summary, detailed_results = self.generate_report()

        print("\n" + "=" * 60)
        print("🎯 PRODUCTION TEST RESULTS")
        print("=" * 60)

        print(f"Total Tests: {summary['test_summary']['total_tests']}")
        print(f"Passed: {summary['test_summary']['passed_tests']}")
        print(f"Failed: {summary['test_summary']['failed_tests']}")
        print(f"Success Rate: {summary['test_summary']['success_rate']}")
        print(f"System Status: {summary['system_status']}")

        if summary['system_status'] == 'PRODUCTION READY':
            print("\n✅ ALL SYSTEMS OPERATIONAL!")
            print("🌐 Frontend: http://127.0.0.1:3000")
            print("🔗 Backend API: http://127.0.0.1:8000")
            print("📊 Health Check: http://127.0.0.1:8000/healthz")
            print("📋 API Documentation: http://127.0.0.1:8000/docs")
        else:
            print("\n⚠️  SOME TESTS FAILED - REVIEW REQUIRED")

        print(f"\n📄 Detailed report saved to: PRODUCTION_TEST_REPORT.json")

        return summary['system_status'] == 'PRODUCTION READY'

def main():
    tester = ProductionTester()
    success = tester.run_all_tests()
    return 0 if success else 1

if __name__ == "__main__":
    exit(main())
