import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Download, Upload, FileSpreadsheet } from "lucide-react";
import * as XLSX from "xlsx";
import Papa from "papaparse";
import { saveAs } from "file-saver";
import { evaluateFormula } from "@/lib/formulas";

interface SpreadsheetToolbarProps {
  spreadsheetId?: string;
  onImport?: (data: any[][]) => void;
  onExport?: () => void;
  cells: Record<string, any>;
  setCells: React.Dispatch<React.SetStateAction<Record<string, any>>>;
}

export function SpreadsheetToolbar({ spreadsheetId, onImport, onExport, cells, setCells }: SpreadsheetToolbarProps) {

  const handleImportCSV = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".csv";
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      Papa.parse(file, {
        complete: (results) => {
          if (onImport) {
            onImport(results.data as any[][]);
          }
        },
        error: (error) => {
          console.error("CSV import error:", error);
        },
      });
    };
    input.click();
  };

  const handleImportXLSX = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".xlsx,.xls";
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (event) => {
        const data = new Uint8Array(event.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: "array" });
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(firstSheet, { header: 1 });

        if (onImport) {
          onImport(jsonData as any[][]);
        }
      };
      reader.readAsArrayBuffer(file);
    };
    input.click();
  };

  const handleExportCSV = () => {
    // Get actual spreadsheet data
    const data: string[][] = [];
    
    // Create header row
    const headerRow: string[] = [""];
    for (let i = 0; i < 26; i++) { // A-Z columns
      headerRow.push(String.fromCharCode(65 + i));
    }
    data.push(headerRow);
    
    // Add data rows
    for (let row = 1; row <= 100; row++) {
      const rowData: string[] = [row.toString()]; // Row number in first column
      for (let i = 0; i < 26; i++) {
        const col = String.fromCharCode(65 + i);
        const cellKey = `${col}${row}`;
        const cellData = cells[cellKey];
        // Use calculated value if it's a formula, otherwise use the raw value
        let cellValue = "";
        if (cellData?.formula) {
          // Calculate formula result for export
          const formulaResult = evaluateFormula(cellData.formula, cells);
          cellValue = formulaResult;
        } else {
          cellValue = cellData?.value || "";
        }
        rowData.push(cellValue);
      }
      data.push(rowData);
    }
    
    const csv = Papa.unparse(data);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    saveAs(blob, "spreadsheet.csv");
  };

  const handleExportXLSX = () => {
    // Get actual spreadsheet data
    const data: string[][] = [];
    
    // Create header row
    const headerRow: string[] = [""];
    for (let i = 0; i < 26; i++) { // A-Z columns
      headerRow.push(String.fromCharCode(65 + i));
    }
    data.push(headerRow);
    
    // Add data rows
    for (let row = 1; row <= 100; row++) {
      const rowData: string[] = [row.toString()]; // Row number in first column
      for (let i = 0; i < 26; i++) {
        const col = String.fromCharCode(65 + i);
        const cellKey = `${col}${row}`;
        const cellData = cells[cellKey];
        // Use calculated value if it's a formula, otherwise use the raw value
        let cellValue = "";
        if (cellData?.formula) {
          // Calculate formula result for export
          const formulaResult = evaluateFormula(cellData.formula, cells);
          cellValue = formulaResult;
        } else {
          cellValue = cellData?.value || "";
        }
        rowData.push(cellValue);
      }
      data.push(rowData);
    }
    
    const worksheet = XLSX.utils.aoa_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet1");
    XLSX.writeFile(workbook, "spreadsheet.xlsx");
  };

  return (
    <div className="flex items-center gap-2 border-b border-border p-2 bg-background">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="gap-2">
            <Upload className="h-4 w-4" />
            Import
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem onClick={handleImportCSV}>
            <FileSpreadsheet className="h-4 w-4 mr-2" />
            Import CSV
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleImportXLSX}>
            <FileSpreadsheet className="h-4 w-4 mr-2" />
            Import XLSX
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="gap-2">
            <Download className="h-4 w-4" />
            Export
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem onClick={handleExportCSV}>
            <FileSpreadsheet className="h-4 w-4 mr-2" />
            Export as CSV
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleExportXLSX}>
            <FileSpreadsheet className="h-4 w-4 mr-2" />
            Export as XLSX
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
