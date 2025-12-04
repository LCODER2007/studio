# Firestore Security Rules Testing

This directory contains tests for validating the Firestore security rules defined in `firestore.rules`.

## Prerequisites

1. Install dependencies:
```bash
npm install
```

2. Install Firebase CLI globally (if not already installed):
```bash
npm install -g firebase-tools
```

## Running the Tests

### Step 1: Start the Firebase Emulator

In one terminal, start the Firestore emulator:

```bash
npm run emulators:start
```

This will start the Firestore emulator on port 8080 and the Emulator UI on port 4000.

### Step 2: Run the Security Rules Tests

In another terminal, run the tests:

```bash
npm run test:rules
```

## What the Tests Cover

The security rules tests validate:

### User Profile Security (Requirements 10.5)
- Users can read their own profile
- Users cannot read other users' profiles
- Users can create their own profile
- Users cannot create profiles for others
- Admins can update any user profile

### Suggestion Security (Requirements 10.1, 10.2, 10.3, 10.4)
- Anyone can read suggestions (public read)
- Users can only create suggestions with their own UID
- Authors can update their own suggestions
- Non-authors cannot update suggestions
- Admins can update any suggestion
- Authors and admins can delete suggestions

### Vote Security
- Authenticated users can read votes
- Unauthenticated users cannot read votes
- Users can create votes with correct composite key format (`userId_suggestionId`)
- Users cannot create votes with incorrect keys
- Users cannot vote on behalf of others
- Users can delete their own votes
- Users cannot delete others' votes

### Comment Security
- Anyone can read comments (public read)
- Users can only create comments with their own UID
- Users cannot create comments with another user's UID
- Authors can delete their own comments
- Non-authors cannot delete comments
- Admins can delete any comment

### Admin Roles Security
- Anyone can read admin roles (needed for `isAdmin()` function)
- No one can write to admin roles (managed manually or by super admin function)

## Test Structure

Each test follows this pattern:

1. **Setup**: Create test data using `withSecurityRulesDisabled()` to bypass rules
2. **Action**: Attempt an operation with specific user context
3. **Assertion**: Verify the operation succeeds or fails as expected using `assertSucceeds()` or `assertFails()`

## Troubleshooting

### Emulator not starting
- Make sure port 8080 and 4000 are not in use
- Check that `firebase.json` exists in the project root

### Tests failing unexpectedly
- Ensure the emulator is running before running tests
- Check that `firestore.rules` matches the design specification
- Verify the test data setup matches the expected structure

### Connection errors
- Confirm the emulator is accessible at `localhost:8080`
- Check firewall settings if running in a restricted environment
