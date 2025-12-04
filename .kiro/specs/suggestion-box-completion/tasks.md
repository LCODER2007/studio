# Implementation Plan

- [x] 1. Fix and enhance Firestore security rules
  - Update security rules to match the design specification
  - Fix the comments subcollection path structure
  - Add proper validation for vote creation
  - Test security rules with Firebase emulator
  - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5_

- [x] 2. Implement core suggestion submission functionality
- [x] 2.1 Enhance SubmitSuggestionDialog component
  - Add UUID generation for suggestion IDs
  - Implement anonymous submission toggle
  - Add form validation for empty/whitespace-only inputs
  - Ensure all required fields are set (status: SUBMITTED, upvotesCount: 0)
  - Add success notification and form reset after submission
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

- [ ]* 2.2 Write property test for suggestion creation
  - **Property 1: Suggestion creation completeness**
  - **Validates: Requirements 1.1**

- [ ]* 2.3 Write property test for input validation
  - **Property 2: Empty input rejection**
  - **Validates: Requirements 1.3**

- [x] 3. Implement suggestion display and filtering
- [x] 3.1 Enhance SuggestionList component
  - Implement real-time Firestore listener for suggestions
  - Add sorting by submission timestamp (descending)
  - Implement category and status filtering
  - Add proper cleanup of Firestore listeners on unmount
  - _Requirements: 2.1, 2.5, 12.1, 12.3, 12.4_

- [x] 3.2 Update SuggestionCard component
  - Implement conditional upvote count display based on status
  - Show upvote count only for SHORTLISTED and IMPLEMENTED statuses
  - Display author name or "Anonymous" for anonymous submissions
  - Add category icon and metadata display
  - _Requirements: 2.2, 2.3, 2.4_

- [ ]* 3.3 Write property test for timestamp ordering
  - **Property 5: Timestamp ordering**
  - **Validates: Requirements 2.1**

- [ ]* 3.4 Write property test for filter correctness
  - **Property 9: Filter correctness**
  - **Validates: Requirements 2.5**

- [ ]* 3.5 Write property test for upvote visibility
  - **Property 7: Upvote count visibility for shortlisted**
  - **Property 8: Upvote count hidden for non-shortlisted**
  - **Validates: Requirements 2.3, 2.4**

- [x] 4. Implement upvoting functionality
- [x] 4.1 Create upvote service functions
  - Implement function to check if user has already voted
  - Create function to add vote with composite key format (userId_suggestionId)
  - Add optimistic UI update with rollback on error
  - Implement visual indication of upvoted state
  - _Requirements: 3.1, 3.2, 3.3, 3.5_

- [x] 4.2 Implement Cloud Function for vote count updates
  - Create onVoteCreated Firestore trigger function
  - Use Firestore transaction to atomically increment upvotesCount
  - Add error handling and retry logic
  - Deploy function to Firebase
  - _Requirements: 3.4_

- [ ]* 4.3 Write property test for upvote increment
  - **Property 10: Upvote increments count**
  - **Validates: Requirements 3.1**

- [ ]* 4.4 Write property test for upvote idempotence
  - **Property 12: Upvote idempotence**
  - **Validates: Requirements 3.3**

- [x] 5. Implement commenting functionality
- [x] 5.1 Enhance CommentSection component
  - Implement real-time listener for comments subcollection
  - Add comment submission with validation
  - Denormalize author display name and photo URL into comment documents
  - Display comments with author info and relative timestamps
  - Add delete functionality for comment authors and admins
  - Clear input field after successful submission
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 12.2_

- [ ]* 5.2 Write property test for comment creation
  - **Property 15: Comment creation completeness**
  - **Property 16: Comment author denormalization**
  - **Validates: Requirements 4.1, 4.2**

- [ ]* 5.3 Write property test for empty comment rejection
  - **Property 18: Empty comment rejection**
  - **Validates: Requirements 4.4**

- [x] 6. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 7. Implement admin dashboard functionality
- [x] 7.1 Enhance AdminDashboard component
  - Add role-based access control using RoleGuard
  - Implement real-time listener for all suggestions
  - Calculate and display summary statistics (total, by status)
  - Add filtering by status and category
  - Ensure proper listener cleanup
  - _Requirements: 5.1, 5.2, 5.3, 5.5_

- [x] 7.2 Update AdminSuggestionTable component
  - Display all required columns (title, author, category, status, upvotes, date)
  - Implement row click to open edit sheet
  - Add sorting capabilities
  - _Requirements: 5.2, 5.4_

- [ ]* 7.3 Write property test for admin authorization
  - **Property 20: Admin dashboard authorization**
  - **Validates: Requirements 5.1**

- [ ]* 7.4 Write property test for admin statistics
  - **Property 23: Admin statistics accuracy**
  - **Validates: Requirements 5.5**

- [x] 8. Implement admin suggestion editing
- [x] 8.1 Enhance EditSuggestionSheet component
  - Add form fields for impact score, feasibility rating, cost-effectiveness rating
  - Implement validation for scores (1-5 range)
  - Add status dropdown with all status options
  - Add public feedback textarea
  - Update reviewer UID field on save
  - Persist changes to Firestore
  - _Requirements: 6.1, 6.2, 6.4, 6.5_

- [ ]* 8.2 Write property test for score validation
  - **Property 25: Score validation**
  - **Validates: Requirements 6.2**

- [ ]* 8.3 Write property test for reviewer tracking
  - **Property 27: Reviewer tracking**
  - **Validates: Requirements 6.4**

