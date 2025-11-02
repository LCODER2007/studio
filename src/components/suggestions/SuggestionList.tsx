
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
import { collection, doc, serverTimestamp, query, where, orderBy, Query, DocumentData, runTransaction } from "firebase/firestore";
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

    if (filters.category !== 'all') {
      q = query(q, where('category', '==', filters.category));
    }

    q = query(q, orderBy(sortBy, 'desc'));

    return q;
  }, [firestore, filters.category, sortBy]);

  const { data: suggestions, isLoading } = useCollection<Suggestion>(suggestionsQuery);

  const userVotesQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return collection(firestore, `users/${user.uid}/user_votes`);
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

  const handleUpvote = useCallback(async (suggestionId: string) => {
    if (!firestore || !user) {
      toast({
        variant: "destructive",
        title: "Authentication Required",
        description: "Please log in to upvote.",
      });
      return;
    }

    const suggestionRef = doc(firestore, "suggestions", suggestionId);
    const userVoteRef = doc(firestore, "users", user.uid, "user_votes", suggestionId);

    try {
        await runTransaction(firestore, async (transaction) => {
            const userVoteSnap = await transaction.get(userVoteRef);

            if (userVoteSnap.exists()) {
                throw new Error("Already upvoted");
            }

            const suggestionSnap = await transaction.get(suggestionRef);
            if (!suggestionSnap.exists()) {
                throw new Error("Suggestion does not exist!");
            }

            const newUpvotesCount = (suggestionSnap.data().upvotesCount || 0) + 1;
            transaction.update(suggestionRef, { upvotesCount: newUpvotesCount });
            transaction.set(userVoteRef, { suggestionId: suggestionId, timestamp: serverTimestamp() });
        });

        toast({
            title: "Upvoted!",
            description: "Your vote has been successfully counted.",
        });

    } catch (e: any) {
      console.error("Upvote transaction failed: ", e.message);
      if (e.message === "Already upvoted") {
        toast({
          variant: "destructive",
          title: "Already Upvoted",
          description: "You have already upvoted this suggestion.",
        });
      } else {
        toast({
          variant: "destructive",
          title: "Upvote Failed",
          description: e.message || "An error occurred. Please try again.",
        });
      }
    }
  }, [firestore, user, toast]);

  const handleSubmitSuggestion = (newSuggestion: Omit<Suggestion, 'suggestionId'>) => {
    if (!firestore) return;
    const suggestionRef = doc(collection(firestore, 'suggestions'));
    const fullSuggestion: Suggestion = {
      ...newSuggestion,
      suggestionId: suggestionRef.id, // Ensure the ID is set for local state updates if needed
    };
    addDocumentNonBlocking(suggestionRef, fullSuggestion);
  };
  
  const displayedSuggestions = useMemo(() => {
    if (!suggestions) return [];
    // The useCollection hook already adds `id`. We just need to make sure our type matches.
    // We'll rename `id` to `suggestionId` for consistency within our app components.
    return suggestions.map(s => ({ ...s, suggestionId: s.id }));
  }, [suggestions]);
  
  if (isLoading) {
    return (
        <div>
            <SuggestionFilters
                onOpenSubmitDialog={handleOpenSubmitDialog}
                onFilterChange={handleFilterChange}
                onSortChange={handleSortChange}
            />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => (
                    <div key={i} className="h-[350px] w-full animate-pulse rounded-lg bg-muted" />
                ))}
            </div>
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
