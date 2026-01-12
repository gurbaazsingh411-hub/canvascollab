import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FileText, Table2, LayoutGrid, List, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { FileCard } from "@/components/dashboard/FileCard";
import { useToggleStar } from "@/hooks/use-files";

interface FileBrowserProps {
    title: string;
    files: any[]; // Using any for now to match api structure, strict typing would be better
    isLoading: boolean;
    emptyMessage?: string;
    showStarrredOnly?: boolean;
}

export function FileBrowser({ title, files, isLoading, emptyMessage = "No files found." }: FileBrowserProps) {
    const navigate = useNavigate();
    const toggleStar = useToggleStar();
    const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

    const handleFileClick = (file: any) => {
        if (file.type === "document") {
            navigate(`/document/${file.id}`);
        } else {
            navigate(`/spreadsheet/${file.id}`);
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold">{title}</h1>
                <div className="flex items-center rounded-lg border border-border p-0.5">
                    <Button
                        variant="ghost"
                        size="icon"
                        className={cn("h-8 w-8", viewMode === "grid" && "bg-muted")}
                        onClick={() => setViewMode("grid")}
                    >
                        <LayoutGrid className="h-4 w-4" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        className={cn("h-8 w-8", viewMode === "list" && "bg-muted")}
                        onClick={() => setViewMode("list")}
                    >
                        <List className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            {files.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center border-2 border-dashed rounded-lg">
                    <FileText className="h-10 w-10 text-muted-foreground/50 mb-2" />
                    <p className="text-muted-foreground">{emptyMessage}</p>
                </div>
            ) : (
                <>
                    {viewMode === "grid" ? (
                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                            {files.map((file) => (
                                <FileCard
                                    key={file.id}
                                    file={{
                                        id: file.id,
                                        title: file.title,
                                        type: file.type,
                                        updatedAt: new Date(file.updated_at),
                                        starred: file.starred || false,
                                    }}
                                    onClick={() => handleFileClick(file)}
                                    onToggleStar={() => toggleStar.mutate({ id: file.id, type: file.type, starred: !file.starred })}
                                />
                            ))}
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {files.map((file) => (
                                <div
                                    key={file.id}
                                    onClick={() => handleFileClick(file)}
                                    className="flex items-center gap-4 rounded-lg border border-border bg-card p-3 cursor-pointer transition-colors hover:bg-muted/50"
                                >
                                    {file.type === "document" ? (
                                        <FileText className="h-5 w-5 text-info" />
                                    ) : (
                                        <Table2 className="h-5 w-5 text-success" />
                                    )}
                                    <div className="flex-1 min-w-0">
                                        <p className="font-medium text-card-foreground truncate">{file.title}</p>
                                        <p className="text-xs text-muted-foreground">
                                            Edited {new Date(file.updated_at).toLocaleDateString()}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
