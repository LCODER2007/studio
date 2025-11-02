
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
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { CategoryIcon } from "./CategoryIcon";
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip";
import CommentSection from "./CommentSection";
import Link from "next/link";

interface SuggestionDetailProps {
  suggestion: Suggestion;
}

const statusColorMap: Record<Suggestion["status"], string> = {
  SUBMITTED: "bg-blue-100 text-blue-800",
  UNDER_REVIEW: "bg-yellow-100 text-yellow-800",
  SHORTLISTED: "bg-green-100 text-green-800",
  IMPLEMENTED: "bg-purple-100 text-purple-800",
  ARCHIVED_REJECTED: "bg-gray-100 text-gray-800",
};

export default function SuggestionDetail({ suggestion }: SuggestionDetailProps) {
  const submissionDate = suggestion.submissionTimestamp instanceof Date
    ? suggestion.submissionTimestamp
    : (suggestion.submissionTimestamp as any).toDate();

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start gap-4">
            <div>
              <div className="flex items-center gap-4">
                  <Badge variant="outline" className={cn("capitalize", statusColorMap[suggestion.status])}>
                  {suggestion.status.replace(/_/g, " ").toLowerCase()}
                  </Badge>
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
              <CardTitle className="mt-4 text-3xl font-bold">{suggestion.title}</CardTitle>
            </div>
          </div>
          <CardDescription>
            <div className="flex items-center gap-2 text-sm text-muted-foreground pt-4">
              <Link href={`/profile/${suggestion.authorUid}`} className="flex items-center gap-2 hover:underline">
                  <Avatar className="h-6 w-6">
                    <AvatarImage src={suggestion.authorPhotoURL ?? ""} />
                    <AvatarFallback>{suggestion.authorDisplayName?.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <span>{suggestion.authorDisplayName}</span>
              </Link>
              <span>&bull;</span>
              <span>
                {format(submissionDate, "PPP")}
              </span>
            </div>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-base text-foreground/80 whitespace-pre-wrap">
            {suggestion.body}
          </p>
        </CardContent>
      </Card>
      
      <CommentSection suggestionId={suggestion.suggestionId} />

    </div>
  );
}
