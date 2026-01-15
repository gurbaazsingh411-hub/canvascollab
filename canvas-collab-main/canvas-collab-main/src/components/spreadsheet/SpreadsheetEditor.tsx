import { useState, useCallback, useRef } from "react";
import { SpreadsheetToolbar } from "./SpreadsheetToolbar";
import { CollaboratorPresence } from "../editor/CollaboratorPresence";
import { cn } from "@/lib/utils";
import { evaluateFormula } from "@/lib/formulas";

interface CellData {
  value: string;
  formula?: string;
  formulaResult?: string;
  format?: {
    bold?: boolean;
    italic?: boolean;
    backgroundColor?: string;
    textColor?: string;
    fontSize?: number;
    alignment?: 'left' | 'center' | 'right';
  };
}

interface SpreadsheetEditorProps {
  spreadsheetId?: string;
}

export function SpreadsheetEditor({ spreadsheetId }: SpreadsheetEditorProps) {
  const [cells, setCells] = useState<Record<string, CellData>>({});
  const [selectedCell, setSelectedCell] = useState<string | null>("A1");
  const [editingCell, setEditingCell] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  
  // State for freeze panes
  const [frozenRows, setFrozenRows] = useState(0);
  const [frozenCols, setFrozenCols] = useState(0);
  
  // State for sorting and filtering
  const [sortConfig, setSortConfig] = useState<{column: string, direction: 'asc' | 'desc'} | null>(null);
  const [filters, setFilters] = useState<Record<string, string>>({});
  
  const COLUMNS = Array.from({ length: 26 }, (_, i) => String.fromCharCode(65 + i));
  const ROWS = Array.from({ length: 100 }, (_, i) => i + 1);
  const COLUMN_WIDTH = 100;
  const ROW_HEIGHT = 32;

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

  // Functions for freeze panes
  const toggleFreezeRow = (rowIndex: number) => {
    setFrozenRows(frozenRows === rowIndex ? 0 : rowIndex);
  };

  const toggleFreezeColumn = (colIndex: number) => {
    setFrozenCols(frozenCols === colIndex ? 0 : colIndex);
  };

  // Functions for sorting
  const sortColumn = (col: string) => {
    const direction = sortConfig && sortConfig.column === col && sortConfig.direction === 'asc' ? 'desc' : 'asc';
    setSortConfig({ column: col, direction });
    
    // Sort the data
    const sortedCells = { ...cells };
    // Note: Actual sorting logic would need to be implemented based on data
  };

  // Functions for filtering
  const applyFilter = (col: string, filterValue: string) => {
    setFilters(prev => ({
      ...prev,
      [col]: filterValue
    }));
  };

  const clearFilter = (col: string) => {
    setFilters(prev => {
      const newFilters = { ...prev };
      delete newFilters[col];
      return newFilters;
    });
  };

  // Function to check if a cell should be displayed based on filters
  const isCellVisible = (col: string, row: number): boolean => {
    const cellKey = getCellKey(col, row);
    const cellValue = cells[cellKey]?.value || '';
    
    for (const [filterCol, filterVal] of Object.entries(filters)) {
      if (filterCol === col && filterVal && !cellValue.toLowerCase().includes(filterVal.toLowerCase())) {
        return false;
      }
    }
    return true;
  };

  // Calculation functions for status bar
  const calculateSum = (): number => {
    const values = Object.values(cells).map(cell => parseFloat(cell.value || '0')).filter(val => !isNaN(val));
    return values.reduce((sum, val) => sum + val, 0);
  };

  const calculateAverage = (): number => {
    const values = Object.values(cells).map(cell => parseFloat(cell.value || '0')).filter(val => !isNaN(val));
    return values.length > 0 ? values.reduce((sum, val) => sum + val, 0) / values.length : 0;
  };

  const calculateCount = (): number => {
    return Object.values(cells).filter(cell => cell.value && !isNaN(parseFloat(cell.value))).length;
  };

  return (
    <div className="flex h-full flex-col">
      {/* Toolbar */}
      <div className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-background/95 backdrop-blur px-6 py-3">
        <SpreadsheetToolbar 
          spreadsheetId={spreadsheetId}
          cells={cells}
          setCells={setCells}
        />
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
          <span>Sum: {calculateSum().toFixed(2)}</span>
          <span>Average: {calculateAverage().toFixed(2)}</span>
          <span>Count: {calculateCount()}</span>
        </div>
      </div>
    </div>
  );
}

