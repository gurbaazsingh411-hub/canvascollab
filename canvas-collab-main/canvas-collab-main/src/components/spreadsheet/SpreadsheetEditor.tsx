import { useState, useCallback } from "react";
import { SpreadsheetToolbar } from "./SpreadsheetToolbar";
import { SpreadsheetGrid } from "./SpreadsheetGrid";
import { CollaboratorPresence } from "../editor/CollaboratorPresence";
import { getColumnLabel } from "@/lib/formulas";

interface SpreadsheetEditorProps {
  spreadsheetId: string;
  onImport?: (data: any[][]) => void;
}

export function SpreadsheetEditor({ spreadsheetId, onImport }: SpreadsheetEditorProps) {
  const [selectedCell, setSelectedCell] = useState<{
    row: number;
    col: number;
    cellKey: string;
    label: string;
    data: any;
  } | null>(null);

  // Mock collaborators for demo
  const collaborators = [
    { id: "1", name: "Charlie Davis", color: "hsl(30, 100%, 55%)" },
  ];

  const handleCellSelected = useCallback((cell: any) => {
    if (cell) {
      setSelectedCell({
        ...cell,
        label: `${getColumnLabel(cell.col)}${cell.row + 1}`
      });
    } else {
      setSelectedCell(null);
    }
  }, []);

  // Cells state for toolbar (export)
  const [cells, setCells] = useState<Record<string, any>>({});

  return (
    <div className="flex h-full flex-col bg-background">
      {/* Sub-Header with Toolbar and Presence */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-border bg-background/95 backdrop-blur px-4 py-1 gap-2">
        <SpreadsheetToolbar
          spreadsheetId={spreadsheetId}
          onImport={onImport}
          cells={cells}
          setCells={setCells}
        />
        <div className="hidden sm:block px-2">
          <CollaboratorPresence collaborators={collaborators} />
        </div>
      </div>

      {/* Formula Bar */}
      <div className="flex items-center gap-2 border-b border-border bg-muted/30 px-3 lg:px-4 py-2 shrink-0">
        <div className="flex h-7 min-w-[50px] sm:min-w-[60px] items-center justify-center rounded border border-border bg-background px-1 sm:px-2 text-xs sm:text-sm font-medium">
          {selectedCell?.label || ""}
        </div>
        <div className="flex-1">
          <div className="flex items-center h-7 w-full rounded border border-border bg-background px-2 text-xs sm:text-sm text-foreground">
            {selectedCell ? (selectedCell.data.formula || String(selectedCell.data.value || "")) : <span className="text-muted-foreground italic">Select a cell to view formula</span>}
          </div>
        </div>
      </div>

      {/* Spreadsheet Grid */}
      <div className="flex-1 overflow-hidden relative">
        <SpreadsheetGrid
          spreadsheetId={spreadsheetId}
          onCellSelected={handleCellSelected}
        />
      </div>

      {/* Status Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-t border-border bg-muted/30 px-4 lg:px-6 py-1.5 text-[10px] sm:text-xs text-muted-foreground gap-2 sm:gap-4 shrink-0">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-success animate-pulse" />
            Live Syncing
          </span>
          <span className="hidden sm:inline">Sheet 1 of 1</span>
        </div>
        <div className="flex items-center gap-3 sm:gap-4 ml-auto sm:ml-0">
          <span>Row: {selectedCell ? selectedCell.row + 1 : "-"}</span>
          <span>Col: {selectedCell ? selectedCell.label.replace(/[0-9]/g, '') : "-"}</span>
          {selectedCell?.data.value && <span>Value: {String(selectedCell.data.value)}</span>}
        </div>
      </div>
    </div>
  );
}
