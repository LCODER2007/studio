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
    const { user, loading: userLoading } = useAuth();
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
        
        // Construct the new comment object
        const newComment = {
            suggestionId: suggestionId,
            authorUid: user.uid,
            authorDisplayName: user.displayName || 'Anonymous User',
            authorPhotoURL: user.photoURL || null,
            body: commentBody,
            timestamp: serverTimestamp(),
            commentId: commentRef.id, // Add the generated ID to the document data
        };

        // Use the non-blocking function to add the document
        addDocumentNonBlocking(commentRef, newComment);

        toast({
            title: "Comment Added!",
            description: "Your comment has been posted.",
        });
    };

    const isLoading = isLoadingSuggestion || isLoadingComments || userLoading;

    if (isLoading) {
        return (
            <div className="flex flex-col min-h-screen bg-background">
                <Header />
                <main className="flex-1 container mx-auto px-4 py-8">
                    <div className="space-y-4">
                      <div className="w-full h-40 bg-muted rounded-lg animate-pulse"></div>
                      <div className="w-full h-20 bg-muted rounded-lg animate-pulse"></div>
                      <div className="w-full h-20 bg-muted rounded-lg animate-pulse"></div>
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
                <div className="mt-12">
                    <h2 className="text-2xl font-bold mb-4">Comments ({comments?.length || 0})</h2>
                    <AddCommentForm onSubmit={handleAddComment} />
                    <CommentList comments={comments || []} />
                </div>
            </main>
        </div>
    );
}
