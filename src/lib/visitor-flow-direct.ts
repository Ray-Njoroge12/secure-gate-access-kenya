// Simple encryption functions (for testing - should be enhanced in production)
function simpleEncrypt(text: string): string {
  return btoa(unescape(encodeURIComponent(text)));
}

async function hashSha256(text: string): Promise<string> {
  if (typeof window !== 'undefined' && window.crypto && window.crypto.subtle) {
    // Browser environment
    const msgBuffer = new TextEncoder().encode(text);
    const hashBuffer = await window.crypto.subtle.digest('SHA-256', msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  } else {
    // Node.js environment (fallback) - should not reach here in browser
    throw new Error('Crypto API not available');
  }
}

// Generate a random UUID-like string for browser environments
function generateRandomId(): string {
  if (typeof window !== 'undefined' && window.crypto && window.crypto.randomUUID) {
    return window.crypto.randomUUID();
  } else {
    // Fallback for older browsers
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }
}

export interface InvitationData {
  resident_id: string;
  visitor_full_name: string;
  visitor_email: string;
  visitor_phone_number: string;
  visit_date: string;
  visit_purpose?: string;
  visit_duration_hours?: number;
}

export interface VisitorRegistrationData {
  fullName: string;
  idNumber: string;
  phoneNumber: string;
  visitorEmail: string;
  consent: boolean;
  photoUrl?: string;
  invitationToken: string;
}

export interface RegistrationResult {
  success: boolean;
  visitorId?: string;
  accessCodeId?: string;
  pin?: string;
  qrToken?: string;
  error?: string;
}

export async function createInvitationDirect(data: InvitationData): Promise<{ success: boolean; invitationId?: string; token?: string; error?: string }> {
  try {
    // Generate invitation token
    const invitationToken = `inv_${generateRandomId()}_${Date.now()}`;
    const tokenExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(); // 7 days

    // TODO: Replace with actual FastAPI endpoint
    // Create invitation - placeholder implementation
    console.log('Creating invitation:', data);
    await new Promise(resolve => setTimeout(resolve, 200)); // Simulate network delay

    // Simulate successful invitation creation
    const invitation = {
      id: generateRandomId(),
      resident_id: data.resident_id,
      visitor_full_name: data.visitor_full_name,
      visitor_email: data.visitor_email,
      visitor_phone: data.visitor_phone_number,
      visit_date: data.visit_date,
      visit_purpose: data.visit_purpose || 'Social Visit',
      visit_duration_hours: data.visit_duration_hours || 2,
      invitation_token: invitationToken,
      token_expires_at: tokenExpiresAt,
      status: 'pending'
    };

    return {
      success: true,
      invitationId: invitation.id,
      token: invitationToken
    };
  } catch (error) {
    console.error('Error creating invitation:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}

/**
 * Complete visitor registration directly in database (bypassing Edge Functions)
 */
export async function completeVisitorRegistrationDirect(data: VisitorRegistrationData): Promise<RegistrationResult> {
  try {
    // TODO: Replace with actual FastAPI endpoint
    // 1. Find and validate invitation - placeholder
    console.log('Validating invitation token:', data.invitationToken);
    await new Promise(resolve => setTimeout(resolve, 100)); // Simulate network delay

    // Simulate invitation validation
    const invitation = {
      id: generateRandomId(),
      resident_id: 'resident_123',
      token_expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
    };

    // Check token expiration
    if (new Date(invitation.token_expires_at) < new Date()) {
      return {
        success: false,
        error: 'Invitation token has expired'
      };
    }

    // 2. Encrypt PII data and hash sensitive info
    const encryptedFullName = simpleEncrypt(data.fullName);
    const encryptedIdNumber = simpleEncrypt(data.idNumber);
    const encryptedPhoneNumber = simpleEncrypt(data.phoneNumber);
    const encryptedVisitorEmail = simpleEncrypt(data.visitorEmail);
    const idNumberHash = await hashSha256(data.idNumber);

    // 3. Create visitor record - placeholder
    console.log('Creating visitor record');
    await new Promise(resolve => setTimeout(resolve, 150)); // Simulate network delay

    const visitor = {
      id: generateRandomId(),
      full_name_encrypted: encryptedFullName,
      id_number_encrypted: encryptedIdNumber,
      id_number_hash: idNumberHash,
      phone_encrypted: encryptedPhoneNumber,
      email_encrypted: encryptedVisitorEmail,
      photo_url: data.photoUrl,
      gdpr_consent: data.consent
    };

    // 4. Update invitation status - placeholder
    console.log('Updating invitation status');
    await new Promise(resolve => setTimeout(resolve, 50)); // Simulate network delay

    // 5. Generate access code
    const pin = Math.floor(100000 + Math.random() * 900000).toString();
    const pin_hash = await hashSha256(pin);
    const qrToken = `qr_${visitor.id}_${Date.now()}`;

    // Create access code - placeholder
    console.log('Creating access code');
    await new Promise(resolve => setTimeout(resolve, 100)); // Simulate network delay

    const access_code = {
      id: generateRandomId(),
      visitor_id: visitor.id,
      resident_id: invitation.resident_id,
      invitation_id: invitation.id,
      pin_hash,
      qr_token: qrToken,
      expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
    };

    return {
      success: true,
      visitorId: visitor.id,
      accessCodeId: access_code.id,
      pin,
      qrToken
    };

  } catch (error) {
    console.error('Error in visitor registration:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}

/**
 * Get visitor registration details by access code
 */
export async function getVisitorDetails(accessCodeId: string): Promise<{ success: boolean; details?: any; error?: string }> {
  try {
    // TODO: Replace with actual FastAPI endpoint
    console.log('Getting visitor details for access code:', accessCodeId);
    await new Promise(resolve => setTimeout(resolve, 150)); // Simulate network delay

    // Placeholder data
    const data = {
      id: accessCodeId,
      visitors: {
        id: generateRandomId(),
        full_name_encrypted: simpleEncrypt('John Doe'),
        phone_encrypted: simpleEncrypt('+1234567890'),
        email_encrypted: simpleEncrypt('john@example.com')
      },
      visit_invitations: {
        id: generateRandomId(),
        visitor_full_name: 'John Doe',
        visit_date: new Date().toISOString(),
        visit_purpose: 'Business Meeting'
      }
    };

    return { success: true, details: data };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}
