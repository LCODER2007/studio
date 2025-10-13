# **App Name**: SEES UNILAG Innovation Hub

## Core Features:

- Secure User Authentication: Implement Firebase Authentication with email/password and Google sign-in, with RBAC for STUDENT, ADMIN, and SUPER_ADMIN roles.
- Suggestion Submission: Allow authenticated users to submit suggestions with fields: title, body, category, etc., with an option for anonymous submission. Includes UUID generation.
- Public Suggestion Feed: Display submitted suggestions filterable by status and category, sortable by upvotes and submission timestamp.  Only display upvotesCount if status is 'SHORTLISTED'.
- Admin Dashboard: Provide an admin dashboard accessible only to ADMIN/SUPER_ADMIN roles for triaging suggestions, filtering by status, and inputting evaluation scores. Includes a module for workflow status transitions.
- Upvote Tracking: Enable users to upvote suggestions with one vote per user, enforced by the Votes collection.
- Realtime Vote Counter: Trigger a function to update in real-time the number of upvotes per suggestion whenever there is a new vote for it
- Automated Notification System: Utilize Cloud Functions to trigger email notifications to suggestion authors and voters when a suggestion status is updated to 'SHORTLISTED' or 'IMPLEMENTED'. Generates user-friendly emails that contain a brief description about the project and the status change, inviting users to post public feedback.

## Style Guidelines:

- Primary color: Deep blue (#3F51B5), symbolizing trust, authority, and innovation.
- Background color: Light gray (#F5F5F5), providing a clean and modern backdrop.
- Accent color: A vibrant shade of orange (#FF9800), for highlights, calls to action, and important notifications.
- Body and headline font: 'PT Sans', sans-serif
- Note: currently only Google Fonts are supported.
- Use simple, clear icons from the Material Design set to represent suggestion categories and actions.
- Maintain a clean, card-based layout for suggestions and use a clear visual hierarchy in the admin dashboard to aid in efficient review.
- Incorporate subtle animations on upvotes, status changes, and when new data loads to provide engaging feedback.