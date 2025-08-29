#!/usr/bin/env python3
"""
SecureGate Backend - Comprehensive Analysis and Testing Suite
Deep analysis of backend architecture, security, and performance
"""

import os
import sys
import json
import time
import requests
import threading
import concurrent.futures
from datetime import datetime, timedelta
from pathlib import Path
from typing import Dict, List, Any
import hashlib
import secrets

class BackendAnalyzer:
    def __init__(self):
        self.backend_url = "http://127.0.0.1:8000"
        self.test_results = {
            "timestamp": datetime.now().isoformat(),
            "analysis_categories": {},
            "security_findings": [],
            "performance_metrics": {},
            "architecture_issues": [],
            "recommendations": []
        }

    def log_finding(self, category: str, severity: str, title: str, description: str, recommendation: str = ""):
        """Log a finding in the analysis"""
        finding = {
            "category": category,
            "severity": severity,
            "title": title,
            "description": description,
            "recommendation": recommendation,
            "timestamp": datetime.now().isoformat()
        }

        if category not in self.test_results["analysis_categories"]:
            self.test_results["analysis_categories"][category] = []

        self.test_results["analysis_categories"][category].append(finding)

        if severity in ["HIGH", "CRITICAL"]:
            self.test_results["security_findings"].append(finding)

    def analyze_security_headers(self):
        """Analyze security headers implementation"""
        print("🔒 Analyzing Security Headers...")

        endpoints = [
            f"{self.backend_url}/healthz",
            f"{self.backend_url}/docs",
            f"{self.backend_url}/metrics"
        ]

        required_headers = {
            'X-Content-Type-Options': 'nosniff',
            'X-Frame-Options': 'DENY',
            'X-XSS-Protection': '1; mode=block',
            'Referrer-Policy': 'strict-origin-when-cross-origin',
            'Content-Security-Policy': None  # Should exist
        }

        for endpoint in endpoints:
            try:
                response = requests.get(endpoint, timeout=10)
                missing_headers = []
                incorrect_headers = []

                for header, expected_value in required_headers.items():
                    if header not in response.headers:
                        missing_headers.append(header)
                    elif expected_value and response.headers[header] != expected_value:
                        incorrect_headers.append(f"{header}: expected '{expected_value}', got '{response.headers[header]}'")

                if missing_headers:
                    self.log_finding(
                        "security_headers",
                        "HIGH",
                        f"Missing Security Headers on {endpoint}",
                        f"Missing headers: {', '.join(missing_headers)}",
                        "Ensure all security headers are properly configured in SecurityHeadersMiddleware"
                    )

                if incorrect_headers:
                    self.log_finding(
                        "security_headers",
                        "MEDIUM",
                        f"Incorrect Security Headers on {endpoint}",
                        f"Incorrect headers: {', '.join(incorrect_headers)}",
                        "Review and correct security header values"
                    )

            except Exception as e:
                self.log_finding(
                    "security_headers",
                    "MEDIUM",
                    f"Security Headers Test Failed for {endpoint}",
                    str(e),
                    "Ensure endpoint is accessible and properly configured"
                )

    def analyze_rate_limiting(self):
        """Test rate limiting implementation"""
        print("🚦 Analyzing Rate Limiting...")

        # Test basic rate limiting
        responses = []
        for i in range(15):  # Exceed typical rate limits
            try:
                response = requests.get(f"{self.backend_url}/healthz", timeout=5)
                responses.append(response.status_code)
                time.sleep(0.1)  # Small delay to avoid overwhelming
            except:
                responses.append(500)

        rate_limited_responses = sum(1 for code in responses if code == 429)

        if rate_limited_responses == 0:
            self.log_finding(
                "rate_limiting",
                "MEDIUM",
                "No Rate Limiting Detected",
                "System did not enforce rate limits during stress test",
                "Implement proper rate limiting to prevent abuse"
            )
        elif rate_limited_responses < 3:
            self.log_finding(
                "rate_limiting",
                "LOW",
                "Weak Rate Limiting",
                f"Only {rate_limited_responses} requests were rate limited out of 15",
                "Consider strengthening rate limiting rules"
            )

    def analyze_encryption_security(self):
        """Analyze encryption and data protection"""
        print("🔐 Analyzing Encryption Security...")

        # Test data encryption/decryption
        test_data = "Test Visitor Data"
        try:
            # This would require access to the encryption functions
            # For now, we'll test the configuration
            response = requests.get(f"{self.backend_url}/healthz", timeout=10)

            # Check if encryption key is properly configured
            if "dev_app_encryption_key" in str(response.headers):
                self.log_finding(
                    "encryption",
                    "CRITICAL",
                    "Weak Encryption Key in Production",
                    "Default development encryption key detected in headers or responses",
                    "Use strong, randomly generated encryption keys in production"
                )

        except Exception as e:
            self.log_finding(
                "encryption",
                "MEDIUM",
                "Encryption Analysis Failed",
                str(e),
                "Ensure encryption functions are properly implemented and tested"
            )

    def analyze_database_security(self):
        """Analyze database security and configuration"""
        print("🗄️ Analyzing Database Security...")

        # Test for SQL injection vulnerabilities (basic test)
        malicious_payloads = [
            {"visitor": {"fullName": "Test' OR '1'='1", "idNumber": "12345678", "phone": "+254700000000"}},
            {"visitor": {"fullName": "Test", "idNumber": "12345678'; DROP TABLE visitors; --", "phone": "+254700000000"}}
        ]

        for payload in malicious_payloads:
            try:
                response = requests.post(
                    f"{self.backend_url}/api/visitors/register",
                    json=payload,
                    timeout=10
                )

                if response.status_code == 200:
                    self.log_finding(
                        "database_security",
                        "CRITICAL",
                        "Potential SQL Injection Vulnerability",
                        f"Malicious payload accepted: {payload}",
                        "Implement proper input validation and parameterized queries"
                    )
                elif response.status_code == 422:  # Pydantic validation error
                    # This is actually good - validation prevented the attack
                    pass
                else:
                    # Other errors are acceptable
                    pass

            except Exception as e:
                self.log_finding(
                    "database_security",
                    "LOW",
                    "Database Security Test Error",
                    str(e),
                    "Review error handling and logging"
                )

    def analyze_performance(self):
        """Analyze system performance"""
        print("⚡ Analyzing Performance...")

        # Test response times
        response_times = []
        for i in range(10):
            try:
                start_time = time.time()
                response = requests.get(f"{self.backend_url}/healthz", timeout=10)
                end_time = time.time()
                response_times.append(end_time - start_time)
            except:
                response_times.append(10.0)  # Timeout value

        avg_response_time = sum(response_times) / len(response_times)
        max_response_time = max(response_times)

        if avg_response_time > 1.0:
            self.log_finding(
                "performance",
                "MEDIUM",
                "Slow Average Response Time",
                ".2f",
                "Optimize database queries and implement caching"
            )

        if max_response_time > 5.0:
            self.log_finding(
                "performance",
                "HIGH",
                "High Maximum Response Time",
                ".2f",
                "Investigate and fix performance bottlenecks"
            )

        self.test_results["performance_metrics"] = {
            "avg_response_time": avg_response_time,
            "max_response_time": max_response_time,
            "total_requests": len(response_times)
        }

    def analyze_error_handling(self):
        """Analyze error handling and responses"""
        print("🚨 Analyzing Error Handling...")

        # Test various error scenarios
        error_tests = [
            (f"{self.backend_url}/api/nonexistent", "Non-existent endpoint"),
            (f"{self.backend_url}/api/visitors/register", "Invalid payload", {"invalid": "data"}),
        ]

        for test_url, description, payload in error_tests:
            try:
                if payload:
                    response = requests.post(test_url, json=payload, timeout=10)
                else:
                    response = requests.get(test_url, timeout=10)

                if response.status_code >= 500:
                    self.log_finding(
                        "error_handling",
                        "HIGH",
                        f"Server Error for {description}",
                        f"Status: {response.status_code}, Response: {response.text[:200]}",
                        "Implement proper error handling and logging"
                    )
                elif response.status_code == 404 and "nonexistent" in test_url:
                    # 404 is expected for non-existent endpoints
                    pass
                elif response.status_code not in [200, 201, 400, 401, 403, 422]:
                    self.log_finding(
                        "error_handling",
                        "MEDIUM",
                        f"Unexpected Status Code for {description}",
                        f"Status: {response.status_code}",
                        "Review API response codes and ensure consistency"
                    )

            except Exception as e:
                self.log_finding(
                    "error_handling",
                    "MEDIUM",
                    f"Error Handling Test Failed for {description}",
                    str(e),
                    "Improve error handling and resilience"
                )

    def analyze_api_design(self):
        """Analyze API design and structure"""
        print("🔧 Analyzing API Design...")

        # Test API documentation
        try:
            response = requests.get(f"{self.backend_url}/docs", timeout=10)
            if response.status_code != 200:
                self.log_finding(
                    "api_design",
                    "MEDIUM",
                    "API Documentation Unavailable",
                    f"Docs endpoint returned {response.status_code}",
                    "Ensure API documentation is accessible and up-to-date"
                )
        except Exception as e:
            self.log_finding(
                "api_design",
                "MEDIUM",
                "API Documentation Error",
                str(e),
                "Fix API documentation endpoint"
            )

        # Test OpenAPI schema
        try:
            response = requests.get(f"{self.backend_url}/openapi.json", timeout=10)
            if response.status_code == 200:
                schema = response.json()
                if "paths" not in schema or len(schema["paths"]) < 5:
                    self.log_finding(
                        "api_design",
                        "LOW",
                        "Limited API Coverage",
                        f"Only {len(schema.get('paths', {}))} endpoints documented",
                        "Expand API coverage and documentation"
                    )
            else:
                self.log_finding(
                    "api_design",
                    "MEDIUM",
                    "OpenAPI Schema Unavailable",
                    f"Schema endpoint returned {response.status_code}",
                    "Ensure OpenAPI schema is properly generated"
                )
        except Exception as e:
            self.log_finding(
                "api_design",
                "LOW",
                "OpenAPI Schema Error",
                str(e),
                "Review OpenAPI configuration"
            )

    def analyze_authentication(self):
        """Analyze authentication and authorization"""
        print("🔑 Analyzing Authentication...")

        # Test unauthenticated access to protected endpoints
        protected_endpoints = [
            f"{self.backend_url}/api/analytics/dashboard",
            f"{self.backend_url}/api/visitors/list",  # Assuming this exists
        ]

        for endpoint in protected_endpoints:
            try:
                response = requests.get(endpoint, timeout=10)
                if response.status_code not in [401, 403]:
                    self.log_finding(
                        "authentication",
                        "HIGH",
                        f"Unauthenticated Access to Protected Endpoint",
                        f"{endpoint} returned {response.status_code} without authentication",
                        "Implement proper authentication checks on all protected endpoints"
                    )
            except Exception as e:
                # Endpoint might not exist, which is fine
                pass

    def analyze_monitoring(self):
        """Analyze monitoring and observability"""
        print("📊 Analyzing Monitoring...")

        # Test metrics endpoint
        try:
            response = requests.get(f"{self.backend_url}/metrics", timeout=10)
            if response.status_code != 200:
                self.log_finding(
                    "monitoring",
                    "MEDIUM",
                    "Metrics Endpoint Unavailable",
                    f"Metrics endpoint returned {response.status_code}",
                    "Ensure Prometheus metrics are properly configured"
                )
            else:
                metrics_content = response.text
                if len(metrics_content) < 100:
                    self.log_finding(
                        "monitoring",
                        "LOW",
                        "Limited Metrics Coverage",
                        f"Metrics response is only {len(metrics_content)} characters",
                        "Expand monitoring coverage with more metrics"
                    )
        except Exception as e:
            self.log_finding(
                "monitoring",
                "MEDIUM",
                "Metrics Collection Error",
                str(e),
                "Fix metrics endpoint and collection"
            )

    def generate_recommendations(self):
        """Generate improvement recommendations"""
        print("💡 Generating Recommendations...")

        # Architecture recommendations
        self.test_results["recommendations"].extend([
            {
                "category": "architecture",
                "priority": "HIGH",
                "title": "Implement API Versioning",
                "description": "Add API versioning to prevent breaking changes",
                "implementation": "Use URL path versioning (/api/v1/, /api/v2/) or header versioning"
            },
            {
                "category": "architecture",
                "priority": "MEDIUM",
                "title": "Add Request/Response Caching",
                "description": "Implement caching for frequently accessed data",
                "implementation": "Use Redis or in-memory cache for visitor data and access codes"
            },
            {
                "category": "architecture",
                "priority": "HIGH",
                "title": "Implement Database Connection Pooling",
                "description": "Add connection pooling for better database performance",
                "implementation": "Configure SQLAlchemy with connection pool settings"
            }
        ])

        # Security recommendations
        self.test_results["recommendations"].extend([
            {
                "category": "security",
                "priority": "CRITICAL",
                "title": "Implement JWT Authentication",
                "description": "Add proper JWT-based authentication system",
                "implementation": "Use python-jose for token generation and validation"
            },
            {
                "category": "security",
                "priority": "HIGH",
                "title": "Add Input Validation Middleware",
                "description": "Implement comprehensive input validation",
                "implementation": "Use pydantic models and custom validation middleware"
            },
            {
                "category": "security",
                "priority": "HIGH",
                "title": "Implement Audit Logging",
                "description": "Add comprehensive audit logging for security events",
                "implementation": "Log all authentication attempts, data access, and system changes"
            }
        ])

        # Performance recommendations
        self.test_results["recommendations"].extend([
            {
                "category": "performance",
                "priority": "MEDIUM",
                "title": "Add Database Indexing",
                "description": "Optimize database queries with proper indexing",
                "implementation": "Add indexes on frequently queried fields (visitor_id, expires_at, etc.)"
            },
            {
                "category": "performance",
                "priority": "MEDIUM",
                "title": "Implement Async Database Operations",
                "description": "Use async database operations for better performance",
                "implementation": "Migrate to async SQLAlchemy and FastAPI async endpoints"
            },
            {
                "category": "performance",
                "priority": "LOW",
                "title": "Add Response Compression",
                "description": "Implement gzip compression for API responses",
                "implementation": "Add compression middleware to FastAPI"
            }
        ])

    def run_comprehensive_analysis(self):
        """Run all analysis functions"""
        print("🔍 Starting Comprehensive Backend Analysis")
        print("=" * 60)

        analysis_functions = [
            self.analyze_security_headers,
            self.analyze_rate_limiting,
            self.analyze_encryption_security,
            self.analyze_database_security,
            self.analyze_performance,
            self.analyze_error_handling,
            self.analyze_api_design,
            self.analyze_authentication,
            self.analyze_monitoring,
        ]

        for func in analysis_functions:
            try:
                func()
                time.sleep(0.5)  # Brief pause between tests
            except Exception as e:
                print(f"❌ Analysis function {func.__name__} failed: {e}")

        self.generate_recommendations()

        # Save results
        self.save_analysis_report()

        # Print summary
        self.print_analysis_summary()

    def save_analysis_report(self):
        """Save the analysis report to file"""
        report_path = Path("BACKEND_ANALYSIS_REPORT.json")
        with open(report_path, 'w') as f:
            json.dump(self.test_results, f, indent=2)

        print(f"📄 Detailed analysis report saved to: {report_path}")

    def print_analysis_summary(self):
        """Print a summary of the analysis"""
        print("\n" + "=" * 60)
        print("🎯 BACKEND ANALYSIS SUMMARY")
        print("=" * 60)

        # Count findings by severity
        severity_counts = {"CRITICAL": 0, "HIGH": 0, "MEDIUM": 0, "LOW": 0}
        for category in self.test_results["analysis_categories"].values():
            for finding in category:
                severity_counts[finding["severity"]] += 1

        print(f"🔴 Critical Issues: {severity_counts['CRITICAL']}")
        print(f"🟠 High Priority: {severity_counts['HIGH']}")
        print(f"🟡 Medium Priority: {severity_counts['MEDIUM']}")
        print(f"🟢 Low Priority: {severity_counts['LOW']}")

        print(f"\n📊 Security Findings: {len(self.test_results['security_findings'])}")
        print(f"💡 Recommendations: {len(self.test_results['recommendations'])}")

        # Show top recommendations
        if self.test_results["recommendations"]:
            print("
🔧 Top Recommendations:"            for i, rec in enumerate(self.test_results["recommendations"][:3], 1):
                print(f"  {i}. {rec['title']} ({rec['priority']})")

        print("
📈 Performance Metrics:"        perf = self.test_results.get("performance_metrics", {})
        if perf:
            print(".2f")
            print(".2f")

        print("
✅ Analysis Complete!"        print("Review the detailed report for comprehensive findings and recommendations.")

def main():
    analyzer = BackendAnalyzer()
    analyzer.run_comprehensive_analysis()

if __name__ == "__main__":
    main()
