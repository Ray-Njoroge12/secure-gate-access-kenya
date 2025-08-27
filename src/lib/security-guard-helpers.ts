import apiClient from "@/lib/apiClient";

// Simple decryption function to match our encryption
function simpleDecrypt(encryptedText: string): string {
  try {
    return decodeURIComponent(escape(atob(encryptedText)));
  } catch (error) {
    console.error('Decryption failed:', error);
    return 'Decryption failed';
  }
}

async function hashSha256(text: string): Promise<string> {
  if (typeof window !== 'undefined' && window.crypto && window.crypto.subtle) {
    const msgBuffer = new TextEncoder().encode(text);
    const hashBuffer = await window.crypto.subtle.digest('SHA-256', msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  } else {
    throw new Error('Crypto API not available');
  }
}

export interface AccessVerificationResult {
  success: boolean;
  valid?: boolean;
  visitorName?: string;
  residentName?: string;
  visitDate?: string;
  visitPurpose?: string;
  accessCodeId?: string;
  error?: string;
}

/**
 * Verify access code (PIN or QR token) directly in database
 */
export async function verifyAccessCodeDirect(
  code: string,
  method: 'pin' | 'qr'
): Promise<AccessVerificationResult> {
  try {
    // TODO: Replace with FastAPI endpoint for access code verification
    // const response = await apiClient.verifyAccessCode(code, method);
    // return response.data;
    return {
      success: true,
      valid: false,
      error: 'Access code verification not yet implemented'
    };
  } catch (error) {
    return {
      success: false,
      valid: false,
      error: 'Failed to verify access code'
    };
  }
}

/**
 * Mark access code as used
 */
export async function markAccessCodeUsed(
  accessCodeId: string,
  guardId?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // TODO: Replace with FastAPI endpoint for marking access code as used
    // const response = await apiClient.markAccessCodeUsed(accessCodeId, guardId);
    // return response.data;
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}

/**
 * Search visitors by encrypted data (limited functionality due to encryption)
 */
export async function searchVisitorsDirect(
  query: string
): Promise<{ success: boolean; visitors?: any[]; error?: string }> {
  try {
    // TODO: Replace with FastAPI endpoint for searching visitors
    // const response = await apiClient.searchVisitors(query);
    // return response.data;
    return { success: true, visitors: [] };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}

/**
 * Get today's visitor statistics
 */
export async function getTodayStatsDirect(): Promise<{
  success: boolean;
  stats?: {
    todaysVisitors: number;
    pendingVerifications: number;
    usedCodes: number;
  };
  error?: string;
}> {
  try {
    // TODO: Replace with FastAPI endpoint for getting today's statistics
    // const response = await apiClient.getTodayStats();
    // return response.data;
    return {
      success: true,
      stats: {
        todaysVisitors: 0,
        pendingVerifications: 0,
        usedCodes: 0
      }
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}
