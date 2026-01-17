import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageSquare, X, Check, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useComments, useCreateComment, useResolveComment, useCreateReply } from "@/hooks/use-comments";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";
import { useNotifications } from "@/contexts/NotificationContext";

interface CommentSidebarProps {
    documentId: string;
    isOpen: boolean;
    onClose: () => void;
}

export function CommentSidebar({ documentId, isOpen, onClose }: CommentSidebarProps) {
    const { user } = useAuth();
    const [newComment, setNewComment] = useState("");
    const [replyingTo, setReplyingTo] = useState<string | null>(null);
    const [replyContent, setReplyContent] = useState("");
    const { addNotification } = useNotifications();

    const { data: comments, isLoading } = useComments(documentId);
    const createComment = useCreateComment();
    const resolveComment = useResolveComment();
    const createReply = useCreateReply();

    const handleAddComment = async () => {
        if (!newComment.trim()) return;

        try {
            await createComment.mutateAsync({
                document_id: documentId,
                content: newComment,
            });
            setNewComment("");
            toast.success("Comment added");
            
            // Add notification for new comment
            addNotification({
                title: "Comment Added",
                message: "Your comment has been added successfully",
                type: "success",
            });
        } catch (error) {
            toast.error("Failed to add comment");
            console.error(error);
            
            // Add notification for failed comment
            addNotification({
                title: "Comment Failed",
                message: "Failed to add your comment",
                type: "error",
            });
        }
    };

    const handleAddReply = async (commentId: string) => {
        if (!replyContent.trim()) return;

        try {
            await createReply.mutateAsync({
                comment_id: commentId,
                content: replyContent,
                documentId,
            });
            setReplyContent("");
            setReplyingTo(null);
            toast.success("Reply added");
            
            // Add notification for new reply
            addNotification({
                title: "Reply Added",
                message: "Your reply has been added successfully",
                type: "success",
            });
        } catch (error) {
            toast.error("Failed to add reply");
            console.error(error);
            
            // Add notification for failed reply
            addNotification({
                title: "Reply Failed",
                message: "Failed to add your reply",
                type: "error",
            });
        }
    };

    const handleResolve = async (commentId: string, currentResolved: boolean) => {
        try {
            await resolveComment.mutateAsync({
                id: commentId,
                resolved: !currentResolved,
                documentId,
            });
            toast.success(currentResolved ? "Comment reopened" : "Comment resolved");
            
            // Add notification for comment resolution
            addNotification({
                title: currentResolved ? "Comment Reopened" : "Comment Resolved",
                message: currentResolved ? "The comment has been reopened" : "The comment has been marked as resolved",
                type: "info",
            });
        } catch (error) {
            toast.error("Failed to update comment");
            console.error(error);
            
            // Add notification for failed resolution
            addNotification({
                title: "Update Failed",
                message: "Failed to update the comment status",
                type: "error",
            });
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed right-0 top-0 h-screen w-80 border-l border-border bg-background shadow-lg z-50">
            <div className="flex h-full flex-col">
                {/* Header */}
                <div className="flex items-center justify-between border-b border-border p-4">
                    <div className="flex items-center gap-2">
                        <MessageSquare className="h-5 w-5" />
                        <h2 className="font-semibold">Comments</h2>
                    </div>
                    <Button variant="ghost" size="icon" onClick={onClose}>
                        <X className="h-4 w-4" />
                    </Button>
                </div>

                {/* Comments List */}
                <ScrollArea className="flex-1 p-4">
                    {isLoading ? (
                        <div className="flex items-center justify-center py-8">
                            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                        </div>
                    ) : comments && comments.length > 0 ? (
                        <div className="space-y-4">
                            {comments.map((comment: any) => (
                                <div
                                    key={comment.id}
                                    className={cn(
                                        "rounded-lg border border-border p-3 space-y-3",
                                        comment.resolved && "opacity-60"
                                    )}
                                >
                                    {/* Comment Header */}
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-start gap-2">
                                            <Avatar className="h-6 w-6">
                                                <AvatarFallback className="text-xs">
                                                    {comment.profiles?.display_name?.charAt(0) || comment.profiles?.email?.charAt(0) || "?"}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div>
                                                <p className="text-sm font-medium">
                                                    {comment.profiles?.display_name || comment.profiles?.email?.split("@")[0] || "Anonymous"}
                                                </p>
                                                <p className="text-xs text-muted-foreground">
                                                    {formatRelativeTime(new Date(comment.created_at))}
                                                </p>
                                            </div>
                                        </div>
                                        {!comment.resolved && (
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="h-7 gap-1"
                                                onClick={() => handleResolve(comment.id, comment.resolved)}
                                            >
                                                <Check className="h-3 w-3" />
                                                Resolve
                                            </Button>
                                        )}
                                    </div>

                                    {/* Comment Content */}
                                    <p className="text-sm">{comment.content}</p>

                                    {/* Replies */}
                                    {comment.comment_replies && comment.comment_replies.length > 0 && (
                                        <div className="space-y-2 pl-4 border-l-2 border-muted">
                                            {comment.comment_replies.map((reply: any) => (
                                                <div key={reply.id} className="space-y-1">
                                                    <div className="flex items-center gap-2">
                                                        <Avatar className="h-5 w-5">
                                                            <AvatarFallback className="text-xs">
                                                                {reply.profiles?.display_name?.charAt(0) || reply.profiles?.email?.charAt(0) || "?"}
                                                            </AvatarFallback>
                                                        </Avatar>
                                                        <span className="text-xs font-medium">
                                                            {reply.profiles?.display_name || reply.profiles?.email?.split("@")[0] || "Anonymous"}
                                                        </span>
                                                        <span className="text-xs text-muted-foreground">
                                                            {formatRelativeTime(new Date(reply.created_at))}
                                                        </span>
                                                    </div>
                                                    <p className="text-sm">{reply.content}</p>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {/* Reply Input */}
                                    {replyingTo === comment.id ? (
                                        <div className="space-y-2">
                                            <Textarea
                                                placeholder="Write a reply..."
                                                value={replyContent}
                                                onChange={(e) => setReplyContent(e.target.value)}
                                                className="min-h-[60px]"
                                            />
                                            <div className="flex gap-2">
                                                <Button
                                                    size="sm"
                                                    onClick={() => handleAddReply(comment.id)}
                                                    disabled={createReply.isPending}
                                                >
                                                    {createReply.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : "Reply"}
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    onClick={() => setReplyingTo(null)}
                                                >
                                                    Cancel
                                                </Button>
                                            </div>
                                        </div>
                                    ) : (
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-7"
                                            onClick={() => setReplyingTo(comment.id)}
                                        >
                                            Reply
                                        </Button>
                                    )}
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-8 text-center">
                            <MessageSquare className="h-12 w-12 text-muted-foreground/50 mb-2" />
                            <p className="text-sm text-muted-foreground">No comments yet</p>
                            <p className="text-xs text-muted-foreground">Be the first to comment!</p>
                        </div>
                    )}
                </ScrollArea>

                {/* New Comment Input */}
                <div className="border-t border-border p-4 space-y-2">
                    <Textarea
                        placeholder="Add a comment..."
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        className="min-h-[80px]"
                    />
                    <Button
                        onClick={handleAddComment}
                        className="w-full"
                        disabled={createComment.isPending || !newComment.trim()}
                    >
                        {createComment.isPending ? (
                            <>
                                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                Adding...
                            </>
                        ) : (
                            "Add Comment"
                        )}
                    </Button>
                </div>
            </div>
        </div>
    );
}

function formatRelativeTime(date: Date): string {
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    if (seconds < 60) return "just now";
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    return date.toLocaleDateString();
}
