
"use client";

import { useParams } from 'next/navigation';
import { useDoc, useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { doc, collection, query, where, orderBy } from 'firebase/firestore';
import type { UserProfile, Suggestion } from '@/lib/types';
import Header from '@/components/layout/Header';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import SuggestionCard from '@/components/suggestions/SuggestionCard';
import { useAuth } from '@/components/auth/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useCallback, useMemo } from 'react';

export default function ProfilePage() {
    const { uid } = useParams();
    const userId = Array.isArray(uid) ? uid[0] : uid;
    const firestore = useFirestore();
    const { toast } = useToast();
    const { user: authUser } = useAuth();

    const userProfileRef = useMemoFirebase(() => {
        if (!firestore || !userId) return null;
        return doc(firestore, 'users', userId);
    }, [firestore, userId]);
    
    const { data: userProfile, isLoading: isLoadingProfile } = useDoc<UserProfile>(userProfileRef);

    const userSuggestionsQuery = useMemoFirebase(() => {
        if (!firestore || !userId) return null;
        return query(
            collection(firestore, 'suggestions'), 
            where('authorUid', '==', userId), 
            orderBy('submissionTimestamp', 'desc')
        );
    }, [firestore, userId]);

    const { data: suggestions, isLoading: isLoadingSuggestions } = useCollection<Suggestion>(userSuggestionsQuery);

    const userVotesQuery = useMemoFirebase(() => {
        if (!firestore || !authUser) return null;
        return collection(firestore, `users/${authUser.uid}/user_votes`);
    }, [firestore, authUser]);

    const { data: userVotes } = useCollection(userVotesQuery);
    const upvotedIds = useMemo(() => new Set(userVotes?.map(v => v.id) || []), [userVotes]);

    const handleUpvote = useCallback(async (suggestionId: string) => {
        // This is a placeholder. The actual upvote logic is in SuggestionList.tsx
        // For profile page, we can assume the user wants to upvote and can be redirected
        // or we can duplicate the upvote logic here if needed.
        toast({
            title: "Upvote from profile",
            description: "This functionality would be fully implemented in a real application.",
        });
    }, [toast]);


    const isLoading = isLoadingProfile || isLoadingSuggestions;

    return (
        <div className="flex flex-col min-h-screen bg-background">
            <Header />
            <main className="flex-1 container mx-auto px-4 py-8 max-w-4xl">
                {isLoading ? (
                    <div className="space-y-6">
                        <div className="h-40 w-full animate-pulse rounded-lg bg-muted" />
                        <div className="h-10 w-1/3 animate-pulse rounded-lg bg-muted" />
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                            {[...Array(2)].map((_, i) => (
                                <div key={i} className="h-[350px] w-full animate-pulse rounded-lg bg-muted" />
                            ))}
                        </div>
                    </div>
                ) : userProfile ? (
                    <div className="space-y-8">
                        <Card>
                            <CardHeader className="flex flex-col items-center text-center">
                                <Avatar className="h-24 w-24 mb-4 border-2 border-primary">
                                    <AvatarImage src={userProfile.photoURL || ''} alt={userProfile.displayName || ''} />
                                    <AvatarFallback className="text-3xl">
                                        {userProfile.displayName?.charAt(0).toUpperCase()}
                                    </AvatarFallback>
                                </Avatar>
                                <CardTitle className="text-3xl">{userProfile.displayName}</CardTitle>
                                <p className="text-muted-foreground">{userProfile.email}</p>
                                {userProfile.role === 'SUPER_ADMIN' && (
                                    <Badge variant="destructive" className="mt-2">SUPER ADMIN</Badge>
                                )}
                            </CardHeader>
                        </Card>
                        
                        <div>
                            <h2 className="text-2xl font-bold mb-4">Suggestions by {userProfile.displayName}</h2>
                            {suggestions && suggestions.length > 0 ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {suggestions.map(suggestion => (
                                        <SuggestionCard 
                                            key={suggestion.id}
                                            suggestion={{...suggestion, suggestionId: suggestion.id}}
                                            onUpvote={() => handleUpvote(suggestion.id)}
                                            hasUpvoted={upvotedIds.has(suggestion.id)}
                                        />
                                    ))}
                                </div>
                            ) : (
                                <p className="text-muted-foreground text-center py-10">This user hasn't submitted any suggestions yet.</p>
                            )}
                        </div>
                    </div>
                ) : (
                    <div className="text-center py-20">
                        <h1 className="text-2xl font-bold text-muted-foreground">User Not Found</h1>
                        <p className="text-muted-foreground mt-2">The profile you are looking for does not exist.</p>
                    </div>
                )}
            </main>
        </div>
    );
}
