# Design Document

## Overview

The SEES UNILAG Innovation Hub is a full-stack web application built with Next.js 15, React 18, Firebase (Firestore, Authentication, Cloud Functions), and TypeScript. The system follows a three-tier architecture with a React frontend, Firebase backend services, and Firestore as the database. The application implements role-based access control (RBAC) with three roles: STUDENT, ADMIN, and SUPER_ADMIN.

The design leverages Firebase's real-time capabilities for live updates, Cloud Functions for server-side logic (vote counting, notifications), and Firestore security rules for data protection. The frontend uses shadcn/ui components with Tailwind CSS for styling, following the specified design system (deep blue primary, light gray background, orange accents, PT Sans font).

## Architecture

### System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Client Layer (Next.js)                   │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Public     │  │    Admin     │  │     Auth     │      │
│  │   Pages      │  │   Dashboard  │  │    Pages     │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│         │                  │                  │              │
│  ┌──────────────────────────────────────────────────┐      │
│  │         React Components & Hooks                  │      │
│  └──────────────────────────────────────────────────┘      │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                   Firebase Services                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │  Firestore   │  │     Auth     │  │   Functions  │      │
│  │   Database   │  │   Service    │  │   (Node.js)  │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
```

### Data Flow

1. **Authentication Flow**: User authenticates → Firebase Auth validates → User profile fetched from Firestore → Role-based UI rendered
2. **Suggestion Submission Flow**: User submits form → Client validates → Firestore creates document → Real-time listener updates UI
3. **Upvote Flow**: User clicks upvote → Client checks existing vote → Creates vote document → Cloud Function triggers → Updates upvote count → Real-time update to all clients
4. **Admin Status Change Flow**: Admin updates status → Firestore updates → Cloud Function triggers → Sends email notifications → Real-time update to all clients

## Components and Interfaces

### Frontend Components

#### Core Pages
- **`/` (Home)**: Public suggestion feed with filters and sorting
- **`/login`**: Authentication page with email/password and Google sign-in
- **`/signup`**: User registration page
- **`/admin`**: Admin dashboard (protected route)
- **`/profile`**: User profile management

#### Key React Components

**SuggestionList** (`src/components/suggestions/SuggestionList.tsx`)
- Displays paginated list of suggestions
- Implements real-time Firestore listeners
- Handles filtering by category and status
- Manages sorting by date and upvotes

**SuggestionCard** (`src/components/suggestions/SuggestionCard.tsx`)
- Renders individual suggestion preview
- Shows/hides upvote count based on status
- Handles upvote button interaction
- Displays category icon and metadata

**SubmitSuggestionDialog** (`src/components/suggestions/SubmitSuggestionDialog.tsx`)
- Modal form for creating suggestions
- Validates title, body, and category
- Supports anonymous submission toggle
- Generates UUID for new suggestions

**CommentSection** (`src/components/suggestions/CommentSection.tsx`)
- Displays comments with real-time updates
- Handles comment submission
- Shows author info and timestamps
- Implements delete functionality for comment authors

**AdminDashboard** (`src/components/admin/AdminDashboard.tsx`)
- Protected component with role guard
- Displays statistics and metrics
- Shows suggestion table with filters
- Provides access to edit functionality

**EditSuggestionSheet** (`src/components/admin/EditSuggestionSheet.tsx`)
- Side panel for editing suggestion details
- Form inputs for scores (1-5 validation)
- Status dropdown with workflow transitions
- Public feedback textarea

**RoleGuard** (`src/components/RoleGuard.tsx`)
- Higher-order component for route protection
- Checks user role against required roles
- Redirects unauthorized users
- Shows loading state during auth check

### Backend Services

#### Cloud Functions

**onVoteCreated** (Firestore Trigger)
```typescript
// Triggers when: /votes/{voteId} document is created
// Action: Increments suggestion.upvotesCount by 1
// Uses: Firestore transaction for atomic update
```

**onSuggestionStatusChange** (Firestore Trigger)
```typescript
// Triggers when: /suggestions/{id} status field changes
// Condition: New status is SHORTLISTED or IMPLEMENTED
// Action: 
//   1. Fetch author email (if not anonymous)
//   2. Fetch all voter emails from votes collection
//   3. Send notification emails via SendGrid/Firebase Email
```

#### Firebase Configuration

**Authentication Providers**
- Email/Password
- Google OAuth
- Anonymous (for suggestion submission only)

**Firestore Collections**
- `/users/{uid}`: User profiles with role information
- `/suggestions/{suggestionId}`: Suggestion documents
- `/votes/{voteId}`: Vote records (composite key: `${userId}_${suggestionId}`)
- `/comments/{commentId}`: Comment documents
- `/roles_admin/{uid}`: Admin role markers for efficient security rules

## Data Models

### TypeScript Interfaces

```typescript
interface User {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  role: 'STUDENT' | 'ADMIN' | 'SUPER_ADMIN';
  createdAt: Timestamp;
}

