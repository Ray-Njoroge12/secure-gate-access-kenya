/**
 * Monitoring and Analytics Service
 * Handles error tracking, performance monitoring, and analytics
 */

import * as Sentry from '@sentry/react';
import { BrowserTracing } from '@sentry/tracing';

// Error severity levels
export enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

// Analytics event types
export enum AnalyticsEvent {
  // Access events
  ACCESS_GRANTED = 'access_granted',
  ACCESS_DENIED = 'access_denied',
  ACCESS_CODE_GENERATED = 'access_code_generated',
  
  // User events
  USER_LOGIN = 'user_login',
  USER_LOGOUT = 'user_logout',
  USER_REGISTER = 'user_register',
  
  // Panic events
  PANIC_TRIGGERED = 'panic_triggered',
  PANIC_RESOLVED = 'panic_resolved',
  
  // SMS events
  SMS_SENT = 'sms_sent',
  SMS_FAILED = 'sms_failed',
  
  // Feature usage
  CAB_FAST_LANE_USED = 'cab_fast_lane_used',
  REUSABLE_CODE_USED = 'reusable_code_used',
  MAP_LINK_GENERATED = 'map_link_generated'
}

// Initialize Sentry for error tracking
export const initMonitoring = () => {
  if (import.meta.env.VITE_SENTRY_DSN) {
    Sentry.init({
      dsn: import.meta.env.VITE_SENTRY_DSN,
      integrations: [
        new BrowserTracing(),
      ],
      tracesSampleRate: import.meta.env.PROD ? 0.1 : 1.0,
      environment: import.meta.env.MODE,
      beforeSend(event, hint) {
        // Filter out sensitive data
        if (event.request) {
          delete event.request.cookies;
          delete event.request.headers;
        }
        return event;
      }
    });
  }
};

// Track custom events
export const trackEvent = (
  event: AnalyticsEvent,
  properties?: Record<string, any>
) => {
  // Remove sensitive data from properties
  const sanitizedProps = sanitizeProperties(properties);
  
  // Send to analytics service
  if (window.mixpanel && import.meta.env.VITE_MIXPANEL_TOKEN) {
    window.mixpanel.track(event, sanitizedProps);
  }
  
  // Also log to console in development
  if (import.meta.env.DEV) {
    console.log('[Analytics]', event, sanitizedProps);
  }
};

// Track user identification
export const identifyUser = (userId: string, traits?: Record<string, any>) => {
  // Sentry user context
  Sentry.setUser({ id: userId });
  
  // Mixpanel identification
  if (window.mixpanel && import.meta.env.VITE_MIXPANEL_TOKEN) {
    window.mixpanel.identify(userId);
    if (traits) {
      window.mixpanel.people.set(sanitizeProperties(traits));
    }
  }
};

// Log errors with context
export const logError = (
  error: Error,
  context?: Record<string, any>,
  severity: ErrorSeverity = ErrorSeverity.MEDIUM
) => {
  // Log to Sentry
  Sentry.captureException(error, {
    level: mapSeverityToSentryLevel(severity),
    contexts: {
      custom: sanitizeProperties(context)
    }
  });
  
  // Log to console in development
  if (import.meta.env.DEV) {
    console.error('[Error]', error, context);
  }
};

// Track performance metrics
export const trackPerformance = (
  metricName: string,
  value: number,
  unit: string = 'ms'
) => {
  // Send custom performance metric to monitoring
  if (window.performance && window.performance.mark) {
    window.performance.mark(`${metricName}_${value}${unit}`);
  }
  
  // Track in analytics
  trackEvent(AnalyticsEvent.ACCESS_GRANTED, {
    metric: metricName,
    value,
    unit
  });
};

// Monitor API calls
export const monitorAPI = async <T>(
  apiCall: () => Promise<T>,
  endpoint: string,
  method: string = 'GET'
): Promise<T> => {
  const startTime = performance.now();
  
  try {
    const result = await apiCall();
    const duration = performance.now() - startTime;
    
    // Track successful API call
    trackPerformance(`api_${method.toLowerCase()}_${endpoint}`, duration);
    
    return result;
  } catch (error) {
    const duration = performance.now() - startTime;
    
    // Log API error
    logError(error as Error, {
      endpoint,
      method,
      duration
    }, ErrorSeverity.HIGH);
    
    throw error;
  }
};

// Helper function to sanitize properties
const sanitizeProperties = (props?: Record<string, any>): Record<string, any> => {
  if (!props) return {};
  
  const sensitive = ['password', 'pin', 'token', 'key', 'secret', 'auth'];
  const sanitized = { ...props };
  
  Object.keys(sanitized).forEach(key => {
    if (sensitive.some(s => key.toLowerCase().includes(s))) {
      sanitized[key] = '[REDACTED]';
    }
  });
  
  return sanitized;
};

// Map severity to Sentry level
const mapSeverityToSentryLevel = (severity: ErrorSeverity): Sentry.SeverityLevel => {
  switch (severity) {
    case ErrorSeverity.LOW:
      return 'info';
    case ErrorSeverity.MEDIUM:
      return 'warning';
    case ErrorSeverity.HIGH:
      return 'error';
    case ErrorSeverity.CRITICAL:
      return 'fatal';
    default:
      return 'warning';
  }
};

// Create monitoring context hook
export const useMonitoring = () => {
  return {
    trackEvent,
    identifyUser,
    logError,
    trackPerformance,
    monitorAPI
  };
};

// Declare global mixpanel type
declare global {
  interface Window {
    mixpanel: any;
  }
}
