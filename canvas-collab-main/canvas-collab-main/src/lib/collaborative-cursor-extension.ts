import { Extension } from '@tiptap/core';
import { Plugin, PluginKey } from '@tiptap/pm/state';
import { Decoration, DecorationSet } from '@tiptap/pm/view';
import { Collaborator } from '@/hooks/use-collaboration';

declare module '@tiptap/core' {
    interface Commands<ReturnType> {
        collaborativeCursor: {
            updateCollaborators: (collaborators: Collaborator[]) => ReturnType;
        };
    }
}

export const CollaborativeCursor = Extension.create({
    name: 'collaborativeCursor',

    addCommands() {
        return {
            updateCollaborators: (collaborators: Collaborator[]) => ({ tr, dispatch }) => {
                if (dispatch) {
                    tr.setMeta('collaborators', collaborators);
                }
                return true;
            },
        };
    },

    addProseMirrorPlugins() {
        return [
            new Plugin({
                key: new PluginKey('collaborativeCursor'),
                state: {
                    init() {
                        // Initial state: empty decorations and empty collaborator list
                        return {
                            decorations: DecorationSet.empty,
                            collaborators: [] as Collaborator[],
                        };
                    },
                    apply(tr, value) {
                        // Check if there's an update from the command
                        const newCollaborators = tr.getMeta('collaborators');

                        // If new collaborators data provided, recalculate everything
                        if (newCollaborators) {
                            return {
                                decorations: createDecorations(tr.doc, newCollaborators),
                                collaborators: newCollaborators,
                            };
                        }

                        // Otherwise, just map the existing decorations to the new document state
                        // (e.g. if the user types, the remote cursors should move with the text)
                        return {
                            decorations: value.decorations.map(tr.mapping, tr.doc),
                            collaborators: value.collaborators,
                        };
                    },
                },
                props: {
                    decorations(state) {
                        return this.getState(state).decorations;
                    },
                },
            }),
        ];
    },
});

function createDecorations(doc: any, collaborators: Collaborator[]) {
    const decorations: Decoration[] = [];

    collaborators.forEach((collaborator) => {
        if (!collaborator.cursor) return;

        // Deconstruct cursor info
        const { from, to, head } = collaborator.cursor;

        // Safety check: ensure positions are valid within the current document
        // doc.content.size is the length of the document
        if (from < 0 || to > doc.content.size || head < 0 || head > doc.content.size) {
            return;
        }

        // 1. Text Selection Decoration
        // Use 'from' and 'to' (normalized start/end)
        const start = Math.min(from, to);
        const end = Math.max(from, to);

        if (start !== end) {
            decorations.push(
                Decoration.inline(start, end, {
                    class: "collaborative-selection",
                    style: `background-color: ${collaborator.color}33;`, // 20% opacity approximation
                })
            );
        }

        // 2. Cursor Caret Decoration
        // Use 'head' which is where the actual cursor caret is
        const cursorEl = document.createElement("span");
        cursorEl.className = "collaborative-cursor";
        cursorEl.style.borderLeftColor = collaborator.color; // The vertical line color

        // Create the name label
        const labelEl = document.createElement("div");
        labelEl.className = "collaborative-cursor-label";
        labelEl.textContent = collaborator.name;
        labelEl.style.backgroundColor = collaborator.color;

        cursorEl.appendChild(labelEl);

        decorations.push(
            Decoration.widget(head, cursorEl, {
                side: -1,
                key: `cursor-${collaborator.id}`,
            })
        );
    });

    return DecorationSet.create(doc, decorations);
}
