"use client";

import type { Comment } from "@/lib/types";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { formatDistanceToNow } from "date-fns";

interface CommentListProps {
    comments: Comment[];
}

export default function CommentList({ comments }: CommentListProps) {
    if (comments.length === 0) {
        return (
            <div className="text-center py-10 border-t mt-6">
                <p className="text-muted-foreground">No comments yet. Be the first to share your thoughts!</p>
            </div>
        );
    }
    return (
        <div className="space-y-6 mt-6 border-t pt-6">
            {comments.map((comment) => (
                <div key={comment.commentId} className="flex items-start gap-4">
                    <Avatar>
                        <AvatarImage src={comment.authorPhotoURL ?? ''} />
                        <AvatarFallback>{comment.authorDisplayName.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                        <div className="flex items-center gap-2">
                            <p className="font-semibold">{comment.authorDisplayName}</p>
                            <p className="text-xs text-muted-foreground">
                                {comment.timestamp && formatDistanceToNow(comment.timestamp.toDate(), { addSuffix: true })}
                            </p>
                        </div>
                        <p className="text-sm text-foreground/90 mt-1">{comment.body}</p>
                    </div>
                </div>
            ))}
        </div>
    );
}
