import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output, computed, signal } from '@angular/core';
import { CxButtonComponent } from '../../primitives/actions/cx-button/index.js';
import * as i0 from "@angular/core";
export class CxActionBarComponent {
    data$ = signal(undefined, /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "data$" }] : /* istanbul ignore next */ []));
    set data(value) {
        if (value == null) {
            this.data$.set(undefined);
            return;
        }
        if (!Number.isInteger(value.count) || value.count <= 0) {
            throw new Error('[cx-action-bar] data.count must be a positive integer when data is supplied.');
        }
        if (!Array.isArray(value.menu)) {
            throw new Error('[cx-action-bar] data.menu must be an array.');
        }
        const actionIds = new Set();
        for (const group of value.menu) {
            if (!Array.isArray(group.items)) {
                throw new Error('[cx-action-bar] every group requires an items array.');
            }
            for (const item of group.items) {
                const id = item.id?.trim();
                if (!id) {
                    throw new Error('[cx-action-bar] every action requires a non-empty id.');
                }
                if (actionIds.has(id)) {
                    throw new Error(`[cx-action-bar] action ids must be unique; received "${id}" more than once.`);
                }
                actionIds.add(id);
            }
        }
        this.data$.set(value);
    }
    deselectAll = new EventEmitter();
    action = new EventEmitter();
    visibleGroups$ = computed(() => {
        return this.data$()?.menu.filter((group) => group.items.length > 0) ?? [];
    }, /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "visibleGroups$" }] : /* istanbul ignore next */ []));
    get countLabel() {
        const count = this.data$()?.count ?? 0;
        return count === 1 ? '1 item selected' : `${count} items selected`;
    }
    trackGroup(index, group) {
        return group.id ?? String(index);
    }
    actionText(item) {
        return item.priority === 'primary' || !item.icon ? item.name?.trim() ?? '' : '';
    }
    actionAriaLabel(item) {
        return item.name?.trim() || item.id.trim();
    }
    actionTransparent(item) {
        return item.transparent ?? true;
    }
    actionMood(item) {
        return item.mood ?? 'default';
    }
    onAction(item) {
        if (item.disabled) {
            return;
        }
        this.action.emit(item.id);
    }
    static ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "22.0.8", ngImport: i0, type: CxActionBarComponent, deps: [], target: i0.ɵɵFactoryTarget.Component });
    static ɵcmp = i0.ɵɵngDeclareComponent({ minVersion: "17.0.0", version: "22.0.8", type: CxActionBarComponent, isStandalone: true, selector: "cx-action-bar", inputs: { data: "data" }, outputs: { deselectAll: "deselectAll", action: "action" }, ngImport: i0, template: "@if (data$()) {\n  <div class=\"cx-action-bar__overlay\">\n    <div class=\"cx-action-bar__container\">\n      <div class=\"cx-action-bar\" role=\"toolbar\" aria-label=\"Selection actions\">\n        <div class=\"cx-action-bar__info\">\n          <span class=\"cx-action-bar__count\">{{ countLabel }}</span>\n          <cx-button\n            text=\"Deselect all\"\n            [transparent]=\"true\"\n            (pressed)=\"deselectAll.emit()\"\n          />\n        </div>\n\n        <div class=\"cx-action-bar__actions\">\n          @for (group of visibleGroups$(); track trackGroup($index, group)) {\n            <div class=\"cx-action-bar__group\">\n              @for (item of group.items; track item.id) {\n                <cx-button\n                  [text]=\"actionText(item)\"\n                  [icon]=\"item.icon\"\n                  [transparent]=\"actionTransparent(item)\"\n                  [mood]=\"actionMood(item)\"\n                  [ariaLabel]=\"actionAriaLabel(item)\"\n                  [disabled]=\"item.disabled === true\"\n                  (pressed)=\"onAction(item)\"\n                />\n              }\n            </div>\n          } @empty {\n            <span class=\"cx-action-bar__empty\">No actions</span>\n          }\n        </div>\n      </div>\n    </div>\n  </div>\n}\n", styles: [":host{display:block}.cx-action-bar__overlay{position:fixed;right:0;bottom:0;left:0;z-index:var(--z-index-detail);display:flex;width:auto;justify-content:center;overflow:hidden;padding-bottom:var(--space-xl);pointer-events:none}.cx-action-bar__container{display:flex;align-items:center;justify-content:center;animation:cx-action-bar-fade-in var(--motion-slow) var(--ease-out) forwards;opacity:0;pointer-events:auto;transform:translateY(calc(var(--space-xl) + var(--space-md)))}.cx-action-bar{display:flex;align-items:center;flex-direction:row;gap:var(--space-xl);padding:var(--space-sm);border:var(--line-discreet);border-radius:var(--radius-md);background:var(--surface);box-shadow:var(--shadow-mid)}.cx-action-bar__info,.cx-action-bar__actions,.cx-action-bar__group{display:flex;align-items:center}.cx-action-bar__info{min-width:0;gap:var(--space-sm)}.cx-action-bar__count{color:var(--opacity-high);font-size:var(--font-size-body);font-weight:var(--font-weight-regular);line-height:var(--line-height-body);white-space:nowrap}.cx-action-bar__actions{gap:var(--space-md)}.cx-action-bar__group{gap:var(--space-xs)}.cx-action-bar__empty{color:var(--opacity-high);font-size:var(--font-size-body);font-weight:var(--font-weight-regular);line-height:var(--line-height-body)}@keyframes cx-action-bar-fade-in{from{opacity:0;transform:translateY(calc(var(--space-xl) + var(--space-md)))}to{opacity:1;transform:translateY(0)}}@media(max-width: 640px){.cx-action-bar{align-items:stretch;flex-direction:column;gap:var(--space-sm)}.cx-action-bar__actions{justify-content:flex-start}}"], dependencies: [{ kind: "component", type: CxButtonComponent, selector: "cx-button", inputs: ["text", "mood", "icon", "appendIcon", "shortcutParts", "href", "type", "size", "ariaLabel", "disabled", "transparent", "rounded", "loading"], outputs: ["pressed"] }], changeDetection: i0.ChangeDetectionStrategy.OnPush });
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "22.0.8", ngImport: i0, type: CxActionBarComponent, decorators: [{
            type: Component,
            args: [{ selector: 'cx-action-bar', imports: [CxButtonComponent], changeDetection: ChangeDetectionStrategy.OnPush, template: "@if (data$()) {\n  <div class=\"cx-action-bar__overlay\">\n    <div class=\"cx-action-bar__container\">\n      <div class=\"cx-action-bar\" role=\"toolbar\" aria-label=\"Selection actions\">\n        <div class=\"cx-action-bar__info\">\n          <span class=\"cx-action-bar__count\">{{ countLabel }}</span>\n          <cx-button\n            text=\"Deselect all\"\n            [transparent]=\"true\"\n            (pressed)=\"deselectAll.emit()\"\n          />\n        </div>\n\n        <div class=\"cx-action-bar__actions\">\n          @for (group of visibleGroups$(); track trackGroup($index, group)) {\n            <div class=\"cx-action-bar__group\">\n              @for (item of group.items; track item.id) {\n                <cx-button\n                  [text]=\"actionText(item)\"\n                  [icon]=\"item.icon\"\n                  [transparent]=\"actionTransparent(item)\"\n                  [mood]=\"actionMood(item)\"\n                  [ariaLabel]=\"actionAriaLabel(item)\"\n                  [disabled]=\"item.disabled === true\"\n                  (pressed)=\"onAction(item)\"\n                />\n              }\n            </div>\n          } @empty {\n            <span class=\"cx-action-bar__empty\">No actions</span>\n          }\n        </div>\n      </div>\n    </div>\n  </div>\n}\n", styles: [":host{display:block}.cx-action-bar__overlay{position:fixed;right:0;bottom:0;left:0;z-index:var(--z-index-detail);display:flex;width:auto;justify-content:center;overflow:hidden;padding-bottom:var(--space-xl);pointer-events:none}.cx-action-bar__container{display:flex;align-items:center;justify-content:center;animation:cx-action-bar-fade-in var(--motion-slow) var(--ease-out) forwards;opacity:0;pointer-events:auto;transform:translateY(calc(var(--space-xl) + var(--space-md)))}.cx-action-bar{display:flex;align-items:center;flex-direction:row;gap:var(--space-xl);padding:var(--space-sm);border:var(--line-discreet);border-radius:var(--radius-md);background:var(--surface);box-shadow:var(--shadow-mid)}.cx-action-bar__info,.cx-action-bar__actions,.cx-action-bar__group{display:flex;align-items:center}.cx-action-bar__info{min-width:0;gap:var(--space-sm)}.cx-action-bar__count{color:var(--opacity-high);font-size:var(--font-size-body);font-weight:var(--font-weight-regular);line-height:var(--line-height-body);white-space:nowrap}.cx-action-bar__actions{gap:var(--space-md)}.cx-action-bar__group{gap:var(--space-xs)}.cx-action-bar__empty{color:var(--opacity-high);font-size:var(--font-size-body);font-weight:var(--font-weight-regular);line-height:var(--line-height-body)}@keyframes cx-action-bar-fade-in{from{opacity:0;transform:translateY(calc(var(--space-xl) + var(--space-md)))}to{opacity:1;transform:translateY(0)}}@media(max-width: 640px){.cx-action-bar{align-items:stretch;flex-direction:column;gap:var(--space-sm)}.cx-action-bar__actions{justify-content:flex-start}}"] }]
        }], propDecorators: { data: [{
                type: Input
            }], deselectAll: [{
                type: Output
            }], action: [{
                type: Output
            }] } });
