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

export default function SpreadsheetPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [isCommentSidebarOpen, setIsCommentSidebarOpen] = useState(false);
  const [isVersionHistoryOpen, setIsVersionHistoryOpen] = useState(false);

  // Placeholder for import handler - to be connected to grid
  const handleImport = (data: any[][]) => {
    console.log("Imported data:", data);
    // TODO: Pass data to grid component to update cells
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
              defaultValue={id === "new" ? "Untitled Spreadsheet" : "Q1 Budget"}
              className="bg-transparent text-sm font-semibold focus:outline-none"
            />
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span>File</span>
              <span>Edit</span>
              <span>View</span>
              <span>Insert</span>
              <span>Format</span>
              <span>Data</span>
              <span>Tools</span>
              <span>Help</span>
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
      <SpreadsheetToolbar spreadsheetId={id || ""} onImport={handleImport} />

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
      />
    </div>
  );
}
