import { Editor } from "@tiptap/react";
import {
  Bold,
  Italic,
  Strikethrough,
  Code,
  List,
  ListOrdered,
  Quote,
  Heading1,
  Heading2,
  Heading3,
  Undo,
  Redo,
  Minus,
  Link2,
  SquareSplitVertical,
  Download,
  Printer,
  ChevronDown,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { exportToDOCX, exportToPDF, printDocument } from "@/lib/export";
import { useToast } from "@/hooks/use-toast";

interface ToolbarButtonProps {
  icon: React.ElementType;
  label: string;
  active?: boolean;
  onClick?: () => void;
  disabled?: boolean;
}

function ToolbarButton({ icon: Icon, label, active, onClick, disabled }: ToolbarButtonProps) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          onClick={onClick}
          disabled={disabled}
          className={cn(
            "toolbar-button",
            active && "active",
            disabled && "opacity-50 cursor-not-allowed"
          )}
        >
          <Icon className="h-4 w-4" />
        </button>
      </TooltipTrigger>
      <TooltipContent side="bottom" className="text-xs">
        {label}
      </TooltipContent>
    </Tooltip>
  );
}

interface DocumentToolbarProps {
  editor: Editor | null;
  fileName?: string;
  disabled?: boolean;
}

export function DocumentToolbar({ editor, fileName = "document", disabled = false }: DocumentToolbarProps) {
  if (!editor) {
    return null;
  }

  const { toast } = useToast();

  const setLink = () => {
    const url = window.prompt("Enter URL:");
    if (url) {
      editor.chain().focus().setLink({ href: url }).run();
    }
  };

  const handleExportDocx = async () => {
    try {
      await exportToDOCX(fileName, editor.getJSON());
      toast({
        title: "Export Successful",
        description: `Document exported as ${fileName}.docx`,
      });
    } catch (error) {
      toast({
        title: "Export Failed",
        description: "Failed to export document. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleExportPdf = async () => {
    try {
      // Direct call to exportToPDF targeting the .tiptap container
      await exportToPDF(fileName, 'tiptap');
      toast({
        title: "Export Successful",
        description: `Document exported as ${fileName}.pdf`,
      });
    } catch (error) {
      toast({
        title: "Export Failed",
        description: "Failed to export document. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handlePrint = async () => {
    try {
      printDocument();
      toast({
        title: "Print Initiated",
        description: "Document print window opened",
      });
    } catch (error) {
      toast({
        title: "Print Failed",
        description: "Failed to print document. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="floating-toolbar flex items-center gap-0.5 p-1 overflow-x-auto lg:overflow-x-visible scrollbar-none w-full lg:w-auto">
      {/* History */}
      <ToolbarButton
        icon={Undo}
        label="Undo (⌘Z)"
        onClick={() => editor.chain().focus().undo().run()}
        disabled={disabled || !editor.can().undo()}
      />
      <ToolbarButton
        icon={Redo}
        label="Redo (⌘⇧Z)"
        onClick={() => editor.chain().focus().redo().run()}
        disabled={disabled || !editor.can().redo()}
      />

      <Separator orientation="vertical" className="mx-1 h-6" />

      {/* Headings */}
      <ToolbarButton
        icon={Heading1}
        label="Heading 1"
        active={editor.isActive("heading", { level: 1 })}
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        disabled={disabled}
      />
      <ToolbarButton
        icon={Heading2}
        label="Heading 2"
        active={editor.isActive("heading", { level: 2 })}
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        disabled={disabled}
      />
      <ToolbarButton
        icon={Heading3}
        label="Heading 3"
        active={editor.isActive("heading", { level: 3 })}
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        disabled={disabled}
      />

      <Separator orientation="vertical" className="mx-1 h-6" />

      {/* Text Formatting */}
      <ToolbarButton
        icon={Bold}
        label="Bold (⌘B)"
        active={editor.isActive("bold")}
        onClick={() => editor.chain().focus().toggleBold().run()}
        disabled={disabled}
      />
      <ToolbarButton
        icon={Italic}
        label="Italic (⌘I)"
        active={editor.isActive("italic")}
        onClick={() => editor.chain().focus().toggleItalic().run()}
        disabled={disabled}
      />
      <ToolbarButton
        icon={Strikethrough}
        label="Strikethrough"
        active={editor.isActive("strike")}
        onClick={() => editor.chain().focus().toggleStrike().run()}
        disabled={disabled}
      />
      <ToolbarButton
        icon={Code}
        label="Inline Code"
        active={editor.isActive("code")}
        onClick={() => editor.chain().focus().toggleCode().run()}
        disabled={disabled}
      />

      <Separator orientation="vertical" className="mx-1 h-6" />

      {/* Lists */}
      <ToolbarButton
        icon={List}
        label="Bullet List"
        active={editor.isActive("bulletList")}
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        disabled={disabled}
      />
      <ToolbarButton
        icon={ListOrdered}
        label="Numbered List"
        active={editor.isActive("orderedList")}
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        disabled={disabled}
      />

      <Separator orientation="vertical" className="mx-1 h-6" />

      {/* Insert */}
      <ToolbarButton
        icon={Link2}
        label="Insert Link"
        active={editor.isActive("link")}
        onClick={setLink}
        disabled={disabled}
      />
      <ToolbarButton
        icon={Quote}
        label="Block Quote"
        active={editor.isActive("blockquote")}
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
        disabled={disabled}
      />
      <ToolbarButton
        icon={Minus}
        label="Horizontal Rule"
        onClick={() => editor.chain().focus().setHorizontalRule().run()}
        disabled={disabled}
      />
      <ToolbarButton
        icon={SquareSplitVertical}
        label="Page Break"
        onClick={() => {
          // Insert page break
          editor.chain().focus().setPageBreak().run();
        }}
        disabled={disabled}
      />

      <Separator orientation="vertical" className="mx-1 h-6" />

      {/* Export/Print */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="p-2">
            <Download className="h-4 w-4 mr-2" />
            Export
            <ChevronDown className="h-4 w-4 ml-1" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          <DropdownMenuItem onClick={handleExportDocx}>
            <Download className="h-4 w-4 mr-2" />
            Export as DOCX
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleExportPdf}>
            <Download className="h-4 w-4 mr-2" />
            Export as PDF
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handlePrint}>
            <Printer className="h-4 w-4 mr-2" />
            Print
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}