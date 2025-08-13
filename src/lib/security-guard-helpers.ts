import { supabase } from "@/integrations/supabase/client";

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
    let query = supabase
      .from('access_codes')
      .select(`
        *,
        visitors!inner(*),
        visit_invitations!inner(*)
      `)
      .gt('expires_at', new Date().toISOString()) // Not expired
      .is('used_at', null); // Not used

    if (method === 'pin') {
      // Hash the provided PIN to compare with stored hash
      const pinHash = await hashSha256(code);
      query = query.eq('pin_hash', pinHash);
    } else {
      // QR method - compare QR token directly
      query = query.eq('qr_token', code);
    }

    const { data, error } = await query.single();

    if (error || !data) {
      return {
        success: true,
        valid: false,
        error: 'Invalid or expired access code'
      };
    }

    // Decrypt visitor information
    const visitorName = simpleDecrypt(data.visitors.full_name_encrypted);
    const residentName = data.visit_invitations.visitor_email || 'Unknown';

    return {
      success: true,
      valid: true,
      visitorName,
      residentName,
      visitDate: data.visit_invitations.visit_date,
      visitPurpose: data.visit_invitations.visit_purpose,
      accessCodeId: data.id
    };
  } catch (error) {
    console.error('Error verifying access code:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
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
    const { error } = await supabase
      .from('access_codes')
      .update({
        used_at: new Date().toISOString(),
        user_agent: navigator.userAgent,
        ip_address: null // Would be set by backend in real implementation
      })
      .eq('id', accessCodeId);

    if (error) {
      return { success: false, error: error.message };
    }

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
    // Note: Due to encryption, we can only search by non-encrypted fields
    // In a real implementation, you might need search indexes or different approach
    const { data, error } = await supabase
      .from('visit_invitations')
      .select(`
        *,
        visitors(*),
        profiles(email)
      `)
      .or(`visitor_full_name.ilike.%${query}%,visitor_email.ilike.%${query}%`)
      .limit(10);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, visitors: data || [] };
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
    const today = new Date().toISOString().split('T')[0];

    // Get today's invitations
    const { data: invitations, error: invError } = await supabase
      .from('visit_invitations')
      .select('id, status')
      .gte('created_at', `${today}T00:00:00.000Z`)
      .lt('created_at', `${today}T23:59:59.999Z`);

    if (invError) {
      return { success: false, error: invError.message };
    }

    // Get today's used access codes
    const { data: usedCodes, error: usedError } = await supabase
      .from('access_codes')
      .select('id')
      .not('used_at', 'is', null)
      .gte('used_at', `${today}T00:00:00.000Z`)
      .lt('used_at', `${today}T23:59:59.999Z`);

    if (usedError) {
      return { success: false, error: usedError.message };
    }

    const pendingCount = invitations?.filter(inv => inv.status === 'pending').length || 0;
    const acceptedCount = invitations?.filter(inv => inv.status === 'accepted').length || 0;

    return {
      success: true,
      stats: {
        todaysVisitors: acceptedCount,
        pendingVerifications: pendingCount,
        usedCodes: usedCodes?.length || 0
      }
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}
