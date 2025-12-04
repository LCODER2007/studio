
"use client";

import { useState } from 'react';
import { useAuth } from '@/components/auth/AuthContext';
import { useCollection, useFirestore, useMemoFirebase, errorEmitter, FirestorePermissionError } from '@/firebase';
import { collection, orderBy, query, runTransaction, doc, serverTimestamp, Transaction } from 'firebase/firestore';
import type { Comment as CommentType } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { formatDistanceToNow } from 'date-fns';
import { Send, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { retryWithBackoff, getFirebaseErrorMessage } from '@/lib/retry-utils';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface CommentSectionProps {
  suggestionId: string;
}

export default function CommentSection({ suggestionId }: CommentSectionProps) {
  const { user, role } = useAuth();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingCommentId, setDeletingCommentId] = useState<string | null>(null);

  const commentsQuery = useMemoFirebase(() => {
    if (!firestore || !suggestionId) return null;
    return query(collection(firestore, 'suggestions', suggestionId, 'comments'), orderBy('createdAt', 'asc'));
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

    if (newComment.trim().length < 1) {
        toast({
            variant: 'destructive',
            title: 'Comment is empty',
            description: 'Please write a comment before submitting.',
        });
        return;
    }

    setIsSubmitting(true);
    
    const commentsColRef = collection(firestore, 'suggestions', suggestionId, 'comments');
    const suggestionRef = doc(firestore, 'suggestions', suggestionId);
    const newCommentData = {
        text: newComment,
        authorUid: user.uid,
        authorDisplayName: user.displayName || 'Anonymous',
        authorPhotoURL: user.photoURL || null,
        createdAt: serverTimestamp()
    };

    try {
      await retryWithBackoff(async () => {
        await runTransaction(firestore, async (transaction: Transaction) => {
          const suggestionDoc = await transaction.get(suggestionRef);
          if (!suggestionDoc.exists()) {
            throw new Error("Suggestion does not exist.");
          }
          
          const newCommentsCount = (suggestionDoc.data().commentsCount || 0) + 1;
          transaction.update(suggestionRef, { commentsCount: newCommentsCount });

          const newCommentRef = doc(commentsColRef);
          transaction.set(newCommentRef, newCommentData);
        });
      });
      
      setNewComment('');
      toast({
        title: 'Comment posted',
        description: 'Your comment has been added successfully.',
      });
    } catch (error: any) {
      console.error('Comment submission failed:', error);
      
      const errorMessage = getFirebaseErrorMessage(error);
      
      toast({
        variant: 'destructive',
        title: 'Failed to post comment',
        description: errorMessage,
      });
      
      // Create the rich, contextual error for permission issues
      if (error.code === 'permission-denied') {
        const permissionError = new FirestorePermissionError({
          path: `suggestions/${suggestionId}/comments`,
          operation: 'create',
          requestResourceData: newCommentData
        });
        errorEmitter.emit('permission-error', permissionError);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!user || !firestore) {
      toast({
        variant: 'destructive',
        title: 'Not logged in',
        description: 'You must be logged in to delete a comment.',
      });
      return;
    }

    setDeletingCommentId(commentId);

    try {
      const commentRef = doc(firestore, 'suggestions', suggestionId, 'comments', commentId);
      const suggestionRef = doc(firestore, 'suggestions', suggestionId);

      await retryWithBackoff(async () => {
        await runTransaction(firestore, async (transaction: Transaction) => {
          const suggestionDoc = await transaction.get(suggestionRef);
          if (!suggestionDoc.exists()) {
            throw new Error("Suggestion does not exist.");
          }

          const currentCommentsCount = suggestionDoc.data().commentsCount || 0;
          const newCommentsCount = Math.max(0, currentCommentsCount - 1);
          transaction.update(suggestionRef, { commentsCount: newCommentsCount });

          transaction.delete(commentRef);
        });
      });

      toast({
        title: 'Comment deleted',
        description: 'The comment has been removed successfully.',
      });
    } catch (error: any) {
      console.error('Comment deletion failed:', error);
      
      const errorMessage = getFirebaseErrorMessage(error);
      
      toast({
        variant: 'destructive',
        title: 'Failed to delete comment',
        description: errorMessage,
      });
      
      if (error.code === 'permission-denied') {
        const permissionError = new FirestorePermissionError({
          path: `suggestions/${suggestionId}/comments/${commentId}`,
          operation: 'delete',
        });
        errorEmitter.emit('permission-error', permissionError);
      }
    } finally {
      setDeletingCommentId(null);
    }
  };

  const canDeleteComment = (comment: CommentType): boolean => {
    if (!user) return false;
    // User can delete if they are the author or if they are an admin/super admin
    return comment.authorUid === user.uid || role === 'SUPER_ADMIN';
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
          <AnimatePresence mode="popLayout">
            {!isLoading && comments && comments.map((comment) => (
              <motion.div
                key={comment.id}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="flex items-start space-x-4 group"
              >
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
                      &bull; {comment.createdAt ? formatDistanceToNow(comment.createdAt.toDate(), { addSuffix: true }) : 'just now'}
                    </span>
                    {canDeleteComment(comment) && (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8 p-0"
                            disabled={deletingCommentId === comment.id}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                            <span className="sr-only">Delete comment</span>
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Comment</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete this comment? This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDeleteComment(comment.id)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    )}
                  </div>
                  <p className="text-sm text-foreground/90">{comment.text}</p>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
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
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                disabled={isSubmitting}
              />
              <Button type="submit" size="sm" className="mt-2" disabled={isSubmitting || newComment.trim().length === 0}>
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