interface Suggestion {
  suggestionId: string; // UUID v4
  title: string;
  body: string;
  authorUid: string; // User UID or "ANONYMOUS"
  category: Category;
  status: Status;
  upvotesCount: number;
  impactScore?: number; // 1-5, admin only
  feasibilityRating?: number; // 1-5, admin only
  costEffectivenessRating?: number; // 1-5, admin only
  reviewerUid?: string;
  submissionTimestamp: Timestamp;
  publicFeedback?: string;
}

type Category = 
  | 'ACADEMIC_CURRICULUM'
  | 'INFRASTRUCTURE_IT'
  | 'TECHNICAL_DESIGN'
  | 'ENVIRONMENTAL_SUSTAINABILITY'
  | 'ADMINISTRATIVE_SEES'
  | 'OTHER';

type Status = 
  | 'SUBMITTED'
  | 'UNDER_REVIEW'
  | 'SHORTLISTED'
  | 'ARCHIVED_REJECTED'
  | 'IMPLEMENTED';

interface Vote {
  voteId: string; // Format: `${voterUid}_${suggestionId}`
  suggestionId: string;
  voterUid: string;
  timestamp: Timestamp;
}

interface Comment {
  commentId: string; // Auto-generated by Firestore
  suggestionId: string;
  authorUid: string;
  authorDisplayName: string;
  authorPhotoURL: string;
  text: string;
  createdAt: Timestamp;
}
```

### Firestore Security Rules

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    function isSignedIn() {
      return request.auth != null;
    }
    
    function isAdmin() {
      return exists(/databases/$(database)/documents/roles_admin/$(request.auth.uid));
    }
    
    function isOwner(uid) {
      return request.auth.uid == uid;
    }
    
    // Users collection
    match /users/{userId} {
      allow read: if isSignedIn() && isOwner(userId);
      allow create: if isSignedIn() && isOwner(userId);
      allow update: if isSignedIn() && (isOwner(userId) || isAdmin());
    }
    
    // Suggestions collection
    match /suggestions/{suggestionId} {
      allow read: if true; // Public read
      allow create: if isSignedIn() && 
        request.resource.data.authorUid == request.auth.uid;
      allow update: if isSignedIn() && 
        (isOwner(resource.data.authorUid) || isAdmin());
      allow delete: if isSignedIn() && 
        (isOwner(resource.data.authorUid) || isAdmin());
    }
    
    // Votes collection
    match /votes/{voteId} {
      allow read: if isSignedIn();
      allow create: if isSignedIn() && 
        request.resource.data.voterUid == request.auth.uid &&
        request.resource.data.voteId == request.auth.uid + '_' + request.resource.data.suggestionId;
      allow delete: if isSignedIn() && 
        isOwner(resource.data.voterUid);
    }
    
    // Comments subcollection
    match /suggestions/{suggestionId}/comments/{commentId} {
      allow read: if true; // Public read
      allow create: if isSignedIn() && 
        request.resource.data.authorUid == request.auth.uid;
      allow delete: if isSignedIn() && 
        (isOwner(resource.data.authorUid) || isAdmin());
    }
    
    // Admin roles collection
    match /roles_admin/{uid} {
      allow read: if true; // Needed for isAdmin() function
      allow write: if false; // Managed manually or by super admin function
    }
  }
}
```


## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Suggestion creation completeness
*For any* valid suggestion submission (non-empty title and body), creating the suggestion should result in a document with all required fields: unique UUID, title, body, category, author UID, SUBMITTED status, zero upvotes, and submission timestamp.
**Validates: Requirements 1.1**

### Property 2: Empty input rejection
*For any* string composed entirely of whitespace characters, attempting to submit it as a suggestion title or body should be rejected with a validation error.
**Validates: Requirements 1.3**

### Property 3: Suggestion persistence
*For any* created suggestion, immediately querying Firestore for that suggestion ID should return the same suggestion data.
**Validates: Requirements 1.4**

### Property 4: Form reset after submission
*For any* successful suggestion submission, the form state should be cleared (empty title, body, and reset category).
**Validates: Requirements 1.5**

### Property 5: Timestamp ordering
*For any* set of suggestions with different submission timestamps, displaying them should result in descending chronological order (newest first).
**Validates: Requirements 2.1**

### Property 6: Suggestion display completeness
*For any* suggestion rendered in the list, the output should contain the title, body excerpt, category, author name (or "Anonymous"), submission date, and conditionally the upvote count.
**Validates: Requirements 2.2**

### Property 7: Upvote count visibility for shortlisted
*For any* suggestion with status SHORTLISTED or IMPLEMENTED, the rendered output should include the upvote count.
**Validates: Requirements 2.3**

### Property 8: Upvote count hidden for non-shortlisted
*For any* suggestion with status other than SHORTLISTED or IMPLEMENTED, the rendered output should not display the upvote count.
**Validates: Requirements 2.4**

### Property 9: Filter correctness
*For any* selected category and status filter combination, all displayed suggestions should match both the category and status criteria.
**Validates: Requirements 2.5**

### Property 10: Upvote increments count
*For any* suggestion, when a user who has not previously voted upvotes it, the upvote count should increase by exactly one.
**Validates: Requirements 3.1**

### Property 11: Vote record creation
*For any* upvote action, a vote document should be created with the correct voter UID, suggestion ID, and timestamp.
**Validates: Requirements 3.2**

### Property 12: Upvote idempotence
*For any* suggestion and user, attempting to upvote multiple times should result in only one vote being recorded and the count increasing by one total.
**Validates: Requirements 3.3**

### Property 13: Vote triggers count update
*For any* vote creation, the corresponding suggestion's upvote count should be updated within a reasonable time window (eventual consistency).
**Validates: Requirements 3.4**

### Property 14: Upvote UI state
*For any* suggestion that a user has upvoted, the UI should visually indicate the upvoted state (e.g., filled icon, different color).
**Validates: Requirements 3.5**

### Property 15: Comment creation completeness
*For any* valid comment submission, the created comment document should contain comment ID, suggestion ID, author UID, body text, and timestamp.
**Validates: Requirements 4.1**

### Property 16: Comment author denormalization
*For any* created comment, the document should include the author's display name and photo URL from their user profile.
**Validates: Requirements 4.2**

### Property 17: Comment display completeness
*For any* rendered comment, the output should contain author name, photo, comment text, and relative timestamp.
**Validates: Requirements 4.3**

### Property 18: Empty comment rejection
*For any* string composed entirely of whitespace characters, attempting to submit it as a comment should be rejected with a validation error.
**Validates: Requirements 4.4**

### Property 19: Comment form reset
*For any* successful comment submission, the comment input field should be cleared.
**Validates: Requirements 4.5**

### Property 20: Admin dashboard authorization
*For any* user attempting to access the admin dashboard, access should be granted only if the user has ADMIN or SUPER_ADMIN role.
**Validates: Requirements 5.1**

### Property 21: Admin table completeness
*For any* suggestion displayed in the admin table, the row should contain title, author, category, status, upvotes, and submission date.
**Validates: Requirements 5.2**

### Property 22: Admin filter correctness
*For any* selected status and category filter in the admin dashboard, all displayed suggestions should match both criteria.
**Validates: Requirements 5.3**

### Property 23: Admin statistics accuracy
*For any* state of the suggestions collection, the displayed statistics should accurately reflect the total count and breakdown by status.
**Validates: Requirements 5.5**

