import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { enhancedPermissionsApi, profilesApi, type DocumentRole } from "@/lib/api";
import { useAuth } from "./use-auth";

export function useDocumentCollaborators(documentId: string | undefined) {
    const { user } = useAuth();

    return useQuery({
        queryKey: ["collaborators", documentId],
        queryFn: () => enhancedPermissionsApi.getDocumentCollaborators(documentId!),
        enabled: !!user && !!documentId && documentId !== "new",
    });
}

export function useInviteUser() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (data: {
            email: string;
            role: DocumentRole;
            documentId: string;
        }) => {
            // First, search for user by email
            const users = await profilesApi.searchByEmail(data.email);
            if (!users || users.length === 0) {
                throw new Error("User not found");
            }

            // Invite the user
            return enhancedPermissionsApi.inviteUser({
                document_id: data.documentId,
                user_id: users[0].id,
                role: data.role,
            });
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ["collaborators", variables.documentId] });
        },
    });
}

export function useUpdateCollaboratorRole() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ permissionId, role, documentId }: {
            permissionId: string;
            role: DocumentRole;
            documentId: string;
        }) => enhancedPermissionsApi.updateRole(permissionId, role),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ["collaborators", variables.documentId] });
        },
    });
}

export function useRemoveCollaborator() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ permissionId, documentId }: { permissionId: string; documentId: string }) =>
            enhancedPermissionsApi.removeCollaborator(permissionId),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ["collaborators", variables.documentId] });
        },
    });
}
