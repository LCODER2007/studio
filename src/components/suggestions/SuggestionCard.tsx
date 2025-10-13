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
import { useState } from "react";
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip";

interface SuggestionCardProps {
  suggestion: Suggestion;
  onUpvote: (suggestionId: string) => void;
  // This would be tracked per user in a real app
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
  const [isUpvoted, setIsUpvoted] = useState(hasUpvoted);

  const handleUpvoteClick = () => {
    if (user) {
      onUpvote(suggestion.suggestionId);
      setIsUpvoted(!isUpvoted);
    }
    // In a real app, you might want to prompt login if not authenticated
  };

  const showUpvotes = suggestion.status === 'SHORTLISTED' || suggestion.status === 'IMPLEMENTED';

  return (
    <Card className="flex flex-col h-full transition-all hover:shadow-md">
      <CardHeader>
        <div className="flex justify-between items-start gap-4">
            <div>
                <Badge variant="outline" className={cn("capitalize", statusColorMap[suggestion.status])}>
                    {suggestion.status.replace(/_/g, " ").toLowerCase()}
                </Badge>
                <CardTitle className="mt-2 text-xl">{suggestion.title}</CardTitle>
            </div>
            <Tooltip>
                <TooltipTrigger>
                    <div className="p-2 rounded-full bg-muted">
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
              <AvatarFallback>{suggestion.authorDisplayName.charAt(0)}</AvatarFallback>
            </Avatar>
            <span>{suggestion.authorDisplayName}</span>
            <span>&bull;</span>
            <span>
              {formatDistanceToNow(suggestion.submissionTimestamp, { addSuffix: true })}
            </span>
          </div>
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-grow">
        <p className="text-sm text-muted-foreground line-clamp-3">
            {suggestion.body}
        </p>
      </CardContent>
      <CardFooter className="flex justify-between items-center">
        <Button
          variant={isUpvoted ? "default" : "outline"}
          size="sm"
          onClick={handleUpvoteClick}
          disabled={!user}
          aria-pressed={isUpvoted}
          className="group transition-all duration-300"
        >
          <ArrowUp className={cn("mr-2 h-4 w-4", isUpvoted ? "transform scale-125" : "group-hover:animate-bounce")} />
          <span>Upvote</span>
          {showUpvotes && (
              <span className="ml-2 tabular-nums">
                {suggestion.upvotesCount + (isUpvoted && !hasUpvoted ? 1 : !isUpvoted && hasUpvoted ? -1 : 0)}
              </span>
          )}
        </Button>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <MessageSquare className="h-4 w-4" />
          <span>{suggestion.commentsCount}</span>
        </div>
      </CardFooter>
    </Card>
  );
}
