import { AppLayout } from "@/components/layout/AppLayout";
import { FileBrowser } from "@/components/dashboard/FileBrowser";
import { useFiles } from "@/hooks/use-files";

export default function RecentPage() {
    const { files, isLoading } = useFiles();

    return (
        <AppLayout title="Recent Files">
            <div className="p-6">
                <FileBrowser
                    title="Recent Files"
                    files={files}
                    isLoading={isLoading}
                    emptyMessage="No recent files found."
                />
            </div>
        </AppLayout>
    );
}
