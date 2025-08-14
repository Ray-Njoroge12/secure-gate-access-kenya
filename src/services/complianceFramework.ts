/**
 * Compliance Framework Service
 * Comprehensive compliance management for GDPR, PDPA, ISO 27001, and other standards
 */

interface ComplianceRequirement {
  id: string;
  framework: ComplianceFramework;
  category: ComplianceCategory;
  title: string;
  description: string;
  mandatory: boolean;
  implemented: boolean;
  lastAudit: Date | null;
  evidence: string[];
  controls: string[];
  risks: ComplianceRisk[];
}

interface ComplianceRisk {
  id: string;
  description: string;
  likelihood: RiskLevel;
  impact: RiskLevel;
  mitigation: string;
  status: 'open' | 'mitigated' | 'accepted';
}

interface ComplianceAudit {
  id: string;
  framework: ComplianceFramework;
  auditor: string;
  date: Date;
  scope: string[];
  findings: ComplianceFinding[];
  overallScore: number;
  status: 'pending' | 'in_progress' | 'completed';
}

interface ComplianceFinding {
  id: string;
  requirement: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  recommendation: string;
  status: 'open' | 'in_progress' | 'resolved';
  dueDate: Date;
}

enum ComplianceFramework {
  GDPR = 'gdpr',
  PDPA = 'pdpa',
  ISO27001 = 'iso27001',
  SOC2 = 'soc2',
  NIST = 'nist',
  PCI_DSS = 'pci_dss',
  HIPAA = 'hipaa'
}

enum ComplianceCategory {
  DATA_PROTECTION = 'data_protection',
  ACCESS_CONTROL = 'access_control',
  ENCRYPTION = 'encryption',
  AUDIT_LOGGING = 'audit_logging',
  INCIDENT_RESPONSE = 'incident_response',
  BUSINESS_CONTINUITY = 'business_continuity',
  RISK_MANAGEMENT = 'risk_management',
  GOVERNANCE = 'governance'
}

enum RiskLevel {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

interface ComplianceMetrics {
  overallScore: number;
  implementationRate: number;
  criticalGaps: number;
  pendingActions: number;
  frameworkScores: Record<ComplianceFramework, number>;
  categoryScores: Record<ComplianceCategory, number>;
}

class ComplianceFrameworkService {
  private static instance: ComplianceFrameworkService;
  private requirements: Map<string, ComplianceRequirement> = new Map();
  private audits: ComplianceAudit[] = [];
  private policies: Map<string, any> = new Map();

  private constructor() {
    this.initializeRequirements();
  }

  public static getInstance(): ComplianceFrameworkService {
    if (!ComplianceFrameworkService.instance) {
      ComplianceFrameworkService.instance = new ComplianceFrameworkService();
    }
    return ComplianceFrameworkService.instance;
  }

