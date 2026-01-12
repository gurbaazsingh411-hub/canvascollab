import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { todosApi, type Todo } from "@/lib/api";
import { useAuth } from "./use-auth";

export function useTodos() {
    const { user } = useAuth();
    const queryClient = useQueryClient();

    const todosQuery = useQuery({
        queryKey: ["todos"],
        queryFn: todosApi.getAll,
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
