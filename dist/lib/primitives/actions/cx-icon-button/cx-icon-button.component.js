import { ChangeDetectionStrategy, Component, EventEmitter, HostBinding, Input, Output } from '@angular/core';
import { CxIconComponent } from '../../media/cx-icon/index.js';
import { CxSpinnerComponent } from '../../feedback/cx-spinner/index.js';
import { CxBadgeComponent } from '../../display/cx-badge/index.js';
import { createCountdownState } from '../shared/countdown-state.js';
import { createDelayedLoadingState } from '../shared/delayed-loading-state.js';
import * as i0 from "@angular/core";
export class CxIconButtonComponent {
    icon = 'info';
    ariaLabel = 'Icon button';
    /** Optional semantic role when the button participates in a composite widget such as a menu. */
    role;
    ariaHasPopup;
    ariaExpanded;
    ariaControls;
    mood = 'default';
    variant = 'default';
    size = 'default';
    selected = false;
    ariaPressed;
    rounded = false;
    disabled = false;
    badgeValue;
    /** Stretch to the full width of the host's container (e.g. a full-row add button). */
    block = false;
    get blockClass() {
        return this.block;
    }
    pressed = new EventEmitter();
    countdownChange = new EventEmitter();
    delayedLoading = createDelayedLoadingState(0);
    // 6000ms must match the 6s countdown ring animation in the component SCSS.
    countdownState = createCountdownState(6000, () => {
        this.countdownChange.emit(false);
    });
    set loading(value) {
        this.delayedLoading.sync(Boolean(value));
    }
    set countdown(value) {
        this.countdownState.sync(Boolean(value));
    }
    loading$ = this.delayedLoading.loading$;
    showSpinner$ = this.delayedLoading.showSpinner$;
    countdownActive$ = this.countdownState.active$;
    hasBadge() {
        return this.badgeValue !== undefined;
    }
    hasBadgeCount() {
        return this.badgeCount() !== undefined;
    }
    badgeCount() {
        const value = this.badgeValue?.trim();
        if (!value) {
            return undefined;
        }
        const count = Number(value);
        return Number.isInteger(count) && count >= 0 ? count : undefined;
    }
    ngOnDestroy() {
        this.delayedLoading.destroy();
        this.countdownState.destroy();
    }
    onClick() {
        if (this.disabled || this.loading$() || this.countdownActive$()) {
            return;
        }
        this.pressed.emit();
    }
    static ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "22.0.8", ngImport: i0, type: CxIconButtonComponent, deps: [], target: i0.ɵɵFactoryTarget.Component });
    static ɵcmp = i0.ɵɵngDeclareComponent({ minVersion: "17.0.0", version: "22.0.8", type: CxIconButtonComponent, isStandalone: true, selector: "cx-icon-button", inputs: { icon: "icon", ariaLabel: "ariaLabel", role: "role", ariaHasPopup: "ariaHasPopup", ariaExpanded: "ariaExpanded", ariaControls: "ariaControls", mood: "mood", variant: "variant", size: "size", selected: "selected", ariaPressed: "ariaPressed", rounded: "rounded", disabled: "disabled", badgeValue: "badgeValue", block: "block", loading: "loading", countdown: "countdown" }, outputs: { pressed: "pressed", countdownChange: "countdownChange" }, host: { properties: { "class.cx-icon-button--block": "this.blockClass" } }, ngImport: i0, template: "<button\n  type=\"button\"\n  class=\"cx-icon-button\"\n  [class.cx-icon-button--default]=\"mood === 'default'\"\n  [class.cx-icon-button--primary]=\"mood === 'primary'\"\n  [class.cx-icon-button--accent]=\"mood === 'accent'\"\n  [class.cx-icon-button--info]=\"mood === 'info'\"\n  [class.cx-icon-button--warning]=\"mood === 'warning'\"\n  [class.cx-icon-button--danger]=\"mood === 'danger'\"\n  [class.cx-icon-button--success]=\"mood === 'success'\"\n  [class.cx-icon-button--emphasis]=\"variant === 'emphasis'\"\n  [class.cx-icon-button--transparent]=\"variant === 'transparent'\"\n  [class.cx-icon-button--small]=\"size === 'small'\"\n  [class.cx-icon-button--selected]=\"selected\"\n  [class.cx-icon-button--rounded]=\"rounded\"\n  [class.cx-icon-button--disabled]=\"disabled\"\n  [class.cx-icon-button--loading]=\"showSpinner$()\"\n  [class.cx-icon-button--countdown]=\"countdownActive$()\"\n  [class.cx-icon-button--with-badge]=\"hasBadge()\"\n  [class.cx-icon-button--with-dot-badge]=\"hasBadge() && !hasBadgeCount()\"\n  [class.cx-icon-button--with-badge-value]=\"hasBadgeCount()\"\n  [disabled]=\"disabled || loading$() || countdownActive$()\"\n  [attr.role]=\"role || null\"\n  [attr.aria-label]=\"ariaLabel\"\n  [attr.aria-pressed]=\"ariaPressed === undefined ? (selected ? true : null) : ariaPressed\"\n  [attr.aria-haspopup]=\"ariaHasPopup || null\"\n  [attr.aria-expanded]=\"ariaExpanded === undefined ? null : ariaExpanded\"\n  [attr.aria-controls]=\"ariaControls || null\"\n  [attr.aria-busy]=\"loading$() ? 'true' : null\"\n  (click)=\"onClick()\"\n>\n  @if (countdownActive$()) {\n    <span class=\"cx-icon-button__countdown\" aria-hidden=\"true\">\n      <svg class=\"cx-icon-button__countdown-svg\" viewBox=\"0 0 16 16\">\n        <circle class=\"cx-icon-button__countdown-track\" cx=\"8\" cy=\"8\" r=\"6\" pathLength=\"6\" />\n        <circle class=\"cx-icon-button__countdown-progress\" cx=\"8\" cy=\"8\" r=\"6\" pathLength=\"6\" />\n      </svg>\n    </span>\n  } @else if (showSpinner$()) {\n    <span class=\"cx-icon-button__spinner-box\" aria-hidden=\"true\">\n      <cx-spinner mood=\"default\" size=\"auto\" />\n    </span>\n  } @else {\n    <cx-icon class=\"cx-icon-button__icon\" [icon]=\"icon\" [size]=\"size === 'small' ? 12 : 16\" />\n  }\n\n  @if (hasBadge()) {\n    <!-- The wrapper anchors the bare indicator outside the background cutout. -->\n    <span class=\"cx-icon-button__badge\" aria-hidden=\"true\">\n      <cx-badge placement=\"inline\" [count]=\"badgeCount()\" />\n    </span>\n  }\n</button>\n", styles: [":host{display:inline-flex;width:auto}:host(.cx-icon-button--block),:host(.cx-icon-button--block) .cx-icon-button{width:100%}.cx-icon-button{position:relative;isolation:isolate;display:inline-flex;width:var(--controller-size);height:var(--controller-size);align-items:center;justify-content:center;padding:0;border:0;border-radius:var(--radius-sm);background:rgba(0,0,0,0);color:var(--ink);cursor:pointer;margin:0;outline:none;overflow:visible;transform-origin:center;transition:background-color var(--motion-fast) ease,color var(--motion-fast) ease,opacity var(--motion-fast) ease,transform var(--motion-fast) ease}.cx-icon-button--small{width:var(--controller-size-small);height:var(--controller-size-small)}.cx-icon-button--rounded{border-radius:var(--radius-pill);corner-shape:round}.cx-icon-button--default::before{background:var(--opacity-low)}.cx-icon-button--default{color:var(--ink)}.cx-icon-button:hover.cx-icon-button--default:not(.cx-icon-button--disabled)::before{background:var(--opacity-mid)}.cx-icon-button--transparent::before{background:rgba(0,0,0,0)}.cx-icon-button--transparent{color:inherit}.cx-icon-button:hover.cx-icon-button--transparent:not(.cx-icon-button--disabled)::before{background:var(--opacity-low)}.cx-icon-button--primary::before{background:var(--primary)}.cx-icon-button--primary{color:var(--on-ink)}.cx-icon-button:hover.cx-icon-button--primary:not(.cx-icon-button--disabled)::before{background:var(--primary-alt)}.cx-icon-button--accent::before{background:var(--accent)}.cx-icon-button--accent{color:var(--surface)}.cx-icon-button:hover.cx-icon-button--accent:not(.cx-icon-button--disabled)::before{background:var(--accent-alt)}.cx-icon-button--info::before{background:var(--info)}.cx-icon-button--info{color:var(--on-ink)}.cx-icon-button:hover.cx-icon-button--info:not(.cx-icon-button--disabled)::before{background:var(--info-alt)}.cx-icon-button--warning::before{background:var(--warning)}.cx-icon-button--warning{color:var(--on-ink)}.cx-icon-button:hover.cx-icon-button--warning:not(.cx-icon-button--disabled)::before{background:var(--warning-alt)}.cx-icon-button--danger::before{background:var(--danger)}.cx-icon-button--danger{color:var(--on-ink)}.cx-icon-button:hover.cx-icon-button--danger:not(.cx-icon-button--disabled)::before{background:var(--danger-alt)}.cx-icon-button--success::before{background:var(--success)}.cx-icon-button--success{color:var(--on-ink)}.cx-icon-button:hover.cx-icon-button--success:not(.cx-icon-button--disabled)::before{background:var(--success-alt)}.cx-icon-button--emphasis.cx-icon-button--default{color:var(--on-emphasis)}.cx-icon-button--emphasis.cx-icon-button--default::before{background:var(--emphasis)}.cx-icon-button--emphasis.cx-icon-button--default:hover:not(.cx-icon-button--disabled)::before{background:color-mix(in srgb, var(--emphasis) 88%, var(--on-emphasis) 12%)}.cx-icon-button--emphasis.cx-icon-button--default.cx-icon-button--selected{color:var(--ink)}.cx-icon-button--emphasis.cx-icon-button--default.cx-icon-button--selected::before{background:var(--surface)}.cx-icon-button--emphasis.cx-icon-button--default.cx-icon-button--selected:hover:not(.cx-icon-button--disabled)::before{background:color-mix(in srgb, var(--surface) 88%, var(--ink) 12%)}.cx-icon-button--selected::before{background:var(--surface)}.cx-icon-button--selected{color:var(--ink);box-shadow:var(--shadow-low)}.cx-icon-button--primary.cx-icon-button--selected{color:var(--primary)}.cx-icon-button--accent.cx-icon-button--selected{color:var(--accent)}.cx-icon-button--info.cx-icon-button--selected{color:var(--info)}.cx-icon-button--success.cx-icon-button--selected{color:var(--success)}.cx-icon-button--warning.cx-icon-button--selected{color:var(--warning)}.cx-icon-button--danger.cx-icon-button--selected{color:var(--danger)}.cx-icon-button--disabled{opacity:var(--opacity-disabled);cursor:default}.cx-icon-button:focus-visible{outline:var(--outline-tab);outline-offset:var(--outline-tab-offset)}.cx-icon-button:active:not(.cx-icon-button--disabled){outline:var(--outline-active);outline-offset:var(--outline-active-offset);transform:scale(0.98)}.cx-icon-button__icon{display:inline-flex;color:currentColor}.cx-icon-button__spinner-box{display:inline-flex;width:16px;height:16px;flex:0 0 auto}.cx-icon-button__countdown{display:inline-flex;width:16px;height:16px;flex:0 0 auto}.cx-icon-button__badge{position:absolute;top:0;right:0;display:inline-flex;pointer-events:none;transform:translate(50%, -50%)}.cx-icon-button--with-badge-value .cx-icon-button__badge{top:var(--space-2xs);right:var(--space-2xs)}.cx-icon-button__badge cx-badge{display:inline-flex}.cx-icon-button::before{content:\"\";position:absolute;z-index:-1;inset:0;border-radius:inherit;corner-shape:inherit;transition:background-color var(--motion-fast) ease;pointer-events:none}.cx-icon-button--with-dot-badge::before{mask:radial-gradient(circle at 100% 0, transparent calc(4px + var(--space-xs) - 0.5px), #000 calc(4px + var(--space-xs) + 0.5px)) no-repeat}.cx-icon-button--with-badge-value::before{mask:radial-gradient(circle at calc(100% - var(--space-2xs)) var(--space-2xs), transparent calc(8px + var(--space-xs) - 0.5px), #000 calc(8px + var(--space-xs) + 0.5px)) no-repeat}.cx-icon-button__countdown-svg{width:100%;height:100%;overflow:visible;transform:rotate(-90deg)}.cx-icon-button__countdown-track,.cx-icon-button__countdown-progress{fill:none;stroke-width:2.25;stroke-linecap:round}.cx-icon-button__countdown-track{stroke:currentColor;opacity:.22}.cx-icon-button__countdown-progress{stroke:currentColor;stroke-dasharray:6 6;animation:cx-icon-button-countdown 6s forwards}.cx-icon-button--small .cx-icon-button__spinner-box{width:12px;height:12px}.cx-icon-button--small .cx-icon-button__countdown{width:12px;height:12px}@media(prefers-reduced-motion: reduce){.cx-icon-button__countdown-progress{animation:none}}@keyframes cx-icon-button-countdown{0%{stroke-dasharray:6 6;animation-timing-function:var(--ease-out-strong)}16.6667%{stroke-dasharray:5 6;animation-timing-function:var(--ease-out-strong)}33.3333%{stroke-dasharray:4 6;animation-timing-function:var(--ease-out-strong)}50%{stroke-dasharray:3 6;animation-timing-function:var(--ease-out-strong)}66.6667%{stroke-dasharray:2 6;animation-timing-function:var(--ease-out-strong)}83.3333%{stroke-dasharray:1 6;animation-timing-function:var(--ease-out-strong)}100%{stroke-dasharray:0 6}}"], dependencies: [{ kind: "component", type: CxBadgeComponent, selector: "cx-badge", inputs: ["visible", "placement", "count", "text", "mood", "ariaLabel"] }, { kind: "component", type: CxIconComponent, selector: "cx-icon", inputs: ["icon", "size", "mood", "shape"] }, { kind: "component", type: CxSpinnerComponent, selector: "cx-spinner", inputs: ["mood", "ariaLabel", "segments", "value", "size"] }], changeDetection: i0.ChangeDetectionStrategy.OnPush });
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "22.0.8", ngImport: i0, type: CxIconButtonComponent, decorators: [{
            type: Component,
            args: [{ selector: 'cx-icon-button', imports: [CxBadgeComponent, CxIconComponent, CxSpinnerComponent], changeDetection: ChangeDetectionStrategy.OnPush, template: "<button\n  type=\"button\"\n  class=\"cx-icon-button\"\n  [class.cx-icon-button--default]=\"mood === 'default'\"\n  [class.cx-icon-button--primary]=\"mood === 'primary'\"\n  [class.cx-icon-button--accent]=\"mood === 'accent'\"\n  [class.cx-icon-button--info]=\"mood === 'info'\"\n  [class.cx-icon-button--warning]=\"mood === 'warning'\"\n  [class.cx-icon-button--danger]=\"mood === 'danger'\"\n  [class.cx-icon-button--success]=\"mood === 'success'\"\n  [class.cx-icon-button--emphasis]=\"variant === 'emphasis'\"\n  [class.cx-icon-button--transparent]=\"variant === 'transparent'\"\n  [class.cx-icon-button--small]=\"size === 'small'\"\n  [class.cx-icon-button--selected]=\"selected\"\n  [class.cx-icon-button--rounded]=\"rounded\"\n  [class.cx-icon-button--disabled]=\"disabled\"\n  [class.cx-icon-button--loading]=\"showSpinner$()\"\n  [class.cx-icon-button--countdown]=\"countdownActive$()\"\n  [class.cx-icon-button--with-badge]=\"hasBadge()\"\n  [class.cx-icon-button--with-dot-badge]=\"hasBadge() && !hasBadgeCount()\"\n  [class.cx-icon-button--with-badge-value]=\"hasBadgeCount()\"\n  [disabled]=\"disabled || loading$() || countdownActive$()\"\n  [attr.role]=\"role || null\"\n  [attr.aria-label]=\"ariaLabel\"\n  [attr.aria-pressed]=\"ariaPressed === undefined ? (selected ? true : null) : ariaPressed\"\n  [attr.aria-haspopup]=\"ariaHasPopup || null\"\n  [attr.aria-expanded]=\"ariaExpanded === undefined ? null : ariaExpanded\"\n  [attr.aria-controls]=\"ariaControls || null\"\n  [attr.aria-busy]=\"loading$() ? 'true' : null\"\n  (click)=\"onClick()\"\n>\n  @if (countdownActive$()) {\n    <span class=\"cx-icon-button__countdown\" aria-hidden=\"true\">\n      <svg class=\"cx-icon-button__countdown-svg\" viewBox=\"0 0 16 16\">\n        <circle class=\"cx-icon-button__countdown-track\" cx=\"8\" cy=\"8\" r=\"6\" pathLength=\"6\" />\n        <circle class=\"cx-icon-button__countdown-progress\" cx=\"8\" cy=\"8\" r=\"6\" pathLength=\"6\" />\n      </svg>\n    </span>\n  } @else if (showSpinner$()) {\n    <span class=\"cx-icon-button__spinner-box\" aria-hidden=\"true\">\n      <cx-spinner mood=\"default\" size=\"auto\" />\n    </span>\n  } @else {\n    <cx-icon class=\"cx-icon-button__icon\" [icon]=\"icon\" [size]=\"size === 'small' ? 12 : 16\" />\n  }\n\n  @if (hasBadge()) {\n    <!-- The wrapper anchors the bare indicator outside the background cutout. -->\n    <span class=\"cx-icon-button__badge\" aria-hidden=\"true\">\n      <cx-badge placement=\"inline\" [count]=\"badgeCount()\" />\n    </span>\n  }\n</button>\n", styles: [":host{display:inline-flex;width:auto}:host(.cx-icon-button--block),:host(.cx-icon-button--block) .cx-icon-button{width:100%}.cx-icon-button{position:relative;isolation:isolate;display:inline-flex;width:var(--controller-size);height:var(--controller-size);align-items:center;justify-content:center;padding:0;border:0;border-radius:var(--radius-sm);background:rgba(0,0,0,0);color:var(--ink);cursor:pointer;margin:0;outline:none;overflow:visible;transform-origin:center;transition:background-color var(--motion-fast) ease,color var(--motion-fast) ease,opacity var(--motion-fast) ease,transform var(--motion-fast) ease}.cx-icon-button--small{width:var(--controller-size-small);height:var(--controller-size-small)}.cx-icon-button--rounded{border-radius:var(--radius-pill);corner-shape:round}.cx-icon-button--default::before{background:var(--opacity-low)}.cx-icon-button--default{color:var(--ink)}.cx-icon-button:hover.cx-icon-button--default:not(.cx-icon-button--disabled)::before{background:var(--opacity-mid)}.cx-icon-button--transparent::before{background:rgba(0,0,0,0)}.cx-icon-button--transparent{color:inherit}.cx-icon-button:hover.cx-icon-button--transparent:not(.cx-icon-button--disabled)::before{background:var(--opacity-low)}.cx-icon-button--primary::before{background:var(--primary)}.cx-icon-button--primary{color:var(--on-ink)}.cx-icon-button:hover.cx-icon-button--primary:not(.cx-icon-button--disabled)::before{background:var(--primary-alt)}.cx-icon-button--accent::before{background:var(--accent)}.cx-icon-button--accent{color:var(--surface)}.cx-icon-button:hover.cx-icon-button--accent:not(.cx-icon-button--disabled)::before{background:var(--accent-alt)}.cx-icon-button--info::before{background:var(--info)}.cx-icon-button--info{color:var(--on-ink)}.cx-icon-button:hover.cx-icon-button--info:not(.cx-icon-button--disabled)::before{background:var(--info-alt)}.cx-icon-button--warning::before{background:var(--warning)}.cx-icon-button--warning{color:var(--on-ink)}.cx-icon-button:hover.cx-icon-button--warning:not(.cx-icon-button--disabled)::before{background:var(--warning-alt)}.cx-icon-button--danger::before{background:var(--danger)}.cx-icon-button--danger{color:var(--on-ink)}.cx-icon-button:hover.cx-icon-button--danger:not(.cx-icon-button--disabled)::before{background:var(--danger-alt)}.cx-icon-button--success::before{background:var(--success)}.cx-icon-button--success{color:var(--on-ink)}.cx-icon-button:hover.cx-icon-button--success:not(.cx-icon-button--disabled)::before{background:var(--success-alt)}.cx-icon-button--emphasis.cx-icon-button--default{color:var(--on-emphasis)}.cx-icon-button--emphasis.cx-icon-button--default::before{background:var(--emphasis)}.cx-icon-button--emphasis.cx-icon-button--default:hover:not(.cx-icon-button--disabled)::before{background:color-mix(in srgb, var(--emphasis) 88%, var(--on-emphasis) 12%)}.cx-icon-button--emphasis.cx-icon-button--default.cx-icon-button--selected{color:var(--ink)}.cx-icon-button--emphasis.cx-icon-button--default.cx-icon-button--selected::before{background:var(--surface)}.cx-icon-button--emphasis.cx-icon-button--default.cx-icon-button--selected:hover:not(.cx-icon-button--disabled)::before{background:color-mix(in srgb, var(--surface) 88%, var(--ink) 12%)}.cx-icon-button--selected::before{background:var(--surface)}.cx-icon-button--selected{color:var(--ink);box-shadow:var(--shadow-low)}.cx-icon-button--primary.cx-icon-button--selected{color:var(--primary)}.cx-icon-button--accent.cx-icon-button--selected{color:var(--accent)}.cx-icon-button--info.cx-icon-button--selected{color:var(--info)}.cx-icon-button--success.cx-icon-button--selected{color:var(--success)}.cx-icon-button--warning.cx-icon-button--selected{color:var(--warning)}.cx-icon-button--danger.cx-icon-button--selected{color:var(--danger)}.cx-icon-button--disabled{opacity:var(--opacity-disabled);cursor:default}.cx-icon-button:focus-visible{outline:var(--outline-tab);outline-offset:var(--outline-tab-offset)}.cx-icon-button:active:not(.cx-icon-button--disabled){outline:var(--outline-active);outline-offset:var(--outline-active-offset);transform:scale(0.98)}.cx-icon-button__icon{display:inline-flex;color:currentColor}.cx-icon-button__spinner-box{display:inline-flex;width:16px;height:16px;flex:0 0 auto}.cx-icon-button__countdown{display:inline-flex;width:16px;height:16px;flex:0 0 auto}.cx-icon-button__badge{position:absolute;top:0;right:0;display:inline-flex;pointer-events:none;transform:translate(50%, -50%)}.cx-icon-button--with-badge-value .cx-icon-button__badge{top:var(--space-2xs);right:var(--space-2xs)}.cx-icon-button__badge cx-badge{display:inline-flex}.cx-icon-button::before{content:\"\";position:absolute;z-index:-1;inset:0;border-radius:inherit;corner-shape:inherit;transition:background-color var(--motion-fast) ease;pointer-events:none}.cx-icon-button--with-dot-badge::before{mask:radial-gradient(circle at 100% 0, transparent calc(4px + var(--space-xs) - 0.5px), #000 calc(4px + var(--space-xs) + 0.5px)) no-repeat}.cx-icon-button--with-badge-value::before{mask:radial-gradient(circle at calc(100% - var(--space-2xs)) var(--space-2xs), transparent calc(8px + var(--space-xs) - 0.5px), #000 calc(8px + var(--space-xs) + 0.5px)) no-repeat}.cx-icon-button__countdown-svg{width:100%;height:100%;overflow:visible;transform:rotate(-90deg)}.cx-icon-button__countdown-track,.cx-icon-button__countdown-progress{fill:none;stroke-width:2.25;stroke-linecap:round}.cx-icon-button__countdown-track{stroke:currentColor;opacity:.22}.cx-icon-button__countdown-progress{stroke:currentColor;stroke-dasharray:6 6;animation:cx-icon-button-countdown 6s forwards}.cx-icon-button--small .cx-icon-button__spinner-box{width:12px;height:12px}.cx-icon-button--small .cx-icon-button__countdown{width:12px;height:12px}@media(prefers-reduced-motion: reduce){.cx-icon-button__countdown-progress{animation:none}}@keyframes cx-icon-button-countdown{0%{stroke-dasharray:6 6;animation-timing-function:var(--ease-out-strong)}16.6667%{stroke-dasharray:5 6;animation-timing-function:var(--ease-out-strong)}33.3333%{stroke-dasharray:4 6;animation-timing-function:var(--ease-out-strong)}50%{stroke-dasharray:3 6;animation-timing-function:var(--ease-out-strong)}66.6667%{stroke-dasharray:2 6;animation-timing-function:var(--ease-out-strong)}83.3333%{stroke-dasharray:1 6;animation-timing-function:var(--ease-out-strong)}100%{stroke-dasharray:0 6}}"] }]
        }], propDecorators: { icon: [{
                type: Input
            }], ariaLabel: [{
                type: Input
            }], role: [{
                type: Input
            }], ariaHasPopup: [{
                type: Input
            }], ariaExpanded: [{
                type: Input
            }], ariaControls: [{
                type: Input
            }], mood: [{
                type: Input
            }], variant: [{
                type: Input
            }], size: [{
                type: Input
            }], selected: [{
                type: Input
            }], ariaPressed: [{
                type: Input
            }], rounded: [{
                type: Input
            }], disabled: [{
                type: Input
            }], badgeValue: [{
                type: Input
            }], block: [{
                type: Input
            }], blockClass: [{
                type: HostBinding,
                args: ['class.cx-icon-button--block']
            }], pressed: [{
                type: Output
            }], countdownChange: [{
                type: Output
            }], loading: [{
                type: Input
            }], countdown: [{
                type: Input
            }] } });
