import { baseKeymap, chainCommands, exitCode, joinTextblockBackward, toggleMark } from 'prosemirror-commands';
import { closeHistory, history, redo, undo } from 'prosemirror-history';
import {
  InputRule,
  inputRules,
  textblockTypeInputRule,
  undoInputRule,
  wrappingInputRule,
} from 'prosemirror-inputrules';
import { keymap } from 'prosemirror-keymap';
import {
  defaultMarkdownParser,
  defaultMarkdownSerializer,
  MarkdownParser,
  MarkdownSerializer,
  schema as commonmarkSchema,
} from 'prosemirror-markdown';
import {
  Fragment,
  Schema,
  Slice,
  type MarkType,
  type Node as ProseMirrorNode,
} from 'prosemirror-model';
import { liftListItem, sinkListItem, splitListItem } from 'prosemirror-schema-list';
import { EditorState, Plugin, PluginKey, TextSelection, type Command } from 'prosemirror-state';

// Extend the document model locally; the shared CommonMark parser stays unchanged.
const schema = new Schema({
  nodes: commonmarkSchema.spec.nodes.update('list_item', {
    ...commonmarkSchema.nodes['list_item'].spec,
    attrs: { checked: { default: null } },
    parseDOM: [
      {
        tag: 'li',
        getAttrs: dom => ({
          checked: dom.hasAttribute('data-checked')
            ? dom.getAttribute('data-checked') === 'true'
            : null,
        }),
      },
    ],
    toDOM(node) {
      return ['li', { 'data-checked': node.attrs['checked'] }, 0];
    },
  }),
  marks: commonmarkSchema.spec.marks.addBefore('em', 'strike', {
    parseDOM: [{ tag: 's' }, { tag: 'del' }, { style: 'text-decoration=line-through' }],
    toDOM: () => ['s', 0],
  }),
});

// The parser exposes its tokenizer. Create an independent instance using that
// same implementation so enabling its built-in rule cannot alter other parsers.
const Tokenizer = defaultMarkdownParser.tokenizer.constructor as new (
  preset: string,
  options: { html: boolean },
) => typeof defaultMarkdownParser.tokenizer;
const tokenizer = new Tokenizer('commonmark', { html: false });
tokenizer.enable('strikethrough');
const parser = new MarkdownParser(schema, tokenizer, {
  ...defaultMarkdownParser.tokens,
  s: { mark: 'strike' },
  list_item: {
    block: 'list_item',
    getAttrs: (_token, tokens, index) => {
      const inline = tokens[index + 2];
      const first = inline?.children?.[0];
      if (
        tokens[index + 1]?.type !== 'paragraph_open' ||
        inline?.type !== 'inline' ||
        first?.type !== 'text'
      )
        return null;
      const match = /^\[([ xX])\](?:[ \t]+|$)/.exec(first.content);
      if (!match || !/^\[([ xX])\](?:[ \t]+|$)/.test(inline.content)) return null;
      first.content = first.content.slice(match[0].length);
      return { checked: match[1].toLowerCase() === 'x' };
    },
  },
});
const serializer = new MarkdownSerializer(
  {
    ...defaultMarkdownSerializer.nodes,
    list_item(state, node) {
      if (node.attrs['checked'] !== null) state.write(node.attrs['checked'] ? '[x] ' : '[ ] ');
      state.renderContent(node);
    },
  },
  {
    ...defaultMarkdownSerializer.marks,
    strike: {
      open: '~~',
      close: '~~',
      mixable: true,
      expelEnclosingWhitespace: true,
    },
  },
);

function taskInputRule(): InputRule {
  // The preceding '- ' has already converted into a normal list item.
  return new InputRule(/^\[([ xX])\]\s$/, (state, match, start, end) => {
    const $start = state.doc.resolve(start);
    if (
      $start.depth < 2 ||
      $start.node(-1).type !== schema.nodes['list_item'] ||
      $start.index(-1) !== 0
    )
      return null;
    return state.tr.delete(start, end).setNodeMarkup($start.before(-1), undefined, {
      checked: match[1].toLowerCase() === 'x',
    });
  });
}

