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
export interface Todo {
  id: string;
  content: string;
  completed: boolean;
  created_at: string;
}

export const todosApi = {
  async getAll() {
    try {
      const { data, error } = await supabase
        .from("todos" as any)
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        // If the table doesn't exist, return an empty array instead of throwing
        if (error.code === '42P01' || error.message.toLowerCase().includes('does not exist')) {
          return [];
        }
        throw error;
      }
      return data as any as Todo[];
    } catch (err) {
      // Catch any other errors that might occur, particularly network errors
      // If it's a "table does not exist" related error, return empty array
      if (err instanceof Error &&
        (err.message.includes('does not exist') ||
          err.message.includes('404') ||
          err.message.includes('missing'))) {
        return [];
      }
      // Re-throw other errors
      throw err;
    }
  },

  async create(content: string) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("No user found");

    const { data, error } = await supabase
      .from("todos" as any)
      .insert({
        content,
        user_id: user.id
      })
      .select()
      .single();

    if (error) {
      // If the table doesn't exist, throw a more descriptive error
      if (error.code === '42P01' || error.message.includes('does not exist')) {
        console.warn('Todos table does not exist:', error.message);
        throw new Error('Todos feature is not available: Table does not exist');
      }
      throw error;
    }
    return data as any as Todo;
  },

  async toggle(id: string, completed: boolean) {
    const { data, error } = await supabase
      .from("todos" as any)
      .update({ completed })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      // If the table doesn't exist, throw a more descriptive error
      if (error.code === '42P01' || error.message.includes('does not exist')) {
        console.warn('Todos table does not exist:', error.message);
        throw new Error('Todos feature is not available: Table does not exist');
      }
      throw error;
    }
    return data as any as Todo;
  },

  async delete(id: string) {
    const { error } = await supabase
      .from("todos" as any)
      .delete()
      .eq("id", id);

    if (error) throw error;
  }
};

