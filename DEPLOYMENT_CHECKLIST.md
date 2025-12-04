# Deployment Checklist

This checklist ensures all deployment preparation tasks are complete before deploying to staging or production.

## Pre-Deployment Checklist

### 1. Environment Configuration ✅

- [x] Environment variable templates created (`.env.*.example`)
- [x] Firebase config updated to use environment variables
- [x] Multiple environment support (development, staging, production)
- [x] `.firebaserc.example` created for project management
- [ ] Copy `.env.production.example` to deployment platform
- [ ] Set all required environment variables in deployment platform
- [ ] Create staging and production Firebase projects (if not exists)

### 2. Build Optimization ✅

- [x] Next.js config optimized for production
- [x] Image optimization configured
- [x] Bundle optimization enabled (SWC minify)
- [x] Code splitting configured
- [x] Firestore indexes defined (`firestore.indexes.json`)
- [x] Pre-deployment check script created
- [ ] Run `npm run predeploy:check` and fix any issues
- [ ] Run production build locally and test

### 3. Monitoring and Logging ✅

- [x] Centralized logger implemented (`src/lib/logger.ts`)
- [x] Analytics tracking implemented (`src/lib/analytics.ts`)
- [x] Performance monitoring implemented (`src/lib/performance.ts`)
- [x] Error boundary component created
- [x] Web Vitals tracking configured
- [x] Monitoring initialization setup
- [ ] Initialize monitoring in root layout
- [ ] Test error tracking in development
- [ ] Configure error tracking service (Sentry or Firebase Crashlytics)

### 4. Firebase Configuration

- [ ] Create Firebase staging project
- [ ] Create Firebase production project
- [ ] Enable Authentication (Email/Password, Google)
- [ ] Create Firestore database
- [ ] Deploy security rules: `firebase deploy --only firestore:rules`
- [ ] Deploy indexes: `firebase deploy --only firestore:indexes`
- [ ] Configure authorized domains
- [ ] Set up Firebase Email Extension or SendGrid

### 5. Cloud Functions

- [ ] Build functions: `cd functions && npm run build`
- [ ] Test functions locally with emulators
- [ ] Deploy to staging: `npm run deploy:functions:staging`
- [ ] Test functions in staging
- [ ] Deploy to production: `npm run deploy:functions:production`

### 6. Testing

- [ ] Run type check: `npm run typecheck`
- [ ] Run linter: `npm run lint`
- [ ] Run security rules tests: `npm run test:rules`
- [ ] Test authentication flows
- [ ] Test suggestion submission
- [ ] Test upvoting and commenting
- [ ] Test admin dashboard
- [ ] Test email notifications
- [ ] Test on mobile devices
- [ ] Run Lighthouse audit (target score > 90)

### 7. Security

- [ ] Review and update Firestore security rules
- [ ] Restrict Firebase API keys in Firebase Console
- [ ] Configure CORS if using custom domain
- [ ] Enable App Check (optional but recommended)
- [ ] Review and remove any hardcoded secrets
- [ ] Ensure `.env.local` is in `.gitignore`

### 8. Performance

- [ ] Verify code splitting is working
- [ ] Check bundle size (use `ANALYZE=true npm run build`)
- [ ] Optimize images
- [ ] Test on slow 3G network
- [ ] Verify lazy loading is working
- [ ] Check Core Web Vitals

### 9. Documentation

- [x] Deployment guide created (`docs/DEPLOYMENT_GUIDE.md`)
- [x] Production optimization guide created (`docs/PRODUCTION_OPTIMIZATION.md`)
- [x] Monitoring setup guide created (`docs/MONITORING_SETUP.md`)
- [x] Monitoring README created (`docs/MONITORING_README.md`)
- [ ] Update README.md with deployment instructions
- [ ] Document any manual setup steps

### 10. Backup and Recovery

- [ ] Set up automated Firestore backups
- [ ] Document rollback procedure
- [ ] Test backup restoration (in staging)
- [ ] Set up monitoring alerts

## Deployment Steps

### Staging Deployment

1. **Prepare environment:**
   ```bash
   npm run predeploy:check
   ```

2. **Build for staging:**
   ```bash
   npm run build:staging
   ```

3. **Deploy to Firebase:**
   ```bash
   npm run deploy:staging
   ```

4. **Deploy Cloud Functions:**
   ```bash
   npm run deploy:functions:staging
   ```

5. **Verify deployment:**
   - Test all critical flows
   - Check error logs
   - Verify email notifications
   - Run smoke tests

### Production Deployment

1. **Final checks:**
   ```bash
   npm run predeploy:check
   ```

2. **Build for production:**
   ```bash
   npm run build:production
   ```

3. **Deploy to Firebase:**
   ```bash
   npm run deploy:production
   ```

4. **Deploy Cloud Functions:**
   ```bash
   npm run deploy:functions:production
   ```

5. **Post-deployment verification:**
   - Test authentication
   - Submit test suggestion
   - Test upvoting
   - Test commenting
   - Verify admin dashboard
   - Check monitoring dashboards
   - Monitor error rates

## Post-Deployment Monitoring

### First 24 Hours

- [ ] Monitor error rates in Firebase Console
- [ ] Check Cloud Function execution logs
- [ ] Verify email delivery rates
- [ ] Monitor page load times
- [ ] Check for security rule violations
- [ ] Review user feedback

### Ongoing

- [ ] Weekly performance reviews
- [ ] Monthly cost analysis
- [ ] Quarterly security audits
- [ ] Regular dependency updates

## Rollback Procedure

If issues occur in production:

1. **Identify the issue:**
   - Check error logs
   - Review monitoring dashboards
   - Gather user reports

2. **Decide on action:**
   - Fix forward (if quick fix available)
   - Rollback (if critical issue)

3. **Rollback steps:**
   ```bash
   # Rollback hosting
   firebase hosting:rollback --project production
   
   # Rollback functions (delete and redeploy previous version)
   firebase functions:delete FUNCTION_NAME --project production
   # Then deploy previous version
   
   # Rollback Firestore rules (deploy previous version)
   firebase deploy --only firestore:rules --project production
   ```

4. **Verify rollback:**
   - Test critical flows
   - Monitor error rates
   - Communicate with users

## Support Contacts

- **Firebase Support**: [Firebase Console](https://console.firebase.google.com/)
- **Deployment Platform**: [Your platform support]
- **Team Lead**: [Contact information]
- **On-Call Engineer**: [Contact information]

## Additional Resources

- [Deployment Guide](./docs/DEPLOYMENT_GUIDE.md)
- [Production Optimization](./docs/PRODUCTION_OPTIMIZATION.md)
- [Monitoring Setup](./docs/MONITORING_SETUP.md)
- [Monitoring README](./docs/MONITORING_README.md)
- [Firebase Documentation](https://firebase.google.com/docs)
- [Next.js Deployment](https://nextjs.org/docs/deployment)

---

**Last Updated**: December 4, 2024
**Version**: 1.0.0
