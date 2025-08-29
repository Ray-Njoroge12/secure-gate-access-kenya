#!/usr/bin/env python3
"""
SecureGate Kenya - Production Monitoring & Alerting System
Real-time monitoring of system health, performance, and security
"""

import time
import json
import smtplib
import requests
import psycopg2
import threading
from datetime import datetime, timedelta
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import logging
from pathlib import Path

class ProductionMonitor:
    def __init__(self):
        self.project_root = Path(__file__).parent
        self.logs_dir = self.project_root / "logs"
        self.metrics_dir = self.project_root / "metrics"
        self.alerts_dir = self.project_root / "alerts"

        # Monitoring configuration
        self.monitoring_config = {
            "check_interval": 60,  # seconds
            "alert_thresholds": {
                "response_time": 2.0,  # seconds
                "error_rate": 0.05,    # 5%
                "cpu_usage": 80.0,     # percentage
                "memory_usage": 85.0,  # percentage
                "disk_usage": 90.0     # percentage
            },
            "alert_cooldown": 300,   # 5 minutes between similar alerts
            "email_config": {
                "smtp_server": "smtp.gmail.com",
                "smtp_port": 587,
                "sender_email": "alerts@securegate.co.ke",
                "recipient_emails": ["admin@securegate.co.ke", "devops@securegate.co.ke"],
                "use_tls": True
            }
        }

        # Monitoring state
        self.last_alerts = {}
        self.metrics_history = []
        self.is_monitoring = False

        # Setup logging
        self.setup_logging()

        # Create necessary directories
        self.logs_dir.mkdir(exist_ok=True)
        self.metrics_dir.mkdir(exist_ok=True)
        self.alerts_dir.mkdir(exist_ok=True)

    def setup_logging(self):
        """Setup logging configuration"""
        logging.basicConfig(
            filename=self.logs_dir / "monitor.log",
            level=logging.INFO,
            format='%(asctime)s - %(levelname)s - %(message)s'
        )
        self.logger = logging.getLogger(__name__)

    def start_monitoring(self):
        """Start the monitoring system"""
        self.logger.info("Starting production monitoring system")
        self.is_monitoring = True

        # Start monitoring thread
        monitor_thread = threading.Thread(target=self.monitoring_loop, daemon=True)
        monitor_thread.start()

        # Start alerting thread
        alert_thread = threading.Thread(target=self.alerting_loop, daemon=True)
        alert_thread.start()

        self.logger.info("Monitoring system started successfully")

    def stop_monitoring(self):
        """Stop the monitoring system"""
        self.logger.info("Stopping production monitoring system")
        self.is_monitoring = False

    def monitoring_loop(self):
        """Main monitoring loop"""
        while self.is_monitoring:
            try:
                # Collect system metrics
                metrics = self.collect_system_metrics()

                # Collect application metrics
                app_metrics = self.collect_application_metrics()

                # Combine all metrics
                all_metrics = {**metrics, **app_metrics}
                all_metrics["timestamp"] = datetime.now().isoformat()

                # Store metrics
                self.store_metrics(all_metrics)

                # Check for alerts
                self.check_alerts(all_metrics)

                # Log summary
                self.logger.info(f"Metrics collected: CPU={metrics.get('cpu_usage', 'N/A')}%, "
                               f"Memory={metrics.get('memory_usage', 'N/A')}%, "
                               f"Response Time={app_metrics.get('avg_response_time', 'N/A')}s")

            except Exception as e:
                self.logger.error(f"Error in monitoring loop: {str(e)}")

            # Wait for next check
            time.sleep(self.monitoring_config["check_interval"])

    def collect_system_metrics(self):
        """Collect system-level metrics"""
        metrics = {}

        try:
            # CPU usage
            import psutil
            metrics["cpu_usage"] = psutil.cpu_percent(interval=1)

            # Memory usage
            memory = psutil.virtual_memory()
            metrics["memory_usage"] = memory.percent
            metrics["memory_used_gb"] = memory.used / (1024**3)
            metrics["memory_total_gb"] = memory.total / (1024**3)

            # Disk usage
            disk = psutil.disk_usage('/')
            metrics["disk_usage"] = disk.percent
            metrics["disk_used_gb"] = disk.used / (1024**3)
            metrics["disk_total_gb"] = disk.total / (1024**3)

            # Network I/O
            net = psutil.net_io_counters()
            metrics["network_bytes_sent"] = net.bytes_sent
            metrics["network_bytes_recv"] = net.bytes_recv

        except ImportError:
            self.logger.warning("psutil not available, skipping system metrics")
        except Exception as e:
            self.logger.error(f"Error collecting system metrics: {str(e)}")

        return metrics

    def collect_application_metrics(self):
        """Collect application-specific metrics"""
        metrics = {}

        try:
            # Backend health check
            backend_health = self.check_backend_health()
            metrics.update(backend_health)

            # Database metrics
            db_metrics = self.collect_database_metrics()
            metrics.update(db_metrics)

            # API response times
            api_metrics = self.measure_api_response_times()
            metrics.update(api_metrics)

            # Error rates
            error_metrics = self.collect_error_metrics()
            metrics.update(error_metrics)

        except Exception as e:
            self.logger.error(f"Error collecting application metrics: {str(e)}")

        return metrics

    def check_backend_health(self):
        """Check backend service health"""
        metrics = {"backend_status": "down"}

        try:
            response = requests.get("http://127.0.0.1:8000/health", timeout=5)
            if response.status_code == 200:
                metrics["backend_status"] = "up"
                health_data = response.json()
                metrics.update(health_data)
            else:
                metrics["backend_status"] = f"error_{response.status_code}"
        except Exception as e:
            self.logger.error(f"Backend health check failed: {str(e)}")
            metrics["backend_error"] = str(e)

        return metrics

    def collect_database_metrics(self):
        """Collect database performance metrics"""
        metrics = {}

        try:
            conn = psycopg2.connect(
                host="localhost",
                port=5432,
                database="securegate",
                user="securegate_user",
                password="securegate_pass"
            )
            cursor = conn.cursor()

            # Active connections
            cursor.execute("""
                SELECT count(*) FROM pg_stat_activity
                WHERE state = 'active'
            """)
            metrics["db_active_connections"] = cursor.fetchone()[0]

            # Database size
            cursor.execute("""
                SELECT pg_size_pretty(pg_database_size('securegate'))
            """)
            metrics["db_size"] = cursor.fetchone()[0]

            # Table counts
            tables = ['users', 'visitors', 'access_codes', 'invitations']
            for table in tables:
                cursor.execute(f"SELECT count(*) FROM {table}")
                metrics[f"{table}_count"] = cursor.fetchone()[0]

            cursor.close()
            conn.close()

        except Exception as e:
            self.logger.error(f"Database metrics collection failed: {str(e)}")
            metrics["db_error"] = str(e)

        return metrics

    def measure_api_response_times(self):
        """Measure API endpoint response times"""
        metrics = {}
        endpoints = [
            "/health",
            "/docs",
            "/api/visitors",
            "/api/access-codes"
        ]

        response_times = []
        for endpoint in endpoints:
            try:
                start_time = time.time()
                response = requests.get(f"http://127.0.0.1:8000{endpoint}", timeout=5)
                response_time = time.time() - start_time
                response_times.append(response_time)

                metrics[f"response_time_{endpoint.replace('/', '_')}"] = response_time
            except Exception as e:
                self.logger.error(f"API response time check failed for {endpoint}: {str(e)}")
                metrics[f"response_time_{endpoint.replace('/', '_')}"] = -1

        if response_times:
            metrics["avg_response_time"] = sum(response_times) / len(response_times)
            metrics["max_response_time"] = max(response_times)
            metrics["min_response_time"] = min(response_times)

        return metrics

    def collect_error_metrics(self):
        """Collect error rate metrics"""
        metrics = {}

        try:
            # Check application logs for errors in the last hour
            log_file = self.logs_dir / "application.log"
            if log_file.exists():
                with open(log_file, "r") as f:
                    lines = f.readlines()[-1000:]  # Last 1000 lines

                error_count = sum(1 for line in lines if "ERROR" in line.upper())
                total_requests = len([line for line in lines if "INFO" in line or "ERROR" in line])

                if total_requests > 0:
                    metrics["error_rate"] = error_count / total_requests
                    metrics["error_count_last_hour"] = error_count
                    metrics["total_requests_last_hour"] = total_requests

        except Exception as e:
            self.logger.error(f"Error metrics collection failed: {str(e)}")

        return metrics

    def store_metrics(self, metrics):
        """Store metrics for historical analysis"""
        self.metrics_history.append(metrics)

        # Keep only last 1000 entries
        if len(self.metrics_history) > 1000:
            self.metrics_history = self.metrics_history[-1000:]

        # Save to file periodically
        if len(self.metrics_history) % 10 == 0:  # Every 10 minutes
            metrics_file = self.metrics_dir / f"metrics_{datetime.now().strftime('%Y%m%d')}.json"
            with open(metrics_file, "w") as f:
                json.dump(self.metrics_history[-100:], f, indent=2)

    def check_alerts(self, metrics):
        """Check metrics against alert thresholds"""
        alerts = []

        # CPU usage alert
        if metrics.get("cpu_usage", 0) > self.monitoring_config["alert_thresholds"]["cpu_usage"]:
            alerts.append({
                "type": "cpu_usage_high",
                "message": ".1f",
                "severity": "warning",
                "value": metrics["cpu_usage"]
            })

        # Memory usage alert
        if metrics.get("memory_usage", 0) > self.monitoring_config["alert_thresholds"]["memory_usage"]:
            alerts.append({
                "type": "memory_usage_high",
                "message": ".1f",
                "severity": "critical",
                "value": metrics["memory_usage"]
            })

        # Response time alert
        if metrics.get("avg_response_time", 0) > self.monitoring_config["alert_thresholds"]["response_time"]:
            alerts.append({
                "type": "response_time_high",
                "message": ".2f",
                "severity": "warning",
                "value": metrics["avg_response_time"]
            })

        # Error rate alert
        if metrics.get("error_rate", 0) > self.monitoring_config["alert_thresholds"]["error_rate"]:
            alerts.append({
                "type": "error_rate_high",
                "message": ".1%",
                "severity": "critical",
                "value": metrics["error_rate"]
            })

        # Backend status alert
        if metrics.get("backend_status") != "up":
            alerts.append({
                "type": "backend_down",
                "message": f"Backend service is {metrics.get('backend_status', 'down')}",
                "severity": "critical",
                "value": metrics.get("backend_status")
            })

        # Send alerts
        for alert in alerts:
            self.send_alert(alert)

    def send_alert(self, alert):
        """Send alert notification"""
        alert_key = alert["type"]
        current_time = time.time()

        # Check cooldown period
        if alert_key in self.last_alerts:
            if current_time - self.last_alerts[alert_key] < self.monitoring_config["alert_cooldown"]:
                return  # Still in cooldown

        self.last_alerts[alert_key] = current_time

        # Log alert
        self.logger.warning(f"ALERT: {alert['message']}")

        # Save alert to file
        alert_file = self.alerts_dir / f"alert_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
        with open(alert_file, "w") as f:
            json.dump({
                **alert,
                "timestamp": datetime.now().isoformat()
            }, f, indent=2)

        # Send email alert
        try:
            self.send_email_alert(alert)
        except Exception as e:
            self.logger.error(f"Failed to send email alert: {str(e)}")

    def send_email_alert(self, alert):
        """Send email alert notification"""
        config = self.monitoring_config["email_config"]

        msg = MIMEMultipart()
        msg['From'] = config["sender_email"]
        msg['To'] = ", ".join(config["recipient_emails"])
        msg['Subject'] = f"🚨 SecureGate Alert: {alert['type'].replace('_', ' ').title()}"

        body = f"""
SecureGate Kenya Production Alert
{'='*40}

Alert Type: {alert['type'].replace('_', ' ').title()}
Severity: {alert['severity'].upper()}
Message: {alert['message']}
Value: {alert['value']}
Timestamp: {datetime.now().isoformat()}

Please check the monitoring dashboard and logs for more details.

This is an automated message from the SecureGate monitoring system.
        """

        msg.attach(MIMEText(body, 'plain'))

        try:
            server = smtplib.SMTP(config["smtp_server"], config["smtp_port"])
            if config["use_tls"]:
                server.starttls()
            # Note: In production, use proper authentication
            # server.login(config["sender_email"], "password")
            server.sendmail(config["sender_email"], config["recipient_emails"], msg.as_string())
            server.quit()
        except Exception as e:
            self.logger.error(f"Email sending failed: {str(e)}")

    def alerting_loop(self):
        """Background alerting loop"""
        while self.is_monitoring:
            try:
                # Check for stuck alerts or system issues
                self.check_system_health()
            except Exception as e:
                self.logger.error(f"Error in alerting loop: {str(e)}")

            time.sleep(300)  # Check every 5 minutes

    def check_system_health(self):
        """Check overall system health"""
        # This could include checks for:
        # - Log file sizes
        # - Disk space for logs
        # - Monitoring service health
        # - Alert queue status

        try:
            # Check if log files are getting too large
            log_file = self.logs_dir / "monitor.log"
            if log_file.exists() and log_file.stat().st_size > 100 * 1024 * 1024:  # 100MB
                self.send_alert({
                    "type": "log_file_large",
                    "message": "Monitor log file exceeds 100MB",
                    "severity": "warning",
                    "value": log_file.stat().st_size
                })

        except Exception as e:
            self.logger.error(f"System health check failed: {str(e)}")

    def get_metrics_summary(self, hours=24):
        """Get metrics summary for the last N hours"""
        cutoff_time = datetime.now() - timedelta(hours=hours)

        recent_metrics = [
            m for m in self.metrics_history
            if datetime.fromisoformat(m["timestamp"]) > cutoff_time
        ]

        if not recent_metrics:
            return {"error": "No metrics available for the specified period"}

        summary = {
            "period_hours": hours,
            "total_samples": len(recent_metrics),
            "timestamp_range": {
                "start": recent_metrics[0]["timestamp"] if recent_metrics else None,
                "end": recent_metrics[-1]["timestamp"] if recent_metrics else None
            }
        }

        # Calculate averages for key metrics
        numeric_metrics = [
            "cpu_usage", "memory_usage", "disk_usage", "avg_response_time",
            "error_rate", "db_active_connections"
        ]

        for metric in numeric_metrics:
            values = [m.get(metric) for m in recent_metrics if m.get(metric) is not None]
            if values:
                summary[f"{metric}_avg"] = sum(values) / len(values)
                summary[f"{metric}_max"] = max(values)
                summary[f"{metric}_min"] = min(values)

        return summary

    def generate_report(self):
        """Generate monitoring report"""
        report = {
            "generated_at": datetime.now().isoformat(),
            "system_status": "monitoring" if self.is_monitoring else "stopped",
            "metrics_summary_24h": self.get_metrics_summary(24),
            "recent_alerts": list(self.last_alerts.keys()),
            "configuration": self.monitoring_config
        }

        report_file = self.logs_dir / f"monitoring_report_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
        with open(report_file, "w") as f:
            json.dump(report, f, indent=2)

        return report_file

# Global monitor instance
monitor = ProductionMonitor()

def start_monitoring():
    """Start the monitoring system"""
    monitor.start_monitoring()

def stop_monitoring():
    """Stop the monitoring system"""
    monitor.stop_monitoring()

def get_monitoring_status():
    """Get current monitoring status"""
    return {
        "is_monitoring": monitor.is_monitoring,
        "last_metrics_count": len(monitor.metrics_history),
        "active_alerts": list(monitor.last_alerts.keys())
    }

if __name__ == "__main__":
    print("🚀 SecureGate Kenya Production Monitoring System")
    print("Starting monitoring...")

    start_monitoring()

    try:
        # Keep the main thread alive
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        print("\nStopping monitoring...")
        stop_monitoring()

        # Generate final report
        report_file = monitor.generate_report()
        print(f"Final report saved: {report_file}")

    print("Monitoring stopped.")
