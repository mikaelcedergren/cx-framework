import { isPlatformBrowser } from '@angular/common';
import { ChangeDetectionStrategy, Component, ElementRef, EventEmitter, Input, Output, PLATFORM_ID, ViewChild, inject, } from '@angular/core';
import { CxButtonComponent } from '../../actions/cx-button/index.js';
import { visibleCxFeedbackAction } from '../cx-feedback-action.js';
import { CxSpinnerComponent } from '../cx-spinner/index.js';
import { CxIconComponent } from '../../media/cx-icon/index.js';
import * as i0 from "@angular/core";
const CX_STATE_MESSAGE_PRESETS = {
    pending: {
        heading: 'Working on it',
        description: "Hold tight while we get this ready. We'll let you know when it's done.",
        icon: 'spinner',
    },
    success: {
        heading: 'All done',
        description: 'Everything went through. You can move on to the next step.',
        icon: 'check',
    },
    scheduled: {
        heading: 'Scheduled',
        description: 'This will run automatically at the scheduled time. You can cancel it if plans change.',
        icon: 'schedule',
    },
    danger: {
        heading: 'Something went wrong',
        description: 'Try again, or reach out to support if it keeps happening.',
        icon: 'error',
    },
};
const CX_STATE_MESSAGE_STATE_ACTIONS = {
    success: { text: 'Continue' },
    danger: { text: 'Try again' },
};
export class CxStateMessageComponent {
    browser = isPlatformBrowser(inject(PLATFORM_ID));
    measuredRegion;
    measuredOffset;
    messageBodyRef;
    iconRegionRef;
    heading = '';
    description;
    action;
    secondaryAction;
    state = 'default';
    visual = 'icon';
    layout = 'vertical';
    icon;
    actionEmitter = new EventEmitter();
    secondaryActionEmitter = new EventEmitter();
    ngAfterViewChecked() {
        this.syncIconInkOffset();
    }
    /** The state carries the mark that matches it; an icon of the consumer's own always wins. */
    get resolvedIcon() {
        return this.icon ?? this.resolvedPreset?.icon ?? 'placeholder';
    }
    get resolvedHeading() {
        const heading = this.heading.trim();
        if (heading) {
            return heading;
        }
        const preset = this.resolvedPreset;
        return preset?.heading ?? '';
    }
    get resolvedDescription() {
        const description = this.description?.trim();
        if (description) {
            return description;
        }
        const preset = this.resolvedPreset;
        return preset?.description ?? '';
    }
    get hasHeading() {
        return this.resolvedHeading.length > 0;
    }
    get hasDescription() {
        return this.resolvedDescription.length > 0;
    }
    get showSpinner() {
        return this.visual === 'icon' && this.state === 'pending';
    }
    get showIcon() {
        return this.visual === 'icon' && !this.showSpinner;
    }
    get visibleAction() {
        return this.visibleActionFor(this.action) ?? this.visibleActionFor(CX_STATE_MESSAGE_STATE_ACTIONS[this.state]);
    }
    get visibleSecondaryAction() {
        return this.visibleActionFor(this.secondaryAction);
    }
    hasActions() {
        return this.visibleAction !== undefined || this.visibleSecondaryAction !== undefined;
    }
    get resolvedPreset() {
        if (this.state === 'default') {
            return undefined;
        }
        return CX_STATE_MESSAGE_PRESETS[this.state];
    }
    visibleActionFor(action) {
        return visibleCxFeedbackAction(action);
    }
    resolveActionMood(action) {
        return action.mood ?? 'default';
    }
    onActionPressed(action) {
        this.actionEmitter.emit(action);
    }
    onSecondaryActionPressed(action) {
        this.secondaryActionEmitter.emit(action);
    }
    /**
     * A top-aligned mark reads as dropped unless its ink starts on the heading's cap
     * line. Both offsets are real and neither is knowable from CSS: an icon carries
     * its own air inside its box, and that air differs per glyph, while the heading
     * keeps half its leading above the caps. Publish the difference so the layout can
     * lift the mark by exactly that much.
     */
    syncIconInkOffset() {
        const region = this.iconRegionRef?.nativeElement;
        if (!this.browser || !region) {
            this.measuredRegion = undefined;
            this.measuredOffset = undefined;
            return;
        }
        const air = this.iconInkAir(region);
        const heading = this.messageBodyRef?.nativeElement.querySelector('.cx-state-message__heading');
        const offset = Math.max(0, air - (heading ? capLeading(heading) : 0));
        if (region === this.measuredRegion && offset === this.measuredOffset) {
            return;
        }
        region.style.setProperty('--cx-state-message-icon-ink', `${offset}px`);
        this.measuredRegion = region;
        this.measuredOffset = offset;
    }
    /** Blank space between the icon box's top edge and the first painted pixel of its glyph. */
    iconInkAir(region) {
        const svg = region.querySelector('svg');
        const height = svg?.getBoundingClientRect().height ?? 0;
        const viewBox = svg?.viewBox.baseVal;
        if (!svg || !height || !viewBox?.height) {
            return 0;
        }
        let ink;
        try {
            ink = svg.getBBox();
        }
        catch {
            return 0;
        }
        return ink.height ? ((ink.y - viewBox.y) / viewBox.height) * height : 0;
    }
    static ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "22.0.8", ngImport: i0, type: CxStateMessageComponent, deps: [], target: i0.ɵɵFactoryTarget.Component });
    static ɵcmp = i0.ɵɵngDeclareComponent({ minVersion: "17.0.0", version: "22.0.8", type: CxStateMessageComponent, isStandalone: true, selector: "cx-state-message", inputs: { heading: "heading", description: "description", action: "action", secondaryAction: "secondaryAction", state: "state", visual: "visual", layout: "layout", icon: "icon" }, outputs: { actionEmitter: "action", secondaryActionEmitter: "secondaryAction" }, host: { attributes: { "role": "status" }, properties: { "class.cx-state-message-host--success": "state === \"success\"", "class.cx-state-message-host--scheduled": "state === \"scheduled\"", "class.cx-state-message-host--danger": "state === \"danger\"", "attr.title": "null" } }, viewQueries: [{ propertyName: "messageBodyRef", first: true, predicate: ["messageBody"], descendants: true, read: ElementRef }, { propertyName: "iconRegionRef", first: true, predicate: ["iconRegion"], descendants: true, read: ElementRef }], ngImport: i0, template: "<div\n  class=\"cx-state-message\"\n  [class.cx-state-message--horizontal]=\"layout === 'horizontal'\"\n>\n  @if (showSpinner) {\n    <div class=\"cx-state-message__icon\">\n      <cx-spinner size=\"xlarge\" mood=\"default\" />\n    </div>\n  } @else if (showIcon) {\n    <div #iconRegion class=\"cx-state-message__icon\">\n      <cx-icon [icon]=\"resolvedIcon\" size=\"64\" />\n    </div>\n  }\n\n  <div #messageBody class=\"cx-state-message__body\">\n    @if (hasHeading) {\n      <div class=\"cx-state-message__heading\">{{ resolvedHeading }}</div>\n    }\n\n    @if (hasDescription) {\n      <div class=\"cx-state-message__text\">{{ resolvedDescription }}</div>\n    }\n\n    <ng-content />\n\n    @if (hasActions()) {\n      <div class=\"cx-state-message__actions\">\n        @if (visibleAction; as action) {\n          <cx-button\n            [text]=\"action.text\"\n            [mood]=\"resolveActionMood(action)\"\n            [icon]=\"action.icon\"\n            [appendIcon]=\"action.appendIcon\"\n            [disabled]=\"action.disabled ?? false\"\n            [loading]=\"action.loading ?? false\"\n            [ariaLabel]=\"action.ariaLabel\"\n            (pressed)=\"onActionPressed(action)\"\n          />\n        }\n        @if (visibleSecondaryAction; as action) {\n          <cx-button\n            [text]=\"action.text\"\n            [mood]=\"resolveActionMood(action)\"\n            [icon]=\"action.icon\"\n            [appendIcon]=\"action.appendIcon\"\n            [disabled]=\"action.disabled ?? false\"\n            [loading]=\"action.loading ?? false\"\n            [ariaLabel]=\"action.ariaLabel\"\n            (pressed)=\"onSecondaryActionPressed(action)\"\n          />\n        }\n      </div>\n    }\n  </div>\n</div>\n", styles: [":host{display:flex;flex:1;align-items:center;justify-content:center}:host(.cx-state-message-host--success) .cx-state-message__icon{color:var(--success)}:host(.cx-state-message-host--scheduled) .cx-state-message__icon{color:var(--ink)}:host(.cx-state-message-host--danger) .cx-state-message__icon{color:var(--danger)}.cx-state-message{display:flex;flex-direction:column;align-items:center;gap:var(--space-sm);padding:var(--space-xl);max-width:calc(var(--controller-size)*32);text-align:center}.cx-state-message__body{display:flex;flex-direction:column;align-items:center;align-self:stretch;gap:var(--space-sm)}.cx-state-message__icon{display:inline-flex;align-items:center;justify-content:center;padding-bottom:var(--space-sm);color:var(--opacity-mid)}.cx-state-message--horizontal{flex-direction:row;align-items:flex-start;gap:var(--space-lg);text-align:start}.cx-state-message--horizontal .cx-state-message__body{align-items:flex-start;flex:1;min-width:0}.cx-state-message--horizontal .cx-state-message__icon{padding-bottom:0;margin-top:calc(-1*var(--cx-state-message-icon-ink, 0px))}.cx-state-message--horizontal .cx-state-message__actions{justify-content:flex-start}.cx-state-message__heading{color:var(--ink);font-size:var(--font-size-title-3);font-weight:var(--font-weight-bold);line-height:var(--line-height-heading)}.cx-state-message__text{max-width:calc(var(--controller-size)*13);color:var(--opacity-high);font-size:var(--font-size-body);font-weight:var(--font-weight-regular);line-height:var(--line-height-body)}.cx-state-message__actions{display:inline-flex;flex-wrap:wrap;justify-content:center;gap:var(--space-sm);padding-top:var(--space-sm)}"], dependencies: [{ kind: "component", type: CxButtonComponent, selector: "cx-button", inputs: ["text", "mood", "icon", "appendIcon", "shortcutParts", "href", "type", "size", "ariaLabel", "disabled", "transparent", "rounded", "loading"], outputs: ["pressed"] }, { kind: "component", type: CxIconComponent, selector: "cx-icon", inputs: ["icon", "size", "mood", "shape"] }, { kind: "component", type: CxSpinnerComponent, selector: "cx-spinner", inputs: ["mood", "ariaLabel", "segments", "value", "size"] }], changeDetection: i0.ChangeDetectionStrategy.OnPush });
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "22.0.8", ngImport: i0, type: CxStateMessageComponent, decorators: [{
            type: Component,
            args: [{ selector: 'cx-state-message', imports: [CxButtonComponent, CxIconComponent, CxSpinnerComponent], host: {
                        role: 'status',
                        '[class.cx-state-message-host--success]': 'state === "success"',
                        '[class.cx-state-message-host--scheduled]': 'state === "scheduled"',
                        '[class.cx-state-message-host--danger]': 'state === "danger"',
                        '[attr.title]': 'null',
                    }, changeDetection: ChangeDetectionStrategy.OnPush, template: "<div\n  class=\"cx-state-message\"\n  [class.cx-state-message--horizontal]=\"layout === 'horizontal'\"\n>\n  @if (showSpinner) {\n    <div class=\"cx-state-message__icon\">\n      <cx-spinner size=\"xlarge\" mood=\"default\" />\n    </div>\n  } @else if (showIcon) {\n    <div #iconRegion class=\"cx-state-message__icon\">\n      <cx-icon [icon]=\"resolvedIcon\" size=\"64\" />\n    </div>\n  }\n\n  <div #messageBody class=\"cx-state-message__body\">\n    @if (hasHeading) {\n      <div class=\"cx-state-message__heading\">{{ resolvedHeading }}</div>\n    }\n\n    @if (hasDescription) {\n      <div class=\"cx-state-message__text\">{{ resolvedDescription }}</div>\n    }\n\n    <ng-content />\n\n    @if (hasActions()) {\n      <div class=\"cx-state-message__actions\">\n        @if (visibleAction; as action) {\n          <cx-button\n            [text]=\"action.text\"\n            [mood]=\"resolveActionMood(action)\"\n            [icon]=\"action.icon\"\n            [appendIcon]=\"action.appendIcon\"\n            [disabled]=\"action.disabled ?? false\"\n            [loading]=\"action.loading ?? false\"\n            [ariaLabel]=\"action.ariaLabel\"\n            (pressed)=\"onActionPressed(action)\"\n          />\n        }\n        @if (visibleSecondaryAction; as action) {\n          <cx-button\n            [text]=\"action.text\"\n            [mood]=\"resolveActionMood(action)\"\n            [icon]=\"action.icon\"\n            [appendIcon]=\"action.appendIcon\"\n            [disabled]=\"action.disabled ?? false\"\n            [loading]=\"action.loading ?? false\"\n            [ariaLabel]=\"action.ariaLabel\"\n            (pressed)=\"onSecondaryActionPressed(action)\"\n          />\n        }\n      </div>\n    }\n  </div>\n</div>\n", styles: [":host{display:flex;flex:1;align-items:center;justify-content:center}:host(.cx-state-message-host--success) .cx-state-message__icon{color:var(--success)}:host(.cx-state-message-host--scheduled) .cx-state-message__icon{color:var(--ink)}:host(.cx-state-message-host--danger) .cx-state-message__icon{color:var(--danger)}.cx-state-message{display:flex;flex-direction:column;align-items:center;gap:var(--space-sm);padding:var(--space-xl);max-width:calc(var(--controller-size)*32);text-align:center}.cx-state-message__body{display:flex;flex-direction:column;align-items:center;align-self:stretch;gap:var(--space-sm)}.cx-state-message__icon{display:inline-flex;align-items:center;justify-content:center;padding-bottom:var(--space-sm);color:var(--opacity-mid)}.cx-state-message--horizontal{flex-direction:row;align-items:flex-start;gap:var(--space-lg);text-align:start}.cx-state-message--horizontal .cx-state-message__body{align-items:flex-start;flex:1;min-width:0}.cx-state-message--horizontal .cx-state-message__icon{padding-bottom:0;margin-top:calc(-1*var(--cx-state-message-icon-ink, 0px))}.cx-state-message--horizontal .cx-state-message__actions{justify-content:flex-start}.cx-state-message__heading{color:var(--ink);font-size:var(--font-size-title-3);font-weight:var(--font-weight-bold);line-height:var(--line-height-heading)}.cx-state-message__text{max-width:calc(var(--controller-size)*13);color:var(--opacity-high);font-size:var(--font-size-body);font-weight:var(--font-weight-regular);line-height:var(--line-height-body)}.cx-state-message__actions{display:inline-flex;flex-wrap:wrap;justify-content:center;gap:var(--space-sm);padding-top:var(--space-sm)}"] }]
        }], propDecorators: { messageBodyRef: [{
                type: ViewChild,
                args: ['messageBody', { read: ElementRef }]
            }], iconRegionRef: [{
                type: ViewChild,
                args: ['iconRegion', { read: ElementRef }]
            }], heading: [{
                type: Input
            }], description: [{
                type: Input
            }], action: [{
                type: Input
            }], secondaryAction: [{
                type: Input
            }], state: [{
                type: Input
            }], visual: [{
                type: Input
            }], layout: [{
                type: Input
            }], icon: [{
                type: Input
            }], actionEmitter: [{
                type: Output,
                args: ['action']
            }], secondaryActionEmitter: [{
                type: Output,
                args: ['secondaryAction']
            }] } });
/** Blank space a line of text keeps above its cap height, from the font's own metrics. */
function capLeading(heading) {
    const style = getComputedStyle(heading);
    const context = document.createElement('canvas').getContext('2d');
    if (!context) {
        return 0;
    }
    context.font = `${style.fontWeight} ${style.fontSize}/${style.lineHeight} ${style.fontFamily}`;
    const metrics = context.measureText('H');
    const ascent = metrics.fontBoundingBoxAscent;
    const descent = metrics.fontBoundingBoxDescent;
    const cap = metrics.actualBoundingBoxAscent;
    if (!ascent || !cap) {
        return 0;
    }
    const lineHeight = Number.parseFloat(style.lineHeight);
    const halfLeading = Number.isFinite(lineHeight) ? (lineHeight - (ascent + descent)) / 2 : 0;
    return Math.max(0, halfLeading + (ascent - cap));
}
