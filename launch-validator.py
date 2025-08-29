#!/usr/bin/env python3
"""
SecureGate Kenya - Production Launch Checklist & Validation
Comprehensive pre-launch validation and go-live checklist
"""

import os
import sys
import json
import time
import requests
import subprocess
from datetime import datetime
from pathlib import Path
import psycopg2

class LaunchValidator:
    def __init__(self):
        self.project_root = Path(__file__).parent
        self.checklist_items = []
        self.validation_results = {}

    def add_checklist_item(self, category, item_name, description, validator_func, critical=True):
        """Add item to launch checklist"""
        self.checklist_items.append({
            "category": category,
            "name": item_name,
            "description": description,
            "validator": validator_func,
            "critical": critical,
            "status": "pending",
            "timestamp": None,
            "message": ""
        })

    def run_validation(self):
        """Run complete launch validation"""
        print("🚀 SecureGate Kenya Production Launch Validation")
        print("=" * 60)

        total_items = len(self.checklist_items)
        passed = 0
        failed = 0
        warnings = 0

        for i, item in enumerate(self.checklist_items, 1):
            print(f"\n[{i}/{total_items}] {item['category']}: {item['name']}")
            print(f"   {item['description']}")

            try:
                start_time = time.time()
                result = item["validator"]()
                duration = time.time() - start_time

                if result["status"] == "pass":
                    item["status"] = "passed"
                    item["message"] = result.get("message", "Validation passed")
                    passed += 1
                    print(".2f")
                elif result["status"] == "warning":
                    item["status"] = "warning"
                    item["message"] = result.get("message", "Warning issued")
                    warnings += 1
                    print(".2f")
                else:
                    item["status"] = "failed"
                    item["message"] = result.get("message", "Validation failed")
                    failed += 1
                    print(".2f")
                    if item["critical"]:
                        print("   ⚠️  CRITICAL: This must be resolved before launch"
            except Exception as e:
                item["status"] = "error"
                item["message"] = f"Validation error: {str(e)}"
                failed += 1
                print(f"   ❌ ERROR: {str(e)}")
                if item["critical"]:
                    print("   ⚠️  CRITICAL: This must be resolved before launch")
            except Exception as e:
                item["status"] = "error"
                item["message"] = f"Validation error: {str(e)}"
                failed += 1
                print(f"   ❌ ERROR: {str(e)}")
                if item["critical"]:
                    print("   ⚠️  CRITICAL: This must be resolved before launch")

            item["timestamp"] = datetime.now().isoformat()

        # Summary
        print("\n" + "=" * 60)
        print("📊 LAUNCH VALIDATION SUMMARY")
        print("=" * 60)
        print(f"Total Checks: {total_items}")
        print(f"✅ Passed: {passed}")
        print(f"⚠️  Warnings: {warnings}")
        print(f"❌ Failed: {failed}")

        success_rate = (passed / total_items * 100) if total_items > 0 else 0
        print(".1f"
        # Launch readiness assessment
        critical_failures = [item for item in self.checklist_items
                           if item["critical"] and item["status"] in ["failed", "error"]]

        if critical_failures:
            print("
❌ LAUNCH BLOCKED"            print("Critical issues must be resolved:")
            for failure in critical_failures:
                print(f"  • {failure['category']}: {failure['name']}")
            launch_ready = False
        elif success_rate >= 90:
            print("
🎉 LAUNCH READY"            print("System is ready for production deployment")
            launch_ready = True
        else:
            print("
⚠️  LAUNCH CAUTION"            print("System has issues that should be addressed")
            launch_ready = True  # Allow launch with warnings

        # Save validation report
        self.save_validation_report()

        return launch_ready

    def save_validation_report(self):
        """Save validation results to file"""
        report = {
            "timestamp": datetime.now().isoformat(),
            "validation_results": self.checklist_items,
            "summary": {
                "total": len(self.checklist_items),
                "passed": len([i for i in self.checklist_items if i["status"] == "passed"]),
                "warnings": len([i for i in self.checklist_items if i["status"] == "warning"]),
                "failed": len([i for i in self.checklist_items if i["status"] in ["failed", "error"]]),
                "critical_failures": len([i for i in self.checklist_items
                                        if i["critical"] and i["status"] in ["failed", "error"]])
            }
        }

        report_file = self.project_root / "PHASE_10_LAUNCH_VALIDATION_REPORT.json"
        with open(report_file, "w") as f:
            json.dump(report, f, indent=2)

        print(f"\n📄 Detailed report saved: {report_file}")

    # Validation Functions

    def check_environment_files(self):
        """Check environment configuration files"""
        required_files = [".env", "backend/.env"]
        missing_files = []

        for file_path in required_files:
            if not (self.project_root / file_path).exists():
                missing_files.append(file_path)

        if missing_files:
            return {
                "status": "fail",
                "message": f"Missing environment files: {missing_files}"
            }

        # Check if files contain required variables
        env_file = self.project_root / ".env"
        with open(env_file, "r") as f:
            content = f.read()

        required_vars = ["VITE_API_URL", "VITE_APP_NAME"]
        missing_vars = []

        for var in required_vars:
            if var not in content:
                missing_vars.append(var)

        if missing_vars:
            return {
                "status": "fail",
                "message": f"Missing environment variables in .env: {missing_vars}"
            }

        return {"status": "pass", "message": "Environment files configured correctly"}

    def check_database_connection(self):
        """Check database connectivity"""
        try:
            conn = psycopg2.connect(
                host="localhost",
                port=5432,
                database="securegate",
                user="securegate_user",
                password="securegate_pass"
            )
            cursor = conn.cursor()
            cursor.execute("SELECT version();")
            version = cursor.fetchone()[0]
            cursor.close()
            conn.close()

            return {
                "status": "pass",
                "message": f"Database connection successful - {version[:30]}..."
            }
        except Exception as e:
            return {
                "status": "fail",
                "message": f"Database connection failed: {str(e)}"
            }

    def check_database_schema(self):
        """Check database schema completeness"""
        expected_tables = [
            'users', 'profiles', 'visitors', 'access_codes', 'invitations',
            'dashboard_configs', 'analytics_events', 'reports',
            'performance_metrics', 'ml_predictions'
        ]

        try:
            conn = psycopg2.connect(
                host="localhost",
                port=5432,
                database="securegate",
                user="securegate_user",
                password="securegate_pass"
            )
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
                return {
                    "status": "fail",
                    "message": f"Missing database tables: {missing_tables}"
                }
            else:
                return {
                    "status": "pass",
                    "message": f"All {len(expected_tables)} tables exist"
                }
        except Exception as e:
            return {
                "status": "fail",
                "message": f"Schema check failed: {str(e)}"
            }

    def check_backend_service(self):
        """Check backend service health"""
        try:
            response = requests.get("http://127.0.0.1:8000/health", timeout=10)
            if response.status_code == 200:
                return {
                    "status": "pass",
                    "message": "Backend service is healthy"
                }
            else:
                return {
                    "status": "fail",
                    "message": f"Backend health check failed: HTTP {response.status_code}"
                }
        except Exception as e:
            return {
                "status": "fail",
                "message": f"Backend service unreachable: {str(e)}"
            }

    def check_frontend_build(self):
        """Check frontend production build"""
        dist_dir = self.project_root / "dist"
        if not dist_dir.exists():
            return {
                "status": "fail",
                "message": "Frontend production build not found"
            }

        index_file = dist_dir / "index.html"
        if not index_file.exists():
            return {
                "status": "fail",
                "message": "Frontend index.html not found in build"
            }

        # Check file sizes
        total_size = sum(f.stat().st_size for f in dist_dir.rglob("*") if f.is_file())
        if total_size < 100000:  # Less than 100KB
            return {
                "status": "warning",
                "message": f"Frontend build seems small ({total_size} bytes)"
            }

        return {"status": "pass", "message": "Frontend production build is ready"}

    def check_api_endpoints(self):
        """Check critical API endpoints"""
        endpoints = [
            ("/docs", "API Documentation"),
            ("/openapi.json", "OpenAPI Schema"),
            ("/api/visitors", "Visitors API"),
            ("/api/access-codes", "Access Codes API")
        ]

        failed_endpoints = []

        for endpoint, description in endpoints:
            try:
                response = requests.get(f"http://127.0.0.1:8000{endpoint}", timeout=5)
                if response.status_code not in [200, 401, 403]:
                    failed_endpoints.append(f"{endpoint} ({response.status_code})")
            except Exception as e:
                failed_endpoints.append(f"{endpoint} (error)")

        if failed_endpoints:
            return {
                "status": "fail",
                "message": f"Failed endpoints: {failed_endpoints}"
            }
        else:
            return {
                "status": "pass",
                "message": f"All {len(endpoints)} endpoints accessible"
            }

    def check_security_headers(self):
        """Check security headers"""
        try:
            response = requests.get("http://127.0.0.1:8000/health", timeout=5)

            recommended_headers = [
                'X-Content-Type-Options',
                'X-Frame-Options',
                'X-XSS-Protection'
            ]

            missing_headers = []
            for header in recommended_headers:
                if header not in response.headers:
                    missing_headers.append(header)

            if missing_headers:
                return {
                    "status": "warning",
                    "message": f"Missing security headers: {missing_headers}"
                }
            else:
                return {
                    "status": "pass",
                    "message": "Security headers are properly configured"
                }
        except Exception as e:
            return {
                "status": "fail",
                "message": f"Security check failed: {str(e)}"
            }

    def check_performance_baselines(self):
        """Check performance baselines"""
        try:
            # Test API response times
            endpoints = ["/health", "/docs"]
            response_times = []

            for endpoint in endpoints:
                start_time = time.time()
                response = requests.get(f"http://127.0.0.1:8000{endpoint}", timeout=5)
                response_time = time.time() - start_time
                response_times.append(response_time)

            avg_response_time = sum(response_times) / len(response_times)
            max_response_time = max(response_times)

            if max_response_time > 2.0:  # 2 seconds
                return {
                    "status": "warning",
                    "message": ".2f"                }
            elif avg_response_time > 1.0:  # 1 second
                return {
                    "status": "warning",
                    "message": ".2f"                }
            else:
                return {
                    "status": "pass",
                    "message": ".2f"                }
        except Exception as e:
            return {
                "status": "fail",
                "message": f"Performance check failed: {str(e)}"
            }

    def check_dependencies(self):
        """Check system dependencies"""
        dependencies = [
            ("node", "Node.js runtime"),
            ("npm", "Node package manager"),
            ("python", "Python runtime"),
            ("pip", "Python package manager")
        ]

        missing_deps = []

        for cmd, description in dependencies:
            try:
                result = subprocess.run([cmd, "--version"],
                                      capture_output=True, text=True, timeout=5)
                if result.returncode != 0:
                    missing_deps.append(description)
            except (subprocess.TimeoutExpired, FileNotFoundError):
                missing_deps.append(description)

        if missing_deps:
            return {
                "status": "fail",
                "message": f"Missing dependencies: {missing_deps}"
            }
        else:
            return {
                "status": "pass",
                "message": "All system dependencies are available"
            }

    def check_backup_system(self):
        """Check backup system readiness"""
        backup_dir = self.project_root / "backups"
        if not backup_dir.exists():
            return {
                "status": "warning",
                "message": "Backup directory does not exist"
            }

        # Check if there are recent backups
        backup_files = list(backup_dir.glob("*"))
        if not backup_files:
            return {
                "status": "warning",
                "message": "No backup files found"
            }

        # Check most recent backup
        most_recent = max(backup_files, key=lambda f: f.stat().st_mtime)
        days_since_backup = (time.time() - most_recent.stat().st_mtime) / (24 * 3600)

        if days_since_backup > 7:  # Older than 7 days
            return {
                "status": "warning",
                "message": ".1f"            }
        else:
            return {
                "status": "pass",
                "message": ".1f"            }

    def check_monitoring_system(self):
        """Check monitoring system setup"""
        monitoring_files = [
            "production-monitor.py",
            "logs/monitor.log"
        ]

        missing_files = []
        for file_path in monitoring_files:
            if not (self.project_root / file_path).exists():
                missing_files.append(file_path)

        if missing_files:
            return {
                "status": "warning",
                "message": f"Monitoring files missing: {missing_files}"
            }
        else:
            return {
                "status": "pass",
                "message": "Monitoring system is configured"
            }

    def check_documentation(self):
        """Check documentation completeness"""
        required_docs = [
            "README.md",
            "DEPLOYMENT_GUIDE.md",
            "DATABASE_SETUP_GUIDE.md",
            "API_ROUTES_SUMMARY.md"
        ]

        missing_docs = []
        for doc in required_docs:
            if not (self.project_root / doc).exists():
                missing_docs.append(doc)

        if missing_docs:
            return {
                "status": "warning",
                "message": f"Missing documentation: {missing_docs}"
            }
        else:
            return {
                "status": "pass",
                "message": "All required documentation is present"
            }

    def setup_launch_checklist(self):
        """Setup comprehensive launch checklist"""
        # Infrastructure & Environment
        self.add_checklist_item(
            "Infrastructure", "Environment Configuration",
            "Check environment files and variables",
            self.check_environment_files, critical=True
        )

        self.add_checklist_item(
            "Infrastructure", "System Dependencies",
            "Verify all required system dependencies",
            self.check_dependencies, critical=True
        )

        # Database
        self.add_checklist_item(
            "Database", "Database Connection",
            "Verify database connectivity",
            self.check_database_connection, critical=True
        )

        self.add_checklist_item(
            "Database", "Database Schema",
            "Check database schema completeness",
            self.check_database_schema, critical=True
        )

        # Backend Services
        self.add_checklist_item(
            "Backend", "Backend Service Health",
            "Check backend service status and health",
            self.check_backend_service, critical=True
        )

        self.add_checklist_item(
            "Backend", "API Endpoints",
            "Verify critical API endpoints",
            self.check_api_endpoints, critical=True
        )

        self.add_checklist_item(
            "Backend", "Security Headers",
            "Check security headers configuration",
            self.check_security_headers, critical=False
        )

        # Frontend
        self.add_checklist_item(
            "Frontend", "Production Build",
            "Verify frontend production build",
            self.check_frontend_build, critical=True
        )

        # Performance
        self.add_checklist_item(
            "Performance", "Response Times",
            "Check API response time baselines",
            self.check_performance_baselines, critical=False
        )

        # Operations
        self.add_checklist_item(
            "Operations", "Backup System",
            "Verify backup system readiness",
            self.check_backup_system, critical=False
        )

        self.add_checklist_item(
            "Operations", "Monitoring System",
            "Check monitoring system setup",
            self.check_monitoring_system, critical=False
        )

        self.add_checklist_item(
            "Operations", "Documentation",
            "Verify documentation completeness",
            self.check_documentation, critical=False
        )

def main():
    """Main launch validation function"""
    validator = LaunchValidator()
    validator.setup_launch_checklist()

    launch_ready = validator.run_validation()

    if launch_ready:
        print("
🎯 LAUNCH COMMAND:"        print("   python deploy-production.py"        print("
📋 POST-LAUNCH CHECKLIST:"        print("   1. Start monitoring: python production-monitor.py"        print("   2. Run critical path tests: python critical-path-test.py"        print("   3. Monitor logs for 24 hours"        print("   4. Validate user workflows"        return 0
    else:
        print("
❌ LAUNCH BLOCKED"        print("   Resolve critical issues before proceeding"        return 1

if __name__ == "__main__":
    sys.exit(main())
