import { useState, useCallback, useEffect } from "react";
import { ReactGrid, Column, Row, CellChange, TextCell, NumberCell } from "@silevis/reactgrid";
import "@silevis/reactgrid/styles.css";
import { evaluateFormula, getColumnLabel, getRowLabel } from "@/lib/formulas";
import { useSpreadsheetCells, useUpdateSpreadsheetCell } from "@/hooks/use-files";
import { Loader2 } from "lucide-react";

interface SpreadsheetGridProps {
    spreadsheetId: string;
    onCellSelected?: (cell: { row: number; col: number; cellKey: string; data: CellData } | null) => void;
}

interface CellData {
    row: number;
    col: number;
    value: string | number;
    formula?: string;
}

export function SpreadsheetGrid({ spreadsheetId, onCellSelected }: SpreadsheetGridProps) {
    const { data: spreadsheetCells, isLoading } = useSpreadsheetCells(spreadsheetId);
    const updateCell = useUpdateSpreadsheetCell();

    const [cells, setCells] = useState<Map<string, CellData>>(new Map());
    const [rows] = useState(100);
    const [cols] = useState(26);

    // Track selection locally for formula bar
    const [selectedCellKey, setSelectedCellKey] = useState<string | null>(null);

    // Load cells from Supabase
    useEffect(() => {
        if (spreadsheetCells) {
            const cellMap = new Map<string, CellData>();
            spreadsheetCells.forEach((cell: any) => {
                const key = cell.cell_key;
                if (!key) return;

                const [row, col] = key.split(',').map(Number);
                cellMap.set(key, {
                    row: isNaN(row) ? 0 : row,
                    col: isNaN(col) ? 0 : col,
                    value: cell.value || "",
                    formula: cell.formula || undefined,
                });
            });
            setCells(cellMap);
        }
    }, [spreadsheetCells]);

    const getCellValue = useCallback((ref: string): string | number => {
        const match = ref.match(/^([A-Z]+)([0-9]+)$/);
        if (!match) return "";

        const col = match[1].charCodeAt(0) - 65;
        const row = parseInt(match[2]) - 1;

        const key = `${row},${col}`;
        const cell = cells.get(key);
        return cell?.value || "";
    }, [cells]);

    const getCellData = useCallback((row: number, col: number): CellData => {
        const key = `${row},${col}`;
        return cells.get(key) || { row, col, value: "" };
    }, [cells]);

    const handleCellChange = useCallback(async (changes: CellChange[]) => {
        const newCells = new Map(cells);

        // Perform optimistic updates
        for (const change of changes) {
            const rowIdx = change.rowId as number;
            const colIdx = change.columnId as number;
            const key = `${rowIdx},${colIdx}`;

            const newValue = (change.newCell as any).text || "";
            let displayValue: string | number = newValue;
            let formula: string | undefined;

            if (typeof newValue === "string" && newValue.startsWith("=")) {
                formula = newValue;
                displayValue = evaluateFormula(newValue, getCellValue);
            }

            newCells.set(key, {
                row: rowIdx,
                col: colIdx,
                value: displayValue,
                formula,
            });
        }

        setCells(newCells);

        // Save to DB in background
        for (const change of changes) {
            const rowIdx = change.rowId as number;
            const colIdx = change.columnId as number;
            const key = `${rowIdx},${colIdx}`;
            const cellData = newCells.get(key)!;

            try {
                await updateCell.mutateAsync({
                    spreadsheet_id: spreadsheetId,
                    row_index: rowIdx,
                    col_index: colIdx,
                    value: cellData.value,
                    formula: cellData.formula,
                });
            } catch (error) {
                console.error("Failed to update cell:", error);
            }
        }
    }, [cells, spreadsheetId, updateCell, getCellValue]);

    const handleSelectionChanged = useCallback((selectedRanges: any) => {
        if (selectedRanges && selectedRanges.length > 0) {
            const range = selectedRanges[0];
            if (range.rows.length === 1 && range.columns.length === 1) {
                const row = range.rows[0].rowId as number;
                const col = range.columns[0].columnId as number;
                const key = `${row},${col}`;
                setSelectedCellKey(key);

                if (onCellSelected) {
                    onCellSelected({
                        row,
                        col,
                        cellKey: key,
                        data: getCellData(row, col)
                    });
                }
            } else {
                setSelectedCellKey(null);
                if (onCellSelected) onCellSelected(null);
            }
        }
    }, [getCellData, onCellSelected]);

    // Generate columns
    const columns: Column[] = [
        { columnId: "header", width: 50 },
        ...Array.from({ length: cols }, (_, i) => ({
            columnId: i,
            width: 120,
        })),
    ];

    // Generate rows
    const gridRows: Row[] = [
        // Header row
        {
            rowId: "header",
            cells: [
                { type: "header", text: "" },
                ...Array.from({ length: cols }, (_, i) => ({
                    type: "header" as const,
                    text: getColumnLabel(i),
                })),
            ],
        },
        // Data rows
        ...Array.from({ length: rows }, (_, rowIdx) => ({
            rowId: rowIdx,
            cells: [
                { type: "header" as const, text: String(getRowLabel(rowIdx)) },
                ...Array.from({ length: cols }, (_, colIdx) => {
                    const cellData = getCellData(rowIdx, colIdx);
                    // Show formula ONLY if we are technically "editing" or if that's what we want.
                    // But ReactGrid doesn't pass editing state here.
                    // For now, let's show the formula string so users can see what they typed,
                    // but usually spreadsheets show the result.
                    // We'll show the RESULT in the grid and use a formula bar for the formula.
                    const textValue = cellData.formula || String(cellData.value || "");

                    return {
                        type: "text" as const,
                        text: textValue,
                    };
                }),
            ],
        })),
    ];

    if (isLoading) {
        return (
            <div className="flex h-full items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    return (
        <div className="h-full w-full overflow-auto scrollbar-thin">
            <ReactGrid
                rows={gridRows}
                columns={columns}
                onCellsChanged={handleCellChange}
                onSelectionChanged={handleSelectionChanged}
                enableRangeSelection
                enableFillHandle
                enableRowSelection
                enableColumnSelection
            />
        </div>
    );
}
