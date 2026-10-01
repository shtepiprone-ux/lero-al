import { Node, mergeAttributes } from '@tiptap/core'

/**
 * Task 868 (R13) — the layout-columns block of the CMS rich-text editor.
 *
 * Two Tiptap nodes that serialise to exactly the markup `sanitizeCmsHtml` allows and
 * `typography-chrome.css` lays out:
 *
 *   <div data-type="columns" data-cols="2|3"><div data-type="column">…</div>…</div>
 *
 * The block stacks to one column below 640px by CSS (R17), not by the editor. Together with
 * `MantineRichTextEditor.tsx` this is the only place a Tiptap module is imported.
 */
declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    columns: {
      /** Inserts an empty 2- or 3-column block after the selection. */
      insertColumns: (cols: 2 | 3) => ReturnType
      /** Removes the columns block that contains the selection. */
      removeColumns: () => ReturnType
    }
  }
}

export const Column = Node.create({
  name: 'column',
  content: 'block+',
  isolating: true,
  defining: true,

  parseHTML() {
    return [{ tag: 'div[data-type="column"]' }]
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes, { 'data-type': 'column' }), 0]
  },
})

export const Columns = Node.create({
  name: 'columns',
  group: 'block',
  content: 'column{2,3}',
  isolating: true,
  defining: true,

  addAttributes() {
    return {
      cols: {
        default: 2,
        parseHTML: (element) => (element.getAttribute('data-cols') === '3' ? 3 : 2),
        // `data-type` is added in renderHTML so the attribute order is stable: data-type, data-cols.
        renderHTML: (attributes) => ({ 'data-cols': String(attributes.cols) }),
      },
    }
  },

  parseHTML() {
    return [{ tag: 'div[data-type="columns"]' }]
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes({ 'data-type': 'columns' }, HTMLAttributes), 0]
  },

  addCommands() {
    return {
      insertColumns:
        (cols) =>
        ({ commands }) =>
          commands.insertContent({
            type: 'columns',
            attrs: { cols },
            content: Array.from({ length: cols }, () => ({
              type: 'column',
              content: [{ type: 'paragraph' }],
            })),
          }),

      removeColumns:
        () =>
        ({ state, dispatch }) => {
          const { $from } = state.selection
          for (let depth = $from.depth; depth > 0; depth--) {
            if ($from.node(depth).type.name === 'columns') {
              if (dispatch) {
                const tr = state.tr.delete($from.before(depth), $from.after(depth))
                dispatch(tr)
              }
              return true
            }
          }
          return false
        },
    }
  },
})