### Property 24: Admin field update permissions
*For any* admin user, editing a suggestion should allow modification of impact score, feasibility rating, cost-effectiveness rating, status, and public feedback fields.
**Validates: Requirements 6.1**

### Property 25: Score validation
*For any* admin score input (impact, feasibility, cost-effectiveness), values outside the range 1-5 should be rejected with a validation error.
**Validates: Requirements 6.2**

### Property 26: Status change triggers notifications
*For any* suggestion status change to SHORTLISTED or IMPLEMENTED, email notifications should be sent to the author (if not anonymous) and all voters.
**Validates: Requirements 6.3**

### Property 27: Reviewer tracking
*For any* admin edit to a suggestion, the reviewer UID field should be updated to the admin's UID.
**Validates: Requirements 6.4**

### Property 28: Real-time status updates
*For any* suggestion status change, the new status should be reflected in both admin and public views within a reasonable time window.
**Validates: Requirements 6.5**

### Property 29: Notification email content
*For any* status change notification email, the content should include the suggestion title, new status, description of the change, and invitation for feedback.
**Validates: Requirements 7.3**

### Property 30: Anonymous notification skip
*For any* suggestion with author UID "ANONYMOUS", status change notifications should not be sent to the author.
**Validates: Requirements 7.4**

### Property 31: Voter notification completeness
*For any* suggestion status change to SHORTLISTED or IMPLEMENTED, all users who have voted on that suggestion should receive email notifications.
**Validates: Requirements 7.5**

### Property 32: User creation with default role
*For any* new user signup with email/password, a user profile document should be created with role set to STUDENT.
**Validates: Requirements 8.1**

### Property 33: OAuth profile management
*For any* Google sign-in, a user profile document should be created if it doesn't exist, or updated if it does.
**Validates: Requirements 8.2**

### Property 34: Protected route authorization
*For any* unauthenticated user attempting to access protected features, the system should redirect to the login page.
**Validates: Requirements 8.5**

### Property 35: Super admin user list access
*For any* super admin accessing user management, all users with their current roles should be displayed.
**Validates: Requirements 9.1**

### Property 36: Admin role elevation
*For any* user role change from STUDENT to ADMIN, a document should be created in the roles_admin collection with the user's UID as the document ID.
**Validates: Requirements 9.2**

### Property 37: Admin role demotion
*For any* user role change from ADMIN to STUDENT, the document in the roles_admin collection with the user's UID should be deleted.
**Validates: Requirements 9.3**

### Property 38: Role field persistence
*For any* role change, the user's profile document role field should be updated to reflect the new role.
**Validates: Requirements 9.4**

### Property 39: Immediate permission application
*For any* role change, the new permissions should be effective immediately without requiring the user to re-authenticate.
**Validates: Requirements 9.5**

### Property 40: Public suggestion read access
*For any* user (authenticated or not), reading suggestions should be allowed.
**Validates: Requirements 10.1**

### Property 41: Suggestion creation authorization
*For any* suggestion creation attempt, the operation should succeed only if the author UID in the document matches the authenticated user's UID.
**Validates: Requirements 10.2**

### Property 42: Suggestion update authorization
*For any* suggestion update attempt, the operation should succeed only if the user is the author or has admin privileges.
**Validates: Requirements 10.3**

### Property 43: Suggestion deletion authorization
*For any* suggestion deletion attempt, the operation should succeed only if the user is the author or has admin privileges.
**Validates: Requirements 10.4**

### Property 44: Profile privacy
*For any* user profile read attempt, the operation should succeed only if the requesting user is accessing their own profile.
**Validates: Requirements 10.5**

### Property 45: Real-time upvote synchronization
*For any* upvote count change on a suggestion, all clients viewing that suggestion should see the updated count within a reasonable time window.
**Validates: Requirements 12.1**

### Property 46: Real-time comment synchronization
*For any* new comment added to a suggestion, all clients viewing that suggestion should see the new comment within a reasonable time window.
**Validates: Requirements 12.2**

### Property 47: Real-time status synchronization
*For any* suggestion status change, all clients viewing the suggestion list should see the updated status within a reasonable time window.
**Validates: Requirements 12.3**

### Property 48: Listener cleanup
*For any* component using Firestore listeners, unsubscribing from all listeners when the component unmounts should prevent memory leaks.
**Validates: Requirements 12.4**

