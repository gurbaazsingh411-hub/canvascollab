// Formula evaluation engine for spreadsheet

export type CellValue = string | number | boolean | null;

export interface FormulaResult {
    value: CellValue;
    error?: string;
}

/**
 * Evaluate a formula string
 */
export function evaluateFormula(formula: string, getCellValue: (ref: string) => CellValue): FormulaResult {
    try {
        // Remove leading =
        const expr = formula.trim().substring(1).trim();

        // Check if it's a function
        if (expr.includes('(')) {
            return evaluateFunction(expr, getCellValue);
        }

        // Simple cell reference
        if (/^[A-Z]+[0-9]+$/.test(expr)) {
            return { value: getCellValue(expr) };
        }

        // Try to evaluate as number
        const num = parseFloat(expr);
        if (!isNaN(num)) {
            return { value: num };
        }

        return { value: expr };
    } catch (error) {
        return { value: null, error: error instanceof Error ? error.message : 'Invalid formula' };
    }
}

/**
 * Evaluate a function like SUM, AVERAGE, COUNT
 */
function evaluateFunction(expr: string, getCellValue: (ref: string) => CellValue): FormulaResult {
    const match = expr.match(/^([A-Z]+)\((.*)\)$/);
    if (!match) {
        return { value: null, error: 'Invalid function syntax' };
    }

    const [, funcName, args] = match;
    const argList = args.split(',').map(a => a.trim());

    switch (funcName.toUpperCase()) {
        case 'SUM':
            return evaluateSum(argList, getCellValue);
        case 'AVERAGE':
            return evaluateAverage(argList, getCellValue);
        case 'COUNT':
            return evaluateCount(argList, getCellValue);
        case 'MIN':
            return evaluateMin(argList, getCellValue);
        case 'MAX':
            return evaluateMax(argList, getCellValue);
        default:
            return { value: null, error: `Unknown function: ${funcName}` };
    }
}

/**
 * Parse cell range like A1:A10
 */
function parseCellRange(range: string): string[] {
    const match = range.match(/^([A-Z]+)([0-9]+):([A-Z]+)([0-9]+)$/);
    if (!match) return [range];

    const [, startCol, startRow, endCol, endRow] = match;
    const cells: string[] = [];

    const startColNum = columnToNumber(startCol);
    const endColNum = columnToNumber(endCol);
    const startRowNum = parseInt(startRow);
    const endRowNum = parseInt(endRow);

    for (let col = startColNum; col <= endColNum; col++) {
        for (let row = startRowNum; row <= endRowNum; row++) {
            cells.push(`${numberToColumn(col)}${row}`);
        }
    }

    return cells;
}

/**
 * Get numeric values from cell references
 */
function getNumericValues(refs: string[], getCellValue: (ref: string) => CellValue): number[] {
    const values: number[] = [];

    for (const ref of refs) {
        const cells = parseCellRange(ref);
        for (const cell of cells) {
            const value = getCellValue(cell);
            if (typeof value === 'number') {
                values.push(value);
            } else if (typeof value === 'string') {
                const num = parseFloat(value);
                if (!isNaN(num)) values.push(num);
            }
        }
    }

    return values;
}

// Formula functions
function evaluateSum(args: string[], getCellValue: (ref: string) => CellValue): FormulaResult {
    const values = getNumericValues(args, getCellValue);
    const sum = values.reduce((acc, val) => acc + val, 0);
    return { value: sum };
}

function evaluateAverage(args: string[], getCellValue: (ref: string) => CellValue): FormulaResult {
    const values = getNumericValues(args, getCellValue);
    if (values.length === 0) return { value: 0 };
    const avg = values.reduce((acc, val) => acc + val, 0) / values.length;
    return { value: avg };
}

function evaluateCount(args: string[], getCellValue: (ref: string) => CellValue): FormulaResult {
    const values = getNumericValues(args, getCellValue);
    return { value: values.length };
}

function evaluateMin(args: string[], getCellValue: (ref: string) => CellValue): FormulaResult {
    const values = getNumericValues(args, getCellValue);
    if (values.length === 0) return { value: 0 };
    return { value: Math.min(...values) };
}

function evaluateMax(args: string[], getCellValue: (ref: string) => CellValue): FormulaResult {
    const values = getNumericValues(args, getCellValue);
    if (values.length === 0) return { value: 0 };
    return { value: Math.max(...values) };
}

// Helper functions
function columnToNumber(col: string): number {
    let num = 0;
    for (let i = 0; i < col.length; i++) {
        num = num * 26 + (col.charCodeAt(i) - 64);
    }
    return num;
}

function numberToColumn(num: number): string {
    let col = '';
    while (num > 0) {
        const remainder = (num - 1) % 26;
        col = String.fromCharCode(65 + remainder) + col;
        num = Math.floor((num - 1) / 26);
    }
    return col;
}

/**
 * Convert column index to letter (0 -> A, 1 -> B, etc.)
 */
export function getColumnLabel(index: number): string {
    return numberToColumn(index + 1);
}

/**
 * Convert row index to number (0 -> 1, 1 -> 2, etc.)
 */
export function getRowLabel(index: number): number {
    return index + 1;
}
