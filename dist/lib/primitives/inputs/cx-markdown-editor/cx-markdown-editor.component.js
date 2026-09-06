import { ChangeDetectionStrategy, ChangeDetectorRef, Component, EnvironmentInjector, Injector, EventEmitter, Input, Output, ViewChild, ViewEncapsulation, inject, signal, } from '@angular/core';
import { createListItemViews } from './markdown-editor-list-item-view.js';
import * as i0 from "@angular/core";
async function loadEngine() {
    const [state, view] = await Promise.all([
        import('./markdown-editor-state.js'),
        import('prosemirror-view'),
    ]);
    return { ...state, EditorView: view.EditorView };
}
/**
 * Inline rich markdown editor. The value is always a markdown string, but the
 * user sees and edits the formatted result: typing markdown syntax (`### `,
 * `**bold**`, `- `, …) formats in place, and Backspace right after a
 * conversion restores the literal text.
 */
export class CxMarkdownEditorComponent {
    listItemViews = createListItemViews(inject(EnvironmentInjector), inject(Injector));
    engine;
    view;
    destroyed = false;
    lastKnownValue = '';
    ariaLabelState;
    changeDetector = inject(ChangeDetectorRef);
    emptyState = signal(true, /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "emptyState" }] : /* istanbul ignore next */ []));
    disabledState = signal(false, /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "disabledState" }] : /* istanbul ignore next */ []));
    contentRef;
    placeholder;
    layout = 'default';
    presentationState = 'default';
    set presentation(value) {
        this.presentationState = value === 'document' ? 'document' : 'default';
        this.view?.setProps({ attributes: this.editorAttributes() });
    }
    get presentation() {
        return this.presentationState;
    }
    set ariaLabel(value) {
        this.ariaLabelState = value;
        this.view?.setProps({ attributes: this.editorAttributes() });
    }
    set disabled(value) {
        this.disabledState.set(!!value);
        this.view?.setProps({});
        this.listItemViews.refresh();
    }
    set value(value) {
        const next = value ?? '';
        if (next === this.lastKnownValue) {
            return;
        }
        this.lastKnownValue = next;
        if (this.view && this.engine) {
            this.applyState(this.engine.createMarkdownEditorState(next));
        }
    }
    valueChange = new EventEmitter();
    focusChange = new EventEmitter();
    blurred = new EventEmitter();
    ngAfterViewInit() {
        void this.initializeEditor();
    }
    async initializeEditor() {
        const engine = await loadEngine();
        if (this.destroyed) {
            return;
        }
        this.engine = engine;
        const state = engine.createMarkdownEditorState(this.lastKnownValue);
        this.view = new engine.EditorView(this.contentRef.nativeElement, {
            state,
            nodeViews: this.listItemViews.nodeViews,
            editable: () => !this.disabledState(),
            attributes: this.editorAttributes(),
            dispatchTransaction: transaction => this.onTransaction(transaction),
            handleDOMEvents: {
                focus: () => {
                    this.focusChange.emit(true);
                    return false;
                },
                blur: () => {
                    this.focusChange.emit(false);
                    this.blurred.emit();
                    return false;
                },
            },
        });
        this.emptyState.set(engine.isDocEmpty(state.doc));
        // The engine resolves outside Angular's synchronous init pass; nudge the
        // OnPush host so the placeholder state renders.
        this.changeDetector.markForCheck();
    }
    ngOnDestroy() {
        this.destroyed = true;
        this.view?.destroy();
        this.view = undefined;
    }
    focus() {
        this.view?.focus();
    }
    // Document mode edits inside the real `.cx-article` contract — the display
    // serif headings and reading scale come from the global article styles, not
    // a local imitation. `--start` keeps the article on the editor's own edge so
    // the placeholder overlay lines up with the caret.
    editorAttributes() {
        const attributes = {
            role: 'textbox',
            'aria-multiline': 'true',
            'aria-label': this.ariaLabelState ?? 'Editor',
        };
        if (this.presentationState === 'document') {
            attributes['class'] = 'cx-article cx-article--start';
        }
        return attributes;
    }
    onTransaction(transaction) {
        const view = this.view;
        const engine = this.engine;
        if (!view || !engine) {
            return;
        }
        const state = view.state.apply(transaction);
        this.applyState(state);
        if (transaction.docChanged) {
            const markdown = engine.serializeMarkdown(state.doc);
            if (markdown !== this.lastKnownValue) {
                this.lastKnownValue = markdown;
                this.valueChange.emit(markdown);
            }
        }
    }
    applyState(state) {
        this.view?.updateState(state);
        if (this.engine) {
            this.emptyState.set(this.engine.isDocEmpty(state.doc));
        }
    }
    showPlaceholder() {
        return this.emptyState() && !!this.placeholder?.trim();
    }
    static ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "22.0.8", ngImport: i0, type: CxMarkdownEditorComponent, deps: [], target: i0.ɵɵFactoryTarget.Component });
    static ɵcmp = i0.ɵɵngDeclareComponent({ minVersion: "17.0.0", version: "22.0.8", type: CxMarkdownEditorComponent, isStandalone: true, selector: "cx-markdown-editor", inputs: { placeholder: "placeholder", layout: "layout", presentation: "presentation", ariaLabel: "ariaLabel", disabled: "disabled", value: "value" }, outputs: { valueChange: "valueChange", focusChange: "focusChange", blurred: "blurred" }, host: { properties: { "class.cx-markdown-editor-host--document": "presentation === \"document\"", "class.cx-markdown-editor-host--fill": "layout === \"fill\"", "class.cx-markdown-editor-host--disabled": "disabledState()" } }, viewQueries: [{ propertyName: "contentRef", first: true, predicate: ["content"], descendants: true, static: true }], ngImport: i0, template: "<div class=\"cx-markdown-editor\">\n  @if (showPlaceholder()) {\n    <div class=\"cx-markdown-editor__placeholder\" aria-hidden=\"true\">{{ placeholder!.trim() }}</div>\n  }\n  <div class=\"cx-markdown-editor__content\" #content></div>\n</div>\n", styles: ["cx-markdown-editor{display:block;width:100%;min-width:0}cx-markdown-editor.cx-markdown-editor-host--fill{height:100%;min-height:0}cx-markdown-editor>.cx-markdown-editor{position:relative;width:100%;height:100%;min-height:0}cx-markdown-editor .cx-markdown-editor__content{height:100%;min-height:0}cx-markdown-editor.cx-markdown-editor-host--fill .cx-markdown-editor__content{overflow-y:auto}cx-markdown-editor .cx-markdown-editor__placeholder{position:absolute;inset-block-start:0;inset-inline-start:0;color:var(--opacity-high);pointer-events:none}cx-markdown-editor .ProseMirror{position:relative;min-height:100%;box-sizing:border-box;outline:none;caret-color:var(--primary);color:var(--ink);word-wrap:break-word;white-space:pre-wrap;font-variant-ligatures:none}cx-markdown-editor:where(:not(.cx-markdown-editor-host--document)) .ProseMirror h1,cx-markdown-editor:where(:not(.cx-markdown-editor-host--document)) .ProseMirror h2,cx-markdown-editor:where(:not(.cx-markdown-editor-host--document)) .ProseMirror h3,cx-markdown-editor:where(:not(.cx-markdown-editor-host--document)) .ProseMirror h4{margin:var(--space-sm) 0 var(--space-xs);font-weight:var(--font-weight-bold);line-height:var(--line-height-heading)}cx-markdown-editor:where(:not(.cx-markdown-editor-host--document)) .ProseMirror h1{font-size:var(--font-size-title-1)}cx-markdown-editor:where(:not(.cx-markdown-editor-host--document)) .ProseMirror h2{font-size:var(--font-size-title-2)}cx-markdown-editor:where(:not(.cx-markdown-editor-host--document)) .ProseMirror h3{font-size:var(--font-size-body)}cx-markdown-editor:where(:not(.cx-markdown-editor-host--document)) .ProseMirror>:first-child{margin-top:0}cx-markdown-editor:where(:not(.cx-markdown-editor-host--document)) .ProseMirror>:last-child{margin-bottom:0}cx-markdown-editor:where(:not(.cx-markdown-editor-host--document)) .ProseMirror p{margin:0 0 var(--space-sm)}cx-markdown-editor:where(:not(.cx-markdown-editor-host--document)) .ProseMirror ul,cx-markdown-editor:where(:not(.cx-markdown-editor-host--document)) .ProseMirror ol{margin:0 0 var(--space-sm);padding-inline-start:1.5em;list-style-position:outside}cx-markdown-editor:where(:not(.cx-markdown-editor-host--document)) .ProseMirror li{margin-bottom:var(--space-2xs)}cx-markdown-editor:where(:not(.cx-markdown-editor-host--document)) .ProseMirror li>p{margin-bottom:var(--space-2xs)}cx-markdown-editor:where(:not(.cx-markdown-editor-host--document)) .ProseMirror li>p:last-child{margin-bottom:0}cx-markdown-editor:where(:not(.cx-markdown-editor-host--document)) .ProseMirror li::marker{color:var(--primary)}cx-markdown-editor:where(:not(.cx-markdown-editor-host--document)) .ProseMirror code{font-family:var(--font-family-mono);background:var(--opacity-low);padding:1px 4px;border-radius:var(--radius-xs)}cx-markdown-editor:where(:not(.cx-markdown-editor-host--document)) .ProseMirror pre{margin:0 0 var(--space-sm);padding:var(--space-sm);background:var(--opacity-low);border-radius:var(--radius-sm);overflow-x:auto}cx-markdown-editor:where(:not(.cx-markdown-editor-host--document)) .ProseMirror pre code{background:rgba(0,0,0,0);padding:0}cx-markdown-editor:where(:not(.cx-markdown-editor-host--document)) .ProseMirror blockquote{margin:0 0 var(--space-sm);padding-left:var(--space-sm);border-left:calc(var(--border-width)*2) solid var(--opacity-mid);color:var(--opacity-high)}cx-markdown-editor:where(:not(.cx-markdown-editor-host--document)) .ProseMirror a,cx-markdown-editor:where(:not(.cx-markdown-editor-host--document)) .ProseMirror a:visited,cx-markdown-editor:where(:not(.cx-markdown-editor-host--document)) .ProseMirror a:hover,cx-markdown-editor:where(:not(.cx-markdown-editor-host--document)) .ProseMirror a:active{color:var(--link);text-decoration:underline}cx-markdown-editor:where(:not(.cx-markdown-editor-host--document)) .ProseMirror hr{margin:var(--space-sm) 0;border:0;border-top:var(--line)}cx-markdown-editor,cx-markdown-editor .cx-markdown-editor__placeholder{font-family:var(--font-family-base);font-size:var(--font-size-body);line-height:var(--line-height-body)}cx-markdown-editor.cx-markdown-editor-host--document,cx-markdown-editor.cx-markdown-editor-host--document .cx-markdown-editor__placeholder{font-size:var(--cx-article-base, 18px);line-height:1.6}cx-markdown-editor.cx-markdown-editor-host--disabled .ProseMirror{color:var(--opacity-high);cursor:default}cx-markdown-editor .ProseMirror pre{white-space:pre-wrap}cx-markdown-editor .ProseMirror li{position:relative}cx-markdown-editor .ProseMirror ol{padding-inline-start:3em}cx-markdown-editor .ProseMirror-hideselection *::selection{background:rgba(0,0,0,0)}cx-markdown-editor .ProseMirror-hideselection{caret-color:rgba(0,0,0,0)}cx-markdown-editor img.ProseMirror-separator{display:inline !important;border:none !important;margin:0 !important}cx-markdown-editor .ProseMirror .cx-markdown-editor__task{list-style:none}cx-markdown-editor .cx-markdown-editor__task-control{position:absolute;inset-inline-end:calc(100% + var(--space-xs));inset-block-start:0;display:flex;align-items:center;height:1lh}cx-markdown-editor .cx-markdown-editor__task-content>p{margin-bottom:var(--space-2xs)}cx-markdown-editor .cx-markdown-editor__task-content>:last-child{margin-bottom:0}"], changeDetection: i0.ChangeDetectionStrategy.OnPush, encapsulation: i0.ViewEncapsulation.None });
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "22.0.8", ngImport: i0, type: CxMarkdownEditorComponent, decorators: [{
            type: Component,
            args: [{ selector: 'cx-markdown-editor', host: {
                        '[class.cx-markdown-editor-host--document]': 'presentation === "document"',
                        '[class.cx-markdown-editor-host--fill]': 'layout === "fill"',
                        '[class.cx-markdown-editor-host--disabled]': 'disabledState()',
                    }, encapsulation: ViewEncapsulation.None, changeDetection: ChangeDetectionStrategy.OnPush, template: "<div class=\"cx-markdown-editor\">\n  @if (showPlaceholder()) {\n    <div class=\"cx-markdown-editor__placeholder\" aria-hidden=\"true\">{{ placeholder!.trim() }}</div>\n  }\n  <div class=\"cx-markdown-editor__content\" #content></div>\n</div>\n", styles: ["cx-markdown-editor{display:block;width:100%;min-width:0}cx-markdown-editor.cx-markdown-editor-host--fill{height:100%;min-height:0}cx-markdown-editor>.cx-markdown-editor{position:relative;width:100%;height:100%;min-height:0}cx-markdown-editor .cx-markdown-editor__content{height:100%;min-height:0}cx-markdown-editor.cx-markdown-editor-host--fill .cx-markdown-editor__content{overflow-y:auto}cx-markdown-editor .cx-markdown-editor__placeholder{position:absolute;inset-block-start:0;inset-inline-start:0;color:var(--opacity-high);pointer-events:none}cx-markdown-editor .ProseMirror{position:relative;min-height:100%;box-sizing:border-box;outline:none;caret-color:var(--primary);color:var(--ink);word-wrap:break-word;white-space:pre-wrap;font-variant-ligatures:none}cx-markdown-editor:where(:not(.cx-markdown-editor-host--document)) .ProseMirror h1,cx-markdown-editor:where(:not(.cx-markdown-editor-host--document)) .ProseMirror h2,cx-markdown-editor:where(:not(.cx-markdown-editor-host--document)) .ProseMirror h3,cx-markdown-editor:where(:not(.cx-markdown-editor-host--document)) .ProseMirror h4{margin:var(--space-sm) 0 var(--space-xs);font-weight:var(--font-weight-bold);line-height:var(--line-height-heading)}cx-markdown-editor:where(:not(.cx-markdown-editor-host--document)) .ProseMirror h1{font-size:var(--font-size-title-1)}cx-markdown-editor:where(:not(.cx-markdown-editor-host--document)) .ProseMirror h2{font-size:var(--font-size-title-2)}cx-markdown-editor:where(:not(.cx-markdown-editor-host--document)) .ProseMirror h3{font-size:var(--font-size-body)}cx-markdown-editor:where(:not(.cx-markdown-editor-host--document)) .ProseMirror>:first-child{margin-top:0}cx-markdown-editor:where(:not(.cx-markdown-editor-host--document)) .ProseMirror>:last-child{margin-bottom:0}cx-markdown-editor:where(:not(.cx-markdown-editor-host--document)) .ProseMirror p{margin:0 0 var(--space-sm)}cx-markdown-editor:where(:not(.cx-markdown-editor-host--document)) .ProseMirror ul,cx-markdown-editor:where(:not(.cx-markdown-editor-host--document)) .ProseMirror ol{margin:0 0 var(--space-sm);padding-inline-start:1.5em;list-style-position:outside}cx-markdown-editor:where(:not(.cx-markdown-editor-host--document)) .ProseMirror li{margin-bottom:var(--space-2xs)}cx-markdown-editor:where(:not(.cx-markdown-editor-host--document)) .ProseMirror li>p{margin-bottom:var(--space-2xs)}cx-markdown-editor:where(:not(.cx-markdown-editor-host--document)) .ProseMirror li>p:last-child{margin-bottom:0}cx-markdown-editor:where(:not(.cx-markdown-editor-host--document)) .ProseMirror li::marker{color:var(--primary)}cx-markdown-editor:where(:not(.cx-markdown-editor-host--document)) .ProseMirror code{font-family:var(--font-family-mono);background:var(--opacity-low);padding:1px 4px;border-radius:var(--radius-xs)}cx-markdown-editor:where(:not(.cx-markdown-editor-host--document)) .ProseMirror pre{margin:0 0 var(--space-sm);padding:var(--space-sm);background:var(--opacity-low);border-radius:var(--radius-sm);overflow-x:auto}cx-markdown-editor:where(:not(.cx-markdown-editor-host--document)) .ProseMirror pre code{background:rgba(0,0,0,0);padding:0}cx-markdown-editor:where(:not(.cx-markdown-editor-host--document)) .ProseMirror blockquote{margin:0 0 var(--space-sm);padding-left:var(--space-sm);border-left:calc(var(--border-width)*2) solid var(--opacity-mid);color:var(--opacity-high)}cx-markdown-editor:where(:not(.cx-markdown-editor-host--document)) .ProseMirror a,cx-markdown-editor:where(:not(.cx-markdown-editor-host--document)) .ProseMirror a:visited,cx-markdown-editor:where(:not(.cx-markdown-editor-host--document)) .ProseMirror a:hover,cx-markdown-editor:where(:not(.cx-markdown-editor-host--document)) .ProseMirror a:active{color:var(--link);text-decoration:underline}cx-markdown-editor:where(:not(.cx-markdown-editor-host--document)) .ProseMirror hr{margin:var(--space-sm) 0;border:0;border-top:var(--line)}cx-markdown-editor,cx-markdown-editor .cx-markdown-editor__placeholder{font-family:var(--font-family-base);font-size:var(--font-size-body);line-height:var(--line-height-body)}cx-markdown-editor.cx-markdown-editor-host--document,cx-markdown-editor.cx-markdown-editor-host--document .cx-markdown-editor__placeholder{font-size:var(--cx-article-base, 18px);line-height:1.6}cx-markdown-editor.cx-markdown-editor-host--disabled .ProseMirror{color:var(--opacity-high);cursor:default}cx-markdown-editor .ProseMirror pre{white-space:pre-wrap}cx-markdown-editor .ProseMirror li{position:relative}cx-markdown-editor .ProseMirror ol{padding-inline-start:3em}cx-markdown-editor .ProseMirror-hideselection *::selection{background:rgba(0,0,0,0)}cx-markdown-editor .ProseMirror-hideselection{caret-color:rgba(0,0,0,0)}cx-markdown-editor img.ProseMirror-separator{display:inline !important;border:none !important;margin:0 !important}cx-markdown-editor .ProseMirror .cx-markdown-editor__task{list-style:none}cx-markdown-editor .cx-markdown-editor__task-control{position:absolute;inset-inline-end:calc(100% + var(--space-xs));inset-block-start:0;display:flex;align-items:center;height:1lh}cx-markdown-editor .cx-markdown-editor__task-content>p{margin-bottom:var(--space-2xs)}cx-markdown-editor .cx-markdown-editor__task-content>:last-child{margin-bottom:0}"] }]
        }], propDecorators: { contentRef: [{
                type: ViewChild,
                args: ['content', { static: true }]
            }], placeholder: [{
                type: Input
            }], layout: [{
                type: Input
            }], presentation: [{
                type: Input
            }], ariaLabel: [{
                type: Input
            }], disabled: [{
                type: Input
            }], value: [{
                type: Input
            }], valueChange: [{
                type: Output
            }], focusChange: [{
                type: Output
            }], blurred: [{
                type: Output
            }] } });
