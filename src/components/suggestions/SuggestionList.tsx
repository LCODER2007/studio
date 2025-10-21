"use client";

import { useState, useMemo, useCallback } from "react";
import type { Suggestion } from "@/lib/types";
import SuggestionCard from "./SuggestionCard";
import SuggestionFilters from "./SuggestionFilters";
import { SubmitSuggestionDialog } from "./SubmitSuggestionDialog";
import { useAuth } from "../auth/AuthContext";
import { AnimatePresence, motion } from "framer-motion";
import { useCollection, useFirestore, useMemoFirebase } from "@/firebase";
import { addDocumentNonBlocking } from "@/firebase/non-blocking-updates";
import { collection, doc, serverTimestamp, query, where, orderBy, Query, DocumentData } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";

type SortOption = "upvotesCount" | "submissionTimestamp";

export default function SuggestionList() {
  const { user } = useAuth();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [isSubmitDialogOpen, setIsSubmitDialogOpen] = useState(false);
  const [filters, setFilters] = useState<{ category: string; status: string }>({ category: "all", status: "all" });
  const [sortBy, setSortBy] = useState<SortOption>("submissionTimestamp");
  
  const suggestionsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    
    let q: Query<DocumentData> = collection(firestore, 'suggestions');

    // Apply filters
    if (filters.category !== 'all') {
      q = query(q, where('category', '==', filters.category));
    }
    if (filters.status !== 'all') {
      q = query(q, where('status', '==', filters.status));
    }

    // Apply sorting
    // Note: Firestore requires an index for this query. 
    // If you have issues, create a composite index on (category, status, upvotesCount) and (category, status, submissionTimestamp).
    q = query(q, orderBy(sortBy, 'desc'));

    return q;
  }, [firestore, filters, sortBy]);

  const { data: suggestions, isLoading } = useCollection<Suggestion>(suggestionsQuery);

  const userVotesQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    // This creates a reference to the subcollection of suggestions the user has voted on.
    return collection(firestore, 'user_votes', user.uid, 'suggestions');
  }, [firestore, user]);

  const { data: userVotes } = useCollection(userVotesQuery);
  const upvotedIds = useMemo(() => new Set(userVotes?.map(v => v.id) || []), [userVotes]);

  const handleOpenSubmitDialog = () => {
    if (user) {
      setIsSubmitDialogOpen(true);
    } else {
       toast({
        variant: "destructive",
        title: "Authentication Required",
        description: "Please log in to submit a suggestion.",
      });
    }
  };

  const handleFilterChange = useCallback((type: 'category' | 'status', value: string) => {
    setFilters(prev => ({ ...prev, [type]: value }));
  }, []);

  const handleSortChange = useCallback((value: SortOption) => {
    setSortBy(value);
  }, []);

  const handleUpvote = useCallback((suggestionId: string) => {
    if (!firestore || !user) return;
    
    // Check if user has already upvoted to prevent double-voting (client-side)
    if (upvotedIds.has(suggestionId)) {
        toast({
            variant: "destructive",
            title: "Already Upvoted",
            description: "You have already upvoted this suggestion.",
        });
        return;
    }

    // Create a reference to a new document in the 'votes' collection.
    const voteRef = doc(collection(firestore, 'votes'));
    
    // Add the vote document. This will trigger the cloud function.
    addDocumentNonBlocking(voteRef, {
        voteId: voteRef.id,
        suggestionId,
        voterUid: user.uid,
        timestamp: serverTimestamp(),
    });

    toast({
        title: "Upvoted!",
        description: "Your vote has been counted.",
    });

  }, [firestore, user, upvotedIds, toast]);

  const handleSubmitSuggestion = (newSuggestion: Omit<Suggestion, 'suggestionId' | 'upvotesCount' | 'commentsCount'>) => {
    if (!firestore) return;
    const suggestionRef = doc(collection(firestore, 'suggestions'));
    const fullSuggestion: Suggestion = {
      ...newSuggestion,
      suggestionId: suggestionRef.id,
      upvotesCount: 0,
      commentsCount: 0,
      submissionTimestamp: serverTimestamp(),
    };
    addDocumentNonBlocking(suggestionRef, fullSuggestion);
  };

  const displayedSuggestions = suggestions || [];
  
  if (isLoading) {
    return (
        <div className="text-center py-20">
            <h2 className="text-2xl font-semibold animate-pulse">Loading Suggestions...</h2>
        </div>
    );
  }

  return (
    <>
      <SuggestionFilters
        onOpenSubmitDialog={handleOpenSubmitDialog}
        onFilterChange={handleFilterChange}
        onSortChange={handleSortChange}
      />
      
      {displayedSuggestions.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
           <AnimatePresence>
            {displayedSuggestions.map((suggestion) => (
               <motion.div
                 key={suggestion.suggestionId}
                 layout
                 initial={{ opacity: 0, scale: 0.9 }}
                 animate={{ opacity: 1, scale: 1 }}
                 exit={{ opacity: 0, scale: 0.9 }}
                 transition={{ duration: 0.3 }}
               >
                <SuggestionCard
                  suggestion={suggestion}
                  onUpvote={handleUpvote}
                  hasUpvoted={upvotedIds.has(suggestion.suggestionId)}
                />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      ) : (
        <div className="text-center py-20 border-2 border-dashed rounded-lg">
            <h2 className="text-2xl font-semibold text-muted-foreground">No Suggestions Found</h2>
            <p className="text-muted-foreground mt-2">Try adjusting your filters or be the first to submit a new idea!</p>
        </div>
      )}

      <SubmitSuggestionDialog
        open={isSubmitDialogOpen}
        onOpenChange={setIsSubmitDialogOpen}
        onSubmit={handleSubmitSuggestion}
      />
    </>
  );
}
