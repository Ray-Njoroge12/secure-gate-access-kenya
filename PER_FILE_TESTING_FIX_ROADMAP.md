# Per-File Testing & Fix Roadmap (Developer-Facing)

## Executive Summary
This document provides a detailed testing and remediation plan for each critical component in the Secure-Gate Kenya visitor access system. Each file includes specific tests to run, pass/fail criteria, remediation steps, and effort estimates.

---

## A. complete-visitor-registration/index-inline.ts
**Purpose**: Full production registration pipeline - validates invitation, encrypts PII, creates visitor, generates PIN & RS256-signed QR JWT, stores access_code, sends PIN email.

### Tests Required

#### Unit Tests
- **Test 1**: Mock `createClient` and `SignJWT` to verify valid input generates expected DB operations
- **Test 2**: Simulate missing environment keys → function returns 400/error
- **Test 3**: Verify encryption round-trip with AES-GCM
- **Test 4**: Test SHA-256 hash generation for PIN

#### Integration Tests
- **Test 5**: End-to-end with test invitation: POST registration → visitor row created → access_code row created → JWT verification
- **Test 6**: Email flow: mock SendGrid endpoint → assert email contains PIN
- **Test 7**: Invalid invitation token → 400 response
- **Test 8**: SendGrid failure → DB operations complete, appropriate error handling

#### Security Tests
- **Test 9**: JWT signature verification with public key
- **Test 10**: Replay attack prevention via jti claim
- **Test 11**: Expiry validation (24h tokens)

### Pass Criteria
- Valid run creates DB rows with encrypted fields and RS256 JWT
- PIN not returned to client in production mode
- Email delivery with retry/fallback mechanism
- One-time use enforcement works

### Failure Symptoms & Fixes
- **JWT verification fails**: Check RS256_PRIVATE_KEY format (PKCS8 PEM)
- **Encryption errors**: Verify APP_ENCRYPTION_KEY length (32 bytes for AES-256)
- **Email failures**: Implement background job queue for email delivery
- **Partial writes**: Use transactions for atomic operations

### Priority/Effort
- **HIGH** - Critical security path
- **Estimated**: 3-6 hours for tests, 1-2 days for hardening

---

## B. verify-access-code/index.ts
**Purpose**: Verify QR JWT or PIN, detect replay/expired, mark used, decrypt PII, log to access_logs, trigger webhooks.

### Tests Required

#### Unit Tests
- **Test 1**: Mock JWT verification and DB queries for QR vs PIN flows
- **Test 2**: Assert used_at is set on success
- **Test 3**: Test Argon2 vs SHA fallback for PIN verification
- **Test 4**: Replay detection (duplicate token usage)

#### Integration Tests
- **Test 5**: Create access_code → verify → mark used → verify again fails
- **Test 6**: PIN tests with Argon2 hashes
- **Test 7**: Invalid JWT signatures → rejection
- **Test 8**: Expired tokens → rejection

#### Security Tests
- **Test 9**: Guard authentication requirement
- **Test 10**: Rate limiting on verification endpoints
- **Test 11**: Audit trail completeness

### Pass Criteria
- Correct handling of both QR and PIN verification
- One-time use enforcement
- Proper audit logging
- Guard authentication required

### Failure Symptoms & Fixes
- **Missing RS256_PUBLIC_KEY**: Add startup validation
- **Argon2 import fails**: Vendor Argon2 or add fallback
- **Missing guard_id**: Require authenticated guard context

### Priority/Effort
- **HIGHEST** - Critical access security
- **Estimated**: 1-2 days for thorough testing

---

## C. generate-access-code/index.ts
**Purpose**: Generate access codes (dev returns UUID/pin; prod signs JWT).

### Tests Required
- **Test 1**: Validate returned structure contains pin, qr_token, expires_at
- **Test 2**: Prod variant signs RS256 JWT with jti and exp claim
- **Test 3**: Dev vs prod flow gating

### Pass Criteria
- Dev variant returns deterministic shape
- Prod variant signs RS256 JWT

