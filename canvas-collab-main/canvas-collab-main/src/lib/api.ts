import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export type Document = Database["public"]["Tables"]["documents"]["Row"];
export type DocumentInsert = Database["public"]["Tables"]["documents"]["Insert"];
export type DocumentUpdate = Database["public"]["Tables"]["documents"]["Update"];

export type Spreadsheet = Database["public"]["Tables"]["spreadsheets"]["Row"];
export type SpreadsheetInsert = Database["public"]["Tables"]["spreadsheets"]["Insert"];
export type SpreadsheetUpdate = Database["public"]["Tables"]["spreadsheets"]["Update"];


export type SpreadsheetCell = Database["public"]["Tables"]["spreadsheet_cells"]["Row"];
export type SpreadsheetCellInsert = Database["public"]["Tables"]["spreadsheet_cells"]["Insert"];

export type Workspace = Database["public"]["Tables"]["workspaces"]["Row"];
export type WorkspaceMember = Database["public"]["Tables"]["workspace_members"]["Row"];

export type DocumentPermission = Database["public"]["Tables"]["document_permissions"]["Row"];
export type DocumentRole = Database["public"]["Enums"]["document_role"];

export type Profile = Database["public"]["Tables"]["profiles"]["Row"];

// Workspaces API
export const workspacesApi = {
  async getAll() {
    const { data, error } = await supabase
      .from("workspaces" as any)
      .select("*, owner:owner_id(display_name, avatar_url)")
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data;
  },

  async create(name: string, owner_id: string) {
    const { data, error } = await supabase
      .from("workspaces" as any)
      .insert({ name, owner_id })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async getMembers(workspaceId: string) {
    const { data, error } = await supabase
      .from("workspace_members" as any)
      .select("*, profile:user_id(display_name, email, avatar_url)")
      .eq("workspace_id", workspaceId);

    if (error) throw error;
    return data;
  },

  async addMember(workspaceId: string, userId: string, role: string = 'member') {
    const { data, error } = await supabase
      .from("workspace_members" as any)
      .insert({ workspace_id: workspaceId, user_id: userId, role })
      .select()
      .single();

    if (error) throw error;
    return data;
  }
};

// Documents API
export const documentsApi = {
  async getAll(workspaceId?: string) {
    let query = supabase
      .from("documents")
      .select("*, profiles:owner_id(display_name, avatar_url)")
      .order("updated_at", { ascending: false });

    if (workspaceId) {
      query = query.eq("workspace_id", workspaceId);
    } else {
      query = query.is("workspace_id", null);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data;
  },


  async getById(id: string) {
    const { data, error } = await supabase
      .from("documents")
      .select("*, profiles:owner_id(display_name, avatar_url)")
      .eq("id", id)
      .maybeSingle();

    if (error) throw error;
    return data;
  },

  async create(document: DocumentInsert) {
    const { data, error } = await supabase
      .from("documents")
      .insert(document)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async update(id: string, updates: DocumentUpdate) {
    const { data, error } = await supabase
      .from("documents")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async delete(id: string) {
    const { error } = await supabase
      .from("documents")
      .delete()
      .eq("id", id);

    if (error) throw error;
  },

  async toggleStar(id: string, starred: boolean) {
    return this.update(id, { starred });
  },
};

// Spreadsheets API
export const spreadsheetsApi = {
  async getAll(workspaceId?: string) {
    let query = supabase
      .from("spreadsheets")
      .select("*, profiles:owner_id(display_name, avatar_url)")
      .order("updated_at", { ascending: false });

    if (workspaceId) {
      query = query.eq("workspace_id", workspaceId);
    } else {
      query = query.is("workspace_id", null);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data;
  },

  async getById(id: string) {
    const { data, error } = await supabase
      .from("spreadsheets")
      .select("*, profiles:owner_id(display_name, avatar_url)")
      .eq("id", id)
      .maybeSingle();

    if (error) throw error;
    return data;
  },

  async create(spreadsheet: SpreadsheetInsert) {
    const { data, error } = await supabase
      .from("spreadsheets")
      .insert(spreadsheet)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async update(id: string, updates: SpreadsheetUpdate) {
    const { data, error } = await supabase
      .from("spreadsheets")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async delete(id: string) {
    const { error } = await supabase
      .from("spreadsheets")
      .delete()
      .eq("id", id);

    if (error) throw error;
  },

  async toggleStar(id: string, starred: boolean) {
    return this.update(id, { starred });
  },
};

// Spreadsheet Cells API
export const cellsApi = {
  async getBySpreadsheet(spreadsheetId: string) {
    const { data, error } = await supabase
      .from("spreadsheet_cells")
      .select("*")
      .eq("spreadsheet_id", spreadsheetId);

    if (error) throw error;
    return data;
  },

  async upsertCell(cell: SpreadsheetCellInsert) {
    const { data, error } = await supabase
      .from("spreadsheet_cells")
      .upsert(cell, { onConflict: "spreadsheet_id,cell_key" })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async deleteCell(spreadsheetId: string, cellKey: string) {
    const { error } = await supabase
      .from("spreadsheet_cells")
      .delete()
      .eq("spreadsheet_id", spreadsheetId)
      .eq("cell_key", cellKey);

    if (error) throw error;
  },
};

// Permissions API
export const permissionsApi = {
  async getDocumentPermissions(documentId: string) {
    const { data, error } = await supabase
      .from("document_permissions")
      .select("*, profiles:user_id(display_name, email, avatar_url)")
      .eq("document_id", documentId);

    if (error) throw error;
    return data;
  },

  async getSpreadsheetPermissions(spreadsheetId: string) {
    const { data, error } = await supabase
      .from("document_permissions")
      .select("*, profiles:user_id(display_name, email, avatar_url)")
      .eq("spreadsheet_id", spreadsheetId);

    if (error) throw error;
    return data;
  },

  async addPermission(permission: Database["public"]["Tables"]["document_permissions"]["Insert"]) {
    const { data, error } = await supabase
      .from("document_permissions")
      .insert(permission)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async updatePermission(id: string, role: DocumentRole) {
    const { data, error } = await supabase
      .from("document_permissions")
      .update({ role })
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async removePermission(id: string) {
    const { error } = await supabase
      .from("document_permissions")
      .delete()
      .eq("id", id);

    if (error) throw error;
  },
};

// Profiles API
export const profilesApi = {
  async getById(id: string) {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (error) throw error;
    return data;
  },

  async update(id: string, updates: Database["public"]["Tables"]["profiles"]["Update"]) {
    const { data, error } = await supabase
      .from("profiles")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async searchByEmail(email: string) {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .ilike("email", `%${email}%`)
      .limit(10);

    if (error) throw error;
    return data;
  },
};

// Comments API
export const commentsApi = {
  async getByDocument(documentId: string) {
    const { data, error } = await supabase
      .from("comments" as any)
      .select(`
        *,
        profiles:user_id(display_name, email, avatar_url),
        comment_replies(
          *,
          profiles:user_id(display_name, email, avatar_url)
        )
      `)
      .eq("document_id", documentId)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data;
  },

  async create(comment: {
    document_id: string;
    content: string;
    position?: any;
  }) {
    const { data, error } = await supabase
      .from("comments" as any)
      .insert(comment)
      .select(`
        *,
        profiles:user_id(display_name, email, avatar_url)
      `)
      .single();

    if (error) throw error;
    return data;
  },

  async resolve(id: string, resolved: boolean) {
    const { data, error } = await supabase
      .from("comments" as any)
      .update({ resolved })
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async delete(id: string) {
    const { error } = await supabase
      .from("comments" as any)
      .delete()
      .eq("id", id);

    if (error) throw error;
  },
};

// Comment Replies API
export const repliesApi = {
  async create(reply: {
    comment_id: string;
    content: string;
  }) {
    const { data, error } = await supabase
      .from("comment_replies" as any)
      .insert(reply)
      .select(`
        *,
        profiles:user_id(display_name, email, avatar_url)
      `)
      .single();

    if (error) throw error;
    return data;
  },

  async delete(id: string) {
    const { error } = await supabase
      .from("comment_replies" as any)
      .delete()
      .eq("id", id);

    if (error) throw error;
  },
};

// Enhanced Permissions API
export const enhancedPermissionsApi = {
  async getDocumentCollaborators(documentId: string) {
    const { data, error } = await supabase
      .from("document_permissions")
      .select("*, profiles:user_id(display_name, email, avatar_url)")
      .eq("document_id", documentId);

    if (error) throw error;
    return data;
  },

  async inviteUser(invitation: {
    document_id?: string;
    spreadsheet_id?: string;
    user_id: string;
    role: DocumentRole;
  }) {
    const { data, error } = await supabase
      .from("document_permissions")
      .insert(invitation)
      .select("*, profiles:user_id(display_name, email, avatar_url)")
      .single();

    if (error) throw error;
    return data;
  },

  async updateRole(permissionId: string, role: DocumentRole) {
    const { data, error } = await supabase
      .from("document_permissions")
      .update({ role })
      .eq("id", permissionId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async removeCollaborator(permissionId: string) {
    const { error } = await supabase
      .from("document_permissions")
      .delete()
      .eq("id", permissionId);

    if (error) throw error;
  },
};
