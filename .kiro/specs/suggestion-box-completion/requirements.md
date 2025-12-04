# Requirements Document

## Introduction

This document specifies the requirements for completing the SEES UNILAG Innovation Hub suggestion box system. The system enables students to submit suggestions, upvote and comment on suggestions from peers, and provides administrators with tools to manage and triage suggestions. The system is built on Firebase with Next.js frontend and includes authentication, real-time updates, and automated notifications.

## Glossary

- **System**: The SEES UNILAG Innovation Hub web application
- **User**: Any authenticated person using the system (students, admins, super admins)
- **Student**: A user with STUDENT role who can submit, view, upvote, and comment on suggestions
- **Admin**: A user with ADMIN role who can review, score, and change suggestion statuses
- **Super Admin**: A user with SUPER_ADMIN role who has all admin privileges plus user management
- **Suggestion**: A proposal submitted by a user for improvement or innovation
- **Upvote**: A positive vote cast by a user on a suggestion
- **Comment**: A text response posted by a user on a suggestion
- **Status**: The current state of a suggestion (SUBMITTED, UNDER_REVIEW, SHORTLISTED, ARCHIVED_REJECTED, IMPLEMENTED)
- **Category**: The classification of a suggestion (ACADEMIC_CURRICULUM, INFRASTRUCTURE_IT, TECHNICAL_DESIGN, ENVIRONMENTAL_SUSTAINABILITY, ADMINISTRATIVE_SEES, OTHER)
- **Anonymous Submission**: A suggestion submitted without revealing the author's identity

## Requirements

### Requirement 1

**User Story:** As a student, I want to submit suggestions with detailed information, so that I can propose improvements to the department.

#### Acceptance Criteria

1. WHEN a student submits a suggestion THEN the System SHALL create a new suggestion document with a unique UUID, title, body, category, author UID, SUBMITTED status, zero upvotes, and submission timestamp
2. WHEN a student chooses anonymous submission THEN the System SHALL store the author UID as "ANONYMOUS" while maintaining the ability to track the submission internally
3. WHEN a student submits a suggestion with empty title or body THEN the System SHALL reject the submission and display a validation error message
4. WHEN a suggestion is created THEN the System SHALL persist the suggestion to Firestore immediately
5. WHEN a suggestion is successfully submitted THEN the System SHALL clear the submission form and display a success notification

### Requirement 2

**User Story:** As a student, I want to view all submitted suggestions in a feed, so that I can see what others have proposed.

#### Acceptance Criteria

1. WHEN a user visits the main page THEN the System SHALL display all suggestions sorted by submission timestamp in descending order
2. WHEN displaying suggestions THEN the System SHALL show title, body excerpt, category, author name (or "Anonymous"), submission date, and upvote count
3. WHEN a suggestion has status SHORTLISTED or IMPLEMENTED THEN the System SHALL display the upvote count
4. WHEN a suggestion has status other than SHORTLISTED or IMPLEMENTED THEN the System SHALL hide the upvote count from display
5. WHEN a user applies filters THEN the System SHALL update the displayed suggestions to match the selected category and status filters

### Requirement 3

**User Story:** As a student, I want to upvote suggestions I support, so that popular ideas gain visibility.

#### Acceptance Criteria

1. WHEN a student clicks the upvote button on a suggestion THEN the System SHALL increment the suggestion's upvote count by one
2. WHEN a student upvotes a suggestion THEN the System SHALL create a vote record linking the student UID to the suggestion ID with a timestamp
3. WHEN a student attempts to upvote a suggestion they have already upvoted THEN the System SHALL prevent the duplicate vote and display a notification
4. WHEN a vote is recorded THEN the System SHALL update the upvote count in real-time using Cloud Functions
5. WHEN a student upvotes a suggestion THEN the System SHALL visually indicate the upvoted state in the UI

### Requirement 4

**User Story:** As a student, I want to comment on suggestions, so that I can provide feedback and engage in discussion.

#### Acceptance Criteria

1. WHEN a student submits a comment on a suggestion THEN the System SHALL create a comment document with comment ID, suggestion ID, author UID, body text, and timestamp
2. WHEN a comment is created THEN the System SHALL include the author's display name and photo URL for display purposes
3. WHEN displaying comments THEN the System SHALL show the author name, photo, comment text, and relative timestamp
4. WHEN a student submits an empty comment THEN the System SHALL reject the submission and display a validation error
5. WHEN a comment is successfully posted THEN the System SHALL clear the comment input field and display the new comment immediately

### Requirement 5

**User Story:** As an admin, I want to access a dashboard showing all suggestions with filtering and sorting capabilities, so that I can efficiently review and manage submissions.

#### Acceptance Criteria

1. WHEN an admin accesses the admin dashboard THEN the System SHALL verify the user has ADMIN or SUPER_ADMIN role before displaying the dashboard
2. WHEN displaying the admin dashboard THEN the System SHALL show a table with all suggestions including title, author, category, status, upvotes, and submission date
3. WHEN an admin applies filters THEN the System SHALL update the table to show only suggestions matching the selected status and category filters
4. WHEN an admin clicks on a suggestion row THEN the System SHALL open a detailed view with all suggestion information and editing capabilities
5. WHEN the admin dashboard loads THEN the System SHALL display summary statistics including total suggestions, suggestions by status, and recent activity

