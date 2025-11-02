
"use client";

import { useState, useMemo } from 'react';
import { useAuth } from '@/components/auth/AuthContext';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { addDoc, collection, doc, orderBy, query, runTransaction, serverTimestamp } from 'firebase/firestore';
import type { Comment as CommentType } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { formatDistanceToNow } from 'date-fns';
import { Send } from 'lucide-react';
import Link from 'next/link';

interface CommentSectionProps {
  suggestionId: string;
}

export default function CommentSection({ suggestionId }: CommentSectionProps) {
  const { user } = useAuth();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [commentBody, setCommentBody] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const commentsQuery = useMemoFirebase(() => {
    if (!firestore || !suggestionId) return null;
    return query(collection(firestore, 'suggestions', suggestionId, 'comments'), orderBy('timestamp', 'asc'));
  }, [firestore, suggestionId]);

  const { data: comments, isLoading } = useCollection<CommentType>(commentsQuery);

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !firestore) {
      toast({
        variant: 'destructive',
        title: 'Not logged in',
        description: 'You must be logged in to post a comment.',
      });
      return;
    }

    if (commentBody.trim().length < 10) {
        toast({
            variant: 'destructive',
            title: 'Comment too short',
            description: 'Your comment must be at least 10 characters long.',
        });
        return;
    }

    setIsSubmitting(true);
    
    const suggestionRef = doc(firestore, 'suggestions', suggestionId);
    const commentsColRef = collection(firestore, 'suggestions', suggestionId, 'comments');
    const newCommentRef = doc(commentsColRef);

    const newComment: Omit<CommentType, 'commentId'> = {
        suggestionId,
        authorUid: user.uid,
        authorDisplayName: user.displayName || 'Anonymous',
        authorPhotoURL: user.photoURL,
        body: commentBody.trim(),
        timestamp: serverTimestamp(),
    };

    try {
        await runTransaction(firestore, async (transaction) => {
            const suggestionDoc = await transaction.get(suggestionRef);
            if (!suggestionDoc.exists()) {
                throw new Error("Suggestion does not exist.");
            }

            const newCommentsCount = (suggestionDoc.data().commentsCount || 0) + 1;
            transaction.update(suggestionRef, { commentsCount: newCommentsCount });
            transaction.set(newCommentRef, { ...newComment, commentId: newCommentRef.id });
        });

        setCommentBody('');
    } catch (error: any) {
        console.error('Error posting comment:', error);
        toast({
            variant: 'destructive',
            title: 'Failed to post comment',
            description: error.message || 'An unknown error occurred.',
        });
    } finally {
        setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Discussion</CardTitle>
        <CardDescription>Share your thoughts on this suggestion.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          {isLoading && [...Array(3)].map((_, i) => (
            <div key={i} className="flex items-start space-x-4">
                <div className="h-10 w-10 rounded-full bg-muted animate-pulse" />
                <div className="flex-1 space-y-2">
                    <div className="h-4 w-1/4 bg-muted animate-pulse" />
                    <div className="h-4 w-3/4 bg-muted animate-pulse" />
                </div>
            </div>
          ))}
          {!isLoading && comments && comments.map((comment) => (
            <div key={comment.commentId} className="flex items-start space-x-4">
              <Link href={`/profile/${comment.authorUid}`}>
                <Avatar>
                  <AvatarImage src={comment.authorPhotoURL ?? ''} />
                  <AvatarFallback>{comment.authorDisplayName?.charAt(0)}</AvatarFallback>
                </Avatar>
              </Link>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <Link href={`/profile/${comment.authorUid}`} className="font-semibold text-sm hover:underline">{comment.authorDisplayName}</Link>
                  <span className="text-xs text-muted-foreground">
                    &bull; {formatDistanceToNow(comment.timestamp?.toDate(), { addSuffix: true })}
                  </span>
                </div>
                <p className="text-sm text-foreground/90">{comment.body}</p>
              </div>
            </div>
          ))}
          {!isLoading && (!comments || comments.length === 0) && (
              <p className="text-sm text-center text-muted-foreground py-4">No comments yet. Be the first to start the discussion!</p>
          )}
        </div>
        {user && (
          <form onSubmit={handleCommentSubmit} className="flex items-start space-x-4 pt-6 border-t">
            <Avatar>
              <AvatarImage src={user.photoURL ?? ''} />
              <AvatarFallback>{user.displayName?.charAt(0)}</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <Textarea
                placeholder="Write a comment..."
                value={commentBody}
                onChange={(e) => setCommentBody(e.target.value)}
                disabled={isSubmitting}
              />
              <Button type="submit" size="sm" className="mt-2" disabled={isSubmitting || commentBody.trim().length < 10}>
                <Send className="mr-2 h-4 w-4" />
                {isSubmitting ? 'Posting...' : 'Post Comment'}
              </Button>
            </div>
          </form>
        )}
      </CardContent>
    </Card>
  );
}
