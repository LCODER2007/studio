
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


/**
 * Triggered when a suggestion's status is updated to 'SHORTLISTED' or 'IMPLEMENTED'.
 * It logs the UIDs of the author and all voters who should be notified.
 * In a real app, this would integrate with an email or push notification service.
 */
export const triggerStatusNotification = functions.firestore
  .document("suggestions/{suggestionId}")
  .onUpdate(async (change) => {
    const before = change.before.data();
    const after = change.after.data();

    // Proceed only if the status has changed to a notification-worthy status
    if (
      before.status !== after.status &&
      (after.status === "SHORTLISTED" || after.status === "IMPLEMENTED")
    ) {
      const suggestionId = change.after.id;
      const authorUid = after.authorUid;

      // 1. Get all voters for this suggestion from the `votes` collection
      const votesSnapshot = await admin
        .firestore()
        .collection("votes")
        .where("suggestionId", "==", suggestionId)
        .get();
      
      const voterUids = new Set<string>();
      votesSnapshot.forEach((doc) => {
        voterUids.add(doc.data().voterUid);
      });

      // 2. Combine author and voters into a single set to avoid duplicate notifications
      const allUidsToNotify = new Set<string>(voterUids);
      if (authorUid && authorUid !== "ANONYMOUS") {
        allUidsToNotify.add(authorUid);
      }

      // 3. "Send" notifications by logging them.
      console.log(
        `Status for suggestion '${after.title}' (${suggestionId}) changed to ${after.status}.`
      );
      console.log("Notifying users:", Array.from(allUidsToNotify));

      // In a real-world application, you would integrate with a service like SendGrid or
      // Firebase Cloud Messaging here to send actual emails or push notifications.
      // Example:
      // for (const uid of allUidsToNotify) {
      //   const user = await admin.auth().getUser(uid);
      //   const email = user.email;
      //   // Send email logic would go here, e.g., using nodemailer or an API call.
      // }
    }
    return null;
  });