function dividerInputRule(): InputRule {
  return new InputRule(/^(?:---|\*\*\*|___)$/, (state, _match, start, end) => {
    const $start = state.doc.resolve(start);
    if ($start.parent.type !== schema.nodes['paragraph']) return null;
    const from = $start.before();
    const tr = state.tr.replaceWith(from, $start.after(), [
      schema.nodes['horizontal_rule'].create(),
      schema.nodes['paragraph'].create(null, $start.parent.content.cut(end - $start.start())),
    ]);
    // Retain the paragraph after the divider, ready for the next sentence.
    return tr.setSelection(TextSelection.near(tr.doc.resolve(from + 1)));
  });
}

function markdownPaste(): Plugin {
  return new Plugin({
    props: {
      clipboardTextParser(text, $context, plain) {
        if (plain) {
          return Slice.maxOpen(
            Fragment.from(
              text
                .split(/\r\n?|\n/)
                .map(line =>
                  schema.nodes['paragraph'].create(
                    null,
                    line ? schema.text(line, $context.marks()) : undefined,
                  ),
                ),
            ),
          );
        }
        return Slice.maxOpen(parseMarkdown(text).content);
      },
    },
  });
}

// Bear-style live formatting: each rule fires as its closing markdown
// characters are typed, replacing the raw syntax with the formatted result.
// Backspace immediately after a rule fires reverts to the literal text
// (undoInputRule), so the markdown escape hatch is never more than one key
// away.

function markInputRule(pattern: RegExp, markType: MarkType): InputRule {
  return new InputRule(pattern, (state, match, start, end) => {
    const content = match[1];
    if (!content) {
      return null;
    }
    // Code blocks hold literal text; never re-format inside them.
    if (state.doc.resolve(start).parent.type.spec['code']) {
      return null;
    }
    const contentStart = start + match[0].indexOf(content);
    const tr = state.tr.delete(contentStart + content.length, end).delete(start, contentStart);
    tr.addMark(start, start + content.length, markType.create());
    return tr.removeStoredMark(markType);
  });
}

function linkInputRule(): InputRule {
  return new InputRule(/\[([^\]]+)\]\(([^()\s]+)\)$/, (state, match, start, end) => {
    const [, text, href] = match;
    if (!text || !href || state.doc.resolve(start).parent.type.spec['code']) {
      return null;
    }
    const mark = schema.marks['link'].create({ href });
    const tr = state.tr.replaceWith(start, end, schema.text(text, [mark]));
    return tr.removeStoredMark(schema.marks['link']);
  });
}

const symbolReplacements: Readonly<Record<string, string>> = {
  '->': '→', '<-': '←', '<->': '↔', '=>': '⇒', '<=>': '⇔',
  '!=': '≠', '<=': '≤', '>=': '≥', '+/-': '±', '...': '…',
};

