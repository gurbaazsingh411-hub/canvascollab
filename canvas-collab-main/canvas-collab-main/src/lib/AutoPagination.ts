import { Extension } from '@tiptap/core';

export const AutoPagination = Extension.create({
    name: 'autoPagination',

    addKeyboardShortcuts() {
        return {
            Enter: ({ editor }) => {
                const { state, view } = editor;
                const { selection, doc } = state;
                const { $from } = selection;

                // Get coordinates of the current cursor position
                const coords = view.coordsAtPos($from.pos);

                // Find the most recent page break BEFORE the current selection
                let lastBreakPos = 0;
                doc.nodesBetween(0, $from.pos, (node, pos) => {
                    if (node.type.name === 'pageBreak') {
                        lastBreakPos = pos + node.nodeSize;
                    }
                });

                const editorRect = view.dom.getBoundingClientRect();

                // Find the vertical start of the current "sheet"
                let sheetTop;
                if (lastBreakPos === 0) {
                    sheetTop = editorRect.top;
                } else {
                    try {
                        const nodeAfterBreak = view.nodeDOM(lastBreakPos) as HTMLElement;
                        if (nodeAfterBreak) {
                            sheetTop = nodeAfterBreak.getBoundingClientRect().top;
                        } else {
                            sheetTop = editorRect.top; // Fallback
                        }
                    } catch (e) {
                        sheetTop = editorRect.top; // Fallback
                    }
                }

                const mmToPx = (mm: number) => mm * (96 / 25.4);
                const PAGE_HEIGHT_PX = mmToPx(297);
                const BOTTOM_MARGIN_PX = mmToPx(25.4);

                const cursorDepthInSheet = coords.bottom - sheetTop;
                const remainingSpace = PAGE_HEIGHT_PX - cursorDepthInSheet;

                // Threshold for auto-breaking: less than 1.5 inch (margins + 1 line)
                if (remainingSpace < (BOTTOM_MARGIN_PX + 40)) {
                    // Prevent multiple breaks if one already exists immediately after
                    const nodeAfter = $from.nodeAfter;
                    if (nodeAfter?.type.name === 'pageBreak') {
                        return false;
                    }

                    editor.chain()
                        .focus()
                        .setPageBreak()
                        .run();

                    return true;
                }

                return false;
            },
        };
    },
});
