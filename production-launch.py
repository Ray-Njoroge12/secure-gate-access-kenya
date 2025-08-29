#!/usr/bin/env python3
"""
SecureGate Kenya - Production Launch Script
Final production deployment and launch validation
"""

import os
import sys
import json
import time
import requests
import subprocess
from pathlib import Path
from datetime import datetime

class ProductionLauncher:
    def __init__(self):
        self.project_root = Path(__file__).parent
        self.nginx_html_dir = Path("/usr/share/nginx/html")
        self.dist_dir = self.project_root / "dist"
        self.backend_url = "http://127.0.0.1:8000"
        self.frontend_url = "http://127.0.0.1:80"

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

    def deploy_frontend(self):
        """Deploy frontend to nginx directory"""
        self.log("Deploying frontend to nginx...")

        # Create nginx html directory if it doesn't exist
        self.nginx_html_dir.mkdir(parents=True, exist_ok=True)

        try:
            # Copy all files from dist to nginx html directory
            import shutil
            if self.nginx_html_dir.exists():
                shutil.rmtree(self.nginx_html_dir)
            shutil.copytree(self.dist_dir, self.nginx_html_dir)

            self.log("✅ Frontend deployed successfully")
            return True
        except Exception as e:
            self.log(f"❌ Frontend deployment failed: {e}")
            return False

    def start_nginx(self):
        """Start nginx web server"""
        self.log("Starting nginx web server...")

        try:
            # Copy nginx configuration
            nginx_conf_src = self.project_root / "nginx.conf"
            nginx_conf_dest = Path("/etc/nginx/nginx.conf")

            if nginx_conf_src.exists():
                nginx_conf_dest.parent.mkdir(parents=True, exist_ok=True)
                import shutil
                shutil.copy2(nginx_conf_src, nginx_conf_dest)
                self.log("✅ Nginx configuration copied")

            # Start nginx
            result = subprocess.run(
                ["sudo", "systemctl", "start", "nginx"],
                capture_output=True,
                text=True
            )

            if result.returncode == 0:
                self.log("✅ Nginx started successfully")
                return True
            else:
                self.log(f"❌ Failed to start nginx: {result.stderr}")
                return False

        except Exception as e:
            self.log(f"❌ Nginx startup failed: {e}")
            return False

    def verify_nginx_config(self):
        """Verify nginx configuration is valid"""
        self.log("Verifying nginx configuration...")

        try:
            result = subprocess.run(
                ["sudo", "nginx", "-t"],
                capture_output=True,
                text=True
            )

            if result.returncode == 0:
                self.log("✅ Nginx configuration is valid")
                return True
            else:
                self.log(f"❌ Nginx configuration error: {result.stderr}")
                return False

        except Exception as e:
            self.log(f"❌ Nginx config verification failed: {e}")
            return False

    def check_frontend_accessibility(self):
        """Verify frontend is accessible via nginx"""
        self.log("Checking frontend accessibility...")

        try:
            response = requests.get(self.frontend_url, timeout=10)
            if response.status_code == 200:
                self.log("✅ Frontend is accessible via nginx")
                return True
            else:
                self.log(f"❌ Frontend returned status {response.status_code}")
                return False
        except Exception as e:
            self.log(f"❌ Frontend accessibility check failed: {e}")
            return False

    def generate_launch_report(self):
        """Generate final launch report"""
        report = {
            "launch_timestamp": datetime.now().isoformat(),
            "system_status": {
                "backend_healthy": self.check_backend_health(),
                "frontend_built": self.check_frontend_build(),
                "nginx_config_valid": self.verify_nginx_config(),
                "frontend_accessible": self.check_frontend_accessibility()
            },
            "deployment_details": {
                "frontend_deployed": (self.nginx_html_dir / "index.html").exists(),
                "nginx_running": self.is_nginx_running(),
                "backend_url": self.backend_url,
                "frontend_url": self.frontend_url
            },
            "production_urls": {
                "frontend": "http://your-domain.com",
                "backend_api": "http://your-domain.com/api",
                "health_check": "http://your-domain.com/health"
            }
        }

        # Save report
        report_path = self.project_root / "PRODUCTION_LAUNCH_REPORT.json"
        with open(report_path, 'w') as f:
            json.dump(report, f, indent=2)

        self.log(f"📋 Launch report saved to: {report_path}")
        return report

    def is_nginx_running(self):
        """Check if nginx is running"""
        try:
            result = subprocess.run(
                ["sudo", "systemctl", "is-active", "nginx"],
                capture_output=True,
                text=True
            )
            return result.stdout.strip() == "active"
        except:
            return False

    def launch_production(self):
        """Main production launch process"""
        self.log("🚀 Starting SecureGate Kenya Production Launch")
        self.log("=" * 50)

        # Step 1: Pre-launch checks
        self.log("Step 1: Pre-launch validation")
        if not self.check_backend_health():
            self.log("❌ Backend health check failed. Please ensure backend is running.")
            return False

        if not self.check_frontend_build():
            self.log("❌ Frontend build check failed. Please run 'npm run build' first.")
            return False

        # Step 2: Deploy frontend
        self.log("\nStep 2: Frontend deployment")
        if not self.deploy_frontend():
            return False

        # Step 3: Configure and start nginx
        self.log("\nStep 3: Web server configuration")
        if not self.verify_nginx_config():
            return False

        if not self.start_nginx():
            return False

        # Step 4: Post-launch verification
        self.log("\nStep 4: Post-launch verification")
        time.sleep(2)  # Wait for nginx to fully start

        if not self.check_frontend_accessibility():
            self.log("⚠️  Frontend accessibility check failed, but nginx is running")
            self.log("   This may be due to network configuration or firewall settings")

        # Step 5: Generate final report
        self.log("\nStep 5: Generating launch report")
        report = self.generate_launch_report()

        # Final status
        self.log("\n" + "=" * 50)
        self.log("🎉 PRODUCTION LAUNCH COMPLETE!")
        self.log("=" * 50)

        all_systems_go = all(report["system_status"].values())
        if all_systems_go:
            self.log("✅ ALL SYSTEMS OPERATIONAL")
            self.log("🌐 Frontend: http://your-domain.com")
            self.log("🔗 Backend API: http://your-domain.com/api")
            self.log("💚 Health Check: http://your-domain.com/health")
        else:
            self.log("⚠️  SOME SYSTEMS REQUIRE ATTENTION")
            for check, status in report["system_status"].items():
                if not status:
                    self.log(f"   - {check}: FAILED")

        self.log("\n📋 Next Steps:")
        self.log("1. Configure your domain DNS to point to this server")
        self.log("2. Obtain SSL certificate for HTTPS (Let's Encrypt recommended)")
        self.log("3. Update nginx.conf with your domain name")
        self.log("4. Test the system with real users")
        self.log("5. Monitor logs and performance")

        return all_systems_go

def main():
    launcher = ProductionLauncher()
    success = launcher.launch_production()
    sys.exit(0 if success else 1)

if __name__ == "__main__":
    main()
