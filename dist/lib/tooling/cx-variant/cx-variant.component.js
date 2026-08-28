import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output, ViewChildren, computed, signal, } from '@angular/core';
import { CxTooltipDirective } from '../../primitives/overlay/cx-tooltip/index.js';
import * as i0 from "@angular/core";
let nextCxVariantId = 0;
export class CxVariantComponent {
    tabButtons;
    panelId = `cx-variant-panel-${nextCxVariantId++}`;
    variantsState = signal([], /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "variantsState" }] : /* istanbul ignore next */ []));
    selectedVariantState = signal('', /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "selectedVariantState" }] : /* istanbul ignore next */ []));
    set variants(value) {
        this.variantsState.set(value ?? []);
    }
    set selectedVariant(value) {
        this.selectedVariantState.set(value ?? '');
    }
    selectedVariantChange = new EventEmitter();
    variants$ = this.variantsState.asReadonly();
    selectedVariant$ = computed(() => {
        const selectedVariant = this.selectedVariantState();
        const variants = this.variantsState();
        if (variants.some(variant => variant.id === selectedVariant)) {
            return selectedVariant;
        }
        return variants[0]?.id ?? '';
    }, /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "selectedVariant$" }] : /* istanbul ignore next */ []));
    selectedVariantIndex$ = computed(() => this.variantsState().findIndex(variant => variant.id === this.selectedVariant$()), /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "selectedVariantIndex$" }] : /* istanbul ignore next */ []));
    selectedTabId$ = computed(() => {
        const index = this.selectedVariantIndex$();
        return index >= 0 ? this.tabId(index) : null;
    }, /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "selectedTabId$" }] : /* istanbul ignore next */ []));
    selectVariant(variantId) {
        if (this.selectedVariantState() === variantId) {
            return;
        }
        this.selectedVariantState.set(variantId);
        this.selectedVariantChange.emit(variantId);
    }
    tabId(index) {
        return `${this.panelId}-tab-${index}`;
    }
    onTabKeydown(event, index) {
        if (!['ArrowRight', 'ArrowLeft', 'ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) {
            return;
        }
        event.preventDefault();
        const maxIndex = this.variantsState().length - 1;
        if (maxIndex < 0) {
            return;
        }
        let nextIndex = index;
        if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
            nextIndex = index >= maxIndex ? 0 : index + 1;
        }
        else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
            nextIndex = index <= 0 ? maxIndex : index - 1;
        }
        else if (event.key === 'Home') {
            nextIndex = 0;
        }
        else if (event.key === 'End') {
            nextIndex = maxIndex;
        }
        const nextVariant = this.variantsState()[nextIndex];
        if (!nextVariant) {
            return;
        }
        this.selectVariant(nextVariant.id);
        this.tabButtons.get(nextIndex)?.nativeElement.focus();
    }
    static ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "22.0.8", ngImport: i0, type: CxVariantComponent, deps: [], target: i0.ɵɵFactoryTarget.Component });
    static ɵcmp = i0.ɵɵngDeclareComponent({ minVersion: "17.0.0", version: "22.0.8", type: CxVariantComponent, isStandalone: true, selector: "cx-variant", inputs: { variants: "variants", selectedVariant: "selectedVariant" }, outputs: { selectedVariantChange: "selectedVariantChange" }, viewQueries: [{ propertyName: "tabButtons", predicate: ["tabButton"], descendants: true }], ngImport: i0, template: "<section class=\"cx-variant\">\n  <div class=\"cx-variant__tabs\" role=\"tablist\" aria-label=\"Variants\">\n    @for (variant of variants$(); track variant.id; let index = $index) {\n      <button\n        #tabButton\n        type=\"button\"\n        class=\"cx-variant__tab\"\n        role=\"tab\"\n        [id]=\"tabId(index)\"\n        [class.cx-variant__tab--active]=\"variant.id === selectedVariant$()\"\n        [attr.aria-selected]=\"variant.id === selectedVariant$() ? 'true' : 'false'\"\n        [attr.aria-controls]=\"panelId\"\n        [attr.tabindex]=\"variant.id === selectedVariant$() ? '0' : '-1'\"\n        [cxTooltip]=\"variant.label\"\n        [cxTooltipOverflow]=\"true\"\n        (click)=\"selectVariant(variant.id)\"\n        (keydown)=\"onTabKeydown($event, index)\"\n      >\n        <span class=\"cx-variant__tab-label\" data-cx-tooltip-overflow>{{ variant.label }}</span>\n      </button>\n    }\n  </div>\n\n  <div class=\"cx-variant__preview\" role=\"tabpanel\" [id]=\"panelId\" [attr.aria-labelledby]=\"selectedTabId$()\">\n    <div class=\"cx-variant__specimen\">\n      <ng-content select=\"[cxVariantPreview]\" />\n    </div>\n  </div>\n</section>\n", styles: [":host {\n  display: block;\n  min-width: 0;\n  max-width: 100%;\n  container-type: inline-size;\n}\n\n:host(.cx-workbench--hidden) {\n  display: none;\n}\n\n.cx-variant {\n  display: grid;\n  width: 100%;\n  min-width: 0;\n  max-width: 100%;\n  grid-template-rows: auto minmax(0, 1fr);\n  min-height: calc(var(--controller-size) * 10);\n  overflow: hidden;\n  border: var(--line);\n  border-radius: var(--radius-xl);\n  background: var(--surface);\n}\n\n.cx-variant__tabs {\n  display: flex;\n  width: 100%;\n  min-width: 0;\n  max-width: 100%;\n  overflow-x: auto;\n  border-bottom: var(--line);\n  background: var(--opacity-low);\n}\n\n.cx-variant__tab {\n  position: relative;\n  display: inline-flex;\n  min-height: 40px;\n  min-width: 0;\n  max-width: 100%;\n  flex: 1 1 0;\n  align-items: center;\n  justify-content: center;\n  overflow: hidden;\n  padding: 0 var(--space-md);\n  border: 0;\n  background: transparent;\n  color: var(--opacity-high);\n  cursor: pointer;\n  font: inherit;\n  font-size: var(--font-size-body);\n  font-weight: var(--font-weight-medium);\n  letter-spacing: 0;\n  line-height: var(--line-height-body);\n  white-space: nowrap;\n}\n\n.cx-variant__tab-label {\n  min-width: 0;\n  max-width: 100%;\n  overflow: hidden;\n  text-overflow: ellipsis;\n  white-space: nowrap;\n}\n\n.cx-variant__tab::after {\n  content: '';\n  position: absolute;\n  right: 0;\n  bottom: 0;\n  left: 0;\n  height: 2px;\n  background: transparent;\n}\n\n.cx-variant__tab:is(:hover, :focus-visible),\n.cx-variant__tab--active {\n  color: var(--ink);\n}\n\n.cx-variant__tab:focus-visible {\n  z-index: 1;\n  outline: var(--outline-tab);\n  outline-offset: var(--outline-tab-offset);\n}\n\n.cx-variant__tab:active {\n  outline: var(--outline-active);\n  outline-offset: var(--outline-active-offset);\n}\n\n.cx-variant__tab--active::after {\n  background: var(--ink);\n}\n\n.cx-variant__preview {\n  display: flex;\n  min-width: 0;\n  min-height: calc(var(--controller-size) * 10);\n  align-items: center;\n  justify-content: center;\n  overflow: auto;\n  padding: var(--space-xl);\n  background: var(--surface);\n  box-sizing: border-box;\n}\n\n.cx-variant__specimen {\n  display: flex;\n  width: 100%;\n  min-width: 0;\n  min-height: 100%;\n  align-items: center;\n  justify-content: center;\n}\n\n@container (max-width: 420px) {\n  .cx-variant__preview {\n    min-height: calc(var(--controller-size) * 8);\n    padding: var(--space-lg);\n  }\n}\n"], dependencies: [{ kind: "directive", type: CxTooltipDirective, selector: "[cxTooltip]", inputs: ["cxTooltip", "cxTooltipPosition", "cxTooltipDelay", "cxTooltipDisabled", "cxTooltipOverflow"] }], changeDetection: i0.ChangeDetectionStrategy.OnPush });
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "22.0.8", ngImport: i0, type: CxVariantComponent, decorators: [{
            type: Component,
            args: [{ selector: 'cx-variant', imports: [CxTooltipDirective], changeDetection: ChangeDetectionStrategy.OnPush, template: "<section class=\"cx-variant\">\n  <div class=\"cx-variant__tabs\" role=\"tablist\" aria-label=\"Variants\">\n    @for (variant of variants$(); track variant.id; let index = $index) {\n      <button\n        #tabButton\n        type=\"button\"\n        class=\"cx-variant__tab\"\n        role=\"tab\"\n        [id]=\"tabId(index)\"\n        [class.cx-variant__tab--active]=\"variant.id === selectedVariant$()\"\n        [attr.aria-selected]=\"variant.id === selectedVariant$() ? 'true' : 'false'\"\n        [attr.aria-controls]=\"panelId\"\n        [attr.tabindex]=\"variant.id === selectedVariant$() ? '0' : '-1'\"\n        [cxTooltip]=\"variant.label\"\n        [cxTooltipOverflow]=\"true\"\n        (click)=\"selectVariant(variant.id)\"\n        (keydown)=\"onTabKeydown($event, index)\"\n      >\n        <span class=\"cx-variant__tab-label\" data-cx-tooltip-overflow>{{ variant.label }}</span>\n      </button>\n    }\n  </div>\n\n  <div class=\"cx-variant__preview\" role=\"tabpanel\" [id]=\"panelId\" [attr.aria-labelledby]=\"selectedTabId$()\">\n    <div class=\"cx-variant__specimen\">\n      <ng-content select=\"[cxVariantPreview]\" />\n    </div>\n  </div>\n</section>\n", styles: [":host {\n  display: block;\n  min-width: 0;\n  max-width: 100%;\n  container-type: inline-size;\n}\n\n:host(.cx-workbench--hidden) {\n  display: none;\n}\n\n.cx-variant {\n  display: grid;\n  width: 100%;\n  min-width: 0;\n  max-width: 100%;\n  grid-template-rows: auto minmax(0, 1fr);\n  min-height: calc(var(--controller-size) * 10);\n  overflow: hidden;\n  border: var(--line);\n  border-radius: var(--radius-xl);\n  background: var(--surface);\n}\n\n.cx-variant__tabs {\n  display: flex;\n  width: 100%;\n  min-width: 0;\n  max-width: 100%;\n  overflow-x: auto;\n  border-bottom: var(--line);\n  background: var(--opacity-low);\n}\n\n.cx-variant__tab {\n  position: relative;\n  display: inline-flex;\n  min-height: 40px;\n  min-width: 0;\n  max-width: 100%;\n  flex: 1 1 0;\n  align-items: center;\n  justify-content: center;\n  overflow: hidden;\n  padding: 0 var(--space-md);\n  border: 0;\n  background: transparent;\n  color: var(--opacity-high);\n  cursor: pointer;\n  font: inherit;\n  font-size: var(--font-size-body);\n  font-weight: var(--font-weight-medium);\n  letter-spacing: 0;\n  line-height: var(--line-height-body);\n  white-space: nowrap;\n}\n\n.cx-variant__tab-label {\n  min-width: 0;\n  max-width: 100%;\n  overflow: hidden;\n  text-overflow: ellipsis;\n  white-space: nowrap;\n}\n\n.cx-variant__tab::after {\n  content: '';\n  position: absolute;\n  right: 0;\n  bottom: 0;\n  left: 0;\n  height: 2px;\n  background: transparent;\n}\n\n.cx-variant__tab:is(:hover, :focus-visible),\n.cx-variant__tab--active {\n  color: var(--ink);\n}\n\n.cx-variant__tab:focus-visible {\n  z-index: 1;\n  outline: var(--outline-tab);\n  outline-offset: var(--outline-tab-offset);\n}\n\n.cx-variant__tab:active {\n  outline: var(--outline-active);\n  outline-offset: var(--outline-active-offset);\n}\n\n.cx-variant__tab--active::after {\n  background: var(--ink);\n}\n\n.cx-variant__preview {\n  display: flex;\n  min-width: 0;\n  min-height: calc(var(--controller-size) * 10);\n  align-items: center;\n  justify-content: center;\n  overflow: auto;\n  padding: var(--space-xl);\n  background: var(--surface);\n  box-sizing: border-box;\n}\n\n.cx-variant__specimen {\n  display: flex;\n  width: 100%;\n  min-width: 0;\n  min-height: 100%;\n  align-items: center;\n  justify-content: center;\n}\n\n@container (max-width: 420px) {\n  .cx-variant__preview {\n    min-height: calc(var(--controller-size) * 8);\n    padding: var(--space-lg);\n  }\n}\n"] }]
        }], propDecorators: { tabButtons: [{
                type: ViewChildren,
                args: ['tabButton']
            }], variants: [{
                type: Input
            }], selectedVariant: [{
                type: Input
            }], selectedVariantChange: [{
                type: Output
            }] } });
