# Kenya VM Migration Runbook
## Secure Gate Access System - Track B Implementation

### Overview
This runbook outlines the migration from hosted Supabase (Track A) to Kenya-resident infrastructure (Track B) to ensure compliance with the Kenya Data Protection Act and data localization requirements.

## Pre-Migration Planning

### 1. Infrastructure Requirements
- **Compute**: Ubuntu 20.04+ VMs with Docker support
- **Database**: PostgreSQL 15+ with Row Level Security
- **Storage**: Encrypted storage for PII and backups
- **Networking**: VPN/private network for admin access
- **Location**: Kenya-based data center (e.g., Liquid Intelligent Technologies, KENET)

### 2. Compliance Checklist
- [ ] Data processing agreement with hosting provider
- [ ] Encryption at rest and in transit (AES-256)
- [ ] Access logging and audit trails
- [ ] Backup and disaster recovery procedures
- [ ] Staff background checks and NDAs
- [ ] DPO (Data Protection Officer) appointment if required

## Migration Steps

### Phase 1: Infrastructure Setup (Days 1-7)

#### Day 1-2: VM Provisioning
```bash
# Ubuntu VM setup with Docker
sudo apt update && sudo apt upgrade -y
sudo apt install -y docker.io docker-compose-v2 nginx certbot
sudo usermod -aG docker $USER

# Enable firewall
sudo ufw enable
sudo ufw allow ssh
sudo ufw allow 80
sudo ufw allow 443
```

#### Day 3-4: Database Setup
```bash
# PostgreSQL with Docker
docker run -d \
  --name postgres \
  -e POSTGRES_PASSWORD=<secure_password> \
  -v postgres_data:/var/lib/postgresql/data \
  -p 5432:5432 \
  postgres:15-alpine

# Install Supabase CLI
npm install -g supabase
```

#### Day 5-7: Application Stack
```bash
# Clone repository
git clone <repo_url>
cd secure-gate-access-kenya

# Environment setup
cp .env.example .env.production
# Configure Kenya-specific variables:
# - Database connection
# - Encryption keys (rotate all keys)
# - Email service (use Kenya-based provider)
# - Domain and SSL certificates
```

### Phase 2: Data Migration (Days 8-10)

#### Step 1: Export Data from Supabase
```bash
# Export schema
supabase db dump --schema-only > schema.sql

# Export data (exclude sensitive tables for separate handling)
supabase db dump --data-only --exclude-table=visitors,residents > data.sql

# Export sensitive data with encryption
supabase db dump --data-only --include-table=visitors,residents | \
  gpg --cipher-algo AES256 --compress-algo 1 --s2k-mode 3 \
  --s2k-digest-algo SHA512 --s2k-count 65536 --force-mdc \
  --quiet --no-greeting --batch --yes --output sensitive_data.sql.gpg \
  --symmetric
```

#### Step 2: Import to Kenya VM
```bash
# Restore schema
psql -h localhost -U postgres -d supabase < schema.sql

# Apply all migrations
supabase db push

# Import non-sensitive data
psql -h localhost -U postgres -d supabase < data.sql

# Import sensitive data
gpg --quiet --batch --yes --decrypt sensitive_data.sql.gpg | \
  psql -h localhost -U postgres -d supabase
```

#### Step 3: Data Validation
```bash
# Run tenant isolation verification
npm run verify:tenants

# Validate data integrity
psql -c "SELECT COUNT(*) FROM communities;"
psql -c "SELECT COUNT(*) FROM residents;"
psql -c "SELECT COUNT(*) FROM visitors;"
```

### Phase 3: Application Deployment (Days 11-12)

#### Step 1: Build and Deploy
```bash
# Build production bundle
npm run build

# Deploy with Docker
docker-compose -f docker-compose.kenya.yml up -d

# Setup SSL with Let's Encrypt
sudo certbot --nginx -d your-domain.co.ke
```

