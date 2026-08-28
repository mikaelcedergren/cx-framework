import { ChangeDetectionStrategy, Component, EventEmitter, HostBinding, Input, Output } from '@angular/core';
import { CxButtonComponent } from '../../actions/cx-button/index.js';
import { CxIconButtonComponent } from '../../actions/cx-icon-button/index.js';
import { CxIconComponent } from '../../media/cx-icon/index.js';
import { CxSpinnerComponent } from '../cx-spinner/index.js';
import * as i0 from "@angular/core";
export class CxAlertComponent {
    heading = '';
    mood = 'default';
    loading = false;
    action;
    dismissible = false;
    actionSelect = new EventEmitter();
    dismiss = new EventEmitter();
    get hostClass() {
        const classes = ['cx-alert', `cx-alert--${this.mood}`];
        if (!this.hasHeading())
            classes.push('cx-alert--hidden');
        return classes.join(' ');
    }
    get hostRole() {
        return this.mood === 'danger' || this.mood === 'warning' ? 'alert' : 'status';
    }
    get hostBusy() {
        return this.loading ? 'true' : null;
    }
    get resolvedHeading() {
        return this.heading.trim();
    }
    hasHeading() {
        return this.resolvedHeading.length > 0;
    }
    get resolvedIcon() {
        switch (this.mood) {
            case 'success':
                return 'check';
            case 'warning':
                return 'warning';
            case 'danger':
                return 'error';
            case 'info':
            case 'default':
            default:
                return 'info';
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
    static ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "22.0.8", ngImport: i0, type: CxAlertComponent, deps: [], target: i0.ɵɵFactoryTarget.Component });
    static ɵcmp = i0.ɵɵngDeclareComponent({ minVersion: "17.0.0", version: "22.0.8", type: CxAlertComponent, isStandalone: true, selector: "cx-alert", inputs: { heading: "heading", mood: "mood", loading: "loading", action: "action", dismissible: "dismissible" }, outputs: { actionSelect: "actionSelect", dismiss: "dismiss" }, host: { properties: { "class": "this.hostClass", "attr.role": "this.hostRole", "attr.aria-busy": "this.hostBusy" } }, ngImport: i0, template: "@if (hasHeading()) {\n  <div class=\"cx-alert__surface\">\n    <div class=\"cx-alert__visual\" aria-hidden=\"true\">\n      @if (loading) {\n        <cx-spinner [mood]=\"mood\" aria-hidden=\"true\" />\n      } @else {\n        <cx-icon [icon]=\"resolvedIcon\" [size]=\"20\" />\n      }\n    </div>\n\n    <div class=\"cx-alert__content\">\n      <div class=\"cx-alert__heading\">{{ resolvedHeading }}</div>\n      <div class=\"cx-alert__description\"><ng-content /></div>\n    </div>\n\n    @if (visibleAction; as action) {\n      <cx-button\n        class=\"cx-alert__action\"\n        [text]=\"action.text.trim()\"\n        [href]=\"actionHref(action)\"\n        [mood]=\"actionMood\"\n        size=\"small\"\n        [rounded]=\"true\"\n        (pressed)=\"onActionSelect(action)\"\n      />\n    }\n\n    @if (dismissible) {\n      <cx-icon-button\n        class=\"cx-alert__dismiss\"\n        icon=\"remove\"\n        [ariaLabel]=\"dismissAriaLabel\"\n        size=\"small\"\n        [rounded]=\"true\"\n        (pressed)=\"onDismiss()\"\n      />\n    }\n  </div>\n}\n", styles: [":host{display:block;width:100%;--cx-alert-accent: var(--ink)}:host(.cx-alert--info){--cx-alert-accent: var(--info)}:host(.cx-alert--success){--cx-alert-accent: var(--success)}:host(.cx-alert--warning){--cx-alert-accent: var(--warning)}:host(.cx-alert--danger){--cx-alert-accent: var(--danger)}.cx-alert__surface{display:grid;grid-template-columns:24px minmax(0, 1fr) auto;width:100%;min-width:0;align-items:start;gap:var(--space-sm);padding:var(--space-md);border:var(--line-discreet);border-radius:var(--radius-xl);background:var(--surface);box-shadow:var(--shadow-low);box-sizing:border-box}.cx-alert__visual{display:inline-flex;grid-column:1;grid-row:1;width:24px;height:20px;align-items:center;justify-content:center;color:var(--cx-alert-accent)}.cx-alert__visual cx-spinner{width:20px;height:20px}.cx-alert__content{display:flex;grid-column:2;grid-row:1;min-width:0;flex-direction:column;gap:var(--space-2xs)}.cx-alert__heading{color:var(--cx-alert-accent);font-size:var(--font-size-body);font-weight:var(--font-weight-medium);line-height:var(--line-height-body);overflow-wrap:anywhere}.cx-alert__description{min-width:0;color:var(--opacity-high);font-size:var(--font-size-body);font-weight:var(--font-weight-regular);line-height:var(--line-height-body-relaxed);overflow-wrap:anywhere}.cx-alert__description:empty{display:none}.cx-alert__action{display:inline-flex;grid-column:2/-1;grid-row:2;justify-self:start}.cx-alert__dismiss{display:inline-flex;grid-column:3;grid-row:1;justify-self:end}"], dependencies: [{ kind: "component", type: CxButtonComponent, selector: "cx-button", inputs: ["text", "mood", "icon", "appendIcon", "shortcutParts", "href", "type", "size", "ariaLabel", "disabled", "transparent", "rounded", "loading"], outputs: ["pressed"] }, { kind: "component", type: CxIconButtonComponent, selector: "cx-icon-button", inputs: ["icon", "ariaLabel", "mood", "variant", "size", "selected", "ariaPressed", "rounded", "disabled", "badgeValue", "block", "loading", "countdown"], outputs: ["pressed", "countdownChange"] }, { kind: "component", type: CxIconComponent, selector: "cx-icon", inputs: ["icon", "size", "mood", "shape"] }, { kind: "component", type: CxSpinnerComponent, selector: "cx-spinner", inputs: ["mood", "ariaLabel", "segments", "value", "size"] }], changeDetection: i0.ChangeDetectionStrategy.OnPush });
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "22.0.8", ngImport: i0, type: CxAlertComponent, decorators: [{
            type: Component,
            args: [{ selector: 'cx-alert', imports: [CxButtonComponent, CxIconButtonComponent, CxIconComponent, CxSpinnerComponent], changeDetection: ChangeDetectionStrategy.OnPush, template: "@if (hasHeading()) {\n  <div class=\"cx-alert__surface\">\n    <div class=\"cx-alert__visual\" aria-hidden=\"true\">\n      @if (loading) {\n        <cx-spinner [mood]=\"mood\" aria-hidden=\"true\" />\n      } @else {\n        <cx-icon [icon]=\"resolvedIcon\" [size]=\"20\" />\n      }\n    </div>\n\n    <div class=\"cx-alert__content\">\n      <div class=\"cx-alert__heading\">{{ resolvedHeading }}</div>\n      <div class=\"cx-alert__description\"><ng-content /></div>\n    </div>\n\n    @if (visibleAction; as action) {\n      <cx-button\n        class=\"cx-alert__action\"\n        [text]=\"action.text.trim()\"\n        [href]=\"actionHref(action)\"\n        [mood]=\"actionMood\"\n        size=\"small\"\n        [rounded]=\"true\"\n        (pressed)=\"onActionSelect(action)\"\n      />\n    }\n\n    @if (dismissible) {\n      <cx-icon-button\n        class=\"cx-alert__dismiss\"\n        icon=\"remove\"\n        [ariaLabel]=\"dismissAriaLabel\"\n        size=\"small\"\n        [rounded]=\"true\"\n        (pressed)=\"onDismiss()\"\n      />\n    }\n  </div>\n}\n", styles: [":host{display:block;width:100%;--cx-alert-accent: var(--ink)}:host(.cx-alert--info){--cx-alert-accent: var(--info)}:host(.cx-alert--success){--cx-alert-accent: var(--success)}:host(.cx-alert--warning){--cx-alert-accent: var(--warning)}:host(.cx-alert--danger){--cx-alert-accent: var(--danger)}.cx-alert__surface{display:grid;grid-template-columns:24px minmax(0, 1fr) auto;width:100%;min-width:0;align-items:start;gap:var(--space-sm);padding:var(--space-md);border:var(--line-discreet);border-radius:var(--radius-xl);background:var(--surface);box-shadow:var(--shadow-low);box-sizing:border-box}.cx-alert__visual{display:inline-flex;grid-column:1;grid-row:1;width:24px;height:20px;align-items:center;justify-content:center;color:var(--cx-alert-accent)}.cx-alert__visual cx-spinner{width:20px;height:20px}.cx-alert__content{display:flex;grid-column:2;grid-row:1;min-width:0;flex-direction:column;gap:var(--space-2xs)}.cx-alert__heading{color:var(--cx-alert-accent);font-size:var(--font-size-body);font-weight:var(--font-weight-medium);line-height:var(--line-height-body);overflow-wrap:anywhere}.cx-alert__description{min-width:0;color:var(--opacity-high);font-size:var(--font-size-body);font-weight:var(--font-weight-regular);line-height:var(--line-height-body-relaxed);overflow-wrap:anywhere}.cx-alert__description:empty{display:none}.cx-alert__action{display:inline-flex;grid-column:2/-1;grid-row:2;justify-self:start}.cx-alert__dismiss{display:inline-flex;grid-column:3;grid-row:1;justify-self:end}"] }]
        }], propDecorators: { heading: [{
                type: Input
            }], mood: [{
                type: Input
            }], loading: [{
                type: Input
            }], action: [{
                type: Input
            }], dismissible: [{
                type: Input
            }], actionSelect: [{
                type: Output
            }], dismiss: [{
                type: Output
            }], hostClass: [{
                type: HostBinding,
                args: ['class']
            }], hostRole: [{
                type: HostBinding,
                args: ['attr.role']
            }], hostBusy: [{
                type: HostBinding,
                args: ['attr.aria-busy']
            }] } });
