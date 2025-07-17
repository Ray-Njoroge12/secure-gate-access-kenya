/**
 * Logger utility for conditional logging in development
 */
export const logger = {
  log: (message: string, ...args: unknown[]) => {
    if (import.meta.env.DEV) {
      console.log(`[LOG] ${message}`, ...args);
    }
  },
  
  error: (message: string, ...args: unknown[]) => {
    if (import.meta.env.DEV) {
      console.error(`[ERROR] ${message}`, ...args);
    }
  },
  
  warn: (message: string, ...args: unknown[]) => {
    if (import.meta.env.DEV) {
      console.warn(`[WARN] ${message}`, ...args);
    }
  },
  
  info: (message: string, ...args: unknown[]) => {
    if (import.meta.env.DEV) {
      console.info(`[INFO] ${message}`, ...args);
    }
  }
};