  /**
   * Initialize compliance requirements for various frameworks
   */
  private initializeRequirements(): void {
    // GDPR Requirements
    this.addRequirement({
      id: 'gdpr_lawful_basis',
      framework: ComplianceFramework.GDPR,
      category: ComplianceCategory.DATA_PROTECTION,
      title: 'Lawful Basis for Processing',
      description: 'Establish and document lawful basis for processing personal data',
      mandatory: true,
      implemented: true,
      lastAudit: new Date('2024-01-01'),
      evidence: ['privacy_policy.pdf', 'consent_forms.pdf'],
      controls: ['DATA_PROCESSING_REGISTRY', 'CONSENT_MANAGEMENT'],
      risks: []
    });

    this.addRequirement({
      id: 'gdpr_data_encryption',
      framework: ComplianceFramework.GDPR,
      category: ComplianceCategory.ENCRYPTION,
      title: 'Data Encryption at Rest and in Transit',
      description: 'Implement appropriate encryption for personal data protection',
      mandatory: true,
      implemented: true,
      lastAudit: new Date('2024-01-15'),
      evidence: ['encryption_policy.pdf', 'technical_audit.pdf'],
      controls: ['AES_256_ENCRYPTION', 'TLS_1_3', 'KEY_MANAGEMENT'],
      risks: []
    });

    this.addRequirement({
      id: 'gdpr_right_erasure',
      framework: ComplianceFramework.GDPR,
      category: ComplianceCategory.DATA_PROTECTION,
      title: 'Right to Erasure (Right to be Forgotten)',
      description: 'Implement capability to erase personal data upon request',
      mandatory: true,
      implemented: false,
      lastAudit: null,
      evidence: [],
      controls: ['DATA_DELETION_PROCEDURES'],
      risks: [{
        id: 'gdpr_erasure_risk_1',
        description: 'Non-compliance with erasure requests may result in regulatory fines',
        likelihood: RiskLevel.MEDIUM,
        impact: RiskLevel.HIGH,
        mitigation: 'Implement automated data deletion workflows',
        status: 'open'
      }]
    });

    // ISO 27001 Requirements
    this.addRequirement({
      id: 'iso27001_access_control',
      framework: ComplianceFramework.ISO27001,
      category: ComplianceCategory.ACCESS_CONTROL,
      title: 'Access Control Management',
      description: 'Implement formal access control management system',
      mandatory: true,
      implemented: true,
      lastAudit: new Date('2024-01-10'),
      evidence: ['access_control_policy.pdf', 'rbac_implementation.pdf'],
      controls: ['RBAC', 'MFA', 'PRIVILEGE_ESCALATION_CONTROLS'],
      risks: []
    });

    this.addRequirement({
      id: 'iso27001_incident_response',
      framework: ComplianceFramework.ISO27001,
      category: ComplianceCategory.INCIDENT_RESPONSE,
      title: 'Information Security Incident Management',
      description: 'Establish formal incident response procedures',
      mandatory: true,
      implemented: true,
      lastAudit: new Date('2024-01-20'),
      evidence: ['incident_response_plan.pdf', 'playbooks.pdf'],
      controls: ['INCIDENT_DETECTION', 'RESPONSE_PROCEDURES', 'COMMUNICATION_PLAN'],
      risks: []
    });

    // PDPA (Kenya) Requirements
    this.addRequirement({
      id: 'pdpa_data_controller_registration',
      framework: ComplianceFramework.PDPA,
      category: ComplianceCategory.GOVERNANCE,
      title: 'Data Controller Registration',
      description: 'Register as data controller with Kenya Data Protection Authority',
      mandatory: true,
      implemented: false,
      lastAudit: null,
      evidence: [],
      controls: ['REGULATORY_REGISTRATION'],
      risks: [{
        id: 'pdpa_registration_risk_1',
        description: 'Operating without registration violates PDPA requirements',
        likelihood: RiskLevel.HIGH,
        impact: RiskLevel.HIGH,
        mitigation: 'Complete registration with ODPC immediately',
        status: 'open'
      }]
    });

    this.addRequirement({
      id: 'pdpa_data_breach_notification',
      framework: ComplianceFramework.PDPA,
      category: ComplianceCategory.INCIDENT_RESPONSE,
      title: 'Data Breach Notification',
      description: 'Notify ODPC and affected individuals of data breaches within 72 hours',
      mandatory: true,
      implemented: true,
      lastAudit: new Date('2024-01-25'),
      evidence: ['breach_notification_procedures.pdf'],
      controls: ['BREACH_DETECTION', 'NOTIFICATION_PROCEDURES'],
      risks: []
    });

    console.log('Compliance requirements initialized');
  }

  /**
   * Add a new compliance requirement
   */
  public addRequirement(requirement: ComplianceRequirement): void {
    this.requirements.set(requirement.id, requirement);
  }

  /**
   * Get all requirements for a specific framework
   */
  public getRequirementsByFramework(framework: ComplianceFramework): ComplianceRequirement[] {
    return Array.from(this.requirements.values())
      .filter(req => req.framework === framework);
  }

  /**
   * Get all requirements for a specific category
   */
  public getRequirementsByCategory(category: ComplianceCategory): ComplianceRequirement[] {
    return Array.from(this.requirements.values())
      .filter(req => req.category === category);
  }

  /**
   * Get requirements that are not implemented
   */
  public getGaps(): ComplianceRequirement[] {
    return Array.from(this.requirements.values())
      .filter(req => !req.implemented);
  }

  /**
   * Get requirements requiring immediate attention
   */
  public getCriticalGaps(): ComplianceRequirement[] {
    return this.getGaps().filter(req => req.mandatory);
  }

