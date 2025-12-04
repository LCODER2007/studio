# Production Optimization Guide

This document outlines the optimizations applied to the SEES UNILAG Innovation Hub for production deployment.

## Build Optimizations

### Next.js Configuration

The following optimizations are configured in `next.config.ts`:

1. **Image Optimization:**
   - AVIF and WebP format support for smaller file sizes
   - Responsive image sizes for different devices
   - Remote pattern allowlist for external images
   - Google user profile images support

2. **Bundle Optimization:**
   - SWC minification enabled for faster builds and smaller bundles
   - Gzip compression enabled
   - Package import optimization for lucide-react and radix-ui
   - Code splitting for admin routes

3. **Security:**
   - `X-Powered-By` header removed
   - React strict mode enabled for better error detection

### Build Verification

Run the following commands to verify the build:

```bash
# Type checking
npm run typecheck

# Linting
npm run lint

# Production build
npm run build

# Analyze bundle size
npm run build -- --profile
```

### Bundle Analysis

To analyze the bundle size and identify optimization opportunities:

1. Install bundle analyzer:
   ```bash
   npm install --save-dev @next/bundle-analyzer
   ```

2. Update `next.config.ts` to enable analyzer:
   ```javascript
   const withBundleAnalyzer = require('@next/bundle-analyzer')({
     enabled: process.env.ANALYZE === 'true',
   })
   
   module.exports = withBundleAnalyzer(nextConfig)
   ```

3. Run analysis:
   ```bash
   ANALYZE=true npm run build
   ```

## Code Splitting

The application automatically splits code at route boundaries:

- **Public routes** (`/`, `/login`, `/signup`): Minimal bundle size
- **Admin routes** (`/admin/*`): Lazy loaded, only for admin users
- **Profile routes** (`/profile/*`): Dynamic imports

### Manual Code Splitting

For large components, use dynamic imports:

```typescript
import dynamic from 'next/dynamic';

const HeavyComponent = dynamic(() => import('./HeavyComponent'), {
  loading: () => <Skeleton />,
  ssr: false, // Disable SSR if not needed
});
```

## Image Optimization

### Best Practices

1. **Use Next.js Image component:**
   ```tsx
   import Image from 'next/image';
   
   <Image
     src="/path/to/image.jpg"
     alt="Description"
     width={800}
     height={600}
     priority={false} // Set true for above-the-fold images
   />
   ```

