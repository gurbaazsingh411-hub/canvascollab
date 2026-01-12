import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { History, X, RotateCcw, Eye } from "lucide-react";
import { useDocumentVersions, useRestoreDocumentVersion, type DocumentVersion } from "@/hooks/use-versions";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface VersionHistoryProps {
    documentId: string;
    isOpen: boolean;
    onClose: () => void;
}

export function VersionHistory({ documentId, isOpen, onClose }: VersionHistoryProps) {
    const [previewVersion, setPreviewVersion] = useState<DocumentVersion | null>(null);
    const { data: versions, isLoading } = useDocumentVersions(documentId);
    const restoreVersion = useRestoreDocumentVersion();

    const handleRestore = async (version: DocumentVersion) => {
        try {
            await restoreVersion.mutateAsync({
                documentId,
                versionId: version.id,
                content: version.content,
                title: version.title,
            });
            toast.success("Version restored successfully");
            onClose();
        } catch (error) {
            console.error("Failed to restore version:", error);
            toast.error("Failed to restore version");
        }
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 60) return `${diffMins} minutes ago`;
        if (diffHours < 24) return `${diffHours} hours ago`;
        if (diffDays < 7) return `${diffDays} days ago`;
        return date.toLocaleDateString();
    };

    return (
        <>
            <Dialog open={isOpen} onOpenChange={onClose}>
                <DialogContent className="max-w-2xl max-h-[80vh]">
                    <DialogHeader>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <History className="h-5 w-5" />
                                <DialogTitle>Version History</DialogTitle>
                            </div>
                            <Button variant="ghost" size="icon" onClick={onClose}>
                                <X className="h-4 w-4" />
                            </Button>
                        </div>
                    </DialogHeader>

                    <ScrollArea className="h-[500px] pr-4">
                        {isLoading ? (
                            <div className="flex items-center justify-center py-8">
                                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                            </div>
                        ) : versions && versions.length > 0 ? (
                            <div className="space-y-2">
                                {versions.map((version) => (
                                    <div
                                        key={version.id}
                                        className="flex items-center justify-between rounded-lg border border-border p-4 hover:bg-muted/50 transition-colors"
                                    >
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2">
                                                <h4 className="font-medium">{version.title}</h4>
                                                <span className="text-xs text-muted-foreground">
                                                    {formatDate(version.created_at)}
                                                </span>
                                            </div>
                                            <p className="text-sm text-muted-foreground mt-1">
                                                Edited by {version.profiles?.display_name || version.profiles?.email || "Unknown"}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => setPreviewVersion(version)}
                                            >
                                                <Eye className="h-4 w-4 mr-2" />
                                                Preview
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => handleRestore(version)}
                                                disabled={restoreVersion.isPending}
                                            >
                                                <RotateCcw className="h-4 w-4 mr-2" />
                                                Restore
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center py-12 text-center">
                                <History className="h-12 w-12 text-muted-foreground/50 mb-2" />
                                <p className="text-sm text-muted-foreground">No version history yet</p>
                                <p className="text-xs text-muted-foreground">
                                    Versions are automatically saved when you edit the document
                                </p>
                            </div>
                        )}
                    </ScrollArea>
                </DialogContent>
            </Dialog>

            {/* Preview Dialog */}
            {previewVersion && (
                <Dialog open={!!previewVersion} onOpenChange={() => setPreviewVersion(null)}>
                    <DialogContent className="max-w-4xl max-h-[80vh]">
                        <DialogHeader>
                            <DialogTitle>{previewVersion.title} - Preview</DialogTitle>
                        </DialogHeader>
                        <ScrollArea className="h-[500px]">
                            <div className="prose prose-lg dark:prose-invert max-w-none p-6">
                                <div dangerouslySetInnerHTML={{ __html: JSON.stringify(previewVersion.content, null, 2) }} />
                            </div>
                        </ScrollArea>
                        <div className="flex justify-end gap-2 pt-4">
                            <Button variant="outline" onClick={() => setPreviewVersion(null)}>
                                Close
                            </Button>
                            <Button onClick={() => {
                                handleRestore(previewVersion);
                                setPreviewVersion(null);
                            }}>
                                Restore This Version
                            </Button>
                        </div>
                    </DialogContent>
                </Dialog>
            )}
        </>
    );
}
