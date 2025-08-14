/**
 * Advanced Encryption Service
 * Provides enterprise-grade encryption capabilities with AES-256-GCM
 * Includes key derivation, secure storage, and field-level encryption
 */

interface EncryptionResult {
  encryptedData: string;
  iv: string;
  authTag: string;
  keyId: string;
}

interface DecryptionParams {
  encryptedData: string;
  iv: string;
  authTag: string;
  keyId: string;
}

interface KeyDerivationOptions {
  salt?: Uint8Array;
  iterations?: number;
  keyLength?: number;
}

class AdvancedEncryptionService {
  private static instance: AdvancedEncryptionService;
  private keyCache: Map<string, CryptoKey> = new Map();
  private readonly ALGORITHM = 'AES-GCM';
  private readonly KEY_LENGTH = 256;
  private readonly IV_LENGTH = 12;
  private readonly TAG_LENGTH = 16;
  private readonly PBKDF2_ITERATIONS = 100000;

  private constructor() {}

  public static getInstance(): AdvancedEncryptionService {
    if (!AdvancedEncryptionService.instance) {
      AdvancedEncryptionService.instance = new AdvancedEncryptionService();
    }
    return AdvancedEncryptionService.instance;
  }

  /**
   * Derives a cryptographic key from a password using PBKDF2
   */
  public async deriveKey(
    password: string, 
    options: KeyDerivationOptions = {}
  ): Promise<{ key: CryptoKey; salt: Uint8Array }> {
    const salt = options.salt || crypto.getRandomValues(new Uint8Array(32));
    const iterations = options.iterations || this.PBKDF2_ITERATIONS;
    const keyLength = options.keyLength || this.KEY_LENGTH;

    const encoder = new TextEncoder();
    const passwordBuffer = encoder.encode(password);

    // Import password as key material
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      passwordBuffer,
      'PBKDF2',
      false,
      ['deriveKey']
    );

