# Phase 1: Critical Security Implementation
## Priority: HIGHEST - Security Foundation

### Overview
Phase 1 focuses on implementing the critical security components identified in the roadmap, including RSA key management, AES encryption, and security validation.

### 1.1 RSA Key Generation and Management

#### Generate RSA Keypair
```bash
# Generate 2048-bit RSA private key
openssl genrsa -out private-key.pem 2048

# Extract public key
openssl rsa -in private-key.pem -pubout -out public-key.pem

# Convert to PKCS8 format for Deno
openssl pkcs8 -topk8 -inform PEM -in private-key.pem -outform PEM -nocrypt -out private-key-pkcs8.pem
```

#### Environment Configuration
```bash
# Add to .env.local
RS256_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----
MIIEvQIBADANBgkqhkiG9w0BAQEFAASC..."
RS256_PUBLIC_KEY="-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOC..."
```

### 1.2 AES-256 Encryption Key Generation
```bash
# Generate 32-byte hex key for AES-256
openssl rand -hex 32
```

### 1.3 Security Validation Implementation

#### Create security validation utility
<create_file>
<path>src/lib/security-validation.ts</path>
<content>
export class SecurityValidator {
  static validateRSAKeys(privateKey: string, publicKey: string): boolean {
    try {
      // Basic format validation
      const privateKeyValid = privateKey.includes('-----BEGIN PRIVATE KEY-----') && 
                             privateKey.includes('-----END PRIVATE KEY-----');
      const publicKeyValid = publicKey.includes('-----BEGIN PUBLIC KEY-----') && 
                            publicKey.includes('-----END PUBLIC KEY-----');
      
      return privateKeyValid && publicKeyValid;
    } catch (error) {
      console.error('RSA key validation failed:', error);
      return false;
    }
  }

  static validateAESKey(key: string): boolean {
    // Must be 32 bytes (64 hex characters)
    return /^[a-fA-F0-9]{64}$/.test(key);
  }

  static validateEnvironment(): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    if (!process.env.RS256_PRIVATE_KEY) {
      errors.push('RS256_PRIVATE_KEY is missing');
    }
    
    if (!process.env.RS256_PUBLIC_KEY) {
      errors.push('RS256_PUBLIC_KEY is missing');
    }
    
    if (!process.env.APP_ENCRYPTION_KEY) {
      errors.push('APP_ENCRYPTION_KEY is missing');
    }
    
    if (!this.validateAESKey(process.env.APP_ENCRYPTION_KEY || '')) {
      errors.push('APP_ENCRYPTION_KEY must be 32 bytes (64 hex characters)');
    }
    
    return {
      valid: errors.length === 0,
      errors
    };
  }
}
