/**
 * Security Policy Service
 * Comprehensive security policy management and enforcement
 */

interface SecurityPolicy {
  id: string;
  name: string;
  category: PolicyCategory;
  description: string;
  rules: SecurityRule[];
  enforcement: EnforcementLevel;
  active: boolean;
  version: string;
  lastUpdated: Date;
  applicableRoles: string[];
  exceptions: PolicyException[];
}

interface SecurityRule {
  id: string;
  condition: string;
  action: PolicyAction;
  parameters: Record<string, any>;
  priority: number;
}

interface PolicyException {
  id: string;
  reason: string;
  approvedBy: string;
  expiresAt: Date;
  conditions: string[];
}

enum PolicyCategory {
  ACCESS_CONTROL = 'access_control',
  DATA_PROTECTION = 'data_protection',
  AUTHENTICATION = 'authentication',
  ENCRYPTION = 'encryption',
  AUDIT_LOGGING = 'audit_logging',
  INCIDENT_RESPONSE = 'incident_response',
  NETWORK_SECURITY = 'network_security',
  COMPLIANCE = 'compliance'
}

enum EnforcementLevel {
  STRICT = 'strict',
  MODERATE = 'moderate',
  ADVISORY = 'advisory',
  DISABLED = 'disabled'
}

enum PolicyAction {
  ALLOW = 'allow',
  DENY = 'deny',
  LOG = 'log',
  ALERT = 'alert',
  QUARANTINE = 'quarantine',
  REQUIRE_MFA = 'require_mfa',
  REQUIRE_APPROVAL = 'require_approval'
}

interface PolicyViolation {
  id: string;
  policyId: string;
  userId?: string;
  ipAddress: string;
  timestamp: Date;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  data: Record<string, any>;
  resolved: boolean;
  actionTaken: string;
}

class SecurityPolicyService {
  private static instance: SecurityPolicyService;
  private policies: Map<string, SecurityPolicy> = new Map();
  private violations: PolicyViolation[] = [];
  private enforcementEnabled = true;

  private constructor() {
    this.initializePolicies();
  }

  public static getInstance(): SecurityPolicyService {
    if (!SecurityPolicyService.instance) {
      SecurityPolicyService.instance = new SecurityPolicyService();
    }
    return SecurityPolicyService.instance;
  }

  /**
   * Initialize default security policies
   */
  private initializePolicies(): void {
    // Authentication Policy
    this.addPolicy({
      id: 'auth_mfa_required',
      name: 'Multi-Factor Authentication Required',
      category: PolicyCategory.AUTHENTICATION,
      description: 'Require MFA for all administrative access',
      rules: [{
        id: 'mfa_rule_1',
        condition: 'user.role === "admin" || user.role === "security_guard"',
        action: PolicyAction.REQUIRE_MFA,
        parameters: { methods: ['totp', 'sms'] },
        priority: 1
      }],
      enforcement: EnforcementLevel.STRICT,
      active: true,
      version: '1.0',
      lastUpdated: new Date(),
      applicableRoles: ['admin', 'security_guard'],
      exceptions: []
    });

    // Access Control Policy
    this.addPolicy({
      id: 'access_time_restriction',
      name: 'Business Hours Access Control',
      category: PolicyCategory.ACCESS_CONTROL,
      description: 'Restrict administrative access to business hours',
      rules: [{
        id: 'time_rule_1',
        condition: 'hour < 8 || hour > 18',
        action: PolicyAction.REQUIRE_APPROVAL,
        parameters: { approvers: ['admin'] },
        priority: 2
      }],
      enforcement: EnforcementLevel.MODERATE,
      active: true,
      version: '1.0',
      lastUpdated: new Date(),
      applicableRoles: ['security_guard', 'resident'],
      exceptions: []
    });

    // Data Protection Policy
    this.addPolicy({
      id: 'data_encryption_required',
      name: 'PII Encryption Mandatory',
      category: PolicyCategory.DATA_PROTECTION,
      description: 'All PII data must be encrypted at rest and in transit',
      rules: [{
        id: 'encryption_rule_1',
        condition: 'data.contains_pii === true',
        action: PolicyAction.DENY,
        parameters: { require_encryption: true },
        priority: 1
      }],
      enforcement: EnforcementLevel.STRICT,
      active: true,
      version: '1.0',
      lastUpdated: new Date(),
      applicableRoles: ['*'],
      exceptions: []
    });

    // Network Security Policy
    this.addPolicy({
      id: 'suspicious_ip_blocking',
      name: 'Suspicious IP Address Blocking',
      category: PolicyCategory.NETWORK_SECURITY,
      description: 'Block access from known malicious IP addresses',
      rules: [{
        id: 'ip_block_rule_1',
        condition: 'ip.in_blacklist === true',
        action: PolicyAction.DENY,
        parameters: { block_duration: 3600 },
        priority: 1
      }],
      enforcement: EnforcementLevel.STRICT,
      active: true,
      version: '1.0',
      lastUpdated: new Date(),
      applicableRoles: ['*'],
      exceptions: []
    });

    // Audit Logging Policy
    this.addPolicy({
      id: 'audit_all_admin_actions',
      name: 'Comprehensive Admin Audit Logging',
      category: PolicyCategory.AUDIT_LOGGING,
      description: 'Log all administrative actions for compliance',
      rules: [{
        id: 'audit_rule_1',
        condition: 'user.role === "admin"',
        action: PolicyAction.LOG,
        parameters: { detail_level: 'comprehensive' },
        priority: 1
      }],
      enforcement: EnforcementLevel.STRICT,
      active: true,
      version: '1.0',
      lastUpdated: new Date(),
      applicableRoles: ['admin'],
      exceptions: []
    });

    console.log('Security policies initialized');
  }

