# Monitoring and Logging Setup Guide

This guide covers setting up comprehensive monitoring and logging for the SEES UNILAG Innovation Hub application.

## Overview

The application uses a multi-layered monitoring approach:

1. **Application Logging**: Centralized logging utility (`src/lib/logger.ts`)
2. **Error Tracking**: Firebase Crashlytics or Sentry
3. **Performance Monitoring**: Firebase Performance Monitoring
4. **Analytics**: Firebase Analytics
5. **Cloud Functions Logging**: Firebase Functions logs

## Application Logging

### Using the Logger

The centralized logger is available at `src/lib/logger.ts`:

```typescript
import { logger } from '@/lib/logger';

// Debug logging (development only)
logger.debug('User action', { userId: user.uid, action: 'submit_suggestion' });

// Info logging
logger.info('Suggestion created', { suggestionId: suggestion.id });

// Warning logging
logger.warn('Rate limit approaching', { userId: user.uid, count: 95 });

// Error logging
logger.error('Failed to create suggestion', error, { userId: user.uid });

// Performance tracking
const tracker = new PerformanceTracker('suggestion_submission');
// ... perform operation ...
tracker.end();
```

### Log Levels

- **DEBUG**: Detailed information for debugging (development only)
- **INFO**: General informational messages
- **WARN**: Warning messages for potentially harmful situations
- **ERROR**: Error messages for failures

## Error Tracking

### Option 1: Firebase Crashlytics (Recommended for Firebase projects)

1. **Enable Crashlytics in Firebase Console:**
   - Go to Firebase Console > Crashlytics
   - Click "Enable Crashlytics"

2. **Install dependencies:**
   ```bash
   npm install firebase
   ```

3. **Initialize Crashlytics:**
   ```typescript
   // src/lib/crashlytics.ts
   import { getApp } from 'firebase/app';
   import { initializeAppCheck, ReCaptchaV3Provider } from 'firebase/app-check';
   
   // Initialize App Check (optional but recommended)
   if (typeof window !== 'undefined') {
     const app = getApp();
     initializeAppCheck(app, {
       provider: new ReCaptchaV3Provider('YOUR_RECAPTCHA_SITE_KEY'),
       isTokenAutoRefreshEnabled: true,
     });
   }
   ```

4. **Update logger to use Crashlytics:**
   ```typescript
   // In src/lib/logger.ts
   import { getApp } from 'firebase/app';
   
   private sendToErrorTracking(message: string, error?: Error, context?: LogContext) {
     if (typeof window !== 'undefined') {
       // Log to console for visibility
       console.error('Error tracked:', message, error, context);
       
       // Firebase automatically captures unhandled errors
       // For custom error tracking, you can use:
       // import { getFunctions, httpsCallable } from 'firebase/functions';
       // const logError = httpsCallable(getFunctions(), 'logError');
       // logError({ message, error: error?.message, context });
     }
   }
   ```

### Option 2: Sentry (More features, separate service)

