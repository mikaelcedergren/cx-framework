import { AfterViewInit, EventEmitter, OnDestroy } from '@angular/core';
import * as i0 from "@angular/core";
/**
 * `default` — compact UI markdown scale (notes, inline surfaces).
 * `document` — editorial reading scale shared with `.cx-article`.
 */
export type CxMarkdownEditorPresentation = 'default' | 'document';
export type CxMarkdownEditorLayout = 'default' | 'fill';
/**
 * Inline rich markdown editor. The value is always a markdown string, but the
 * user sees and edits the formatted result: typing markdown syntax (`### `,
 * `**bold**`, `- `, …) formats in place, and Backspace right after a
 * conversion restores the literal text.
 */
export declare class CxMarkdownEditorComponent implements AfterViewInit, OnDestroy {
    private readonly listItemViews;
    private engine;
    private view;
    private destroyed;
    private lastKnownValue;
    private ariaLabelState;
    private readonly changeDetector;
    protected readonly emptyState: import("@angular/core").WritableSignal<boolean>;
    protected readonly disabledState: import("@angular/core").WritableSignal<boolean>;
    private readonly contentRef;
    placeholder: string | undefined;
    layout: CxMarkdownEditorLayout;
    private presentationState;
    set presentation(value: CxMarkdownEditorPresentation);
    get presentation(): CxMarkdownEditorPresentation;
    set ariaLabel(value: string | undefined);
    set disabled(value: boolean);
    set value(value: string | undefined);
    readonly valueChange: EventEmitter<string>;
    readonly focusChange: EventEmitter<boolean>;
    readonly blurred: EventEmitter<void>;
    ngAfterViewInit(): void;
    private initializeEditor;
    ngOnDestroy(): void;
    focus(): void;
    private editorAttributes;
    private onTransaction;
    private applyState;
    protected showPlaceholder(): boolean;
    static ɵfac: i0.ɵɵFactoryDeclaration<CxMarkdownEditorComponent, never>;
    static ɵcmp: i0.ɵɵComponentDeclaration<CxMarkdownEditorComponent, "cx-markdown-editor", never, { "placeholder": { "alias": "placeholder"; "required": false; }; "layout": { "alias": "layout"; "required": false; }; "presentation": { "alias": "presentation"; "required": false; }; "ariaLabel": { "alias": "ariaLabel"; "required": false; }; "disabled": { "alias": "disabled"; "required": false; }; "value": { "alias": "value"; "required": false; }; }, { "valueChange": "valueChange"; "focusChange": "focusChange"; "blurred": "blurred"; }, never, never, true, never>;
}
//# sourceMappingURL=cx-markdown-editor.component.d.ts.map