  /**
   * Add a new security policy
   */
  public addPolicy(policy: SecurityPolicy): void {
    this.policies.set(policy.id, policy);
    console.log(`Security policy added: ${policy.name}`);
  }

  /**
   * Evaluate policies for a given context
   */
  public async evaluatePolicies(context: {
    user?: { id: string; role: string; email: string };
    action: string;
    resource?: string;
    ipAddress: string;
    userAgent: string;
    timestamp: Date;
    data?: Record<string, any>;
  }): Promise<{
    allowed: boolean;
    requiredActions: PolicyAction[];
    violations: PolicyViolation[];
    recommendations: string[];
  }> {
    const applicablePolicies = this.getApplicablePolicies(context);
    const violations: PolicyViolation[] = [];
    const requiredActions: PolicyAction[] = [];
    const recommendations: string[] = [];
    let allowed = true;

    for (const policy of applicablePolicies) {
      if (!policy.active) continue;

      for (const rule of policy.rules) {
        const ruleResult = await this.evaluateRule(rule, context);
        
        if (ruleResult.triggered) {
          // Log the policy evaluation
          console.log(`Policy triggered: ${policy.name} - Rule: ${rule.id}`);

          switch (rule.action) {
            case PolicyAction.DENY:
              allowed = false;
              violations.push({
                id: `violation_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                policyId: policy.id,
                userId: context.user?.id,
                ipAddress: context.ipAddress,
                timestamp: context.timestamp,
                severity: 'high',
                description: `Policy violation: ${policy.name}`,
                data: context.data || {},
                resolved: false,
                actionTaken: 'access_denied'
              });
              break;

            case PolicyAction.REQUIRE_MFA:
              requiredActions.push(PolicyAction.REQUIRE_MFA);
              recommendations.push('Multi-factor authentication required');
              break;

            case PolicyAction.REQUIRE_APPROVAL:
              requiredActions.push(PolicyAction.REQUIRE_APPROVAL);
              recommendations.push('Administrative approval required');
              break;

            case PolicyAction.LOG:
              requiredActions.push(PolicyAction.LOG);
              break;

            case PolicyAction.ALERT:
              requiredActions.push(PolicyAction.ALERT);
              recommendations.push('Security alert generated');
              break;

            case PolicyAction.QUARANTINE:
              requiredActions.push(PolicyAction.QUARANTINE);
              recommendations.push('Resource quarantined for review');
              break;
          }
        }
      }
    }

    // Store violations
    this.violations.push(...violations);

    return {
      allowed,
      requiredActions: [...new Set(requiredActions)],
      violations,
      recommendations
    };
  }

  /**
   * Get policies applicable to the given context
   */
  private getApplicablePolicies(context: any): SecurityPolicy[] {
    return Array.from(this.policies.values()).filter(policy => {
      // Check if policy applies to user role
      if (policy.applicableRoles.includes('*')) return true;
      if (context.user && policy.applicableRoles.includes(context.user.role)) return true;
      return false;
    });
  }

  /**
   * Evaluate a specific rule against context
   */
  private async evaluateRule(rule: SecurityRule, context: any): Promise<{ triggered: boolean; reason?: string }> {
    try {
      // Simple rule evaluation - in production, use a proper expression engine
      const condition = rule.condition;

      // User role checks
      if (condition.includes('user.role')) {
        const userRole = context.user?.role || 'anonymous';
        const evalCondition = condition.replace('user.role', `"${userRole}"`);
        const result = this.safeEval(evalCondition);
        return { triggered: result, reason: result ? 'User role condition met' : undefined };
      }

      // Time-based checks
      if (condition.includes('hour')) {
        const hour = context.timestamp.getHours();
        const evalCondition = condition.replace(/hour/g, hour.toString());
        const result = this.safeEval(evalCondition);
        return { triggered: result, reason: result ? 'Time-based condition met' : undefined };
      }

      // IP blacklist checks
      if (condition.includes('ip.in_blacklist')) {
        const isBlacklisted = await this.checkIPBlacklist(context.ipAddress);
        const result = isBlacklisted;
        return { triggered: result, reason: result ? 'IP address blacklisted' : undefined };
      }

      // PII data checks
      if (condition.includes('data.contains_pii')) {
        const containsPII = this.detectPII(context.data || {});
        const result = containsPII;
        return { triggered: result, reason: result ? 'PII data detected' : undefined };
      }

      return { triggered: false };
    } catch (error) {
      console.error('Rule evaluation error:', error);
      return { triggered: false, reason: 'Evaluation error' };
    }
  }

  /**
   * Safe evaluation of simple expressions
   */
  private safeEval(expression: string): boolean {
    try {
      // Very basic safe evaluation for demo purposes
      // In production, use a proper sandboxed expression evaluator
      if (expression.includes('===')) {
        const [left, right] = expression.split('===').map(s => s.trim());
        const leftVal = left.replace(/"/g, '');
        const rightVal = right.replace(/"/g, '');
        return leftVal === rightVal;
      }
      if (expression.includes('<') || expression.includes('>')) {
        return eval(expression);
      }
      return false;
    } catch {
      return false;
    }
  }

  /**
   * Check if IP address is blacklisted
   */
  private async checkIPBlacklist(ipAddress: string): Promise<boolean> {
    // Mock blacklist for demo
    const blacklistedIPs = ['192.168.1.100', '10.0.0.1'];
    return blacklistedIPs.includes(ipAddress);
  }

  /**
   * Detect PII in data
   */
  private detectPII(data: Record<string, any>): boolean {
    const piiFields = ['email', 'phone', 'ssn', 'id_number', 'full_name', 'address'];
    return Object.keys(data).some(key => 
      piiFields.some(piiField => key.toLowerCase().includes(piiField))
    );
  }

  /**
   * Get all policies
   */
  public getPolicies(): SecurityPolicy[] {
    return Array.from(this.policies.values());
  }

  /**
   * Get policies by category
   */
  public getPoliciesByCategory(category: PolicyCategory): SecurityPolicy[] {
    return Array.from(this.policies.values()).filter(policy => policy.category === category);
  }

  /**
   * Update policy
   */
  public updatePolicy(policyId: string, updates: Partial<SecurityPolicy>): boolean {
    const policy = this.policies.get(policyId);
    if (policy) {
      Object.assign(policy, updates, { lastUpdated: new Date() });
      return true;
    }
    return false;
  }

  /**
   * Toggle policy enforcement
   */
  public togglePolicy(policyId: string, active: boolean): boolean {
    return this.updatePolicy(policyId, { active });
  }

  /**
   * Get policy violations
   */
  public getViolations(options?: {
    userId?: string;
    severity?: string;
    resolved?: boolean;
    limit?: number;
  }): PolicyViolation[] {
    let filtered = this.violations;

    if (options?.userId) {
      filtered = filtered.filter(v => v.userId === options.userId);
    }
    if (options?.severity) {
      filtered = filtered.filter(v => v.severity === options.severity);
    }
    if (options?.resolved !== undefined) {
      filtered = filtered.filter(v => v.resolved === options.resolved);
    }

    filtered = filtered.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

    if (options?.limit) {
      filtered = filtered.slice(0, options.limit);
    }

    return filtered;
  }

  /**
   * Resolve violation
   */
  public resolveViolation(violationId: string, actionTaken: string): boolean {
    const violation = this.violations.find(v => v.id === violationId);
    if (violation) {
      violation.resolved = true;
      violation.actionTaken = actionTaken;
      return true;
    }
    return false;
  }

  /**
   * Add policy exception
   */
  public addPolicyException(policyId: string, exception: PolicyException): boolean {
    const policy = this.policies.get(policyId);
    if (policy) {
      policy.exceptions.push(exception);
      return true;
    }
    return false;
  }

  /**
   * Check if exception applies
   */
  private checkException(policy: SecurityPolicy, context: any): boolean {
    return policy.exceptions.some(exception => {
      if (exception.expiresAt < new Date()) return false;
      
      // Check exception conditions
      return exception.conditions.every(condition => {
        // Simple condition checking for demo
        if (condition.includes('user.id') && context.user) {
          return condition.includes(context.user.id);
        }
        return false;
      });
    });
  }

  /**
   * Generate policy compliance report
   */
  public generateComplianceReport(): {
    totalPolicies: number;
    activePolicies: number;
    totalViolations: number;
    unresolvedViolations: number;
    violationsByCategory: Record<string, number>;
    policyEffectiveness: Record<string, number>;
  } {
    const totalPolicies = this.policies.size;
    const activePolicies = Array.from(this.policies.values()).filter(p => p.active).length;
    const totalViolations = this.violations.length;
    const unresolvedViolations = this.violations.filter(v => !v.resolved).length;

    const violationsByCategory: Record<string, number> = {};
    const policyEffectiveness: Record<string, number> = {};

    // Calculate violations by category
    this.violations.forEach(violation => {
      const policy = this.policies.get(violation.policyId);
      if (policy) {
        const category = policy.category;
        violationsByCategory[category] = (violationsByCategory[category] || 0) + 1;
      }
    });

    // Calculate policy effectiveness
    this.policies.forEach(policy => {
      const policyViolations = this.violations.filter(v => v.policyId === policy.id);
      const resolvedViolations = policyViolations.filter(v => v.resolved);
      
      policyEffectiveness[policy.id] = policyViolations.length > 0 
        ? (resolvedViolations.length / policyViolations.length) * 100 
        : 100;
    });

    return {
      totalPolicies,
      activePolicies,
      totalViolations,
      unresolvedViolations,
      violationsByCategory,
      policyEffectiveness
    };
  }

  /**
   * Enable/disable policy enforcement globally
   */
  public setEnforcementEnabled(enabled: boolean): void {
    this.enforcementEnabled = enabled;
    console.log(`Policy enforcement ${enabled ? 'enabled' : 'disabled'}`);
  }

  /**
   * Check if enforcement is enabled
   */
  public isEnforcementEnabled(): boolean {
    return this.enforcementEnabled;
  }
}

export const securityPolicyService = SecurityPolicyService.getInstance();
export { 
  PolicyCategory, 
  EnforcementLevel, 
  PolicyAction,
  type SecurityPolicy,
  type SecurityRule,
  type PolicyViolation
};
export default securityPolicyService;
