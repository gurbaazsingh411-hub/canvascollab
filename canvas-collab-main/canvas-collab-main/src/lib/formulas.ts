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

// Helper functions for spreadsheet labels
export function getColumnLabel(index: number): string {
  let label = "";
  let current = index;
  
  while (current >= 0) {
    label = String.fromCharCode(65 + (current % 26)) + label;
    current = Math.floor(current / 26) - 1;
  }
  
  return label;
}

export function getRowLabel(index: number): number {
  return index + 1;
}

// Enhanced formula evaluator with more functions
export function evaluateFormula(formula: string, cells: Record<string, CellData>): string {
  try {
    if (!formula.startsWith('=')) return formula;
    
    // Handle cell references
    if (/^=[A-Z]+\d+$/.test(formula)) {
      const ref = formula.substring(1);
      return cells[ref]?.value || "0";
    }
    
    // Handle ranges
    const rangeMatch = formula.toUpperCase().match(/^=(\w+)\(([A-Z]+\d+):([A-Z]+\d+)\)$/);
    if (rangeMatch) {
      const [, func, start, end] = rangeMatch;
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
        case "MIN":
          return values.length ? Math.min(...values).toString() : "0";
        case "MAX":
          return values.length ? Math.max(...values).toString() : "0";
        default:
          return "#ERROR";
      }
    }
    
    // Handle simple arithmetic
    const arithmeticMatch = formula.match(/^=([\d\.]+)\s*([+\-*/])\s*([\d\.]+)$/);
    if (arithmeticMatch) {
      const [, num1, operator, num2] = arithmeticMatch;
      const a = parseFloat(num1);
      const b = parseFloat(num2);
      
      switch (operator) {
        case "+": return (a + b).toString();
        case "-": return (a - b).toString();
        case "*": return (a * b).toString();
        case "/": return b !== 0 ? (a / b).toString() : "#DIV/0";
        default: return "#ERROR";
      }
    }
    
    return formula;
  } catch {
    return "#ERROR";
  }
}