export const workspacesApi = {
  async getAll() {
    // Attempt fast join
    const { data, error } = await supabase
      .from("workspaces" as any)
      .select("*, profiles:profiles!owner_id(display_name, avatar_url)")
      .order("created_at", { ascending: false });

    if (!error) return data;

    // Fallback if join fails
    console.warn("Workspaces join failed, using fallback:", error.message);
    const { data: workspaces, error: wsError } = await supabase
      .from("workspaces" as any)
      .select("*")
      .order("created_at", { ascending: false });

    if (wsError) throw wsError;

    if (workspaces && workspaces.length > 0) {
      const ownerIds = (workspaces as any[]).map(w => w.owner_id);
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, display_name, avatar_url")
        .in("id", ownerIds);

      return (workspaces as any[]).map(w => ({
        ...w,
        profiles: profiles?.find(p => p.id === w.owner_id) || null
      }));
    }

    return workspaces;
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
    try {
      // First, get the workspace members
      const { data: members, error: membersError } = await supabase
        .from("workspace_members" as any)
        .select("*")
        .eq("workspace_id", workspaceId);

      if (membersError) {
        // If it's a permission error or bad request, return an empty array
        if (membersError.code === '42501' || membersError.code === '400' || membersError.code === '401' || membersError.code === '403') {
          console.warn('Permission denied accessing workspace members:', membersError.message);
          return [];
        }
        throw membersError;
      }

      // Cast members to any to avoid typing issues
      const typedMembers: any[] = members as any[];

      // Then, get the profile information for each member
      if (typedMembers && typedMembers.length > 0) {
        const userIds = typedMembers.map(member => member.user_id);

        const { data: profiles, error: profilesError } = await supabase
          .from("profiles")
          .select("id, display_name, email, avatar_url")
          .in("id", userIds);

        if (profilesError) {
          console.warn('Error fetching member profiles:', profilesError.message);
          // Return members without profiles
          return typedMembers.map(member => ({
            ...member,
            profile: null
          }));
        }

        // Combine members with their profiles
        return typedMembers.map(member => {
          const profile = profiles?.find(p => p.id === member.user_id) || null;
          return {
            ...member,
            profile
          };
        });
      }

      return [];
    } catch (err) {
      console.error('Error fetching workspace members:', err);
      return [];
    }
  },

  async addMember(workspaceId: string, userId: string, role: string = 'member') {
    // Check if user is already a member to avoid unique constraint errors
    const { data: existing } = await supabase
      .from("workspace_members" as any)
      .select("id")
      .eq("workspace_id", workspaceId)
      .eq("user_id", userId)
      .maybeSingle();

    if (existing) return existing;

    const { data, error } = await supabase
      .from("workspace_members" as any)
      .insert({ workspace_id: workspaceId, user_id: userId, role })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async removeMember(workspaceId: string, userId: string) {
    const { error } = await supabase
      .from("workspace_members" as any)
      .delete()
      .eq("workspace_id", workspaceId)
      .eq("user_id", userId);

    if (error) throw error;
  },

  async update(id: string, updates: { name: string }) {
    const { data, error } = await supabase
      .from("workspaces" as any)
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async delete(id: string) {
    const { error } = await supabase
      .from("workspaces" as any)
      .delete()
      .eq("id", id);

    if (error) throw error;
  },

  // Invite functions
  async generateInviteLink(workspaceId: string, role: string = 'member') {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("No user found");

    // Generate a random token for the invite link
    const inviteToken = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);

    try {
      const { data, error } = await supabase
        .from("workspace_invites" as any)
        .insert({
          workspace_id: workspaceId,
          inviter_id: user.id,
          role,
          invite_token: inviteToken,
        })
        .select()
        .single();

      if (error) {
        // If the table doesn't exist, throw a more descriptive error
        if (error.code === '42P01' || error.message.toLowerCase().includes('does not exist')) {
          console.warn('workspace_invites table does not exist:', error.message);
          throw new Error('Invite links feature is not available: Table does not exist');
        }
        throw error;
      }
      return data;
    } catch (err) {
      // Handle any other errors that might occur, particularly network errors
      if (err instanceof Error &&
        (err.message.includes('does not exist') ||
          err.message.includes('404') ||
          err.message.includes('missing'))) {
        console.warn('workspace_invites table does not exist:', err.message);
        throw new Error('Invite links feature is not available: Table does not exist');
      }
      // Re-throw other errors
      throw err;
    }
  },

  async updateMemberRole(workspaceId: string, userId: string, role: string) {
    const { data, error } = await supabase
      .from("workspace_members" as any)
      .update({ role })
      .eq("workspace_id", workspaceId)
      .eq("user_id", userId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async getAnalytics(workspaceId: string) {
    // try to fetch members with profile information in one go
    // if this fails (due to migration not applied or cache stale), we'll do a two-step fetch
    let { data: members, error: membersError } = await supabase
      .from("workspace_members" as any)
      .select("*, profiles:profiles!user_id(display_name, avatar_url, email)")
      .eq("workspace_id", workspaceId);

    if (membersError) {
      console.warn("Direct join failed, falling back to manual join for analytics members:", membersError.message);

      // Fallback: manual join
      const { data: basicMembers, error: basicError } = await supabase
        .from("workspace_members" as any)
        .select("*")
        .eq("workspace_id", workspaceId);

      if (basicError) {
        console.error("Error fetching workspace members (basic):", basicError);
      } else if (basicMembers && basicMembers.length > 0) {
        const userIds = (basicMembers as any[]).map(m => m.user_id);
        const { data: profiles, error: profilesError } = await supabase
          .from("profiles")
          .select("id, display_name, avatar_url, email")
          .in("id", userIds);

        if (profilesError) {
          console.error("Error fetching profiles for fallback:", profilesError);
        }

        members = (basicMembers as any[]).map(m => ({
          ...m,
          profiles: profiles?.find(p => p.id === m.user_id) || null
        }));
      }
    }

    // Fetch documents
    const { data: docs, error: docsError } = await supabase
      .from("documents")
      .select("*")
      .eq("workspace_id", workspaceId);

    if (docsError) {
      console.warn("Error fetching documents for analytics:", docsError);
    }

    // Fetch spreadsheets
    const { data: sheets, error: sheetsError } = await supabase
      .from("spreadsheets")
      .select("*")
      .eq("workspace_id", workspaceId);

    if (sheetsError) {
      console.warn("Error fetching spreadsheets for analytics:", sheetsError);
    }

    // Fetch user activity - handle case where table might not exist
    let activity = [];
    try {
      const { data: activityData, error: activityError } = await supabase
        .from("user_activity" as any)
        .select("*")
        .eq("workspace_id", workspaceId);

      if (!activityError) {
        activity = activityData || [];
      }
    } catch (err) {
      console.warn("Activity fetch skipped:", err);
    }

    return {
      members: members || [],
      documents: docs || [],
      spreadsheets: sheets || [],
      activity: activity
    };
  },

  async useInviteLink(token: string) {
    try {
      // Call the secure RPC function
      const { data, error } = await (supabase.rpc as any)('join_workspace_with_token', {
        token_text: token
      });

      if (error) {
        // Propagate the specific error message from the database
        throw new Error(error.message);
      }

      return data;
    } catch (err) {
      console.error('Error using invite link:', err);
      if (err instanceof Error) throw err;
      throw new Error("An unexpected error occurred while joining the workspace");
    }
  }
};

export const userActivityApi = {
  async heartbeat(workspaceId: string, fileId: string, fileType: "document" | "spreadsheet") {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Use upsert with calculation for total_seconds_spent
    // We ping every 30 seconds
    const { data: existing } = await (supabase
      .from("user_activity" as any)
      .select("total_seconds_spent")
      .eq("user_id", user.id)
      .eq("file_id", fileId)
      .maybeSingle() as any);

    const seconds = ((existing as any)?.total_seconds_spent || 0) + 30;

    const { error } = await supabase
      .from("user_activity" as any)
      .upsert({
        user_id: user.id,
        workspace_id: workspaceId,
        file_id: fileId,
        file_type: fileType,
        last_ping: new Date().toISOString(),
        total_seconds_spent: seconds
      }, { onConflict: 'user_id,file_id' });

    if (error) console.error("Heartbeat error:", error);
  },

  async getActiveInWorkspace(workspaceId: string) {
    const twoMinutesAgo = new Date(Date.now() - 2 * 60 * 1000).toISOString();

    const { data, error } = await supabase
      .from("user_activity" as any)
      .select("*, profiles!user_id(display_name, avatar_url)")
      .eq("workspace_id", workspaceId)
      .gt("last_ping", twoMinutesAgo);

    if (!error) return data;

    // Fallback
    const { data: activity, error: actError } = await supabase
      .from("user_activity" as any)
      .select("*")
      .eq("workspace_id", workspaceId)
      .gt("last_ping", twoMinutesAgo);

    if (actError) throw actError;

    if (activity && activity.length > 0) {
      const userIds = (activity as any[]).map(a => a.user_id);
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, display_name, avatar_url")
        .in("id", userIds);

      return (activity as any[]).map(a => ({
        ...a,
        profiles: profiles?.find(p => p.id === a.user_id) || null
      }));
    }

    return activity;
  }
};

// Documents API
export const documentsApi = {
  async getAll(workspaceId?: string) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    let query = supabase
      .from("documents")
      .select("*, profiles!owner_id(display_name, avatar_url)")
      .order("updated_at", { ascending: false });

    if (workspaceId === "all") {
    } else if (workspaceId) {
      query = query.eq("workspace_id", workspaceId);
    } else {
      query = query.is("workspace_id", null).eq("owner_id", user.id);
    }

    const { data, error } = await query;
    if (!error) return data;

    // Fallback
    let baseQuery = supabase
      .from("documents")
      .select("*")
      .order("updated_at", { ascending: false });

    if (workspaceId === "all") {
    } else if (workspaceId) {
      baseQuery = baseQuery.eq("workspace_id", workspaceId);
    } else {
      baseQuery = baseQuery.is("workspace_id", null).eq("owner_id", user.id);
    }

    const { data: docs } = await baseQuery;
    if (docs && docs.length > 0) {
      const ownerIds = (docs as any[]).map(d => d.owner_id);
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, display_name, avatar_url")
        .in("id", ownerIds);

      return (docs as any[]).map(d => ({
        ...d,
        profiles: profiles?.find(p => p.id === d.owner_id) || null
      }));
    }
    return docs || [];
  },


  async getById(id: string) {
    const { data, error } = await supabase
      .from("documents")
      .select("*, profiles!owner_id(display_name, avatar_url)")
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

  async search(queryText: string) {
    const { data, error } = await supabase
      .from("documents")
      .select("*, profiles!owner_id(display_name, avatar_url)")
      .ilike("title", `%${queryText}%`)
      .order("updated_at", { ascending: false });

    if (error) throw error;
    return data;
  },
};

// Spreadsheets API
export const spreadsheetsApi = {
  async getAll(workspaceId?: string) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    let query = supabase
      .from("spreadsheets")
      .select("*, profiles!owner_id(display_name, avatar_url)")
      .order("updated_at", { ascending: false });

    if (workspaceId === "all") {
    } else if (workspaceId) {
      query = query.eq("workspace_id", workspaceId);
    } else {
      query = query.is("workspace_id", null).eq("owner_id", user.id);
    }

    const { data, error } = await query;
    if (!error) return data;

    // Fallback
    let baseQuery = supabase
      .from("spreadsheets")
      .select("*")
      .order("updated_at", { ascending: false });

    if (workspaceId === "all") {
    } else if (workspaceId) {
      baseQuery = baseQuery.eq("workspace_id", workspaceId);
    } else {
      baseQuery = baseQuery.is("workspace_id", null).eq("owner_id", user.id);
    }

    const { data: sheets } = await baseQuery;
    if (sheets && sheets.length > 0) {
      const ownerIds = (sheets as any[]).map(s => s.owner_id);
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, display_name, avatar_url")
        .in("id", ownerIds);

      return (sheets as any[]).map(s => ({
        ...s,
        profiles: profiles?.find(p => p.id === s.owner_id) || null
      }));
    }
    return sheets || [];
  },

  async getById(id: string) {
    const { data, error } = await supabase
      .from("spreadsheets")
      .select("*, profiles!owner_id(display_name, avatar_url)")
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

  async search(queryText: string) {
    const { data, error } = await supabase
      .from("spreadsheets")
      .select("*, profiles!owner_id(display_name, avatar_url)")
      .ilike("title", `%${queryText}%`)
      .order("updated_at", { ascending: false });

    if (error) throw error;
    return data;
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
      .select("*, profiles!user_id(display_name, email, avatar_url)")
      .eq("document_id", documentId);

    if (error) throw error;
    return data;
  },

  async getSpreadsheetPermissions(spreadsheetId: string) {
    const { data, error } = await supabase
      .from("document_permissions")
      .select("*, profiles!user_id(display_name, email, avatar_url)")
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

  async findByEmail(email: string) {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("email", email)
      .maybeSingle();

    if (error) throw error;
    return data;
  }
};

// Comments API
export const commentsApi = {
  async getByDocument(documentId: string) {
    const { data, error } = await supabase
      .from("comments" as any)
      .select(`
        *,
        profiles!user_id(display_name, email, avatar_url),
        comment_replies(
          *,
          profiles!user_id(display_name, email, avatar_url)
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
        profiles!user_id(display_name, email, avatar_url)
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
        profiles!user_id(display_name, email, avatar_url)
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
      .select("*, profiles!user_id(display_name, email, avatar_url)")
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
      .select("*, profiles!user_id(display_name, email, avatar_url)")
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
