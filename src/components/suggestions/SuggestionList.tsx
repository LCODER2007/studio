"use client";

import { useState, useMemo, useCallback } from "react";
import type { Suggestion, SuggestionCategory, SuggestionStatus } from "@/lib/types";
import SuggestionCard from "./SuggestionCard";
import SuggestionFilters from "./SuggestionFilters";
import { SubmitSuggestionDialog } from "./SubmitSuggestionDialog";
import { useAuth } from "../auth/AuthContext";
import { AnimatePresence, motion } from "framer-motion";
import { useCollection, useFirestore, useMemoFirebase } from "@/firebase";
import { addDocumentNonBlocking, updateDocumentNonBlocking } from "@/firebase/non-blocking-updates";
import { collection, doc, serverTimestamp } from "firebase/firestore";

type SortOption = "upvotesCount" | "submissionTimestamp";

export default function SuggestionList() {
  const { user } = useAuth();
  const firestore = useFirestore();
  const [isSubmitDialogOpen, setIsSubmitDialogOpen] = useState(false);
  const [filters, setFilters] = useState<{ category: string; status: string }>({ category: "all", status: "all" });
  const [sortBy, setSortBy] = useState<SortOption>("submissionTimestamp");
  
  const suggestionsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, 'suggestions');
  }, [firestore]);

  const { data: suggestions, isLoading } = useCollection<Suggestion>(suggestionsQuery);

  const userVotesQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return collection(firestore, 'user_votes', user.uid, 'suggestions');
  }, [firestore, user]);
  const { data: userVotes } = useCollection(userVotesQuery);
  const upvotedIds = useMemo(() => new Set(userVotes?.map(v => v.id) || []), [userVotes]);


  const handleOpenSubmitDialog = () => {
    if (user) {
      setIsSubmitDialogOpen(true);
    } else {
      alert("Please sign in to submit a suggestion.");
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
    const voteRef = doc(collection(firestore, 'votes'));
    addDocumentNonBlocking(collection(firestore, 'votes'), {
        voteId: voteRef.id,
        suggestionId,
        voterUid: user.uid,
        timestamp: serverTimestamp(),
    });
  }, [firestore, user]);

  const handleSubmitSuggestion = (newSuggestion: Omit<Suggestion, 'suggestionId' | 'upvotesCount' | 'commentsCount'>) => {
    if (!firestore) return;
    const suggestionRef = doc(collection(firestore, 'suggestions'));
    const suggestionWithId: Suggestion = {
      ...newSuggestion,
      suggestionId: suggestionRef.id,
      upvotesCount: 0,
      commentsCount: 0,
      submissionTimestamp: new Date(),
    };
    addDocumentNonBlocking(collection(firestore, 'suggestions'), suggestionWithId);
  };

  const filteredAndSortedSuggestions = useMemo(() => {
    if (!suggestions) return [];
    return suggestions
      .filter(s => filters.category === 'all' || s.category === filters.category)
      .filter(s => filters.status === 'all' || s.status === filters.status)
      .sort((a, b) => {
        if (sortBy === 'upvotesCount') {
          return b.upvotesCount - a.upvotesCount;
        }
        const dateA = a.submissionTimestamp instanceof Date ? a.submissionTimestamp.getTime() : a.submissionTimestamp.toMillis();
        const dateB = b.submissionTimestamp instanceof Date ? b.submissionTimestamp.getTime() : b.submissionTimestamp.toMillis();
        return dateB - dateA;
      });
  }, [suggestions, filters, sortBy]);
  
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
      
      {filteredAndSortedSuggestions.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
           <AnimatePresence>
            {filteredAndSortedSuggestions.map((suggestion) => (
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
        <div className="text-center py-20">
            <h2 className="text-2xl font-semibold">No Suggestions Found</h2>
            <p className="text-muted-foreground mt-2">Try adjusting your filters or be the first to submit!</p>
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

    