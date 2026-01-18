import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { workspacesApi, type Workspace, type WorkspaceMember } from "@/lib/api";
import { useAuth } from "./use-auth";

export function useWorkspaces() {
    const { user } = useAuth();
    const queryClient = useQueryClient();

    const workspacesQuery = useQuery({
        queryKey: ["workspaces"],
        queryFn: workspacesApi.getAll,
        enabled: !!user,
    });

    const createWorkspace = useMutation({
        mutationFn: ({ name, ownerId }: { name: string; ownerId: string }) =>
            workspacesApi.create(name, ownerId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["workspaces"] });
        },
    });

    const updateWorkspace = useMutation({
        mutationFn: ({ id, name }: { id: string; name: string }) => workspacesApi.update(id, { name }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["workspaces"] });
        },
    });

    const deleteWorkspace = useMutation({
        mutationFn: (id: string) => workspacesApi.delete(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["workspaces"] });
        },
    });

    return {
        workspaces: workspacesQuery.data as unknown as Workspace[] | undefined,
        isLoading: workspacesQuery.isLoading,
        createWorkspace,
        updateWorkspace,
        deleteWorkspace,
    };
}

export function useWorkspaceMembers(workspaceId: string | null) {
    const queryClient = useQueryClient();

    const membersQuery = useQuery({
        queryKey: ["workspace-members", workspaceId],
        queryFn: () => workspacesApi.getMembers(workspaceId!),
        enabled: !!workspaceId,
    });

    const addMember = useMutation({
        mutationFn: ({ userId, role }: { userId: string; role?: string }) =>
            workspacesApi.addMember(workspaceId!, userId, role),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["workspace-members", workspaceId] });
        },
    });

    const removeMember = useMutation({
        mutationFn: (userId: string) => workspacesApi.removeMember(workspaceId!, userId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["workspace-members", workspaceId] });
        },
    });

    return {
        members: membersQuery.data as WorkspaceMember[] | undefined,
        isLoading: membersQuery.isLoading,
        addMember,
        removeMember,
    };
}
