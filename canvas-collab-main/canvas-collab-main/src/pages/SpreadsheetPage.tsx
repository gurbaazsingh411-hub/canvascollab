import { useParams, useNavigate } from "react-router-dom";
import { useState } from "react";
import { ArrowLeft, MoreHorizontal, MessageSquare, History, Share2 } from "lucide-react";
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
import { ShareDialog } from "@/components/editor/ShareDialog";
import { CommentSidebar } from "@/components/editor/CommentSidebar";
import { VersionHistory } from "@/components/editor/VersionHistory";
import { useNotifications } from "@/contexts/NotificationContext";
import { useHeartbeat } from "@/hooks/use-heartbeat";
import { useSpreadsheet, useSpreadsheetCells } from "@/hooks/use-files";
import { useCreateSpreadsheetVersion } from "@/hooks/use-versions";
import { toast } from "sonner";

export default function SpreadsheetPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [isCommentSidebarOpen, setIsCommentSidebarOpen] = useState(false);
  const [isVersionHistoryOpen, setIsVersionHistoryOpen] = useState(false);
  const [cells, setCells] = useState<Record<string, any>>({});
  const { addNotification } = useNotifications();
  const { data: sheet } = useSpreadsheet(id);
  const { data: spreadsheetCells } = useSpreadsheetCells(id);
  const createVersion = useCreateSpreadsheetVersion();

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

  return (
    <div className="flex h-screen flex-col bg-background">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border px-4 py-2">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/")}
            title="Back to Dashboard"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <input
              type="text"
              defaultValue={id === "new" ? "Untitled Spreadsheet" : (sheet?.title || "Loading...")}
              className="bg-transparent text-sm font-semibold focus:outline-none focus:ring-1 focus:ring-primary/20 rounded px-1 transition-all placeholder:text-muted-foreground/50"
            />
            <div className="flex items-center gap-3 text-xs text-muted-foreground px-1 mt-0.5">
              {['File', 'Edit', 'View', 'Insert', 'Format', 'Data', 'Tools', 'Help'].map((item) => (
                <span key={item} className="cursor-pointer hover:text-foreground transition-colors">
                  {item}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <ShareDialog
            documentId={id || ""}
            documentTitle={id === "new" ? "Untitled Spreadsheet" : "Q1 Budget"}
          />
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={() => setIsCommentSidebarOpen(!isCommentSidebarOpen)}
          >
            <MessageSquare className="h-4 w-4" />
            Comments
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

      {/* Toolbar */}
      <SpreadsheetToolbar spreadsheetId={id || ""} onImport={handleImport} cells={cells} setCells={setCells} />

      {/* Grid */}
      <div className="flex-1 overflow-hidden relative">
        <SpreadsheetGrid spreadsheetId={id || ""} />

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
