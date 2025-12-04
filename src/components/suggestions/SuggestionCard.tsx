
"use client";

import type { Suggestion } from "@/lib/types";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ArrowUp, MessageSquare } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { CategoryIcon } from "./CategoryIcon";
import { useAuth } from "../auth/AuthContext";
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip";
import Link from 'next/link';
import { motion, AnimatePresence } from "framer-motion";

interface SuggestionCardProps {
  suggestion: Suggestion;
  onUpvote: (suggestionId: string) => void;
  hasUpvoted: boolean;
}

export default function SuggestionCard({ suggestion, onUpvote, hasUpvoted }: SuggestionCardProps) {
  const { user } = useAuth();
  
  const handleUpvoteClick = () => {
    if (user) {
      onUpvote(suggestion.suggestionId);
    }
  };

  const submissionDate = suggestion.submissionTimestamp instanceof Date 
    ? suggestion.submissionTimestamp 
    : (suggestion.submissionTimestamp as any)?.toDate();
  
  const suggestionLink = `/suggestion/${suggestion.suggestionId}`;
  
  // Determine if upvote count should be displayed based on status
  const shouldShowUpvoteCount = suggestion.status === 'SHORTLISTED' || suggestion.status === 'IMPLEMENTED';
  
  // Display "Anonymous" for anonymous submissions
  const displayName = suggestion.authorUid === 'ANONYMOUS' ? 'Anonymous' : (suggestion.authorDisplayName || 'Unknown');
  const isAnonymous = suggestion.authorUid === 'ANONYMOUS';

  return (
    <Card className="flex flex-col h-full transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
      <CardHeader>
        <div className="flex justify-between items-start gap-4">
          <CardTitle className="mt-2 text-lg line-clamp-2 flex-1">
              <Link href={suggestionLink} className="hover:underline">
                  {suggestion.title}
              </Link>
          </CardTitle>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="p-2 rounded-full bg-muted cursor-pointer">
                  <CategoryIcon category={suggestion.category} className="w-5 h-5 text-muted-foreground" />
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p className="capitalize">{suggestion.category.replace(/_/g, " ").toLowerCase()}</p>
            </TooltipContent>
          </Tooltip>
        </div>
        <CardDescription>
          <div className="flex items-center gap-2 text-xs text-muted-foreground pt-2">
            {isAnonymous ? (
              <div className="flex items-center gap-2">
                <Avatar className="h-5 w-5">
                  <AvatarFallback>A</AvatarFallback>
                </Avatar>
                <span>{displayName}</span>
              </div>
            ) : (
              <Link href={`/profile/${suggestion.authorUid}`} className="flex items-center gap-2 hover:underline">
                <Avatar className="h-5 w-5">
                  <AvatarImage src={suggestion.authorPhotoURL ?? ""} />
                  <AvatarFallback>{displayName.charAt(0)}</AvatarFallback>
                </Avatar>
                <span>{displayName}</span>
              </Link>
            )}
            <span>&bull;</span>
            <span>
              {submissionDate ? formatDistanceToNow(submissionDate, { addSuffix: true }) : 'just now'}
            </span>
          </div>
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-grow">
        <p className="text-sm text-muted-foreground line-clamp-3">
          {suggestion.body}
        </p>
      </CardContent>
      <CardFooter className="flex justify-between items-center border-t pt-4">
        <div className="flex items-center gap-4">
          <Button
            variant={hasUpvoted ? "default" : "outline"}
            size="sm"
            onClick={handleUpvoteClick}
            disabled={!user || hasUpvoted}
            aria-pressed={hasUpvoted}
            className="group transition-all duration-300 hover:scale-105 active:scale-95"
          >
            <motion.div
              animate={hasUpvoted ? { y: [0, -4, 0] } : {}}
              transition={{ duration: 0.3 }}
            >
              <ArrowUp className={cn("mr-2 h-4 w-4", hasUpvoted ? "text-white" : "group-hover:animate-bounce")} />
            </motion.div>
            <span>{hasUpvoted ? "Upvoted" : "Upvote"}</span>
            {shouldShowUpvoteCount && (
              <AnimatePresence mode="wait">
                <motion.span
                  key={suggestion.upvotesCount}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  transition={{ duration: 0.2 }}
                  className={cn("ml-2 tabular-nums font-semibold", hasUpvoted && "text-white")}
                >
                  {suggestion.upvotesCount}
                </motion.span>
              </AnimatePresence>
            )}
          </Button>
           <Link href={suggestionLink} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors">
            <MessageSquare className="h-4 w-4" />
            <AnimatePresence mode="wait">
              <motion.span
                key={suggestion.commentsCount || 0}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.2 }}
                className="tabular-nums"
              >
                {suggestion.commentsCount || 0}
              </motion.span>
            </AnimatePresence>
          </Link>
        </div>
        <Link href={suggestionLink} className="text-sm text-primary hover:underline">
          View Details
        </Link>
      </CardFooter>
    </Card>
  );
}
