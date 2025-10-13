"use client";

import { useState } from 'react';
import { mockSuggestions } from '@/lib/placeholder-data';
import type { Suggestion } from '@/lib/types';
import AdminSuggestionTable from './AdminSuggestionTable';
import { EditSuggestionSheet } from './EditSuggestionSheet';

export default function AdminDashboard() {
  const [suggestions, setSuggestions] = useState<Suggestion[]>(mockSuggestions);
  const [editingSuggestion, setEditingSuggestion] = useState<Suggestion | null>(null);

  const handleEdit = (suggestion: Suggestion) => {
    setEditingSuggestion(suggestion);
  };

  const handleUpdateSuggestion = (updatedSuggestion: Suggestion) => {
    setSuggestions(prev =>
      prev.map(s => (s.suggestionId === updatedSuggestion.suggestionId ? updatedSuggestion : s))
    );
    // Here you would also call your backend to persist the changes.
    // A Cloud Function would then trigger to send notifications if the status changed to 'SHORTLISTED' or 'IMPLEMENTED'.
    setEditingSuggestion(null);
  };
  
  return (
    <div className="space-y-6">
      <AdminSuggestionTable
        suggestions={suggestions}
        onEdit={handleEdit}
      />
      <EditSuggestionSheet
        suggestion={editingSuggestion}
        open={!!editingSuggestion}
        onOpenChange={(isOpen) => !isOpen && setEditingSuggestion(null)}
        onUpdate={handleUpdateSuggestion}
      />
    </div>
  );
}
