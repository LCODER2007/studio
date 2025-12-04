# Firestore Security Rules Documentation

This document explains the security rules implemented for the SEES UNILAG Innovation Hub suggestion box system.

## Overview

The security rules enforce role-based access control (RBAC) with three roles:
- **STUDENT**: Can submit, view, upvote, and comment on suggestions
- **ADMIN**: Has all student privileges plus can review, score, and change suggestion statuses
- **SUPER_ADMIN**: Has all admin privileges plus can manage user roles

## Helper Functions

### `isSignedIn()`
Checks if the user is authenticated.

```javascript
function isSignedIn() {
  return request.auth != null;
}
```

### `isAdmin()`
Checks if the user has admin privileges by verifying the existence of a document in the `roles_admin` collection.

```javascript
function isAdmin() {
  return exists(/databases/$(database)/documents/roles_admin/$(request.auth.uid));
}
```

### `isOwner(uid)`
Checks if the authenticated user's UID matches the provided UID.

```javascript
function isOwner(uid) {
  return request.auth.uid == uid;
}
```

## Collection Rules

### Users Collection (`/users/{userId}`)

**Read Access:**
- Users can only read their own profile
- Validates: Requirement 10.5

**Create Access:**
- Users can only create their own profile
- The document ID must match the authenticated user's UID

**Update Access:**
- Users can update their own profile
- Admins can update any user profile

**Rules:**
```javascript
match /users/{userId} {
  allow read: if isSignedIn() && isOwner(userId);
  allow create: if isSignedIn() && isOwner(userId);
  allow update: if isSignedIn() && (isOwner(userId) || isAdmin());
}
```

### Suggestions Collection (`/suggestions/{suggestionId}`)

**Read Access:**
- Public read access (anyone can view suggestions)
- Validates: Requirement 10.1

**Create Access:**
- Authenticated users can create suggestions
- The `authorUid` field must match the authenticated user's UID
- Validates: Requirement 10.2

**Update Access:**
- Authors can update their own suggestions
- Admins can update any suggestion
- Validates: Requirement 10.3

**Delete Access:**
- Authors can delete their own suggestions
- Admins can delete any suggestion
- Validates: Requirement 10.4

**Rules:**
```javascript
match /suggestions/{suggestionId} {
  allow read: if true; // Public read
  allow create: if isSignedIn() && 
    request.resource.data.authorUid == request.auth.uid;
  allow update: if isSignedIn() && 
    (isOwner(resource.data.authorUid) || isAdmin());
  allow delete: if isSignedIn() && 
    (isOwner(resource.data.authorUid) || isAdmin());
}
```

### Comments Subcollection (`/suggestions/{suggestionId}/comments/{commentId}`)

**Read Access:**
- Public read access (anyone can view comments)

**Create Access:**
- Authenticated users can create comments
- The `authorUid` field must match the authenticated user's UID

**Delete Access:**
- Comment authors can delete their own comments
- Admins can delete any comment

**Update Access:**
- Not allowed (comments are immutable after creation)

**Rules:**
```javascript
match /comments/{commentId} {
  allow read: if true; // Public read
  allow create: if isSignedIn() && 
    request.resource.data.authorUid == request.auth.uid;
  allow delete: if isSignedIn() && 
    (isOwner(resource.data.authorUid) || isAdmin());
}
```

### Votes Collection (`/votes/{voteId}`)

**Read Access:**
- Authenticated users can read votes
- Unauthenticated users cannot read votes

**Create Access:**
- Authenticated users can create votes
- The `voterUid` field must match the authenticated user's UID
- The `voteId` must follow the composite key format: `{userId}_{suggestionId}`
- This prevents duplicate votes and ensures vote integrity

**Delete Access:**
- Users can delete their own votes (to implement "unvote" functionality)

**Update Access:**
- Not allowed (votes are immutable after creation)

**Rules:**
```javascript
match /votes/{voteId} {
  allow read: if isSignedIn();
  allow create: if isSignedIn() && 
    request.resource.data.voterUid == request.auth.uid &&
    request.resource.data.voteId == request.auth.uid + '_' + request.resource.data.suggestionId;
  allow delete: if isSignedIn() && 
    isOwner(resource.data.voterUid);
}
```

### Admin Roles Collection (`/roles_admin/{uid}`)

**Read Access:**
- Public read access (needed for the `isAdmin()` helper function)

**Write Access:**
- Not allowed through client SDK
- Must be managed manually or through a super admin Cloud Function

**Rules:**
```javascript
match /roles_admin/{uid} {
  allow read: if true; // Needed for isAdmin() function
  allow write: if false; // Managed manually or by super admin function
}
```

## Security Considerations

### Vote Integrity
The composite key format (`userId_suggestionId`) for votes ensures:
1. Each user can only vote once per suggestion
2. Vote documents are uniquely identifiable
3. Prevents race conditions when creating votes

### Anonymous Submissions
- Anonymous suggestions use `"ANONYMOUS"` as the `authorUid`
- The `isOwner()` check will fail for anonymous suggestions
- Only admins can update/delete anonymous suggestions

### Admin Role Management
- Admin roles are stored in a separate `roles_admin` collection
- This allows efficient role checking without reading user documents
- Write access is disabled to prevent privilege escalation
- Role changes must be performed through secure server-side functions

### Data Validation
The rules enforce:
- Users cannot impersonate others (authorUid must match authenticated UID)
- Vote keys must follow the correct format
- Only owners or admins can modify/delete content

## Testing

Security rules are tested using the Firebase Rules Unit Testing library. See `tests/firestore.rules.test.ts` for comprehensive test coverage.

To run the tests:
1. Start the Firebase emulator: `npm run emulators:start`
2. Run the tests: `npm run test:rules`

## Deployment

To deploy the security rules to Firebase:

```bash
firebase deploy --only firestore:rules
```

To validate rules before deployment:

```bash
npm run validate:rules
```

## Common Issues

### Issue: Users can't read their own profile
**Solution:** Ensure the user document ID matches the authenticated user's UID.

### Issue: Admin operations failing
**Solution:** Verify that a document exists in `roles_admin/{adminUid}` for the admin user.

### Issue: Votes not being created
**Solution:** Check that the vote ID follows the format `{userId}_{suggestionId}` and the `voterUid` matches the authenticated user.

### Issue: Anonymous suggestions can't be updated
**Solution:** This is expected behavior. Only admins can update anonymous suggestions since the `authorUid` is `"ANONYMOUS"`.
