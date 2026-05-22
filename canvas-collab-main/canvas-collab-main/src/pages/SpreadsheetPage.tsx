import { useParams, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { ArrowLeft, MoreHorizontal, MessageSquare, History, Share2, Lock, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SpreadsheetGrid } from "@/components/spreadsheet/SpreadsheetGrid";
import { SpreadsheetToolbar } from "@/components/spreadsheet/SpreadsheetToolbar";
import { SpreadsheetEditor } from "@/components/spreadsheet/SpreadsheetEditor";
import { ShareDialog } from "@/components/editor/ShareDialog";
import { CommentSidebar } from "@/components/editor/CommentSidebar";
import { VersionHistory } from "@/components/editor/VersionHistory";
import { useNotifications } from "@/contexts/NotificationContext";
import { useHeartbeat } from "@/hooks/use-heartbeat";
import { useSpreadsheet, useSpreadsheetCells, useUpdateSpreadsheet } from "@/hooks/use-files";
import { useCreateSpreadsheetVersion } from "@/hooks/use-versions";
import { useUserRole } from "@/hooks/use-permissions";
import { useCollaboration } from "@/hooks/use-collaboration";
import { toast } from "sonner";

export default function SpreadsheetPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [isCommentSidebarOpen, setIsCommentSidebarOpen] = useState(false);
  const [isVersionHistoryOpen, setIsVersionHistoryOpen] = useState(false);
  const [cells, setCells] = useState<Record<string, any>>({});
  const { addNotification } = useNotifications();
  
  const { data: sheet, isLoading: isLoadingSheet } = useSpreadsheet(id);
  const { data: spreadsheetCells, isLoading: isLoadingCells } = useSpreadsheetCells(id);
  const createVersion = useCreateSpreadsheetVersion();
  const updateSpreadsheet = useUpdateSpreadsheet();

  const { role, isEditable, isLoading: isLoadingRole } = useUserRole(
    id,
    "spreadsheet",
    sheet?.owner_id,
    sheet?.workspace_id
  );

  const [title, setTitle] = useState("");

  const { collaborators, broadcastChange } = useCollaboration(id, (payload) => {
    if (payload.type === "title_update" && payload.title !== title) {
      setTitle(payload.title);
    }
  });

  useEffect(() => {
    if (id === "new") {
      setTitle("Untitled Spreadsheet");
    } else if (sheet?.title) {
      setTitle(sheet.title);
    }
  }, [sheet?.title, id]);

  const handleTitleChange = (newTitle: string) => {
    if (!isEditable) return;
    setTitle(newTitle);
    
    // Broadcast the change in real-time
    broadcastChange({
      type: "title_update",
      title: newTitle,
    });
  };

  useEffect(() => {
    if (!id || id === "new" || !isEditable || !title) return;
    
    const handler = setTimeout(() => {
      if (title !== sheet?.title) {
        updateSpreadsheet.mutate({
          id,
          updates: { title },
        });
      }
    }, 1000);

    return () => clearTimeout(handler);
  }, [title, id, isEditable, sheet?.title]);

  // Track activity
  useHeartbeat(sheet?.workspace_id, id, "spreadsheet");

  const handleSaveVersion = async () => {
    if (!sheet || !id || id === "new" || !spreadsheetCells) return;

    try {
      const versionCells = spreadsheetCells.map((cell: any) => ({
        row: cell.row_index,
        col: cell.col_index,
        value: cell.value,
        formula: cell.formula,
      }));

      await createVersion.mutateAsync({
        spreadsheet_id: id,
        cells: versionCells,
        title: sheet.title || "Untitled Version",
      });
      toast.success("Version saved successfully");
    } catch (error) {
      console.error("Failed to save version:", error);
      toast.error("Failed to save version");
    }
  };

  // Placeholder for import handler - to be connected to grid
  const handleImport = (data: any[][]) => {
    console.log("Imported data:", data);
    // TODO: Pass data to grid component to update cells

    // Add notification for import
    addNotification({
      title: "Import Successful",
      message: `Data imported into spreadsheet successfully`,
      type: "success",
    });
  };

  const isLoading = isLoadingSheet || (id !== "new" && isLoadingCells) || isLoadingRole;

  if (isLoading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (id !== "new" && !sheet) {
    return (
      <div className="flex h-screen w-screen flex-col items-center justify-center bg-background px-4">
        <div className="glass-card flex max-w-md flex-col items-center p-8 text-center rounded-2xl">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10 text-destructive mb-6">
            <Lock className="h-8 w-8" />
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-2">Access Denied</h1>
          <p className="text-sm text-muted-foreground mb-6">
            You don't have permission to access this spreadsheet or it does not exist. Please ask the owner to share it with you.
          </p>
          <Button onClick={() => navigate("/")} className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col bg-background">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-border px-4 py-2 gap-3">
        <div className="flex items-center gap-3 lg:gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/")}
            title="Back to Dashboard"
            className="h-9 w-9"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="min-w-0">
            <input
              type="text"
              value={title}
              onChange={(e) => handleTitleChange(e.target.value)}
              disabled={!isEditable || !sheet}
              className="bg-transparent text-sm font-semibold focus:outline-none focus:ring-1 focus:ring-primary/20 rounded px-1 transition-all placeholder:text-muted-foreground/50 w-full truncate"
            />
            <div className="flex items-center gap-2 lg:gap-3 text-[10px] sm:text-xs text-muted-foreground px-1 mt-0.5 overflow-x-auto scrollbar-none pb-1">
              {['File', 'Edit', 'View', 'Insert', 'Format', 'Data', 'Tools', 'Help'].map((item) => (
                <span key={item} className="cursor-pointer hover:text-foreground transition-colors whitespace-nowrap">
                  {item}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 ml-auto sm:ml-0">
          <ShareDialog
            documentId={id || ""}
            documentTitle={title || "Untitled Spreadsheet"}
            fileType="spreadsheet"
          />
          <Button
            variant="outline"
            size="sm"
            className="gap-2 hidden md:flex"
            onClick={() => setIsCommentSidebarOpen(!isCommentSidebarOpen)}
          >
            <MessageSquare className="h-4 w-4" />
            Comments
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="md:hidden"
            onClick={() => setIsCommentSidebarOpen(!isCommentSidebarOpen)}
          >
            <MessageSquare className="h-4 w-4" />
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreHorizontal className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleSaveVersion}>
                <History className="h-4 w-4 mr-2" />
                Save Version
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setIsVersionHistoryOpen(true)}>
                <History className="h-4 w-4 mr-2" />
                Version History
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-destructive">
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Editor Content */}
      <div className="flex-1 overflow-hidden relative">
        <SpreadsheetEditor
          spreadsheetId={id || ""}
          onImport={handleImport}
          isEditable={isEditable}
          collaborators={collaborators}
        />

        {/* Comment Sidebar */}
        <CommentSidebar
          documentId={id || ""}
          isOpen={isCommentSidebarOpen}
          onClose={() => setIsCommentSidebarOpen(false)}
        />
      </div>

      {/* Version History Dialog */}
      <VersionHistory
        documentId={id || ""}
        isOpen={isVersionHistoryOpen}
        onClose={() => setIsVersionHistoryOpen(false)}
        fileType="spreadsheet"
      />
    </div>
  );
}
