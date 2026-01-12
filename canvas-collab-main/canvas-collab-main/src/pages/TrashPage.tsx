import { AppLayout } from "@/components/layout/AppLayout";
import { Trash2 } from "lucide-react";

export default function TrashPage() {
    return (
        <AppLayout title="Trash">
            <div className="p-6 flex flex-col items-center justify-center h-[60vh] text-center">
                <div className="h-16 w-16 bg-muted rounded-full flex items-center justify-center mb-4">
                    <Trash2 className="h-8 w-8 text-muted-foreground" />
                </div>
                <h2 className="text-xl font-semibold mb-2">Trash is empty</h2>
                <p className="text-muted-foreground">Items in trash will be permanently deleted after 30 days.</p>
                <p className="text-xs text-muted-foreground mt-8">(Note: Soft delete not yet enabled in this version)</p>
            </div>
        </AppLayout>
    );
}
