import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { commentsApi, repliesApi } from "@/lib/api";
import { useAuth } from "./use-auth";

// Comments hooks
export function useComments(documentId: string | undefined) {
    const { user } = useAuth();

    return useQuery({
        queryKey: ["comments", documentId],
        queryFn: () => commentsApi.getByDocument(documentId!),
        enabled: !!user && !!documentId && documentId !== "new",
    });
}

export function useCreateComment() {
    const queryClient = useQueryClient();
    const { user } = useAuth();

    return useMutation({
        mutationFn: (data: { document_id: string; content: string; position?: any }) =>
            commentsApi.create(data),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ["comments", variables.document_id] });
        },
    });
}

export function useResolveComment() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, resolved, documentId }: { id: string; resolved: boolean; documentId: string }) =>
            commentsApi.resolve(id, resolved),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ["comments", variables.documentId] });
        },
    });
}

export function useDeleteComment() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, documentId }: { id: string; documentId: string }) =>
            commentsApi.delete(id),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ["comments", variables.documentId] });
        },
    });
}

// Replies hooks
export function useCreateReply() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: { comment_id: string; content: string; documentId: string }) =>
            repliesApi.create({ comment_id: data.comment_id, content: data.content }),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ["comments", variables.documentId] });
        },
    });
}

export function useDeleteReply() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, documentId }: { id: string; documentId: string }) =>
            repliesApi.delete(id),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ["comments", variables.documentId] });
        },
    });
}
