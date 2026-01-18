import { useState, useEffect } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Input } from "@/components/ui/input";
import { Search, Loader2, FileText, Table2, Clock } from "lucide-react";
import { useSearchFiles } from "@/hooks/use-files";
import { FileCard } from "@/components/dashboard/FileCard";
import { useNavigate } from "react-router-dom";
import { useToggleStar } from "@/hooks/use-files";

export default function SearchPage() {
    const [query, setQuery] = useState("");
    const [debouncedQuery, setDebouncedQuery] = useState("");
    const navigate = useNavigate();
    const toggleStar = useToggleStar();

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedQuery(query);
        }, 300);
        return () => clearTimeout(timer);
    }, [query]);

    const { data: results, isLoading } = useSearchFiles(debouncedQuery);

    const handleFileClick = (file: any) => {
        if (file.type === "document") {
            navigate(`/document/${file.id}`);
        } else {
            navigate(`/spreadsheet/${file.id}`);
        }
    };

    return (
        <AppLayout title="Search">
            <div className="max-w-5xl mx-auto p-6 space-y-8">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Search documents, spreadsheets..."
                        className="pl-10 h-12 text-lg shadow-sm"
                        autoFocus
                    />
                </div>

                <div className="space-y-4">
                    {debouncedQuery.length > 0 && debouncedQuery.length <= 2 ? (
                        <p className="text-sm text-muted-foreground">Type at least 3 characters to search...</p>
                    ) : isLoading ? (
                        <div className="flex items-center justify-center py-12">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        </div>
                    ) : debouncedQuery.length > 2 && results?.length === 0 ? (
                        <div className="text-center py-12 border rounded-xl bg-muted/20">
                            <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-20" />
                            <h3 className="text-lg font-medium">No results found</h3>
                            <p className="text-muted-foreground">We couldn't find anything matching "{debouncedQuery}"</p>
                        </div>
                    ) : results && results.length > 0 ? (
                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                            {results.map((file) => (
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
                        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
                            <Clock className="h-10 w-10 mb-4 opacity-20" />
                            <p>Your search results will appear here</p>
                        </div>
                    )}
                </div>
            </div>
        </AppLayout>
    );
}
