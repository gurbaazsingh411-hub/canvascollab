import { useEffect, useState, useRef } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import Image from "@tiptap/extension-image";
import { Table } from "@tiptap/extension-table";
import TableRow from "@tiptap/extension-table-row";
import TableCell from "@tiptap/extension-table-cell";
import TableHeader from "@tiptap/extension-table-header";
import { PageBreak } from "@/lib/PageBreak";
import { DocumentToolbar } from "./DocumentToolbar";
import { CollaboratorPresence } from "./CollaboratorPresence";
import { useDocument, useUpdateDocument } from "@/hooks/use-files";
import { useCollaboration } from "@/hooks/use-collaboration";
import { Loader2 } from "lucide-react";

interface DocumentEditorProps {
  documentId?: string;
}

const EMPTY_DOC = {
  type: "doc",
  content: [{ type: "paragraph" }],
};

export function DocumentEditor({ documentId }: DocumentEditorProps) {
  const [title, setTitle] = useState("Untitled Document");
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  // Fetch document data
  const { data: document, isLoading } = useDocument(documentId);
  const updateDocument = useUpdateDocument();
  const [isLocallyEditing, setIsLocallyEditing] = useState(false);
  const localEditTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const broadcastTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Real-time collaboration
  const { collaborators, isConnected, broadcastChange, updateCursor, userColor } = useCollaboration(documentId, (payload) => {
    // Handle content updates
    if (payload.type === "content_update" && editor && !isLocallyEditing) {
      const currentContent = editor.getJSON();
      if (JSON.stringify(currentContent) !== JSON.stringify(payload.content)) {
        editor.commands.setContent(payload.content, { emitUpdate: false });
      }
    }

    // Handle title updates
    if (payload.type === "title_update" && payload.title !== title) {
      setTitle(payload.title);
    }
  });


  // Initialize Tiptap editor with collaborative cursor plugin
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),
      Placeholder.configure({
        placeholder: "Start typing your document content here...",
      }),
      Image.configure({
        HTMLAttributes: {
          class: "max-w-full h-auto rounded-lg",
        },
      }),
      Table.configure({
        resizable: true,
      }),
      TableRow,
      TableHeader,
      TableCell,
      PageBreak,
    ],
    content: (document?.content && (document.content as any).type === "doc" ? document.content : EMPTY_DOC) as any,
    editorProps: {
      attributes: {
        class: "prose prose-lg dark:prose-invert max-w-none focus:outline-none min-h-[600px]",
      },
    },
    onUpdate: ({ editor }) => {
      // Mark as locally editing
      setIsLocallyEditing(true);

      // Clear existing timeout
      if (localEditTimeoutRef.current) {
        clearTimeout(localEditTimeoutRef.current);
      }

      // Reset local editing flag after 1 second of inactivity
      localEditTimeoutRef.current = setTimeout(() => {
        setIsLocallyEditing(false);
      }, 1000);

      // Debounce broadcasts to reduce network traffic and race conditions
      if (broadcastTimeoutRef.current) {
        clearTimeout(broadcastTimeoutRef.current);
      }

      broadcastTimeoutRef.current = setTimeout(() => {
        broadcastChange({
          type: "content_update",
          content: editor.getJSON(),
        });
      }, 300); // Broadcast after 300ms of inactivity

      // Auto-save after 2 seconds of inactivity
      handleAutoSave(editor.getJSON());
    },
  });

  // Load document content when it changes (but only on initial load or document ID change)
  const previousDocIdRef = useRef<string | undefined>();
  useEffect(() => {
    if (document && editor && previousDocIdRef.current !== documentId) {
      previousDocIdRef.current = documentId;
      setTitle(document.title);
      const content = (document.content && (document.content as any).type === "doc")
        ? (document.content as any)
        : EMPTY_DOC;
      editor.commands.setContent(content, { emitUpdate: false });
    }
  }, [document, editor, documentId]);

  // Auto-save debounce
  useEffect(() => {
    if (!editor || !documentId || documentId === "new") return;

    const timeoutId = setTimeout(() => {
      const content = editor.getJSON();
      saveDocument(content);
    }, 2000);

    return () => clearTimeout(timeoutId);
  }, [editor?.state.doc, documentId]);

  const handleAutoSave = (content: any) => {
    // Debounced save handled by useEffect
  };

  const saveDocument = async (content: any) => {
    if (!documentId || documentId === "new") return;

    setIsSaving(true);
    try {
      await updateDocument.mutateAsync({
        id: documentId,
        updates: {
          title,
          content,
        },
      });
      setLastSaved(new Date());
    } catch (error) {
      console.error("Failed to save document:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleTitleChange = (newTitle: string) => {
    setTitle(newTitle);

    // Broadcast title change to other users
    broadcastChange({
      type: "title_update",
      title: newTitle,
    });

    // Debounce database save
    if (documentId && documentId !== "new") {
      setTimeout(() => {
        updateDocument.mutateAsync({
          id: documentId,
          updates: { title: newTitle },
        });
      }, 500);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      {/* Toolbar */}
      <div className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-background/95 backdrop-blur px-4 lg:px-6 py-2 lg:py-3">
        <DocumentToolbar editor={editor} />
        <CollaboratorPresence collaborators={collaborators} />
      </div>

      {/* Editor Canvas */}
      <div className="flex-1 overflow-y-auto px-4 lg:px-6 py-6 lg:py-8 scrollbar-thin">
        <div className="mx-auto max-w-3xl">
          <div className="document-canvas min-h-[800px] p-6 lg:p-12">
            {/* Title */}
            <input
              type="text"
              placeholder="Untitled Document"
              className="mb-4 lg:mb-6 w-full border-none bg-transparent text-2xl lg:text-4xl font-bold text-foreground placeholder:text-muted-foreground/50 focus:outline-none"
              value={title}
              onChange={(e) => handleTitleChange(e.target.value)}
            />

            {/* Tiptap Editor */}
            <EditorContent editor={editor} />
          </div>
        </div>
      </div>

      {/* Status Bar */}
      <div className="flex items-center justify-between border-t border-border bg-muted/30 px-6 py-2 text-xs text-muted-foreground">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5">
            {isSaving ? (
              <>
                <Loader2 className="h-3 w-3 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <span className="h-1.5 w-1.5 rounded-full bg-success" />
                {lastSaved ? `Saved ${formatRelativeTime(lastSaved)}` : "Auto-saved"}
              </>
            )}
          </span>
        </div>
        <div className="flex items-center gap-4">
          <span>Words: {editor?.storage.characterCount?.words() || 0}</span>
          <span>Characters: {editor?.storage.characterCount?.characters() || 0}</span>
        </div>
      </div>
    </div>
  );
}

function formatRelativeTime(date: Date): string {
  const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  return `${hours}h ago`;
}