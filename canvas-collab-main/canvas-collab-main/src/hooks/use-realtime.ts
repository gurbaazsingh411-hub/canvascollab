import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { RealtimeChannel } from "@supabase/supabase-js";

// Hook for real-time document updates
export function useRealtimeDocument(documentId: string | undefined) {
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  useEffect(() => {
    if (!documentId || documentId === "new") return;

    const channel = supabase
      .channel(`document-${documentId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "documents",
          filter: `id=eq.${documentId}`,
        },
        (payload) => {
          console.log("Document update:", payload);
          setLastUpdate(new Date());
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [documentId]);

  return { lastUpdate };
}

// Hook for real-time spreadsheet cell updates
export function useRealtimeCells(spreadsheetId: string | undefined) {
  const [cellUpdates, setCellUpdates] = useState<Map<string, { value: string; updatedBy: string }>>(new Map());

  useEffect(() => {
    if (!spreadsheetId || spreadsheetId === "new") return;

    const channel = supabase
      .channel(`spreadsheet-cells-${spreadsheetId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "spreadsheet_cells",
          filter: `spreadsheet_id=eq.${spreadsheetId}`,
        },
        (payload) => {
          console.log("Cell update:", payload);
          if (payload.eventType === "INSERT" || payload.eventType === "UPDATE") {
            const newCell = payload.new as { cell_key: string; value: string; updated_by: string };
            setCellUpdates((prev) => {
              const updated = new Map(prev);
              updated.set(newCell.cell_key, {
                value: newCell.value || "",
                updatedBy: newCell.updated_by,
              });
              return updated;
            });
          } else if (payload.eventType === "DELETE") {
            const oldCell = payload.old as { cell_key: string };
            setCellUpdates((prev) => {
              const updated = new Map(prev);
              updated.delete(oldCell.cell_key);
              return updated;
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [spreadsheetId]);

  return { cellUpdates };
}

// Hook for real-time presence (who's viewing/editing)
export function useRealtimePresence(channelName: string, userId: string | undefined, userName: string) {
  const [onlineUsers, setOnlineUsers] = useState<Map<string, { name: string; color: string }>>(new Map());

  useEffect(() => {
    if (!userId) return;

    const colors = [
      "hsl(280, 100%, 60%)",
      "hsl(200, 100%, 50%)",
      "hsl(30, 100%, 55%)",
      "hsl(340, 80%, 55%)",
      "hsl(150, 70%, 45%)",
    ];

    const color = colors[hashString(userId) % colors.length];

    const channel = supabase.channel(channelName, {
      config: { presence: { key: userId } },
    });

    channel
      .on("presence", { event: "sync" }, () => {
        const state = channel.presenceState();
        const users = new Map<string, { name: string; color: string }>();
        
        Object.entries(state).forEach(([key, value]) => {
          if (Array.isArray(value) && value.length > 0) {
            const presence = value[0] as unknown as { name: string; color: string };
            if (key !== userId && presence.name) {
              users.set(key, presence);
            }
          }
        });
        
        setOnlineUsers(users);
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          await channel.track({ name: userName, color });
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [channelName, userId, userName]);

  return { onlineUsers };
}

// Simple hash function for consistent color assignment
function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash);
}
