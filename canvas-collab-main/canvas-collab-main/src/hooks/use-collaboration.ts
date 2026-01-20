import { useEffect, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./use-auth";

export interface CursorPosition {
    from: number;
    to: number;
    head: number;
}

export interface Collaborator {
    id: string;
    name: string;
    email: string;
    color: string;
    cursor?: CursorPosition;
}

export function useCollaboration(documentId: string | undefined, onMessage?: (payload: any) => void) {
    const { user, profile } = useAuth();
    const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
    const [isConnected, setIsConnected] = useState(false);
    const [channel, setChannel] = useState<any>(null);
    const [userColor] = useState(() => `hsl(${Math.random() * 360}, 70%, 60%)`);
    const lastUpdateRef = useRef<number>(0);

    useEffect(() => {
        if (!documentId || !user || documentId === "new") return;

        const channelName = `document:${documentId}`;
        const newChannel = supabase.channel(channelName);
        setChannel(newChannel);

        // Track presence
        newChannel
            .on("presence", { event: "sync" }, () => {
                const state = newChannel.presenceState();
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

                console.log('Collaborators updated:', users);
                setCollaborators(users);
            })
            .on("broadcast", { event: "change" }, ({ payload }) => {
                if (onMessage) onMessage(payload);
            })
            .subscribe(async (status) => {
                if (status === "SUBSCRIBED") {
                    setIsConnected(true);
                    // Track this user's presence
                    await newChannel.track({
                        user_id: user.id,
                        name: profile?.display_name || user.email?.split("@")[0] || "Anonymous",
                        email: user.email,
                        color: userColor,
                        online_at: new Date().toISOString(),
                    });
                }
            });

        return () => {
            newChannel.unsubscribe();
            setIsConnected(false);
            setChannel(null);
        };
    }, [documentId, user, profile, userColor]);

    const updateCursor = (position: CursorPosition) => {
        if (!channel || !user) return;

        // Throttle updates to 100ms
        const now = Date.now();
        if (now - lastUpdateRef.current < 100) return;
        lastUpdateRef.current = now;

        // Update presence with new cursor position
        channel.track({
            user_id: user.id,
            name: profile?.display_name || user.email?.split("@")[0] || "Anonymous",
            email: user.email,
            color: userColor,
            cursor: position,
            online_at: new Date().toISOString(),
        });
    };

    const broadcastChange = (payload: any) => {
        if (!channel) return;
        channel.send({
            type: "broadcast",
            event: "change",
            payload,
        });
    };

    return {
        collaborators,
        isConnected,
        updateCursor,
        broadcastChange,
        userColor,
    };
}
