/**
 * Analytics tracking utilities
 * Provides a centralized way to track user events and behaviors
 */

import { logger } from './logger';

// Analytics event names
export const AnalyticsEvents = {
  // Authentication events
  SIGN_UP: 'sign_up',
  LOGIN: 'login',
  LOGOUT: 'logout',
  
  // Suggestion events
  SUGGESTION_SUBMITTED: 'suggestion_submitted',
  SUGGESTION_VIEWED: 'suggestion_viewed',
  SUGGESTION_UPVOTED: 'suggestion_upvoted',
  SUGGESTION_FILTERED: 'suggestion_filtered',
  
  // Comment events
  COMMENT_ADDED: 'comment_added',
  COMMENT_DELETED: 'comment_deleted',
  
  // Admin events
  SUGGESTION_REVIEWED: 'suggestion_reviewed',
  SUGGESTION_STATUS_CHANGED: 'suggestion_status_changed',
  USER_ROLE_CHANGED: 'user_role_changed',
  
  // Error events
  ERROR_OCCURRED: 'error_occurred',
  AUTH_ERROR: 'auth_error',
  FIRESTORE_ERROR: 'firestore_error',
} as const;

export type AnalyticsEventName = typeof AnalyticsEvents[keyof typeof AnalyticsEvents];

interface AnalyticsParams {
  [key: string]: string | number | boolean | undefined;
}

class Analytics {
  private isInitialized = false;
  private analytics: any = null;

  /**
   * Initialize analytics (call this in the app root)
   */
  async initialize() {
    if (typeof window === 'undefined' || this.isInitialized) {
      return;
    }

    try {
      // Only initialize in production or when explicitly enabled
      const shouldInitialize = 
        process.env.NODE_ENV === 'production' ||
        process.env.NEXT_PUBLIC_ENABLE_ANALYTICS === 'true';

      if (!shouldInitialize) {
        logger.debug('Analytics disabled in development');
        return;
      }

      // Dynamically import Firebase Analytics to avoid SSR issues
      const { getAnalytics, isSupported } = await import('firebase/analytics');
      const { initializeFirebase } = await import('@/firebase');

      // Check if analytics is supported in this environment
      const supported = await isSupported();
      if (!supported) {
        logger.warn('Firebase Analytics not supported in this environment');
        return;
      }

      const { firebaseApp } = initializeFirebase();
      this.analytics = getAnalytics(firebaseApp);
      this.isInitialized = true;
      logger.info('Analytics initialized');
    } catch (error) {
      logger.error('Failed to initialize analytics', error as Error);
    }
  }

  /**
   * Track a custom event
   */
  trackEvent(eventName: AnalyticsEventName | string, params?: AnalyticsParams) {
    if (!this.isInitialized || !this.analytics) {
      logger.debug('Analytics not initialized, skipping event', { eventName, params });
      return;
    }

    try {
      // Dynamically import logEvent to avoid SSR issues
      import('firebase/analytics').then(({ logEvent }) => {
        logEvent(this.analytics, eventName, params);
        logger.debug('Event tracked', { eventName, params });
      });
    } catch (error) {
      logger.error('Failed to track event', error as Error, { eventName, params });
    }
  }

  /**
   * Set user ID for analytics
   */
  setUserId(userId: string) {
    if (!this.isInitialized || !this.analytics) {
      return;
    }

    try {
      import('firebase/analytics').then(({ setUserId }) => {
        setUserId(this.analytics, userId);
        logger.debug('User ID set', { userId });
      });
    } catch (error) {
      logger.error('Failed to set user ID', error as Error, { userId });
    }
  }

  /**
   * Set user properties for analytics
   */
  setUserProperties(properties: Record<string, string>) {
    if (!this.isInitialized || !this.analytics) {
      return;
    }

    try {
      import('firebase/analytics').then(({ setUserProperties }) => {
        setUserProperties(this.analytics, properties);
        logger.debug('User properties set', { properties });
      });
    } catch (error) {
      logger.error('Failed to set user properties', error as Error, { properties });
    }
  }

  /**
   * Track page view
   */
  trackPageView(pagePath: string, pageTitle?: string) {
    this.trackEvent('page_view', {
      page_path: pagePath,
      page_title: pageTitle || pagePath,
    });
  }

  /**
   * Track suggestion submission
   */
  trackSuggestionSubmitted(params: {
    category: string;
    anonymous: boolean;
  }) {
    this.trackEvent(AnalyticsEvents.SUGGESTION_SUBMITTED, params);
  }

  /**
   * Track suggestion view
   */
  trackSuggestionViewed(suggestionId: string, category: string) {
    this.trackEvent(AnalyticsEvents.SUGGESTION_VIEWED, {
      suggestion_id: suggestionId,
      category,
    });
  }

  /**
   * Track upvote
   */
  trackUpvote(suggestionId: string) {
    this.trackEvent(AnalyticsEvents.SUGGESTION_UPVOTED, {
      suggestion_id: suggestionId,
    });
  }

  /**
   * Track comment
   */
  trackComment(suggestionId: string) {
    this.trackEvent(AnalyticsEvents.COMMENT_ADDED, {
      suggestion_id: suggestionId,
    });
  }

  /**
   * Track filter usage
   */
  trackFilter(filterType: 'category' | 'status', filterValue: string) {
    this.trackEvent(AnalyticsEvents.SUGGESTION_FILTERED, {
      filter_type: filterType,
      filter_value: filterValue,
    });
  }

  /**
   * Track admin action
   */
  trackAdminAction(action: string, params?: AnalyticsParams) {
    this.trackEvent(action, {
      ...params,
      user_type: 'admin',
    });
  }

  /**
   * Track error
   */
  trackError(errorType: string, errorMessage: string, context?: AnalyticsParams) {
    this.trackEvent(AnalyticsEvents.ERROR_OCCURRED, {
      error_type: errorType,
      error_message: errorMessage,
      ...context,
    });
  }
}

// Export singleton instance
export const analytics = new Analytics();

/**
 * Hook for tracking page views in Next.js
 * Use this in your layout or page components
 */
export function usePageTracking() {
  if (typeof window === 'undefined') {
    return;
  }

  // Track initial page view
  analytics.trackPageView(window.location.pathname);

  // Track route changes (for client-side navigation)
  const handleRouteChange = (url: string) => {
    analytics.trackPageView(url);
  };

  // Listen for route changes
  window.addEventListener('popstate', () => {
    handleRouteChange(window.location.pathname);
  });

  return () => {
    window.removeEventListener('popstate', () => {
      handleRouteChange(window.location.pathname);
    });
  };
}
