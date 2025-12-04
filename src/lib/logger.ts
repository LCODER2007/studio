/**
 * Centralized logging utility for the application
 * Provides structured logging with different levels and context
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LogContext {
  userId?: string;
  suggestionId?: string;
  component?: string;
  action?: string;
  [key: string]: any;
}

class Logger {
  private isDevelopment = process.env.NODE_ENV === 'development';
  private isProduction = process.env.NODE_ENV === 'production';

  /**
   * Log a debug message (only in development)
   */
  debug(message: string, context?: LogContext) {
    if (this.isDevelopment) {
      console.debug('[DEBUG]', message, context || '');
    }
  }

  /**
   * Log an info message
   */
  info(message: string, context?: LogContext) {
    console.info('[INFO]', message, context || '');
    
    // In production, send to analytics or monitoring service
    if (this.isProduction) {
      this.sendToMonitoring('info', message, context);
    }
  }

  /**
   * Log a warning message
   */
  warn(message: string, context?: LogContext) {
    console.warn('[WARN]', message, context || '');
    
    // In production, send to monitoring service
    if (this.isProduction) {
      this.sendToMonitoring('warn', message, context);
    }
  }

  /**
   * Log an error message
   */
  error(message: string, error?: Error, context?: LogContext) {
    console.error('[ERROR]', message, error, context || '');
    
    // In production, send to error tracking service
    if (this.isProduction) {
      this.sendToErrorTracking(message, error, context);
    }
  }

  /**
   * Log a performance metric
   */
  performance(metricName: string, duration: number, context?: LogContext) {
    if (this.isDevelopment) {
      console.log(`[PERF] ${metricName}: ${duration}ms`, context || '');
    }
    
    // In production, send to performance monitoring
    if (this.isProduction) {
      this.sendToPerformanceMonitoring(metricName, duration, context);
    }
  }

  /**
   * Send log to monitoring service (Firebase Analytics, etc.)
   */
  private sendToMonitoring(level: LogLevel, message: string, context?: LogContext) {
    // TODO: Implement Firebase Analytics logging
    // Example:
    // import { logEvent } from 'firebase/analytics';
    // logEvent(analytics, 'app_log', {
    //   level,
    //   message,
    //   ...context,
    // });
  }

  /**
   * Send error to error tracking service (Sentry, Firebase Crashlytics, etc.)
   */
  private sendToErrorTracking(message: string, error?: Error, context?: LogContext) {
    // TODO: Implement error tracking
    // Example with Sentry:
    // import * as Sentry from '@sentry/nextjs';
    // Sentry.captureException(error, {
    //   tags: context,
    //   extra: { message },
    // });
    
    // Example with Firebase Crashlytics:
    // import { crashlytics } from 'firebase/crashlytics';
    // crashlytics().recordError(error);
  }

  /**
   * Send performance metric to monitoring service
   */
  private sendToPerformanceMonitoring(metricName: string, duration: number, context?: LogContext) {
    // TODO: Implement performance monitoring
    // Example with Firebase Performance:
    // import { trace } from 'firebase/performance';
    // const t = trace(performance, metricName);
    // t.putMetric('duration', duration);
    // if (context) {
    //   Object.entries(context).forEach(([key, value]) => {
    //     t.putAttribute(key, String(value));
    //   });
    // }
  }
}

// Export singleton instance
export const logger = new Logger();

/**
 * Performance measurement utility
 */
export class PerformanceTracker {
  private startTime: number;
  private metricName: string;
  private context?: LogContext;

  constructor(metricName: string, context?: LogContext) {
    this.metricName = metricName;
    this.context = context;
    this.startTime = performance.now();
  }

  /**
   * End the performance measurement and log the result
   */
  end() {
    const duration = performance.now() - this.startTime;
    logger.performance(this.metricName, duration, this.context);
    return duration;
  }
}

/**
 * Decorator for measuring function performance
 */
export function measurePerformance(metricName: string) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const tracker = new PerformanceTracker(metricName);
      try {
        const result = await originalMethod.apply(this, args);
        tracker.end();
        return result;
      } catch (error) {
        tracker.end();
        throw error;
      }
    };

    return descriptor;
  };
}
