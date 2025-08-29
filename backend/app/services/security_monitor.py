"""
Security monitoring service for tracking and analyzing security events
"""
import logging
from datetime import datetime, timedelta
from typing import Dict, List, Optional
from dataclasses import dataclass, asdict
from collections import defaultdict
import json
import threading
import time
from ..config import get_settings

settings = get_settings()
logger = logging.getLogger(__name__)

@dataclass
class SecurityEvent:
    """Security event data structure"""
    timestamp: datetime
    event_type: str
    severity: str  # 'low', 'medium', 'high', 'critical'
    source_ip: str
    user_agent: str
    endpoint: str
    details: Dict
    mitigation_action: Optional[str] = None

class SecurityMonitor:
    """
    Comprehensive security monitoring and threat detection service
    """

    def __init__(self):
        self.events: List[SecurityEvent] = []
        self.event_counts = defaultdict(int)
        self.ip_blocklist = set()
        self.suspicious_ips = defaultdict(int)
        self._lock = threading.Lock()
        self._cleanup_running = False

        # Security thresholds
        self.thresholds = {
            'max_events_per_ip_per_hour': 100,
            'max_failed_logins_per_ip_per_hour': 5,
            'max_rate_limit_violations_per_ip_per_hour': 10,
            'block_duration_hours': 24
        }

        # Start cleanup thread only if not in a server environment that handles its own lifecycle
        # Comment out automatic thread start to prevent server shutdown issues
        # self.cleanup_thread = threading.Thread(target=self._cleanup_old_events, daemon=True)
        # self.cleanup_thread.start()

    def start_cleanup_thread(self):
        """
        Manually start the cleanup thread (call this if you want automatic cleanup)
        """
        if not hasattr(self, 'cleanup_thread') or not self.cleanup_thread.is_alive():
            self.cleanup_thread = threading.Thread(target=self._cleanup_old_events, daemon=True)
            self.cleanup_thread.start()
            logger.info("Security monitor cleanup thread started")

    def log_security_event(self, event_type: str, severity: str, source_ip: str,
                          user_agent: str, endpoint: str, details: Dict = None,
                          mitigation_action: Optional[str] = None):
        """
        Log a security event and perform automated threat detection
        """
        if details is None:
            details = {}

        event = SecurityEvent(
            timestamp=datetime.now(),
            event_type=event_type,
            severity=severity,
            source_ip=source_ip,
            user_agent=user_agent,
            endpoint=endpoint,
            details=details,
            mitigation_action=mitigation_action
        )

        with self._lock:
            self.events.append(event)
            self.event_counts[event_type] += 1

            # Automated threat detection
            self._analyze_threats(event)

        # Log to structured logger
        logger.warning(f"Security event: {event_type}", extra={
            'event_type': event_type,
            'severity': severity,
            'source_ip': source_ip,
            'endpoint': endpoint,
            'details': details,
            'mitigation': mitigation_action
        })

    def _analyze_threats(self, event: SecurityEvent):
        """
        Analyze security events for threat patterns
        """
        # Track suspicious activity per IP
        if event.severity in ['high', 'critical']:
            self.suspicious_ips[event.source_ip] += 1

        # Check for brute force attacks
        if event.event_type == 'failed_login':
            recent_failed_logins = self._get_recent_events(
                event.source_ip, 'failed_login', hours=1
            )
            if len(recent_failed_logins) >= self.thresholds['max_failed_logins_per_ip_per_hour']:
                self._block_ip(event.source_ip, "Brute force login attempt")

        # Check for rate limit abuse
        elif event.event_type == 'rate_limit_exceeded':
            recent_rate_limits = self._get_recent_events(
                event.source_ip, 'rate_limit_exceeded', hours=1
            )
            if len(recent_rate_limits) >= self.thresholds['max_rate_limit_violations_per_ip_per_hour']:
                self._block_ip(event.source_ip, "Excessive rate limit violations")

        # Check for general suspicious activity
        recent_events = self._get_recent_events(event.source_ip, hours=1)
        if len(recent_events) >= self.thresholds['max_events_per_ip_per_hour']:
            self._block_ip(event.source_ip, "Excessive security events")

    def _get_recent_events(self, source_ip: str, event_type: Optional[str] = None,
                          hours: int = 1) -> List[SecurityEvent]:
        """
        Get recent events for analysis
        """
        cutoff_time = datetime.now() - timedelta(hours=hours)
        recent_events = [
            event for event in self.events
            if event.timestamp > cutoff_time and event.source_ip == source_ip
        ]

        if event_type:
            recent_events = [event for event in recent_events if event.event_type == event_type]

        return recent_events

    def _block_ip(self, ip: str, reason: str):
        """
        Block an IP address for suspicious activity
        """
        if ip not in self.ip_blocklist:
            self.ip_blocklist.add(ip)
            logger.critical(f"IP blocked: {ip}", extra={
                'blocked_ip': ip,
                'reason': reason,
                'block_duration_hours': self.thresholds['block_duration_hours']
            })

            # Schedule unblock
            threading.Timer(
                self.thresholds['block_duration_hours'] * 3600,
                self._unblock_ip,
                args=[ip]
            ).start()

    def _unblock_ip(self, ip: str):
        """
        Remove IP from blocklist
        """
        with self._lock:
            self.ip_blocklist.discard(ip)
        logger.info(f"IP unblocked: {ip}", extra={'unblocked_ip': ip})

    def is_ip_blocked(self, ip: str) -> bool:
        """
        Check if an IP is currently blocked
        """
        return ip in self.ip_blocklist

    def get_security_stats(self) -> Dict:
        """
        Get comprehensive security statistics
        """
        with self._lock:
            now = datetime.now()
            last_24h = now - timedelta(hours=24)
            last_hour = now - timedelta(hours=1)

            recent_events = [e for e in self.events if e.timestamp > last_24h]
            hourly_events = [e for e in self.events if e.timestamp > last_hour]

            # Group events by type and severity
            event_summary = defaultdict(lambda: defaultdict(int))
            severity_summary = defaultdict(int)

            for event in recent_events:
                event_summary[event.event_type][event.severity] += 1
                severity_summary[event.severity] += 1

            return {
                'total_events_24h': len(recent_events),
                'events_per_hour': len(hourly_events),
                'blocked_ips': len(self.ip_blocklist),
                'suspicious_ips': dict(self.suspicious_ips),
                'event_summary': dict(event_summary),
                'severity_summary': dict(severity_summary),
                'top_event_types': sorted(
                    [(k, sum(v.values())) for k, v in event_summary.items()],
                    key=lambda x: x[1],
                    reverse=True
                )[:10]
            }

    def _cleanup_old_events(self):
        """
        Clean up old security events to prevent memory issues
        """
        self._cleanup_running = True
        while self._cleanup_running:
            time.sleep(3600)  # Run every hour
            cutoff_time = datetime.now() - timedelta(days=7)  # Keep 7 days of events

            with self._lock:
                old_count = len(self.events)
                self.events = [e for e in self.events if e.timestamp > cutoff_time]

                # Clean up suspicious IPs that haven't been active recently
                active_cutoff = datetime.now() - timedelta(hours=24)
                recent_ips = {e.source_ip for e in self.events if e.timestamp > active_cutoff}
                self.suspicious_ips = defaultdict(int, {
                    ip: count for ip, count in self.suspicious_ips.items()
                    if ip in recent_ips
                })

                if old_count != len(self.events):
                    logger.info("Cleaned up old security events", extra={
                        'removed_count': old_count - len(self.events),
                        'remaining_count': len(self.events)
                    })

    def stop_cleanup_thread(self):
        """
        Stop the cleanup thread gracefully
        """
        self._cleanup_running = False
        logger.info("Security monitor cleanup thread stopped")

# Global security monitor instance
security_monitor = SecurityMonitor()

def get_security_monitor() -> SecurityMonitor:
    """Get the global security monitor instance"""
    return security_monitor
