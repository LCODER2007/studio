"use client";

import { useState, useMemo, useCallback } from "react";
import { mockSuggestions } from "@/lib/placeholder-data";
import type { Suggestion, SuggestionCategory, SuggestionStatus } from "@/lib/types";
import SuggestionCard from "./SuggestionCard";
import SuggestionFilters from "./SuggestionFilters";
import { SubmitSuggestionDialog } from "./SubmitSuggestionDialog";
import { useAuth } from "../auth/AuthContext";
import { AnimatePresence, motion } from "framer-motion";

type SortOption = "upvotesCount" | "submissionTimestamp";

export default function SuggestionList() {
  const { user } = useAuth();
  const [suggestions, setSuggestions] = useState<Suggestion[]>(mockSuggestions);
  const [isSubmitDialogOpen, setIsSubmitDialogOpen] = useState(false);
  const [filters, setFilters] = useState<{ category: string; status: string }>({ category: "all", status: "all" });
  const [sortBy, setSortBy] = useState<SortOption>("submissionTimestamp");
  const [upvotedIds, setUpvotedIds] = useState<Set<string>>(new Set());

  const handleOpenSubmitDialog = () => {
    if (user) {
      setIsSubmitDialogOpen(true);
    } else {
      // In a real app, you'd trigger a login modal here
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
    setUpvotedIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(suggestionId)) {
        newSet.delete(suggestionId);
      } else {
        newSet.add(suggestionId);
      }
      return newSet;
    });
  }, []);

  const handleSubmitSuggestion = (newSuggestion: Omit<Suggestion, 'suggestionId' | 'upvotesCount' | 'commentsCount'>) => {
    const suggestionWithId: Suggestion = {
      ...newSuggestion,
      suggestionId: crypto.randomUUID(),
      upvotesCount: 0,
      commentsCount: 0,
    };
    setSuggestions(prev => [suggestionWithId, ...prev]);
  };

  const filteredAndSortedSuggestions = useMemo(() => {
    return suggestions
      .filter(s => filters.category === 'all' || s.category === filters.category)
      .filter(s => filters.status === 'all' || s.status === filters.status)
      .sort((a, b) => {
        if (sortBy === 'upvotesCount') {
          return b.upvotesCount - a.upvotesCount;
        }
        return b.submissionTimestamp.getTime() - a.submissionTimestamp.getTime();
      });
  }, [suggestions, filters, sortBy]);

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
