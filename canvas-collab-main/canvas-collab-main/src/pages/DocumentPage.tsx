import { useParams, useNavigate } from "react-router-dom";
import { useState } from "react";
import { DocumentEditor } from "@/components/editor/DocumentEditor";
import { ShareDialog } from "@/components/editor/ShareDialog";
import { CommentSidebar } from "@/components/editor/CommentSidebar";
import { VersionHistory } from "@/components/editor/VersionHistory";
import { ArrowLeft, MoreHorizontal, MessageSquare, History } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { useNotifications } from "@/contexts/NotificationContext";
import { useHeartbeat } from "@/hooks/use-heartbeat";
import { useDocument } from "@/hooks/use-files";
import { useCreateDocumentVersion } from "@/hooks/use-versions";

export default function DocumentPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [isCommentSidebarOpen, setIsCommentSidebarOpen] = useState(false);
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

  return (
    <div className="flex h-screen flex-col bg-background">
      {/* Header */}
      <header className="flex h-14 items-center justify-between border-b border-border px-3 lg:px-4 gap-2">
        <div className="flex items-center gap-2 lg:gap-3 min-w-0">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/")}
            className="text-muted-foreground hover:text-foreground h-9 w-9 shrink-0"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="min-w-0">
            <h1 className="text-sm font-medium text-foreground truncate">
              {id === "new" ? "Untitled Document" : (doc?.title || "Loading...")}
            </h1>
            <p className="text-[10px] text-muted-foreground truncate">
              {id === "new" ? "Draft" : "Auto-saved"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 lg:gap-2 shrink-0">
          <ShareDialog
            documentId={id || ""}
            documentTitle={id === "new" ? "Untitled Document" : (doc?.title || "Document")}
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
            className="md:hidden h-9 w-9"
            onClick={() => setIsCommentSidebarOpen(!isCommentSidebarOpen)}
          >
            <MessageSquare className="h-4 w-4" />
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-9 w-9">
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
