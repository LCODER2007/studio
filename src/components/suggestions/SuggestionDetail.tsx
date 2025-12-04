
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
import Link from "next/link";
import { motion } from "framer-motion";

interface SuggestionDetailProps {
  suggestion: Suggestion;
}

export default function SuggestionDetail({ suggestion }: SuggestionDetailProps) {
  const submissionDate = suggestion.submissionTimestamp instanceof Date
    ? suggestion.submissionTimestamp
    : (suggestion.submissionTimestamp as any).toDate();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start gap-4">
            <div>
              <div className="flex items-center gap-4">
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
              <CardTitle className="mt-4 text-2xl md:text-3xl font-bold">{suggestion.title}</CardTitle>
            </div>
          </div>
          <CardDescription>
            <div className="flex items-center gap-2 text-sm text-muted-foreground pt-4">
              {suggestion.authorUid === 'ANONYMOUS' ? (
                <div className="flex items-center gap-2">
                  <Avatar className="h-6 w-6">
                    <AvatarFallback>A</AvatarFallback>
                  </Avatar>
                  <span>Anonymous</span>
                </div>
              ) : (
                <Link href={`/profile/${suggestion.authorUid}`} className="flex items-center gap-2 hover:underline">
                  <Avatar className="h-6 w-6">
                    <AvatarImage src={suggestion.authorPhotoURL ?? ""} />
                    <AvatarFallback>{(suggestion.authorDisplayName || 'U').charAt(0)}</AvatarFallback>
                  </Avatar>
                  <span>{suggestion.authorDisplayName || 'Unknown User'}</span>
                </Link>
              )}
              <span>&bull;</span>
              <span>
                {format(submissionDate, "PPP")}
              </span>
            </div>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-base text-foreground/80 whitespace-pre-wrap break-words">
            {suggestion.body}
          </p>
        </CardContent>
      </Card>
    </motion.div>
  );
}
