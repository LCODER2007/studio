# Upvoting Implementation

## Overview

The upvoting functionality allows authenticated users to upvote suggestions. The implementation follows the design specification with proper data modeling, optimistic UI updates, and Cloud Function triggers.

## Architecture

### Data Model

Votes are stored in a top-level `/votes` collection with composite key format:
- **Document ID**: `{voterUid}_{suggestionId}`
- **Fields**:
  - `voteId`: Same as document ID
  - `suggestionId`: Reference to the suggestion
  - `voterUid`: User who cast the vote
  - `timestamp`: When the vote was cast

### Components

#### 1. Upvote Service (`src/lib/upvote-service.ts`)

Provides three main functions:

- **`hasUserVoted(firestore, userId, suggestionId)`**: Checks if a user has already voted
- **`addVote(firestore, userId, suggestionId)`**: Creates a new vote document with composite key
- **`getUserVotes(firestore, userId)`**: Retrieves all votes for a specific user

#### 2. SuggestionList Component

Updated to:
- Query votes from the `/votes` collection filtered by `voterUid`
- Implement optimistic UI updates for immediate feedback
- Handle rollback on errors
- Display proper toast notifications

#### 3. Cloud Function (`functions/src/index.ts`)

**`onVoteCreated`** trigger:
- Fires when a new vote document is created
- Uses Firestore transaction to atomically increment `upvotesCount`
- Includes error handling and logging
- Automatic retry on transient failures

## User Flow

1. User clicks upvote button on a suggestion
2. Client checks if user has already voted (including optimistic updates)
3. If not voted:
   - Optimistically update UI to show upvoted state
   - Call `addVote()` to create vote document
   - Cloud Function automatically increments suggestion's `upvotesCount`
   - Real-time listener updates all clients with new count
4. If error occurs:
   - Rollback optimistic update
   - Display error message to user

## Security

Firestore security rules enforce:
- Only authenticated users can create votes
- Vote document ID must match the composite key format: `{voterUid}_{suggestionId}`
- Users can only create votes with their own UID
- Users can only delete their own votes

## Requirements Validated

- **3.1**: Upvote increments count by one
- **3.2**: Vote record created with proper linking
- **3.3**: Duplicate votes prevented (idempotence)
- **3.4**: Cloud Function updates count in real-time
- **3.5**: Visual indication of upvoted state

## Testing

The implementation supports property-based testing for:
- Upvote increment correctness
- Idempotence (upvoting twice = upvoting once)
- Vote record creation
- Authorization checks
