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

const statusColorMap: Record<Suggestion["status"], string> = {
  SUBMITTED: "bg-blue-100 text-blue-800",
  UNDER_REVIEW: "bg-yellow-100 text-yellow-800",
  SHORTLISTED: "bg-green-100 text-green-800",
  IMPLEMENTED: "bg-purple-100 text-purple-800",
  ARCHIVED_REJECTED: "bg-gray-100 text-gray-800",
};

export default function SuggestionCard({ suggestion, onUpvote, hasUpvoted }: SuggestionCardProps) {
  const { user } = useAuth();
  
  const handleUpvoteClick = () => {
    if (user && !hasUpvoted) {
      onUpvote(suggestion.suggestionId);
    }
  };

  const submissionDate = suggestion.submissionTimestamp instanceof Date 
    ? suggestion.submissionTimestamp 
    : (suggestion.submissionTimestamp as any)?.toDate();
  
  const suggestionLink = `/suggestion/${suggestion.suggestionId}`;

  // Upvote count is only displayed if the suggestion's status is 'SHORTLISTED' or 'IMPLEMENTED'
  const showUpvotes = suggestion.status === 'SHORTLISTED' || suggestion.status === 'IMPLEMENTED';

  return (
    <Card className="flex flex-col h-full transition-all hover:shadow-md">
      <Link href={suggestionLink} className="flex flex-col flex-grow">
        <CardHeader>
          <div className="flex justify-between items-start gap-4">
            <div>
              <Badge variant="outline" className={cn("capitalize", statusColorMap[suggestion.status])}>
                {suggestion.status.replace(/_/g, " ").toLowerCase()}
              </Badge>
              <CardTitle className="mt-2 text-lg">{suggestion.title}</CardTitle>
            </div>
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
              <Avatar className="h-5 w-5">
                <AvatarImage src={suggestion.authorPhotoURL ?? ""} />
                <AvatarFallback>{suggestion.authorDisplayName?.charAt(0)}</AvatarFallback>
              </Avatar>
              <span>{suggestion.authorDisplayName}</span>
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
      </Link>
      <CardFooter className="flex justify-between items-center border-t pt-4">
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
          {showUpvotes && (
            <span className={cn("ml-2 tabular-nums font-semibold", hasUpvoted && "text-white")}>
              {suggestion.upvotesCount}
            </span>
          )}
        </Button>
        <Link href={suggestionLink} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary">
          <MessageSquare className="h-4 w-4" />
          <span>{suggestion.commentsCount || 0}</span>
        </Link>
      </CardFooter>
    </Card>
  );
}