  /**
   * Calculate compliance metrics
   */
  public getComplianceMetrics(): ComplianceMetrics {
    const allRequirements = Array.from(this.requirements.values());
    const implementedCount = allRequirements.filter(req => req.implemented).length;
    const criticalGaps = this.getCriticalGaps().length;
    
    // Calculate framework scores
    const frameworkScores: Record<ComplianceFramework, number> = {} as any;
    Object.values(ComplianceFramework).forEach(framework => {
      const frameworkReqs = this.getRequirementsByFramework(framework);
      const implementedReqs = frameworkReqs.filter(req => req.implemented);
      frameworkScores[framework] = frameworkReqs.length > 0 
        ? (implementedReqs.length / frameworkReqs.length) * 100 
        : 0;
    });

    // Calculate category scores
    const categoryScores: Record<ComplianceCategory, number> = {} as any;
    Object.values(ComplianceCategory).forEach(category => {
      const categoryReqs = this.getRequirementsByCategory(category);
      const implementedReqs = categoryReqs.filter(req => req.implemented);
      categoryScores[category] = categoryReqs.length > 0 
        ? (implementedReqs.length / categoryReqs.length) * 100 
        : 0;
    });

    const overallScore = allRequirements.length > 0 
      ? (implementedCount / allRequirements.length) * 100 
      : 0;

    return {
      overallScore,
      implementationRate: overallScore,
      criticalGaps,
      pendingActions: this.getPendingActions().length,
      frameworkScores,
      categoryScores
    };
  }

  /**
   * Get pending actions requiring attention
   */
  public getPendingActions(): Array<{ type: string; description: string; priority: string; dueDate?: Date }> {
    const actions: Array<{ type: string; description: string; priority: string; dueDate?: Date }> = [];

    // Add gaps as actions
    this.getGaps().forEach(req => {
      actions.push({
        type: 'implementation',
        description: `Implement: ${req.title}`,
        priority: req.mandatory ? 'high' : 'medium'
      });
    });

    // Add audit findings as actions
    this.audits.forEach(audit => {
      audit.findings.filter(f => f.status !== 'resolved').forEach(finding => {
        actions.push({
          type: 'finding',
          description: `Resolve: ${finding.description}`,
          priority: finding.severity,
          dueDate: finding.dueDate
        });
      });
    });

    return actions;
  }