#### Step 2: Edge Functions (Local Supabase)
```bash
# Start local Supabase
supabase start

# Deploy edge functions
supabase functions deploy generate-access-code
supabase functions deploy complete-visitor-registration
supabase functions deploy verify-access-code
```

### Phase 4: Testing and Cutover (Days 13-14)

#### Step 1: End-to-End Testing
```bash
# System integration tests
npm run test:system

# Load testing (optional)
npx artillery run load-test.yml

# Security scanning
npm audit
docker scan secure-gate-app:latest
```

#### Step 2: DNS Cutover
```bash
# Update DNS records to point to Kenya VM
# A record: your-domain.co.ke -> <kenya-vm-ip>
# CNAME: api.your-domain.co.ke -> your-domain.co.ke

# Monitor for 24-48 hours
tail -f /var/log/nginx/access.log
docker logs -f secure-gate-app
```

## Post-Migration

### 1. Data Destruction (Track A)
- [ ] Export final audit logs from Supabase
- [ ] Delete all data from hosted Supabase
- [ ] Confirm deletion with Supabase support
- [ ] Document destruction for compliance

### 2. Monitoring Setup
```bash
# Setup monitoring stack
docker-compose -f monitoring.yml up -d

# Key metrics to monitor:
# - Database performance
# - API response times  
# - Storage usage
# - SSL certificate expiry
# - Backup success/failure
```

### 3. Backup Strategy
```bash
# Daily encrypted backups
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
pg_dump -h localhost -U postgres supabase | \
  gpg --cipher-algo AES256 --compress-algo 1 \
  --s2k-mode 3 --s2k-digest-algo SHA512 \
  --output "/backups/db_${DATE}.sql.gpg" \
  --symmetric

# Retain 30 daily, 12 monthly backups
find /backups -name "db_*.sql.gpg" -mtime +30 -delete
```

## Kenya DPA Compliance Requirements

### 1. Data Processing Principles
- **Lawfulness**: Process data only for legitimate security purposes
- **Purpose Limitation**: Use data only for visitor management
- **Data Minimization**: Collect only necessary visitor information
- **Accuracy**: Keep visitor records up to date
- **Storage Limitation**: Delete expired access codes and old visitor data
- **Security**: Implement appropriate technical and organizational measures

### 2. Individual Rights Implementation
- **Right to Information**: Privacy policy explaining data use
- **Right of Access**: Portal for visitors to view their data
- **Right to Rectification**: Allow visitors to correct their information
- **Right to Erasure**: Delete visitor data on request (after legal retention)
- **Right to Object**: Opt-out mechanisms where applicable

### 3. Documentation Requirements
- [ ] Data Protection Impact Assessment (DPIA)
- [ ] Privacy Policy (Swahili and English)
- [ ] Data Retention Policy
- [ ] Incident Response Procedures
- [ ] Staff Training Records
- [ ] Processor Agreements (if using third parties)

## Rollback Plan

### Emergency Rollback to Track A
```bash
# If issues arise within 48 hours:
# 1. Update DNS to point back to Supabase
# 2. Import any new data created on Kenya VM
# 3. Investigate and fix issues
# 4. Plan re-migration
```

### Data Sync During Migration Window
```bash
# For zero-downtime migration:
# 1. Setup read replica on Kenya VM
# 2. Switch writes to Kenya VM
# 3. Allow replication to catch up
# 4. Cut over DNS
```

## Contact Information

**Technical Support:**
- Infrastructure: [Kenya hosting provider support]
- Database: [DBA contact]
- Application: [Development team]

**Compliance:**
- DPO: [Data Protection Officer]
- Legal: [Legal counsel]
- Audit: [Compliance officer]

## Success Criteria

- [ ] All data successfully migrated and validated
- [ ] Zero data loss during migration
- [ ] System performance meets or exceeds Track A
- [ ] All compliance requirements documented and met
- [ ] Staff trained on Kenya-specific procedures
- [ ] Backup and monitoring systems operational
- [ ] Track A data properly destroyed with documentation
