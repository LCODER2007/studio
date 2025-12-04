# Monitoring and Logging Implementation

This document provides an overview of the monitoring and logging implementation for the SEES UNILAG Innovation Hub application.

## Overview

The application includes a comprehensive monitoring stack:

1. **Centralized Logging** (`src/lib/logger.ts`)
2. **Analytics Tracking** (`src/lib/analytics.ts`)
3. **Performance Monitoring** (`src/lib/performance.ts`)
4. **Error Boundary** (`src/components/ErrorBoundary.tsx`)
5. **Monitoring Initialization** (`src/lib/monitoring.ts`)

## Quick Start

### 1. Initialize Monitoring in Your App

Add this to your root layout (`src/app/layout.tsx`):

```typescript
'use client';

import { useEffect } from 'react';
import { initializeMonitoring, setupGlobalErrorHandlers } from '@/lib/monitoring';
import { ErrorBoundary } from '@/components/ErrorBoundary';

export default function RootLayout({ children }) {
  useEffect(() => {
    // Initialize monitoring services
    initializeMonitoring();
    
    // Set up global error handlers
    setupGlobalErrorHandlers();
  }, []);

  return (
    <html lang="en">
      <body>
        <ErrorBoundary>
          {children}
        </ErrorBoundary>
      </body>
    </html>
  );
}
```

### 2. Use Logging in Your Components

```typescript
import { logger } from '@/lib/logger';

function MyComponent() {
  const handleSubmit = async () => {
    try {
      logger.info('Submitting suggestion', { userId: user.uid });
      await submitSuggestion(data);
      logger.info('Suggestion submitted successfully');
    } catch (error) {
      logger.error('Failed to submit suggestion', error, { userId: user.uid });
    }
  };
}
```

### 3. Track Analytics Events

```typescript
import { analytics } from '@/lib/analytics';

function SuggestionCard({ suggestion }) {
  const handleUpvote = () => {
    analytics.trackUpvote(suggestion.id);
    // ... upvote logic
  };
}
```

### 4. Monitor Performance

```typescript
import { performanceMonitor } from '@/lib/performance';

async function loadSuggestions() {
  return performanceMonitor.trace(
    'load_suggestions',
    async () => {
      const snapshot = await getDocs(query);
      return snapshot.docs.map(doc => doc.data());
    },
    { category: selectedCategory }
  );
}
```

## Features

### Logging

The logger provides four log levels:

- **DEBUG**: Development-only detailed information
- **INFO**: General informational messages
- **WARN**: Warning messages for potential issues
- **ERROR**: Error messages for failures

Example usage:

```typescript
import { logger } from '@/lib/logger';

// Debug (development only)
logger.debug('User clicked button', { buttonId: 'submit' });

// Info
logger.info('Suggestion created', { suggestionId: suggestion.id });

// Warning
logger.warn('Rate limit approaching', { userId: user.uid, count: 95 });

// Error
logger.error('Failed to create suggestion', error, { userId: user.uid });

// Performance
logger.performance('suggestion_submission', 1234, { category: 'ACADEMIC' });
```

### Analytics

Track user behavior and events:

```typescript
import { analytics, AnalyticsEvents } from '@/lib/analytics';

// Track custom event
analytics.trackEvent(AnalyticsEvents.SUGGESTION_SUBMITTED, {
  category: 'ACADEMIC_CURRICULUM',
  anonymous: false,
});

// Track page view
analytics.trackPageView('/admin/dashboard');

// Set user ID
analytics.setUserId(user.uid);

// Set user properties
analytics.setUserProperties({
  role: user.role,
  department: user.department,
});

// Convenience methods
analytics.trackSuggestionSubmitted({ category: 'ACADEMIC', anonymous: false });
analytics.trackUpvote(suggestionId);
analytics.trackComment(suggestionId);
analytics.trackFilter('category', 'ACADEMIC');
```

### Performance Monitoring

Track operation performance:

```typescript
import { performanceMonitor, trackFirestoreOperation } from '@/lib/performance';

// Trace async operation
const result = await performanceMonitor.trace(
  'load_suggestions',
  async () => {
    return await getDocs(query);
  },
  { category: 'ACADEMIC' }
);

// Measure sync operation
const result = performanceMonitor.measure(
  'process_data',
  () => {
    return processData(data);
  }
);

// Track Firestore operation
const suggestions = await trackFirestoreOperation(
  'query',
  'suggestions',
  () => getDocs(query)
);

// Performance budgets
import { defaultBudgets } from '@/lib/performance';

await defaultBudgets.measureWithBudget(
  'suggestion_submission',
  async () => {
    await submitSuggestion(data);
  }
);
```

