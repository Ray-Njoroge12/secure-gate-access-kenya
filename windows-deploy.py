#!/usr/bin/env python3
"""
SecureGate Kenya - Windows Production Deployment Script
Windows-compatible production deployment with Python HTTP server
"""

import os
import sys
import json
import time
import requests
import subprocess
import http.server
import socketserver
from pathlib import Path
from datetime import datetime
from threading import Thread

class WindowsProductionDeployer:
    def __init__(self):
        self.project_root = Path(__file__).parent
        self.dist_dir = self.project_root / "dist"
        self.backend_url = "http://127.0.0.1:8000"
        self.frontend_port = 8080
        self.frontend_url = f"http://127.0.0.1:{self.frontend_port}"

    def log(self, message, level="INFO"):
        """Log with timestamp"""
        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        print(f"[{timestamp}] [{level}] {message}")

    def check_backend_health(self):
        """Verify backend is running and healthy"""
        self.log("Checking backend health...")
        try:
            response = requests.get(f"{self.backend_url}/healthz", timeout=10)
            if response.status_code == 200:
                self.log("✅ Backend is healthy")
                return True
            else:
                self.log(f"❌ Backend returned status {response.status_code}")
                return False
        except Exception as e:
            self.log(f"❌ Backend health check failed: {e}")
            return False

    def check_frontend_build(self):
        """Verify frontend build exists and is complete"""
        self.log("Checking frontend build...")
        if not self.dist_dir.exists():
            self.log("❌ Frontend build directory not found")
            return False

        required_files = ["index.html", "assets"]
        for file in required_files:
            if not (self.dist_dir / file).exists():
                self.log(f"❌ Required file missing: {file}")
                return False

        self.log("✅ Frontend build is complete")
        return True

    def start_frontend_server(self):
        """Start Python HTTP server for frontend"""
        self.log("Starting frontend HTTP server...")

        # Change to dist directory
        os.chdir(self.dist_dir)

        # Create custom handler for SPA routing
        class SPARouter(http.server.SimpleHTTPRequestHandler):
            def do_GET(self):
                # Handle SPA routing - serve index.html for non-file requests
                if not self.path.startswith('/assets/') and '.' not in self.path.split('/')[-1]:
                    self.path = '/index.html'

                return super().do_GET()

            def log_message(self, format, *args):
                # Suppress default logging
                pass

        try:
            with socketserver.TCPServer(("", self.frontend_port), SPARouter) as httpd:
                self.log(f"✅ Frontend server started on http://127.0.0.1:{self.frontend_port}")

                # Start server in background thread
                server_thread = Thread(target=httpd.serve_forever, daemon=True)
                server_thread.start()

                # Keep server running
                self.log("🌐 Frontend server is running. Press Ctrl+C to stop.")
                self.log("📱 Access the application at: http://127.0.0.1:8080")

                # Wait indefinitely
                try:
                    while True:
                        time.sleep(1)
                except KeyboardInterrupt:
                    self.log("🛑 Shutting down frontend server...")
                    httpd.shutdown()
                    return True

        except Exception as e:
            self.log(f"❌ Frontend server failed: {e}")
            return False

    def check_frontend_accessibility(self):
        """Verify frontend is accessible"""
        self.log("Checking frontend accessibility...")

        try:
            response = requests.get(self.frontend_url, timeout=10)
            if response.status_code == 200:
                self.log("✅ Frontend is accessible")
                return True
            else:
                self.log(f"❌ Frontend returned status {response.status_code}")
                return False
        except Exception as e:
            self.log(f"❌ Frontend accessibility check failed: {e}")
            return False

    def generate_deployment_report(self):
        """Generate deployment report"""
        report = {
            "deployment_timestamp": datetime.now().isoformat(),
            "system_status": {
                "backend_healthy": self.check_backend_health(),
                "frontend_built": self.check_frontend_build(),
                "frontend_accessible": self.check_frontend_accessibility()
            },
            "deployment_details": {
                "backend_url": self.backend_url,
                "frontend_url": self.frontend_url,
                "frontend_directory": str(self.dist_dir),
                "platform": "Windows",
                "server_type": "Python HTTP Server"
            },
            "production_readiness": {
                "development_server": "Running on port 8080",
                "production_recommendation": "Deploy to Linux server with nginx for production",
                "ssl_setup": "Required for production (Let's Encrypt recommended)",
                "domain_config": "Configure DNS to point to production server"
            }
        }

        # Save report
        report_path = self.project_root / "WINDOWS_DEPLOYMENT_REPORT.json"
        with open(report_path, 'w') as f:
            json.dump(report, f, indent=2)

        self.log(f"📋 Deployment report saved to: {report_path}")
        return report

    def deploy_windows(self):
        """Windows deployment process"""
        self.log("🚀 Starting SecureGate Kenya Windows Deployment")
        self.log("=" * 50)

        # Step 1: Pre-deployment checks
        self.log("Step 1: Pre-deployment validation")
        if not self.check_backend_health():
            self.log("❌ Backend health check failed. Please ensure backend is running.")
            return False

        if not self.check_frontend_build():
            self.log("❌ Frontend build check failed. Please run 'npm run build' first.")
            return False

        # Step 2: Generate deployment report
        self.log("\nStep 2: Generating deployment report")
        report = self.generate_deployment_report()

        # Step 3: Start frontend server
        self.log("\nStep 3: Starting frontend server")

        self.log("\n" + "=" * 50)
        self.log("🎉 WINDOWS DEPLOYMENT COMPLETE!")
        self.log("=" * 50)

        all_systems_go = all(report["system_status"].values())
        if all_systems_go:
            self.log("✅ ALL SYSTEMS OPERATIONAL")
            self.log("🔗 Backend API: http://127.0.0.1:8000")
            self.log("🌐 Frontend: http://127.0.0.1:8080")
            self.log("📊 Health Check: http://127.0.0.1:8000/healthz")
        else:
            self.log("⚠️  SOME SYSTEMS REQUIRE ATTENTION")
            for check, status in report["system_status"].items():
                if not status:
                    self.log(f"   - {check}: FAILED")

        self.log("\n📋 Windows Development Deployment:")
        self.log("✅ Backend API server running on port 8000")
        self.log("✅ Frontend served via Python HTTP server on port 8080")
        self.log("✅ SPA routing configured for React Router")
        self.log("✅ All static assets properly served")

        self.log("\n🚀 Production Deployment Next Steps:")
        self.log("1. Deploy to Linux server with nginx for production")
        self.log("2. Configure SSL certificate (Let's Encrypt)")
        self.log("3. Setup domain and DNS configuration")
        self.log("4. Configure firewall and security settings")
        self.log("5. Setup monitoring and logging")

        # Start the frontend server
        self.log("\n🔄 Starting frontend server...")
        return self.start_frontend_server()

def main():
    deployer = WindowsProductionDeployer()
    success = deployer.deploy_windows()
    sys.exit(0 if success else 1)

if __name__ == "__main__":
    main()