### Failure & Fix
- **Mixing flows**: Add explicit ENV gating
- **JWT signing fails**: Verify key format

### Priority/Effort
- **HIGH** - CI safety
- **Estimated**: 1-3 hours

---

## D. encrypt-pii/index.ts & decrypt-pii/index.ts
**Purpose**: AES-GCM encryption/decryption for PII.

### Tests Required
- **Test 1**: Round-trip encryption/decryption
- **Test 2**: Invalid key handling
- **Test 3**: Corrupted ciphertext errors

### Pass Criteria
- Correct AES-GCM round-trip
- Predictable error handling

### Failure & Fix
- **Raw key storage**: Move to KMS
- **Intermittent failures**: Check encoding/IV concat

### Priority/Effort
- **HIGH** - PII protection
- **Estimated**: 4-8 hours

---

## E. send-invitation-email/index.ts
**Purpose**: Email delivery for invitations.

### Tests Required
- **Test 1**: Mock SendGrid endpoint
- **Test 2**: Template rendering
- **Test 3**: Rate limiting

### Pass Criteria
- Reliable email delivery
- Template customization
- Error handling

### Failure & Fix
- **Delivery failures**: Background job queue
- **Template errors**: Validation

### Priority/Effort
- **MEDIUM** - Operational
- **Estimated**: 2-4 hours

---

## F. api-gateway-access/index.ts
**Purpose**: Tenant-scoped API gateway with API key validation.

### Tests Required
- **Test 1**: Mock validate_api_key RPC
- **Test 2**: Permission checks
- **Test 3**: Rate limiting

### Pass Criteria
- Valid API key access
- Proper permission enforcement
- Audit logging

### Failure & Fix
- **RPC failures**: Integration tests
- **Permissions**: Structured claims

### Priority/Effort
- **HIGH** - Multi-tenant security
- **Estimated**: 1-2 days

---

## G. QRCodeGenerator.tsx & QRCodeScanner.tsx
**Purpose**: Client-side QR generation and scanning.

### Tests Required
- **Test 1**: Component rendering
- **Test 2**: Canvas creation
- **Test 3**: Camera permissions
- **Test 4**: E2E scanning flow

### Pass Criteria
- Reliable QR generation
- Cross-device scanning
- Torch toggling

### Failure & Fix
- **Permission errors**: UX improvements
- **Rapid scans**: Debounce

### Priority/Effort
- **MEDIUM** - User experience
- **Estimated**: 1 day

---

## H. securityMonitor.ts & securityPolicyService.ts
**Purpose**: Monitoring and policy enforcement.

### Tests Required
- **Test 1**: Anomaly detection
- **Test 2**: Policy evaluation
- **Test 3**: Alert thresholds

### Pass Criteria
- Accurate anomaly detection
- Policy compliance
- Alert reliability

### Failure & Fix
- **False positives**: Tuning
- **Policy gaps**: Rule updates

### Priority/Effort
- **MEDIUM-HIGH** - Security
- **Estimated**: 1-3 days

---

## I. vitest.setup.ts
**Purpose**: Test environment configuration.

### Tests Required
- **Test 1**: Mocking setup
- **Test 2**: Environment isolation
- **Test 3**: Integration flag handling

### Pass Criteria
- Unit tests isolated
- Integration tests explicit

### Failure & Fix
- **Prod access**: Environment guards
- **Key exposure**: Validation

### Priority/Effort
- **HIGH** - Test safety
- **Estimated**: 1-2 hours

---

## Pipeline & CI Additions
- Unit tests (fast, PR)
- Integration tests (main branch)
- E2E tests (nightly/release)
- Pre-deploy checks
- Key sanity validation

---

## Quick Test Commands
```bash
# Unit tests
npx vitest run tests/unit/complete-visitor-registration.test.ts

# Integration tests
INTEGRATION_TESTS=1 npx vitest run tests/integration/complete-visitor-registration.int.test.ts

# E2E tests
npx playwright test tests/e2e/qr-scan.spec.ts