1. **Create Sentry account:**
   - Go to [sentry.io](https://sentry.io)
   - Create a new project for Next.js

2. **Install Sentry:**
   ```bash
   npm install @sentry/nextjs
   npx @sentry/wizard@latest -i nextjs
   ```

3. **Configure Sentry:**
   The wizard will create configuration files:
   - `sentry.client.config.ts`
   - `sentry.server.config.ts`
   - `sentry.edge.config.ts`

4. **Update logger to use Sentry:**
   ```typescript
   // In src/lib/logger.ts
   import * as Sentry from '@sentry/nextjs';
   
   private sendToErrorTracking(message: string, error?: Error, context?: LogContext) {
     Sentry.captureException(error || new Error(message), {
       tags: context,
       extra: { message },
     });
   }
   ```

5. **Set environment variables:**
   ```bash
   NEXT_PUBLIC_SENTRY_DSN=your_sentry_dsn
   SENTRY_AUTH_TOKEN=your_auth_token
   ```

## Performance Monitoring

### Firebase Performance Monitoring

1. **Enable Performance Monitoring:**
   - Already enabled if using Firebase
   - No additional setup required

2. **Add custom traces:**
   ```typescript
   // src/lib/performance.ts
   import { getPerformance, trace } from 'firebase/performance';
   import { app } from '@/firebase/config';
   
   const perf = getPerformance(app);
   
   export async function trackOperation<T>(
     name: string,
     operation: () => Promise<T>,
     attributes?: Record<string, string>
   ): Promise<T> {
     const t = trace(perf, name);
     
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
   }
   ```

3. **Use in components:**
   ```typescript
   import { trackOperation } from '@/lib/performance';
   
   const suggestions = await trackOperation(
     'fetch_suggestions',
     () => getDocs(query),
     { category: selectedCategory }
   );
   ```

### Web Vitals Tracking

1. **Create Web Vitals reporter:**
   ```typescript
   // src/lib/web-vitals.ts
   import { onCLS, onFID, onFCP, onLCP, onTTFB } from 'web-vitals';
   import { logger } from './logger';
   
   export function reportWebVitals() {
     onCLS((metric) => {
       logger.performance('CLS', metric.value, { id: metric.id });
     });
     
     onFID((metric) => {
       logger.performance('FID', metric.value, { id: metric.id });
     });
     
     onFCP((metric) => {
       logger.performance('FCP', metric.value, { id: metric.id });
     });
     
     onLCP((metric) => {
       logger.performance('LCP', metric.value, { id: metric.id });
     });
     
     onTTFB((metric) => {
       logger.performance('TTFB', metric.value, { id: metric.id });
     });
   }
   ```

2. **Initialize in app:**
   ```typescript
   // src/app/layout.tsx
   import { reportWebVitals } from '@/lib/web-vitals';
   
   useEffect(() => {
     if (process.env.NODE_ENV === 'production') {
       reportWebVitals();
     }
   }, []);
   ```

## Analytics

### Firebase Analytics

1. **Initialize Analytics:**
   ```typescript
   // src/lib/analytics.ts
   import { getAnalytics, logEvent, setUserId, setUserProperties } from 'firebase/analytics';
   import { app } from '@/firebase/config';
   
   let analytics: ReturnType<typeof getAnalytics> | null = null;
   
   if (typeof window !== 'undefined') {
     analytics = getAnalytics(app);
   }
   
   export function trackEvent(eventName: string, params?: Record<string, any>) {
     if (analytics) {
       logEvent(analytics, eventName, params);
     }
   }
   
   export function setUser(userId: string, properties?: Record<string, any>) {
     if (analytics) {
       setUserId(analytics, userId);
       if (properties) {
         setUserProperties(analytics, properties);
       }
     }
   }
   ```

2. **Track key events:**
   ```typescript
   import { trackEvent } from '@/lib/analytics';
   
   // Track suggestion submission
   trackEvent('suggestion_submitted', {
     category: suggestion.category,
     anonymous: suggestion.authorUid === 'ANONYMOUS',
   });
   
   // Track upvote
   trackEvent('suggestion_upvoted', {
     suggestionId: suggestion.id,
   });
   
   // Track comment
   trackEvent('comment_added', {
     suggestionId: suggestion.id,
   });
   
   // Track admin actions
   trackEvent('suggestion_status_changed', {
     suggestionId: suggestion.id,
     oldStatus: oldStatus,
     newStatus: newStatus,
   });
   ```

### Custom Events to Track

1. **User Actions:**
   - `sign_up` - User registration
   - `login` - User login
   - `logout` - User logout
   - `suggestion_submitted` - New suggestion created
   - `suggestion_upvoted` - Suggestion upvoted
   - `comment_added` - Comment posted
   - `suggestion_viewed` - Suggestion detail viewed

2. **Admin Actions:**
   - `suggestion_reviewed` - Admin reviewed suggestion
   - `suggestion_status_changed` - Status updated
   - `user_role_changed` - User role modified

3. **Errors:**
   - `error_occurred` - Any error
   - `auth_error` - Authentication error
   - `firestore_error` - Database error

## Cloud Functions Logging

### Structured Logging in Functions

```typescript
// functions/src/index.ts
import * as functions from 'firebase-functions';

export const onVoteCreated = functions.firestore
  .document('votes/{voteId}')
  .onCreate(async (snap, context) => {
    const voteId = context.params.voteId;
    
    // Structured logging
    functions.logger.info('Vote created', {
      voteId,
      suggestionId: snap.data().suggestionId,
      voterUid: snap.data().voterUid,
    });
    
    try {
      // ... function logic ...
      
      functions.logger.info('Vote count updated successfully', {
        voteId,
        newCount: updatedCount,
      });
    } catch (error) {
      functions.logger.error('Failed to update vote count', {
        voteId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  });
```

### Viewing Function Logs

1. **Firebase Console:**
   - Go to Firebase Console > Functions
   - Click on function name to view logs

2. **Firebase CLI:**
   ```bash
   firebase functions:log --project production
   ```

3. **Google Cloud Console:**
   - Go to Cloud Console > Logging
   - Filter by function name

### Log Levels in Functions

- `functions.logger.debug()` - Debug information
- `functions.logger.info()` - Informational messages
- `functions.logger.warn()` - Warnings
- `functions.logger.error()` - Errors

## Monitoring Dashboard Setup

### Firebase Console Dashboard

1. **Navigate to Firebase Console**
2. **Key sections to monitor:**
   - **Analytics**: User engagement, events
   - **Performance**: Page load times, network requests
   - **Crashlytics**: Error reports, crash-free users
   - **Functions**: Execution count, errors, duration
   - **Firestore**: Read/write operations, storage

### Custom Monitoring Dashboard

Create a custom dashboard using Firebase Admin SDK:

```typescript
// scripts/monitoring-dashboard.ts
import * as admin from 'firebase-admin';

admin.initializeApp();

async function getMetrics() {
  const db = admin.firestore();
  
  // Get suggestion count
  const suggestionsSnapshot = await db.collection('suggestions').count().get();
  const suggestionCount = suggestionsSnapshot.data().count;
  
  // Get user count
  const usersSnapshot = await db.collection('users').count().get();
  const userCount = usersSnapshot.data().count;
  
  // Get recent errors (if logging to Firestore)
  const errorsSnapshot = await db.collection('errors')
    .orderBy('timestamp', 'desc')
    .limit(10)
    .get();
  
  console.log('Metrics:', {
    suggestions: suggestionCount,
    users: userCount,
    recentErrors: errorsSnapshot.size,
  });
}

getMetrics();
```

## Alerting

### Firebase Alerts

1. **Set up budget alerts:**
   - Go to Firebase Console > Usage and billing
   - Set budget alerts for Firestore, Functions, etc.

2. **Performance alerts:**
   - Go to Firebase Console > Performance
   - Set up alerts for slow page loads

3. **Crashlytics alerts:**
   - Go to Firebase Console > Crashlytics
   - Configure email alerts for new crashes

### Custom Alerts

Use Cloud Functions to send custom alerts:

```typescript
// functions/src/alerts.ts
import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

export const checkErrorRate = functions.pubsub
  .schedule('every 5 minutes')
  .onRun(async (context) => {
    const db = admin.firestore();
    
    // Check error rate in last 5 minutes
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    const errorsSnapshot = await db.collection('errors')
      .where('timestamp', '>', fiveMinutesAgo)
      .get();
    
    if (errorsSnapshot.size > 10) {
      // Send alert (email, Slack, etc.)
      functions.logger.error('High error rate detected', {
        count: errorsSnapshot.size,
        period: '5 minutes',
      });
      
      // TODO: Send notification
    }
  });
```

## Best Practices

1. **Log Meaningful Information:**
   - Include context (user ID, suggestion ID, etc.)
   - Use structured logging
   - Don't log sensitive information (passwords, tokens)

2. **Set Appropriate Log Levels:**
   - Use DEBUG for development only
   - Use INFO for normal operations
   - Use WARN for potential issues
   - Use ERROR for failures

3. **Monitor Key Metrics:**
   - Error rate
   - Response time
   - User engagement
   - Function execution time
   - Database operations

4. **Set Up Alerts:**
   - High error rate
   - Slow performance
   - Budget exceeded
   - Function failures

5. **Regular Review:**
   - Review logs weekly
   - Analyze trends monthly
   - Update monitoring as needed

## Troubleshooting

### Common Issues

1. **Logs not appearing:**
   - Check that logger is properly initialized
   - Verify environment variables
   - Check Firebase project configuration

2. **Performance data missing:**
   - Ensure Performance Monitoring is enabled
   - Check that app is deployed (not localhost)
   - Wait 24 hours for data to appear

3. **Analytics not tracking:**
   - Verify Analytics is enabled in Firebase Console
   - Check that measurement ID is set
   - Ensure cookies are enabled

## Resources

- [Firebase Performance Monitoring](https://firebase.google.com/docs/perf-mon)
- [Firebase Analytics](https://firebase.google.com/docs/analytics)
- [Firebase Crashlytics](https://firebase.google.com/docs/crashlytics)
- [Sentry Documentation](https://docs.sentry.io/platforms/javascript/guides/nextjs/)
- [Web Vitals](https://web.dev/vitals/)
