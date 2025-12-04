
"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import type { Suggestion, SuggestionCategory, SuggestionStatus, Vote } from "@/lib/types";
import SuggestionCard from "./SuggestionCard";
import SuggestionFilters from "./SuggestionFilters";
import { SubmitSuggestionDialog } from "./SubmitSuggestionDialog";
import { SuggestionCardSkeleton } from "./SuggestionCardSkeleton";
import { useAuth } from "../auth/AuthContext";
import { AnimatePresence, motion } from "framer-motion";
import { useCollection, useFirestore, useMemoFirebase } from "@/firebase";
import { collection, doc, serverTimestamp, query, where, orderBy, setDoc } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { addVote } from "@/lib/upvote-service";
import { retryWithBackoff, getFirebaseErrorMessage, isNetworkError } from "@/lib/retry-utils";

type SortOption = "upvotesCount" | "submissionTimestamp";

export default function SuggestionList() {
  const { user } = useAuth();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [isSubmitDialogOpen, setIsSubmitDialogOpen] = useState(false);
  const [sortBy, setSortBy] = useState<SortOption>("submissionTimestamp");
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<SuggestionCategory | "ALL">("ALL");
  const [statusFilter, setStatusFilter] = useState<SuggestionStatus | "ALL">("ALL");

  const suggestionsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    
    const constraints = [];
    
    // Add category filter if not "ALL"
    if (categoryFilter !== "ALL") {
      constraints.push(where('category', '==', categoryFilter));
    }
    
    // Add status filter if not "ALL"
    if (statusFilter !== "ALL") {
      constraints.push(where('status', '==', statusFilter));
    }
    
    // Add ordering - must come after where clauses
    constraints.push(orderBy(sortBy, 'desc'));
    
    // Note: A composite index may be required for this query if combining multiple where clauses with orderBy.
    const q = query(collection(firestore, 'suggestions'), ...constraints);

    return q;
  }, [firestore, sortBy, categoryFilter, statusFilter]);

  const { data: suggestionsData, isLoading } = useCollection<Suggestion>(suggestionsQuery);

  // Query user's votes from the votes collection
  const userVotesQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(
      collection(firestore, 'votes'),
      where('voterUid', '==', user.uid)
    );
  }, [firestore, user]);

  const { data: userVotes } = useCollection<Vote>(userVotesQuery);
  const upvotedIds = useMemo(() => new Set(userVotes?.map(v => v.suggestionId) || []), [userVotes]);
  
  // Track optimistic updates
  const [optimisticUpvotes, setOptimisticUpvotes] = useState<Set<string>>(new Set());

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

  const handleCategoryChange = useCallback((value: SuggestionCategory | "ALL") => {
    setCategoryFilter(value);
  }, []);

  const handleStatusChange = useCallback((value: SuggestionStatus | "ALL") => {
    setStatusFilter(value);
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

    // Check if already upvoted (including optimistic updates)
    if (upvotedIds.has(suggestionId) || optimisticUpvotes.has(suggestionId)) {
      toast({
        variant: "destructive",
        title: "Already Upvoted",
        description: "You have already upvoted this suggestion.",
      });
      return;
    }

    // Optimistic UI update
    setOptimisticUpvotes(prev => new Set(prev).add(suggestionId));

    try {
      // Add vote using the service function with retry logic
      await retryWithBackoff(async () => {
        await addVote(firestore, user.uid, suggestionId);
      });
      
      // Success - the Cloud Function will handle incrementing the count
      toast({
        title: "Upvoted!",
        description: "Your vote has been recorded.",
      });
    } catch (error: any) {
      console.error("Upvote failed:", error);
      
      // Rollback optimistic update on error
      setOptimisticUpvotes(prev => {
        const newSet = new Set(prev);
        newSet.delete(suggestionId);
        return newSet;
      });
      
      const errorMessage = getFirebaseErrorMessage(error);
      
      toast({
        variant: "destructive",
        title: "Upvote Failed",
        description: errorMessage,
      });
    }
  }, [firestore, user, toast, upvotedIds, optimisticUpvotes]);

  const handleSubmitSuggestion = async (newSuggestion: Omit<Suggestion, 'suggestionId'> & { suggestionId: string }) => {
    if (!firestore) {
      toast({
        variant: "destructive",
        title: "Connection Error",
        description: "Unable to connect to the database. Please try again.",
      });
      return;
    }
    
    try {
      // Use the provided suggestionId as the document ID
      const docRef = doc(firestore, 'suggestions', newSuggestion.suggestionId);
      
      // Retry with exponential backoff for transient failures
      await retryWithBackoff(async () => {
        await setDoc(docRef, {
          ...newSuggestion,
        });
      });
      
      // Success toast is shown by SubmitSuggestionDialog
    } catch (error: any) {
      console.error("Error adding suggestion: ", error);
      
      const errorMessage = getFirebaseErrorMessage(error);
      const shouldRetry = isNetworkError(error);
      
      toast({
        variant: "destructive",
        title: "Submission Failed",
        description: shouldRetry 
          ? `${errorMessage} The operation was retried but failed.`
          : errorMessage,
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
  
  // Check if a suggestion has been upvoted (including optimistic updates)
  const hasUpvoted = useCallback((suggestionId: string) => {
    return upvotedIds.has(suggestionId) || optimisticUpvotes.has(suggestionId);
  }, [upvotedIds, optimisticUpvotes]);
  
  if (isLoading) {
    return (
        <div>
            <SuggestionFilters
                onOpenSubmitDialog={handleOpenSubmitDialog}
                onSortChange={handleSortChange}
                onSearchChange={handleSearchChange}
                currentSearch={searchQuery}
                onCategoryChange={handleCategoryChange}
                onStatusChange={handleStatusChange}
                currentCategory={categoryFilter}
                currentStatus={statusFilter}
            />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => (
                    <SuggestionCardSkeleton key={i} />
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
        onCategoryChange={handleCategoryChange}
        onStatusChange={handleStatusChange}
        currentCategory={categoryFilter}
        currentStatus={statusFilter}
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
                  hasUpvoted={hasUpvoted(suggestion.suggestionId)}
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
