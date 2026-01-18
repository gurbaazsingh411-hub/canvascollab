import { useParams, useNavigate } from "react-router-dom";
import { useState } from "react";
import { DocumentEditor } from "@/components/editor/DocumentEditor";
import { ShareDialog } from "@/components/editor/ShareDialog";
import { CommentSidebar } from "@/components/editor/CommentSidebar";
import { VersionHistory } from "@/components/editor/VersionHistory";
import { ArrowLeft, Download, MoreHorizontal, MessageSquare, FileText, Printer, History } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { exportToPDF, exportToDOCX } from "@/lib/export";
import { toast } from "sonner";
import { useNotifications } from "@/contexts/NotificationContext";
import { useHeartbeat } from "@/hooks/use-heartbeat";
import { useDocument } from "@/hooks/use-files";
import { useCreateDocumentVersion } from "@/hooks/use-versions";

export default function DocumentPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [isCommentSidebarOpen, setIsCommentSidebarOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isVersionHistoryOpen, setIsVersionHistoryOpen] = useState(false);
  const { addNotification } = useNotifications();
  const { data: doc } = useDocument(id);
  const createVersion = useCreateDocumentVersion();

  // Track activity
  useHeartbeat(doc?.workspace_id, id, "document");

  const handleSaveVersion = async () => {
    if (!doc || !id || id === "new") return;

    try {
      await createVersion.mutateAsync({
        document_id: id,
        content: doc.content,
        title: doc.title || "Untitled Version",
      });
      toast.success("Version saved successfully");
    } catch (error) {
      console.error("Failed to save version:", error);
      toast.error("Failed to save version");
    }
  };

  const handleExport = async (format: 'pdf' | 'docx') => {
    setIsExporting(true);
    try {
      const title = id === "new" ? "Untitled Document" : "Q4 Marketing Strategy";
      const contentElement = document.querySelector('.document-canvas') as HTMLElement;

      if (!contentElement) {
        throw new Error("Document content not found");
      }

      if (format === 'pdf') {
        await exportToPDF(title, contentElement);
        toast.success("PDF exported successfully");
      } else {
        // For DOCX, we need the editor JSON - this will be improved when we connect to actual document data
        toast.info("DOCX export coming soon");
      }
    } catch (error) {
      console.error("Export failed:", error);
      toast.error(`Failed to export as ${format.toUpperCase()}`);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="flex h-screen flex-col bg-background">
      {/* Header */}
      <header className="flex h-14 items-center justify-between border-b border-border px-4">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/")}
            className="text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-sm font-medium text-foreground">
              {id === "new" ? "Untitled Document" : "Q4 Marketing Strategy"}
            </h1>
            <p className="text-xs text-muted-foreground">
              {id === "new" ? "Draft" : "Last edited 5 minutes ago"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <ShareDialog
            documentId={id || ""}
            documentTitle={id === "new" ? "Untitled Document" : "Q4 Marketing Strategy"}
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
              <Button variant="outline" size="sm" className="gap-2">
                <Download className="h-4 w-4" />
                Export
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => handleExport('pdf')} disabled={isExporting}>
                <FileText className="h-4 w-4 mr-2" />
                Export as PDF
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExport('docx')} disabled={isExporting}>
                <FileText className="h-4 w-4 mr-2" />
                Export as DOCX
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => window.print()}>
                <Printer className="h-4 w-4 mr-2" />
                Print
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
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
              <DropdownMenuItem>Print</DropdownMenuItem>
              <DropdownMenuItem>Make a Copy</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-destructive">Delete</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {/* Editor */}
      <div className="flex-1 overflow-hidden">
        <DocumentEditor documentId={id} />
      </div>

      {/* Comment Sidebar */}
      <CommentSidebar
        documentId={id || ""}
        isOpen={isCommentSidebarOpen}
        onClose={() => setIsCommentSidebarOpen(false)}
      />

      {/* Version History */}
      <VersionHistory
        documentId={id || ""}
        isOpen={isVersionHistoryOpen}
        onClose={() => setIsVersionHistoryOpen(false)}
        fileType="document"
      />
    </div>
  );
}
