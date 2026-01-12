import { AppLayout } from "@/components/layout/AppLayout";
import { FileBrowser } from "@/components/dashboard/FileBrowser";
import { useFiles } from "@/hooks/use-files";

export default function WorkspaceDocumentsPage() {
    const { files, isLoading } = useFiles();
    const documents = files?.filter(f => f.type === 'document') || [];

    return (
        <AppLayout title="My Documents">
            <div className="p-6">
                <FileBrowser
                    title="Documents"
                    files={documents}
                    isLoading={isLoading}
                    emptyMessage="No documents found."
                />
            </div>
        </AppLayout>
    );
}
