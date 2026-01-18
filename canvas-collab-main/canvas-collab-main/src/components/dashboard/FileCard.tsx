import { FileText, Table2, MoreHorizontal, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

export interface FileItem {
  id: string;
  title: string;
  type: "document" | "spreadsheet";
  updatedAt: Date;
  starred?: boolean;
  shared?: boolean;
  collaborators?: number;
}

interface FileCardProps {
  file: FileItem;
  onClick?: () => void;
  onToggleStar?: () => void;
  onDelete?: () => void;
}

export function FileCard({ file, onClick, onToggleStar, onDelete }: FileCardProps) {
  const Icon = file.type === "document" ? FileText : Table2;
  const typeColor = file.type === "document" ? "text-info" : "text-success";
  const typeBg = file.type === "document" ? "bg-info/10" : "bg-success/10";

  return (
    <div
      onClick={onClick}
      className="file-card group relative flex cursor-pointer flex-col rounded-xl border border-border bg-card p-4 transition-all"
    >
      {/* File Type Icon */}
      <div className={cn("mb-4 flex h-12 w-12 items-center justify-center rounded-lg", typeBg)}>
        <Icon className={cn("h-6 w-6", typeColor)} />
      </div>

      {/* Title */}
      <h3 className="mb-1 font-medium text-card-foreground line-clamp-2">
        {file.title}
      </h3>

      {/* Meta info */}
      <div className="mt-auto flex items-center gap-2 text-xs text-muted-foreground">
        <span>Edited {formatRelativeTime(file.updatedAt)}</span>
      </div>

      {/* Actions */}
      <div className="absolute right-2 top-2 flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-muted-foreground hover:text-warning"
          onClick={(e) => {
            e.stopPropagation();
            onToggleStar?.();
          }}
        >
          <Star className={cn("h-4 w-4", file.starred && "fill-warning text-warning")} />
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground"
              onClick={(e) => e.stopPropagation()}
            >
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onClick?.(); }}>
              Open
            </DropdownMenuItem>
            <DropdownMenuItem>Rename</DropdownMenuItem>
            <DropdownMenuItem>Duplicate</DropdownMenuItem>
            <DropdownMenuItem>Share</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-destructive"
              onClick={(e) => {
                e.stopPropagation();
                onDelete?.();
              }}
            >
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
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
