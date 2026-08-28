import { ChangeDetectionStrategy, Component, ElementRef, EventEmitter, Injector, Input, Output, afterNextRender, inject, signal, } from '@angular/core';
import { CxButtonComponent } from '../../primitives/actions/cx-button/index.js';
import { CxIconButtonComponent } from '../../primitives/actions/cx-icon-button/index.js';
import { CxSearchFieldComponent } from '../../primitives/inputs/cx-search-field/index.js';
import { CxSpinnerComponent } from '../../primitives/feedback/cx-spinner/index.js';
import * as i0 from "@angular/core";
/**
 * A decorative image pane that fills its container and lets the user swap the
 * picture in place: hovering reveals a settings control, which turns the pane
 * into a picker. The picker browses the offered `images` and always carries a
 * search field: the query streams out through `search`, and the consumer
 * answers with `results` (plus `searchLoading`/`searchError` while it works).
 * Apply commits the choice through `valueChange`; Cancel or Escape leaves it
 * untouched.
 *
 * The mural is ornament, not content: the picture renders with an empty alt
 * and the container owns the pane's width, height, and placement. `value` is
 * the whole picture, so a committed choice paints without living in `images`
 * or `results`; while it is null the pane stays an empty frame with the
 * settings control held visible, so a first pick is always reachable. A
 * picture that carries `attribution` credits it on the pane, revealed with the
 * settings control. When the displayed picture fails to load the pane returns
 * to the empty frame and emits `imageError`, so the consumer can swap in a
 * fallback.
 */
