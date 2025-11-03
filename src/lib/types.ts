
export type UserRole = 'STUDENT' | 'SUPER_ADMIN';

export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  role: UserRole;
}

export const SuggestionCategories = [
  'ACADEMIC_CURRICULUM',
  'INFRASTRUCTURE_IT',
  'TECHNICAL_DESIGN',
  'ENVIRONMENTAL_SUSTAINABILITY',
  'ADMINISTRATIVE_SEES',
  'OTHER',
] as const;
export type SuggestionCategory = (typeof SuggestionCategories)[number];

export interface Suggestion {
  suggestionId: string; // This will be the Firestore document ID
  title: string;
  body: string;
  authorUid: string; // 'ANONYMOUS' or user UID
  authorDisplayName: string; // "Anonymous" or user display name
  authorPhotoURL?: string | null;
  category: SuggestionCategory;
  upvotesCount: number;
  commentsCount?: number;
  impactScore: number; // 1-5
  feasibilityRating: number; // 1-5
  costEffectivenessRating: number; // 1-5
  reviewerUid?: string;
  submissionTimestamp: any; // Can be Date or Firebase Timestamp
  publicFeedback?: string;
}

export interface Comment {
    commentId: string;
    suggestionId: string;
    authorUid: string;
    authorDisplayName: string;
    authorPhotoURL?: string | null;
    text: string;
    createdAt: any; // Can be Date or Firebase Timestamp
}
