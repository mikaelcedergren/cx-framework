import { A11yModule } from "@angular/cdk/a11y";
import { DOCUMENT } from "@angular/common";
import { ChangeDetectionStrategy, Component, ElementRef, EventEmitter, Input, Output, ViewChild, afterEveryRender, computed, inject, signal, } from "@angular/core";
import { CxTextFieldComponent } from "../../primitives/inputs/cx-text-field/index.js";
import { CxOptionComponent } from "../../primitives/overlay/cx-option/index.js";
import { CxShortcutKeyComponent } from "../../primitives/display/cx-shortcut-key/index.js";
import { CxOverlayStateService, } from "../../primitives/overlay/overlay-state.js";
import { isHostVisible } from "../../primitives/shared/host-visibility.js";
import { filterLauncherItems, validateLauncherItems, } from "./launcher-items.js";
import * as i0 from "@angular/core";
import * as i1 from "@angular/cdk/a11y";
let nextLauncherId = 0;
export class CxLauncherComponent {
    document = inject(DOCUMENT);
    overlayState = inject(CxOverlayStateService);
    itemsState = signal([], /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "itemsState" }] : /* istanbul ignore next */ []));
    openState = signal(false, /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "openState" }] : /* istanbul ignore next */ []));
    queryState = signal("", /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "queryState" }] : /* istanbul ignore next */ []));
    activeIdState = signal(undefined, /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "activeIdState" }] : /* istanbul ignore next */ []));
    overlayHandle;
    focusPending = false;
    scrollPending = false;
    pointerPosition;
    focusListener = () => this.keepFocusInside();
    root;
    results;
    search;
    listId = `cx-launcher-${++nextLauncherId}-items`;
    open$ = this.openState.asReadonly();
    query$ = this.queryState.asReadonly();
    results$ = computed(() => filterLauncherItems(this.itemsState(), this.queryState()), /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "results$" }] : /* istanbul ignore next */ []));
    activeItem$ = computed(() => {
        const items = this.results$();
        return (items.find((item) => item.id === this.activeIdState() && !item.disabled) ?? items.find((item) => !item.disabled));
    }, /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "activeItem$" }] : /* istanbul ignore next */ []));
    activeControlId$ = computed(() => {
        const item = this.activeItem$();
        return item ? this.optionId(this.results$().indexOf(item)) : undefined;
    }, /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "activeControlId$" }] : /* istanbul ignore next */ []));
    empty$ = computed(() => this.itemsState().length === 0, /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "empty$" }] : /* istanbul ignore next */ []));
    trapsFocus = signal(false, /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "trapsFocus" }] : /* istanbul ignore next */ []));
    constructor() {
        afterEveryRender(() => {
            const ownsFocus = this.openState() && this.overlayState.isTopmost(this.overlayHandle);
            this.trapsFocus.set(ownsFocus);
            if (!ownsFocus)
                return;
            if (this.focusPending) {
                this.focusPending = false;
                this.search?.focus();
            }
            if (this.scrollPending) {
                this.scrollPending = false;
                const activeId = this.activeControlId$();
                const active = activeId ? this.document.getElementById(activeId) : null;
                const list = this.results?.nativeElement;
                if (active && list) {
                    const itemRect = active.getBoundingClientRect();
                    const listRect = list.getBoundingClientRect();
                    const style = this.document.defaultView?.getComputedStyle(list);
                    const top = listRect.top + Number.parseFloat(style?.paddingTop ?? "0");
                    const bottom = listRect.bottom - Number.parseFloat(style?.paddingBottom ?? "0");
                    if (itemRect.top < top)
                        list.scrollTop -= top - itemRect.top;
                    else if (itemRect.bottom > bottom)
                        list.scrollTop += itemRect.bottom - bottom;
                }
            }
        });
    }
    set items(value) {
        validateLauncherItems(value);
        this.itemsState.set(value);
        this.scrollPending = true;
    }
    set open(value) {
        if (this.openState() === value)
            return;
        if (value) {
            this.queryState.set("");
            this.activeIdState.set(undefined);
            this.pointerPosition = undefined;
            this.focusPending = true;
            this.scrollPending = true;
            this.openState.set(true);
            this.overlayHandle = this.overlayState.capture({
                surface: () => this.root?.nativeElement,
                isActive: () => this.openState() && isHostVisible(this.root?.nativeElement),
                onEscape: () => this.dismiss(),
            });
            this.document.addEventListener("focusin", this.focusListener);
        }
        else {
            this.document.removeEventListener("focusin", this.focusListener);
            this.overlayState.release(this.overlayHandle);
            this.overlayHandle = undefined;
            this.openState.set(false);
        }
    }
    openChange = new EventEmitter();
    select = new EventEmitter();
    ngOnDestroy() {
        this.document.removeEventListener("focusin", this.focusListener);
        this.overlayState.release(this.overlayHandle);
    }
    optionId(index) {
        return `${this.listId}-${index}`;
    }
    onQuery(value) {
        this.queryState.set(value);
        this.activeIdState.set(undefined);
        this.scrollPending = true;
        if (this.results)
            this.results.nativeElement.scrollTop = 0;
    }
    onPointer(event, item) {
        // A keyboard scroll under a stationary pointer must not change the active row.
        const position = `${event.clientX}:${event.clientY}`;
        if (position === this.pointerPosition)
            return;
        this.pointerPosition = position;
        if (!item.disabled)
            this.activeIdState.set(item.id);
    }
    onKeydown(event) {
        if (event.isComposing ||
            event.altKey ||
            event.ctrlKey ||
            event.metaKey ||
            !this.overlayState.isTopmost(this.overlayHandle))
            return;
        if (event.key === "Enter") {
            event.preventDefault();
            event.stopPropagation();
            const item = this.activeItem$();
            if (item)
                this.activate(item);
            return;
        }
        if (event.key !== "ArrowDown" && event.key !== "ArrowUp")
            return;
        event.preventDefault();
        event.stopPropagation();
        const items = this.results$().filter((item) => !item.disabled);
        if (!items.length)
            return;
        const current = items.findIndex((item) => item.id === this.activeItem$()?.id);
        const step = event.key === "ArrowDown" ? 1 : -1;
        this.activeIdState.set(items[(current + step + items.length) % items.length].id);
        this.scrollPending = true;
    }
    activate(item) {
        if (item.disabled ||
            !this.openState() ||
            !this.overlayState.isTopmost(this.overlayHandle))
            return;
        this.dismiss();
        this.select.emit(item.id);
    }
    dismiss() {
        this.open = false;
        this.openChange.emit(false);
    }
    onBackdrop(event) {
        if (event.target === event.currentTarget &&
            this.overlayState.isTopmost(this.overlayHandle))
            this.dismiss();
    }
    keepFocusInside() {
        if (this.openState() &&
            this.overlayState.isTopmost(this.overlayHandle) &&
            !this.root?.nativeElement.contains(this.document.activeElement))
            this.search?.focus();
    }
    static ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "22.0.8", ngImport: i0, type: CxLauncherComponent, deps: [], target: i0.ɵɵFactoryTarget.Component });
    static ɵcmp = i0.ɵɵngDeclareComponent({ minVersion: "17.0.0", version: "22.0.8", type: CxLauncherComponent, isStandalone: true, selector: "cx-launcher", inputs: { items: "items", open: "open" }, outputs: { openChange: "openChange", select: "select" }, viewQueries: [{ propertyName: "root", first: true, predicate: ["root"], descendants: true, read: ElementRef }, { propertyName: "results", first: true, predicate: ["results"], descendants: true, read: ElementRef }, { propertyName: "search", first: true, predicate: CxTextFieldComponent, descendants: true }], ngImport: i0, template: "@if (open$()) {\n  <div\n    #root\n    class=\"cx-launcher\"\n    role=\"dialog\"\n    aria-modal=\"true\"\n    aria-label=\"Launcher\"\n    [cdkTrapFocus]=\"trapsFocus()\"\n    (click)=\"onBackdrop($event)\"\n    (keydown)=\"onKeydown($event)\"\n  >\n    <div class=\"cx-launcher__surface\">\n      <cx-text-field\n        class=\"cx-launcher__search\"\n        label=\"\"\n        ariaLabel=\"Search items\"\n        autocomplete=\"off\"\n        prependIcon=\"search\"\n        size=\"large\"\n        [value]=\"query$()\"\n        [combobox]=\"{\n          controls: listId,\n          expanded: results$().length > 0,\n          activeDescendant: activeControlId$(),\n        }\"\n        (valueChange)=\"onQuery($event)\"\n      >\n        @if (activeItem$()) {\n          <span cxTrailing class=\"cx-launcher__shortcut\" aria-hidden=\"true\">\n            <cx-shortcut-key [parts]=\"['Enter']\" />\n          </span>\n        }\n      </cx-text-field>\n      <div class=\"cx-launcher__results-frame\">\n        <div\n          #results\n          class=\"cx-launcher__results\"\n          role=\"listbox\"\n          [id]=\"listId\"\n          aria-label=\"Launcher\"\n        >\n          @for (item of results$(); track item.id; let index = $index) {\n            <cx-option\n              [role]=\"'option'\"\n              [controlId]=\"optionId(index)\"\n              [tabIndex]=\"-1\"\n              [label]=\"item.label\"\n              [description]=\"item.type\"\n              descriptionAlign=\"end\"\n              size=\"large\"\n              [prependIcon]=\"item.icon\"\n              [tooltip]=\"item.label + ' \u2014 ' + item.type\"\n              [disabled]=\"item.disabled ?? false\"\n              [active]=\"activeItem$()?.id === item.id\"\n              [selected]=\"activeItem$()?.id === item.id\"\n              [selectedHighlight]=\"false\"\n              [ariaPosInSet]=\"index + 1\"\n              [ariaSetSize]=\"results$().length\"\n              (pointermove)=\"onPointer($event, item)\"\n              (pointerdown)=\"$event.preventDefault()\"\n              (click)=\"activate(item)\"\n            />\n          }\n        </div>\n        @if (!results$().length) {\n          <div class=\"cx-launcher__empty\" role=\"status\">\n            <span>{{\n              empty$() ? \"No items available\" : \"No matching items\"\n            }}</span>\n            @if (!empty$()) {\n              <span class=\"cx-launcher__support\"\n                >Try another name or keyword.</span\n              >\n            }\n          </div>\n        }\n      </div>\n    </div>\n  </div>\n}\n", styles: [":host{display:contents}.cx-launcher{position:fixed;inset:0;z-index:var(--z-index-dialog);display:flex;align-items:flex-start;justify-content:center;box-sizing:border-box;padding:min(12dvh,96px) var(--space-md) var(--space-md);background:var(--overlay-backdrop);backdrop-filter:blur(var(--frost-softness));overscroll-behavior:contain}.cx-launcher__surface{display:flex;flex-direction:column;width:680px;max-width:100%;max-height:100%;min-height:0;gap:var(--space-sm)}:host ::ng-deep .cx-launcher__search .cx-text-field__field-shell{background:var(--surface)}.cx-launcher__results-frame{display:flex;min-height:0;flex-direction:column;overflow:hidden;border:var(--floating-surface-border);border-radius:calc(var(--radius-sm) + var(--space-xs) + var(--surface-separation));background:var(--surface-alt);box-shadow:var(--shadow-mid);padding:var(--surface-separation)}.cx-launcher__results{min-height:0;overflow:auto;overscroll-behavior:contain;border-radius:calc(var(--radius-sm) + var(--space-xs));background:var(--surface);padding:var(--space-xs)}.cx-launcher__results:empty{display:none}.cx-launcher__shortcut{display:inline-flex;flex:0 0 auto;align-items:center;gap:var(--space-xs);color:var(--ink-muted);font-size:var(--font-size-body-sm)}.cx-launcher__empty{display:flex;flex-direction:column;gap:var(--space-xs);padding:var(--space-lg);border-radius:calc(var(--radius-sm) + var(--space-xs));background:var(--surface);color:var(--ink);font-size:var(--font-size-body)}.cx-launcher__support{color:var(--ink-muted);font-size:var(--font-size-body-sm)}"], dependencies: [{ kind: "ngmodule", type: A11yModule }, { kind: "directive", type: i1.CdkTrapFocus, selector: "[cdkTrapFocus]", inputs: ["cdkTrapFocus", "cdkTrapFocusAutoCapture"], exportAs: ["cdkTrapFocus"] }, { kind: "component", type: CxTextFieldComponent, selector: "cx-text-field", inputs: ["label", "ariaLabel", "placeholder", "name", "autocomplete", "inlineEdit", "optional", "disabled", "size", "loading", "clearable", "prependIcon", "appendIcon", "prependText", "appendText", "hint", "combobox", "validation", "value"], outputs: ["valueChange", "focusChange", "clear"] }, { kind: "component", type: CxOptionComponent, selector: "cx-option", inputs: ["label", "description", "descriptionAlign", "size", "tooltip", "prependIcon", "appendIcon", "shortcutParts", "submenu", "mood", "active", "selected", "selectedHighlight", "showCheckbox", "clickable", "disabled", "role", "controlId", "tabIndex", "ariaPosInSet", "ariaSetSize"] }, { kind: "component", type: CxShortcutKeyComponent, selector: "cx-shortcut-key", inputs: ["parts"] }], changeDetection: i0.ChangeDetectionStrategy.OnPush });
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "22.0.8", ngImport: i0, type: CxLauncherComponent, decorators: [{
            type: Component,
            args: [{ selector: "cx-launcher", imports: [
                        A11yModule,
                        CxTextFieldComponent,
                        CxOptionComponent,
                        CxShortcutKeyComponent,
                    ], changeDetection: ChangeDetectionStrategy.OnPush, template: "@if (open$()) {\n  <div\n    #root\n    class=\"cx-launcher\"\n    role=\"dialog\"\n    aria-modal=\"true\"\n    aria-label=\"Launcher\"\n    [cdkTrapFocus]=\"trapsFocus()\"\n    (click)=\"onBackdrop($event)\"\n    (keydown)=\"onKeydown($event)\"\n  >\n    <div class=\"cx-launcher__surface\">\n      <cx-text-field\n        class=\"cx-launcher__search\"\n        label=\"\"\n        ariaLabel=\"Search items\"\n        autocomplete=\"off\"\n        prependIcon=\"search\"\n        size=\"large\"\n        [value]=\"query$()\"\n        [combobox]=\"{\n          controls: listId,\n          expanded: results$().length > 0,\n          activeDescendant: activeControlId$(),\n        }\"\n        (valueChange)=\"onQuery($event)\"\n      >\n        @if (activeItem$()) {\n          <span cxTrailing class=\"cx-launcher__shortcut\" aria-hidden=\"true\">\n            <cx-shortcut-key [parts]=\"['Enter']\" />\n          </span>\n        }\n      </cx-text-field>\n      <div class=\"cx-launcher__results-frame\">\n        <div\n          #results\n          class=\"cx-launcher__results\"\n          role=\"listbox\"\n          [id]=\"listId\"\n          aria-label=\"Launcher\"\n        >\n          @for (item of results$(); track item.id; let index = $index) {\n            <cx-option\n              [role]=\"'option'\"\n              [controlId]=\"optionId(index)\"\n              [tabIndex]=\"-1\"\n              [label]=\"item.label\"\n              [description]=\"item.type\"\n              descriptionAlign=\"end\"\n              size=\"large\"\n              [prependIcon]=\"item.icon\"\n              [tooltip]=\"item.label + ' \u2014 ' + item.type\"\n              [disabled]=\"item.disabled ?? false\"\n              [active]=\"activeItem$()?.id === item.id\"\n              [selected]=\"activeItem$()?.id === item.id\"\n              [selectedHighlight]=\"false\"\n              [ariaPosInSet]=\"index + 1\"\n              [ariaSetSize]=\"results$().length\"\n              (pointermove)=\"onPointer($event, item)\"\n              (pointerdown)=\"$event.preventDefault()\"\n              (click)=\"activate(item)\"\n            />\n          }\n        </div>\n        @if (!results$().length) {\n          <div class=\"cx-launcher__empty\" role=\"status\">\n            <span>{{\n              empty$() ? \"No items available\" : \"No matching items\"\n            }}</span>\n            @if (!empty$()) {\n              <span class=\"cx-launcher__support\"\n                >Try another name or keyword.</span\n              >\n            }\n          </div>\n        }\n      </div>\n    </div>\n  </div>\n}\n", styles: [":host{display:contents}.cx-launcher{position:fixed;inset:0;z-index:var(--z-index-dialog);display:flex;align-items:flex-start;justify-content:center;box-sizing:border-box;padding:min(12dvh,96px) var(--space-md) var(--space-md);background:var(--overlay-backdrop);backdrop-filter:blur(var(--frost-softness));overscroll-behavior:contain}.cx-launcher__surface{display:flex;flex-direction:column;width:680px;max-width:100%;max-height:100%;min-height:0;gap:var(--space-sm)}:host ::ng-deep .cx-launcher__search .cx-text-field__field-shell{background:var(--surface)}.cx-launcher__results-frame{display:flex;min-height:0;flex-direction:column;overflow:hidden;border:var(--floating-surface-border);border-radius:calc(var(--radius-sm) + var(--space-xs) + var(--surface-separation));background:var(--surface-alt);box-shadow:var(--shadow-mid);padding:var(--surface-separation)}.cx-launcher__results{min-height:0;overflow:auto;overscroll-behavior:contain;border-radius:calc(var(--radius-sm) + var(--space-xs));background:var(--surface);padding:var(--space-xs)}.cx-launcher__results:empty{display:none}.cx-launcher__shortcut{display:inline-flex;flex:0 0 auto;align-items:center;gap:var(--space-xs);color:var(--ink-muted);font-size:var(--font-size-body-sm)}.cx-launcher__empty{display:flex;flex-direction:column;gap:var(--space-xs);padding:var(--space-lg);border-radius:calc(var(--radius-sm) + var(--space-xs));background:var(--surface);color:var(--ink);font-size:var(--font-size-body)}.cx-launcher__support{color:var(--ink-muted);font-size:var(--font-size-body-sm)}"] }]
        }], ctorParameters: () => [], propDecorators: { root: [{
                type: ViewChild,
                args: ["root", { read: ElementRef }]
            }], results: [{
                type: ViewChild,
                args: ["results", { read: ElementRef }]
            }], search: [{
                type: ViewChild,
                args: [CxTextFieldComponent]
            }], items: [{
                type: Input
            }], open: [{
                type: Input
            }], openChange: [{
                type: Output
            }], select: [{
                type: Output
            }] } });
