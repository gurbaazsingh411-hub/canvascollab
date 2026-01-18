import { useEffect } from "react";
import { userActivityApi } from "@/lib/api";

export function useHeartbeat(workspaceId: string | null | undefined, fileId: string | undefined, fileType: "document" | "spreadsheet") {
    useEffect(() => {
        if (!workspaceId || !fileId) return;

        // Initial heartbeat
        userActivityApi.heartbeat(workspaceId, fileId, fileType);

        const interval = setInterval(() => {
            // Only track if document is visible/focused
            if (document.visibilityState === 'visible') {
                userActivityApi.heartbeat(workspaceId, fileId, fileType);
            }
        }, 30000); // 30 seconds

        return () => clearInterval(interval);
    }, [workspaceId, fileId, fileType]);
}
