
"use client";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PlusCircle, SortAsc } from "lucide-react";

type SortOption = "upvotesCount" | "submissionTimestamp";

interface SuggestionFiltersProps {
  onOpenSubmitDialog: () => void;
  onSortChange: (value: SortOption) => void;
}

export default function SuggestionFilters({ onOpenSubmitDialog, onSortChange }: SuggestionFiltersProps) {
  return (
    <div className="flex flex-col md:flex-row gap-4 mb-6">
      <div className="flex-grow flex flex-col sm:flex-row gap-4">
        <div className="relative w-full sm:w-auto flex-grow">
            <SortAsc className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Select defaultValue="submissionTimestamp" onValueChange={(value) => onSortChange(value as SortOption)}>
              <SelectTrigger className="w-full pl-10">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="submissionTimestamp">Most Recent</SelectItem>
                <SelectItem value="upvotesCount">Most Upvoted</SelectItem>
              </SelectContent>
            </Select>
        </div>
      </div>
      <Button onClick={onOpenSubmitDialog} className="w-full md:w-auto">
        <PlusCircle className="mr-2 h-4 w-4" />
        New Suggestion
      </Button>
    </div>
  );
}
