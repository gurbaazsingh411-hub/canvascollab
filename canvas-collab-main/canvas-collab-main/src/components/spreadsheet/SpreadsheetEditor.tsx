import { useState, useCallback, useRef } from "react";
import { SpreadsheetToolbar } from "./SpreadsheetToolbar";
import { CollaboratorPresence } from "../editor/CollaboratorPresence";
import { cn } from "@/lib/utils";

interface CellData {
  value: string;
  formula?: string;
}

interface SpreadsheetEditorProps {
  spreadsheetId?: string;
}

const COLUMNS = Array.from({ length: 26 }, (_, i) => String.fromCharCode(65 + i));
const ROWS = Array.from({ length: 100 }, (_, i) => i + 1);
const COLUMN_WIDTH = 100;
const ROW_HEIGHT = 32;

export function SpreadsheetEditor({ spreadsheetId }: SpreadsheetEditorProps) {
  const [cells, setCells] = useState<Record<string, CellData>>({});
  const [selectedCell, setSelectedCell] = useState<string | null>("A1");
  const [editingCell, setEditingCell] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Mock collaborators for demo
  const collaborators = [
    { id: "1", name: "Charlie Davis", color: "hsl(30, 100%, 55%)" },
  ];

  const getCellKey = (col: string, row: number) => `${col}${row}`;

  const handleCellClick = (col: string, row: number) => {
    const key = getCellKey(col, row);
    setSelectedCell(key);
  };

  const handleCellDoubleClick = (col: string, row: number) => {
    const key = getCellKey(col, row);
    setEditingCell(key);
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  const handleCellChange = useCallback((key: string, value: string) => {
    setCells((prev) => ({
      ...prev,
      [key]: { value, formula: value.startsWith("=") ? value : undefined },
    }));
  }, []);

  const handleCellBlur = () => {
    setEditingCell(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent, col: string, row: number) => {
    if (e.key === "Enter") {
      e.preventDefault();
      setEditingCell(null);
      // Move to next row
      const nextRow = row + 1;
      if (nextRow <= ROWS.length) {
        setSelectedCell(getCellKey(col, nextRow));
      }
    } else if (e.key === "Tab") {
      e.preventDefault();
      setEditingCell(null);
      // Move to next column
      const colIndex = COLUMNS.indexOf(col);
      if (colIndex < COLUMNS.length - 1) {
        setSelectedCell(getCellKey(COLUMNS[colIndex + 1], row));
      }
    } else if (e.key === "Escape") {
      setEditingCell(null);
    }
  };

  return (
    <div className="flex h-full flex-col">
      {/* Toolbar */}
      <div className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-background/95 backdrop-blur px-6 py-3">
        <SpreadsheetToolbar />
        <CollaboratorPresence collaborators={collaborators} />
      </div>

      {/* Formula Bar */}
      <div className="flex items-center gap-2 border-b border-border bg-muted/30 px-4 py-2">
        <div className="flex h-7 min-w-[60px] items-center justify-center rounded border border-border bg-background px-2 text-sm font-medium">
          {selectedCell || ""}
        </div>
        <div className="flex-1">
          <input
            type="text"
            placeholder="Enter value or formula"
            value={selectedCell ? cells[selectedCell]?.value || "" : ""}
            onChange={(e) => selectedCell && handleCellChange(selectedCell, e.target.value)}
            className="h-7 w-full rounded border border-border bg-background px-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
      </div>

      {/* Spreadsheet Grid */}
      <div className="flex-1 overflow-auto scrollbar-thin">
        <div className="inline-block min-w-full">
          {/* Header Row */}
          <div className="sticky top-0 z-10 flex bg-muted">
            {/* Corner cell */}
            <div className="cell cell-header sticky left-0 z-20 bg-muted" style={{ width: 50, height: ROW_HEIGHT }}>
              
            </div>
            {/* Column headers */}
            {COLUMNS.map((col) => (
              <div
                key={col}
                className="cell cell-header"
                style={{ width: COLUMN_WIDTH, height: ROW_HEIGHT }}
              >
                {col}
              </div>
            ))}
          </div>

          {/* Data Rows */}
          {ROWS.map((row) => (
            <div key={row} className="flex">
              {/* Row header */}
              <div
                className="cell cell-header sticky left-0 z-10 bg-muted"
                style={{ width: 50, height: ROW_HEIGHT }}
              >
                {row}
              </div>
              {/* Data cells */}
              {COLUMNS.map((col) => {
                const key = getCellKey(col, row);
                const isSelected = selectedCell === key;
                const isEditing = editingCell === key;
                const cellData = cells[key];

                return (
                  <div
                    key={key}
                    onClick={() => handleCellClick(col, row)}
                    onDoubleClick={() => handleCellDoubleClick(col, row)}
                    className={cn(
                      "cell bg-card cursor-cell",
                      isSelected && "ring-2 ring-primary ring-inset z-10"
                    )}
                    style={{ width: COLUMN_WIDTH, height: ROW_HEIGHT }}
                  >
                    {isEditing ? (
                      <input
                        ref={inputRef}
                        type="text"
                        value={cellData?.value || ""}
                        onChange={(e) => handleCellChange(key, e.target.value)}
                        onBlur={handleCellBlur}
                        onKeyDown={(e) => handleKeyDown(e, col, row)}
                        className="h-full w-full bg-transparent px-1 focus:outline-none"
                        autoFocus
                      />
                    ) : (
                      <span className="truncate px-1">
                        {cellData?.formula ? evaluateFormula(cellData.formula, cells) : cellData?.value}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Status Bar */}
      <div className="flex items-center justify-between border-t border-border bg-muted/30 px-6 py-2 text-xs text-muted-foreground">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-success animate-pulse" />
            Auto-saved
          </span>
          <span>Sheet 1 of 1</span>
        </div>
        <div className="flex items-center gap-4">
          <span>Sum: 0</span>
          <span>Average: 0</span>
          <span>Count: 0</span>
        </div>
      </div>
    </div>
  );
}

// Simple formula evaluator (basic SUM, AVERAGE, COUNT)
function evaluateFormula(formula: string, cells: Record<string, CellData>): string {
  try {
    const match = formula.toUpperCase().match(/^=(\w+)\(([A-Z]+\d+):([A-Z]+\d+)\)$/);
    if (!match) return formula;

    const [, func, start, end] = match;
    const startCol = start.match(/[A-Z]+/)?.[0] || "A";
    const startRow = parseInt(start.match(/\d+/)?.[0] || "1");
    const endCol = end.match(/[A-Z]+/)?.[0] || "A";
    const endRow = parseInt(end.match(/\d+/)?.[0] || "1");

    const values: number[] = [];
    for (let c = startCol.charCodeAt(0); c <= endCol.charCodeAt(0); c++) {
      for (let r = startRow; r <= endRow; r++) {
        const key = `${String.fromCharCode(c)}${r}`;
        const val = parseFloat(cells[key]?.value || "0");
        if (!isNaN(val)) values.push(val);
      }
    }

    switch (func) {
      case "SUM":
        return values.reduce((a, b) => a + b, 0).toString();
      case "AVERAGE":
        return values.length ? (values.reduce((a, b) => a + b, 0) / values.length).toFixed(2) : "0";
      case "COUNT":
        return values.length.toString();
      default:
        return formula;
    }
  } catch {
    return "#ERROR";
  }
}