### Requirement 6

**User Story:** As an admin, I want to evaluate suggestions by assigning scores and changing their status, so that I can triage and prioritize submissions.

#### Acceptance Criteria

1. WHEN an admin edits a suggestion THEN the System SHALL allow updating impact score, feasibility rating, cost-effectiveness rating, status, and public feedback fields
2. WHEN an admin assigns scores THEN the System SHALL validate that impact score, feasibility rating, and cost-effectiveness rating are integers between 1 and 5
3. WHEN an admin changes a suggestion status to SHORTLISTED or IMPLEMENTED THEN the System SHALL trigger email notifications to the author and all voters
4. WHEN an admin saves changes to a suggestion THEN the System SHALL update the reviewer UID field with the admin's UID and persist all changes to Firestore
5. WHEN an admin changes suggestion status THEN the System SHALL update the status field and reflect the change immediately in both admin and public views

### Requirement 7

**User Story:** As a suggestion author, I want to receive email notifications when my suggestion status changes, so that I stay informed about the progress of my ideas.

#### Acceptance Criteria

1. WHEN a suggestion status changes to SHORTLISTED THEN the System SHALL send an email notification to the author containing the suggestion title and new status
2. WHEN a suggestion status changes to IMPLEMENTED THEN the System SHALL send an email notification to the author containing the suggestion title and new status
3. WHEN sending notification emails THEN the System SHALL include a brief description of the status change and invite the recipient to provide public feedback
4. WHEN a suggestion is anonymous THEN the System SHALL skip sending email notifications to the author
5. WHEN a status change triggers notifications THEN the System SHALL send emails to all users who have upvoted the suggestion

### Requirement 8

**User Story:** As a user, I want to authenticate using email/password or Google sign-in, so that I can securely access the system.

#### Acceptance Criteria

1. WHEN a user signs up with email and password THEN the System SHALL create a Firebase Authentication account and a user profile document with STUDENT role
2. WHEN a user signs in with Google THEN the System SHALL authenticate via Firebase Google provider and create or update the user profile document
3. WHEN a user signs in successfully THEN the System SHALL redirect the user to the main page and display their profile information in the header
4. WHEN a user signs out THEN the System SHALL clear the authentication session and redirect to the login page
5. WHEN an unauthenticated user attempts to access protected features THEN the System SHALL redirect to the login page

### Requirement 9

**User Story:** As a super admin, I want to manage user roles, so that I can grant or revoke admin privileges.

#### Acceptance Criteria

1. WHEN a super admin accesses the user management interface THEN the System SHALL display a list of all users with their current roles
2. WHEN a super admin changes a user's role to ADMIN THEN the System SHALL create a document in the roles_admin collection with the user's UID
3. WHEN a super admin changes a user's role from ADMIN to STUDENT THEN the System SHALL remove the document from the roles_admin collection
4. WHEN a super admin updates a user role THEN the System SHALL update the role field in the user's profile document
5. WHEN role changes are saved THEN the System SHALL apply the new permissions immediately without requiring the user to sign out and back in

### Requirement 10

**User Story:** As a developer, I want comprehensive Firestore security rules, so that data access is properly restricted based on user roles and ownership.

#### Acceptance Criteria

1. WHEN any user attempts to read suggestions THEN the System SHALL allow the read operation
2. WHEN a user attempts to create a suggestion THEN the System SHALL verify the author UID matches the authenticated user's UID
3. WHEN a user attempts to update a suggestion THEN the System SHALL allow the update only if the user is the author or has admin privileges
4. WHEN a user attempts to delete a suggestion THEN the System SHALL allow the deletion only if the user is the author or has admin privileges
5. WHEN a user attempts to access another user's profile THEN the System SHALL deny the read operation unless the user is accessing their own profile

### Requirement 11

**User Story:** As a user, I want the interface to be responsive and visually appealing, so that I have a pleasant experience on any device.

#### Acceptance Criteria

1. WHEN the application loads THEN the System SHALL apply the design system with deep blue primary color, light gray background, and orange accent color
2. WHEN displaying content on mobile devices THEN the System SHALL adapt the layout to fit smaller screens with appropriate touch targets
3. WHEN displaying content on desktop devices THEN the System SHALL utilize the available space with multi-column layouts where appropriate
4. WHEN user interactions occur THEN the System SHALL provide visual feedback through subtle animations on upvotes, status changes, and data loading
5. WHEN displaying text content THEN the System SHALL use PT Sans font family for body text and headlines

### Requirement 12

**User Story:** As a user, I want real-time updates when suggestions are modified, so that I always see the most current information.

#### Acceptance Criteria

1. WHEN a suggestion's upvote count changes THEN the System SHALL update the displayed count in real-time for all users viewing that suggestion
2. WHEN a new comment is added to a suggestion THEN the System SHALL display the new comment immediately for all users viewing that suggestion
3. WHEN a suggestion's status changes THEN the System SHALL update the displayed status in real-time for all users viewing the suggestion list
4. WHEN using Firestore listeners THEN the System SHALL properly clean up subscriptions when components unmount to prevent memory leaks
5. WHEN real-time updates occur THEN the System SHALL apply smooth transitions to avoid jarring visual changes
