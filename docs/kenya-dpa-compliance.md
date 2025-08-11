# Kenya Data Protection Act (DPA) Compliance Guide
## Secure Gate Access System

### Executive Summary
This document outlines compliance measures for the Secure Gate Access Kenya system under the Kenya Data Protection Act, 2019. The system processes visitor and resident personal data for legitimate security purposes in gated communities.

## Legal Framework

### 1. Kenya Data Protection Act, 2019
- **Effective**: November 25, 2019
- **Regulatory Authority**: Office of the Data Protection Commissioner (ODPC)
- **Registration Required**: Yes, for data controllers processing personal data
- **Data Localization**: Required for critical data (resident/visitor information)

### 2. Relevant Regulations
- Data Protection (General) Regulations, 2021
- Data Protection (Complaints and Enforcement Procedures) Regulations, 2021
- Data Protection (Registration of Data Controllers and Data Processors) Regulations, 2021

## Data Processing Inventory

### 3. Personal Data Categories
| Data Category | Purpose | Legal Basis | Retention |
|---------------|---------|-------------|-----------|
| Visitor Identity | Access control, security | Legitimate interests | 90 days post-visit |
| Resident Profile | Community management | Contract performance | Duration of residency |
| Access Logs | Security audit, compliance | Legal obligation | 2 years |
| Communication | Service delivery | Contract performance | 1 year |

### 4. Data Subjects' Rights Implementation

#### Right to Information (Article 23)
```javascript
// Privacy notice displayed during visitor registration
const privacyNotice = {
  controller: "Secure Gate Access Kenya",
  purpose: "Visitor access control and community security",
  legalBasis: "Legitimate interests in property security",
  retention: "90 days after visit completion",
  rights: "Access, rectification, erasure, objection",
  contact: "dpo@securegatekenya.com"
};
```

#### Right of Access (Article 24)
```typescript
// API endpoint for data subject access requests
router.get('/api/data-access/:requestId', async (req, res) => {
  const { requestId } = req.params;
  
  // Verify identity and request
  const request = await verifyAccessRequest(requestId);
  if (!request.verified) {
    return res.status(403).json({ error: 'Unauthorized access request' });
  }
  
  // Retrieve all personal data for the subject
  const personalData = await getPersonalData(request.subjectId);
  
  res.json({
    data: personalData,
    exported: new Date().toISOString(),
    format: 'JSON',
    rights_information: privacyNotice
  });
});
```

#### Right to Erasure (Article 26)
```typescript
// Automated data deletion for expired records
async function deleteExpiredVisitorData() {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - 90); // 90 days retention
  
  // Delete expired visitor records
  await supabase
    .from('visitors')
    .delete()
    .lt('created_at', cutoffDate.toISOString())
    .eq('registration_status', 'completed');
    
  // Delete associated access codes
  await supabase
    .from('access_codes')
    .delete()
    .lt('created_at', cutoffDate.toISOString())
    .not('used_at', 'is', null);
}

// Schedule daily cleanup
cron.schedule('0 2 * * *', deleteExpiredVisitorData);
```

## Technical Compliance Measures

### 5. Data Protection by Design and Default

#### Encryption Implementation
```typescript
// AES-256-GCM encryption for PII
const encryptPII = async (data: string): Promise<string> => {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(process.env.APP_ENCRYPTION_KEY),
    { name: 'AES-GCM' },
    false,
    ['encrypt']
  );
  
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encoded = new TextEncoder().encode(data);
  
  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    encoded
  );
  
  // Combine IV and encrypted data
  const combined = new Uint8Array(iv.length + encrypted.byteLength);
  combined.set(iv);
  combined.set(new Uint8Array(encrypted), iv.length);
  
  return btoa(String.fromCharCode(...combined));
};
```

#### Access Control & Audit
```typescript
// Row Level Security enforcing tenant isolation
CREATE POLICY residents_data_access ON residents
  FOR ALL TO authenticated
  USING (
    community_id = current_tenant_id()
    AND (
      auth.uid() = id  -- Resident accessing own data
      OR EXISTS (
        SELECT 1 FROM user_communities 
        WHERE user_id = auth.uid() 
        AND community_id = current_tenant_id()
        AND role IN ('admin', 'guard')
      )
    )
  );

// Comprehensive audit logging
const auditLog = {
  timestamp: new Date().toISOString(),
  user_id: user.id,
  action: 'DATA_ACCESS',
  resource: 'visitor_data',
  community_id: activeCommunityId,
  ip_address: req.ip,
  user_agent: req.get('User-Agent'),
  result: 'SUCCESS'
};
```

### 6. Data Breach Response Plan

