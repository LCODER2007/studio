/**
 * Performance monitoring utilities
 * Tracks application performance metrics and custom traces
 */

import { logger } from './logger';

class PerformanceMonitor {
  private isInitialized = false;
  private performance: any = null;

  /**
   * Initialize performance monitoring
   */
  async initialize() {
    if (typeof window === 'undefined' || this.isInitialized) {
      return;
    }

    try {
      // Only initialize in production or when explicitly enabled
      const shouldInitialize = 
        process.env.NODE_ENV === 'production' ||
        process.env.NEXT_PUBLIC_ENABLE_PERFORMANCE === 'true';

      if (!shouldInitialize) {
        logger.debug('Performance monitoring disabled in development');
        return;
      }

      // Dynamically import Firebase Performance
      const { getPerformance } = await import('firebase/performance');
      const { initializeFirebase } = await import('@/firebase');

      const { firebaseApp } = initializeFirebase();
      this.performance = getPerformance(firebaseApp);
      this.isInitialized = true;
      logger.info('Performance monitoring initialized');
    } catch (error) {
      logger.error('Failed to initialize performance monitoring', error as Error);
    }
  }

  /**
   * Create a custom trace
   */
  async trace<T>(
    traceName: string,
    operation: () => Promise<T>,
    attributes?: Record<string, string>
  ): Promise<T> {
    if (!this.isInitialized || !this.performance) {
      // If not initialized, just run the operation
      return operation();
    }

    try {
      const { trace } = await import('firebase/performance');
      const t = trace(this.performance, traceName);

      // Add custom attributes
      if (attributes) {
        Object.entries(attributes).forEach(([key, value]) => {
          t.putAttribute(key, value);
        });
      }

      t.start();
      try {
        const result = await operation();
        t.stop();
        return result;
      } catch (error) {
        t.stop();
        throw error;
      }
    } catch (error) {
      logger.error('Failed to trace operation', error as Error, { traceName });
      // Fallback to running the operation without tracing
      return operation();
    }
  }

  /**
   * Measure a synchronous operation
   */
  measure<T>(
    metricName: string,
    operation: () => T,
    context?: Record<string, any>
  ): T {
    const startTime = performance.now();
    try {
      const result = operation();
      const duration = performance.now() - startTime;
      logger.performance(metricName, duration, context);
      return result;
    } catch (error) {
      const duration = performance.now() - startTime;
      logger.performance(metricName, duration, { ...context, error: true });
      throw error;
    }
  }

  /**
   * Measure an asynchronous operation
   */
  async measureAsync<T>(
    metricName: string,
    operation: () => Promise<T>,
    context?: Record<string, any>
  ): Promise<T> {
    const startTime = performance.now();
    try {
      const result = await operation();
      const duration = performance.now() - startTime;
      logger.performance(metricName, duration, context);
      return result;
    } catch (error) {
      const duration = performance.now() - startTime;
      logger.performance(metricName, duration, { ...context, error: true });
      throw error;
    }
  }
}

// Export singleton instance
export const performanceMonitor = new PerformanceMonitor();

/**
 * Track Firestore operation performance
 */
export async function trackFirestoreOperation<T>(
  operationType: 'read' | 'write' | 'query',
  collection: string,
  operation: () => Promise<T>
): Promise<T> {
  return performanceMonitor.trace(
    `firestore_${operationType}`,
    operation,
    { collection }
  );
}

/**
 * Track component render performance
 */
export function trackComponentRender(componentName: string) {
  const startTime = performance.now();
  
  return () => {
    const duration = performance.now() - startTime;
    logger.performance(`component_render_${componentName}`, duration);
  };
}

/**
 * Web Vitals tracking
 */
export async function initializeWebVitals() {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    const { onCLS, onFID, onFCP, onLCP, onTTFB } = await import('web-vitals');

    // Cumulative Layout Shift
    onCLS((metric) => {
      logger.performance('CLS', metric.value, {
        id: metric.id,
        rating: metric.rating,
      });
    });

    // First Input Delay
    onFID((metric) => {
      logger.performance('FID', metric.value, {
        id: metric.id,
        rating: metric.rating,
      });
    });

    // First Contentful Paint
    onFCP((metric) => {
      logger.performance('FCP', metric.value, {
        id: metric.id,
        rating: metric.rating,
      });
    });

    // Largest Contentful Paint
    onLCP((metric) => {
      logger.performance('LCP', metric.value, {
        id: metric.id,
        rating: metric.rating,
      });
    });

    // Time to First Byte
    onTTFB((metric) => {
      logger.performance('TTFB', metric.value, {
        id: metric.id,
        rating: metric.rating,
      });
    });

    logger.info('Web Vitals tracking initialized');
  } catch (error) {
    logger.error('Failed to initialize Web Vitals', error as Error);
  }
}

/**
 * Performance budget checker
 * Warns if operations exceed expected duration
 */
export class PerformanceBudget {
  private budgets: Map<string, number> = new Map();

  /**
   * Set a performance budget for an operation
   */
  setBudget(operationName: string, maxDurationMs: number) {
    this.budgets.set(operationName, maxDurationMs);
  }

  /**
   * Check if an operation exceeded its budget
   */
  check(operationName: string, actualDurationMs: number) {
    const budget = this.budgets.get(operationName);
    if (budget && actualDurationMs > budget) {
      logger.warn('Performance budget exceeded', {
        operation: operationName,
        budget,
        actual: actualDurationMs,
        exceeded: actualDurationMs - budget,
      });
      return false;
    }
    return true;
  }

  /**
   * Measure and check against budget
   */
  async measureWithBudget<T>(
    operationName: string,
    operation: () => Promise<T>
  ): Promise<T> {
    const startTime = performance.now();
    try {
      const result = await operation();
      const duration = performance.now() - startTime;
      this.check(operationName, duration);
      return result;
    } catch (error) {
      const duration = performance.now() - startTime;
      this.check(operationName, duration);
      throw error;
    }
  }
}

// Export default performance budgets
export const defaultBudgets = new PerformanceBudget();

// Set default budgets for common operations
defaultBudgets.setBudget('suggestion_submission', 2000); // 2 seconds
defaultBudgets.setBudget('suggestion_list_load', 1000); // 1 second
defaultBudgets.setBudget('upvote_action', 500); // 500ms
defaultBudgets.setBudget('comment_submission', 1000); // 1 second
defaultBudgets.setBudget('admin_dashboard_load', 2000); // 2 seconds
