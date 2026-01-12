import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { documentsApi, spreadsheetsApi, cellsApi, type Document, type Spreadsheet } from "@/lib/api";
import { useAuth } from "./use-auth";

// Combined files hook (documents + spreadsheets)
export function useFiles(workspaceId?: string) {
  const { user } = useAuth();

  const documentsQuery = useQuery({
    queryKey: ["documents", workspaceId],
    queryFn: () => documentsApi.getAll(workspaceId),
    enabled: !!user,
  });

  const spreadsheetsQuery = useQuery({
    queryKey: ["spreadsheets", workspaceId],
    queryFn: () => spreadsheetsApi.getAll(workspaceId),
    enabled: !!user,
  });

  const files = [
    ...(documentsQuery.data?.map((doc) => ({ ...doc, type: "document" as const })) || []),
    ...(spreadsheetsQuery.data?.map((sheet) => ({ ...sheet, type: "spreadsheet" as const })) || []),
  ].sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());

  return {
    files,
    isLoading: documentsQuery.isLoading || spreadsheetsQuery.isLoading,
    error: documentsQuery.error || spreadsheetsQuery.error,
    refetch: () => {
      documentsQuery.refetch();
      spreadsheetsQuery.refetch();
    },
  };
}

// Document hooks
export function useDocument(id: string | undefined) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["document", id],
    queryFn: () => documentsApi.getById(id!),
    enabled: !!user && !!id && id !== "new",
  });
}

export function useCreateDocument() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: ({ title, workspaceId }: { title?: string; workspaceId?: string } = {}) =>
      documentsApi.create({
        owner_id: user!.id,
        title: title || "Untitled Document",
        ...((workspaceId ? { workspace_id: workspaceId } : {}) as any),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["documents"] });
    },
  });
}

export function useUpdateDocument() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<Document> }) =>
      documentsApi.update(id, updates),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ["document", id] });
      queryClient.invalidateQueries({ queryKey: ["documents"] });
    },
  });
}

export function useDeleteDocument() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: documentsApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["documents"] });
    },
  });
}

// Spreadsheet hooks
export function useSpreadsheet(id: string | undefined) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["spreadsheet", id],
    queryFn: () => spreadsheetsApi.getById(id!),
    enabled: !!user && !!id && id !== "new",
  });
}

export function useSpreadsheetCells(spreadsheetId: string | undefined) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["spreadsheet-cells", spreadsheetId],
    queryFn: () => cellsApi.getBySpreadsheet(spreadsheetId!),
    enabled: !!user && !!spreadsheetId && spreadsheetId !== "new",
  });
}

export function useCreateSpreadsheet() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: ({ title, workspaceId }: { title?: string; workspaceId?: string } = {}) =>
      spreadsheetsApi.create({
        owner_id: user!.id,
        title: title || "Untitled Spreadsheet",
        ...((workspaceId ? { workspace_id: workspaceId } : {}) as any),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["spreadsheets"] });
    },
  });
}

export function useUpdateSpreadsheet() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<Spreadsheet> }) =>
      spreadsheetsApi.update(id, updates),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ["spreadsheet", id] });
      queryClient.invalidateQueries({ queryKey: ["spreadsheets"] });
    },
  });
}

export function useDeleteSpreadsheet() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: spreadsheetsApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["spreadsheets"] });
    },
  });
}


export function useUpdateSpreadsheetCell() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: ({ spreadsheet_id, row_index, col_index, value, formula }: {
      spreadsheet_id: string;
      row_index: number;
      col_index: number;
      value: string | number;
      formula?: string;
    }) =>
      cellsApi.upsertCell({
        spreadsheet_id,
        cell_key: `${row_index},${col_index}`,
        value: String(value),
        formula,
        updated_by: user!.id,
      }),
    onSuccess: (_, { spreadsheet_id }) => {
      // Invalidate the cells query to refresh data
      queryClient.invalidateQueries({ queryKey: ["spreadsheet-cells", spreadsheet_id] });
    },
  });
}

// Toggle star
export function useToggleStar() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, type, starred }: { id: string; type: "document" | "spreadsheet"; starred: boolean }) =>
      type === "document"
        ? documentsApi.toggleStar(id, starred)
        : spreadsheetsApi.toggleStar(id, starred),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["documents"] });
      queryClient.invalidateQueries({ queryKey: ["spreadsheets"] });
    },
  });
}
