import { booleanAttribute, ChangeDetectionStrategy, Component, EventEmitter, Input, Output, signal, } from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { CxIconComponent } from '../../media/cx-icon/index.js';
import { CxTooltipDirective } from '../../overlay/cx-tooltip/index.js';
import * as i0 from "@angular/core";
let nextListItemId = 0;
export class CxListItemComponent {
    expandedState = signal(false, /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "expandedState" }] : /* istanbul ignore next */ []));
    contextState = signal({
        density: 'comfortable',
        divided: true,
        managed: false,
    }, /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "contextState" }] : /* istanbul ignore next */ []));
    warnedInvalidActivation = false;
    /**
     * Stable key for the parent list's single-open state. Falls back to the
     * generated id, so an uncontrolled list still opens one row at a time.
     */
    itemId;
    heading = 'List item';
    description;
    /** Short trailing value such as a count, status word, or timestamp. */
    meta;
    prependIcon;
    /**
     * Turns the row body into a button that emits `pressed`. Ignored when the
     * row is `expandable`, because a row cannot both navigate away and open.
     */
    interactive = false;
    /** Navigation destination. Renders the row body as a real link. */
    href;
    target;
    rel;
    /** Row body opens its projected content instead of emitting `pressed`. */
    expandable = false;
    disabled = false;
    pressed = new EventEmitter();
    expandedChange = new EventEmitter();
    /** Raised on user activation so the parent list can close its other rows. */
    expandToggle = new EventEmitter();
    contentId = `cx-list-item-content-${(nextListItemId += 1)}`;
    expanded$ = this.expandedState.asReadonly();
    context$ = this.contextState.asReadonly();
    ngOnChanges(_changes) {
        this.warnInvalidCombinations();
    }
    /** Key the parent list tracks this row by. */
    get key() {
        return this.itemId ?? this.contentId;
    }
    /** Parent-driven open state; does not re-emit `expandedChange` back to the list. */
    setExpanded(expanded) {
        if (this.expandedState() === expanded) {
            return;
        }
        this.expandedState.set(expanded);
        this.expandedChange.emit(expanded);
    }
    setContext(context) {
        this.contextState.set(context);
    }
    /** A static row has no affordance and takes no pointer or keyboard activation. */
    get activatable() {
        return this.expandable || Boolean(this.resolvedHref) || this.interactive;
    }
    get resolvedHref() {
        return this.href?.trim() || undefined;
    }
    get resolvedRel() {
        return this.rel?.trim() || (this.target?.trim() === '_blank' ? 'noopener' : null);
    }
    onActivate() {
        if (this.disabled || !this.activatable) {
            return;
        }
        if (this.expandable) {
            this.expandToggle.emit(this.key);
            // Outside a cx-list nothing else owns the open state, so the row keeps
            // its own. A chevron that does nothing would be broken chrome.
            if (!this.contextState().managed) {
                this.setExpanded(!this.expandedState());
            }
            return;
        }
        this.pressed.emit();
    }
    onLinkClick(event) {
        if (!this.disabled) {
            return;
        }
        event.preventDefault();
        event.stopPropagation();
    }
    warnInvalidCombinations() {
        const activationCount = Number(this.expandable) + Number(Boolean(this.resolvedHref)) + Number(this.interactive);
        if (this.warnedInvalidActivation || activationCount < 2) {
            return;
        }
        this.warnedInvalidActivation = true;
        console.warn(`cx-list-item "${this.heading}" sets more than one activation mode. ` +
            'A row opens, navigates, or acts; expandable wins, then href, then interactive.');
    }
    static ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "22.0.8", ngImport: i0, type: CxListItemComponent, deps: [], target: i0.ɵɵFactoryTarget.Component });
    static ɵcmp = i0.ɵɵngDeclareComponent({ minVersion: "17.0.0", version: "22.0.8", type: CxListItemComponent, isStandalone: true, selector: "cx-list-item", inputs: { itemId: "itemId", heading: "heading", description: "description", meta: "meta", prependIcon: "prependIcon", interactive: ["interactive", "interactive", booleanAttribute], href: "href", target: "target", rel: "rel", expandable: ["expandable", "expandable", booleanAttribute], disabled: ["disabled", "disabled", booleanAttribute] }, outputs: { pressed: "pressed", expandedChange: "expandedChange", expandToggle: "expandToggle" }, host: { attributes: { "role": "listitem" }, properties: { "class.cx-list-item-host--compact": "context$().density === \"compact\"", "class.cx-list-item-host--divided": "context$().divided", "class.cx-list-item-host--expanded": "expanded$()", "class.cx-list-item-host--disabled": "disabled" } }, usesOnChanges: true, ngImport: i0, template: "<div class=\"cx-list-item\">\n  <div class=\"cx-list-item__row\">\n    @if (expandable) {\n      <button\n        type=\"button\"\n        class=\"cx-list-item__body\"\n        [disabled]=\"disabled\"\n        [attr.aria-expanded]=\"expandable ? expanded$() : null\"\n        [attr.aria-controls]=\"expandable ? contentId : null\"\n        (click)=\"onActivate()\"\n      >\n        <ng-container [ngTemplateOutlet]=\"body\" />\n      </button>\n    } @else if (resolvedHref; as href) {\n      <a\n        class=\"cx-list-item__body\"\n        [attr.href]=\"disabled ? null : href\"\n        [attr.role]=\"disabled ? 'link' : null\"\n        [attr.target]=\"disabled ? null : target?.trim() || null\"\n        [attr.rel]=\"disabled ? null : resolvedRel\"\n        [attr.aria-disabled]=\"disabled ? 'true' : null\"\n        [attr.tabindex]=\"disabled ? '-1' : null\"\n        (click)=\"onLinkClick($event)\"\n      >\n        <ng-container [ngTemplateOutlet]=\"body\" />\n      </a>\n    } @else if (interactive) {\n      <button\n        type=\"button\"\n        class=\"cx-list-item__body\"\n        [disabled]=\"disabled\"\n        (click)=\"onActivate()\"\n      >\n        <ng-container [ngTemplateOutlet]=\"body\" />\n      </button>\n    } @else {\n      <div class=\"cx-list-item__body cx-list-item__body--static\">\n        <ng-container [ngTemplateOutlet]=\"body\" />\n      </div>\n    }\n\n    <span class=\"cx-list-item__actions\">\n      <ng-content select=\"[actions]\" />\n    </span>\n  </div>\n\n  @if (expandable) {\n    <div\n      class=\"cx-list-item__content-shell\"\n      [class.cx-list-item__content-shell--expanded]=\"expanded$()\"\n      [id]=\"contentId\"\n      [attr.aria-hidden]=\"expanded$() ? null : 'true'\"\n      [attr.inert]=\"expanded$() ? null : ''\"\n    >\n      <div class=\"cx-list-item__content-clip\">\n        <div class=\"cx-list-item__content\">\n          <ng-content />\n        </div>\n      </div>\n    </div>\n  }\n</div>\n\n<ng-template #body>\n  @if (prependIcon) {\n    <cx-icon class=\"cx-list-item__icon\" [icon]=\"prependIcon\" [size]=\"16\" />\n  }\n\n  <span class=\"cx-list-item__text\">\n    <span class=\"cx-list-item__main\">\n      <span\n        class=\"cx-list-item__heading\"\n        [cxTooltip]=\"heading\"\n        [cxTooltipOverflow]=\"true\"\n        data-cx-tooltip-overflow\n      >{{ heading }}</span>\n\n      @if (meta) {\n        <span class=\"cx-list-item__meta\">{{ meta }}</span>\n      }\n    </span>\n\n    @if (description) {\n      <span class=\"cx-list-item__description\">{{ description }}</span>\n    }\n  </span>\n\n  @if (expandable) {\n    <cx-icon class=\"cx-list-item__chevron\" icon=\"chevron-down\" [size]=\"16\" />\n  }\n</ng-template>\n", styles: [":host{display:block;min-width:0}:host(.cx-list-item-host--divided){border-top:var(--line-discreet)}:host(.cx-list-item-host--divided:first-child){border-top:0}:host(.cx-list-item-host--disabled){opacity:var(--opacity-disabled)}.cx-list-item{display:block;min-width:0}.cx-list-item__row{display:flex;min-width:0;align-items:stretch;transition:background-color var(--motion-fast) var(--ease-out)}:host(:not(.cx-list-item-host--disabled)) .cx-list-item__row:has(.cx-list-item__body:hover:not(:disabled)),:host(.cx-list-item-host--expanded) .cx-list-item__row{background:var(--opacity-low)}.cx-list-item__body{display:grid;min-width:0;flex:1 1 auto;grid-template-columns:auto minmax(0, 1fr) auto;align-items:center;gap:var(--space-sm);padding:var(--space-md);border:0;margin:0;background:rgba(0,0,0,0);color:var(--ink);cursor:pointer;font:inherit;text-align:start;text-decoration:none}.cx-list-item__body--static{cursor:default}.cx-list-item__body:disabled{cursor:default}:host(.cx-list-item-host--disabled) .cx-list-item__body{cursor:default}.cx-list-item__body:focus-visible{outline:var(--outline-tab);outline-offset:calc(var(--outline-tab-offset)*-1)}:host(.cx-list-item-host--compact) .cx-list-item__body{padding:var(--space-sm)}.cx-list-item__icon{color:var(--opacity-high)}.cx-list-item__text,.cx-list-item__main{display:flex;min-width:0}.cx-list-item__text{flex-direction:column;gap:var(--space-2xs)}.cx-list-item__main{align-items:baseline;justify-content:space-between;gap:var(--space-sm)}.cx-list-item__heading{overflow:hidden;color:var(--ink);font-size:var(--font-size-body);font-weight:var(--font-weight-medium);line-height:var(--line-height-body);text-overflow:ellipsis;white-space:nowrap}.cx-list-item__meta,.cx-list-item__description{color:var(--opacity-high);font-size:var(--font-size-body-sm);line-height:var(--line-height-body);overflow-wrap:anywhere;white-space:normal}.cx-list-item__meta{flex:0 0 auto}.cx-list-item__chevron{color:var(--opacity-high);transition:transform var(--motion-base) var(--ease-out-in)}:host(.cx-list-item-host--expanded) .cx-list-item__chevron{transform:rotate(180deg)}.cx-list-item__actions{display:flex;flex:0 0 auto;align-items:center;gap:var(--space-2xs);padding-inline-end:var(--space-sm)}.cx-list-item__actions:empty{display:none}.cx-list-item__content-shell{display:grid;grid-template-rows:0fr;transition:grid-template-rows var(--motion-base) var(--ease-out-in)}.cx-list-item__content-shell--expanded{grid-template-rows:1fr}.cx-list-item__content-clip{min-height:0;overflow:hidden}.cx-list-item__content{padding:0 var(--space-md) var(--space-md);color:var(--ink);font-size:var(--font-size-body);line-height:var(--line-height-body);opacity:0;transition:opacity var(--motion-fast) var(--ease-out)}:host(.cx-list-item-host--compact) .cx-list-item__content{padding:0 var(--space-sm) var(--space-sm)}.cx-list-item__content-shell--expanded .cx-list-item__content{opacity:1}@media(prefers-reduced-motion: reduce){.cx-list-item__row,.cx-list-item__content-shell,.cx-list-item__content,.cx-list-item__chevron{transition:none}}"], dependencies: [{ kind: "directive", type: NgTemplateOutlet, selector: "[ngTemplateOutlet]", inputs: ["ngTemplateOutletContext", "ngTemplateOutlet", "ngTemplateOutletInjector"] }, { kind: "component", type: CxIconComponent, selector: "cx-icon", inputs: ["icon", "size", "mood", "shape"] }, { kind: "directive", type: CxTooltipDirective, selector: "[cxTooltip]", inputs: ["cxTooltip", "cxTooltipPosition", "cxTooltipDelay", "cxTooltipDisabled", "cxTooltipOverflow"] }], changeDetection: i0.ChangeDetectionStrategy.OnPush });
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "22.0.8", ngImport: i0, type: CxListItemComponent, decorators: [{
            type: Component,
            args: [{ selector: 'cx-list-item', imports: [NgTemplateOutlet, CxIconComponent, CxTooltipDirective], host: {
                        role: 'listitem',
                        '[class.cx-list-item-host--compact]': 'context$().density === "compact"',
                        '[class.cx-list-item-host--divided]': 'context$().divided',
                        '[class.cx-list-item-host--expanded]': 'expanded$()',
                        '[class.cx-list-item-host--disabled]': 'disabled',
                    }, changeDetection: ChangeDetectionStrategy.OnPush, template: "<div class=\"cx-list-item\">\n  <div class=\"cx-list-item__row\">\n    @if (expandable) {\n      <button\n        type=\"button\"\n        class=\"cx-list-item__body\"\n        [disabled]=\"disabled\"\n        [attr.aria-expanded]=\"expandable ? expanded$() : null\"\n        [attr.aria-controls]=\"expandable ? contentId : null\"\n        (click)=\"onActivate()\"\n      >\n        <ng-container [ngTemplateOutlet]=\"body\" />\n      </button>\n    } @else if (resolvedHref; as href) {\n      <a\n        class=\"cx-list-item__body\"\n        [attr.href]=\"disabled ? null : href\"\n        [attr.role]=\"disabled ? 'link' : null\"\n        [attr.target]=\"disabled ? null : target?.trim() || null\"\n        [attr.rel]=\"disabled ? null : resolvedRel\"\n        [attr.aria-disabled]=\"disabled ? 'true' : null\"\n        [attr.tabindex]=\"disabled ? '-1' : null\"\n        (click)=\"onLinkClick($event)\"\n      >\n        <ng-container [ngTemplateOutlet]=\"body\" />\n      </a>\n    } @else if (interactive) {\n      <button\n        type=\"button\"\n        class=\"cx-list-item__body\"\n        [disabled]=\"disabled\"\n        (click)=\"onActivate()\"\n      >\n        <ng-container [ngTemplateOutlet]=\"body\" />\n      </button>\n    } @else {\n      <div class=\"cx-list-item__body cx-list-item__body--static\">\n        <ng-container [ngTemplateOutlet]=\"body\" />\n      </div>\n    }\n\n    <span class=\"cx-list-item__actions\">\n      <ng-content select=\"[actions]\" />\n    </span>\n  </div>\n\n  @if (expandable) {\n    <div\n      class=\"cx-list-item__content-shell\"\n      [class.cx-list-item__content-shell--expanded]=\"expanded$()\"\n      [id]=\"contentId\"\n      [attr.aria-hidden]=\"expanded$() ? null : 'true'\"\n      [attr.inert]=\"expanded$() ? null : ''\"\n    >\n      <div class=\"cx-list-item__content-clip\">\n        <div class=\"cx-list-item__content\">\n          <ng-content />\n        </div>\n      </div>\n    </div>\n  }\n</div>\n\n<ng-template #body>\n  @if (prependIcon) {\n    <cx-icon class=\"cx-list-item__icon\" [icon]=\"prependIcon\" [size]=\"16\" />\n  }\n\n  <span class=\"cx-list-item__text\">\n    <span class=\"cx-list-item__main\">\n      <span\n        class=\"cx-list-item__heading\"\n        [cxTooltip]=\"heading\"\n        [cxTooltipOverflow]=\"true\"\n        data-cx-tooltip-overflow\n      >{{ heading }}</span>\n\n      @if (meta) {\n        <span class=\"cx-list-item__meta\">{{ meta }}</span>\n      }\n    </span>\n\n    @if (description) {\n      <span class=\"cx-list-item__description\">{{ description }}</span>\n    }\n  </span>\n\n  @if (expandable) {\n    <cx-icon class=\"cx-list-item__chevron\" icon=\"chevron-down\" [size]=\"16\" />\n  }\n</ng-template>\n", styles: [":host{display:block;min-width:0}:host(.cx-list-item-host--divided){border-top:var(--line-discreet)}:host(.cx-list-item-host--divided:first-child){border-top:0}:host(.cx-list-item-host--disabled){opacity:var(--opacity-disabled)}.cx-list-item{display:block;min-width:0}.cx-list-item__row{display:flex;min-width:0;align-items:stretch;transition:background-color var(--motion-fast) var(--ease-out)}:host(:not(.cx-list-item-host--disabled)) .cx-list-item__row:has(.cx-list-item__body:hover:not(:disabled)),:host(.cx-list-item-host--expanded) .cx-list-item__row{background:var(--opacity-low)}.cx-list-item__body{display:grid;min-width:0;flex:1 1 auto;grid-template-columns:auto minmax(0, 1fr) auto;align-items:center;gap:var(--space-sm);padding:var(--space-md);border:0;margin:0;background:rgba(0,0,0,0);color:var(--ink);cursor:pointer;font:inherit;text-align:start;text-decoration:none}.cx-list-item__body--static{cursor:default}.cx-list-item__body:disabled{cursor:default}:host(.cx-list-item-host--disabled) .cx-list-item__body{cursor:default}.cx-list-item__body:focus-visible{outline:var(--outline-tab);outline-offset:calc(var(--outline-tab-offset)*-1)}:host(.cx-list-item-host--compact) .cx-list-item__body{padding:var(--space-sm)}.cx-list-item__icon{color:var(--opacity-high)}.cx-list-item__text,.cx-list-item__main{display:flex;min-width:0}.cx-list-item__text{flex-direction:column;gap:var(--space-2xs)}.cx-list-item__main{align-items:baseline;justify-content:space-between;gap:var(--space-sm)}.cx-list-item__heading{overflow:hidden;color:var(--ink);font-size:var(--font-size-body);font-weight:var(--font-weight-medium);line-height:var(--line-height-body);text-overflow:ellipsis;white-space:nowrap}.cx-list-item__meta,.cx-list-item__description{color:var(--opacity-high);font-size:var(--font-size-body-sm);line-height:var(--line-height-body);overflow-wrap:anywhere;white-space:normal}.cx-list-item__meta{flex:0 0 auto}.cx-list-item__chevron{color:var(--opacity-high);transition:transform var(--motion-base) var(--ease-out-in)}:host(.cx-list-item-host--expanded) .cx-list-item__chevron{transform:rotate(180deg)}.cx-list-item__actions{display:flex;flex:0 0 auto;align-items:center;gap:var(--space-2xs);padding-inline-end:var(--space-sm)}.cx-list-item__actions:empty{display:none}.cx-list-item__content-shell{display:grid;grid-template-rows:0fr;transition:grid-template-rows var(--motion-base) var(--ease-out-in)}.cx-list-item__content-shell--expanded{grid-template-rows:1fr}.cx-list-item__content-clip{min-height:0;overflow:hidden}.cx-list-item__content{padding:0 var(--space-md) var(--space-md);color:var(--ink);font-size:var(--font-size-body);line-height:var(--line-height-body);opacity:0;transition:opacity var(--motion-fast) var(--ease-out)}:host(.cx-list-item-host--compact) .cx-list-item__content{padding:0 var(--space-sm) var(--space-sm)}.cx-list-item__content-shell--expanded .cx-list-item__content{opacity:1}@media(prefers-reduced-motion: reduce){.cx-list-item__row,.cx-list-item__content-shell,.cx-list-item__content,.cx-list-item__chevron{transition:none}}"] }]
        }], propDecorators: { itemId: [{
                type: Input
            }], heading: [{
                type: Input
            }], description: [{
                type: Input
            }], meta: [{
                type: Input
            }], prependIcon: [{
                type: Input
            }], interactive: [{
                type: Input,
                args: [{ transform: booleanAttribute }]
            }], href: [{
                type: Input
            }], target: [{
                type: Input
            }], rel: [{
                type: Input
            }], expandable: [{
                type: Input,
                args: [{ transform: booleanAttribute }]
            }], disabled: [{
                type: Input,
                args: [{ transform: booleanAttribute }]
            }], pressed: [{
                type: Output
            }], expandedChange: [{
                type: Output
            }], expandToggle: [{
                type: Output
            }] } });