function symbolInputRule(): InputRule {
  return new InputRule(/(<->|<=>|->|<-|=>|!=|<=|>=|\+\/-|\.\.\.) $/, (state, match, start, end) => {
    const $start = state.doc.resolve(start);
    const prefix = $start.parent.textBetween(0, $start.parentOffset, undefined, '\ufffc');
    // Do not replace a suffix of a longer operator, an escaped pattern, a URL,
    // or a Markdown destination that has not yet become a link mark.
    if (
      /[<>=!+\-/.\\]$/.test(prefix) ||
      /(?:https?:\/\/|www\.|mailto:)\S*$/i.test(prefix) ||
      /\]\([^)]*$/.test(prefix)
    ) return null;

    // Inline code only becomes a mark when its closing backticks are typed.
    // Keep patterns literal while that code span is still being written too.
    let openTicks = 0;
    for (const ticks of prefix.matchAll(/(?<!\\)`+/g)) {
      if (!openTicks) openTicks = ticks[0].length;
      else if (openTicks === ticks[0].length) openTicks = 0;
    }
    if (openTicks) return null;

    return closeHistory(state.tr.insertText(`${symbolReplacements[match[1]]} `, start, end));
  }, { inCodeMark: false });
}

function buildInputRules(): Plugin {
  return inputRules({
    rules: [
      taskInputRule(),
      dividerInputRule(),
      textblockTypeInputRule(/^(#{1,6})\s$/, schema.nodes['heading'], match => ({
        level: match[1].length,
      })),
      wrappingInputRule(/^\s*>\s$/, schema.nodes['blockquote']),
      wrappingInputRule(
        /^(\d+)\.\s$/,
        schema.nodes['ordered_list'],
        match => ({ order: +match[1] }),
        (match, node) => node.childCount + (node.attrs['order'] as number) === +match[1],
      ),
      wrappingInputRule(/^\s*([-+*])\s$/, schema.nodes['bullet_list']),
      textblockTypeInputRule(/^```$/, schema.nodes['code_block']),
      markInputRule(/\*\*([^*]+)\*\*$/, schema.marks['strong']),
      markInputRule(/__([^_]+)__$/, schema.marks['strong']),
      // Lookbehinds keep single-asterisk/underscore emphasis from firing on
      // the tail of a strong marker or in the middle of snake_case words.
      markInputRule(/(?<![*\w])\*([^*]+)\*$/, schema.marks['em']),
      markInputRule(/(?<![_\w])_([^_]+)_$/, schema.marks['em']),
      markInputRule(/`([^`]+)`$/, schema.marks['code']),
      markInputRule(/~~([^~]+)~~$/, schema.marks['strike']),
      linkInputRule(),
      symbolInputRule(),
    ],
  });
}

const blockMoveHistoryKey = new PluginKey('blockMoveHistory');

function blockMoveHistory(): Plugin {
  return new Plugin({
    key: blockMoveHistoryKey,
    appendTransaction(transactions, _oldState, state) {
      // Typing after a move starts its own Undo step, just like typing before it.
      if (transactions.some(tr => tr.getMeta(blockMoveHistoryKey))) return closeHistory(state.tr);
      return null;
    },
  });
}

/** Move intact sibling blocks, retaining the selection's offsets and direction. */
export function moveMarkdownBlock(direction: -1 | 1): Command {
  return (state, dispatch) => {
    const selection = state.selection;
    // Always consume the shortcut, including boundaries and unsupported
    // selections, so the browser cannot turn it into caret navigation.
    if (!(selection instanceof TextSelection)) return true;
    const { $from } = selection;
    let depth = $from.depth;
    for (let level = depth; level > 0; level--) {
      if ($from.node(level).type === schema.nodes['list_item']) {
        depth = level;
        break;
      }
    }
    if (depth === 0) return true;
    // A selection ending at the next block's boundary does not select it.
    const $end = state.doc.resolve(selection.empty ? selection.to : selection.to - 1);
    const parent = $from.node(depth - 1);
    if ($end.depth < depth || $end.node(depth - 1) !== parent) return true;
    const first = $from.index(depth - 1);
    const last = $end.index(depth - 1);
    const neighborIndex = direction < 0 ? first - 1 : last + 1;
    if (neighborIndex < 0 || neighborIndex >= parent.childCount) return true;

    const start = $from.before(depth);
    const end = $end.after(depth);
    const moved = parent.content.cut(start - $from.start(depth - 1), end - $from.start(depth - 1));
    const neighbor = parent.child(neighborIndex);
    const replacement = direction < 0
      ? moved.append(Fragment.from(neighbor))
      : Fragment.from(neighbor).append(moved);
    const replaceFrom = direction < 0 ? first - 1 : first;
    const replaceTo = direction < 0 ? last + 1 : last + 2;
    if (!parent.canReplace(replaceFrom, replaceTo, replacement)) return true;
    if (dispatch) {
      const shift = direction * neighbor.nodeSize;
      const tr = closeHistory(state.tr).replaceWith(
        direction < 0 ? start - neighbor.nodeSize : start,
        direction < 0 ? end : end + neighbor.nodeSize,
        replacement,
      );
      tr.setSelection(TextSelection.create(tr.doc, selection.anchor + shift, selection.head + shift));
      tr.setStoredMarks(state.storedMarks);
      dispatch(tr.setMeta(blockMoveHistoryKey, true).scrollIntoView());
    }
    return true;
  };
}

function buildKeymap(): Plugin {
  // Shift-Enter breaks the line without leaving the current block — inside a
  // list item it continues the same bullet. In a code block (which cannot hold
  // hard breaks) it exits below instead.
  const insertHardBreak = chainCommands(exitCode, (state, dispatch) => {
    if (dispatch) {
      dispatch(state.tr.replaceSelectionWith(schema.nodes['hard_break'].create()).scrollIntoView());
    }
    return true;
  });
  return keymap({
    'Shift-Enter': insertHardBreak,
    'Alt-ArrowUp': moveMarkdownBlock(-1),
    'Alt-ArrowDown': moveMarkdownBlock(1),
    'Mod-z': undo,
    'Shift-Mod-z': redo,
    'Mod-y': redo,
    Backspace: chainCommands(undoInputRule, (state, dispatch) => {
      const $cursor = state.selection instanceof TextSelection ? state.selection.$cursor : null;
      if (!$cursor || $cursor.parent.content.size !== 0) return false;
      const before = state.doc.resolve($cursor.before()).nodeBefore;
      if (
        $cursor.parent.type === schema.nodes['paragraph'] &&
        (before?.type === schema.nodes['bullet_list'] || before?.type === schema.nodes['ordered_list'])
      ) {
        // Delete the blank paragraph into the last item's text. The general
        // join command wraps it in a new item, reversing the preceding lift.
        return joinTextblockBackward(state, dispatch);
      }
      // An empty item's first paragraph exits one list level. Let ordinary
      // deletion handle text, selections, and later paragraphs within an item.
      if (
        $cursor.depth < 2 ||
        $cursor.node(-1).type !== schema.nodes['list_item'] ||
        $cursor.index(-1) !== 0
      )
        return false;
      return liftListItem(schema.nodes['list_item'])(state, dispatch);
    }),
    'Mod-b': toggleMark(schema.marks['strong']),
    'Mod-i': toggleMark(schema.marks['em']),
    'Mod-e': toggleMark(schema.marks['code']),
    // List bindings return false outside lists and fall through to baseKeymap
    // (or, for Tab, to the browser's focus order).
    Enter: (state, dispatch) => {
      const { $from } = state.selection;
      const checked = $from.depth >= 2 ? $from.node(-1).attrs['checked'] : null;
      return splitListItem(schema.nodes['list_item'], {
        checked: checked == null ? null : false,
      })(
        state,
        dispatch &&
          (tr => {
            const next = tr.selection.$from;
            if (
              checked != null &&
              next.depth >= 2 &&
              next.node(-1).type === schema.nodes['list_item']
            ) {
              tr.setNodeMarkup(next.before(-1), undefined, { checked: false });
            }
            dispatch(tr);
          }),
      );
    },
    Tab: sinkListItem(schema.nodes['list_item']),
    'Shift-Tab': liftListItem(schema.nodes['list_item']),
  });
}

export function parseMarkdown(markdown: string): ProseMirrorNode {
  return parser.parse(markdown) ?? schema.topNodeType.createAndFill()!;
}

export function serializeMarkdown(doc: ProseMirrorNode): string {
  return serializer.serialize(doc);
}

export function isDocEmpty(doc: ProseMirrorNode): boolean {
  return (
    doc.childCount === 1 &&
    doc.firstChild !== null &&
    doc.firstChild.type.name === 'paragraph' &&
    doc.firstChild.content.size === 0
  );
}

export function createMarkdownEditorState(markdown: string): EditorState {
  return EditorState.create({
    doc: parseMarkdown(markdown),
    plugins: [buildInputRules(), buildKeymap(), keymap(baseKeymap), markdownPaste(), blockMoveHistory(), history()],
  });
}
