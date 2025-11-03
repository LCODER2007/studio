
"use client";

import { useMemo } from 'react';
import { useParams } from 'next/navigation';
import { useDoc, useFirestore, useMemoFirebase } from '@/firebase';
import type { Suggestion } from '@/lib/types';
import { doc } from 'firebase/firestore';
import Header from '@/components/layout/Header';
import SuggestionDetail from '@/components/suggestions/SuggestionDetail';
import { useAuth } from '@/components/auth/AuthContext';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import CommentSection from '@/components/suggestions/CommentSection';

export default function SuggestionPage() {
    const { id } = useParams();
    const suggestionId = Array.isArray(id) ? id[0] : id;
    const firestore = useFirestore();
    const { user, loading: userLoading } = useAuth();

    const suggestionRef = useMemoFirebase(() => {
        if (!firestore || !suggestionId) return null;
        return doc(firestore, 'suggestions', suggestionId);
    }, [firestore, suggestionId]);
    
    const { data: suggestion, isLoading: isLoadingSuggestion } = useDoc<Suggestion>(suggestionRef);

    const isLoading = isLoadingSuggestion || userLoading;

    if (isLoading) {
        return (
            <div className="flex flex-col min-h-screen bg-background">
                <Header />
                <main className="flex-1 container mx-auto px-4 py-8">
                    <div className="space-y-4">
                      <div className="w-full h-40 bg-muted rounded-lg animate-pulse"></div>
                      <div className="w-full h-20 bg-muted rounded-lg animate-pulse"></div>
                      <div className="w-full h-48 bg-muted rounded-lg animate-pulse mt-6"></div>
                    </div>
                </main>
            </div>
        );
    }

    if (!suggestion) {
        return (
            <div className="flex flex-col min-h-screen bg-background">
                <Header />
                <main className="flex-1 container mx-auto px-4 py-8">
                    <div className="text-center py-20 border-2 border-dashed rounded-lg">
                        <h1 className="text-2xl font-bold text-muted-foreground">Suggestion Not Found</h1>
                        <p className="text-muted-foreground mt-2">The suggestion you are looking for does not exist or may have been deleted.</p>
                        <Button asChild className="mt-4">
                            <Link href="/">Go Home</Link>
                        </Button>
                    </div>
                </main>
            </div>
        );
    }

    return (
        <div className="flex flex-col min-h-screen bg-background">
            <Header />
            <main className="flex-1 container mx-auto px-4 py-8 max-w-4xl">
              <SuggestionDetail suggestion={{ ...suggestion, suggestionId: suggestion.id }} />
              <div className="mt-6">
                <CommentSection suggestionId={suggestion.id} />
              </div>
            </main>
        </div>
    );
}
