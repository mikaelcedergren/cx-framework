import { baseKeymap, chainCommands, exitCode, toggleMark } from 'prosemirror-commands';
import { history, redo, undo } from 'prosemirror-history';
import {
  InputRule,
  inputRules,
  textblockTypeInputRule,
  undoInputRule,
  wrappingInputRule,
} from 'prosemirror-inputrules';
import { keymap } from 'prosemirror-keymap';
import { defaultMarkdownParser, defaultMarkdownSerializer, schema } from 'prosemirror-markdown';
import { type MarkType, type Node as ProseMirrorNode } from 'prosemirror-model';
import { liftListItem, sinkListItem, splitListItem } from 'prosemirror-schema-list';
import { EditorState, type Plugin } from 'prosemirror-state';

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
    const tr = state.tr.replaceWith(start, end, markType.schema.text(content, [markType.create()]));
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

function buildInputRules(): Plugin {
  return inputRules({
    rules: [
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
      linkInputRule(),
    ],
  });
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
    'Mod-z': undo,
    'Shift-Mod-z': redo,
    'Mod-y': redo,
    Backspace: undoInputRule,
    'Mod-b': toggleMark(schema.marks['strong']),
    'Mod-i': toggleMark(schema.marks['em']),
    'Mod-e': toggleMark(schema.marks['code']),
    // List bindings return false outside lists and fall through to baseKeymap
    // (or, for Tab, to the browser's focus order).
    Enter: splitListItem(schema.nodes['list_item']),
    Tab: sinkListItem(schema.nodes['list_item']),
    'Shift-Tab': liftListItem(schema.nodes['list_item']),
  });
}

export function parseMarkdown(markdown: string): ProseMirrorNode {
  return defaultMarkdownParser.parse(markdown) ?? schema.topNodeType.createAndFill()!;
}

export function serializeMarkdown(doc: ProseMirrorNode): string {
  return defaultMarkdownSerializer.serialize(doc);
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
    plugins: [buildInputRules(), buildKeymap(), keymap(baseKeymap), history()],
  });
}