  /**
   * Conduct compliance assessment
   */
  public async conductAssessment(framework: ComplianceFramework, scope: string[] = []): Promise<ComplianceAudit> {
    const auditId = `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const requirements = scope.length > 0 
      ? Array.from(this.requirements.values()).filter(req => scope.includes(req.id))
      : this.getRequirementsByFramework(framework);

    const findings: ComplianceFinding[] = [];
    let totalScore = 0;

    requirements.forEach(req => {
      if (!req.implemented) {
        findings.push({
          id: `finding_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          requirement: req.id,
          severity: req.mandatory ? 'high' : 'medium',
          description: `Requirement not implemented: ${req.title}`,
          recommendation: `Implement ${req.title} to meet compliance requirements`,
          status: 'open',
          dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days from now
        });
      } else {
        totalScore += 1;
      }

      // Check for audit staleness
      if (req.lastAudit && req.lastAudit < new Date(Date.now() - 365 * 24 * 60 * 60 * 1000)) {
        findings.push({
          id: `finding_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          requirement: req.id,
          severity: 'low',
          description: `Requirement audit is stale: ${req.title}`,
          recommendation: 'Conduct updated assessment of this requirement',
          status: 'open',
          dueDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000) // 60 days from now
        });
      }
    });

    const overallScore = requirements.length > 0 ? (totalScore / requirements.length) * 100 : 0;

    const audit: ComplianceAudit = {
      id: auditId,
      framework,
      auditor: 'System Assessment',
      date: new Date(),
      scope: scope.length > 0 ? scope : requirements.map(req => req.id),
      findings,
      overallScore,
      status: 'completed'
    };

    this.audits.push(audit);
    
    console.log(`Compliance assessment completed for ${framework}:`, {
      score: overallScore,
      findings: findings.length
    });

    return audit;
  }

  /**
   * Generate compliance report
   */
  public generateComplianceReport(framework?: ComplianceFramework): any {
    const requirements = framework 
      ? this.getRequirementsByFramework(framework)
      : Array.from(this.requirements.values());

    const implemented = requirements.filter(req => req.implemented);
    const gaps = requirements.filter(req => !req.implemented);
    const criticalGaps = gaps.filter(req => req.mandatory);

    const report = {
      generatedAt: new Date().toISOString(),
      framework: framework || 'All Frameworks',
      summary: {
        totalRequirements: requirements.length,
        implemented: implemented.length,
        gaps: gaps.length,
        criticalGaps: criticalGaps.length,
        implementationRate: requirements.length > 0 ? (implemented.length / requirements.length) * 100 : 0
      },
      requirementsByCategory: this.groupRequirementsByCategory(requirements),
      gaps: gaps.map(req => ({
        id: req.id,
        title: req.title,
        framework: req.framework,
        category: req.category,
        mandatory: req.mandatory,
        risks: req.risks
      })),
      recentAudits: this.audits
        .filter(audit => !framework || audit.framework === framework)
        .sort((a, b) => b.date.getTime() - a.date.getTime())
        .slice(0, 5),
      recommendations: this.generateRecommendations(gaps)
    };

    return report;
  }

  /**
   * Group requirements by category
   */
  private groupRequirementsByCategory(requirements: ComplianceRequirement[]): Record<string, any> {
    const grouped: Record<string, any> = {};

    Object.values(ComplianceCategory).forEach(category => {
      const categoryReqs = requirements.filter(req => req.category === category);
      const implementedReqs = categoryReqs.filter(req => req.implemented);

      grouped[category] = {
        total: categoryReqs.length,
        implemented: implementedReqs.length,
        implementationRate: categoryReqs.length > 0 ? (implementedReqs.length / categoryReqs.length) * 100 : 0,
        requirements: categoryReqs.map(req => ({
          id: req.id,
          title: req.title,
          implemented: req.implemented,
          mandatory: req.mandatory
        }))
      };
    });

    return grouped;
  }

  /**
   * Generate compliance recommendations
   */
  private generateRecommendations(gaps: ComplianceRequirement[]): string[] {
    const recommendations: string[] = [];

    // Priority recommendations for critical gaps
    const criticalGaps = gaps.filter(req => req.mandatory);
    if (criticalGaps.length > 0) {
      recommendations.push(`Address ${criticalGaps.length} critical compliance gaps immediately`);
    }

    // Framework-specific recommendations
    const gdprGaps = gaps.filter(req => req.framework === ComplianceFramework.GDPR);
    if (gdprGaps.length > 0) {
      recommendations.push(`Complete GDPR implementation to avoid regulatory penalties`);
    }

    const pdpaGaps = gaps.filter(req => req.framework === ComplianceFramework.PDPA);
    if (pdpaGaps.length > 0) {
      recommendations.push(`Register with Kenya Data Protection Authority for PDPA compliance`);
    }

    // Category-specific recommendations
    const encryptionGaps = gaps.filter(req => req.category === ComplianceCategory.ENCRYPTION);
    if (encryptionGaps.length > 0) {
      recommendations.push(`Strengthen encryption implementations for data protection`);
    }

    const accessControlGaps = gaps.filter(req => req.category === ComplianceCategory.ACCESS_CONTROL);
    if (accessControlGaps.length > 0) {
      recommendations.push(`Enhance access control mechanisms and implement MFA`);
    }

    return recommendations;
  }

  /**
   * Mark requirement as implemented
   */
  public markImplemented(requirementId: string, evidence: string[] = []): boolean {
    const requirement = this.requirements.get(requirementId);
    if (requirement) {
      requirement.implemented = true;
      requirement.lastAudit = new Date();
      requirement.evidence.push(...evidence);
      return true;
    }
    return false;
  }

  /**
   * Add evidence to a requirement
   */
  public addEvidence(requirementId: string, evidence: string[]): boolean {
    const requirement = this.requirements.get(requirementId);
    if (requirement) {
      requirement.evidence.push(...evidence);
      return true;
    }
    return false;
  }

  /**
   * Get all audits
   */
  public getAudits(): ComplianceAudit[] {
    return this.audits.sort((a, b) => b.date.getTime() - a.date.getTime());
  }

  /**
   * Get audit by ID
   */
  public getAudit(auditId: string): ComplianceAudit | null {
    return this.audits.find(audit => audit.id === auditId) || null;
  }

  /**
   * Update finding status
   */
  public updateFinding(auditId: string, findingId: string, status: 'open' | 'in_progress' | 'resolved'): boolean {
    const audit = this.getAudit(auditId);
    if (audit) {
      const finding = audit.findings.find(f => f.id === findingId);
      if (finding) {
        finding.status = status;
        return true;
      }
    }
    return false;
  }

  /**
   * Schedule compliance review
   */
  public scheduleReview(framework: ComplianceFramework, dueDate: Date): void {
    console.log(`Compliance review scheduled for ${framework} on ${dueDate.toISOString()}`);
    // In a real implementation, this would integrate with a scheduling system
  }
}

export const complianceFramework = ComplianceFrameworkService.getInstance();
export { 
  ComplianceFramework, 
  ComplianceCategory, 
  RiskLevel,
  type ComplianceRequirement,
  type ComplianceAudit,
  type ComplianceFinding,
  type ComplianceMetrics
};
export default complianceFramework;
