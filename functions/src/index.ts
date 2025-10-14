import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

admin.initializeApp();

export const triggerVoteUpdate = functions.firestore
  .document("votes/{voteId}")
  .onCreate(async (snap) => {
    const vote = snap.data();
    const { suggestionId, voterUid } = vote;

    // Increment the upvotes count on the suggestion
    const suggestionRef = admin.firestore().collection("suggestions").doc(suggestionId);
    await suggestionRef.update({
      upvotesCount: admin.firestore.FieldValue.increment(1),
    });

    // Record the vote in the user's private collection
    const userVoteRef = admin.firestore().collection("user_votes").doc(voterUid).collection("suggestions").doc(suggestionId);
    return userVoteRef.set({
        suggestionId: suggestionId,
        timestamp: vote.timestamp,
    });
  });

export const triggerStatusNotification = functions.firestore
  .document("suggestions/{suggestionId}")
  .onUpdate(async (change) => {
    const before = change.before.data();
    const after = change.after.data();

    if (
      before.status !== after.status &&
      (after.status === "SHORTLISTED" || after.status === "IMPLEMENTED")
    ) {
      const suggestionId = change.after.id;
      const authorUid = after.authorUid;

      // 1. Get all voters for this suggestion
      const votesSnapshot = await admin
        .firestore()
        .collection("votes")
        .where("suggestionId", "==", suggestionId)
        .get();
      
      const voterUids = new Set<string>();
      votesSnapshot.forEach((doc) => {
        voterUids.add(doc.data().voterUid);
      });

      // 2. Combine author and voters, ensuring no duplicates
      const allUids = new Set<string>(voterUids);
      if (authorUid !== "ANONYMOUS") {
        allUids.add(authorUid);
      }

      // 3. "Send" notifications
      console.log(`Status for suggestion ${suggestionId} changed to ${after.status}.`);
      console.log("Notifying users:", Array.from(allUids));

      // In a real app, you would fetch user emails/tokens and send emails or push notifications.
      // Example:
      // for (const uid of allUids) {
      //   const user = await admin.auth().getUser(uid);
      //   const email = user.email;
      //   // Send email logic here
      // }
    }
    return null;
  });

    