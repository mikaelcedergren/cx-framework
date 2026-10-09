import { afterRenderEffect, booleanAttribute, ChangeDetectionStrategy, Component, ElementRef, EventEmitter, HostBinding, HostListener, inject, Input, Output, signal, viewChild, } from "@angular/core";
import { CxButtonComponent } from "../../actions/cx-button/index.js";
import { CxIconButtonComponent } from "../../actions/cx-icon-button/index.js";
import { CxIconComponent } from "../../media/cx-icon/index.js";
import { CxSpinnerComponent } from "../cx-spinner/index.js";
import * as i0 from "@angular/core";
export class CxAlertComponent {
    static nextId = 0;
    host = inject(ElementRef);
    focusAfterRender = false;
    description = viewChild("description", /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "description" }] : /* istanbul ignore next */ []));
    body = viewChild("body", /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "body" }] : /* istanbul ignore next */ []));
    trigger = viewChild("trigger", { ...(ngDevMode ? { debugName: "trigger" } : /* istanbul ignore next */ {}), read: (ElementRef) });
    expandableState = signal(false, /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "expandableState" }] : /* istanbul ignore next */ []));
    expandedState = signal(false, /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "expandedState" }] : /* istanbul ignore next */ []));
    hasDescription = signal(false, /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "hasDescription" }] : /* istanbul ignore next */ []));
    expanded$ = this.expandedState.asReadonly();
    bodyId = `cx-alert-body-${++CxAlertComponent.nextId}`;
    heading = "";
    mood = "default";
    loading = false;
    action;
    dismissible = false;
    set expandable(value) {
        if (value && !this.expandedState())
            this.restoreBodyFocus();
        this.expandableState.set(value);
    }
    set expanded(value) {
        this.setExpanded(value);
    }
    actionSelect = new EventEmitter();
    dismiss = new EventEmitter();
    expandedChange = new EventEmitter();
    constructor() {
        afterRenderEffect((onCleanup) => {
            const trigger = this.trigger()?.nativeElement.querySelector("button");
            if (this.focusAfterRender && trigger) {
                trigger.focus();
                this.focusAfterRender = false;
            }
            const description = this.description()?.nativeElement;
            if (!description) {
                this.hasDescription.set(false);
                return;
            }
            const sync = () => {
                this.hasDescription.set(this.hasMeaningfulContent(description));
            };
            sync();
            const observer = new MutationObserver(sync);
            observer.observe(description, {
                childList: true,
                subtree: true,
                characterData: true,
                attributes: true,
                attributeFilter: ["hidden"],
            });
            onCleanup(() => observer.disconnect());
        });
    }
    get canExpand() {
        return this.expandableState() && this.hasDescription();
    }
    get bodyVisible() {
        return !this.canExpand || this.expandedState();
    }
    toggle() {
        if (!this.canExpand)
            return;
        const next = !this.expandedState();
        this.setExpanded(next);
        this.expandedChange.emit(next);
    }
    onSurfaceClick(event) {
        if (!this.canExpand || event.defaultPrevented || event.button !== 0)
            return;
        // Stop at this alert: a focusable ancestor is not one of its controls.
        // The composed path also preserves controls projected through shadow DOM.
        for (const target of event.composedPath()) {
            if (target === this.host.nativeElement)
                break;
            if (!(target instanceof Element))
                continue;
            if (target.matches('a[href], area[href], button, input, select, textarea, label, summary, audio[controls], video[controls], iframe, [role="button"], [role="link"], [role="checkbox"], [role="radio"], [role="switch"], [role="textbox"], [role="combobox"], [role="slider"], [role="menuitem"], [role="option"], [tabindex]:not([tabindex="-1"])') ||
                (target instanceof HTMLElement && target.isContentEditable))
                return;
        }
        const selection = this.host.nativeElement.ownerDocument.getSelection();
        if (selection &&
            !selection.isCollapsed &&
            selection.rangeCount &&
            selection.getRangeAt(0).intersectsNode(this.host.nativeElement))
            return;
        this.toggle();
    }
    setExpanded(value) {
        if (!value && this.canExpand)
            this.restoreBodyFocus();
        this.expandedState.set(value);
    }
    restoreBodyFocus() {
        const body = this.body()?.nativeElement;
        const active = this.host.nativeElement.ownerDocument.activeElement;
        if (body && active && body.contains(active)) {
            const trigger = this.trigger()?.nativeElement.querySelector("button");
            if (trigger)
                trigger.focus();
            else
                this.focusAfterRender = true;
        }
    }
    hasMeaningfulContent(node) {
        if (node.nodeType === Node.TEXT_NODE)
            return !!node.textContent?.trim();
        if (!(node instanceof Element) || node.hasAttribute("hidden"))
            return false;
        if (node.matches("script, style, template"))
            return false;
        if (node.matches("svg, img, canvas, video, audio, iframe, input, select, textarea"))
            return true;
        return Array.from(node.childNodes).some((child) => this.hasMeaningfulContent(child));
    }
    get hostClass() {
        const classes = ["cx-alert", `cx-alert--${this.mood}`];
        if (!this.hasHeading())
            classes.push("cx-alert--hidden");
        return classes.join(" ");
    }
    get hostRole() {
        return this.mood === "danger" || this.mood === "warning"
            ? "alert"
            : "status";
    }
    get hostBusy() {
        return this.loading ? "true" : null;
    }
    get resolvedHeading() {
        return this.heading.trim();
    }
    hasHeading() {
        return this.resolvedHeading.length > 0;
    }
    get resolvedIcon() {
        switch (this.mood) {
            case "success":
                return "check";
            case "warning":
                return "warning";
            case "danger":
                return "error";
            case "info":
            case "default":
            default:
                return "info";
        }
    }
    get visibleAction() {
        return this.action?.text.trim() ? this.action : undefined;
    }
    get actionMood() {
        return this.mood;
    }
    actionHref(action) {
        return action.href?.trim() || undefined;
    }
    get dismissAriaLabel() {
        return `Dismiss ${this.resolvedHeading}`;
    }
    onActionSelect(action) {
        if (!this.actionHref(action)) {
            this.actionSelect.emit(action);
        }
    }
    onDismiss() {
        this.dismiss.emit();
    }
    static ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "22.2.2", ngImport: i0, type: CxAlertComponent, deps: [], target: i0.ɵɵFactoryTarget.Component });
    static ɵcmp = i0.ɵɵngDeclareComponent({ minVersion: "17.0.0", version: "22.2.2", type: CxAlertComponent, isStandalone: true, selector: "cx-alert", inputs: { heading: "heading", mood: "mood", loading: "loading", action: "action", dismissible: "dismissible", expandable: ["expandable", "expandable", booleanAttribute], expanded: ["expanded", "expanded", booleanAttribute] }, outputs: { actionSelect: "actionSelect", dismiss: "dismiss", expandedChange: "expandedChange" }, host: { listeners: { "click": "onSurfaceClick($event)" }, properties: { "class": "this.hostClass", "attr.role": "this.hostRole", "attr.aria-busy": "this.hostBusy" } }, viewQueries: [{ propertyName: "description", first: true, predicate: ["description"], descendants: true, isSignal: true }, { propertyName: "body", first: true, predicate: ["body"], descendants: true, isSignal: true }, { propertyName: "trigger", first: true, predicate: ["trigger"], descendants: true, read: ElementRef, isSignal: true }], ngImport: i0, template: "@if (hasHeading()) {\n  <div\n    class=\"cx-alert__surface\"\n    [class.cx-alert__surface--expandable]=\"canExpand\"\n    [class.cx-alert__surface--controls]=\"dismissible || canExpand\"\n  >\n    <div class=\"cx-alert__visual\" aria-hidden=\"true\">\n      @if (loading) {\n        <cx-spinner [mood]=\"mood\" aria-hidden=\"true\" />\n      } @else {\n        <cx-icon [icon]=\"resolvedIcon\" [size]=\"20\" />\n      }\n    </div>\n\n    <div class=\"cx-alert__content\">\n      <div class=\"cx-alert__heading\">{{ resolvedHeading }}</div>\n    </div>\n    @if (dismissible || canExpand) {\n      <div class=\"cx-alert__controls\">\n        @if (dismissible) {\n          <cx-icon-button\n            class=\"cx-alert__dismiss\"\n            icon=\"remove\"\n            [ariaLabel]=\"dismissAriaLabel\"\n            size=\"small\"\n            [rounded]=\"true\"\n            (pressed)=\"onDismiss()\"\n          />\n        }\n        @if (canExpand) {\n          <cx-icon-button\n            #trigger\n            class=\"cx-alert__trigger\"\n            [icon]=\"expanded$() ? 'chevron-up' : 'chevron-down'\"\n            [ariaLabel]=\"resolvedHeading\"\n            [ariaExpanded]=\"expanded$()\"\n            [ariaControls]=\"bodyId\"\n            variant=\"transparent\"\n            size=\"small\"\n            [rounded]=\"true\"\n            (pressed)=\"toggle()\"\n          />\n        }\n      </div>\n    }\n\n    <div\n      class=\"cx-alert__body\"\n      [class.cx-alert__body--visible]=\"bodyVisible\"\n      [id]=\"bodyId\"\n      [attr.inert]=\"bodyVisible ? null : ''\"\n      [attr.aria-hidden]=\"bodyVisible ? null : 'true'\"\n    >\n      <div #body class=\"cx-alert__body-clip\">\n        <div\n          #description\n          class=\"cx-alert__description\"\n          [class.cx-alert__description--present]=\"hasDescription()\"\n        >\n          <ng-content />\n        </div>\n        @if (visibleAction; as action) {\n          <cx-button\n            class=\"cx-alert__action\"\n            [text]=\"action.text.trim()\"\n            [href]=\"actionHref(action)\"\n            [mood]=\"actionMood\"\n            size=\"small\"\n            [rounded]=\"true\"\n            (pressed)=\"onActionSelect(action)\"\n          />\n        }\n      </div>\n    </div>\n  </div>\n}\n", styles: [":host{display:block;width:100%}:host(.cx-alert--info) .cx-alert__visual,:host(.cx-alert--info) .cx-alert__heading{color:var(--info)}:host(.cx-alert--success) .cx-alert__visual,:host(.cx-alert--success) .cx-alert__heading{color:var(--success)}:host(.cx-alert--warning) .cx-alert__visual,:host(.cx-alert--warning) .cx-alert__heading{color:var(--warning)}:host(.cx-alert--danger) .cx-alert__visual,:host(.cx-alert--danger) .cx-alert__heading{color:var(--danger)}.cx-alert__surface{display:grid;grid-template-columns:24px minmax(0, 1fr);width:100%;min-width:0;align-items:center;column-gap:var(--space-sm);row-gap:0;padding:var(--space-md);border:var(--line-discreet);border-radius:var(--radius-xl);background:var(--surface);box-shadow:var(--shadow-low);box-sizing:border-box}.cx-alert__surface--controls{grid-template-columns:24px minmax(0, 1fr) auto}.cx-alert__visual{display:inline-flex;grid-column:1;grid-row:1;width:24px;height:20px;align-items:center;justify-content:center;color:var(--ink)}.cx-alert__visual cx-spinner{width:20px;height:20px}.cx-alert__content{display:flex;grid-column:2;grid-row:1;min-width:0;flex-direction:column;gap:0}.cx-alert__heading{color:var(--ink);font-size:var(--font-size-body);font-weight:var(--font-weight-medium);line-height:var(--line-height-body);overflow-wrap:anywhere}.cx-alert__description{min-width:0;color:var(--opacity-high);font-size:var(--font-size-body);font-weight:var(--font-weight-regular);line-height:var(--line-height-body-relaxed);overflow-wrap:anywhere}.cx-alert__description:empty{display:none}.cx-alert__surface--expandable{cursor:pointer}.cx-alert__surface--expandable:hover{background-image:linear-gradient(var(--opacity-low), var(--opacity-low))}.cx-alert__controls{display:flex;grid-column:3;grid-row:1;align-items:center;gap:var(--space-sm)}.cx-alert__body{display:grid;grid-column:2/-1;grid-row:2;min-width:0;grid-template-rows:0fr}.cx-alert__surface--expandable .cx-alert__body{transition:grid-template-rows var(--motion-base) var(--ease-out-in)}.cx-alert__body--visible{grid-template-rows:1fr}.cx-alert__body-clip{display:flex;min-height:0;flex-direction:column;overflow:clip}.cx-alert__body--visible .cx-alert__body-clip{overflow-clip-margin:var(--space-xs)}.cx-alert__description--present{padding-block-start:var(--space-2xs)}@media(prefers-reduced-motion: reduce){.cx-alert__surface--expandable .cx-alert__body{transition:none}}.cx-alert__action{display:inline-flex;align-self:start;margin-block-start:var(--space-sm)}.cx-alert__dismiss{display:inline-flex}"], dependencies: [{ kind: "component", type: CxButtonComponent, selector: "cx-button", inputs: ["text", "mood", "icon", "appendIcon", "shortcutParts", "href", "type", "size", "ariaLabel", "disabled", "transparent", "rounded", "loading"], outputs: ["pressed"] }, { kind: "component", type: CxIconButtonComponent, selector: "cx-icon-button", inputs: ["icon", "ariaLabel", "role", "ariaHasPopup", "ariaExpanded", "ariaControls", "mood", "variant", "size", "selected", "ariaPressed", "rounded", "disabled", "badgeValue", "block", "loading", "countdown"], outputs: ["pressed", "countdownChange"] }, { kind: "component", type: CxIconComponent, selector: "cx-icon", inputs: ["icon", "size", "mood", "shape"] }, { kind: "component", type: CxSpinnerComponent, selector: "cx-spinner", inputs: ["mood", "ariaLabel", "size"] }], changeDetection: i0.ChangeDetectionStrategy.OnPush });
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "22.2.2", ngImport: i0, type: CxAlertComponent, decorators: [{
            type: Component,
            args: [{ selector: "cx-alert", imports: [
                        CxButtonComponent,
                        CxIconButtonComponent,
                        CxIconComponent,
                        CxSpinnerComponent,
                    ], changeDetection: ChangeDetectionStrategy.OnPush, template: "@if (hasHeading()) {\n  <div\n    class=\"cx-alert__surface\"\n    [class.cx-alert__surface--expandable]=\"canExpand\"\n    [class.cx-alert__surface--controls]=\"dismissible || canExpand\"\n  >\n    <div class=\"cx-alert__visual\" aria-hidden=\"true\">\n      @if (loading) {\n        <cx-spinner [mood]=\"mood\" aria-hidden=\"true\" />\n      } @else {\n        <cx-icon [icon]=\"resolvedIcon\" [size]=\"20\" />\n      }\n    </div>\n\n    <div class=\"cx-alert__content\">\n      <div class=\"cx-alert__heading\">{{ resolvedHeading }}</div>\n    </div>\n    @if (dismissible || canExpand) {\n      <div class=\"cx-alert__controls\">\n        @if (dismissible) {\n          <cx-icon-button\n            class=\"cx-alert__dismiss\"\n            icon=\"remove\"\n            [ariaLabel]=\"dismissAriaLabel\"\n            size=\"small\"\n            [rounded]=\"true\"\n            (pressed)=\"onDismiss()\"\n          />\n        }\n        @if (canExpand) {\n          <cx-icon-button\n            #trigger\n            class=\"cx-alert__trigger\"\n            [icon]=\"expanded$() ? 'chevron-up' : 'chevron-down'\"\n            [ariaLabel]=\"resolvedHeading\"\n            [ariaExpanded]=\"expanded$()\"\n            [ariaControls]=\"bodyId\"\n            variant=\"transparent\"\n            size=\"small\"\n            [rounded]=\"true\"\n            (pressed)=\"toggle()\"\n          />\n        }\n      </div>\n    }\n\n    <div\n      class=\"cx-alert__body\"\n      [class.cx-alert__body--visible]=\"bodyVisible\"\n      [id]=\"bodyId\"\n      [attr.inert]=\"bodyVisible ? null : ''\"\n      [attr.aria-hidden]=\"bodyVisible ? null : 'true'\"\n    >\n      <div #body class=\"cx-alert__body-clip\">\n        <div\n          #description\n          class=\"cx-alert__description\"\n          [class.cx-alert__description--present]=\"hasDescription()\"\n        >\n          <ng-content />\n        </div>\n        @if (visibleAction; as action) {\n          <cx-button\n            class=\"cx-alert__action\"\n            [text]=\"action.text.trim()\"\n            [href]=\"actionHref(action)\"\n            [mood]=\"actionMood\"\n            size=\"small\"\n            [rounded]=\"true\"\n            (pressed)=\"onActionSelect(action)\"\n          />\n        }\n      </div>\n    </div>\n  </div>\n}\n", styles: [":host{display:block;width:100%}:host(.cx-alert--info) .cx-alert__visual,:host(.cx-alert--info) .cx-alert__heading{color:var(--info)}:host(.cx-alert--success) .cx-alert__visual,:host(.cx-alert--success) .cx-alert__heading{color:var(--success)}:host(.cx-alert--warning) .cx-alert__visual,:host(.cx-alert--warning) .cx-alert__heading{color:var(--warning)}:host(.cx-alert--danger) .cx-alert__visual,:host(.cx-alert--danger) .cx-alert__heading{color:var(--danger)}.cx-alert__surface{display:grid;grid-template-columns:24px minmax(0, 1fr);width:100%;min-width:0;align-items:center;column-gap:var(--space-sm);row-gap:0;padding:var(--space-md);border:var(--line-discreet);border-radius:var(--radius-xl);background:var(--surface);box-shadow:var(--shadow-low);box-sizing:border-box}.cx-alert__surface--controls{grid-template-columns:24px minmax(0, 1fr) auto}.cx-alert__visual{display:inline-flex;grid-column:1;grid-row:1;width:24px;height:20px;align-items:center;justify-content:center;color:var(--ink)}.cx-alert__visual cx-spinner{width:20px;height:20px}.cx-alert__content{display:flex;grid-column:2;grid-row:1;min-width:0;flex-direction:column;gap:0}.cx-alert__heading{color:var(--ink);font-size:var(--font-size-body);font-weight:var(--font-weight-medium);line-height:var(--line-height-body);overflow-wrap:anywhere}.cx-alert__description{min-width:0;color:var(--opacity-high);font-size:var(--font-size-body);font-weight:var(--font-weight-regular);line-height:var(--line-height-body-relaxed);overflow-wrap:anywhere}.cx-alert__description:empty{display:none}.cx-alert__surface--expandable{cursor:pointer}.cx-alert__surface--expandable:hover{background-image:linear-gradient(var(--opacity-low), var(--opacity-low))}.cx-alert__controls{display:flex;grid-column:3;grid-row:1;align-items:center;gap:var(--space-sm)}.cx-alert__body{display:grid;grid-column:2/-1;grid-row:2;min-width:0;grid-template-rows:0fr}.cx-alert__surface--expandable .cx-alert__body{transition:grid-template-rows var(--motion-base) var(--ease-out-in)}.cx-alert__body--visible{grid-template-rows:1fr}.cx-alert__body-clip{display:flex;min-height:0;flex-direction:column;overflow:clip}.cx-alert__body--visible .cx-alert__body-clip{overflow-clip-margin:var(--space-xs)}.cx-alert__description--present{padding-block-start:var(--space-2xs)}@media(prefers-reduced-motion: reduce){.cx-alert__surface--expandable .cx-alert__body{transition:none}}.cx-alert__action{display:inline-flex;align-self:start;margin-block-start:var(--space-sm)}.cx-alert__dismiss{display:inline-flex}"] }]
        }], ctorParameters: () => [], propDecorators: { description: [{ type: i0.ViewChild, args: ["description", { isSignal: true }] }], body: [{ type: i0.ViewChild, args: ["body", { isSignal: true }] }], trigger: [{ type: i0.ViewChild, args: ["trigger", { ...{
                            read: (ElementRef),
                        }, isSignal: true }] }], heading: [{
                type: Input
            }], mood: [{
                type: Input
            }], loading: [{
                type: Input
            }], action: [{
                type: Input
            }], dismissible: [{
                type: Input
            }], expandable: [{
                type: Input,
                args: [{ transform: booleanAttribute }]
            }], expanded: [{
                type: Input,
                args: [{ transform: booleanAttribute }]
            }], actionSelect: [{
                type: Output
            }], dismiss: [{
                type: Output
            }], expandedChange: [{
                type: Output
            }], onSurfaceClick: [{
                type: HostListener,
                args: ["click", ["$event"]]
            }], hostClass: [{
                type: HostBinding,
                args: ["class"]
            }], hostRole: [{
                type: HostBinding,
                args: ["attr.role"]
            }], hostBusy: [{
                type: HostBinding,
                args: ["attr.aria-busy"]
            }] } });
