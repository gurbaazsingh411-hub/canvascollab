import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { FileCard } from "@/components/dashboard/FileCard";
import { CreateNewButton } from "@/components/dashboard/CreateNewButton";
import { LayoutGrid, List, Clock, Star, FileText, Table2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import { useFiles, useCreateDocument, useCreateSpreadsheet, useToggleStar } from "@/hooks/use-files";

export default function Index() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { files, isLoading } = useFiles();
  const createDocument = useCreateDocument();
  const createSpreadsheet = useCreateSpreadsheet();
  const toggleStar = useToggleStar();
  
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [filter, setFilter] = useState<"all" | "documents" | "spreadsheets">("all");

  // Show auth prompt if not logged in
  if (!authLoading && !user) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background p-6">
        <div className="text-center space-y-6 animate-fade-in">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary mx-auto">
            <FileText className="h-8 w-8 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">Welcome to CollabDocs</h1>
            <p className="text-muted-foreground max-w-md">
              Create and collaborate on documents and spreadsheets in real-time.
              Sign in to get started.
            </p>
          </div>
          <div className="flex gap-3 justify-center">
            <Button asChild size="lg">
              <Link to="/auth">Get Started</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const filteredFiles = files.filter((file) => {
    if (filter === "documents") return file.type === "document";
    if (filter === "spreadsheets") return file.type === "spreadsheet";
    return true;
  });

  const recentFiles = filteredFiles.slice(0, 8);
  const starredFiles = filteredFiles.filter((f) => f.starred);

  const handleFileClick = (file: typeof files[0]) => {
    if (file.type === "document") {
      navigate(`/document/${file.id}`);
    } else {
      navigate(`/spreadsheet/${file.id}`);
    }
  };

  const handleCreateDocument = async () => {
    const doc = await createDocument.mutateAsync(undefined);
    navigate(`/document/${doc.id}`);
  };

  const handleCreateSpreadsheet = async () => {
    const sheet = await createSpreadsheet.mutateAsync(undefined);
    navigate(`/spreadsheet/${sheet.id}`);
  };

  const handleToggleStar = (id: string, type: "document" | "spreadsheet", currentStarred: boolean) => {
    toggleStar.mutate({ id, type, starred: !currentStarred });
  };

  return (
    <AppLayout title="Dashboard">
      <div className="p-6 space-y-8 animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Welcome back</h1>
            <p className="text-muted-foreground">
              Pick up where you left off or create something new.
            </p>
          </div>
          <CreateNewButton
            onCreateDocument={handleCreateDocument}
            onCreateSpreadsheet={handleCreateSpreadsheet}
          />
        </div>

        {/* Quick Stats */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <QuickStatCard
            icon={FileText}
            label="Documents"
            value={files.filter((f) => f.type === "document").length}
            color="text-info"
            bgColor="bg-info/10"
          />
          <QuickStatCard
            icon={Table2}
            label="Spreadsheets"
            value={files.filter((f) => f.type === "spreadsheet").length}
            color="text-success"
            bgColor="bg-success/10"
          />
          <QuickStatCard
            icon={Star}
            label="Starred"
            value={starredFiles.length}
            color="text-warning"
            bgColor="bg-warning/10"
          />
          <QuickStatCard
            icon={Clock}
            label="Total Files"
            value={files.length}
            color="text-primary"
            bgColor="bg-primary/10"
          />
        </div>

        {/* Recent Files Section */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
              <Clock className="h-5 w-5 text-muted-foreground" />
              Recent Files
            </h2>
            <div className="flex items-center gap-2">
              <Tabs value={filter} onValueChange={(v) => setFilter(v as typeof filter)}>
                <TabsList className="h-8">
                  <TabsTrigger value="all" className="text-xs px-3 h-7">All</TabsTrigger>
                  <TabsTrigger value="documents" className="text-xs px-3 h-7">Docs</TabsTrigger>
                  <TabsTrigger value="spreadsheets" className="text-xs px-3 h-7">Sheets</TabsTrigger>
                </TabsList>
              </Tabs>
              <div className="flex items-center rounded-lg border border-border p-0.5">
                <Button
                  variant="ghost"
                  size="icon"
                  className={cn("h-7 w-7", viewMode === "grid" && "bg-muted")}
                  onClick={() => setViewMode("grid")}
                >
                  <LayoutGrid className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className={cn("h-7 w-7", viewMode === "list" && "bg-muted")}
                  onClick={() => setViewMode("list")}
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : recentFiles.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <FileText className="h-12 w-12 text-muted-foreground/50 mb-4" />
              <h3 className="font-medium text-foreground mb-1">No files yet</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Create your first document or spreadsheet to get started.
              </p>
              <CreateNewButton
                onCreateDocument={handleCreateDocument}
                onCreateSpreadsheet={handleCreateSpreadsheet}
              />
            </div>
          ) : viewMode === "grid" ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {recentFiles.map((file) => (
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
                  onToggleStar={() => handleToggleStar(file.id, file.type, file.starred || false)}
                />
              ))}
            </div>
          ) : (
            <div className="space-y-2">
              {recentFiles.map((file) => (
                <FileListItem
                  key={file.id}
                  file={{
                    id: file.id,
                    title: file.title,
                    type: file.type,
                    updatedAt: new Date(file.updated_at),
                    starred: file.starred || false,
                  }}
                  onClick={() => handleFileClick(file)}
                />
              ))}
            </div>
          )}
        </section>

        {/* Starred Files Section */}
        {starredFiles.length > 0 && (
          <section>
            <h2 className="text-lg font-semibold text-foreground flex items-center gap-2 mb-4">
              <Star className="h-5 w-5 text-warning" />
              Starred
            </h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {starredFiles.map((file) => (
                <FileCard
                  key={file.id}
                  file={{
                    id: file.id,
                    title: file.title,
                    type: file.type,
                    updatedAt: new Date(file.updated_at),
                    starred: true,
                  }}
                  onClick={() => handleFileClick(file)}
                  onToggleStar={() => handleToggleStar(file.id, file.type, true)}
                />
              ))}
            </div>
          </section>
        )}
      </div>
    </AppLayout>
  );
}

