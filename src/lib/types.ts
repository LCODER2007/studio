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

export const SuggestionStatuses = [
  'SUBMITTED',
  'UNDER_REVIEW',
  'SHORTLISTED',
  'ARCHIVED_REJECTED',
  'IMPLEMENTED',
] as const;
export type SuggestionStatus = (typeof SuggestionStatuses)[number];

export interface Suggestion {
  suggestionId: string;
  title: string;
  body: string;
  authorUid: string; // 'ANONYMOUS' or user UID
  authorDisplayName: string; // "Anonymous" or user display name
  authorPhotoURL?: string | null;
  category: SuggestionCategory;
  status: SuggestionStatus;
  upvotesCount: number;
  impactScore: number; // 1-5
  feasibilityRating: number; // 1-5
  costEffectivenessRating: number; // 1-5
  reviewerUid?: string;
  submissionTimestamp: any; // Can be Date or Firebase Timestamp
  publicFeedback?: string;
  commentsCount: number;
}

export interface Comment {
    commentId: string;
    suggestionId: string;
    authorUid: string;
    authorDisplayName: string;
    authorPhotoURL?: string | null;
    body: string;
    timestamp: any; // Can be Date or Firebase Timestamp
}
