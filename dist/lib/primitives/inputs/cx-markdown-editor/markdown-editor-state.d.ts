import { type Node as ProseMirrorNode } from 'prosemirror-model';
import { EditorState, type Command } from 'prosemirror-state';
/** Move intact sibling blocks, retaining the selection's offsets and direction. */
export declare function moveMarkdownBlock(direction: -1 | 1): Command;
export declare function parseMarkdown(markdown: string): ProseMirrorNode;
export declare function serializeMarkdown(doc: ProseMirrorNode): string;
export declare function isDocEmpty(doc: ProseMirrorNode): boolean;
export declare function createMarkdownEditorState(markdown: string): EditorState;
//# sourceMappingURL=markdown-editor-state.d.ts.map