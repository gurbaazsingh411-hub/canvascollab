import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { todosApi, type Todo } from "@/lib/api";
import { useAuth } from "./use-auth";

export function useTodos() {
    const { user } = useAuth();
    const queryClient = useQueryClient();

    const todosQuery = useQuery({
        queryKey: ["todos"],
        queryFn: async () => {
            try {
                return await todosApi.getAll();
            } catch (error) {
                // Silently handle the error when the todos table doesn't exist
                // Return an empty array instead of throwing
                if (error instanceof Error && error.message.includes('Table does not exist')) {
                    return [];
                }
                // Re-throw other errors
                throw error;
            }
        },
        enabled: !!user,
    });

    const createTodo = useMutation({
        mutationFn: todosApi.create,
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
