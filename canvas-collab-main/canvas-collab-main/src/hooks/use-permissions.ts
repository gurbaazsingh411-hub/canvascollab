import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { enhancedPermissionsApi, profilesApi, type DocumentRole } from "@/lib/api";
import { useAuth } from "./use-auth";
import { useWorkspaces } from "./use-workspaces";

export function useCollaborators(fileId: string | undefined, fileType: "document" | "spreadsheet" = "document") {
    const { user } = useAuth();

    return useQuery({
        queryKey: ["collaborators", fileType, fileId],
        queryFn: () => fileType === "spreadsheet"
            ? enhancedPermissionsApi.getSpreadsheetCollaborators(fileId!)
            : enhancedPermissionsApi.getDocumentCollaborators(fileId!),
        enabled: !!user && !!fileId && fileId !== "new",
    });
}

export function useInviteUser() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (data: {
            email: string;
            role: DocumentRole;
            fileId: string;
            fileType: "document" | "spreadsheet";
        }) => {
            // First, search for user by email
            const users = await profilesApi.searchByEmail(data.email);
            if (!users || users.length === 0) {
                throw new Error("User not found");
            }

            // Invite the user
            return enhancedPermissionsApi.inviteUser({
                [data.fileType === "spreadsheet" ? "spreadsheet_id" : "document_id"]: data.fileId,
                user_id: users[0].id,
                role: data.role,
            });
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ["collaborators", variables.fileType, variables.fileId] });
        },
    });
}

export function useUpdateCollaboratorRole() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ permissionId, role, fileId, fileType }: {
            permissionId: string;
            role: DocumentRole;
            fileId: string;
            fileType: "document" | "spreadsheet";
        }) => enhancedPermissionsApi.updateRole(permissionId, role),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ["collaborators", variables.fileType, variables.fileId] });
        },
    });
}

export function useRemoveCollaborator() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ permissionId, fileId, fileType }: { permissionId: string; fileId: string; fileType: "document" | "spreadsheet" }) =>
            enhancedPermissionsApi.removeCollaborator(permissionId),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ["collaborators", variables.fileType, variables.fileId] });
        },
    });
}

export function useUserRole(
    fileId: string | undefined,
    fileType: "document" | "spreadsheet" = "document",
    ownerId: string | undefined,
    workspaceId: string | null | undefined
) {
    const { user } = useAuth();
    const { data: collaborators, isLoading: isLoadingCollabs } = useCollaborators(fileId, fileType);
    const { workspaces, isLoading: isLoadingWorkspaces } = useWorkspaces();

    if (!user || !fileId || fileId === "new") {
        return { role: "owner" as const, isEditable: true, isLoading: false };
    }

    const isLoading = isLoadingCollabs || isLoadingWorkspaces;

    // 1. Owner of the file has full editing access
    if (user.id === ownerId) {
        return { role: "owner" as const, isEditable: true, isLoading };
    }

    // 2. Owner of the workspace has full editing access
    if (workspaceId && workspaces) {
        const ws = workspaces.find((w) => w.id === workspaceId);
        if (ws && ws.owner_id === user.id) {
            return { role: "owner" as const, isEditable: true, isLoading };
        }
    }

    // 3. Explicit permissions defined in document_permissions
    if (collaborators) {
        const perm = collaborators.find((c: any) => c.user_id === user.id);
        if (perm) {
            const isEditable = perm.role === "editor" || perm.role === "owner";
            return {
                role: perm.role as "owner" | "editor" | "viewer",
                isEditable,
                isLoading,
            };
        }
    }

    // 4. Default fallback: viewer role
    return { role: "viewer" as const, isEditable: false, isLoading };
}

