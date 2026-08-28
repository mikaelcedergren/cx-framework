import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output, signal } from '@angular/core';
import { CxIconComponent } from '../../media/cx-icon/index.js';
import { CxTooltipDirective } from '../../overlay/cx-tooltip/index.js';
import * as i0 from "@angular/core";
export class CxToggleButtonComponent {
    selectedState = signal(false, /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "selectedState" }] : /* istanbul ignore next */ []));
    text = '';
    icon;
    iconSelected;
    size = 'default';
    ariaLabel;
    disabled = false;
    set selected(value) {
        this.selectedState.set(value);
    }
    selectedChange = new EventEmitter();
    selected$ = this.selectedState.asReadonly();
    get displayIcon() {
        return this.selectedState() && this.iconSelected ? this.iconSelected : this.icon;
    }
    get visibleText() {
        return this.text.trim();
    }
    get hasVisibleContent() {
        return Boolean(this.visibleText || this.icon);
    }
    get isIconOnly() {
        return !this.visibleText && Boolean(this.icon);
    }
    get resolvedAriaLabel() {
        const label = this.ariaLabel?.trim();
        if (label) {
            return label;
        }
        if (this.visibleText || !this.icon) {
            return null;
        }
        return this.icon
            ?.split('-')
            .filter(Boolean)
            .map(part => part.charAt(0).toUpperCase() + part.slice(1))
            .join(' ') ?? 'Toggle';
    }
    toggle() {
        if (this.disabled) {
            return;
        }
        this.selectedState.update(current => !current);
        this.selectedChange.emit(this.selectedState());
    }
    static ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "22.0.8", ngImport: i0, type: CxToggleButtonComponent, deps: [], target: i0.ɵɵFactoryTarget.Component });
    static ɵcmp = i0.ɵɵngDeclareComponent({ minVersion: "17.0.0", version: "22.0.8", type: CxToggleButtonComponent, isStandalone: true, selector: "cx-toggle-button", inputs: { text: "text", icon: "icon", iconSelected: "iconSelected", size: "size", ariaLabel: "ariaLabel", disabled: "disabled", selected: "selected" }, outputs: { selectedChange: "selectedChange" }, host: { properties: { "class.cx-toggle-button-host--small": "size === 'small'" } }, ngImport: i0, template: "@if (hasVisibleContent) {\n  <button\n    type=\"button\"\n    class=\"cx-toggle-button\"\n    [class.cx-toggle-button--selected]=\"selected$()\"\n    [class.cx-toggle-button--icon-only]=\"isIconOnly\"\n    [disabled]=\"disabled\"\n    [attr.aria-pressed]=\"selected$()\"\n    [attr.aria-label]=\"resolvedAriaLabel\"\n    [cxTooltip]=\"visibleText\"\n    [cxTooltipOverflow]=\"true\"\n    (click)=\"toggle()\"\n  >\n    @if (displayIcon; as iconName) {\n      <cx-icon class=\"cx-toggle-button__icon\" [icon]=\"iconName\" [size]=\"size === 'small' ? '14' : '16'\" aria-hidden=\"true\" />\n    }\n    @if (visibleText) {\n      <span data-cx-tooltip-overflow>{{ visibleText }}</span>\n    }\n  </button>\n}\n", styles: [":host{display:inline-flex;width:max-content;min-width:0;max-width:100%}.cx-toggle-button{box-sizing:border-box;display:inline-flex;width:100%;min-width:0;max-width:100%;min-height:var(--controller-size);align-items:center;justify-content:center;gap:var(--space-2xs);padding:0 var(--space-md);border:0;border-radius:var(--radius-md);background:var(--opacity-low);color:var(--ink);cursor:pointer;font-family:inherit;font-size:var(--font-size-body);font-weight:var(--font-weight-medium);line-height:1;margin:0;outline:none;transform-origin:center;transition:background-color var(--motion-fast) ease,box-shadow var(--motion-fast) ease,color var(--motion-fast) ease,opacity var(--motion-fast) ease,transform var(--motion-fast) ease;white-space:nowrap}.cx-toggle-button:hover:not(:disabled){background:var(--opacity-mid)}.cx-toggle-button--selected,.cx-toggle-button--selected:hover:not(:disabled){background:var(--emphasis);color:var(--on-emphasis);box-shadow:var(--shadow-low)}.cx-toggle-button:focus-visible{outline:var(--outline-tab);outline-offset:var(--outline-tab-offset)}.cx-toggle-button:active:not(:disabled){outline:var(--outline-active);outline-offset:var(--outline-active-offset);transform:scale(0.98)}.cx-toggle-button:disabled{opacity:var(--opacity-disabled);cursor:not-allowed}.cx-toggle-button--icon-only{min-width:var(--controller-size);padding:0}.cx-toggle-button span{min-width:0;overflow:hidden;text-overflow:ellipsis}:host(.cx-toggle-button-host--small) .cx-toggle-button{min-height:var(--controller-size-small);padding:0 var(--space-sm);font-size:var(--font-size-body-sm)}:host(.cx-toggle-button-host--small) .cx-toggle-button--icon-only{min-width:var(--controller-size-small);padding:0}"], dependencies: [{ kind: "component", type: CxIconComponent, selector: "cx-icon", inputs: ["icon", "size", "mood", "shape"] }, { kind: "directive", type: CxTooltipDirective, selector: "[cxTooltip]", inputs: ["cxTooltip", "cxTooltipPosition", "cxTooltipDelay", "cxTooltipDisabled", "cxTooltipOverflow"] }], changeDetection: i0.ChangeDetectionStrategy.OnPush });
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "22.0.8", ngImport: i0, type: CxToggleButtonComponent, decorators: [{
            type: Component,
            args: [{ selector: 'cx-toggle-button', imports: [CxIconComponent, CxTooltipDirective], host: {
                        '[class.cx-toggle-button-host--small]': "size === 'small'",
                    }, changeDetection: ChangeDetectionStrategy.OnPush, template: "@if (hasVisibleContent) {\n  <button\n    type=\"button\"\n    class=\"cx-toggle-button\"\n    [class.cx-toggle-button--selected]=\"selected$()\"\n    [class.cx-toggle-button--icon-only]=\"isIconOnly\"\n    [disabled]=\"disabled\"\n    [attr.aria-pressed]=\"selected$()\"\n    [attr.aria-label]=\"resolvedAriaLabel\"\n    [cxTooltip]=\"visibleText\"\n    [cxTooltipOverflow]=\"true\"\n    (click)=\"toggle()\"\n  >\n    @if (displayIcon; as iconName) {\n      <cx-icon class=\"cx-toggle-button__icon\" [icon]=\"iconName\" [size]=\"size === 'small' ? '14' : '16'\" aria-hidden=\"true\" />\n    }\n    @if (visibleText) {\n      <span data-cx-tooltip-overflow>{{ visibleText }}</span>\n    }\n  </button>\n}\n", styles: [":host{display:inline-flex;width:max-content;min-width:0;max-width:100%}.cx-toggle-button{box-sizing:border-box;display:inline-flex;width:100%;min-width:0;max-width:100%;min-height:var(--controller-size);align-items:center;justify-content:center;gap:var(--space-2xs);padding:0 var(--space-md);border:0;border-radius:var(--radius-md);background:var(--opacity-low);color:var(--ink);cursor:pointer;font-family:inherit;font-size:var(--font-size-body);font-weight:var(--font-weight-medium);line-height:1;margin:0;outline:none;transform-origin:center;transition:background-color var(--motion-fast) ease,box-shadow var(--motion-fast) ease,color var(--motion-fast) ease,opacity var(--motion-fast) ease,transform var(--motion-fast) ease;white-space:nowrap}.cx-toggle-button:hover:not(:disabled){background:var(--opacity-mid)}.cx-toggle-button--selected,.cx-toggle-button--selected:hover:not(:disabled){background:var(--emphasis);color:var(--on-emphasis);box-shadow:var(--shadow-low)}.cx-toggle-button:focus-visible{outline:var(--outline-tab);outline-offset:var(--outline-tab-offset)}.cx-toggle-button:active:not(:disabled){outline:var(--outline-active);outline-offset:var(--outline-active-offset);transform:scale(0.98)}.cx-toggle-button:disabled{opacity:var(--opacity-disabled);cursor:not-allowed}.cx-toggle-button--icon-only{min-width:var(--controller-size);padding:0}.cx-toggle-button span{min-width:0;overflow:hidden;text-overflow:ellipsis}:host(.cx-toggle-button-host--small) .cx-toggle-button{min-height:var(--controller-size-small);padding:0 var(--space-sm);font-size:var(--font-size-body-sm)}:host(.cx-toggle-button-host--small) .cx-toggle-button--icon-only{min-width:var(--controller-size-small);padding:0}"] }]
        }], propDecorators: { text: [{
                type: Input
            }], icon: [{
                type: Input
            }], iconSelected: [{
                type: Input
            }], size: [{
                type: Input
            }], ariaLabel: [{
                type: Input
            }], disabled: [{
                type: Input
            }], selected: [{
                type: Input
            }], selectedChange: [{
                type: Output
            }] } });