    // Derive the actual encryption key
    const key = await crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: salt,
        iterations: iterations,
        hash: 'SHA-256'
      } as Pbkdf2Params,
      keyMaterial,
      {
        name: this.ALGORITHM,
        length: keyLength
      },
      false,
      ['encrypt', 'decrypt']
    );

    return { key, salt };
  }

  /**
   * Generates a new random encryption key
   */
  public async generateKey(): Promise<CryptoKey> {
    return await crypto.subtle.generateKey(
      {
        name: this.ALGORITHM,
        length: this.KEY_LENGTH
      },
      true,
      ['encrypt', 'decrypt']
    );
  }

  /**
   * Encrypts data with authenticated encryption (AES-256-GCM)
   */
  public async encrypt(
    plaintext: string, 
    key: CryptoKey, 
    additionalData?: string
  ): Promise<EncryptionResult> {
    const encoder = new TextEncoder();
    const plaintextBuffer = encoder.encode(plaintext);
    const iv = crypto.getRandomValues(new Uint8Array(this.IV_LENGTH));

    const encryptParams: AesGcmParams = {
      name: this.ALGORITHM,
      iv: iv
    };

    if (additionalData) {
      encryptParams.additionalData = encoder.encode(additionalData);
    }

    const encryptedBuffer = await crypto.subtle.encrypt(
      encryptParams,
      key,
      plaintextBuffer
    );

    // Split the encrypted data and auth tag
    const encryptedData = encryptedBuffer.slice(0, -this.TAG_LENGTH);
    const authTag = encryptedBuffer.slice(-this.TAG_LENGTH);

    // Generate key ID for key management
    const keyId = await this.generateKeyId(key);

    return {
      encryptedData: this.arrayBufferToBase64(encryptedData),
      iv: this.arrayBufferToBase64(iv.buffer),
      authTag: this.arrayBufferToBase64(authTag),
      keyId
    };
  }

  /**
   * Decrypts data with authenticated decryption
   */
  public async decrypt(
    params: DecryptionParams, 
    key: CryptoKey, 
    additionalData?: string
  ): Promise<string> {
    const encryptedData = this.base64ToArrayBuffer(params.encryptedData);
    const iv = this.base64ToArrayBuffer(params.iv);
    const authTag = this.base64ToArrayBuffer(params.authTag);

    // Combine encrypted data and auth tag
    const combinedBuffer = new Uint8Array(encryptedData.byteLength + authTag.byteLength);
    combinedBuffer.set(new Uint8Array(encryptedData), 0);
    combinedBuffer.set(new Uint8Array(authTag), encryptedData.byteLength);

    const decryptParams: AesGcmParams = {
      name: this.ALGORITHM,
      iv: iv
    };

    if (additionalData) {
      const encoder = new TextEncoder();
      decryptParams.additionalData = encoder.encode(additionalData);
    }

    try {
      const decryptedBuffer = await crypto.subtle.decrypt(
        decryptParams,
        key,
        combinedBuffer
      );

      const decoder = new TextDecoder();
      return decoder.decode(decryptedBuffer);
    } catch (error) {
      throw new Error('Decryption failed: Invalid ciphertext or key');
    }
  }

  /**
   * Encrypts multiple fields with field-level encryption
   */
  public async encryptFields(
    data: Record<string, string>, 
    key: CryptoKey, 
    fieldsToEncrypt: string[]
  ): Promise<Record<string, any>> {
    const result = { ...data };

    for (const field of fieldsToEncrypt) {
      if (data[field] !== undefined && data[field] !== null) {
        const encrypted = await this.encrypt(data[field], key, field);
        result[`${field}_encrypted`] = JSON.stringify(encrypted);
        delete result[field]; // Remove plaintext
      }
    }

    return result;
  }

  /**
   * Decrypts multiple fields
   */
  public async decryptFields(
    data: Record<string, any>, 
    key: CryptoKey, 
    fieldsToDecrypt: string[]
  ): Promise<Record<string, string>> {
    const result = { ...data };

    for (const field of fieldsToDecrypt) {
      const encryptedField = `${field}_encrypted`;
      if (data[encryptedField]) {
        try {
          const encryptedData = JSON.parse(data[encryptedField]) as DecryptionParams;
          const decrypted = await this.decrypt(encryptedData, key, field);
          result[field] = decrypted;
          delete result[encryptedField]; // Remove encrypted version
        } catch (error) {
          console.error(`Failed to decrypt field ${field}:`, error);
          result[field] = '[DECRYPTION_ERROR]';
        }
      }
    }

    return result;
  }

  /**
   * Securely stores a key with encryption
   */
  public async storeKey(keyId: string, key: CryptoKey, masterPassword: string): Promise<void> {
    const exported = await crypto.subtle.exportKey('raw', key);
    const keyString = this.arrayBufferToBase64(exported);

    const { key: masterKey } = await this.deriveKey(masterPassword);
    const encrypted = await this.encrypt(keyString, masterKey);

    // Store in secure storage (IndexedDB or encrypted localStorage)
    localStorage.setItem(`key_${keyId}`, JSON.stringify(encrypted));
    this.keyCache.set(keyId, key);
  }

  /**
   * Retrieves a stored key
   */
  public async retrieveKey(keyId: string, masterPassword: string): Promise<CryptoKey | null> {
    // Check cache first
    if (this.keyCache.has(keyId)) {
      return this.keyCache.get(keyId)!;
    }

    const stored = localStorage.getItem(`key_${keyId}`);
    if (!stored) return null;

    try {
      const encrypted = JSON.parse(stored);
      const { key: masterKey } = await this.deriveKey(masterPassword);
      const keyString = await this.decrypt(encrypted, masterKey);
      const keyBuffer = this.base64ToArrayBuffer(keyString);

      const key = await crypto.subtle.importKey(
        'raw',
        keyBuffer,
        this.ALGORITHM,
        false,
        ['encrypt', 'decrypt']
      );

      this.keyCache.set(keyId, key);
      return key;
    } catch (error) {
      console.error('Failed to retrieve key:', error);
      return null;
    }
  }

  /**
   * Rotates encryption keys
   */
  public async rotateKey(oldKeyId: string, newKey: CryptoKey): Promise<string> {
    const newKeyId = await this.generateKeyId(newKey);
    
    // In a real implementation, you would:
    // 1. Re-encrypt all data with the new key
    // 2. Update key references in the database
    // 3. Securely delete the old key
    
    return newKeyId;
  }

  /**
   * Generates a secure hash for PII searching
   */
  public async generateSearchableHash(data: string, salt?: string): Promise<string> {
    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(data + (salt || ''));
    const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
    return this.arrayBufferToBase64(hashBuffer);
  }

  /**
   * Validates encryption integrity
   */
  public async validateIntegrity(
    encryptedData: EncryptionResult, 
    key: CryptoKey
  ): Promise<boolean> {
    try {
      await this.decrypt(encryptedData, key);
      return true;
    } catch {
      return false;
    }
  }

  // Utility methods
  private async generateKeyId(key: CryptoKey): Promise<string> {
    const exported = await crypto.subtle.exportKey('raw', key);
    const hash = await crypto.subtle.digest('SHA-256', exported);
    return this.arrayBufferToBase64(hash).substring(0, 16);
  }

  private arrayBufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  private base64ToArrayBuffer(base64: string): ArrayBuffer {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes.buffer;
  }

  /**
   * Clear sensitive data from memory
   */
  public clearCache(): void {
    this.keyCache.clear();
  }
}

export const encryptionService = AdvancedEncryptionService.getInstance();
export default encryptionService;
