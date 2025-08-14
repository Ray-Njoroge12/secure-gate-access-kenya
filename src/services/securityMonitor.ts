/**
 * Security Monitoring Service
 * Real-time security monitoring, anomaly detection, and threat intelligence
 */

interface SecurityEvent {
  id: string;
  timestamp: Date;
  type: SecurityEventType;
  severity: SecuritySeverity;
  userId?: string;
  ipAddress: string;
  userAgent: string;
  details: Record<string, any>;
  resolved: boolean;
}

enum SecurityEventType {
  LOGIN_ATTEMPT = 'login_attempt',
  LOGIN_SUCCESS = 'login_success',
  LOGIN_FAILURE = 'login_failure',
  MFA_ATTEMPT = 'mfa_attempt',
  MFA_FAILURE = 'mfa_failure',
  PASSWORD_CHANGE = 'password_change',
  PERMISSION_ESCALATION = 'permission_escalation',
  SUSPICIOUS_ACTIVITY = 'suspicious_activity',
  BRUTE_FORCE_ATTEMPT = 'brute_force_attempt',
  RATE_LIMIT_EXCEEDED = 'rate_limit_exceeded',
  DATA_ACCESS_ANOMALY = 'data_access_anomaly',
  GEOGRAPHIC_ANOMALY = 'geographic_anomaly',
  DEVICE_ANOMALY = 'device_anomaly',
  SQL_INJECTION_ATTEMPT = 'sql_injection_attempt',
  XSS_ATTEMPT = 'xss_attempt',
  UNAUTHORIZED_API_ACCESS = 'unauthorized_api_access'
}

enum SecuritySeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

interface ThreatIntelligence {
  ipAddress: string;
  riskScore: number;
  threatType: string[];
  lastSeen: Date;
  source: string;
}

interface SecurityMetrics {
  totalEvents: number;
  criticalEvents: number;
  resolvedEvents: number;
  averageResponseTime: number;
  topThreats: Array<{ type: string; count: number }>;
  riskScore: number;
}

class SecurityMonitoringService {
  private static instance: SecurityMonitoringService;
  private eventBuffer: SecurityEvent[] = [];
  private riskScores: Map<string, number> = new Map();
  private rateLimits: Map<string, { count: number; resetTime: number }> = new Map();
  private suspiciousIPs: Set<string> = new Set();
  private webhookEndpoints: string[] = [];

  private constructor() {
    this.initializeMonitoring();
  }

  public static getInstance(): SecurityMonitoringService {
    if (!SecurityMonitoringService.instance) {
      SecurityMonitoringService.instance = new SecurityMonitoringService();
    }
    return SecurityMonitoringService.instance;
  }

  /**
   * Initialize monitoring systems
   */
  private initializeMonitoring(): void {
    // Start periodic cleanup
    setInterval(() => this.cleanup(), 60000); // Every minute

    // Start threat intelligence updates
    setInterval(() => this.updateThreatIntelligence(), 300000); // Every 5 minutes

    // Load existing risk scores from storage
    this.loadRiskScores();

    console.log('Security monitoring initialized');
  }

  /**
   * Log a security event
   */
  public async logSecurityEvent(
    type: SecurityEventType,
    details: Record<string, any>,
    userId?: string
  ): Promise<void> {
    const event: SecurityEvent = {
      id: this.generateEventId(),
      timestamp: new Date(),
      type,
      severity: this.determineSeverity(type, details),
      userId,
      ipAddress: this.getClientIP(),
      userAgent: this.getUserAgent(),
      details,
      resolved: false
    };

    // Add to buffer
    this.eventBuffer.push(event);

    // Real-time analysis
    await this.analyzeEvent(event);

    // Send to external systems
    await this.sendToSIEM(event);

    // Trigger alerts if necessary
    if (event.severity === SecuritySeverity.CRITICAL || event.severity === SecuritySeverity.HIGH) {
      await this.triggerAlert(event);
    }

    console.log(`Security event logged: ${type} (${event.severity})`, event);
  }

