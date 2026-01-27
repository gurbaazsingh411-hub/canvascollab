import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { todosApi, type Todo } from "@/lib/api";
import { useAuth } from "./use-auth";

export function useTodos(workspaceId?: string) {
    const { user } = useAuth();
    const queryClient = useQueryClient();

    const todosQuery = useQuery({
        queryKey: ["todos", workspaceId],
        queryFn: async () => {
            try {
                return await todosApi.getAll(workspaceId);
            } catch (error) {
                // Silently handle the error when the todos table doesn't exist
                if (error instanceof Error && error.message.includes('Table does not exist')) {
                    return [];
                }
                throw error;
            }
        },
        enabled: !!user,
    });

    const createTodo = useMutation({
        mutationFn: (content: string) => todosApi.create(content, workspaceId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["todos"] });
        },
    });

    const toggleTodo = useMutation({
        mutationFn: ({ id, completed }: { id: string; completed: boolean }) =>
            todosApi.toggle(id, completed),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["todos"] });
        },
    });

    const deleteTodo = useMutation({
        mutationFn: todosApi.delete,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["todos"] });
        },
    });

    return {
        todos: todosQuery.data,
        isLoading: todosQuery.isLoading,
        error: todosQuery.error,
        createTodo,
        toggleTodo,
        deleteTodo
    };
}
