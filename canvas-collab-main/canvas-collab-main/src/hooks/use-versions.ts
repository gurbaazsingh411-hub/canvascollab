import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./use-auth";

export interface DocumentVersion {
    id: string;
    document_id: string;
    content: any;
    title: string;
    created_by: string;
    created_at: string;
    profiles?: {
        display_name: string;
        email: string;
    };
}

export interface SpreadsheetVersion {
    id: string;
    spreadsheet_id: string;
    cells: any;
    title: string;
    created_by: string;
    created_at: string;
    profiles?: {
        display_name: string;
        email: string;
    };
}

export function useDocumentVersions(documentId: string | undefined) {
    const { user } = useAuth();

    return useQuery({
        queryKey: ["document-versions", documentId],
        queryFn: async () => {
            const { data, error } = await supabase
                .from("document_versions" as any)
                .select("*, profiles:created_by(display_name, email)")
                .eq("document_id", documentId)
                .order("created_at", { ascending: false });

            if (error) throw error;
            return (data as any) as DocumentVersion[];
        },
        enabled: !!user && !!documentId && documentId !== "new",
    });
}

export function useSpreadsheetVersions(spreadsheetId: string | undefined) {
    const { user } = useAuth();

    return useQuery({
        queryKey: ["spreadsheet-versions", spreadsheetId],
        queryFn: async () => {
            const { data, error } = await supabase
                .from("spreadsheet_versions" as any)
                .select("*, profiles:created_by(display_name, email)")
                .eq("spreadsheet_id", spreadsheetId)
                .order("created_at", { ascending: false });

            if (error) throw error;
            return (data as any) as SpreadsheetVersion[];
        },
        enabled: !!user && !!spreadsheetId && spreadsheetId !== "new",
    });
}

export function useCreateDocumentVersion() {
    const queryClient = useQueryClient();
    const { user } = useAuth();

    return useMutation({
        mutationFn: async (data: {
            document_id: string;
            content: any;
            title: string;
        }) => {
            const { data: version, error } = await supabase
                .from("document_versions" as any)
                .insert({
                    ...data,
                    created_by: user!.id,
                })
                .select()
                .single();

            if (error) throw error;
            return version;
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ["document-versions", variables.document_id] });
        },
    });
}

export function useCreateSpreadsheetVersion() {
    const queryClient = useQueryClient();
    const { user } = useAuth();

    return useMutation({
        mutationFn: async (data: {
            spreadsheet_id: string;
            cells: any;
            title: string;
        }) => {
            const { data: version, error } = await supabase
                .from("spreadsheet_versions" as any)
                .insert({
                    ...data,
                    created_by: user!.id,
                })
                .select()
                .single();

            if (error) throw error;
            return version;
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ["spreadsheet-versions", variables.spreadsheet_id] });
        },
    });
}

export function useRestoreDocumentVersion() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (data: {
            documentId: string;
            versionId: string;
            content: any;
            title: string;
        }) => {
            // Update the document with the version content
            const { data: updated, error } = await supabase
                .from("documents")
                .update({
                    content: data.content,
                    title: data.title,
                })
                .eq("id", data.documentId)
                .select()
                .single();

            if (error) throw error;
            return updated;
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ["document", variables.documentId] });
            queryClient.invalidateQueries({ queryKey: ["documents"] });
        },
    });
}

export function useRestoreSpreadsheetVersion() {
    const queryClient = useQueryClient();
    const { user } = useAuth();

    return useMutation({
        mutationFn: async (data: {
            spreadsheetId: string;
            versionId: string;
            cells: any;
            title: string;
        }) => {
            // 1. Update the spreadsheet title
            const { error: sheetError } = await supabase
                .from("spreadsheets")
                .update({ title: data.title })
                .eq("id", data.spreadsheetId);

            if (sheetError) throw sheetError;

            // 2. Delete existing cells
            const { error: deleteError } = await (supabase
                .from("spreadsheet_cells")
                .delete()
                .eq("spreadsheet_id", data.spreadsheetId) as any);

            if (deleteError) throw deleteError;

            // 3. Insert version cells
            if (data.cells && Array.isArray(data.cells)) {
                const cellsToInsert = data.cells.map((c: any) => ({
                    spreadsheet_id: data.spreadsheetId,
                    cell_key: `${c.row},${c.col}`,
                    value: String(c.value || ""),
                    formula: c.formula,
                    updated_by: user!.id,
                }));

                const { error: insertError } = await (supabase
                    .from("spreadsheet_cells")
                    .insert(cellsToInsert) as any);

                if (insertError) throw insertError;
            }

            return { success: true };
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ["spreadsheet", variables.spreadsheetId] });
            queryClient.invalidateQueries({ queryKey: ["spreadsheet-cells", variables.spreadsheetId] });
            queryClient.invalidateQueries({ queryKey: ["spreadsheets"] });
        },
    });
}
