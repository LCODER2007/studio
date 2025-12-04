
"use client";

import { useState, useMemo } from 'react';
import type { Suggestion, SuggestionStatus, SuggestionCategory } from '@/lib/types';
import { SuggestionStatuses, SuggestionCategories } from '@/lib/types';
import AdminSuggestionTable from './AdminSuggestionTable';
import { EditSuggestionSheet } from './EditSuggestionSheet';
import { StatCard } from './StatCard';
import { SuggestionStatusChart } from './SuggestionStatusChart';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, doc, query, orderBy } from 'firebase/firestore';
import { updateDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { FileText, CheckCircle, Clock, Archive, Lightbulb } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import RoleGuard from '@/components/RoleGuard';
import { motion, AnimatePresence } from 'framer-motion';

export default function AdminDashboard() {
  const firestore = useFirestore();
  const [editingSuggestion, setEditingSuggestion] = useState<Suggestion | null>(null);
  const [statusFilter, setStatusFilter] = useState<SuggestionStatus | 'ALL'>('ALL');
  const [categoryFilter, setCategoryFilter] = useState<SuggestionCategory | 'ALL'>('ALL');
  
  // Real-time listener for all suggestions
  const suggestionsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'suggestions'), orderBy('submissionTimestamp', 'desc'));
  }, [firestore]);

  const { data: suggestions, isLoading } = useCollection<Suggestion>(suggestionsQuery);

  // Calculate summary statistics
  const statistics = useMemo(() => {
    if (!suggestions) return {
      total: 0,
      submitted: 0,
      underReview: 0,
      shortlisted: 0,
      archived: 0,
      implemented: 0,
    };

    return {
      total: suggestions.length,
      submitted: suggestions.filter(s => s.status === 'SUBMITTED').length,
      underReview: suggestions.filter(s => s.status === 'UNDER_REVIEW').length,
      shortlisted: suggestions.filter(s => s.status === 'SHORTLISTED').length,
      archived: suggestions.filter(s => s.status === 'ARCHIVED_REJECTED').length,
      implemented: suggestions.filter(s => s.status === 'IMPLEMENTED').length,
    };
  }, [suggestions]);

  // Filter suggestions by status and category
  const filteredSuggestions = useMemo(() => {
    if (!suggestions) return [];
    
    return suggestions.filter(suggestion => {
      const matchesStatus = statusFilter === 'ALL' || suggestion.status === statusFilter;
      const matchesCategory = categoryFilter === 'ALL' || suggestion.category === categoryFilter;
      return matchesStatus && matchesCategory;
    });
  }, [suggestions, statusFilter, categoryFilter]);

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
    <RoleGuard roles={['ADMIN', 'SUPER_ADMIN']}>
      <div className="space-y-6">
        {/* Summary Statistics */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-5">
          {[
            { title: "Total Suggestions", value: statistics.total, icon: FileText },
            { title: "Submitted", value: statistics.submitted, icon: Lightbulb },
            { title: "Under Review", value: statistics.underReview, icon: Clock },
            { title: "Shortlisted", value: statistics.shortlisted, icon: CheckCircle },
            { title: "Implemented", value: statistics.implemented, icon: CheckCircle },
          ].map((stat, index) => (
            <motion.div
              key={stat.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
            >
              <StatCard 
                title={stat.title} 
                value={stat.value} 
                icon={stat.icon} 
              />
            </motion.div>
          ))}
        </div>

        {/* Status Chart */}
        <SuggestionStatusChart suggestions={suggestions || []} />

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle>Filter Suggestions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="status-filter">Status</Label>
                <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as SuggestionStatus | 'ALL')}>
                  <SelectTrigger id="status-filter">
                    <SelectValue placeholder="All Statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All Statuses</SelectItem>
                    {SuggestionStatuses.map(status => (
                      <SelectItem key={status} value={status}>
                        {status.replace(/_/g, ' ')}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="category-filter">Category</Label>
                <Select value={categoryFilter} onValueChange={(value) => setCategoryFilter(value as SuggestionCategory | 'ALL')}>
                  <SelectTrigger id="category-filter">
                    <SelectValue placeholder="All Categories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All Categories</SelectItem>
                    {SuggestionCategories.map(category => (
                      <SelectItem key={category} value={category}>
                        {category.replace(/_/g, ' ')}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Suggestions Table */}
        {filteredSuggestions.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <FileText className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Suggestions Found</h3>
              <p className="text-sm text-muted-foreground text-center">
                {statusFilter !== 'ALL' || categoryFilter !== 'ALL'
                  ? 'Try adjusting your filters to see more results.'
                  : 'No suggestions have been submitted yet.'}
              </p>
            </CardContent>
          </Card>
        ) : (
          <AdminSuggestionTable suggestions={filteredSuggestions} onEdit={handleEdit} />
        )}
        
        {/* Edit Sheet */}
        <EditSuggestionSheet
          suggestion={editingSuggestion}
          open={!!editingSuggestion}
          onOpenChange={(isOpen) => !isOpen && setEditingSuggestion(null)}
          onUpdate={handleUpdateSuggestion}
        />
      </div>
    </RoleGuard>
  );
}
