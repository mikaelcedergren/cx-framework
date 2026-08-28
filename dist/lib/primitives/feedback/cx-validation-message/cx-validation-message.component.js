import { ChangeDetectionStrategy, Component, Input, computed, signal } from '@angular/core';
import { CxAlertComponent } from '../cx-alert/index.js';
import { CxIconComponent } from '../../media/cx-icon/index.js';
import { normalizeCxValidationMessages, } from '../../inputs/shared/field.types.js';
import * as i0 from "@angular/core";
const VALIDATION_ALERT_MOOD = {
    status: 'default',
    info: 'info',
    success: 'success',
    warning: 'warning',
    error: 'danger',
};
export class CxValidationMessageComponent {
    displayState = signal('inline', /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "displayState" }] : /* istanbul ignore next */ []));
    showAllState = signal(false, /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "showAllState" }] : /* istanbul ignore next */ []));
    messagesState = signal([
        { type: 'error', message: 'This field is required.' },
    ], /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "messagesState" }] : /* istanbul ignore next */ []));
    set type(value) {
        this.displayState.set(value === 'global' ? 'global' : 'inline');
    }
    set showAll(value) {
        this.showAllState.set(value === true);
    }
    set messages(value) {
        this.messagesState.set(value ?? []);
    }
    display$ = this.displayState.asReadonly();
    messages$ = computed(() => {
        const normalized = normalizeCxValidationMessages(this.messagesState());
        return this.showAllState() ? normalized : normalized.slice(0, 1);
    }, /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "messages$" }] : /* istanbul ignore next */ []));
    iconFor(type) {
        switch (type) {
            case 'status':
                return null;
            case 'success':
                return 'check';
            case 'warning':
                return 'warning';
            case 'error':
                return 'error';
            case 'info':
            default:
                return 'info';
        }
    }
    roleFor(type) {
        return type === 'error' || type === 'warning' ? 'alert' : 'status';
    }
    alertMoodFor(type) {
        return VALIDATION_ALERT_MOOD[type];
    }
    static ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "22.0.8", ngImport: i0, type: CxValidationMessageComponent, deps: [], target: i0.ɵɵFactoryTarget.Component });
    static ɵcmp = i0.ɵɵngDeclareComponent({ minVersion: "17.0.0", version: "22.0.8", type: CxValidationMessageComponent, isStandalone: true, selector: "cx-validation-message", inputs: { type: "type", showAll: "showAll", messages: "messages" }, host: { properties: { "class.cx-validation-message--inline": "display$() === 'inline'", "class.cx-validation-message--global": "display$() === 'global'" }, classAttribute: "cx-validation-message" }, ngImport: i0, template: "@if (messages$(); as messages) {\n  @if (messages.length > 0) {\n    @if (display$() === 'global') {\n      <div class=\"cx-validation-message__list cx-validation-message__list--global\">\n        @for (item of messages; track item.id) {\n          <cx-alert [mood]=\"alertMoodFor(item.type)\" [heading]=\"item.message\" />\n        }\n      </div>\n    } @else {\n      <div class=\"cx-validation-message__list cx-validation-message__list--inline\">\n        @for (item of messages; track item.id) {\n          <div\n            class=\"cx-validation-message__item\"\n            [class.cx-validation-message__item--status]=\"item.type === 'status'\"\n            [class.cx-validation-message__item--info]=\"item.type === 'info'\"\n            [class.cx-validation-message__item--success]=\"item.type === 'success'\"\n            [class.cx-validation-message__item--warning]=\"item.type === 'warning'\"\n            [class.cx-validation-message__item--error]=\"item.type === 'error'\"\n            [class.cx-validation-message__item--without-icon]=\"!iconFor(item.type)\"\n            [attr.role]=\"roleFor(item.type)\"\n          >\n            @if (iconFor(item.type); as icon) {\n              <cx-icon class=\"cx-validation-message__icon\" [icon]=\"icon\" [size]=\"14\" />\n            }\n            <span class=\"cx-validation-message__text\">{{ item.message }}</span>\n          </div>\n        }\n      </div>\n    }\n  }\n}\n", styles: [":host{display:block}:host(.cx-validation-message--global){width:100%}.cx-validation-message__list{display:flex;flex-direction:column}.cx-validation-message__list--inline{gap:var(--space-xs)}.cx-validation-message__list--global{gap:var(--space-sm)}.cx-validation-message__item{display:flex;flex-direction:row;align-items:center;gap:var(--space-xs);color:var(--opacity-high);font-size:var(--font-size-body-sm);font-weight:var(--font-weight-regular);line-height:var(--line-height-small)}.cx-validation-message__item--without-icon{display:block}.cx-validation-message__item--status{color:var(--opacity-high)}.cx-validation-message__item--info{color:var(--info)}.cx-validation-message__item--success{color:var(--success)}.cx-validation-message__item--warning{color:var(--warning)}.cx-validation-message__item--error{color:var(--danger)}.cx-validation-message__icon{display:inline-flex;flex:0 0 auto}.cx-validation-message__text{min-width:0;overflow-wrap:anywhere}"], dependencies: [{ kind: "component", type: CxAlertComponent, selector: "cx-alert", inputs: ["heading", "mood", "loading", "action", "dismissible"], outputs: ["actionSelect", "dismiss"] }, { kind: "component", type: CxIconComponent, selector: "cx-icon", inputs: ["icon", "size", "mood", "shape"] }], changeDetection: i0.ChangeDetectionStrategy.OnPush });
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "22.0.8", ngImport: i0, type: CxValidationMessageComponent, decorators: [{
            type: Component,
            args: [{ selector: 'cx-validation-message', host: {
                        class: 'cx-validation-message',
                        '[class.cx-validation-message--inline]': "display$() === 'inline'",
                        '[class.cx-validation-message--global]': "display$() === 'global'",
                    }, imports: [CxAlertComponent, CxIconComponent], changeDetection: ChangeDetectionStrategy.OnPush, template: "@if (messages$(); as messages) {\n  @if (messages.length > 0) {\n    @if (display$() === 'global') {\n      <div class=\"cx-validation-message__list cx-validation-message__list--global\">\n        @for (item of messages; track item.id) {\n          <cx-alert [mood]=\"alertMoodFor(item.type)\" [heading]=\"item.message\" />\n        }\n      </div>\n    } @else {\n      <div class=\"cx-validation-message__list cx-validation-message__list--inline\">\n        @for (item of messages; track item.id) {\n          <div\n            class=\"cx-validation-message__item\"\n            [class.cx-validation-message__item--status]=\"item.type === 'status'\"\n            [class.cx-validation-message__item--info]=\"item.type === 'info'\"\n            [class.cx-validation-message__item--success]=\"item.type === 'success'\"\n            [class.cx-validation-message__item--warning]=\"item.type === 'warning'\"\n            [class.cx-validation-message__item--error]=\"item.type === 'error'\"\n            [class.cx-validation-message__item--without-icon]=\"!iconFor(item.type)\"\n            [attr.role]=\"roleFor(item.type)\"\n          >\n            @if (iconFor(item.type); as icon) {\n              <cx-icon class=\"cx-validation-message__icon\" [icon]=\"icon\" [size]=\"14\" />\n            }\n            <span class=\"cx-validation-message__text\">{{ item.message }}</span>\n          </div>\n        }\n      </div>\n    }\n  }\n}\n", styles: [":host{display:block}:host(.cx-validation-message--global){width:100%}.cx-validation-message__list{display:flex;flex-direction:column}.cx-validation-message__list--inline{gap:var(--space-xs)}.cx-validation-message__list--global{gap:var(--space-sm)}.cx-validation-message__item{display:flex;flex-direction:row;align-items:center;gap:var(--space-xs);color:var(--opacity-high);font-size:var(--font-size-body-sm);font-weight:var(--font-weight-regular);line-height:var(--line-height-small)}.cx-validation-message__item--without-icon{display:block}.cx-validation-message__item--status{color:var(--opacity-high)}.cx-validation-message__item--info{color:var(--info)}.cx-validation-message__item--success{color:var(--success)}.cx-validation-message__item--warning{color:var(--warning)}.cx-validation-message__item--error{color:var(--danger)}.cx-validation-message__icon{display:inline-flex;flex:0 0 auto}.cx-validation-message__text{min-width:0;overflow-wrap:anywhere}"] }]
        }], propDecorators: { type: [{
                type: Input
            }], showAll: [{
                type: Input
            }], messages: [{
                type: Input
            }] } });
