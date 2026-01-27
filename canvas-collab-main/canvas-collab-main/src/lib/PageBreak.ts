import { Node, mergeAttributes } from "@tiptap/core";

export interface PageBreakOptions {
  HTMLAttributes: Record<string, any>;
}

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    pageBreak: {
      setPageBreak: () => ReturnType;
    };
  }
}

export const PageBreak = Node.create<PageBreakOptions>({
  name: "pageBreak",

  addOptions() {
    return {
      HTMLAttributes: {
        class: "page-break",
      },
    };
  },

  group: "block",

  parseHTML() {
    return [
      {
        tag: "div[data-page-break]",
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return ["div", mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, {
      "data-page-break": "",
      class: "page-break-divider",
    })];
  },

  addCommands() {
    return {
      setPageBreak: () => ({ commands }) => {
        return commands.insertContent({ type: this.name });
      },
    };
  },
});