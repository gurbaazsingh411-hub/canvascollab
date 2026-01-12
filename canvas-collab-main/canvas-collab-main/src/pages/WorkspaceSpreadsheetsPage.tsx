import { AppLayout } from "@/components/layout/AppLayout";
import { FileBrowser } from "@/components/dashboard/FileBrowser";
import { useFiles } from "@/hooks/use-files";

export default function WorkspaceSpreadsheetsPage() {
    const { files, isLoading } = useFiles();
    const spreadsheets = files?.filter(f => f.type === 'spreadsheet') || [];

    return (
        <AppLayout title="My Spreadsheets">
            <div className="p-6">
                <FileBrowser
                    title="Spreadsheets"
                    files={spreadsheets}
                    isLoading={isLoading}
                    emptyMessage="No spreadsheets found."
                />
            </div>
        </AppLayout>
    );
}
