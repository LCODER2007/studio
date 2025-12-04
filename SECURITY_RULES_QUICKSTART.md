# Security Rules Quick Start Guide

## What Was Done

The Firestore security rules have been completely rewritten to match the design specification. The new rules implement proper role-based access control, vote integrity validation, and comment subcollection structure.

## Quick Test (Recommended)

To verify the security rules work correctly:

### Step 1: Install Dependencies
```bash
npm install
```

### Step 2: Start Firebase Emulator (in one terminal)
```bash
npm run emulators:start
```

Wait for the message: "All emulators ready!"

### Step 3: Run Tests (in another terminal)
```bash
npm run test:rules
```

You should see all tests passing ✓

## What Changed

### 1. Security Rules (`firestore.rules`)
- ✅ Updated to match design specification exactly
- ✅ Fixed comments subcollection path structure
- ✅ Added proper vote validation with composite keys
- ✅ Changed admin check from `admins` to `roles_admin` collection
- ✅ Added user profile privacy (users can only read their own profile)

### 2. New Files Created
- `firebase.json` - Emulator configuration
- `tests/firestore.rules.test.ts` - 30+ comprehensive tests
- `tests/README.md` - Testing documentation
- `scripts/validate-rules.sh` - Rules syntax validator
- `docs/SECURITY_RULES.md` - Complete rules documentation
- `docs/SECURITY_RULES_CHANGES.md` - Detailed change summary
- `jest.config.js` - Jest test configuration

### 3. Package.json Updates
- Added test scripts: `test:rules`, `emulators:start`, `validate:rules`
- Added dev dependencies for testing

## Key Security Features

### Vote Integrity
- Votes use composite key format: `userId_suggestionId`
- Prevents duplicate votes
- Users cannot vote for others

### Role-Based Access
- Students: Can create, read, upvote, comment
- Admins: Can update/delete any content
- Super Admins: Can manage user roles

### Data Protection
- Users can only read their own profile
- Public read for suggestions and comments
- Authors control their own content
- Admins have override permissions

## Requirements Validated

✅ **Requirement 10.1**: Public suggestion read access  
✅ **Requirement 10.2**: Suggestion creation authorization  
✅ **Requirement 10.3**: Suggestion update authorization  
✅ **Requirement 10.4**: Suggestion deletion authorization  
✅ **Requirement 10.5**: Profile privacy  

## Next Steps

1. **Test the rules** (see Quick Test above)
2. **Review documentation** in `docs/SECURITY_RULES.md`
3. **Deploy to Firebase** when ready:
   ```bash
   firebase deploy --only firestore:rules
   ```

## Important Notes

- The `roles_admin` collection must be manually populated with admin UIDs
- Anonymous suggestions use `"ANONYMOUS"` as authorUid
- Comments are now subcollections of suggestions (not top-level)
- Votes are now a top-level collection (not user subcollection)

## Troubleshooting

### Tests won't run
- Make sure emulator is running first
- Check that ports 8080 and 4000 are available

### Rules validation fails
```bash
npm run validate:rules
```

### Need more details
See `docs/SECURITY_RULES.md` for comprehensive documentation

## Questions?

Refer to:
- `tests/README.md` - Testing guide
- `docs/SECURITY_RULES.md` - Complete rules documentation
- `docs/SECURITY_RULES_CHANGES.md` - Detailed change log
