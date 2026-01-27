import { Extension } from '@tiptap/core';
import { Plugin, PluginKey } from '@tiptap/pm/state';

const autoPaginationPluginKey = new PluginKey('autoPagination');

// A4 page dimensions in pixels at 96 DPI
const mmToPx = (mm: number) => mm * (96 / 25.4);
const PAGE_HEIGHT_PX = mmToPx(297);
const TOP_MARGIN_PX = mmToPx(25.4);
const BOTTOM_MARGIN_PX = mmToPx(25.4);
// Usable content height per page (excluding margins)
const CONTENT_HEIGHT_PX = PAGE_HEIGHT_PX - TOP_MARGIN_PX - BOTTOM_MARGIN_PX;

console.log('[AutoPagination] Constants:', {
    PAGE_HEIGHT_PX,
    TOP_MARGIN_PX,
    BOTTOM_MARGIN_PX,
    CONTENT_HEIGHT_PX
});

export const AutoPagination = Extension.create({
    name: 'autoPagination',

    addProseMirrorPlugins() {
        const editor = this.editor;
        console.log('[AutoPagination] Plugin registered');

        return [
            new Plugin({
                key: autoPaginationPluginKey,
                view() {
                    return {
                        update: (view) => {
                            // Debounce to avoid running too frequently
                            if ((view as any)._autoPaginationTimeout) {
                                clearTimeout((view as any)._autoPaginationTimeout);
                            }
                            (view as any)._autoPaginationTimeout = setTimeout(() => {
                                runPagination(editor, view);
                            }, 150);
                        },
                    };
                },
            }),
        ];
    },
});

function runPagination(editor: any, view: any) {
    const { state } = view;
    const { doc, schema } = state;
    const pageBreakType = schema.nodes.pageBreak;

    if (!pageBreakType) {
        console.warn('[AutoPagination] pageBreak node type not found in schema.');
        return;
    }

    const editorDOM = view.dom as HTMLElement;
    if (!editorDOM) {
        console.warn('[AutoPagination] Editor DOM not found.');
        return;
    }

    // Get the top of the editor content area
    const editorRect = editorDOM.getBoundingClientRect();
    const editorTop = editorRect.top;

    // Track the start Y position of the current "page" (accounting for page breaks)
    let currentPageStartY = editorTop;
    let pageNumber = 1;

    // Track positions where we need to insert page breaks
    const breakPositions: number[] = [];

    console.log('[AutoPagination] Running pagination check...', {
        editorTop,
        CONTENT_HEIGHT_PX,
        docChildCount: doc.childCount
    });

    // Iterate through top-level nodes
    doc.forEach((node: any, offset: number) => {
        if (node.type.name === 'pageBreak') {
            // Reset the page start for the next page
            try {
                const domNode = view.nodeDOM(offset) as HTMLElement;
                if (domNode) {
                    const rect = domNode.getBoundingClientRect();
                    // The next page starts after the page break element
                    currentPageStartY = rect.bottom;
                    pageNumber++;
                    console.log(`[AutoPagination] Found existing page break at offset ${offset}, new page starts at Y=${currentPageStartY}`);
                }
            } catch (e) {
                console.warn('[AutoPagination] Could not get DOM for page break:', e);
            }
            return; // Continue to next node
        }

        try {
            const domNode = view.nodeDOM(offset) as HTMLElement;
            if (!domNode) {
                console.log(`[AutoPagination] No DOM node for offset ${offset}`);
                return;
            }

            const rect = domNode.getBoundingClientRect();
            const nodeBottom = rect.bottom;
            const depthInPage = nodeBottom - currentPageStartY;

            // If this node's bottom exceeds the page content area, we need a break BEFORE this node
            if (depthInPage > CONTENT_HEIGHT_PX) {
                console.log(`[AutoPagination] Overflow detected at offset ${offset}:`, {
                    nodeBottom,
                    currentPageStartY,
                    depthInPage,
                    CONTENT_HEIGHT_PX,
                    nodeType: node.type.name
                });

                // Don't insert if the previous sibling is already a page break
                const resolvedPos = doc.resolve(offset);
                if (resolvedPos.nodeBefore && resolvedPos.nodeBefore.type.name === 'pageBreak') {
                    console.log('[AutoPagination] Previous node is already a page break, skipping.');
                    currentPageStartY = rect.top; // Pretend the new page starts at this node's top
                    pageNumber++;
                    return;
                }

                breakPositions.push(offset);
                // After inserting a break, the new page would start at this node's top
                currentPageStartY = rect.top;
                pageNumber++;
            }
        } catch (e) {
            console.warn('[AutoPagination] Error processing node:', e);
        }
    });

    // Insert page breaks (in reverse order to maintain positions)
    if (breakPositions.length > 0) {
        console.log('[AutoPagination] Inserting page breaks at positions:', breakPositions);
        let tr = state.tr;
        for (let i = breakPositions.length - 1; i >= 0; i--) {
            tr = tr.insert(breakPositions[i], pageBreakType.create());
        }
        view.dispatch(tr);
        console.log('[AutoPagination] Page breaks inserted successfully.');
    } else {
        console.log('[AutoPagination] No page breaks needed.');
    }
}
