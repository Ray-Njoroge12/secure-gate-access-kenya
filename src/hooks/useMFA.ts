import { useState, useCallback } from 'react';

interface MFAState {
  isEnabled: boolean;
  methods: string[];
  preferredMethod: string | null;
  backupCodes: string[];
  lastVerification: Date | null;
}

interface MFAHookReturn {
  mfaState: MFAState;
  isLoading: boolean;
  error: string | null;
  setupMFA: (method: string, data: any) => Promise<boolean>;
  verifyMFA: (code: string, method?: string) => Promise<boolean>;
  disableMFA: (method: string) => Promise<boolean>;
  generateBackupCodes: () => Promise<string[]>;
  useBackupCode: (code: string) => Promise<boolean>;
  refreshMFAState: () => Promise<void>;
}

export const useMFA = (userId: string): MFAHookReturn => {
  const [mfaState, setMfaState] = useState<MFAState>({
    isEnabled: false,
    methods: [],
    preferredMethod: null,
    backupCodes: [],
    lastVerification: null
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refreshMFAState = useCallback(async () => {
    if (!userId) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/mfa/status/${userId}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('auth_token')}` }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch MFA status');
      }

      const data = await response.json();
      setMfaState(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch MFA status');
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  const setupMFA = useCallback(async (method: string, data: any): Promise<boolean> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/mfa/setup', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        },
        body: JSON.stringify({ userId, method, ...data })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to setup MFA');
      }

      const result = await response.json();
      
      // Refresh MFA state after successful setup
      await refreshMFAState();
      
      return result.success;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to setup MFA');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [userId, refreshMFAState]);

  const verifyMFA = useCallback(async (code: string, method?: string): Promise<boolean> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/mfa/verify', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        },
        body: JSON.stringify({ 
          userId, 
          code, 
          method: method || mfaState.preferredMethod 
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Invalid verification code');
      }

      const result = await response.json();
      
      if (result.success) {
        setMfaState(prev => ({
          ...prev,
          lastVerification: new Date()
        }));
      }
      
      return result.success;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Verification failed');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [userId, mfaState.preferredMethod]);

  const disableMFA = useCallback(async (method: string): Promise<boolean> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/mfa/disable', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        },
        body: JSON.stringify({ userId, method })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to disable MFA');
      }

      // Refresh MFA state after successful disable
      await refreshMFAState();
      
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to disable MFA');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [userId, refreshMFAState]);

  const generateBackupCodes = useCallback(async (): Promise<string[]> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/mfa/backup-codes', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        },
        body: JSON.stringify({ userId })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to generate backup codes');
      }

      const result = await response.json();
      const codes = result.backupCodes || [];
      
      setMfaState(prev => ({
        ...prev,
        backupCodes: codes
      }));
      
      return codes;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate backup codes');
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  const useBackupCode = useCallback(async (code: string): Promise<boolean> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/mfa/backup-code', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        },
        body: JSON.stringify({ userId, code })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Invalid backup code');
      }

      const result = await response.json();
      
      if (result.success) {
        setMfaState(prev => ({
          ...prev,
          lastVerification: new Date(),
          backupCodes: prev.backupCodes.filter(c => c !== code)
        }));
      }
      
      return result.success;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Backup code verification failed');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  return {
    mfaState,
    isLoading,
    error,
    setupMFA,
    verifyMFA,
    disableMFA,
    generateBackupCodes,
    useBackupCode,
    refreshMFAState
  };
};
