
"use client";

import { useState, useMemo, useCallback } from "react";
import type { Suggestion } from "@/lib/types";
import SuggestionCard from "./SuggestionCard";
import SuggestionFilters from "./SuggestionFilters";
import { SubmitSuggestionDialog } from "./SubmitSuggestionDialog";
import { useAuth } from "../auth/AuthContext";
import { AnimatePresence, motion } from "framer-motion";
import { useCollection, useFirestore, useMemoFirebase } from "@/firebase";
import { addDoc, collection, doc, serverTimestamp, query, where, orderBy, Query, DocumentData, runTransaction, updateDoc } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";

type SortOption = "upvotesCount" | "submissionTimestamp";

export default function SuggestionList() {
  const { user } = useAuth();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [isSubmitDialogOpen, setIsSubmitDialogOpen] = useState(false);
  const [sortBy, setSortBy] = useState<SortOption>("submissionTimestamp");
  const [searchQuery, setSearchQuery] = useState("");

  const suggestionsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    
    let q: Query<DocumentData> = collection(firestore, 'suggestions');
    
    // Note: A composite index is required for this query if combining multiple orderBy or where clauses.
    q = query(q, orderBy(sortBy, 'desc'));

    return q;
  }, [firestore, sortBy]);

  const { data: suggestionsData, isLoading } = useCollection<Suggestion>(suggestionsQuery);

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

  const handleSortChange = useCallback((value: SortOption) => {
    setSortBy(value);
  }, []);

  const handleSearchChange = useCallback((value: string) => {
    setSearchQuery(value);
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
                // This toast is for user feedback, not an actual error.
                toast({
                    variant: "destructive",
                    title: "Already Upvoted",
                    description: "You have already upvoted this suggestion.",
                });
                // We return here to stop the transaction from proceeding.
                return;
            }

            const suggestionSnap = await transaction.get(suggestionRef);
            if (!suggestionSnap.exists()) {
                throw new Error("Suggestion does not exist!");
            }

            const newUpvotesCount = (suggestionSnap.data().upvotesCount || 0) + 1;
            transaction.update(suggestionRef, { upvotesCount: newUpvotesCount });
            transaction.set(userVoteRef, { suggestionId: suggestionId, timestamp: serverTimestamp() });
        });

    } catch (e: any) {
      console.error("Upvote transaction failed: ", e.message);
      // We only show a generic error now because specific cases are handled above.
      if (e.message !== "Already upvoted") {
        toast({
          variant: "destructive",
          title: "Upvote Failed",
          description: e.message || "An error occurred. Please try again.",
        });
      }
    }
  }, [firestore, user, toast]);

  const handleSubmitSuggestion = async (newSuggestion: Omit<Suggestion, 'suggestionId'>) => {
    if (!firestore) return;
    const suggestionsCollectionRef = collection(firestore, 'suggestions');
    try {
        const docRef = await addDoc(suggestionsCollectionRef, {
            ...newSuggestion,
        });
        // Now update the document with its own ID
        await updateDoc(docRef, { suggestionId: docRef.id });
    } catch (error) {
        console.error("Error adding suggestion: ", error);
        toast({
            variant: "destructive",
            title: "Submission Failed",
            description: "Could not save your suggestion. Please try again.",
        });
    }
};
  
  const suggestions = useMemo(() => {
    if (!suggestionsData) return [];
    let filteredSuggestions = suggestionsData.map(s => ({ ...s, suggestionId: s.id }));
    if (searchQuery) {
        filteredSuggestions = filteredSuggestions.filter(s =>
            s.title.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }
    return filteredSuggestions;
  }, [suggestionsData, searchQuery]);
  
  if (isLoading) {
    return (
        <div>
            <SuggestionFilters
                onOpenSubmitDialog={handleOpenSubmitDialog}
                onSortChange={handleSortChange}
                onSearchChange={handleSearchChange}
                currentSearch={searchQuery}
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
        onSortChange={handleSortChange}
        onSearchChange={handleSearchChange}
        currentSearch={searchQuery}
      />
      
      {suggestions.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
           <AnimatePresence>
            {suggestions.map((suggestion) => (
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
                  onUpvote={() => handleUpvote(suggestion.suggestionId)}
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