interface QuickStatCardProps {
  icon: React.ElementType;
  label: string;
  value: number;
  color: string;
  bgColor: string;
}

function QuickStatCard({ icon: Icon, label, value, color, bgColor }: QuickStatCardProps) {
  return (
    <div className="flex items-center gap-4 rounded-xl border border-border bg-card p-4">
      <div className={cn("flex h-12 w-12 items-center justify-center rounded-lg", bgColor)}>
        <Icon className={cn("h-6 w-6", color)} />
      </div>
      <div>
        <p className="text-2xl font-bold text-card-foreground">{value}</p>
        <p className="text-sm text-muted-foreground">{label}</p>
      </div>
    </div>
  );
}

interface FileListItemProps {
  file: {
    id: string;
    title: string;
    type: "document" | "spreadsheet";
    updatedAt: Date;
    starred: boolean;
  };
  onClick?: () => void;
}

function FileListItem({ file, onClick }: FileListItemProps) {
  const Icon = file.type === "document" ? FileText : Table2;
  const typeColor = file.type === "document" ? "text-info" : "text-success";

  return (
    <div
      onClick={onClick}
      className="flex items-center gap-4 rounded-lg border border-border bg-card p-3 cursor-pointer transition-colors hover:bg-muted/50"
    >
      <Icon className={cn("h-5 w-5", typeColor)} />
      <div className="flex-1 min-w-0">
        <p className="font-medium text-card-foreground truncate">{file.title}</p>
        <p className="text-xs text-muted-foreground">
          Edited {formatRelativeTime(file.updatedAt)}
        </p>
      </div>
      {file.starred && <Star className="h-4 w-4 fill-warning text-warning" />}
    </div>
  );
}

function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString();
}
