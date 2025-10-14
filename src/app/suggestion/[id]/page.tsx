"use client";

import { useMemo } from 'react';
import { useParams } from 'next/navigation';
import { useDoc, useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import type { Suggestion, Comment as CommentType } from '@/lib/types';
import { doc, collection, query, orderBy, where, serverTimestamp } from 'firebase/firestore';
import Header from '@/components/layout/Header';
import SuggestionDetail from '@/components/suggestions/SuggestionDetail';
import CommentList from '@/components/comments/CommentList';
import AddCommentForm from '@/components/comments/AddCommentForm';
import { addDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { useAuth } from '@/components/auth/AuthContext';
import { useToast } from '@/hooks/use-toast';

export default function SuggestionPage() {
    const { id } = useParams();
    const suggestionId = Array.isArray(id) ? id[0] : id;
    const firestore = useFirestore();
    const { user } = useAuth();
    const { toast } = useToast();

    const suggestionRef = useMemoFirebase(() => {
        if (!firestore || !suggestionId) return null;
        return doc(firestore, 'suggestions', suggestionId);
    }, [firestore, suggestionId]);
    const { data: suggestion, isLoading: isLoadingSuggestion } = useDoc<Suggestion>(suggestionRef);

    const commentsQuery = useMemoFirebase(() => {
        if (!firestore || !suggestionId) return null;
        // This query fetches comments specifically for the current suggestion, ordered by time.
        return query(collection(firestore, 'comments'), where('suggestionId', '==', suggestionId), orderBy('timestamp', 'asc'));
    }, [firestore, suggestionId]);
    const { data: comments, isLoading: isLoadingComments } = useCollection<CommentType>(commentsQuery);

    const handleAddComment = (commentBody: string) => {
        if (!firestore || !user || !suggestionId) {
             toast({
                variant: "destructive",
                title: "Error",
                description: "You must be logged in to comment.",
            });
            return;
        }

        const commentRef = doc(collection(firestore, 'comments'));
        const newComment: Omit<CommentType, 'commentId' | 'timestamp'> & { timestamp: any } = {
            suggestionId: suggestionId,
            authorUid: user.uid,
            authorDisplayName: user.displayName || 'Anonymous',
            authorPhotoURL: user.photoURL,
            body: commentBody,
            timestamp: serverTimestamp(), // Use server timestamp for consistency
        };

        // The 'commentId' is now added right before the document is created.
        addDocumentNonBlocking(commentRef, { ...newComment, commentId: commentRef.id });

        toast({
            title: "Comment Added!",
            description: "Your comment has been posted.",
        });
    };

    if (isLoadingSuggestion || isLoadingComments) {
        return (
            <div className="flex flex-col min-h-screen bg-background">
                <Header />
                <main className="flex-1 container mx-auto px-4 py-8">
                    <div className="text-center">
                        <p className="text-lg animate-pulse">Loading suggestion...</p>
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
                    <div className="text-center">
                        <h1 className="text-2xl font-bold">Suggestion not found</h1>
                        <p className="text-muted-foreground">The suggestion you are looking for does not exist or may have been deleted.</p>
                    </div>
                </main>
            </div>
        );
    }

    return (
        <div className="flex flex-col min-h-screen bg-background">
            <Header />
            <main className="flex-1 container mx-auto px-4 py-8 max-w-4xl">
                <SuggestionDetail suggestion={suggestion} />
                <div className="mt-8">
                    <h2 className="text-2xl font-bold mb-4">Comments ({comments?.length || 0})</h2>
                    <AddCommentForm onSubmit={handleAddComment} />
                    <CommentList comments={comments || []} />
                </div>
            </main>
        </div>
    );
}
