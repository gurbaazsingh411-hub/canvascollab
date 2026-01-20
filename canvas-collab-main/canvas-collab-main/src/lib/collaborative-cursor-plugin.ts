import { Plugin, PluginKey } from "@tiptap/pm/state";
import { Decoration, DecorationSet } from "@tiptap/pm/view";
import { Collaborator } from "@/hooks/use-collaboration";

export const collaborativeCursorPluginKey = new PluginKey("collaborativeCursor");

export function createCollaborativeCursorPlugin(collaborators: Collaborator[]) {
    return new Plugin({
        key: collaborativeCursorPluginKey,
        state: {
            init() {
                return DecorationSet.empty;
            },
            apply(tr, set) {
                // Map decorations through document changes
                set = set.map(tr.mapping, tr.doc);

                // Update decorations based on collaborators
                const decorations: Decoration[] = [];

                collaborators.forEach((collaborator) => {
                    if (!collaborator.cursor) return;

                    const { from, to, head } = collaborator.cursor;

                    // Validate positions
                    if (from < 0 || to > tr.doc.content.size) return;

                    // Create selection decoration if text is selected
                    if (from !== to) {
                        decorations.push(
                            Decoration.inline(from, to, {
                                class: "collaborative-selection",
                                style: `background-color: ${collaborator.color}33; border-bottom: 2px solid ${collaborator.color};`,
                            })
                        );
                    }

                    // Create cursor decoration
                    const cursorEl = document.createElement("span");
                    cursorEl.className = "collaborative-cursor";
                    cursorEl.style.cssText = `
            position: absolute;
            width: 2px;
            height: 1.2em;
            background-color: ${collaborator.color};
            margin-left: -1px;
            pointer-events: none;
            animation: blink 1s step-end infinite;
          `;

                    const labelEl = document.createElement("div");
                    labelEl.className = "collaborative-cursor-label";
                    labelEl.textContent = collaborator.name;
                    labelEl.style.cssText = `
            position: absolute;
            top: -20px;
            left: -1px;
            background-color: ${collaborator.color};
            color: white;
            padding: 2px 6px;
            border-radius: 4px;
            font-size: 11px;
            font-weight: 600;
            white-space: nowrap;
            pointer-events: none;
            box-shadow: 0 2px 4px rgba(0,0,0,0.2);
          `;

                    cursorEl.appendChild(labelEl);

                    decorations.push(
                        Decoration.widget(head, cursorEl, {
                            side: -1,
                        })
                    );
                });

                return DecorationSet.create(tr.doc, decorations);
            },
        },
        props: {
            decorations(state) {
                return this.getState(state);
            },
        },
    });
}
