import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { FileCard } from "@/components/dashboard/FileCard";
import { CreateNewButton } from "@/components/dashboard/CreateNewButton";
import { LayoutGrid, List, Clock, Star, FileText, Table2, Loader2, Building, Plus, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import { useFiles, useCreateDocument, useCreateSpreadsheet, useToggleStar } from "@/hooks/use-files";
import { useWorkspaces } from "@/hooks/use-workspaces";
import { TodoList } from "@/components/dashboard/TodoList";
import { useNotifications } from "@/contexts/NotificationContext";

export default function Index() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { addNotification } = useNotifications();

  // Workspace State
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState<string | null>(null);
  const { workspaces, createWorkspace } = useWorkspaces();
  const [isCreateWorkspaceOpen, setIsCreateWorkspaceOpen] = useState(false);
  const [newWorkspaceName, setNewWorkspaceName] = useState("");

  const { files, isLoading } = useFiles(selectedWorkspaceId || undefined);
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
    const doc = await createDocument.mutateAsync({ workspaceId: selectedWorkspaceId || undefined });
    addNotification({
      title: "Document Created",
      message: `"${doc.title}" has been created.`,
      type: "success",
    });
    navigate(`/document/${doc.id}`);
  };

  const handleCreateSpreadsheet = async () => {
    const sheet = await createSpreadsheet.mutateAsync({ workspaceId: selectedWorkspaceId || undefined });
    addNotification({
      title: "Spreadsheet Created",
      message: `"${sheet.title}" has been created.`,
      type: "success",
    });
    navigate(`/spreadsheet/${sheet.id}`);
  };

  const handleCreateWorkspace = async () => {
    if (!newWorkspaceName.trim()) return;
    await createWorkspace.mutateAsync(newWorkspaceName);
    addNotification({
      title: "Workspace Created",
      message: `Your new workspace "${newWorkspaceName}" is ready.`,
      type: "success",
    });
    setNewWorkspaceName("");
    setIsCreateWorkspaceOpen(false);
  };

  const currentWorkspace = workspaces?.find(w => w.id === selectedWorkspaceId);

  return (
    <AppLayout title={currentWorkspace ? currentWorkspace.name : "My Dashboard"}>
      <div className="p-6 space-y-8 animate-fade-in">
        {/* Workspace Selector */}
        <div className="flex items-center justify-between border-b border-border pb-6">
          <div className="flex items-center gap-4">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Building className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-bold">
                {currentWorkspace ? currentWorkspace.name : "Personal Workspace"}
              </h1>
              <p className="text-xs text-muted-foreground">
                {currentWorkspace ? "Shared with workspace members" : "Private files only you can see"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Select
              value={selectedWorkspaceId || "personal"}
              onValueChange={(val) => setSelectedWorkspaceId(val === "personal" ? null : val)}
            >
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Select Workspace" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="personal">Personal Workspace</SelectItem>
                {workspaces?.map((w) => (
                  <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {selectedWorkspaceId && (
              <>
                <Button variant="outline" size="sm" asChild>
                  <Link to={`/workspace/${selectedWorkspaceId}/analytics`}>
                    Analytics
                  </Link>
                </Button>
                <Button variant="ghost" size="icon" asChild>
                  <Link to={`/workspace/${selectedWorkspaceId}/settings`}>
                    <Settings className="h-4 w-4 text-muted-foreground" />
                  </Link>
                </Button>
              </>
            )}

            <Dialog open={isCreateWorkspaceOpen} onOpenChange={setIsCreateWorkspaceOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="icon">
                  <Plus className="h-4 w-4" />
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New Workspace</DialogTitle>
                </DialogHeader>
                <div className="py-4">
                  <Label>Workspace Name</Label>
                  <Input
                    value={newWorkspaceName}
                    onChange={(e) => setNewWorkspaceName(e.target.value)}
                    placeholder="e.g. Marketing Team"
                  />
                </div>
                <DialogFooter>
                  <Button onClick={handleCreateWorkspace}>Create Workspace</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Header Actions */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-foreground">Overview</h2>
          </div>
          <CreateNewButton
            onCreateDocument={handleCreateDocument}
            onCreateSpreadsheet={handleCreateSpreadsheet}
          />
        </div>

        {/* Quick Stats & Todo List */}
        <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            <div className="grid gap-4 sm:grid-cols-2">
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
            {/* Recent Files Section (Moved inside left column) */}
            <section>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
                  <Clock className="h-5 w-5 text-muted-foreground" />
                  {currentWorkspace ? "Workspace Files" : "My Files"}
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
                    {currentWorkspace
                      ? "This workspace is empty. Create a file to collaborate!"
                      : "Create your first document or spreadsheet to get started."}
                  </p>
                  <CreateNewButton
                    onCreateDocument={handleCreateDocument}
                    onCreateSpreadsheet={handleCreateSpreadsheet}
                  />
                </div>
              ) : viewMode === "grid" ? (
                <div className="grid gap-4 sm:grid-cols-2">
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
                      onToggleStar={() => toggleStar.mutate({ id: file.id, type: file.type, starred: !file.starred })}
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
          </div>

          {/* Right Column: Todo List */}
          <div className="h-[500px] lg:h-auto">
            <TodoList />
          </div>
        </div>

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
                  onToggleStar={() => toggleStar.mutate({ id: file.id, type: file.type, starred: !file.starred })}
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
