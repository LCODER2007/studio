
import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

admin.initializeApp();

/**
 * Triggered when a new document is created in the `votes` collection.
 * It atomically increments the `upvotesCount` on the corresponding suggestion
 * and records the vote in the user's private `user_votes` collection.
 */
export const triggerVoteUpdate = functions.firestore
  .document("votes/{voteId}")
  .onCreate(async (snap) => {
    const vote = snap.data();
    const { suggestionId, voterUid } = vote;

    // 1. Atomically increment the upvotes count on the suggestion
    const suggestionRef = admin.firestore().collection("suggestions").doc(suggestionId);
    await suggestionRef.update({
      upvotesCount: admin.firestore.FieldValue.increment(1),
    });

    // 2. Record the vote in the user's private collection to track their votes
    // This allows the frontend to know which suggestions the user has upvoted.
    const userVoteRef = admin.firestore()
      .collection("user_votes")
      .doc(voterUid)
      .collection("suggestions")
      .doc(suggestionId); // Use suggestionId as the doc ID for easy lookup
      
    return userVoteRef.set({
        suggestionId: suggestionId,
        timestamp: vote.timestamp,
    });
  });
