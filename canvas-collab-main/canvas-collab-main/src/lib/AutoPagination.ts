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

export const AutoPagination = Extension.create({
    name: 'autoPagination',

    addProseMirrorPlugins() {
        const editor = this.editor;

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
                            }, 100);
                        },
                    };
                },
            }),
        ];
    },
});

function runPagination(editor: any, view: any) {
    const { state, dispatch } = view;
    const { doc, schema } = state;
    const pageBreakType = schema.nodes.pageBreak;

    if (!pageBreakType) {
        console.warn('AutoPagination: pageBreak node type not found in schema.');
        return;
    }

    const editorDOM = view.dom as HTMLElement;
    if (!editorDOM) return;

    // Get the top of the editor content area
    const editorRect = editorDOM.getBoundingClientRect();
    const editorTop = editorRect.top + TOP_MARGIN_PX; // Account for top padding

    let currentPageStartY = editorTop;

    // Track positions where we need to insert page breaks
    const breakPositions: number[] = [];

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
                }
            } catch (e) {
                // DOM node not found, skip
            }
            return; // Continue to next node
        }

        try {
            const domNode = view.nodeDOM(offset) as HTMLElement;
            if (!domNode) return;

            const rect = domNode.getBoundingClientRect();
            const nodeBottom = rect.bottom;
            const depthInPage = nodeBottom - currentPageStartY;

            // If this node's bottom exceeds the page content area, we need a break BEFORE this node
            if (depthInPage > CONTENT_HEIGHT_PX) {
                // Don't insert if the previous sibling is already a page break
                const resolvedPos = doc.resolve(offset);
                if (resolvedPos.nodeBefore && resolvedPos.nodeBefore.type.name === 'pageBreak') {
                    // Already have a break, just update the page start
                    currentPageStartY = rect.top; // Pretend the new page starts at this node's top
                    return;
                }

                breakPositions.push(offset);
                // After inserting a break, the new page would start at this node's top
                currentPageStartY = rect.top;
            }
        } catch (e) {
            // Node might not be rendered yet
        }
    });

    // Insert page breaks (in reverse order to maintain positions)
    if (breakPositions.length > 0) {
        let tr = state.tr;
        for (let i = breakPositions.length - 1; i >= 0; i--) {
            tr = tr.insert(breakPositions[i], pageBreakType.create());
        }
        dispatch(tr);
    }
}
