import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./use-auth";

export interface Collaborator {
    id: string;
    name: string;
    email: string;
    color: string;
    cursor?: { x: number; y: number };
}

export function useCollaboration(documentId: string | undefined) {
    const { user, profile } = useAuth();
    const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
    const [isConnected, setIsConnected] = useState(false);

    useEffect(() => {
        if (!documentId || !user || documentId === "new") return;

        const channelName = `document:${documentId}`;
        const channel = supabase.channel(channelName);

        // Generate a random color for this user
        const userColor = `hsl(${Math.random() * 360}, 70%, 60%)`;

        // Track presence
        channel
            .on("presence", { event: "sync" }, () => {
                const state = channel.presenceState();
                const users: Collaborator[] = [];

                Object.keys(state).forEach((key) => {
                    const presences = state[key];
                    presences.forEach((presence: any) => {
                        if (presence.user_id !== user.id) {
                            users.push({
                                id: presence.user_id,
                                name: presence.name || "Anonymous",
                                email: presence.email || "",
                                color: presence.color || "hsl(200, 70%, 60%)",
                                cursor: presence.cursor,
                            });
                        }
                    });
                });

                setCollaborators(users);
            })
            .on("presence", { event: "join" }, ({ key, newPresences }) => {
                console.log("User joined:", newPresences);
            })
            .on("presence", { event: "leave" }, ({ key, leftPresences }) => {
                console.log("User left:", leftPresences);
            })
            .subscribe(async (status) => {
                if (status === "SUBSCRIBED") {
                    setIsConnected(true);
                    // Track this user's presence
                    await channel.track({
                        user_id: user.id,
                        name: profile?.display_name || user.email?.split("@")[0] || "Anonymous",
                        email: user.email,
                        color: userColor,
                        online_at: new Date().toISOString(),
                    });
                }
            });

        return () => {
            channel.unsubscribe();
            setIsConnected(false);
        };
    }, [documentId, user, profile]);

    const updateCursor = (position: { x: number; y: number }) => {
        if (!documentId || !user) return;

        const channel = supabase.channel(`document:${documentId}`);
        channel.track({
            user_id: user.id,
            cursor: position,
        });
    };

    return {
        collaborators,
        isConnected,
        updateCursor,
    };
}