  /**
   * Detect anomalies in user behavior
   */
  public async detectAnomalies(userId: string, activity: any): Promise<boolean> {
    const userProfile = await this.getUserProfile(userId);
    let anomalyScore = 0;

    // Geographic anomaly detection
    if (activity.location && userProfile.usualLocations) {
      const isUnusualLocation = !userProfile.usualLocations.some(
        (loc: any) => this.calculateDistance(loc, activity.location) < 50 // 50km radius
      );
      if (isUnusualLocation) anomalyScore += 30;
    }

    // Time-based anomaly detection
    if (activity.timestamp && userProfile.usualActivityHours) {
      const hour = new Date(activity.timestamp).getHours();
      if (!userProfile.usualActivityHours.includes(hour)) {
        anomalyScore += 20;
      }
    }

    // Device fingerprint anomaly
    if (activity.deviceFingerprint && userProfile.knownDevices) {
      const isKnownDevice = userProfile.knownDevices.includes(activity.deviceFingerprint);
      if (!isKnownDevice) anomalyScore += 25;
    }

    // Volume anomaly detection
    if (activity.requestCount && userProfile.averageRequestCount) {
      const ratio = activity.requestCount / userProfile.averageRequestCount;
      if (ratio > 3) anomalyScore += 25; // 3x normal activity
    }

    // Log anomaly if score is high
    if (anomalyScore >= 50) {
      await this.logSecurityEvent(SecurityEventType.SUSPICIOUS_ACTIVITY, {
        anomalyScore,
        userId,
        activity,
        reasons: this.getAnomalyReasons(anomalyScore)
      }, userId);
      return true;
    }

    return false;
  }

  /**
   * Check for brute force attacks
   */
  public async checkBruteForce(ipAddress: string, action: string): Promise<boolean> {
    const key = `${ipAddress}:${action}`;
    const now = Date.now();
    const windowSize = 15 * 60 * 1000; // 15 minutes
    
    const current = this.rateLimits.get(key) || { count: 0, resetTime: now + windowSize };

    if (now > current.resetTime) {
      // Reset window
      current.count = 1;
      current.resetTime = now + windowSize;
    } else {
      current.count++;
    }

    this.rateLimits.set(key, current);

    // Define thresholds
    const thresholds: Record<string, number> = {
      login: 5,
      password_reset: 3,
      mfa_attempt: 10,
      api_access: 100
    };

    const threshold = thresholds[action] || 10;

    if (current.count > threshold) {
      await this.logSecurityEvent(SecurityEventType.BRUTE_FORCE_ATTEMPT, {
        ipAddress,
        action,
        attemptCount: current.count,
        windowStart: new Date(current.resetTime - windowSize)
      });

      this.suspiciousIPs.add(ipAddress);
      return true;
    }

    return false;
  }

  /**
   * Analyze incoming events for patterns
   */
  private async analyzeEvent(event: SecurityEvent): Promise<void> {
    // Update risk score for user
    if (event.userId) {
      const currentScore = this.riskScores.get(event.userId) || 0;
      const newScore = this.calculateRiskScore(event, currentScore);
      this.riskScores.set(event.userId, newScore);

      // Trigger additional monitoring for high-risk users
      if (newScore > 80) {
        await this.enableEnhancedMonitoring(event.userId);
      }
    }

    // Check for attack patterns
    await this.detectAttackPatterns(event);

    // Update threat intelligence
    if (event.ipAddress) {
      await this.updateIPThreatLevel(event.ipAddress, event);
    }
  }

  /**
   * Detect common attack patterns
   */
  private async detectAttackPatterns(event: SecurityEvent): Promise<void> {
    const recentEvents = this.eventBuffer.filter(
      e => e.timestamp.getTime() > Date.now() - 300000 // Last 5 minutes
    );

    // SQL Injection pattern detection
    if (event.type === SecurityEventType.SQL_INJECTION_ATTEMPT) {
      const sqlEvents = recentEvents.filter(e => e.type === SecurityEventType.SQL_INJECTION_ATTEMPT);
      if (sqlEvents.length > 3) {
        await this.logSecurityEvent(SecurityEventType.SUSPICIOUS_ACTIVITY, {
          pattern: 'persistent_sql_injection',
          eventCount: sqlEvents.length,
          timeWindow: '5_minutes'
        });
      }
    }

    // Rapid login failures from same IP
    if (event.type === SecurityEventType.LOGIN_FAILURE) {
      const loginFailures = recentEvents.filter(
        e => e.type === SecurityEventType.LOGIN_FAILURE && e.ipAddress === event.ipAddress
      );
      if (loginFailures.length > 10) {
        await this.logSecurityEvent(SecurityEventType.BRUTE_FORCE_ATTEMPT, {
          pattern: 'rapid_login_failures',
          ipAddress: event.ipAddress,
          failureCount: loginFailures.length
        });
      }
    }
  }

  /**
   * Get security metrics and dashboard data
   */
  public getSecurityMetrics(timeRange: { start: Date; end: Date }): SecurityMetrics {
    const events = this.eventBuffer.filter(
      e => e.timestamp >= timeRange.start && e.timestamp <= timeRange.end
    );

    const criticalEvents = events.filter(e => e.severity === SecuritySeverity.CRITICAL);
    const resolvedEvents = events.filter(e => e.resolved);

    const threatCounts: Record<string, number> = {};
    events.forEach(e => {
      threatCounts[e.type] = (threatCounts[e.type] || 0) + 1;
    });

    const topThreats = Object.entries(threatCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([type, count]) => ({ type, count }));

    const averageRiskScore = Array.from(this.riskScores.values())
      .reduce((sum, score) => sum + score, 0) / this.riskScores.size || 0;

    return {
      totalEvents: events.length,
      criticalEvents: criticalEvents.length,
      resolvedEvents: resolvedEvents.length,
      averageResponseTime: this.calculateAverageResponseTime(events),
      topThreats,
      riskScore: averageRiskScore
    };
  }

