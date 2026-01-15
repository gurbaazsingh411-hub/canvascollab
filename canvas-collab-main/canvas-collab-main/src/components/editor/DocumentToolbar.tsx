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
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

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
}

export function DocumentToolbar({ editor }: DocumentToolbarProps) {
  if (!editor) {
    return null;
  }

  const setLink = () => {
    const url = window.prompt("Enter URL:");
    if (url) {
      editor.chain().focus().setLink({ href: url }).run();
    }
  };

  return (
    <div className="floating-toolbar flex items-center gap-0.5 p-1">
      {/* History */}
      <ToolbarButton
        icon={Undo}
        label="Undo (⌘Z)"
        onClick={() => editor.chain().focus().undo().run()}
        disabled={!editor.can().undo()}
      />
      <ToolbarButton
        icon={Redo}
        label="Redo (⌘⇧Z)"
        onClick={() => editor.chain().focus().redo().run()}
        disabled={!editor.can().redo()}
      />

      <Separator orientation="vertical" className="mx-1 h-6" />

      {/* Headings */}
      <ToolbarButton
        icon={Heading1}
        label="Heading 1"
        active={editor.isActive("heading", { level: 1 })}
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
      />
      <ToolbarButton
        icon={Heading2}
        label="Heading 2"
        active={editor.isActive("heading", { level: 2 })}
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
      />
      <ToolbarButton
        icon={Heading3}
        label="Heading 3"
        active={editor.isActive("heading", { level: 3 })}
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
      />

      <Separator orientation="vertical" className="mx-1 h-6" />

      {/* Text Formatting */}
      <ToolbarButton
        icon={Bold}
        label="Bold (⌘B)"
        active={editor.isActive("bold")}
        onClick={() => editor.chain().focus().toggleBold().run()}
      />
      <ToolbarButton
        icon={Italic}
        label="Italic (⌘I)"
        active={editor.isActive("italic")}
        onClick={() => editor.chain().focus().toggleItalic().run()}
      />
      <ToolbarButton
        icon={Strikethrough}
        label="Strikethrough"
        active={editor.isActive("strike")}
        onClick={() => editor.chain().focus().toggleStrike().run()}
      />
      <ToolbarButton
        icon={Code}
        label="Inline Code"
        active={editor.isActive("code")}
        onClick={() => editor.chain().focus().toggleCode().run()}
      />

      <Separator orientation="vertical" className="mx-1 h-6" />

      {/* Lists */}
      <ToolbarButton
        icon={List}
        label="Bullet List"
        active={editor.isActive("bulletList")}
        onClick={() => editor.chain().focus().toggleBulletList().run()}
      />
      <ToolbarButton
        icon={ListOrdered}
        label="Numbered List"
        active={editor.isActive("orderedList")}
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
      />

      <Separator orientation="vertical" className="mx-1 h-6" />

      {/* Insert */}
      <ToolbarButton
        icon={Link2}
        label="Insert Link"
        active={editor.isActive("link")}
        onClick={setLink}
      />
      <ToolbarButton
        icon={Quote}
        label="Block Quote"
        active={editor.isActive("blockquote")}
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
      />
      <ToolbarButton
        icon={Minus}
        label="Horizontal Rule"
        onClick={() => editor.chain().focus().setHorizontalRule().run()}
      />
      <ToolbarButton
        icon={SquareSplitVertical}
        label="Page Break"
        onClick={() => {
          // Insert page break
          editor.chain().focus().setPageBreak().run();
        }}
      />
    </div>
  );
}