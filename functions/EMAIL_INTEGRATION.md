# Email Integration Guide

This document explains how to integrate email notifications with the Cloud Functions.

## Current Status

The `onSuggestionStatusChange` Cloud Function is implemented and will trigger when a suggestion's status changes to `SHORTLISTED` or `IMPLEMENTED`. However, the `sendEmail()` function is currently a placeholder that logs emails instead of sending them.

## Integration Options

### Option 1: Firebase Email Extension (Recommended)

The Firebase Email Extension is the easiest way to send emails from Cloud Functions.

**Installation:**
1. Visit the [Firebase Console](https://console.firebase.google.com/)
2. Go to Extensions → Install Extension
3. Search for "Trigger Email" and install it
4. Configure SMTP settings (or use a service like SendGrid, Mailgun, etc.)

**Code Integration:**
Uncomment this code in the `sendEmail()` function:

```typescript
await admin.firestore().collection('mail').add({
  to: to,
  message: {
    subject: subject,
    text: body,
    html: body.replace(/\n/g, '<br>')
  }
});
```

**Configuration:**
- Set up your SMTP credentials in the extension configuration
- The extension will automatically process documents added to the `mail` collection

### Option 2: SendGrid

SendGrid provides a robust email API with good deliverability.

**Installation:**
```bash
cd functions
npm install @sendgrid/mail
```

**Configuration:**
Set your SendGrid API key:
```bash
firebase functions:config:set sendgrid.key="YOUR_SENDGRID_API_KEY"
```

**Code Integration:**
1. Import SendGrid at the top of `functions/src/index.ts`:
```typescript
import * as sgMail from '@sendgrid/mail';
```

2. Uncomment and update this code in the `sendEmail()` function:
```typescript
sgMail.setApiKey(functions.config().sendgrid.key);
await sgMail.send({
  to: to,
  from: 'noreply@seesunilag.edu.ng', // Update with your verified sender
  subject: subject,
  text: body,
  html: body.replace(/\n/g, '<br>')
});
```

**Sender Verification:**
- Verify your sender email address in SendGrid dashboard
- For production, verify your domain for better deliverability

### Option 3: Nodemailer with SMTP

Use any SMTP service (Gmail, AWS SES, etc.) with Nodemailer.

**Installation:**
```bash
cd functions
npm install nodemailer
```

**Configuration:**
```bash
firebase functions:config:set smtp.host="smtp.gmail.com"
firebase functions:config:set smtp.port="587"
firebase functions:config:set smtp.user="your-email@gmail.com"
firebase functions:config:set smtp.pass="your-app-password"
```

**Code Integration:**
1. Import Nodemailer:
```typescript
import * as nodemailer from 'nodemailer';
```

2. Create transporter and send email:
```typescript
const transporter = nodemailer.createTransport({
  host: functions.config().smtp.host,
  port: functions.config().smtp.port,
  secure: false,
  auth: {
    user: functions.config().smtp.user,
    pass: functions.config().smtp.pass,
  },
});

await transporter.sendMail({
  from: '"SEES UNILAG" <noreply@seesunilag.edu.ng>',
  to: to,
  subject: subject,
  text: body,
  html: body.replace(/\n/g, '<br>'),
});
```

## Testing

### Local Testing with Firebase Emulator

1. Start the emulator:
```bash
firebase emulators:start
```

2. Trigger a status change in your app
3. Check the emulator logs to see the email content that would be sent

### Production Testing

1. Deploy the functions:
```bash
npm run deploy
```

2. Update a suggestion's status to `SHORTLISTED` or `IMPLEMENTED`
3. Check Firebase Functions logs:
```bash
npm run logs
```

## Email Content

The notification emails include:
- Recipient's name (personalized)
- Suggestion title
- New status (Shortlisted or Implemented)
- Public feedback from admin (if provided)
- Invitation to provide feedback
- Link to the suggestion (placeholder - update with actual URL)

## Error Handling

The function includes comprehensive error handling:
- Continues processing if one email fails
- Logs all errors for debugging
- Skips anonymous authors automatically
- Handles missing user profiles gracefully

## Requirements Validated

This implementation validates the following requirements:
- **6.3**: Status change triggers notifications
- **7.1**: SHORTLISTED status sends notifications
- **7.2**: IMPLEMENTED status sends notifications
- **7.3**: Email includes title, status, and feedback invitation
- **7.4**: Anonymous suggestions skip author notification
- **7.5**: All voters receive notifications

## Next Steps

1. Choose an email service provider
2. Install required dependencies
3. Configure credentials
4. Update the `sendEmail()` function
5. Test in development environment
6. Deploy to production
7. Monitor logs for any issues
