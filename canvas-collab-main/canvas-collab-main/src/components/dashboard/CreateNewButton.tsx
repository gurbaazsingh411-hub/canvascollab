import { FileText, Table2, Plus } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

interface CreateNewButtonProps {
  onCreateDocument?: () => void;
  onCreateSpreadsheet?: () => void;
}

export function CreateNewButton({
  onCreateDocument,
  onCreateSpreadsheet,
}: CreateNewButtonProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Create New
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem
          onClick={onCreateDocument}
          className="gap-2 cursor-pointer"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-info/10">
            <FileText className="h-4 w-4 text-info" />
          </div>
          <div>
            <div className="font-medium">Document</div>
            <div className="text-xs text-muted-foreground">Rich text editor</div>
          </div>
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={onCreateSpreadsheet}
          className="gap-2 cursor-pointer"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-success/10">
            <Table2 className="h-4 w-4 text-success" />
          </div>
          <div>
            <div className="font-medium">Spreadsheet</div>
            <div className="text-xs text-muted-foreground">Grid with formulas</div>
          </div>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
