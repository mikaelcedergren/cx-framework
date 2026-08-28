import { type Node as ProseMirrorNode } from 'prosemirror-model';
import { EditorState } from 'prosemirror-state';
export declare function parseMarkdown(markdown: string): ProseMirrorNode;
export declare function serializeMarkdown(doc: ProseMirrorNode): string;
export declare function isDocEmpty(doc: ProseMirrorNode): boolean;
export declare function createMarkdownEditorState(markdown: string): EditorState;
//# sourceMappingURL=markdown-editor-state.d.ts.map