- [x] 9. Implement notification system
- [x] 9.1 Create Cloud Function for status change notifications
  - Create onSuggestionStatusChange Firestore trigger
  - Detect status changes to SHORTLISTED or IMPLEMENTED
  - Fetch author email (skip if anonymous)
  - Query votes collection to get all voter UIDs
  - Fetch voter emails from user profiles
  - Send notification emails with suggestion title, status, and feedback invitation
  - Use Firebase Email Extension or SendGrid
  - Add error handling and logging
  - _Requirements: 6.3, 7.1, 7.2, 7.3, 7.4, 7.5_

- [ ]* 9.2 Write property test for notification triggers
  - **Property 26: Status change triggers notifications**
  - **Property 31: Voter notification completeness**
  - **Validates: Requirements 6.3, 7.5**

- [ ]* 9.3 Write property test for anonymous notification skip
  - **Property 30: Anonymous notification skip**
  - **Validates: Requirements 7.4**

- [x] 10. Implement authentication flows
- [x] 10.1 Enhance authentication components
  - Implement email/password signup with user profile creation
  - Set default role to STUDENT for new users
  - Implement Google OAuth sign-in
  - Create or update user profile on Google sign-in
  - Add sign-out functionality
  - Implement protected route redirects for unauthenticated users
  - Display user profile info in header
  - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_

- [ ]* 10.2 Write property test for user creation
  - **Property 32: User creation with default role**
  - **Validates: Requirements 8.1**

- [ ]* 10.3 Write property test for protected routes
  - **Property 34: Protected route authorization**
  - **Validates: Requirements 8.5**

- [-] 11. Implement user role management (Super Admin)
- [x] 11.1 Create user management interface
  - Create new page/component for user management
  - Protect with RoleGuard (SUPER_ADMIN only)
  - Display list of all users with current roles
  - Add role change dropdown for each user
  - Implement role update function
  - Update user profile role field
  - Create/delete document in roles_admin collection based on role
  - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5_

- [ ]* 11.2 Write property test for role elevation
  - **Property 36: Admin role elevation**
  - **Validates: Requirements 9.2**

- [ ]* 11.3 Write property test for role demotion
  - **Property 37: Admin role demotion**
  - **Validates: Requirements 9.3**

- [x] 12. Implement real-time synchronization
- [x] 12.1 Add real-time listeners across components
  - Ensure SuggestionList uses real-time listener
  - Ensure SuggestionCard reflects real-time upvote changes
  - Ensure CommentSection uses real-time listener
  - Ensure AdminDashboard uses real-time listener
  - Add smooth transitions for real-time updates
  - _Requirements: 12.1, 12.2, 12.3_

- [x] 12.2 Implement proper listener cleanup
  - Add cleanup logic in useEffect return functions
  - Verify no memory leaks with React DevTools Profiler
  - Test component mount/unmount cycles
  - _Requirements: 12.4_

- [ ]* 12.3 Write property test for listener cleanup
  - **Property 48: Listener cleanup**
  - **Validates: Requirements 12.4**

- [x] 13. Polish UI and styling
- [x] 13.1 Apply design system consistently
  - Verify deep blue (#3F51B5) primary color usage
  - Verify light gray (#F5F5F5) background color
  - Verify orange (#FF9800) accent color for CTAs
  - Ensure PT Sans font is applied throughout
  - Add Material Design icons for categories
  - _Requirements: 11.1, 11.5_

- [x] 13.2 Implement responsive design
  - Test and fix mobile layouts (< 768px)
  - Test and fix tablet layouts (768px - 1024px)
  - Test and fix desktop layouts (> 1024px)
  - Ensure touch targets are appropriate size on mobile
  - Implement multi-column layouts for desktop
  - _Requirements: 11.2, 11.3_

- [x] 13.3 Add animations and transitions
  - Add subtle animation on upvote button click
  - Add transition for status badge changes
  - Add loading skeletons for data fetching
  - Add smooth transitions for real-time updates
  - _Requirements: 11.4, 12.5_

- [x] 14. Error handling and edge cases
- [x] 14.1 Implement comprehensive error handling
  - Add try-catch blocks for all Firestore operations
  - Display user-friendly error messages via toast notifications
  - Implement retry logic for transient failures
  - Add offline indicator for network issues
  - Handle authentication errors gracefully
  - _Requirements: All_

- [x] 14.2 Handle edge cases
  - Test with anonymous suggestions
  - Test with users who have no profile photo
  - Test with very long suggestion titles/bodies
  - Test with empty suggestion lists
  - Test with no comments on a suggestion
  - _Requirements: All_

- [x] 15. Testing and quality assurance
- [ ]* 15.1 Write unit tests for components
  - Test form validation logic
  - Test conditional rendering
  - Test event handlers
  - Test error states
  - _Requirements: All_

- [ ]* 15.2 Write integration tests
  - Test end-to-end user flows
  - Test admin workflows
  - Test real-time synchronization
  - Test Cloud Function triggers
  - _Requirements: All_

- [ ]* 15.3 Test security rules
  - Test unauthorized access attempts
  - Test role-based access control
  - Test data ownership rules
  - Use Firebase emulator for testing
  - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5_

- [x] 16. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 17. Deployment preparation
- [x] 17.1 Configure environment variables
  - Set up development, staging, and production Firebase projects
  - Configure environment-specific variables
  - Set up API keys and secrets
  - _Requirements: All_

- [x] 17.2 Optimize for production
  - Run production build and fix any build errors
  - Verify code splitting is working
  - Optimize images and assets
  - Create Firestore indexes for queries
  - Test Cloud Functions in staging environment
  - _Requirements: All_

- [x] 17.3 Set up monitoring and logging
  - Configure error tracking (Sentry or Firebase Crashlytics)
  - Set up performance monitoring
  - Configure analytics
  - Set up Cloud Function logging
  - _Requirements: All_
