import { jsPDF } from "jspdf";
// @ts-ignore
import html2canvas from "html2canvas";

/**
 * Print a document by converting its HTML content to an image and opening in a new window
 */
export const printDocument = async (elementId: string, title: string = "Document") => {
  try {
    const element = document.getElementById(elementId);
    if (!element) {
      throw new Error(`Element with ID "${elementId}" not found`);
    }

    // Clone the element to avoid affecting the original
    const clone = element.cloneNode(true) as HTMLElement;
    
    // Clean up any interactive elements that shouldn't appear in print
    const interactiveElements = clone.querySelectorAll('button, input, textarea, select');
    interactiveElements.forEach(el => el.remove());

    // Apply print-specific styles
    clone.style.maxWidth = 'none';
    clone.style.margin = '0';
    clone.style.padding = '1rem';
    
    // Create a temporary container for printing
    const printContainer = document.createElement('div');
    printContainer.appendChild(clone);
    
    // Create a new window for printing
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      throw new Error('Unable to open print window - popup blocked?');
    }
    
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${title}</title>
          <style>
            ${Array.from(document.styleSheets).map(sheet => {
              try {
                return Array.from(sheet.cssRules).map(rule => rule.cssText).join('\n');
              } catch (e) {
                return '';
              }
            }).join('\n')}
            body { margin: 0; padding: 1rem; font-family: Arial, sans-serif; }
            @media print {
              body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            }
          </style>
        </head>
        <body>
          ${clone.outerHTML}
          <script>
            window.onload = function() {
              window.print();
              window.close();
            };
          </script>
        </body>
      </html>
    `);
    
    printWindow.document.close();
  } catch (error) {
    console.error('Error printing document:', error);
    alert('Error printing document: ' + (error as Error).message);
  }
};

/**
 * Export document as PDF
 */
export const exportToPDF = async (elementId: string, filename: string = "document.pdf") => {
  try {
    const element = document.getElementById(elementId);
    if (!element) {
      throw new Error(`Element with ID "${elementId}" not found`);
    }

    // Use html2canvas to convert the HTML element to a canvas
    const canvas = await html2canvas(element);
    const imgData = canvas.toDataURL('image/png');
    
    // Create a new jsPDF instance
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
      compress: true
    });
    
    const imgWidth = 210; // A4 width in mm
    const pageHeight = 295; // A4 height in mm
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    let heightLeft = imgHeight;
    
    let position = 0;
    
    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;
    
    // Add additional pages if content is taller than one page
    while (heightLeft >= 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
    }
    
    // Save the PDF
    pdf.save(filename);
  } catch (error) {
    console.error('Error exporting to PDF:', error);
    alert('Error exporting to PDF: ' + (error as Error).message);
  }
};

/**
 * Export spreadsheet as PDF
 */
export const exportSpreadsheetToPDF = async (data: any[][], filename: string = "spreadsheet.pdf") => {
  try {
    const doc = new jsPDF();
    
    // Convert spreadsheet data to a readable format
    if (data.length === 0) {
      doc.text("No data to export", 10, 10);
      doc.save(filename);
      return;
    }
    
    // Calculate page dimensions
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 10;
    const cellPadding = 5;
    const cellWidth = (pageWidth - margin * 2) / Math.min(data[0]?.length || 1, 10); // Limit to 10 columns
    
    let yPosition = 10;
    
    for (let rowIndex = 0; rowIndex < data.length; rowIndex++) {
      const row = data[rowIndex];
      
      // Calculate row height based on content
      let rowHeight = 10;
      for (let colIndex = 0; colIndex < row.length && colIndex < 10; colIndex++) {
        const cellValue = String(row[colIndex] || '');
        const cellLines = doc.splitTextToSize(cellValue, cellWidth - cellPadding * 2);
        if (cellLines.length > 1) {
          rowHeight = Math.max(rowHeight, cellLines.length * 6);
        }
      }
      
      // Check if we need a new page
      if (yPosition + rowHeight > doc.internal.pageSize.getHeight() - margin) {
        doc.addPage();
        yPosition = 10;
      }
      
      // Draw cells for this row
      for (let colIndex = 0; colIndex < row.length && colIndex < 10; colIndex++) {
        const cellValue = String(row[colIndex] || '');
        const x = margin + colIndex * cellWidth;
        
        // Draw cell border
        doc.setDrawColor(200, 200, 200);
        doc.setFillColor(rowIndex === 0 ? 240 : 255, rowIndex === 0 ? 240 : 255, rowIndex === 0 ? 240 : 255); // Header row gray, others white
        doc.rect(x, yPosition, cellWidth, rowHeight, 'FD');
        
        // Add text to cell
        const cellLines = doc.splitTextToSize(cellValue, cellWidth - cellPadding * 2);
        doc.setTextColor(0, 0, 0);
        doc.setFontSize(10);
        doc.text(cellLines, x + cellPadding, yPosition + rowHeight / 2 + (cellLines.length * 3));
      }
      
      yPosition += rowHeight;
      
      // If we've reached the end of the page, start a new one
      if (yPosition > doc.internal.pageSize.getHeight() - margin) {
        doc.addPage();
        yPosition = 10;
      }
    }
    
    doc.save(filename);
  } catch (error) {
    console.error('Error exporting spreadsheet to PDF:', error);
    alert('Error exporting to PDF: ' + (error as Error).message);
  }
};