import { AppLayout } from "@/components/layout/AppLayout";
import { FileBrowser } from "@/components/dashboard/FileBrowser";
import { useFiles } from "@/hooks/use-files";

export default function StarredPage() {
    const { files, isLoading } = useFiles("all");
    const starredFiles = files?.filter(f => f.starred) || [];

    return (
        <AppLayout title="Starred">
            <div className="p-6">
                <FileBrowser
                    title="Starred Files"
                    files={starredFiles}
                    isLoading={isLoading}
                    emptyMessage="No starred files. Star a file to see it here."
                />
            </div>
        </AppLayout>
    );
}
