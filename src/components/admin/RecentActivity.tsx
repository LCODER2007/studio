"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import type { Suggestion } from "@/lib/types";
import { formatDistanceToNow } from "date-fns";

interface RecentActivityProps {
    suggestions: Suggestion[];
}

export function RecentActivity({ suggestions }: RecentActivityProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Submissions</CardTitle>
        <CardDescription>A list of the most recently submitted suggestions.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
            {suggestions.map((suggestion) => {
                 const submissionDate = suggestion.submissionTimestamp instanceof Date 
                    ? suggestion.submissionTimestamp 
                    : (suggestion.submissionTimestamp as any)?.toDate();
                
                return (
                    <div className="flex items-center" key={suggestion.suggestionId}>
                        <Avatar className="h-9 w-9">
                        <AvatarImage src={suggestion.authorPhotoURL || ''} alt="Avatar" />
                        <AvatarFallback>{suggestion.authorDisplayName.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div className="ml-4 space-y-1">
                        <p className="text-sm font-medium leading-none line-clamp-1">{suggestion.title}</p>
                        <p className="text-sm text-muted-foreground">{suggestion.authorDisplayName}</p>
                        </div>
                        <div className="ml-auto font-medium text-sm text-muted-foreground">
                            {submissionDate ? formatDistanceToNow(submissionDate, { addSuffix: true }) : 'just now'}
                        </div>
                    </div>
                );
            })}
        </div>
      </CardContent>
    </Card>
  )
}
