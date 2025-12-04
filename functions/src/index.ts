/**
 * Firebase Cloud Functions for SEES UNILAG Innovation Hub
 * 
 * EMAIL SERVICE CONFIGURATION:
 * The sendEmail function is currently a placeholder. To enable actual email sending:
 * 
 * Option 1: Firebase Email Extension (Recommended)
 * - Install: https://extensions.dev/extensions/firebase/firestore-send-email
 * - Configure SMTP settings in Firebase Console
 * - Uncomment the Firebase Email Extension code in sendEmail()
 * 
 * Option 2: SendGrid
 * - Install: npm install @sendgrid/mail
 * - Set SENDGRID_API_KEY in Firebase Functions config
 * - Uncomment the SendGrid code in sendEmail()
 * 
 * Option 3: AWS SES or other SMTP service
 * - Install nodemailer: npm install nodemailer
 * - Configure SMTP credentials
 * - Implement custom email sending logic
 */

import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

// Initialize Firebase Admin
admin.initializeApp();

// Types
interface SuggestionData {
  suggestionId: string;
  title: string;
  body: string;
  authorUid: string;
  status: string;
  publicFeedback?: string;
}

interface UserData {
  uid: string;
  email: string | null;
  displayName: string | null;
}

/**
 * Cloud Function: onVoteCreated
 * Triggers when a new vote document is created in the /votes collection
 * Atomically increments the upvotesCount on the corresponding suggestion
 * 
 * @trigger Firestore document creation at /votes/{voteId}
 * @validates Requirements 3.4
 */
export const onVoteCreated = functions.firestore
  .document('votes/{voteId}')
  .onCreate(async (snap, context) => {
    const voteData = snap.data();
    const suggestionId = voteData.suggestionId;
    
    if (!suggestionId) {
      console.error('Vote document missing suggestionId:', snap.id);
      return;
    }
    
    const db = admin.firestore();
    const suggestionRef = db.collection('suggestions').doc(suggestionId);
    
    try {
      // Use a transaction to atomically increment the upvote count
      await db.runTransaction(async (transaction) => {
        const suggestionDoc = await transaction.get(suggestionRef);
        
        if (!suggestionDoc.exists) {
          console.error('Suggestion does not exist:', suggestionId);
          throw new Error(`Suggestion ${suggestionId} not found`);
        }
        
        const currentCount = suggestionDoc.data()?.upvotesCount || 0;
        const newCount = currentCount + 1;
        
        transaction.update(suggestionRef, {
          upvotesCount: newCount
        });
        
        console.log(`Incremented upvote count for suggestion ${suggestionId}: ${currentCount} -> ${newCount}`);
      });
      
      return null;
    } catch (error) {
      console.error('Error incrementing upvote count:', error);
      
      // Retry logic: If the transaction fails, we can rely on Firebase Functions
      // automatic retry mechanism for transient failures
      throw error;
    }
  });

/**
 * Cloud Function: onSuggestionStatusChange
 * Triggers when a suggestion's status field is updated
 * Sends email notifications to the author and all voters when status changes to SHORTLISTED or IMPLEMENTED
 * 
 * @trigger Firestore document update at /suggestions/{suggestionId}
 * @validates Requirements 6.3, 7.1, 7.2, 7.3, 7.4, 7.5
 */
