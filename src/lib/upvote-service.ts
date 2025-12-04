import { 
  collection, 
  doc, 
  getDoc, 
  setDoc, 
  serverTimestamp,
  Firestore,
  query,
  where,
  getDocs
} from 'firebase/firestore';

export interface Vote {
  voteId: string; // Format: `${voterUid}_${suggestionId}`
  suggestionId: string;
  voterUid: string;
  timestamp: any;
}

/**
 * Check if a user has already voted on a suggestion
 * @param firestore Firestore instance
 * @param userId User ID
 * @param suggestionId Suggestion ID
 * @returns Promise<boolean> True if user has already voted
 */
export async function hasUserVoted(
  firestore: Firestore,
  userId: string,
  suggestionId: string
): Promise<boolean> {
  const voteId = `${userId}_${suggestionId}`;
  const voteRef = doc(firestore, 'votes', voteId);
  const voteSnap = await getDoc(voteRef);
  return voteSnap.exists();
}

/**
 * Add a vote for a suggestion
 * @param firestore Firestore instance
 * @param userId User ID
 * @param suggestionId Suggestion ID
 * @returns Promise<void>
 * @throws Error if user has already voted
 */
export async function addVote(
  firestore: Firestore,
  userId: string,
  suggestionId: string
): Promise<void> {
  const voteId = `${userId}_${suggestionId}`;
  const voteRef = doc(firestore, 'votes', voteId);
  
  // Check if vote already exists
  const voteSnap = await getDoc(voteRef);
  if (voteSnap.exists()) {
    throw new Error('You have already upvoted this suggestion');
  }
  
  // Create vote document with composite key
  const voteData: Omit<Vote, 'timestamp'> & { timestamp: any } = {
    voteId,
    suggestionId,
    voterUid: userId,
    timestamp: serverTimestamp()
  };
  
  await setDoc(voteRef, voteData);
}

/**
 * Get all votes for a specific user
 * @param firestore Firestore instance
 * @param userId User ID
 * @returns Promise<Set<string>> Set of suggestion IDs the user has voted on
 */
export async function getUserVotes(
  firestore: Firestore,
  userId: string
): Promise<Set<string>> {
  const votesRef = collection(firestore, 'votes');
  const q = query(votesRef, where('voterUid', '==', userId));
  const querySnapshot = await getDocs(q);
  
  const votedSuggestionIds = new Set<string>();
  querySnapshot.forEach((doc) => {
    const vote = doc.data() as Vote;
    votedSuggestionIds.add(vote.suggestionId);
  });
  
  return votedSuggestionIds;
}