### Error Boundary

Catch and handle React errors:

```typescript
import { ErrorBoundary } from '@/components/ErrorBoundary';

function App() {
  return (
    <ErrorBoundary>
      <YourComponent />
    </ErrorBoundary>
  );
}

// Custom fallback
<ErrorBoundary fallback={<CustomErrorPage />}>
  <YourComponent />
</ErrorBoundary>

// Programmatic error handling
import { useErrorHandler } from '@/components/ErrorBoundary';

function MyComponent() {
  const handleError = useErrorHandler();
  
  const doSomething = async () => {
    try {
      await riskyOperation();
    } catch (error) {
      handleError(error);
    }
  };
}
```

## Environment Variables

Add these to your `.env.local` or deployment platform:

```bash
# Enable analytics in development (optional)
NEXT_PUBLIC_ENABLE_ANALYTICS=false

# Enable performance monitoring in development (optional)
NEXT_PUBLIC_ENABLE_PERFORMANCE=false

# Firebase configuration (required)
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
# ... other Firebase config
```

## Production Setup

### 1. Firebase Analytics

Analytics is automatically enabled in production. No additional setup required if Firebase is configured.

### 2. Firebase Performance Monitoring

Performance monitoring is automatically enabled in production. No additional setup required.

### 3. Error Tracking (Optional)

To add Sentry for enhanced error tracking:

```bash
npm install @sentry/nextjs
npx @sentry/wizard@latest -i nextjs
```

Then update `src/lib/logger.ts` to send errors to Sentry:

```typescript
import * as Sentry from '@sentry/nextjs';

private sendToErrorTracking(message: string, error?: Error, context?: LogContext) {
  Sentry.captureException(error || new Error(message), {
    tags: context,
    extra: { message },
  });
}
```

### 4. Cloud Functions Logging

Cloud Functions automatically log to Google Cloud Logging. Use structured logging:

```typescript
import * as functions from 'firebase-functions';

export const myFunction = functions.firestore
  .document('collection/{docId}')
  .onCreate((snap, context) => {
    functions.logger.info('Document created', {
      docId: context.params.docId,
      data: snap.data(),
    });
  });
```

## Monitoring Dashboard

### Firebase Console

Access monitoring data in Firebase Console:

1. **Analytics**: User engagement, events, user properties
2. **Performance**: Page load times, network requests, custom traces
3. **Crashlytics**: Error reports, crash-free users (if enabled)
4. **Functions**: Execution logs, errors, performance

### Custom Dashboard

Create a custom monitoring dashboard:

```typescript
// scripts/monitoring-dashboard.ts
import * as admin from 'firebase-admin';

admin.initializeApp();

async function getMetrics() {
  const db = admin.firestore();
  
  // Get counts
  const suggestions = await db.collection('suggestions').count().get();
  const users = await db.collection('users').count().get();
  
  console.log({
    suggestions: suggestions.data().count,
    users: users.data().count,
  });
}
```

## Best Practices

1. **Log Meaningful Information**
   - Include context (user ID, suggestion ID, etc.)
   - Use structured logging
   - Don't log sensitive information

2. **Use Appropriate Log Levels**
   - DEBUG: Development only
   - INFO: Normal operations
   - WARN: Potential issues
   - ERROR: Failures

3. **Track Key Events**
   - User actions (submit, upvote, comment)
   - Admin actions (review, status change)
   - Errors and failures

4. **Monitor Performance**
   - Track slow operations
   - Set performance budgets
   - Monitor Web Vitals

5. **Handle Errors Gracefully**
   - Use Error Boundary for React errors
   - Log all errors with context
   - Provide user-friendly error messages

## Troubleshooting

### Logs Not Appearing

- Check that monitoring is initialized in root layout
- Verify environment variables are set
- Check browser console for errors

### Analytics Not Tracking

- Ensure Firebase Analytics is enabled in Firebase Console
- Check that `NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID` is set
- Verify app is deployed (analytics may not work on localhost)

### Performance Data Missing

- Wait 24 hours for data to appear in Firebase Console
- Ensure app is deployed to production
- Check that Performance Monitoring is enabled

## Resources

- [Monitoring Setup Guide](./MONITORING_SETUP.md)
- [Firebase Analytics Docs](https://firebase.google.com/docs/analytics)
- [Firebase Performance Docs](https://firebase.google.com/docs/perf-mon)
- [Web Vitals](https://web.dev/vitals/)