## Error Handling

### Client-Side Error Handling

**Form Validation Errors**
- Display inline validation messages for empty or invalid inputs
- Prevent form submission until all validation passes
- Use toast notifications for submission errors

**Authentication Errors**
- Display user-friendly messages for common auth errors (wrong password, email already exists, etc.)
- Provide "Forgot Password" flow for password reset
- Handle network errors with retry options

**Firestore Operation Errors**
- Catch and log Firestore errors (permission denied, network errors, etc.)
- Display user-friendly error messages
- Implement retry logic for transient failures
- Use optimistic UI updates with rollback on failure

**Real-time Listener Errors**
- Handle listener errors gracefully without crashing the app
- Attempt to reconnect on network errors
- Display offline indicator when connection is lost

### Server-Side Error Handling (Cloud Functions)

**Vote Count Update Function**
- Use Firestore transactions to prevent race conditions
- Retry on transaction conflicts
- Log errors for monitoring

**Notification Function**
- Handle email service failures gracefully
- Log failed notifications for manual retry
- Continue processing other notifications if one fails
- Validate email addresses before sending

## Testing Strategy

### Unit Testing

The system will use **Jest** and **React Testing Library** for unit testing. Unit tests will cover:

**Component Tests**
- Form validation logic (empty inputs, score ranges)
- Conditional rendering (upvote count visibility, role-based UI)
- Event handlers (button clicks, form submissions)
- Error state handling

**Utility Function Tests**
- Date formatting functions
- Category and status mapping functions
- UUID generation
- Input sanitization

**Hook Tests**
- Custom hooks for Firestore operations
- Authentication state management
- Real-time listener setup and cleanup

### Property-Based Testing

The system will use **fast-check** for property-based testing in TypeScript. Property-based tests will:

- Run a minimum of 100 iterations per property
- Use custom generators for domain types (Suggestion, User, Comment, Vote)
- Tag each test with the format: `**Feature: suggestion-box-completion, Property {number}: {property_text}**`
- Each correctness property listed above will be implemented as a single property-based test

**Generator Strategy**
- Create generators for valid suggestions (non-empty strings, valid categories, valid statuses)
- Create generators for users with different roles
- Create generators for edge cases (anonymous users, empty strings, boundary values)
- Use shrinking to find minimal failing examples

**Key Properties to Test**
- Idempotence properties (upvoting twice = upvoting once)
- Invariant properties (upvote count always >= 0, scores always 1-5)
- Round-trip properties (create then read returns same data)
- Filter properties (filtered results always match criteria)
- Authorization properties (operations succeed/fail based on role)

### Integration Testing

Integration tests will verify:
- End-to-end user flows (signup → create suggestion → upvote → comment)
- Admin workflows (review → score → change status → verify notifications)
- Real-time synchronization across multiple clients
- Cloud Function triggers and side effects

### Security Testing

Security tests will verify:
- Firestore security rules prevent unauthorized access
- Role-based access control works correctly
- Users cannot impersonate others
- Admin-only operations are properly protected

## Deployment Considerations

### Environment Configuration

**Firebase Project Setup**
- Development, staging, and production Firebase projects
- Environment-specific configuration files
- API keys and secrets management

**Next.js Configuration**
- Environment variables for Firebase config
- Build optimization for production
- Static page generation where applicable

### Performance Optimization

**Frontend Optimization**
- Code splitting for admin routes
- Lazy loading of components
- Image optimization
- Caching strategies for static content

**Backend Optimization**
- Firestore index creation for common queries
- Cloud Function cold start optimization
- Rate limiting for expensive operations
- Pagination for large result sets

### Monitoring and Logging

**Application Monitoring**
- Error tracking with Firebase Crashlytics or Sentry
- Performance monitoring with Firebase Performance
- Analytics for user behavior

**Cloud Function Monitoring**
- Function execution logs
- Error rate monitoring
- Notification delivery tracking

### Backup and Recovery

**Data Backup**
- Automated Firestore backups
- Backup retention policy
- Disaster recovery procedures

**User Data Protection**
- GDPR compliance considerations
- Data export functionality
- Account deletion handling