#### Detection and Assessment
```typescript
// Automated security monitoring
const securityMetrics = {
  failed_login_threshold: 5,
  unusual_access_patterns: true,
  data_export_monitoring: true,
  unauthorized_api_calls: true
};

async function detectDataBreach() {
  // Monitor for suspicious activities
  const suspiciousActivities = await supabase
    .from('access_logs')
    .select('*')
    .eq('status', 'failed')
    .gte('created_at', new Date(Date.now() - 3600000).toISOString()) // Last hour
    .gt('count', securityMetrics.failed_login_threshold);
    
  if (suspiciousActivities.length > 0) {
    await triggerSecurityAlert(suspiciousActivities);
  }
}
```

#### Breach Notification Process
1. **Detection** (0-1 hour): Automated monitoring alerts
2. **Assessment** (1-24 hours): Determine breach scope and risk
3. **Containment** (24-48 hours): Stop unauthorized access
4. **ODPC Notification** (72 hours): If high risk to data subjects
5. **Data Subject Notification** (Without undue delay): If high risk
6. **Documentation**: Maintain breach register

## Organizational Measures

### 7. Staff Training and Awareness
- **Initial Training**: DPA requirements and system procedures
- **Regular Updates**: Quarterly compliance briefings
- **Incident Response**: Annual security simulation exercises
- **Documentation**: Training records maintained for audit

### 8. Data Protection Officer (DPO) Responsibilities
- Monitor compliance with DPA and internal policies
- Conduct Data Protection Impact Assessments (DPIAs)
- Serve as contact point for ODPC and data subjects
- Provide training and advice to staff
- Maintain record of processing activities

### 9. Third-Party Processor Management
```typescript
// Processor agreement requirements
const processorRequirements = {
  dataLocalization: 'Kenya-based infrastructure required',
  encryption: 'AES-256 minimum encryption standard',
  accessControl: 'Role-based access with audit logs',
  incidentResponse: '24-hour breach notification SLA',
  dataRetention: 'Automated deletion per retention schedule',
  auditRights: 'Annual security assessments permitted'
};
```

## Risk Assessment and Mitigation

### 10. High-Risk Processing Activities

#### Biometric Data (If Implemented)
- **Risk**: Permanent identity compromise if breached
- **Mitigation**: Template-based storage, not raw biometrics
- **Legal Basis**: Explicit consent with clear opt-out

#### Automated Decision Making
- **Risk**: Unfair visitor access denial
- **Mitigation**: Human review process for disputed decisions
- **Transparency**: Clear explanation of access criteria

#### International Data Transfers
- **Risk**: Lower protection standards outside Kenya
- **Mitigation**: Adequacy decisions or appropriate safeguards
- **Documentation**: Transfer impact assessments

### 11. Data Protection Impact Assessment (DPIA)

#### When Required
- Large-scale processing of special category data
- Systematic monitoring of public areas
- Automated decision-making with legal effects
- New technologies with high privacy risk

#### DPIA Template
```markdown
## Data Protection Impact Assessment

**Project**: Secure Gate Access System
**Date**: [Current Date]
**Assessor**: [DPO Name]

### 1. Processing Description
- **Data Types**: Visitor identity, resident profiles, access logs
- **Purposes**: Security, access control, audit compliance
- **Categories**: Residents, visitors, staff
- **Recipients**: Community management, security personnel

### 2. Risk Assessment
| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Data breach | Medium | High | Encryption, access controls |
| Unauthorized access | Low | High | Authentication, audit logs |
| Data loss | Low | Medium | Backup, disaster recovery |

### 3. Compliance Measures
- Technical safeguards implemented
- Organizational policies established  
- Staff training completed
- Regular security assessments scheduled
```

## Implementation Roadmap

### 12. Phase 1: Immediate Compliance (Weeks 1-4)
- [ ] Register with ODPC as data controller
- [ ] Implement privacy notices and consent mechanisms
- [ ] Establish data retention and deletion procedures
- [ ] Create incident response procedures

### 13. Phase 2: Enhanced Protection (Weeks 5-8)
- [ ] Conduct comprehensive DPIA
- [ ] Implement data subject rights portal
- [ ] Establish DPO function (internal or external)
- [ ] Complete staff training program

### 14. Phase 3: Continuous Compliance (Ongoing)
- [ ] Regular compliance audits (quarterly)
- [ ] Update procedures for law changes
- [ ] Monitor international data protection trends
- [ ] Maintain breach register and incident documentation

## Contact Information

**Data Protection Officer**
- Email: dpo@securegatekenya.com
- Phone: +254-XXX-XXXXXX
- Address: [Physical address in Kenya]

**Office of the Data Protection Commissioner**
- Website: https://www.odpc.go.ke
- Email: info@odpc.go.ke
- Phone: +254-20-2628000

## Documentation Maintenance

This compliance guide shall be:
- Reviewed quarterly for legal updates
- Updated following system changes
- Made available to all staff members
- Provided to data subjects upon request
- Maintained as evidence of compliance commitment

---

*This document serves as a compliance framework. Legal counsel should review all implementations before deployment.*
