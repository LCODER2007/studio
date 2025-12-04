
"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PlusCircle, Search, SortAsc, Filter } from "lucide-react";
import { SuggestionCategory, SuggestionStatus } from "@/lib/types";

type SortOption = "upvotesCount" | "submissionTimestamp";

interface SuggestionFiltersProps {
  onOpenSubmitDialog: () => void;
  onSortChange: (value: SortOption) => void;
  onSearchChange: (value: string) => void;
  currentSearch: string;
  onCategoryChange: (value: SuggestionCategory | "ALL") => void;
  onStatusChange: (value: SuggestionStatus | "ALL") => void;
  currentCategory: SuggestionCategory | "ALL";
  currentStatus: SuggestionStatus | "ALL";
}

export default function SuggestionFilters({ 
    onOpenSubmitDialog, 
    onSortChange, 
    onSearchChange,
    currentSearch,
    onCategoryChange,
    onStatusChange,
    currentCategory,
    currentStatus
}: SuggestionFiltersProps) {
  const formatCategoryLabel = (category: string) => {
    return category.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
  };

  const formatStatusLabel = (status: string) => {
    return status.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
  };

  return (
    <div className="flex flex-col gap-4 mb-6">
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative w-full md:flex-grow">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search suggestions..."
              className="w-full pl-10"
              onChange={(e) => onSearchChange(e.target.value)}
              value={currentSearch}
            />
        </div>
        <Button onClick={onOpenSubmitDialog} variant="accent" className="w-full md:w-auto">
          <PlusCircle className="mr-2 h-4 w-4" />
          New Suggestion
        </Button>
      </div>
      
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative w-full sm:flex-1">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Select value={currentCategory} onValueChange={(value) => onCategoryChange(value as SuggestionCategory | "ALL")}>
              <SelectTrigger className="w-full pl-10">
                <SelectValue placeholder="Filter by category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Categories</SelectItem>
                <SelectItem value="ACADEMIC_CURRICULUM">{formatCategoryLabel("ACADEMIC_CURRICULUM")}</SelectItem>
                <SelectItem value="INFRASTRUCTURE_IT">{formatCategoryLabel("INFRASTRUCTURE_IT")}</SelectItem>
                <SelectItem value="TECHNICAL_DESIGN">{formatCategoryLabel("TECHNICAL_DESIGN")}</SelectItem>
                <SelectItem value="ENVIRONMENTAL_SUSTAINABILITY">{formatCategoryLabel("ENVIRONMENTAL_SUSTAINABILITY")}</SelectItem>
                <SelectItem value="ADMINISTRATIVE_SEES">{formatCategoryLabel("ADMINISTRATIVE_SEES")}</SelectItem>
                <SelectItem value="OTHER">{formatCategoryLabel("OTHER")}</SelectItem>
              </SelectContent>
            </Select>
        </div>
        
        <div className="relative w-full sm:flex-1">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Select value={currentStatus} onValueChange={(value) => onStatusChange(value as SuggestionStatus | "ALL")}>
              <SelectTrigger className="w-full pl-10">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Statuses</SelectItem>
                <SelectItem value="SUBMITTED">{formatStatusLabel("SUBMITTED")}</SelectItem>
                <SelectItem value="UNDER_REVIEW">{formatStatusLabel("UNDER_REVIEW")}</SelectItem>
                <SelectItem value="SHORTLISTED">{formatStatusLabel("SHORTLISTED")}</SelectItem>
                <SelectItem value="ARCHIVED_REJECTED">{formatStatusLabel("ARCHIVED_REJECTED")}</SelectItem>
                <SelectItem value="IMPLEMENTED">{formatStatusLabel("IMPLEMENTED")}</SelectItem>
              </SelectContent>
            </Select>
        </div>
        
        <div className="relative w-full sm:flex-1">
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
    </div>
  );
}
