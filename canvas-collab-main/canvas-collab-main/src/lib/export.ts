import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { Document, Packer, Paragraph, TextRun, HeadingLevel } from "docx";
import { saveAs } from "file-saver";

/**
 * Export document content to PDF
 */
export async function exportToPDF(title: string, contentElement: HTMLElement) {
    try {
        // Create canvas from content
        const canvas = await html2canvas(contentElement, {
            scale: 2,
            useCORS: true,
            logging: false,
        });

        const imgData = canvas.toDataURL("image/png");
        const pdf = new jsPDF({
            orientation: "portrait",
            unit: "mm",
            format: "a4",
        });

        const imgWidth = 210; // A4 width in mm
        const pageHeight = 297; // A4 height in mm
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
        let heightLeft = imgHeight;
        let position = 0;

        // Add first page
        pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;

        // Add additional pages if content is longer than one page
        while (heightLeft >= 0) {
            position = heightLeft - imgHeight;
            pdf.addPage();
            pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
            heightLeft -= pageHeight;
        }

        pdf.save(`${title}.pdf`);
        return true;
    } catch (error) {
        console.error("PDF export failed:", error);
        throw new Error("Failed to export PDF");
    }
}

/**
 * Export document content to DOCX
 */
export async function exportToDOCX(title: string, editorJSON: any) {
    try {
        const paragraphs: Paragraph[] = [];

        // Convert Tiptap JSON to DOCX paragraphs
        if (editorJSON && editorJSON.content) {
            editorJSON.content.forEach((node: any) => {
                if (node.type === "heading") {
                    const level = node.attrs?.level || 1;
                    const text = extractText(node);
                    paragraphs.push(
                        new Paragraph({
                            text,
                            heading: getHeadingLevel(level),
                        })
                    );
                } else if (node.type === "paragraph") {
                    const runs: TextRun[] = [];
                    if (node.content) {
                        node.content.forEach((inline: any) => {
                            if (inline.type === "text") {
                                runs.push(
                                    new TextRun({
                                        text: inline.text || "",
                                        bold: inline.marks?.some((m: any) => m.type === "bold"),
                                        italics: inline.marks?.some((m: any) => m.type === "italic"),
                                        strike: inline.marks?.some((m: any) => m.type === "strike"),
                                    })
                                );
                            }
                        });
                    }
                    paragraphs.push(new Paragraph({ children: runs }));
                } else if (node.type === "bulletList" || node.type === "orderedList") {
                    // Handle lists
                    if (node.content) {
                        node.content.forEach((listItem: any) => {
                            const text = extractText(listItem);
                            paragraphs.push(
                                new Paragraph({
                                    text,
                                    bullet: node.type === "bulletList" ? { level: 0 } : undefined,
                                    numbering: node.type === "orderedList" ? { reference: "default", level: 0 } : undefined,
                                })
                            );
                        });
                    }
                } else if (node.type === "horizontalRule") {
                    // Handle horizontal rules
                    paragraphs.push(new Paragraph({ text: "────────────────────────────", thematicBreak: true }));
                } else if (node.type === "pageBreak") {
                    // Handle page breaks - just add some space
                    paragraphs.push(new Paragraph({ text: "" }));
                }
            });
        }

        const doc = new Document({
            sections: [
                {
                    properties: {},
                    children: paragraphs,
                },
            ],
        });

        const blob = await Packer.toBlob(doc);
        saveAs(blob, `${title}.docx`);
        return true;
    } catch (error) {
        console.error("DOCX export failed:", error);
        throw new Error("Failed to export DOCX");
    }
}

/**
 * Print document
 */
export function printDocument() {
    window.print();
}

// Helper functions
function extractText(node: any): string {
    if (!node.content) return "";
    return node.content
        .map((n: any) => {
            if (n.type === "text") return n.text || "";
            if (n.content) return extractText(n);
            return "";
        })
        .join("");
}

function getHeadingLevel(level: number): typeof HeadingLevel[keyof typeof HeadingLevel] {
    switch (level) {
        case 1:
            return HeadingLevel.HEADING_1;
        case 2:
            return HeadingLevel.HEADING_2;
        case 3:
            return HeadingLevel.HEADING_3;
        default:
            return HeadingLevel.HEADING_1;
    }
}
