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
    return ["hr", mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, {
      "data-page-break": "",
      style: "border: none; border-top: 2px dashed #ccc; margin: 20px 0; page-break-after: always; height: 1px;",
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