import { AppLayout } from "@/components/layout/AppLayout";
import { FileBrowser } from "@/components/dashboard/FileBrowser";
import { useFiles } from "@/hooks/use-files";
import { useAuth } from "@/hooks/use-auth";

export default function SharedPage() {
    const { user } = useAuth();
    const { files, isLoading } = useFiles("all");

    // Filter files where I am NOT the owner
    const sharedFiles = files?.filter(f => f.owner_id !== user?.id) || [];

    return (
        <AppLayout title="Shared with me">
            <div className="p-6">
                <FileBrowser
                    title="Shared Files"
                    files={sharedFiles}
                    isLoading={isLoading}
                    emptyMessage="No files have been shared with you yet."
                />
            </div>
        </AppLayout>
    );
}
