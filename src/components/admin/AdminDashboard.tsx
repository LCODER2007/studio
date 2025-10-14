"use client";

import { useState } from 'react';
import type { Suggestion } from '@/lib/types';
import AdminSuggestionTable from './AdminSuggestionTable';
import { EditSuggestionSheet } from './EditSuggestionSheet';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, doc, query, where, orderBy, Query, DocumentData } from 'firebase/firestore';
import { updateDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { Button } from '../ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../ui/dropdown-menu';
import { ChevronDown } from 'lucide-react';

export default function AdminDashboard() {
  const firestore = useFirestore();
  const [editingSuggestion, setEditingSuggestion] = useState<Suggestion | null>(null);
  const [filters, setFilters] = useState<{ status: string; scoreType: string | null }>({
    status: 'SUBMITTED',
    scoreType: null,
  });

  const suggestionsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    let q: Query<DocumentData> = collection(firestore, 'suggestions');

    if (filters.status !== 'all') {
      q = query(q, where('status', '==', filters.status));
    }

    if (filters.scoreType) {
      q = query(q, orderBy(filters.scoreType, 'desc'));
    } else {
      q = query(q, orderBy('submissionTimestamp', 'desc'));
    }

    return q;
  }, [firestore, filters]);

  const { data: suggestions, isLoading } = useCollection<Suggestion>(suggestionsQuery);

  const handleEdit = (suggestion: Suggestion) => {
    setEditingSuggestion(suggestion);
  };

  const handleUpdateSuggestion = (updatedSuggestion: Suggestion) => {
    if (!firestore) return;
    const suggestionRef = doc(firestore, 'suggestions', updatedSuggestion.suggestionId);
    updateDocumentNonBlocking(suggestionRef, updatedSuggestion);
    setEditingSuggestion(null);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-lg animate-pulse">Loading Suggestions...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-end space-x-4">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline">
              Filter by Score <ChevronDown className="ml-2 h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onSelect={() => setFilters(prev => ({ ...prev, scoreType: null }))}>None</DropdownMenuItem>
            <DropdownMenuItem onSelect={() => setFilters(prev => ({ ...prev, scoreType: 'impactScore' }))}>Impact Score</DropdownMenuItem>
            <DropdownMenuItem onSelect={() => setFilters(prev => ({ ...prev, scoreType: 'feasibilityRating' }))}>Feasibility Rating</DropdownMenuItem>
            <DropdownMenuItem onSelect={() => setFilters(prev => ({ ...prev, scoreType: 'costEffectivenessRating' }))}>Cost-Effectiveness</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <AdminSuggestionTable suggestions={suggestions || []} onEdit={handleEdit} onFilterStatusChange={(status) => setFilters(prev => ({ ...prev, status }))} />

      <EditSuggestionSheet
        suggestion={editingSuggestion}
        open={!!editingSuggestion}
        onOpenChange={(isOpen) => !isOpen && setEditingSuggestion(null)}
        onUpdate={handleUpdateSuggestion}
      />
    </div>
  );
}
