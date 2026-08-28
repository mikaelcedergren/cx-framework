import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output, ViewChild, computed, signal, } from '@angular/core';
import * as i0 from "@angular/core";
export class CxUsageGuidanceComponent {
    textState = signal('', /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "textState" }] : /* istanbul ignore next */ []));
    draft$ = signal('', /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "draft$" }] : /* istanbul ignore next */ []));
    editing$ = signal(false, /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "editing$" }] : /* istanbul ignore next */ []));
    editor;
    componentName = '';
    saving = false;
    error = '';
    /** When false, guidance is read-only — no edit affordance, no editing. */
    editable = true;
    set text(value) {
        const next = value ?? '';
        this.textState.set(next);
        if (!this.editing$()) {
            this.draft$.set(next);
        }
    }
    textChange = new EventEmitter();
    displayText$ = computed(() => this.textState().trim(), /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "displayText$" }] : /* istanbul ignore next */ []));
    hasText$ = computed(() => this.displayText$().length > 0, /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "hasText$" }] : /* istanbul ignore next */ []));
    editLabel$ = computed(() => {
        const name = this.componentName || 'component';
        return `Edit usage guidance for ${name}`;
    }, /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "editLabel$" }] : /* istanbul ignore next */ []));
    startEditing() {
        if (!this.editable)
            return;
        this.draft$.set(this.textState());
        this.editing$.set(true);
        requestAnimationFrame(() => this.editor?.nativeElement.focus());
    }
    onDraftInput(event) {
        this.draft$.set(event.target.value);
    }
    onEditorKeydown(event) {
        if (event.key === 'Escape') {
            event.preventDefault();
            this.cancelEditing();
            return;
        }
        if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') {
            event.preventDefault();
            this.commitEditing();
        }
    }
    commitEditing() {
        if (!this.editing$()) {
            return;
        }
        const next = this.draft$().trim();
        const previous = this.textState().trim();
        this.editing$.set(false);
        if (next === previous) {
            this.draft$.set(this.textState());
            return;
        }
        this.textState.set(next);
        this.draft$.set(next);
        this.textChange.emit(next);
    }
    cancelEditing() {
        this.draft$.set(this.textState());
        this.editing$.set(false);
    }
    static ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "22.0.8", ngImport: i0, type: CxUsageGuidanceComponent, deps: [], target: i0.ɵɵFactoryTarget.Component });
    static ɵcmp = i0.ɵɵngDeclareComponent({ minVersion: "17.0.0", version: "22.0.8", type: CxUsageGuidanceComponent, isStandalone: true, selector: "cx-usage-guidance", inputs: { componentName: "componentName", saving: "saving", error: "error", editable: "editable", text: "text" }, outputs: { textChange: "textChange" }, viewQueries: [{ propertyName: "editor", first: true, predicate: ["editor"], descendants: true }], ngImport: i0, template: "<section class=\"cx-usage-guidance\">\n  <header class=\"cx-usage-guidance__header\">\n    <h2 class=\"cx-usage-guidance__title\">Usage guidance</h2>\n\n    @if (saving || error) {\n      <span class=\"cx-usage-guidance__status\" [class.cx-usage-guidance__status--error]=\"!!error\">\n        {{ error || 'Saving' }}\n      </span>\n    }\n  </header>\n\n  @if (editing$()) {\n    <textarea\n      #editor\n      class=\"cx-usage-guidance__editor\"\n      [attr.aria-label]=\"editLabel$()\"\n      [value]=\"draft$()\"\n      (input)=\"onDraftInput($event)\"\n      (keydown)=\"onEditorKeydown($event)\"\n      (blur)=\"commitEditing()\"\n    ></textarea>\n  } @else if (editable) {\n    <button\n      class=\"cx-usage-guidance__read\"\n      type=\"button\"\n      [attr.aria-label]=\"editLabel$()\"\n      (click)=\"startEditing()\"\n    >\n      @if (hasText$()) {\n        <span class=\"cx-usage-guidance__body\">{{ displayText$() }}</span>\n      } @else {\n        <span class=\"cx-usage-guidance__empty\">No usage guidance yet.</span>\n      }\n    </button>\n  } @else {\n    <div class=\"cx-usage-guidance__read\">\n      @if (hasText$()) {\n        <span class=\"cx-usage-guidance__body\">{{ displayText$() }}</span>\n      } @else {\n        <span class=\"cx-usage-guidance__empty\">No usage guidance yet.</span>\n      }\n    </div>\n  }\n</section>\n", styles: [":host {\n  display: block;\n  width: 100%;\n  container-type: inline-size;\n}\n\n.cx-usage-guidance {\n  display: flex;\n  min-width: 0;\n  flex-direction: column;\n  gap: var(--space-lg);\n  padding-block-start: var(--space-xl);\n  border-top: var(--line);\n}\n\n.cx-usage-guidance__header {\n  display: flex;\n  min-width: 0;\n  align-items: flex-end;\n  justify-content: space-between;\n  gap: var(--space-md);\n}\n\n.cx-usage-guidance__title {\n  margin: 0;\n  color: var(--ink);\n  font-size: var(--font-size-title-2);\n  font-weight: var(--font-weight-bold);\n  letter-spacing: 0;\n  line-height: var(--line-height-heading);\n}\n\n.cx-usage-guidance__status {\n  flex: 0 0 auto;\n  color: var(--opacity-high);\n  font-size: var(--font-size-body-sm);\n  line-height: var(--line-height-small);\n}\n\n.cx-usage-guidance__status--error {\n  color: var(--danger);\n}\n\n.cx-usage-guidance__read {\n  display: block;\n  width: 100%;\n  min-width: 0;\n  padding: 0;\n  border: 0;\n  border-radius: var(--radius-sm);\n  background: transparent;\n  color: var(--ink);\n  cursor: text;\n  font: inherit;\n  text-align: left;\n}\n\n.cx-usage-guidance__read:hover .cx-usage-guidance__body {\n  color: var(--ink);\n}\n\n.cx-usage-guidance__read:focus-visible,\n.cx-usage-guidance__editor:focus-visible {\n  outline: var(--outline-tab);\n  outline-offset: var(--outline-tab-offset);\n}\n\n.cx-usage-guidance__body {\n  display: block;\n  column-count: 2;\n  column-gap: var(--space-2xl);\n  color: var(--opacity-high);\n  font-size: var(--font-size-title-3);\n  font-weight: var(--font-weight-regular);\n  line-height: 1.8;\n  overflow-wrap: anywhere;\n  white-space: normal;\n}\n\n.cx-usage-guidance__empty {\n  display: block;\n  color: var(--opacity-high);\n  font-size: var(--font-size-body);\n  line-height: var(--line-height-body);\n}\n\n.cx-usage-guidance__editor {\n  width: 100%;\n  min-height: 220px;\n  padding: var(--space-lg);\n  border: var(--line);\n  border-radius: var(--radius-xl);\n  background: var(--surface);\n  color: var(--ink);\n  box-sizing: border-box;\n  font: inherit;\n  font-size: var(--font-size-title-3);\n  line-height: 1.8;\n  resize: vertical;\n}\n\n@container (max-width: 720px) {\n  .cx-usage-guidance__body {\n    column-count: 1;\n  }\n}\n\n@container (max-width: 420px) {\n  .cx-usage-guidance__header {\n    align-items: flex-start;\n    flex-direction: column;\n  }\n\n  .cx-usage-guidance__editor {\n    padding: var(--space-md);\n  }\n}\n"], changeDetection: i0.ChangeDetectionStrategy.OnPush });
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "22.0.8", ngImport: i0, type: CxUsageGuidanceComponent, decorators: [{
            type: Component,
            args: [{ selector: 'cx-usage-guidance', changeDetection: ChangeDetectionStrategy.OnPush, template: "<section class=\"cx-usage-guidance\">\n  <header class=\"cx-usage-guidance__header\">\n    <h2 class=\"cx-usage-guidance__title\">Usage guidance</h2>\n\n    @if (saving || error) {\n      <span class=\"cx-usage-guidance__status\" [class.cx-usage-guidance__status--error]=\"!!error\">\n        {{ error || 'Saving' }}\n      </span>\n    }\n  </header>\n\n  @if (editing$()) {\n    <textarea\n      #editor\n      class=\"cx-usage-guidance__editor\"\n      [attr.aria-label]=\"editLabel$()\"\n      [value]=\"draft$()\"\n      (input)=\"onDraftInput($event)\"\n      (keydown)=\"onEditorKeydown($event)\"\n      (blur)=\"commitEditing()\"\n    ></textarea>\n  } @else if (editable) {\n    <button\n      class=\"cx-usage-guidance__read\"\n      type=\"button\"\n      [attr.aria-label]=\"editLabel$()\"\n      (click)=\"startEditing()\"\n    >\n      @if (hasText$()) {\n        <span class=\"cx-usage-guidance__body\">{{ displayText$() }}</span>\n      } @else {\n        <span class=\"cx-usage-guidance__empty\">No usage guidance yet.</span>\n      }\n    </button>\n  } @else {\n    <div class=\"cx-usage-guidance__read\">\n      @if (hasText$()) {\n        <span class=\"cx-usage-guidance__body\">{{ displayText$() }}</span>\n      } @else {\n        <span class=\"cx-usage-guidance__empty\">No usage guidance yet.</span>\n      }\n    </div>\n  }\n</section>\n", styles: [":host {\n  display: block;\n  width: 100%;\n  container-type: inline-size;\n}\n\n.cx-usage-guidance {\n  display: flex;\n  min-width: 0;\n  flex-direction: column;\n  gap: var(--space-lg);\n  padding-block-start: var(--space-xl);\n  border-top: var(--line);\n}\n\n.cx-usage-guidance__header {\n  display: flex;\n  min-width: 0;\n  align-items: flex-end;\n  justify-content: space-between;\n  gap: var(--space-md);\n}\n\n.cx-usage-guidance__title {\n  margin: 0;\n  color: var(--ink);\n  font-size: var(--font-size-title-2);\n  font-weight: var(--font-weight-bold);\n  letter-spacing: 0;\n  line-height: var(--line-height-heading);\n}\n\n.cx-usage-guidance__status {\n  flex: 0 0 auto;\n  color: var(--opacity-high);\n  font-size: var(--font-size-body-sm);\n  line-height: var(--line-height-small);\n}\n\n.cx-usage-guidance__status--error {\n  color: var(--danger);\n}\n\n.cx-usage-guidance__read {\n  display: block;\n  width: 100%;\n  min-width: 0;\n  padding: 0;\n  border: 0;\n  border-radius: var(--radius-sm);\n  background: transparent;\n  color: var(--ink);\n  cursor: text;\n  font: inherit;\n  text-align: left;\n}\n\n.cx-usage-guidance__read:hover .cx-usage-guidance__body {\n  color: var(--ink);\n}\n\n.cx-usage-guidance__read:focus-visible,\n.cx-usage-guidance__editor:focus-visible {\n  outline: var(--outline-tab);\n  outline-offset: var(--outline-tab-offset);\n}\n\n.cx-usage-guidance__body {\n  display: block;\n  column-count: 2;\n  column-gap: var(--space-2xl);\n  color: var(--opacity-high);\n  font-size: var(--font-size-title-3);\n  font-weight: var(--font-weight-regular);\n  line-height: 1.8;\n  overflow-wrap: anywhere;\n  white-space: normal;\n}\n\n.cx-usage-guidance__empty {\n  display: block;\n  color: var(--opacity-high);\n  font-size: var(--font-size-body);\n  line-height: var(--line-height-body);\n}\n\n.cx-usage-guidance__editor {\n  width: 100%;\n  min-height: 220px;\n  padding: var(--space-lg);\n  border: var(--line);\n  border-radius: var(--radius-xl);\n  background: var(--surface);\n  color: var(--ink);\n  box-sizing: border-box;\n  font: inherit;\n  font-size: var(--font-size-title-3);\n  line-height: 1.8;\n  resize: vertical;\n}\n\n@container (max-width: 720px) {\n  .cx-usage-guidance__body {\n    column-count: 1;\n  }\n}\n\n@container (max-width: 420px) {\n  .cx-usage-guidance__header {\n    align-items: flex-start;\n    flex-direction: column;\n  }\n\n  .cx-usage-guidance__editor {\n    padding: var(--space-md);\n  }\n}\n"] }]
        }], propDecorators: { editor: [{
                type: ViewChild,
                args: ['editor']
            }], componentName: [{
                type: Input
            }], saving: [{
                type: Input
            }], error: [{
                type: Input
            }], editable: [{
                type: Input
            }], text: [{
                type: Input
            }], textChange: [{
                type: Output
            }] } });
