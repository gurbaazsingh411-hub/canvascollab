import { useState, useCallback, useEffect } from "react";
import { ReactGrid, Column, Row, CellChange, TextCell, NumberCell } from "@silevis/reactgrid";
import "@silevis/reactgrid/styles.css";
import { evaluateFormula, getColumnLabel, getRowLabel } from "@/lib/formulas";
import { useSpreadsheetCells, useUpdateSpreadsheetCell } from "@/hooks/use-files";
import { Loader2 } from "lucide-react";

interface SpreadsheetGridProps {
    spreadsheetId: string;
}

interface CellData {
    row: number;
    col: number;
    value: string | number;
    formula?: string;
}

export function SpreadsheetGrid({ spreadsheetId }: SpreadsheetGridProps) {
    const { data: spreadsheetCells, isLoading } = useSpreadsheetCells(spreadsheetId);
    const updateCell = useUpdateSpreadsheetCell();

    const [cells, setCells] = useState<Map<string, CellData>>(new Map());
    const [rows, setRows] = useState(50);
    const [cols, setCols] = useState(26);

    // Load cells from Supabase
    useEffect(() => {
        if (spreadsheetCells) {
            const cellMap = new Map<string, CellData>();
            spreadsheetCells.forEach((cell: any) => {
                const key = `${cell.row_index},${cell.col_index}`;
                cellMap.set(key, {
                    row: cell.row_index,
                    col: cell.col_index,
                    value: cell.value || "",
                    formula: cell.formula || undefined,
                });
            });
            setCells(cellMap);
        }
    }, [spreadsheetCells]);

    const getCellValue = useCallback((ref: string): string | number => {
        // Parse cell reference like "A1"
        const match = ref.match(/^([A-Z]+)([0-9]+)$/);
        if (!match) return "";

        const col = match[1].charCodeAt(0) - 65; // A=0, B=1, etc.
        const row = parseInt(match[2]) - 1; // 1-indexed to 0-indexed

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

        for (const change of changes) {
            const rowIdx = change.rowId as number;
            const colIdx = change.columnId as number;
            const key = `${rowIdx},${colIdx}`;

            const newValue = (change.newCell as any).text || "";
            let displayValue: string | number = newValue;
            let formula: string | undefined;

            // Check if it's a formula
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

            // Save to Supabase
            try {
                await updateCell.mutateAsync({
                    spreadsheet_id: spreadsheetId,
                    row_index: rowIdx,
                    col_index: colIdx,
                    value: displayValue,
                    formula,
                });
            } catch (error) {
                console.error("Failed to update cell:", error);
            }
        }

        setCells(newCells);
    }, [cells, spreadsheetId, updateCell, getCellValue]);

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
                    const displayValue = cellData.formula || String(cellData.value || "");

                    return {
                        type: "text" as const,
                        text: displayValue,
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
        <div className="h-full w-full overflow-auto">
            <ReactGrid
                rows={gridRows}
                columns={columns}
                onCellsChanged={handleCellChange}
                enableRangeSelection
                enableFillHandle
                enableRowSelection
                enableColumnSelection
            />
        </div>
    );
}