  /**
   * Enable enhanced monitoring for high-risk users
   */
  private async enableEnhancedMonitoring(userId: string): Promise<void> {
    console.log(`Enhanced monitoring enabled for user: ${userId}`);
    
    // In a real implementation:
    // 1. Increase logging frequency
    // 2. Enable real-time session monitoring
    // 3. Require additional authentication
    // 4. Notify security team
  }

  /**
   * Send alerts to configured endpoints
   */
  private async triggerAlert(event: SecurityEvent): Promise<void> {
    const alert = {
      timestamp: new Date().toISOString(),
      event: event,
      message: `Security Alert: ${event.type} detected`,
      severity: event.severity,
      actionRequired: this.getRecommendedActions(event)
    };

    // Send to webhooks
    for (const endpoint of this.webhookEndpoints) {
      try {
        await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(alert)
        });
      } catch (error) {
        console.error(`Failed to send alert to ${endpoint}:`, error);
      }
    }

    // Send to console for demo
    console.warn('🚨 SECURITY ALERT:', alert);
  }

  // Utility methods
  private generateEventId(): string {
    return `sec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private determineSeverity(type: SecurityEventType, details: any): SecuritySeverity {
    const severityMap: Record<SecurityEventType, SecuritySeverity> = {
      [SecurityEventType.LOGIN_SUCCESS]: SecuritySeverity.LOW,
      [SecurityEventType.LOGIN_ATTEMPT]: SecuritySeverity.LOW,
      [SecurityEventType.LOGIN_FAILURE]: SecuritySeverity.MEDIUM,
      [SecurityEventType.BRUTE_FORCE_ATTEMPT]: SecuritySeverity.HIGH,
      [SecurityEventType.SQL_INJECTION_ATTEMPT]: SecuritySeverity.CRITICAL,
      [SecurityEventType.XSS_ATTEMPT]: SecuritySeverity.HIGH,
      [SecurityEventType.PERMISSION_ESCALATION]: SecuritySeverity.CRITICAL,
      [SecurityEventType.SUSPICIOUS_ACTIVITY]: SecuritySeverity.MEDIUM,
      [SecurityEventType.MFA_ATTEMPT]: SecuritySeverity.LOW,
      [SecurityEventType.MFA_FAILURE]: SecuritySeverity.MEDIUM,
      [SecurityEventType.PASSWORD_CHANGE]: SecuritySeverity.MEDIUM,
      [SecurityEventType.RATE_LIMIT_EXCEEDED]: SecuritySeverity.MEDIUM,
      [SecurityEventType.DATA_ACCESS_ANOMALY]: SecuritySeverity.HIGH,
      [SecurityEventType.GEOGRAPHIC_ANOMALY]: SecuritySeverity.MEDIUM,
      [SecurityEventType.DEVICE_ANOMALY]: SecuritySeverity.MEDIUM,
      [SecurityEventType.UNAUTHORIZED_API_ACCESS]: SecuritySeverity.HIGH
    };

    return severityMap[type] || SecuritySeverity.MEDIUM;
  }

  private calculateRiskScore(event: SecurityEvent, currentScore: number): number {
    const scoreDeltas: Record<SecurityEventType, number> = {
      [SecurityEventType.LOGIN_FAILURE]: 5,
      [SecurityEventType.BRUTE_FORCE_ATTEMPT]: 30,
      [SecurityEventType.SUSPICIOUS_ACTIVITY]: 20,
      [SecurityEventType.MFA_FAILURE]: 10,
      [SecurityEventType.LOGIN_SUCCESS]: -2,
      [SecurityEventType.LOGIN_ATTEMPT]: 0,
      [SecurityEventType.MFA_ATTEMPT]: 0,
      [SecurityEventType.PASSWORD_CHANGE]: 5,
      [SecurityEventType.PERMISSION_ESCALATION]: 40,
      [SecurityEventType.RATE_LIMIT_EXCEEDED]: 15,
      [SecurityEventType.DATA_ACCESS_ANOMALY]: 25,
      [SecurityEventType.GEOGRAPHIC_ANOMALY]: 15,
      [SecurityEventType.DEVICE_ANOMALY]: 10,
      [SecurityEventType.SQL_INJECTION_ATTEMPT]: 50,
      [SecurityEventType.XSS_ATTEMPT]: 40,
      [SecurityEventType.UNAUTHORIZED_API_ACCESS]: 35
    };

    const delta = scoreDeltas[event.type] || 0;
    return Math.max(0, Math.min(100, currentScore + delta));
  }

  private getClientIP(): string {
    // In a real implementation, extract from request headers
    return '192.168.1.100';
  }

  private getUserAgent(): string {
    return navigator.userAgent || 'Unknown';
  }

  private async getUserProfile(userId: string): Promise<any> {
    // Mock user profile data
    return {
      usualLocations: [{ lat: -1.2921, lng: 36.8219 }], // Nairobi
      usualActivityHours: [8, 9, 10, 11, 12, 13, 14, 15, 16, 17],
      knownDevices: ['device_fingerprint_123'],
      averageRequestCount: 50
    };
  }

  private calculateDistance(loc1: any, loc2: any): number {
    // Simple distance calculation for demo
    const dx = loc1.lat - loc2.lat;
    const dy = loc1.lng - loc2.lng;
    return Math.sqrt(dx * dx + dy * dy) * 111; // Rough km conversion
  }

  private getAnomalyReasons(score: number): string[] {
    const reasons: string[] = [];
    if (score >= 50) reasons.push('High anomaly score detected');
    return reasons;
  }

  private async sendToSIEM(event: SecurityEvent): Promise<void> {
    // In a real implementation, send to SIEM system
    console.log('Sending to SIEM:', event.type);
  }

  private async updateThreatIntelligence(): Promise<void> {
    // Update threat intelligence feeds
    console.log('Updating threat intelligence...');
  }

  private async updateIPThreatLevel(ipAddress: string, event: SecurityEvent): Promise<void> {
    // Update IP threat assessment
    if (event.severity === SecuritySeverity.HIGH || event.severity === SecuritySeverity.CRITICAL) {
      this.suspiciousIPs.add(ipAddress);
    }
  }

  private calculateAverageResponseTime(events: SecurityEvent[]): number {
    // Mock calculation for demo
    return 120; // 2 minutes average
  }

  private getRecommendedActions(event: SecurityEvent): string[] {
    const actionMap: Partial<Record<SecurityEventType, string[]>> = {
      [SecurityEventType.BRUTE_FORCE_ATTEMPT]: ['Block IP address', 'Enable account lockout', 'Notify user'],
      [SecurityEventType.SQL_INJECTION_ATTEMPT]: ['Block malicious requests', 'Review WAF rules', 'Audit database access'],
      [SecurityEventType.PERMISSION_ESCALATION]: ['Revoke elevated permissions', 'Review access controls', 'Investigate user account'],
      [SecurityEventType.XSS_ATTEMPT]: ['Block malicious scripts', 'Review input validation', 'Update WAF rules'],
      [SecurityEventType.UNAUTHORIZED_API_ACCESS]: ['Revoke API access', 'Review API keys', 'Audit permissions'],
      [SecurityEventType.DATA_ACCESS_ANOMALY]: ['Review data access patterns', 'Verify user permissions', 'Monitor user activity'],
      [SecurityEventType.SUSPICIOUS_ACTIVITY]: ['Monitor user closely', 'Review recent activity', 'Consider account restrictions']
    };

    return actionMap[event.type] || ['Monitor situation', 'Review logs'];
  }

  private loadRiskScores(): void {
    // Load from persistent storage
    const stored = localStorage.getItem('user_risk_scores');
    if (stored) {
      const scores = JSON.parse(stored);
      this.riskScores = new Map(Object.entries(scores));
    }
  }

  private cleanup(): void {
    // Remove old events (keep last 24 hours)
    const cutoff = Date.now() - 24 * 60 * 60 * 1000;
    this.eventBuffer = this.eventBuffer.filter(e => e.timestamp.getTime() > cutoff);

    // Clear old rate limits
    const now = Date.now();
    for (const [key, limit] of this.rateLimits.entries()) {
      if (now > limit.resetTime) {
        this.rateLimits.delete(key);
      }
    }

    // Save risk scores
    const scoresObj = Object.fromEntries(this.riskScores);
    localStorage.setItem('user_risk_scores', JSON.stringify(scoresObj));
  }

  /**
   * Configure webhook endpoints for alerts
   */
  public setWebhookEndpoints(endpoints: string[]): void {
    this.webhookEndpoints = endpoints;
  }

  /**
   * Get recent security events
   */
  public getRecentEvents(limit: number = 100): SecurityEvent[] {
    return this.eventBuffer
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
  }

  /**
   * Mark event as resolved
   */
  public resolveEvent(eventId: string): boolean {
    const event = this.eventBuffer.find(e => e.id === eventId);
    if (event) {
      event.resolved = true;
      return true;
    }
    return false;
  }
}

export const securityMonitor = SecurityMonitoringService.getInstance();
export { SecurityEventType, SecuritySeverity };
export type { SecurityEvent, SecurityMetrics };
export default securityMonitor;
