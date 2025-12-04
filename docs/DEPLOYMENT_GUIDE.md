# Deployment Guide

This guide covers deploying the SEES UNILAG Innovation Hub suggestion box system across different environments.

## Environment Setup

### Development Environment

1. **Copy environment file:**
   ```bash
   cp .env.development.example .env.local
   ```

2. **Start Firebase Emulators:**
   ```bash
   npm run emulators:start
   ```

3. **Run development server:**
   ```bash
   npm run dev
   ```

### Staging Environment

1. **Create Firebase Staging Project:**
   - Go to [Firebase Console](https://console.firebase.google.com/)
   - Create a new project for staging (e.g., `sees-suggestion-box-staging`)
   - Enable Authentication (Email/Password and Google)
   - Create Firestore database
   - Deploy security rules: `firebase deploy --only firestore:rules --project staging`

2. **Configure Environment Variables:**
   - Copy values from `.env.staging.example`
   - Set in your deployment platform (Vercel, Netlify, etc.)
   - Update with actual Firebase staging project credentials

3. **Deploy Cloud Functions:**
   ```bash
   cd functions
   firebase deploy --only functions --project staging
   ```

### Production Environment

1. **Create Firebase Production Project:**
   - Go to [Firebase Console](https://console.firebase.google.com/)
   - Create a new project for production (e.g., `sees-suggestion-box-prod`)
   - Enable Authentication (Email/Password and Google)
   - Create Firestore database
   - Deploy security rules: `firebase deploy --only firestore:rules --project production`

2. **Configure Environment Variables:**
   - Copy values from `.env.production.example`
   - Set in your deployment platform
   - Update with actual Firebase production project credentials

3. **Deploy Cloud Functions:**
   ```bash
   cd functions
   firebase deploy --only functions --project production
   ```

## Firebase Project Configuration

### Required Firebase Services

1. **Authentication:**
   - Enable Email/Password provider
   - Enable Google OAuth provider
   - Configure authorized domains

2. **Firestore Database:**
   - Create database in production mode
   - Deploy security rules from `firestore.rules`
   - Create composite indexes (see Indexes section below)

3. **Cloud Functions:**
   - Deploy vote counting function
   - Deploy notification function
   - Configure environment variables for functions

### Firestore Indexes

Create the following composite indexes in Firebase Console:

1. **Suggestions by status and timestamp:**
   - Collection: `suggestions`
   - Fields: `status` (Ascending), `submissionTimestamp` (Descending)

2. **Suggestions by category and timestamp:**
   - Collection: `suggestions`
   - Fields: `category` (Ascending), `submissionTimestamp` (Descending)

3. **Votes by suggestion:**
   - Collection: `votes`
   - Fields: `suggestionId` (Ascending), `timestamp` (Descending)

4. **Comments by suggestion:**
   - Collection: `suggestions/{suggestionId}/comments`
   - Fields: `createdAt` (Descending)

Or use the Firebase CLI to deploy indexes:
```bash
firebase deploy --only firestore:indexes
```

## Email Service Configuration

### Option 1: Firebase Email Extension

1. Install the [Trigger Email](https://extensions.dev/extensions/firebase/firestore-send-email) extension
2. Configure SMTP settings or use SendGrid
3. Set the collection name in environment variables

### Option 2: SendGrid Direct Integration

1. Create SendGrid account and get API key
2. Set `SENDGRID_API_KEY` in Cloud Functions environment:
   ```bash
   firebase functions:config:set sendgrid.key="YOUR_API_KEY" --project production
   ```

## Deployment Platforms

### Vercel Deployment

1. **Connect Repository:**
   - Import project from GitHub/GitLab
   - Select Next.js framework preset

2. **Configure Environment Variables:**
   - Add all `NEXT_PUBLIC_*` variables from `.env.production.example`
   - Set in Vercel dashboard under Settings > Environment Variables

3. **Deploy:**
   - Push to main branch for automatic deployment
   - Or use Vercel CLI: `vercel --prod`

### Firebase Hosting Deployment

1. **Initialize Firebase Hosting:**
   ```bash
   firebase init hosting
   ```

2. **Build and Deploy:**
   ```bash
   npm run build
   firebase deploy --only hosting --project production
   ```

## Security Checklist

- [ ] Environment variables are set correctly for each environment
- [ ] Firebase security rules are deployed
- [ ] API keys are restricted in Firebase Console
- [ ] Authorized domains are configured in Firebase Authentication
- [ ] CORS is configured if using custom domain
- [ ] SSL/TLS certificates are valid
- [ ] Admin users are properly configured in Firestore

## Monitoring Setup

### Firebase Console

- Enable Firebase Analytics
- Set up Performance Monitoring
- Configure Crashlytics for error tracking

### Cloud Functions Monitoring

- View logs in Firebase Console > Functions
- Set up alerts for function failures
- Monitor function execution time and memory usage

## Rollback Procedure

If issues occur in production:

1. **Revert to previous deployment:**
   - Vercel: Use deployment history to rollback
   - Firebase Hosting: `firebase hosting:rollback`

2. **Revert Cloud Functions:**
   ```bash
   firebase functions:delete FUNCTION_NAME --project production
   # Then redeploy previous version
   ```

3. **Revert Firestore Rules:**
   - Keep previous rules in version control
   - Deploy previous version: `firebase deploy --only firestore:rules`

## Post-Deployment Verification

1. **Test Authentication:**
   - Sign up with email/password
   - Sign in with Google
   - Verify user profile creation

2. **Test Core Features:**
   - Submit a suggestion
   - Upvote a suggestion
   - Add a comment
   - Admin dashboard access

3. **Test Cloud Functions:**
   - Verify vote count updates
   - Test notification emails (use test account)

4. **Monitor Performance:**
   - Check page load times
   - Verify real-time updates work
   - Test on mobile devices

## Troubleshooting

### Common Issues

1. **Environment variables not loading:**
   - Ensure variables start with `NEXT_PUBLIC_` for client-side access
   - Rebuild application after changing variables
   - Clear Next.js cache: `rm -rf .next`

2. **Firebase connection errors:**
   - Verify API key and project ID are correct
   - Check authorized domains in Firebase Console
   - Ensure Firestore database is created

3. **Cloud Functions not triggering:**
   - Check function logs in Firebase Console
   - Verify function deployment was successful
   - Ensure Firestore triggers are properly configured

4. **Authentication issues:**
   - Verify OAuth redirect URIs are configured
   - Check that authentication providers are enabled
   - Ensure authorized domains include your deployment domain
