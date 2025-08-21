# Testing Commands Quick Reference

## Quick Start Testing Guide

### Environment Setup
```bash
# Copy environment template
cp .env.example .env.local

# Install dependencies
npm install

# Install Playwright browsers
npx playwright install
```

### Unit Tests
```bash
# Run all unit tests
npm run test:unit

# Run specific unit test file
npx vitest run tests/unit/complete-visitor-registration.test.ts

# Run with coverage
npm run test:unit -- --coverage

# Watch mode for development
npx vitest tests/unit/complete-visitor-registration.test.ts --watch
```

### Integration Tests
```bash
# Run all integration tests (requires test Supabase)
INTEGRATION_TESTS=1 npx vitest run tests/integration/

# Run specific integration test
INTEGRATION_TESTS=1 npx vitest run tests/integration/visitor-management.test.ts

# Run with verbose output
INTEGRATION_TESTS=1 npx vitest run tests/integration/verify-access-code.int.test.ts --reporter=verbose
```

### E2E Tests
```bash
# Run all E2E tests
npm run test:e2e

# Run specific E2E test
npx playwright test tests/e2e/main.spec.ts

# Run E2E tests in headed mode
npx playwright test tests/e2e/qr-scan.spec.ts --headed

# Run E2E tests on specific browser
npx playwright test tests/e2e/main.spec.ts --project=chromium
```

### Security Tests
```bash
# Run security compliance tests
npm run test:security

# Run specific security test
npx vitest run tests/security/compliance.test.ts

# Run security audit
npm audit --audit-level=high
```

### Performance Tests
```bash
# Run load tests
npm run test:performance

# Run specific performance test
npx artillery run tests/performance/load-test.yml
```

## Test Environment Variables

### For Unit Tests (Mocked)
```bash
# No external dependencies needed
NODE_ENV=test
```

### For Integration Tests
```bash
# Test Supabase instance
INTEGRATION_TESTS=1
SUPABASE_URL=https://your-test-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-test-service-role-key
RS256_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----"
RS256_PUBLIC_KEY="-----BEGIN PUBLIC KEY-----\n...\n-----END PUBLIC KEY-----"
APP_ENCRYPTION_KEY=your-32-byte-test-key
SENDGRID_API_KEY=test-sendgrid-key
FROM_EMAIL=test@example.com
```

### For E2E Tests
```bash
# Full environment
E2E_TESTS=1
SUPABASE_URL=https://your-staging-project.supabase.co
SUPABASE_ANON_KEY=your-staging-anon-key
```

## Key Generation for Testing

### Generate RSA Keypair
```bash
# Generate private key
openssl genrsa -out private-key.pem 2048

# Extract public key
openssl rsa -in private-key.pem -pubout -out public-key.pem

# Convert to PKCS8 format
openssl pkcs8 -topk8 -inform PEM -in private-key.pem -outform PEM -nocrypt -out private-key-pkcs8.pem
```

### Generate AES-256 Key
```bash
# Generate 32-byte hex key
openssl rand -hex 32
```

## Test Data Setup

### Create Test Invitation
```bash
# Using curl
curl -X POST https://your-test-project.supabase.co/functions/v1/create-invitation \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "resident_id": "test-resident-id",
    "visitor_email": "test@example.com",
    "visit_date": "2024-12-31",
    "purpose": "Testing"
  }'
```

### Create Test Visitor
```bash
# Using curl
curl -X POST https://your-test-project.supabase.co/functions/v1/complete-visitor-registration \
  -H "Content-Type: application/json" \
  -d '{
    "fullName": "Test Visitor",
    "idNumber": "12345678",
    "phoneNumber": "+254700000000",
    "visitorEmail": "test@example.com",
    "consent": true,
    "invitationToken": "test-invitation-token"
  }'
```

## Debugging Tests

### Debug Unit Tests
```bash
# Debug with VS Code
npx vitest run tests/unit/complete-visitor-registration.test.ts --reporter=verbose

# Debug with console.log
DEBUG=1 npx vitest run tests/unit/complete-visitor-registration.test.ts
```

### Debug Integration Tests
```bash
# Enable debug logging
DEBUG=supabase* INTEGRATION_TESTS=1 npx vitest run tests/integration/verify-access-code.int.test.ts

# Check database state
psql $DATABASE_URL -c "SELECT * FROM access_codes LIMIT 5;"
```

### Debug E2E Tests
```bash
# Run in debug mode
npx playwright test tests/e2e/main.spec.ts --debug

# View trace
npx playwright show-trace test-results/main-test/trace.zip
```

## CI/CD Testing

### GitHub Actions
```bash
# Run CI tests locally
act -j test

# Run specific workflow
act -j integration-tests
```

### Pre-commit Hooks
```bash
# Install pre-commit hooks
npm run prepare

# Run pre-commit checks
npm run pre-commit
```

## Common Test Issues & Solutions

### Issue: "Cannot connect to Supabase"
**Solution**: Check SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY

### Issue: "JWT verification failed"
**Solution**: Verify RS256_PRIVATE_KEY and RS256_PUBLIC_KEY format

### Issue: "Encryption key invalid"
**Solution**: Ensure APP_ENCRYPTION_KEY is exactly 32 bytes

### Issue: "SendGrid API error"
**Solution**: Use mock endpoint for tests or valid test API key

## Test Coverage Reports

### Generate Coverage Report
```bash
# Unit tests coverage
npm run test:unit -- --coverage --reporter=html

# View coverage report
open coverage/index.html

# Integration tests coverage
INTEGRATION_TESTS=1 npm run test:integration -- --coverage
```

## Performance Benchmarks

### Load Test Commands
```bash
# Run load test
npx artillery run tests/performance/load-test.yml

# Custom load test
npx artillery quick --count 50 --num 10 https://your-api.com/verify-access-code
```

## Security Scanning

### SAST Scanning
```bash
# Run security scan
npm run security:scan

# Check for vulnerabilities
npm audit --audit-level=moderate
```

## Quick Health Check

### System Health
```bash
# Check all services
npm run health:check

# Check database connection
npm run db:health

# Check API endpoints
npm run api:health
```

## Troubleshooting

### Reset Test Environment
```bash
# Reset test database
npm run db:reset:test

# Clear test cache
npm run test:clear-cache

# Reinstall dependencies
npm ci
```

### View Test Logs
```bash
# View test logs
tail -f logs/test.log

# View error logs
tail -f logs/error.log
