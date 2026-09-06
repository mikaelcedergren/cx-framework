import { baseKeymap, chainCommands, exitCode, toggleMark } from 'prosemirror-commands';
import { history, redo, undo } from 'prosemirror-history';
import { InputRule, inputRules, textblockTypeInputRule, undoInputRule, wrappingInputRule, } from 'prosemirror-inputrules';
import { keymap } from 'prosemirror-keymap';
import { defaultMarkdownParser, defaultMarkdownSerializer, MarkdownParser, MarkdownSerializer, schema as commonmarkSchema, } from 'prosemirror-markdown';
import { Fragment, Schema, Slice, } from 'prosemirror-model';
import { liftListItem, sinkListItem, splitListItem } from 'prosemirror-schema-list';
import { EditorState, Plugin, TextSelection } from 'prosemirror-state';
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
const Tokenizer = defaultMarkdownParser.tokenizer.constructor;
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
            if (tokens[index + 1]?.type !== 'paragraph_open' ||
                inline?.type !== 'inline' ||
                first?.type !== 'text')
                return null;
            const match = /^\[([ xX])\](?:[ \t]+|$)/.exec(first.content);
            if (!match || !/^\[([ xX])\](?:[ \t]+|$)/.test(inline.content))
                return null;
            first.content = first.content.slice(match[0].length);
            return { checked: match[1].toLowerCase() === 'x' };
        },
    },
});
const serializer = new MarkdownSerializer({
    ...defaultMarkdownSerializer.nodes,
    list_item(state, node) {
        if (node.attrs['checked'] !== null)
            state.write(node.attrs['checked'] ? '[x] ' : '[ ] ');
        state.renderContent(node);
    },
}, {
    ...defaultMarkdownSerializer.marks,
    strike: {
        open: '~~',
        close: '~~',
        mixable: true,
        expelEnclosingWhitespace: true,
    },
});
function taskInputRule() {
    // The preceding '- ' has already converted into a normal list item.
    return new InputRule(/^\[([ xX])\]\s$/, (state, match, start, end) => {
        const $start = state.doc.resolve(start);
        if ($start.depth < 2 ||
            $start.node(-1).type !== schema.nodes['list_item'] ||
            $start.index(-1) !== 0)
            return null;
        return state.tr.delete(start, end).setNodeMarkup($start.before(-1), undefined, {
            checked: match[1].toLowerCase() === 'x',
        });
    });
}
function dividerInputRule() {
    return new InputRule(/^(?:---|\*\*\*|___)$/, (state, _match, start, end) => {
        const $start = state.doc.resolve(start);
        if ($start.parent.type !== schema.nodes['paragraph'])
            return null;
        const from = $start.before();
        const tr = state.tr.replaceWith(from, $start.after(), [
            schema.nodes['horizontal_rule'].create(),
            schema.nodes['paragraph'].create(null, $start.parent.content.cut(end - $start.start())),
        ]);
        // Retain the paragraph after the divider, ready for the next sentence.
        return tr.setSelection(TextSelection.near(tr.doc.resolve(from + 1)));
    });
}
function markdownPaste() {
    return new Plugin({
        props: {
            clipboardTextParser(text, $context, plain) {
                if (plain) {
                    return Slice.maxOpen(Fragment.from(text
                        .split(/\r\n?|\n/)
                        .map(line => schema.nodes['paragraph'].create(null, line ? schema.text(line, $context.marks()) : undefined))));
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
function markInputRule(pattern, markType) {
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
function linkInputRule() {
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
function buildInputRules() {
    return inputRules({
        rules: [
            taskInputRule(),
            dividerInputRule(),
            textblockTypeInputRule(/^(#{1,6})\s$/, schema.nodes['heading'], match => ({
                level: match[1].length,
            })),
            wrappingInputRule(/^\s*>\s$/, schema.nodes['blockquote']),
            wrappingInputRule(/^(\d+)\.\s$/, schema.nodes['ordered_list'], match => ({ order: +match[1] }), (match, node) => node.childCount + node.attrs['order'] === +match[1]),
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
        ],
    });
}
function buildKeymap() {
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
        Enter: (state, dispatch) => {
            const { $from } = state.selection;
            const checked = $from.depth >= 2 ? $from.node(-1).attrs['checked'] : null;
            return splitListItem(schema.nodes['list_item'], {
                checked: checked == null ? null : false,
            })(state, dispatch &&
                (tr => {
                    const next = tr.selection.$from;
                    if (checked != null &&
                        next.depth >= 2 &&
                        next.node(-1).type === schema.nodes['list_item']) {
                        tr.setNodeMarkup(next.before(-1), undefined, { checked: false });
                    }
                    dispatch(tr);
                }));
        },
        Tab: sinkListItem(schema.nodes['list_item']),
        'Shift-Tab': liftListItem(schema.nodes['list_item']),
    });
}
export function parseMarkdown(markdown) {
    return parser.parse(markdown) ?? schema.topNodeType.createAndFill();
}
export function serializeMarkdown(doc) {
    return serializer.serialize(doc);
}
export function isDocEmpty(doc) {
    return (doc.childCount === 1 &&
        doc.firstChild !== null &&
        doc.firstChild.type.name === 'paragraph' &&
        doc.firstChild.content.size === 0);
}
export function createMarkdownEditorState(markdown) {
    return EditorState.create({
        doc: parseMarkdown(markdown),
        plugins: [buildInputRules(), buildKeymap(), keymap(baseKeymap), markdownPaste(), history()],
    });
}
