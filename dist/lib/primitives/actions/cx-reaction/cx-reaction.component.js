import { NgTemplateOutlet } from '@angular/common';
import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { CxIconComponent } from '../../media/cx-icon/index.js';
import * as i0 from "@angular/core";
/**
 * A compact toggle for reacting with an icon and showing a running count.
 * `selected` reflects whether the current user has reacted; the component is
 * controlled, emitting the intended next value through `selectedChange`.
 */
export class CxReactionComponent {
    icon = 'thumbs-up';
    count = 0;
    selected = false;
    size = 'default';
    disabled = false;
    readonly = false;
    ariaLabel = 'React';
    selectedChange = new EventEmitter();
    get hasCount() {
        return this.count > 0;
    }
    get resolvedIconSize() {
        if (this.size === 'small') {
            return '14';
        }
        if (this.size === 'large') {
            return '20';
        }
        return '16';
    }
    toggle() {
        if (this.disabled || this.readonly) {
            return;
        }
        this.selectedChange.emit(!this.selected);
    }
    static ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "22.0.8", ngImport: i0, type: CxReactionComponent, deps: [], target: i0.ɵɵFactoryTarget.Component });
    static ɵcmp = i0.ɵɵngDeclareComponent({ minVersion: "17.0.0", version: "22.0.8", type: CxReactionComponent, isStandalone: true, selector: "cx-reaction", inputs: { icon: "icon", count: "count", selected: "selected", size: "size", disabled: "disabled", readonly: "readonly", ariaLabel: "ariaLabel" }, outputs: { selectedChange: "selectedChange" }, host: { properties: { "class.cx-reaction-host--small": "size === 'small'", "class.cx-reaction-host--large": "size === 'large'" } }, ngImport: i0, template: "@if (readonly) {\n  <span\n    class=\"cx-reaction cx-reaction--readonly\"\n    [class.cx-reaction--selected]=\"selected\"\n    role=\"img\"\n    [attr.aria-label]=\"ariaLabel\"\n  >\n    <ng-container [ngTemplateOutlet]=\"body\" />\n  </span>\n} @else {\n  <button\n    class=\"cx-reaction\"\n    type=\"button\"\n    [class.cx-reaction--selected]=\"selected\"\n    [disabled]=\"disabled\"\n    [attr.aria-pressed]=\"selected\"\n    [attr.aria-label]=\"ariaLabel\"\n    (click)=\"toggle()\"\n  >\n    <ng-container [ngTemplateOutlet]=\"body\" />\n  </button>\n}\n\n<ng-template #body>\n  <cx-icon\n    class=\"cx-reaction__icon\"\n    [icon]=\"icon\"\n    [size]=\"resolvedIconSize\"\n    aria-hidden=\"true\"\n  />\n  @if (hasCount) {\n    <span class=\"cx-reaction__count\">{{ count }}</span>\n  }\n</ng-template>\n", styles: [":host{display:inline-flex}.cx-reaction{display:inline-flex;align-items:center;gap:var(--space-2xs);height:var(--controller-size);padding:0 var(--space-sm);border:var(--border-width) solid var(--opacity-mid);border-radius:var(--radius-pill);corner-shape:round;background:rgba(0,0,0,0);color:var(--ink);font-family:inherit;font-size:var(--font-size-body);line-height:var(--line-height-small);cursor:pointer;transition:border-color var(--motion-fast) ease,background-color var(--motion-fast) ease,transform var(--motion-fast) ease}.cx-reaction__icon{flex:0 0 auto}.cx-reaction__count{color:var(--opacity-high);font-variant-numeric:tabular-nums;font-weight:var(--font-weight-medium)}button.cx-reaction:hover{border-color:var(--border-hover);background:var(--opacity-low)}button.cx-reaction:focus-visible{outline:var(--outline-tab);outline-offset:2px}button.cx-reaction:active{transform:scale(0.96)}.cx-reaction--selected{border-color:var(--primary);background:var(--primary-opacity)}.cx-reaction--selected .cx-reaction__count{color:var(--primary)}button.cx-reaction--selected:hover{border-color:var(--primary);background:var(--primary-opacity)}button.cx-reaction:disabled{opacity:var(--opacity-disabled);cursor:not-allowed}.cx-reaction--readonly{cursor:default}:host(.cx-reaction-host--small) .cx-reaction{height:calc(var(--controller-size) - var(--space-sm));padding:0 var(--space-xs);font-size:var(--font-size-body-sm)}:host(.cx-reaction-host--large) .cx-reaction{height:calc(var(--controller-size) + var(--space-sm));padding:0 var(--space-md);font-size:var(--font-size-body-lg)}"], dependencies: [{ kind: "directive", type: NgTemplateOutlet, selector: "[ngTemplateOutlet]", inputs: ["ngTemplateOutletContext", "ngTemplateOutlet", "ngTemplateOutletInjector"] }, { kind: "component", type: CxIconComponent, selector: "cx-icon", inputs: ["icon", "size", "mood", "shape"] }], changeDetection: i0.ChangeDetectionStrategy.OnPush });
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "22.0.8", ngImport: i0, type: CxReactionComponent, decorators: [{
            type: Component,
            args: [{ selector: 'cx-reaction', imports: [NgTemplateOutlet, CxIconComponent], host: {
                        '[class.cx-reaction-host--small]': "size === 'small'",
                        '[class.cx-reaction-host--large]': "size === 'large'",
                    }, changeDetection: ChangeDetectionStrategy.OnPush, template: "@if (readonly) {\n  <span\n    class=\"cx-reaction cx-reaction--readonly\"\n    [class.cx-reaction--selected]=\"selected\"\n    role=\"img\"\n    [attr.aria-label]=\"ariaLabel\"\n  >\n    <ng-container [ngTemplateOutlet]=\"body\" />\n  </span>\n} @else {\n  <button\n    class=\"cx-reaction\"\n    type=\"button\"\n    [class.cx-reaction--selected]=\"selected\"\n    [disabled]=\"disabled\"\n    [attr.aria-pressed]=\"selected\"\n    [attr.aria-label]=\"ariaLabel\"\n    (click)=\"toggle()\"\n  >\n    <ng-container [ngTemplateOutlet]=\"body\" />\n  </button>\n}\n\n<ng-template #body>\n  <cx-icon\n    class=\"cx-reaction__icon\"\n    [icon]=\"icon\"\n    [size]=\"resolvedIconSize\"\n    aria-hidden=\"true\"\n  />\n  @if (hasCount) {\n    <span class=\"cx-reaction__count\">{{ count }}</span>\n  }\n</ng-template>\n", styles: [":host{display:inline-flex}.cx-reaction{display:inline-flex;align-items:center;gap:var(--space-2xs);height:var(--controller-size);padding:0 var(--space-sm);border:var(--border-width) solid var(--opacity-mid);border-radius:var(--radius-pill);corner-shape:round;background:rgba(0,0,0,0);color:var(--ink);font-family:inherit;font-size:var(--font-size-body);line-height:var(--line-height-small);cursor:pointer;transition:border-color var(--motion-fast) ease,background-color var(--motion-fast) ease,transform var(--motion-fast) ease}.cx-reaction__icon{flex:0 0 auto}.cx-reaction__count{color:var(--opacity-high);font-variant-numeric:tabular-nums;font-weight:var(--font-weight-medium)}button.cx-reaction:hover{border-color:var(--border-hover);background:var(--opacity-low)}button.cx-reaction:focus-visible{outline:var(--outline-tab);outline-offset:2px}button.cx-reaction:active{transform:scale(0.96)}.cx-reaction--selected{border-color:var(--primary);background:var(--primary-opacity)}.cx-reaction--selected .cx-reaction__count{color:var(--primary)}button.cx-reaction--selected:hover{border-color:var(--primary);background:var(--primary-opacity)}button.cx-reaction:disabled{opacity:var(--opacity-disabled);cursor:not-allowed}.cx-reaction--readonly{cursor:default}:host(.cx-reaction-host--small) .cx-reaction{height:calc(var(--controller-size) - var(--space-sm));padding:0 var(--space-xs);font-size:var(--font-size-body-sm)}:host(.cx-reaction-host--large) .cx-reaction{height:calc(var(--controller-size) + var(--space-sm));padding:0 var(--space-md);font-size:var(--font-size-body-lg)}"] }]
        }], propDecorators: { icon: [{
                type: Input
            }], count: [{
                type: Input
            }], selected: [{
                type: Input
            }], size: [{
                type: Input
            }], disabled: [{
                type: Input
            }], readonly: [{
                type: Input
            }], ariaLabel: [{
                type: Input
            }], selectedChange: [{
                type: Output
            }] } });
