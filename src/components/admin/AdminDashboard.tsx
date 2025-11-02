
"use client";

import { useState } from 'react';
import type { Suggestion } from '@/lib/types';
import AdminSuggestionTable from './AdminSuggestionTable';
import { EditSuggestionSheet } from './EditSuggestionSheet';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, doc, query, orderBy } from 'firebase/firestore';
import { updateDocumentNonBlocking } from '@/firebase/non-blocking-updates';

export default function AdminDashboard() {
  const firestore = useFirestore();
  const [editingSuggestion, setEditingSuggestion] = useState<Suggestion | null>(null);
  
  const suggestionsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'suggestions'), orderBy('submissionTimestamp', 'desc'));
  }, [firestore]);

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
      <AdminSuggestionTable suggestions={suggestions || []} onEdit={handleEdit} />
      <EditSuggestionSheet
        suggestion={editingSuggestion}
        open={!!editingSuggestion}
        onOpenChange={(isOpen) => !isOpen && setEditingSuggestion(null)}
        onUpdate={handleUpdateSuggestion}
      />
    </div>
  );
}
