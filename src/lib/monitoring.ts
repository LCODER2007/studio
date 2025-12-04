/**
 * Centralized monitoring initialization
 * Call this once in your app root to set up all monitoring services
 */

import { analytics } from './analytics';
import { performanceMonitor, initializeWebVitals } from './performance';
import { logger } from './logger';

let isInitialized = false;

/**
 * Initialize all monitoring services
 * Should be called once in the app root (e.g., in layout.tsx)
 */
export async function initializeMonitoring() {
  if (isInitialized) {
    logger.debug('Monitoring already initialized');
    return;
  }

  try {
    logger.info('Initializing monitoring services...');

    // Initialize analytics
    await analytics.initialize();

    // Initialize performance monitoring
    await performanceMonitor.initialize();

    // Initialize Web Vitals tracking
    if (process.env.NODE_ENV === 'production') {
      await initializeWebVitals();
    }

    isInitialized = true;
    logger.info('Monitoring services initialized successfully');
  } catch (error) {
    logger.error('Failed to initialize monitoring services', error as Error);
  }
}

/**
 * Check if monitoring is initialized
 */
export function isMonitoringInitialized(): boolean {
  return isInitialized;
}

/**
 * Global error handler
 * Catches unhandled errors and logs them
 */
export function setupGlobalErrorHandlers() {
  if (typeof window === 'undefined') {
    return;
  }

  // Handle unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    logger.error('Unhandled promise rejection', event.reason, {
      promise: event.promise,
    });
    event.preventDefault();
  });

  // Handle global errors
  window.addEventListener('error', (event) => {
    logger.error('Global error', event.error, {
      message: event.message,
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
    });
  });

  logger.info('Global error handlers set up');
}

/**
 * Clean up monitoring services
 * Call this when the app is unmounting (if needed)
 */
export function cleanupMonitoring() {
  isInitialized = false;
  logger.info('Monitoring services cleaned up');
}
