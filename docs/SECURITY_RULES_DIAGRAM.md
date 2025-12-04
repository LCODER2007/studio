# Firestore Security Rules Architecture

## Collection Structure

```
firestore
│
├── users/{userId}
│   ├── Read: Own profile only
│   ├── Create: Own profile only
│   └── Update: Own profile or Admin
│
├── suggestions/{suggestionId}
│   ├── Read: Public (anyone)
│   ├── Create: Authenticated (own UID only)
│   ├── Update: Author or Admin
│   ├── Delete: Author or Admin
│   │
│   └── comments/{commentId}  [SUBCOLLECTION]
│       ├── Read: Public (anyone)
│       ├── Create: Authenticated (own UID only)
│       └── Delete: Author or Admin
│
├── votes/{voteId}  [Format: userId_suggestionId]
│   ├── Read: Authenticated users
│   ├── Create: Authenticated (own UID + valid composite key)
│   └── Delete: Own vote only
│
└── roles_admin/{uid}
    ├── Read: Public (needed for isAdmin() check)
    └── Write: Disabled (managed server-side)
```

## Access Control Matrix

| Collection | Unauthenticated | Student | Author | Admin |
|------------|----------------|---------|--------|-------|
| **Users** |
| Read own profile | ❌ | ✅ | ✅ | ✅ |
| Read other profile | ❌ | ❌ | ❌ | ❌ |
| Create own profile | ❌ | ✅ | ✅ | ✅ |
| Update own profile | ❌ | ✅ | ✅ | ✅ |
| Update other profile | ❌ | ❌ | ❌ | ✅ |
| **Suggestions** |
| Read any | ✅ | ✅ | ✅ | ✅ |
| Create | ❌ | ✅ | ✅ | ✅ |
| Update own | ❌ | ❌ | ✅ | ✅ |
| Update other | ❌ | ❌ | ❌ | ✅ |
| Delete own | ❌ | ❌ | ✅ | ✅ |
| Delete other | ❌ | ❌ | ❌ | ✅ |
| **Comments** |
| Read any | ✅ | ✅ | ✅ | ✅ |
| Create | ❌ | ✅ | ✅ | ✅ |
| Update | ❌ | ❌ | ❌ | ❌ |
| Delete own | ❌ | ❌ | ✅ | ✅ |
| Delete other | ❌ | ❌ | ❌ | ✅ |
| **Votes** |
| Read any | ❌ | ✅ | ✅ | ✅ |
| Create own | ❌ | ✅ | ✅ | ✅ |
| Create for other | ❌ | ❌ | ❌ | ❌ |
| Delete own | ❌ | ✅ | ✅ | ✅ |
| Delete other | ❌ | ❌ | ❌ | ❌ |
| **Admin Roles** |
| Read | ✅ | ✅ | ✅ | ✅ |
| Write | ❌ | ❌ | ❌ | ❌ |

## Role Hierarchy

```
┌─────────────────┐
│  SUPER_ADMIN    │  Can manage user roles
│                 │  Has all admin privileges
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│     ADMIN       │  Can review/score suggestions
│                 │  Can update/delete any content
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│    STUDENT      │  Can submit suggestions
│                 │  Can upvote and comment
│                 │  Can manage own content
└─────────────────┘
```

## Data Flow Examples

### Example 1: Creating a Suggestion

```
User (authenticated)
    │
    ├─ Submits suggestion with authorUid = user.uid
    │
    ▼
Security Rules Check
    │
    ├─ Is user signed in? ✓
    ├─ Does authorUid match user.uid? ✓
    │
    ▼
Firestore
    │
    └─ Document created in /suggestions/{id}
```

### Example 2: Upvoting a Suggestion

```
User (authenticated)
    │
    ├─ Creates vote with voteId = "user123_suggestion456"
    │
    ▼
Security Rules Check
    │
    ├─ Is user signed in? ✓
    ├─ Does voterUid match user.uid? ✓
    ├─ Does voteId = user.uid + '_' + suggestionId? ✓
    │
    ▼
Firestore
    │
    ├─ Document created in /votes/{voteId}
    │
    ▼
Cloud Function (onVoteCreated)
    │
    └─ Increments suggestion.upvotesCount
```

### Example 3: Admin Updating Suggestion

```
Admin (authenticated)
    │
    ├─ Updates suggestion status to "SHORTLISTED"
    │
    ▼
Security Rules Check
    │
    ├─ Is user signed in? ✓
    ├─ Is user the author? ✗
    ├─ Is user an admin? (checks /roles_admin/{uid}) ✓
    │
    ▼
Firestore
    │
    ├─ Document updated in /suggestions/{id}
    │
    ▼
Cloud Function (onSuggestionStatusChange)
    │
    └─ Sends notification emails to author and voters
```

### Example 4: Commenting on Suggestion

```
User (authenticated)
    │
    ├─ Creates comment with authorUid = user.uid
    │
    ▼
Security Rules Check
    │
    ├─ Is user signed in? ✓
    ├─ Does authorUid match user.uid? ✓
    │
    ▼
Firestore
    │
    └─ Document created in /suggestions/{id}/comments/{commentId}
```

## Helper Functions Flow

### isAdmin() Function

```
isAdmin() called
    │
    ▼
Check if document exists at:
/databases/{db}/documents/roles_admin/{user.uid}
    │
    ├─ Document exists → return true
    └─ Document missing → return false
```

### isOwner(uid) Function

```
isOwner(uid) called
    │
    ▼
Compare:
request.auth.uid == uid
    │
    ├─ Match → return true
    └─ No match → return false
```

## Security Validation Points

### Vote Creation Validation

```
Vote Creation Request
    │
    ├─ Check 1: Is user authenticated?
    ├─ Check 2: Does voterUid == request.auth.uid?
    └─ Check 3: Does voteId == request.auth.uid + '_' + suggestionId?
         │
         ├─ All pass → Allow
         └─ Any fail → Deny
```

### Suggestion Update Validation

```
Suggestion Update Request
    │
    ├─ Check 1: Is user authenticated?
    └─ Check 2: Is user the author OR an admin?
         │
         ├─ Author check: resource.data.authorUid == request.auth.uid
         ├─ Admin check: exists(/roles_admin/{request.auth.uid})
         │
         ├─ Either pass → Allow
         └─ Both fail → Deny
```

## Anonymous Submission Handling

```
Anonymous Suggestion
    │
    ├─ authorUid = "ANONYMOUS"
    │
    ▼
Update/Delete Attempt
    │
    ├─ isOwner("ANONYMOUS") check
    │   └─ request.auth.uid == "ANONYMOUS" → Always false
    │
    └─ isAdmin() check
        └─ Only admins can modify anonymous suggestions
```

## Key Design Decisions

1. **Composite Vote Keys**: Prevents duplicate votes at the database level
2. **Separate Admin Collection**: Efficient admin checking without reading user docs
3. **Public Read for Suggestions**: Transparency and discoverability
4. **Nested Comments**: Logical grouping and easier querying
5. **Profile Privacy**: Users can only see their own profile data
6. **Immutable Votes/Comments**: Once created, cannot be modified (only deleted)

## Testing Coverage

Each security rule is tested with:
- ✅ Positive cases (should succeed)
- ✅ Negative cases (should fail)
- ✅ Edge cases (anonymous, admin override)
- ✅ Boundary conditions (ownership, authentication)
