
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

  return (
    <Card className="flex flex-col h-full transition-all hover:shadow-md">
      <CardHeader>
        <div className="flex justify-between items-start gap-4">
          <CardTitle className="mt-2 text-lg">
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
            <Link href={`/profile/${suggestion.authorUid}`} className="flex items-center gap-2 hover:underline">
              <Avatar className="h-5 w-5">
                <AvatarImage src={suggestion.authorPhotoURL ?? ""} />
                <AvatarFallback>{suggestion.authorDisplayName?.charAt(0)}</AvatarFallback>
              </Avatar>
              <span>{suggestion.authorDisplayName}</span>
            </Link>
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
            className="group transition-all duration-300"
          >
            <ArrowUp className={cn("mr-2 h-4 w-4", hasUpvoted ? "text-white" : "group-hover:animate-bounce")} />
            <span>{hasUpvoted ? "Upvoted" : "Upvote"}</span>
            <span className={cn("ml-2 tabular-nums font-semibold", hasUpvoted && "text-white")}>
              {suggestion.upvotesCount}
            </span>
          </Button>
           <Link href={suggestionLink} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary">
            <MessageSquare className="h-4 w-4" />
            <span className="tabular-nums">{suggestion.commentsCount || 0}</span>
          </Link>
        </div>
        <Link href={suggestionLink} className="text-sm text-primary hover:underline">
          View Details
        </Link>
      </CardFooter>
    </Card>
  );
}