export class CxMuralComponent {
    host = inject(ElementRef);
    injector = inject(Injector);
    /** The offered catalog, browsed while the search field is empty. */
    images = [];
    /** Pictures answering the current `search` query. */
    results = [];
    /** True while the consumer is answering the current query. */
    searchLoading = false;
    /** Why the current query cannot be answered; '' while search works. */
    searchError = '';
    valueState = null;
    /** The picture on display; null keeps the pane an empty frame. */
    set value(value) {
        this.valueState = value;
        this.displayFailed.set(false);
    }
    get value() {
        return this.valueState;
    }
    /** Emits the picked picture when the user applies a different choice. */
    valueChange = new EventEmitter();
    /** Emits the picker's debounced search query, including '' when cleared. */
    search = new EventEmitter();
    /** Emits when the displayed picture fails to load; the pane falls back to the empty frame. */
    imageError = new EventEmitter();
    pickerOpen = signal(false, /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "pickerOpen" }] : /* istanbul ignore next */ []));
    pending = signal(null, /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "pending" }] : /* istanbul ignore next */ []));
    query = signal('', /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "query" }] : /* istanbul ignore next */ []));
    displayFailed = signal(false, /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "displayFailed" }] : /* istanbul ignore next */ []));
    get displayImage() {
        return this.displayFailed() ? null : this.valueState;
    }
    onOpenPicker() {
        this.pending.set(this.valueState);
        this.query.set('');
        this.pickerOpen.set(true);
        // The chosen thumbnail (or the first, or the search field when nothing is
        // offered) takes focus so keyboard users land inside the picker they just
        // opened.
        this.afterRender(() => {
            const selected = this.host.nativeElement.querySelector('.cx-mural__option[aria-pressed="true"]');
            const first = this.host.nativeElement.querySelector('.cx-mural__option');
            const field = this.host.nativeElement.querySelector('.cx-mural__search input');
            (selected ?? first ?? field)?.focus();
        });
    }
    onQueryChange(query) {
        if (query === this.query())
            return;
        this.query.set(query);
        this.search.emit(query);
    }
    onPick(option) {
        this.pending.set(option);
    }
    onApply() {
        const pending = this.pending();
        const changed = pending !== null && pending.id !== (this.valueState?.id ?? '');
        this.closePicker();
        if (changed) {
            this.valueChange.emit(pending);
        }
    }
    onCancel() {
        this.closePicker();
    }
    onEscape(event) {
        // A prevented Escape was claimed by the search field to clear itself; only
        // an unclaimed one closes the picker.
        if (event.defaultPrevented)
            return;
        this.onCancel();
    }
    onImageError() {
        this.displayFailed.set(true);
        this.imageError.emit();
    }
    closePicker() {
        this.pickerOpen.set(false);
        // Focus returns to the control that opened the picker.
        this.afterRender(() => {
            this.host.nativeElement
                .querySelector('.cx-mural__change button')
                ?.focus();
        });
    }
    afterRender(work) {
        afterNextRender(work, { injector: this.injector });
    }
    static ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "22.0.8", ngImport: i0, type: CxMuralComponent, deps: [], target: i0.ɵɵFactoryTarget.Component });
    static ɵcmp = i0.ɵɵngDeclareComponent({ minVersion: "17.0.0", version: "22.0.8", type: CxMuralComponent, isStandalone: true, selector: "cx-mural", inputs: { images: "images", results: "results", searchLoading: "searchLoading", searchError: "searchError", value: "value" }, outputs: { valueChange: "valueChange", search: "search", imageError: "imageError" }, ngImport: i0, template: "@if (pickerOpen()) {\n  <div class=\"cx-mural__picker\" role=\"group\" aria-label=\"Change image\" (keydown.escape)=\"onEscape($event)\">\n    <cx-search-field\n      class=\"cx-mural__search\"\n      label=\"\"\n      ariaLabel=\"Search\"\n      [clearable]=\"true\"\n      [value]=\"query()\"\n      (valueChange)=\"onQueryChange($event)\"\n    />\n    @let browsing = query().length === 0;\n    @if (!browsing && searchLoading) {\n      <div class=\"cx-mural__search-state\">\n        <cx-spinner size=\"small\" ariaLabel=\"Searching\" />\n      </div>\n    } @else if (!browsing && searchError) {\n      <p class=\"cx-mural__search-state cx-mural__search-state--error\" role=\"status\">{{ searchError }}</p>\n    } @else if (!browsing && results.length === 0) {\n      <p class=\"cx-mural__search-state\" role=\"status\">No matches</p>\n    } @else if ((browsing ? images : results).length > 0) {\n      <div class=\"cx-mural__options\">\n        @for (option of browsing ? images : results; track option.id) {\n          <button\n            class=\"cx-mural__option\"\n            type=\"button\"\n            [attr.aria-label]=\"option.label\"\n            [attr.aria-pressed]=\"pending()?.id === option.id\"\n            (click)=\"onPick(option)\"\n          >\n            <img class=\"cx-mural__thumb\" [src]=\"option.thumb || option.src\" alt=\"\" />\n            <span class=\"cx-mural__option-label\">{{ option.label }}</span>\n          </button>\n        }\n      </div>\n    }\n    <div class=\"cx-mural__picker-actions\">\n      <cx-button text=\"Cancel\" (pressed)=\"onCancel()\" />\n      <cx-button text=\"Apply\" mood=\"primary\" [disabled]=\"!pending()\" (pressed)=\"onApply()\" />\n    </div>\n  </div>\n} @else {\n  <div class=\"cx-mural__frame\" [class.cx-mural__frame--empty]=\"!displayImage\">\n    @if (displayImage; as image) {\n      <img class=\"cx-mural__image\" [src]=\"image.src\" alt=\"\" (error)=\"onImageError()\" />\n      @if (image.attribution; as credit) {\n        <p class=\"cx-mural__credit\">\n          @if (credit.href) {\n            <a class=\"cx-mural__credit-link\" [href]=\"credit.href\" target=\"_blank\" rel=\"noopener noreferrer\">{{ credit.name }}</a>\n          } @else {\n            <span>{{ credit.name }}</span>\n          }\n          @if (credit.source) {\n            <span aria-hidden=\"true\">\u00B7</span>\n            @if (credit.sourceHref) {\n              <a class=\"cx-mural__credit-link\" [href]=\"credit.sourceHref\" target=\"_blank\" rel=\"noopener noreferrer\">{{ credit.source }}</a>\n            } @else {\n              <span>{{ credit.source }}</span>\n            }\n          }\n        </p>\n      }\n    }\n    <cx-icon-button\n      class=\"cx-mural__change\"\n      icon=\"settings\"\n      variant=\"transparent\"\n      ariaLabel=\"Change image\"\n      (pressed)=\"onOpenPicker()\"\n    />\n  </div>\n}\n", styles: [":host{display:block;contain:size}.cx-mural__frame{position:relative;height:100%}.cx-mural__image{display:block;width:100%;height:100%;border-radius:var(--radius-lg);object-fit:cover}.cx-mural__frame--empty{border-radius:var(--radius-lg);background:var(--surface-alt)}.cx-mural__change{position:absolute;top:var(--space-sm);right:var(--space-sm);opacity:0;transition:opacity var(--motion-fast) var(--ease-out-in)}.cx-mural__frame:hover .cx-mural__change,.cx-mural__change:focus-within,.cx-mural__frame--empty .cx-mural__change{opacity:1}.cx-mural__credit{position:absolute;bottom:var(--space-sm);left:var(--space-sm);display:inline-flex;flex-wrap:wrap;gap:var(--space-2xs);align-items:baseline;box-sizing:border-box;max-width:calc(100% - 2*var(--space-sm));margin:0;color:var(--opacity-mid);font-size:var(--font-size-body-xs);line-height:var(--line-height-small);overflow-wrap:anywhere;opacity:0;transition:opacity var(--motion-fast) var(--ease-out-in)}.cx-mural__frame:hover .cx-mural__credit,.cx-mural__credit:focus-within{opacity:1}.cx-mural__credit-link{color:inherit;text-decoration:underline}@media(hover: none){.cx-mural__change,.cx-mural__credit{opacity:1}}.cx-mural__picker{display:flex;height:100%;flex-direction:column;gap:var(--space-md);box-sizing:border-box;padding:var(--space-md);border:var(--line);border-radius:var(--radius-lg);background:var(--surface)}.cx-mural__search{flex:none}.cx-mural__search-state{display:flex;flex:1 1 auto;min-height:0;align-items:center;justify-content:center;margin:0;color:var(--opacity-high);font-size:var(--font-size-body-sm);line-height:var(--line-height-small);text-align:center}.cx-mural__search-state--error{color:var(--danger)}.cx-mural__options{display:grid;grid-template-columns:repeat(auto-fill, minmax(96px, 1fr));flex:1 1 auto;min-height:0;align-content:start;gap:var(--space-sm);overflow:auto;padding:4px;margin:-4px}.cx-mural__option{display:flex;flex-direction:column;gap:var(--space-2xs);padding:0;border:0;background:rgba(0,0,0,0);color:var(--opacity-high);font:inherit;cursor:pointer}.cx-mural__option:focus-visible{outline:var(--outline-tab);outline-offset:var(--outline-tab-offset)}.cx-mural__thumb{display:block;width:100%;aspect-ratio:3/4;border-radius:var(--radius-md);object-fit:cover}.cx-mural__option[aria-pressed=true]{color:var(--ink)}.cx-mural__option[aria-pressed=true] .cx-mural__thumb{outline:2px solid var(--primary);outline-offset:2px}.cx-mural__option-label{font-size:var(--font-size-body-sm);line-height:var(--line-height-small)}.cx-mural__picker-actions{display:flex;justify-content:space-between;gap:var(--space-sm)}@media(prefers-reduced-motion: reduce){.cx-mural__change,.cx-mural__credit{transition:none}}"], dependencies: [{ kind: "component", type: CxButtonComponent, selector: "cx-button", inputs: ["text", "mood", "icon", "appendIcon", "shortcutParts", "href", "type", "size", "ariaLabel", "disabled", "transparent", "rounded", "loading"], outputs: ["pressed"] }, { kind: "component", type: CxIconButtonComponent, selector: "cx-icon-button", inputs: ["icon", "ariaLabel", "mood", "variant", "size", "selected", "ariaPressed", "rounded", "disabled", "badgeValue", "block", "loading", "countdown"], outputs: ["pressed", "countdownChange"] }, { kind: "component", type: CxSearchFieldComponent, selector: "cx-search-field", inputs: ["label", "ariaLabel", "hint", "optional", "disabled", "loading", "clearable", "size", "validation", "value"], outputs: ["valueChange", "focusChange"] }, { kind: "component", type: CxSpinnerComponent, selector: "cx-spinner", inputs: ["mood", "ariaLabel", "segments", "value", "size"] }], changeDetection: i0.ChangeDetectionStrategy.OnPush });
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "22.0.8", ngImport: i0, type: CxMuralComponent, decorators: [{
            type: Component,
            args: [{ selector: 'cx-mural', imports: [
                        CxButtonComponent,
                        CxIconButtonComponent,
                        CxSearchFieldComponent,
                        CxSpinnerComponent,
                    ], changeDetection: ChangeDetectionStrategy.OnPush, template: "@if (pickerOpen()) {\n  <div class=\"cx-mural__picker\" role=\"group\" aria-label=\"Change image\" (keydown.escape)=\"onEscape($event)\">\n    <cx-search-field\n      class=\"cx-mural__search\"\n      label=\"\"\n      ariaLabel=\"Search\"\n      [clearable]=\"true\"\n      [value]=\"query()\"\n      (valueChange)=\"onQueryChange($event)\"\n    />\n    @let browsing = query().length === 0;\n    @if (!browsing && searchLoading) {\n      <div class=\"cx-mural__search-state\">\n        <cx-spinner size=\"small\" ariaLabel=\"Searching\" />\n      </div>\n    } @else if (!browsing && searchError) {\n      <p class=\"cx-mural__search-state cx-mural__search-state--error\" role=\"status\">{{ searchError }}</p>\n    } @else if (!browsing && results.length === 0) {\n      <p class=\"cx-mural__search-state\" role=\"status\">No matches</p>\n    } @else if ((browsing ? images : results).length > 0) {\n      <div class=\"cx-mural__options\">\n        @for (option of browsing ? images : results; track option.id) {\n          <button\n            class=\"cx-mural__option\"\n            type=\"button\"\n            [attr.aria-label]=\"option.label\"\n            [attr.aria-pressed]=\"pending()?.id === option.id\"\n            (click)=\"onPick(option)\"\n          >\n            <img class=\"cx-mural__thumb\" [src]=\"option.thumb || option.src\" alt=\"\" />\n            <span class=\"cx-mural__option-label\">{{ option.label }}</span>\n          </button>\n        }\n      </div>\n    }\n    <div class=\"cx-mural__picker-actions\">\n      <cx-button text=\"Cancel\" (pressed)=\"onCancel()\" />\n      <cx-button text=\"Apply\" mood=\"primary\" [disabled]=\"!pending()\" (pressed)=\"onApply()\" />\n    </div>\n  </div>\n} @else {\n  <div class=\"cx-mural__frame\" [class.cx-mural__frame--empty]=\"!displayImage\">\n    @if (displayImage; as image) {\n      <img class=\"cx-mural__image\" [src]=\"image.src\" alt=\"\" (error)=\"onImageError()\" />\n      @if (image.attribution; as credit) {\n        <p class=\"cx-mural__credit\">\n          @if (credit.href) {\n            <a class=\"cx-mural__credit-link\" [href]=\"credit.href\" target=\"_blank\" rel=\"noopener noreferrer\">{{ credit.name }}</a>\n          } @else {\n            <span>{{ credit.name }}</span>\n          }\n          @if (credit.source) {\n            <span aria-hidden=\"true\">\u00B7</span>\n            @if (credit.sourceHref) {\n              <a class=\"cx-mural__credit-link\" [href]=\"credit.sourceHref\" target=\"_blank\" rel=\"noopener noreferrer\">{{ credit.source }}</a>\n            } @else {\n              <span>{{ credit.source }}</span>\n            }\n          }\n        </p>\n      }\n    }\n    <cx-icon-button\n      class=\"cx-mural__change\"\n      icon=\"settings\"\n      variant=\"transparent\"\n      ariaLabel=\"Change image\"\n      (pressed)=\"onOpenPicker()\"\n    />\n  </div>\n}\n", styles: [":host{display:block;contain:size}.cx-mural__frame{position:relative;height:100%}.cx-mural__image{display:block;width:100%;height:100%;border-radius:var(--radius-lg);object-fit:cover}.cx-mural__frame--empty{border-radius:var(--radius-lg);background:var(--surface-alt)}.cx-mural__change{position:absolute;top:var(--space-sm);right:var(--space-sm);opacity:0;transition:opacity var(--motion-fast) var(--ease-out-in)}.cx-mural__frame:hover .cx-mural__change,.cx-mural__change:focus-within,.cx-mural__frame--empty .cx-mural__change{opacity:1}.cx-mural__credit{position:absolute;bottom:var(--space-sm);left:var(--space-sm);display:inline-flex;flex-wrap:wrap;gap:var(--space-2xs);align-items:baseline;box-sizing:border-box;max-width:calc(100% - 2*var(--space-sm));margin:0;color:var(--opacity-mid);font-size:var(--font-size-body-xs);line-height:var(--line-height-small);overflow-wrap:anywhere;opacity:0;transition:opacity var(--motion-fast) var(--ease-out-in)}.cx-mural__frame:hover .cx-mural__credit,.cx-mural__credit:focus-within{opacity:1}.cx-mural__credit-link{color:inherit;text-decoration:underline}@media(hover: none){.cx-mural__change,.cx-mural__credit{opacity:1}}.cx-mural__picker{display:flex;height:100%;flex-direction:column;gap:var(--space-md);box-sizing:border-box;padding:var(--space-md);border:var(--line);border-radius:var(--radius-lg);background:var(--surface)}.cx-mural__search{flex:none}.cx-mural__search-state{display:flex;flex:1 1 auto;min-height:0;align-items:center;justify-content:center;margin:0;color:var(--opacity-high);font-size:var(--font-size-body-sm);line-height:var(--line-height-small);text-align:center}.cx-mural__search-state--error{color:var(--danger)}.cx-mural__options{display:grid;grid-template-columns:repeat(auto-fill, minmax(96px, 1fr));flex:1 1 auto;min-height:0;align-content:start;gap:var(--space-sm);overflow:auto;padding:4px;margin:-4px}.cx-mural__option{display:flex;flex-direction:column;gap:var(--space-2xs);padding:0;border:0;background:rgba(0,0,0,0);color:var(--opacity-high);font:inherit;cursor:pointer}.cx-mural__option:focus-visible{outline:var(--outline-tab);outline-offset:var(--outline-tab-offset)}.cx-mural__thumb{display:block;width:100%;aspect-ratio:3/4;border-radius:var(--radius-md);object-fit:cover}.cx-mural__option[aria-pressed=true]{color:var(--ink)}.cx-mural__option[aria-pressed=true] .cx-mural__thumb{outline:2px solid var(--primary);outline-offset:2px}.cx-mural__option-label{font-size:var(--font-size-body-sm);line-height:var(--line-height-small)}.cx-mural__picker-actions{display:flex;justify-content:space-between;gap:var(--space-sm)}@media(prefers-reduced-motion: reduce){.cx-mural__change,.cx-mural__credit{transition:none}}"] }]
        }], propDecorators: { images: [{
                type: Input
            }], results: [{
                type: Input
            }], searchLoading: [{
                type: Input
            }], searchError: [{
                type: Input
            }], value: [{
                type: Input
            }], valueChange: [{
                type: Output
            }], search: [{
                type: Output
            }], imageError: [{
                type: Output
            }] } });