2. **Optimize static images:**
   - Use WebP or AVIF format
   - Compress images before uploading
   - Use appropriate dimensions (don't serve 4K images for thumbnails)

3. **Lazy load images:**
   - Images below the fold are automatically lazy loaded
   - Use `loading="lazy"` for native lazy loading

## Firestore Optimization

### Query Optimization

1. **Use composite indexes:**
   - All required indexes are defined in `firestore.indexes.json`
   - Deploy indexes: `firebase deploy --only firestore:indexes`

2. **Limit query results:**
   ```typescript
   // Use pagination
   const query = collection(db, 'suggestions')
     .orderBy('submissionTimestamp', 'desc')
     .limit(20);
   ```

3. **Use real-time listeners efficiently:**
   - Always unsubscribe when component unmounts
   - Use `onSnapshot` only when real-time updates are needed
   - Consider using `getDocs` for one-time reads

### Data Denormalization

The application uses denormalization for performance:

- **Comments:** Store author display name and photo URL
- **Suggestions:** Store upvote count (updated by Cloud Function)
- **Votes:** Use composite key for efficient lookups

### Security Rules Performance

- Use `exists()` and `get()` sparingly (they count as reads)
- Cache role checks in `roles_admin` collection
- Avoid complex nested queries in rules

## Cloud Functions Optimization

### Function Configuration

Update `functions/src/index.ts` with optimal settings:

```typescript
export const onVoteCreated = functions
  .runWith({
    memory: '256MB',
    timeoutSeconds: 60,
    maxInstances: 100,
  })
  .firestore.document('votes/{voteId}')
  .onCreate(async (snap, context) => {
    // Function implementation
  });
```

### Cold Start Optimization

1. **Minimize dependencies:**
   - Only import what you need
   - Use tree-shaking compatible libraries

2. **Use function bundling:**
   - Group related functions
   - Share common code

3. **Keep functions warm:**
   - Use Cloud Scheduler to ping functions periodically (optional)
   - Consider using min instances for critical functions

### Error Handling

- Use retries for transient failures
- Log errors for monitoring
- Use dead letter queues for failed operations

## Caching Strategy

### Client-Side Caching

1. **React Query / SWR (if added):**
   - Cache Firestore queries
   - Implement stale-while-revalidate pattern
   - Set appropriate cache times

2. **Browser Caching:**
   - Static assets are automatically cached by Next.js
   - Use service workers for offline support (optional)

### CDN Caching

When deploying to Vercel or similar platforms:

- Static pages are cached at the edge
- API routes can use cache headers
- Images are automatically optimized and cached

## Performance Monitoring

### Metrics to Track

1. **Core Web Vitals:**
   - Largest Contentful Paint (LCP): < 2.5s
   - First Input Delay (FID): < 100ms
   - Cumulative Layout Shift (CLS): < 0.1

2. **Custom Metrics:**
   - Time to Interactive (TTI)
   - First Contentful Paint (FCP)
   - Time to First Byte (TTFB)

### Tools

1. **Lighthouse:**
   ```bash
   npm install -g lighthouse
   lighthouse https://your-domain.com --view
   ```

2. **Firebase Performance Monitoring:**
   - Automatically tracks page load times
   - Custom traces for specific operations
   - Network request monitoring

3. **Real User Monitoring (RUM):**
   - Use Firebase Analytics
   - Track user interactions
   - Monitor error rates

## Database Optimization

### Firestore Best Practices

1. **Batch operations:**
   ```typescript
   const batch = writeBatch(db);
   batch.set(doc1Ref, data1);
   batch.update(doc2Ref, data2);
   await batch.commit();
   ```

2. **Use transactions for atomic updates:**
   ```typescript
   await runTransaction(db, async (transaction) => {
     const suggestionDoc = await transaction.get(suggestionRef);
     const newCount = suggestionDoc.data().upvotesCount + 1;
     transaction.update(suggestionRef, { upvotesCount: newCount });
   });
   ```

3. **Optimize document structure:**
   - Keep documents small (< 1MB)
   - Avoid deeply nested data
   - Use subcollections for large arrays

### Index Management

- Monitor index usage in Firebase Console
- Remove unused indexes
- Create indexes for all queries used in production

## Network Optimization

### API Calls

1. **Minimize requests:**
   - Batch Firestore reads when possible
   - Use real-time listeners instead of polling
   - Implement request debouncing for search

2. **Optimize payload size:**
   - Only fetch required fields
   - Use pagination for large datasets
   - Compress responses (handled by Next.js)

### Asset Loading

1. **Preload critical resources:**
   ```tsx
   <link rel="preload" href="/fonts/pt-sans.woff2" as="font" type="font/woff2" crossOrigin="anonymous" />
   ```

2. **Defer non-critical scripts:**
   ```tsx
   <script src="/analytics.js" defer />
   ```

3. **Use resource hints:**
   ```tsx
   <link rel="dns-prefetch" href="https://firestore.googleapis.com" />
   <link rel="preconnect" href="https://firestore.googleapis.com" />
   ```

## Testing Production Build

### Local Testing

1. **Build and run locally:**
   ```bash
   npm run build
   npm start
   ```

2. **Test with production Firebase:**
   - Update `.env.local` with production credentials
   - Test all critical flows
   - Verify Cloud Functions trigger correctly

### Staging Environment

1. **Deploy to staging:**
   ```bash
   npm run deploy:staging
   ```

2. **Run smoke tests:**
   - Authentication flows
   - Suggestion submission
   - Upvoting and commenting
   - Admin dashboard
   - Email notifications

3. **Performance testing:**
   - Run Lighthouse audits
   - Test on slow 3G network
   - Test on mobile devices

## Deployment Checklist

Before deploying to production:

- [ ] Run `npm run typecheck` - no errors
- [ ] Run `npm run lint` - no errors
- [ ] Run `npm run build` - successful build
- [ ] Test production build locally
- [ ] Deploy to staging and test
- [ ] Run Lighthouse audit (score > 90)
- [ ] Verify all environment variables are set
- [ ] Deploy Firestore indexes
- [ ] Deploy security rules
- [ ] Deploy Cloud Functions
- [ ] Test email notifications
- [ ] Verify analytics are working
- [ ] Set up error monitoring
- [ ] Configure backup strategy
- [ ] Document rollback procedure

## Post-Deployment Monitoring

### First 24 Hours

- Monitor error rates in Firebase Console
- Check Cloud Function execution logs
- Verify email delivery rates
- Monitor page load times
- Check for any security rule violations

### Ongoing Monitoring

- Weekly performance reviews
- Monthly cost analysis
- Quarterly security audits
- Regular dependency updates

## Cost Optimization

### Firebase Costs

1. **Firestore:**
   - Monitor read/write operations
   - Use caching to reduce reads
   - Implement pagination to limit query size

2. **Cloud Functions:**
   - Optimize function execution time
   - Use appropriate memory allocation
   - Monitor invocation count

3. **Authentication:**
   - Free tier is usually sufficient
   - Monitor active users

4. **Storage:**
   - Implement data retention policies
   - Archive old suggestions
   - Clean up unused data

### Monitoring Costs

- Set up budget alerts in Firebase Console
- Review usage reports monthly
- Optimize based on usage patterns