export const onSuggestionStatusChange = functions.firestore
  .document('suggestions/{suggestionId}')
  .onUpdate(async (change, context) => {
    const beforeData = change.before.data() as SuggestionData;
    const afterData = change.after.data() as SuggestionData;
    const suggestionId = context.params.suggestionId;
    
    // Check if status has changed
    if (beforeData.status === afterData.status) {
      console.log(`No status change for suggestion ${suggestionId}, skipping notification`);
      return null;
    }
    
    // Only send notifications for SHORTLISTED or IMPLEMENTED status
    const newStatus = afterData.status;
    if (newStatus !== 'SHORTLISTED' && newStatus !== 'IMPLEMENTED') {
      console.log(`Status changed to ${newStatus}, not sending notifications`);
      return null;
    }
    
    console.log(`Status changed from ${beforeData.status} to ${newStatus} for suggestion ${suggestionId}`);
    
    const db = admin.firestore();
    const emailsToNotify: string[] = [];
    const recipientNames: Map<string, string> = new Map();
    
    try {
      // 1. Fetch author email (skip if anonymous)
      if (afterData.authorUid && afterData.authorUid !== 'ANONYMOUS') {
        try {
          const authorDoc = await db.collection('users').doc(afterData.authorUid).get();
          if (authorDoc.exists) {
            const authorData = authorDoc.data() as UserData;
            if (authorData.email) {
              emailsToNotify.push(authorData.email);
              recipientNames.set(authorData.email, authorData.displayName || 'User');
              console.log(`Added author email: ${authorData.email}`);
            }
          }
        } catch (error) {
          console.error(`Error fetching author profile for ${afterData.authorUid}:`, error);
        }
      } else {
        console.log('Suggestion is anonymous, skipping author notification');
      }
      
      // 2. Query votes collection to get all voter UIDs
      const votesSnapshot = await db.collection('votes')
        .where('suggestionId', '==', suggestionId)
        .get();
      
      console.log(`Found ${votesSnapshot.size} votes for suggestion ${suggestionId}`);
      
      // 3. Fetch voter emails from user profiles
      const voterUids = new Set<string>();
      votesSnapshot.forEach(doc => {
        const voteData = doc.data();
        if (voteData.voterUid && voteData.voterUid !== afterData.authorUid) {
          voterUids.add(voteData.voterUid);
        }
      });
      
      // Fetch user profiles for all voters
      const voterEmailPromises = Array.from(voterUids).map(async (voterUid) => {
        try {
          const voterDoc = await db.collection('users').doc(voterUid).get();
          if (voterDoc.exists) {
            const voterData = voterDoc.data() as UserData;
            if (voterData.email && !emailsToNotify.includes(voterData.email)) {
              emailsToNotify.push(voterData.email);
              recipientNames.set(voterData.email, voterData.displayName || 'User');
              console.log(`Added voter email: ${voterData.email}`);
            }
          }
        } catch (error) {
          console.error(`Error fetching voter profile for ${voterUid}:`, error);
        }
      });
      
      await Promise.all(voterEmailPromises);
      
      console.log(`Total emails to notify: ${emailsToNotify.length}`);
      
      // 4. Send notification emails
      if (emailsToNotify.length === 0) {
        console.log('No emails to send');
        return null;
      }
      
      // Prepare email content
      const statusLabel = newStatus === 'SHORTLISTED' ? 'Shortlisted' : 'Implemented';
      const emailSubject = `Suggestion Update: "${afterData.title}" is now ${statusLabel}`;
      
      // Send emails to all recipients
      const emailPromises = emailsToNotify.map(async (email) => {
        const recipientName = recipientNames.get(email) || 'User';
        const emailBody = generateEmailBody(
          recipientName,
          afterData.title,
          statusLabel,
          afterData.publicFeedback,
          suggestionId
        );
        
        try {
          await sendEmail(email, emailSubject, emailBody);
          console.log(`Email sent successfully to ${email}`);
        } catch (error) {
          console.error(`Failed to send email to ${email}:`, error);
          // Continue processing other emails even if one fails
        }
      });
      
      await Promise.all(emailPromises);
      
      console.log(`Notification process completed for suggestion ${suggestionId}`);
      return null;
      
    } catch (error) {
      console.error('Error in onSuggestionStatusChange:', error);
      throw error;
    }
  });

/**
 * Generate email body content for status change notifications
 */
function generateEmailBody(
  recipientName: string,
  suggestionTitle: string,
  newStatus: string,
  publicFeedback: string | undefined,
  suggestionId: string
): string {
  let body = `Hello ${recipientName},\n\n`;
  body += `Great news! The suggestion "${suggestionTitle}" has been ${newStatus.toLowerCase()}.\n\n`;
  
  if (newStatus === 'Shortlisted') {
    body += `This means your suggestion has been selected for further consideration and review. `;
    body += `The team will be evaluating it for potential implementation.\n\n`;
  } else if (newStatus === 'Implemented') {
    body += `This means your suggestion has been successfully implemented! `;
    body += `Thank you for contributing to the improvement of SEES UNILAG Innovation Hub.\n\n`;
  }
  
  if (publicFeedback) {
    body += `Feedback from the review team:\n${publicFeedback}\n\n`;
  }
  
  body += `We'd love to hear your thoughts on this update. `;
  body += `Please feel free to provide feedback or ask questions by visiting the suggestion page.\n\n`;
  body += `View the suggestion: [Link to suggestion ${suggestionId}]\n\n`;
  body += `Thank you for your participation!\n\n`;
  body += `Best regards,\n`;
  body += `SEES UNILAG Innovation Hub Team`;
  
  return body;
}

/**
 * Send email using configured email service
 * This is a placeholder that should be replaced with actual email service integration
 * Options: Firebase Email Extension, SendGrid, AWS SES, etc.
 */
async function sendEmail(
  to: string,
  subject: string,
  body: string
): Promise<void> {
  // TODO: Integrate with actual email service
  // Option 1: Firebase Email Extension (trigger-email-extension)
  // Option 2: SendGrid API
  // Option 3: AWS SES
  // Option 4: Nodemailer with SMTP
  
  // For now, we'll log the email that would be sent
  // In production, replace this with actual email sending logic
  
  console.log('=== EMAIL TO BE SENT ===');
  console.log(`To: ${to}`);
  console.log(`Subject: ${subject}`);
  console.log(`Body:\n${body}`);
  console.log('========================');
  
  // Example integration with Firebase Email Extension:
  // await admin.firestore().collection('mail').add({
  //   to: to,
  //   message: {
  //     subject: subject,
  //     text: body,
  //     html: body.replace(/\n/g, '<br>')
  //   }
  // });
  
  // Example integration with SendGrid:
  // const sgMail = require('@sendgrid/mail');
  // sgMail.setApiKey(process.env.SENDGRID_API_KEY);
  // await sgMail.send({
  //   to: to,
  //   from: 'noreply@seesunilag.edu.ng',
  //   subject: subject,
  //   text: body,
  //   html: body.replace(/\n/g, '<br>')
  // });
  
  return Promise.resolve();
}
