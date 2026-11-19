import { baseKeymap, chainCommands, exitCode, joinTextblockBackward, joinTextblockForward, toggleMark } from 'prosemirror-commands';
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
  type NodeType,
  type Attrs,
  type Node as ProseMirrorNode,
} from 'prosemirror-model';
import { liftListItem, sinkListItem, splitListItem } from 'prosemirror-schema-list';
import { EditorState, NodeSelection, Plugin, PluginKey, Selection, TextSelection, type Command, type Transaction } from 'prosemirror-state';
import { canJoin, findWrapping, Transform } from 'prosemirror-transform';

// Extend the document model locally; the shared CommonMark parser stays unchanged.
const schema = new Schema({
  nodes: commonmarkSchema.spec.nodes
    .update('bullet_list', {
      ...commonmarkSchema.nodes['bullet_list'].spec,
      attrs: { tight: { default: true } },
    })
    .update('ordered_list', {
      ...commonmarkSchema.nodes['ordered_list'].spec,
      attrs: { order: { default: 1 }, tight: { default: true } },
    })
    .update('list_item', {
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
    ordered_list(state, node, parent, index) {
      // Alternate delimiters only for adjacent, deliberately restarted lists.
      // CommonMark otherwise merges them and loses the restart on reopening.
      let adjacent = 0;
      for (let i = index - 1; i >= 0 && parent.child(i).type === node.type; i--) adjacent++;
      const delimiter = adjacent % 2 ? ') ' : '. ';
      const start = node.attrs['order'] as number;
      const width = String(start + node.childCount - 1).length;
      state.renderList(node, ' '.repeat(width + 2), i => `${String(start + i).padStart(width)}${delimiter}`);
    },
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

function isList(node: ProseMirrorNode): boolean {
  return node.type === schema.nodes['bullet_list'] || node.type === schema.nodes['ordered_list'];
}

function continuesList(before: ProseMirrorNode, after: ProseMirrorNode): boolean {
  return (
    isList(before) &&
    before.type === after.type &&
    (before.type === schema.nodes['bullet_list'] ||
      after.attrs['order'] === before.attrs['order'] + before.childCount)
  );
}

/** One list for adjacent items; blank lines only when an item has multiple paragraphs. */
function normalizeLists<T extends Transform>(tr: T): T {
  const joins: number[] = [];
  tr.doc.descendants((node, pos) => {
    if (node.isLeaf) return;
    let previous: ProseMirrorNode | null = null;
    node.forEach((child, offset) => {
      if (previous && continuesList(previous, child)) joins.push(pos + 1 + offset);
      previous = child;
    });
  });
  let previous: ProseMirrorNode | null = null;
  tr.doc.forEach((node, pos) => {
    if (previous && continuesList(previous, node)) joins.push(pos);
    previous = node;
  });
  for (const pos of joins.sort((a, b) => b - a)) {
    if (canJoin(tr.doc, pos)) tr.join(pos);
  }
  tr.doc.descendants((node, pos) => {
    if (!isList(node)) return;
    let tight = true;
    node.forEach((item) => {
      let paragraphs = 0;
      item.forEach((block) => {
        if (block.isTextblock) paragraphs++;
        else if (!isList(block)) tight = false;
      });
      if (paragraphs !== 1) tight = false;
    });
    if (node.attrs['tight'] !== tight) tr.setNodeMarkup(pos, undefined, { ...node.attrs, tight });
  });
  return tr;
}

function cleanListStructure(): Plugin {
  return new Plugin({
    appendTransaction(transactions, _oldState, state) {
      if (!transactions.some((tr) => tr.docChanged)) return null;
      const tr = normalizeLists(state.tr);
      tr.setStoredMarks(state.storedMarks);
      return tr.docChanged ? tr : null;
    },
  });
}

function listInputRule(
  pattern: RegExp,
  type: NodeType,
  attrs: (match: RegExpMatchArray) => Attrs = () => ({}),
): InputRule {
  return new InputRule(pattern, (state, match, start, end) => {
    const tr = state.tr.delete(start, end);
    const range = tr.doc.resolve(start).blockRange();
    const wrapping = range && findWrapping(range, type, attrs(match));
    if (!range || !wrapping) return null;
    // Keep wrapping and joining in one edit so Backspace can undo the conversion.
    return normalizeLists(tr.wrap(range, wrapping));
  });
}

/** Remove only separator whitespace exposed by an explicit paragraph/item split. */
function trimSplitWhitespace(tr: Transaction): Transaction {
  const current = tr.selection.$from;
  if (!current.parent.isTextblock || current.parent.type.spec['code']) return tr;
  const leading = current.parent.firstChild?.isText
    ? (/^[ \t]+/.exec(current.parent.firstChild.text!)?.[0].length ?? 0)
    : 0;
  if (leading) tr.delete(current.start(), current.start() + leading);
  const start = tr.selection.$from.before();
  let previousEnd = -1;
  let trailing = 0;
  tr.doc.nodesBetween(0, start, (node, pos) => {
    if (!node.isTextblock || node.type.spec['code'] || pos + node.nodeSize > start) return;
    previousEnd = pos + node.nodeSize - 1;
    trailing = node.lastChild?.isText ? (/[ \t]+$/.exec(node.lastChild.text!)?.[0].length ?? 0) : 0;
  });
  if (trailing && previousEnd >= 0) tr.delete(previousEnd - trailing, previousEnd);
  return tr;
}

const joinSiblingItemText =
  (forward: boolean): Command =>
  (state, dispatch, view) => {
    const cursor = state.selection instanceof TextSelection ? state.selection.$cursor : null;
    if (!cursor || cursor.depth < 3 || cursor.node(-1).type !== schema.nodes['list_item'])
      return false;
    const item = cursor.node(-1),
      list = cursor.node(-2),
      index = cursor.index(-2);
    if (forward) {
      if (
        cursor.parentOffset !== cursor.parent.content.size ||
        cursor.index(-1) !== item.childCount - 1 ||
        index === list.childCount - 1
      )
        return false;
      if (!list.child(index + 1).firstChild?.isTextblock) return false;
      return joinTextblockForward(state, dispatch, view);
    }
    if (
      cursor.parentOffset !== 0 ||
      cursor.index(-1) !== 0 ||
      index === 0 ||
      !list.child(index - 1).lastChild?.isTextblock
    )
      return false;
    return joinTextblockBackward(state, dispatch, view);
  };

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
  let internalClipboard = false;
  return new Plugin({
    props: {
      transformPastedHTML(html) {
        internalClipboard = /\bdata-pm-slice=/.test(html);
        return html;
      },
      clipboardTextParser(text, $context, plain, view) {
        const inherited = view.state.storedMarks ?? $context.marks();
        if (plain) {
          return Slice.maxOpen(
            Fragment.from(
              text
                .split(/\r\n?|\n/)
                .map(line =>
                  schema.nodes['paragraph'].create(
                    null,
                    line ? schema.text(line, inherited) : undefined,
                  ),
                ),
            ),
          );
        }
        if (/^[ \t]+$/.test(text))
          return new Slice(Fragment.from(schema.text(text, inherited)), 0, 0);
        const doc = parseMarkdown(normalizeClipboardText(text));
        if (
          !/[\r\n]/.test(text) &&
          doc.childCount === 1 &&
          doc.firstChild?.type === schema.nodes['paragraph']
        ) {
          let content = Fragment.empty;
          doc.firstChild.content.forEach(node => {
            content = content.append(
              Fragment.from(
                node.mark(node.marks.reduce((marks, mark) => mark.addToSet(marks), inherited)),
              ),
            );
          });
          if ($context.parent.content.size) {
            const leading = /^[ \t]+/.exec(text)?.[0];
            const trailing = /[ \t]+$/.exec(text)?.[0];
            if (leading) content = Fragment.from(schema.text(leading, inherited)).append(content);
            if (trailing) content = content.append(Fragment.from(schema.text(trailing, inherited)));
          }
          return Slice.maxOpen(Fragment.from(doc.firstChild.copy(content)));
        }
        return Slice.maxOpen(doc.content);
      },
      transformPasted(slice, _view, plain) {
        // Plain text has already been parsed above. Code and Shift-paste stay literal.
        return plain || internalClipboard ? slice : normalizeRichClipboard(slice);
      },
    },
  });
}

const visualBullet = /^([ \t]*)([•◦▪‣⁃●○■]|[☐☑☒])[ \t\u00a0]+/u;
const clipboardList = /^([ \t]*)(?:[-+*] |\d{1,9}[.)] )/;

function sectionLabel(text: string): boolean {
  const label = text.trim();
  return (
    label.length > 0 &&
    label.length <= 80 &&
    label.split(/\s+/).length <= 10 &&
    !/[.!?;]$/.test(label) &&
    !/^[#>*\-`~\d]/.test(label)
  );
}

/** Interpret copied visual structure without rewriting the author's words. */
function normalizeClipboardText(text: string): string {
  const lines = text.replace(/\r\n?/g, '\n').split('\n');
  const literal = new Set<number>();
  let fence: { marker: string; length: number } | undefined;
  let inList = false;
  for (let i = 0; i < lines.length; i++) {
    const match = /^ {0,3}(`{3,}|~{3,})/.exec(lines[i]);
    if (fence) {
      literal.add(i);
      if (
        match &&
        match[1][0] === fence.marker &&
        match[1].length >= fence.length &&
        !lines[i].slice(match[0].length).trim()
      )
        fence = undefined;
      continue;
    }
    if (match) {
      literal.add(i);
      inList = false;
      fence = { marker: match[1][0], length: match[1].length };
      continue;
    }
    // An indented code excerpt is already meaningful Markdown. Nested visual bullets
    // remain list items, but ordinary code lines must not acquire inferred headings.
    if (/^( {4}|\t)/.test(lines[i]) && (!inList || !visualBullet.test(lines[i]))) {
      literal.add(i);
      continue;
    }
    lines[i] = lines[i]
      .replace(/\u00a0/g, ' ')
      .replace(
        visualBullet,
        (_all, indent, marker) =>
          `${indent}- ${marker === '☐' ? '[ ] ' : /[☑☒]/.test(marker) ? '[x] ' : ''}`,
      );
    if (lines[i].trim()) inList = clipboardList.test(lines[i]);
  }
  for (let i = 0; i < lines.length - 1; i++) {
    if (literal.has(i) || literal.has(i + 1)) continue;
    // A short label directly above a list is a section; a blank line or a sentence
    // is not evidence for a heading. Explicit Markdown always takes precedence.
    if (
      (i === 0 || !lines[i - 1].trim()) &&
      sectionLabel(lines[i]) &&
      !/^\s/.test(lines[i]) &&
      clipboardList.test(lines[i + 1])
    ) {
      lines[i] = `### ${lines[i]}`;
    }
  }
  return lines.join('\n');
}

function normalizeRichClipboard(slice: Slice): Slice {
  const blocks: ProseMirrorNode[] = [];
  let changed = false;
  slice.content.forEach(node => {
    if (node.type !== schema.nodes['paragraph']) {
      blocks.push(node);
      return;
    }
    const lines: Fragment[] = [];
    let start = 0;
    node.forEach((child, offset) => {
      if (child.type === schema.nodes['hard_break']) {
        lines.push(node.content.cut(start, offset));
        start = offset + child.nodeSize;
      }
    });
    lines.push(node.content.cut(start));
    const hasList = lines.some(line => richClipboardPrefix(line));
    const hasParagraphBreak = lines.some((line, i) => !line.size && i > 0 && i < lines.length - 1);
    if (!hasList && !hasParagraphBreak) {
      blocks.push(node);
      return;
    }
    changed = true;
    // Single breaks remain intentional inside prose (addresses, poems). Two breaks
    // mean a paragraph; list-shaped lines mean individual items. Inline marks survive.
    if (hasList) lines.forEach(line => blocks.push(node.copy(line)));
    else {
      let paragraph = Fragment.empty;
      lines.forEach(line => {
        if (!line.size) {
          if (paragraph.size) blocks.push(node.copy(paragraph));
          paragraph = Fragment.empty;
        } else {
          if (paragraph.size)
            paragraph = paragraph.append(Fragment.from(schema.nodes['hard_break'].create()));
          paragraph = paragraph.append(line);
        }
      });
      if (paragraph.size) blocks.push(node.copy(paragraph));
    }
  });
  const result: ProseMirrorNode[] = [];
  for (let i = 0; i < blocks.length; i++) {
    const node = blocks[i];
    const prefix = node.type === schema.nodes['paragraph'] && richClipboardPrefix(node.content);
    if (!prefix) {
      const next = blocks[i + 1];
      if (
        node.type === schema.nodes['paragraph'] &&
        sectionLabel(node.textContent) &&
        next?.type === schema.nodes['paragraph'] &&
        richClipboardPrefix(next.content)
      ) {
        result.push(schema.nodes['heading'].create({ level: 3 }, node.content));
        changed = true;
      } else result.push(node);
      continue;
    }
    changed = true;
    const entries: {
      node: ProseMirrorNode;
      prefix: NonNullable<ReturnType<typeof clipboardPrefix>>;
    }[] = [];
    for (; i < blocks.length; i++) {
      const candidate = blocks[i];
      const marker =
        candidate.type === schema.nodes['paragraph'] && richClipboardPrefix(candidate.content);
      if (marker) entries.push({ node: candidate, prefix: marker });
      else if (
        !candidate.content.size &&
        blocks[i + 1]?.type === schema.nodes['paragraph'] &&
        richClipboardPrefix(blocks[i + 1].content)
      )
        continue;
      else break;
    }
    i--;
    let cursor = 0;
    const readLevel = (indent: number): ProseMirrorNode[] => {
      const lists: ProseMirrorNode[] = [];
      while (cursor < entries.length && entries[cursor].prefix.indent >= indent) {
        const { node: line, prefix: marker } = entries[cursor];
        const previous = lists.at(-1);
        if (marker.indent > indent && previous) {
          const item = previous.lastChild!;
          const nested = Fragment.from(readLevel(marker.indent));
          lists[lists.length - 1] = previous.copy(
            previous.content.replaceChild(
              previous.childCount - 1,
              item.copy(item.content.append(nested)),
            ),
          );
          continue;
        }
        cursor++;
        const item = schema.nodes['list_item'].create(
          { checked: marker.checked },
          line.copy(line.content.cut(marker.length)),
        );
        const type = schema.nodes[marker.order === null ? 'bullet_list' : 'ordered_list'];
        if (
          previous?.type === type &&
          (marker.order === null || marker.order === previous.attrs['order'] + previous.childCount)
        ) {
          lists[lists.length - 1] = previous.copy(previous.content.append(Fragment.from(item)));
        } else
          lists.push(
            type.create(
              { tight: true, ...(marker.order !== null ? { order: marker.order } : {}) },
              item,
            ),
          );
      }
      return lists;
    };
    result.push(...readLevel(0));
  }
  return changed ? Slice.maxOpen(Fragment.from(result)) : slice;
}

function richClipboardPrefix(content: Fragment): ReturnType<typeof clipboardPrefix> {
  const prefix = clipboardPrefix(content.textBetween(0, content.size));
  if (!prefix) return null;
  let literal = false;
  content.forEach((node, offset) => {
    if (offset < prefix.length && node.marks.some(mark => mark.type === schema.marks['code']))
      literal = true;
  });
  return literal ? null : prefix;
}

function clipboardPrefix(
  text: string,
): { length: number; indent: number; order: number | null; checked: boolean | null } | null {
  text = text.replace(/\u00a0/g, ' ');
  const visual = visualBullet.exec(text);
  const ordinary = /^\s*(?:([-+*])|([0-9]{1,9})[.)])[ \t\u00a0]+/.exec(text);
  const match = visual ?? ordinary;
  if (!match) return null;
  const marker = visual?.[2];
  const task = /^\[([ xX])\] /.exec(text.slice(match[0].length));
  return {
    length: match[0].length + (task?.[0].length ?? 0),
    indent: /^\s*/.exec(text)![0].replace(/\t/g, '    ').length,
    order: ordinary?.[2] ? Number(ordinary[2]) : null,
    checked: task
      ? task[1].toLowerCase() === 'x'
      : marker === '☐'
        ? false
        : marker && /[☑☒]/.test(marker)
          ? true
          : null,
  };
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
      listInputRule(
        /^(\d+)\.\s$/,
        schema.nodes['ordered_list'],
        match => ({ order: +match[1] }),
      ),
      listInputRule(/^\s*([-+*])\s$/, schema.nodes['bullet_list']),
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

/** Treat adjacent lists of the same kind as one list for an explicit indent. */
const indentAcrossLists: Command = (state, dispatch) => {
  const { selection } = state;
  if (!(selection instanceof TextSelection)) return false;
  const { $from, $to } = selection;
  const range = $from.blockRange($to, node => node.firstChild?.type === schema.nodes['list_item']);
  if (!range || range.startIndex !== 0) return false;
  const list = range.parent;
  const listStart = $from.before(range.depth);
  const previous = state.doc.resolve(listStart).nodeBefore;
  if (previous?.type !== list.type) return false;

  // Reuse the ordinary list command on the joined document, then publish both
  // steps as one edit. Joining alone would leave the bullet at the wrong level.
  const joined = closeHistory(state.tr).join(listStart);
  return sinkListItem(schema.nodes['list_item'])(state.apply(joined), dispatch && (nested => {
    for (const step of nested.steps) joined.step(step);
    joined.setSelection(nested.selection.getBookmark().resolve(joined.doc));
    joined.setStoredMarks(state.storedMarks);
    dispatch(joined.setMeta(blockMoveHistoryKey, true).scrollIntoView());
  }));
};

/** Backspace at a list boundary must leave the caret on the preceding content. */
function removeBlockBackward(
  state: EditorState,
  dispatch: Parameters<Command>[1],
  from: number,
  to: number,
): boolean {
  if (dispatch) {
    const tr = state.tr.delete(from, to);
    const boundary = tr.doc.resolve(tr.mapping.map(from, -1));
    tr.setSelection(Selection.near(boundary, -1));
    dispatch(tr.scrollIntoView());
  }
  return true;
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
      const { selection } = state;
      if (
        selection instanceof NodeSelection &&
        selection.node.isAtom &&
        selection.$from.parent.type === schema.nodes['list_item']
      ) {
        return removeBlockBackward(state, dispatch, selection.from, selection.to);
      }
      const $cursor = selection instanceof TextSelection ? selection.$cursor : null;
      if (!$cursor || $cursor.parent.content.size !== 0) return false;
      const before = state.doc.resolve($cursor.before()).nodeBefore;
      if ($cursor.parent.type === schema.nodes['paragraph'] && before && isList(before)) {
        return removeBlockBackward(state, dispatch, $cursor.before(), $cursor.after());
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
    }, joinSiblingItemText(false)),
    Delete: joinSiblingItemText(true),
    'Mod-b': toggleMark(schema.marks['strong']),
    'Mod-i': toggleMark(schema.marks['em']),
    'Mod-e': toggleMark(schema.marks['code']),
    // List bindings return false outside lists and fall through to baseKeymap
    // (or, for Tab, to the browser's focus order).
    Enter: chainCommands((state, dispatch) => {
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
            dispatch(trimSplitWhitespace(tr));
          }),
      );
    }, (state, dispatch, view) => baseKeymap['Enter'](state, dispatch && (tr => dispatch(trimSplitWhitespace(tr))), view)),
    Tab: (state, dispatch) => chainCommands(sinkListItem(schema.nodes['list_item']), indentAcrossLists)(
      state, dispatch && (tr => dispatch(tr.setStoredMarks(state.storedMarks))),
    ),
    'Shift-Tab': (state, dispatch) => liftListItem(schema.nodes['list_item'])(
      state, dispatch && (tr => dispatch(tr.setStoredMarks(state.storedMarks))),
    ),
  });
}

export function parseMarkdown(markdown: string): ProseMirrorNode {
  return normalizeLists(new Transform(parser.parse(markdown) ?? schema.topNodeType.createAndFill()!)).doc;
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
    plugins: [buildInputRules(), buildKeymap(), keymap(baseKeymap), markdownPaste(), cleanListStructure(), blockMoveHistory(), history()],
  });
}
