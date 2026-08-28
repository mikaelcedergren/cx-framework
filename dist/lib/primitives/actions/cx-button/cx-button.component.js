import { NgTemplateOutlet } from '@angular/common';
import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { CxShortcutKeyComponent } from '../../display/cx-shortcut-key/index.js';
import { CxSpinnerComponent } from '../../feedback/cx-spinner/index.js';
import { CxIconComponent } from '../../media/cx-icon/index.js';
import { createDelayedLoadingState } from '../shared/delayed-loading-state.js';
import { normalizeShortcutParts } from '../shared/shortcuts.js';
import * as i0 from "@angular/core";
export class CxButtonComponent {
    delayedLoading = createDelayedLoadingState(0);
    text = '';
    mood = 'default';
    icon;
    appendIcon;
    shortcutParts;
    href;
    type = 'button';
    size = 'default';
    ariaLabel;
    disabled = false;
    transparent = false;
    rounded = false;
    set loading(value) {
        this.delayedLoading.sync(Boolean(value));
    }
    pressed = new EventEmitter();
    loading$ = this.delayedLoading.loading$;
    showSpinner$ = this.delayedLoading.showSpinner$;
    get visibleText() {
        return this.text?.trim() ?? '';
    }
    get isIconOnly() {
        return !this.visibleText && this.visibleIconCount === 1;
    }
    get resolvedAriaLabel() {
        const label = this.ariaLabel?.trim();
        if (label) {
            return label;
        }
        if (this.isIconOnly) {
            return this.humanizeIconName(this.icon ?? this.appendIcon);
        }
        if (this.hasShortcut) {
            return `${this.visibleText} (${this.shortcutLabel})`;
        }
        return null;
    }
    get nativeType() {
        return this.type === 'submit' || this.type === 'reset' ? this.type : 'button';
    }
    get resolvedHref() {
        return this.href?.trim() || undefined;
    }
    get isUnavailable() {
        return this.disabled || this.loading$();
    }
    get isDefault() {
        return this.mood === 'default';
    }
    get isPrimary() {
        return this.mood === 'primary';
    }
    get isAccent() {
        return this.mood === 'accent';
    }
    get isInfo() {
        return this.mood === 'info';
    }
    get isSuccess() {
        return this.mood === 'success';
    }
    get isWarning() {
        return this.mood === 'warning';
    }
    get isDanger() {
        return this.mood === 'danger';
    }
    get isTransparent() {
        return this.transparent;
    }
    get hasShortcut() {
        return Boolean(this.visibleText) && this.normalizedShortcutParts.length > 0;
    }
    get normalizedShortcutParts() {
        return normalizeShortcutParts(this.shortcutParts);
    }
    get shortcutLabel() {
        return this.normalizedShortcutParts.join('+');
    }
    get visibleIconCount() {
        return Number(Boolean(this.icon)) + Number(Boolean(this.appendIcon));
    }
    humanizeIconName(name) {
        return name
            ?.split('-')
            .filter(Boolean)
            .map(part => part.charAt(0).toUpperCase() + part.slice(1))
            .join(' ') || 'Button';
    }
    ngOnDestroy() {
        this.delayedLoading.destroy();
    }
    onActivate(event) {
        if (this.isUnavailable) {
            event?.preventDefault();
            event?.stopPropagation();
            return;
        }
        this.pressed.emit();
    }
    static ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "22.0.8", ngImport: i0, type: CxButtonComponent, deps: [], target: i0.ɵɵFactoryTarget.Component });
    static ɵcmp = i0.ɵɵngDeclareComponent({ minVersion: "17.0.0", version: "22.0.8", type: CxButtonComponent, isStandalone: true, selector: "cx-button", inputs: { text: "text", mood: "mood", icon: "icon", appendIcon: "appendIcon", shortcutParts: "shortcutParts", href: "href", type: "type", size: "size", ariaLabel: "ariaLabel", disabled: "disabled", transparent: "transparent", rounded: "rounded", loading: "loading" }, outputs: { pressed: "pressed" }, ngImport: i0, template: "@if (resolvedHref; as href) {\n  <a\n    class=\"cx-button\"\n    role=\"link\"\n    [class.cx-button--default]=\"isDefault\"\n    [class.cx-button--primary]=\"isPrimary\"\n    [class.cx-button--accent]=\"isAccent\"\n    [class.cx-button--info]=\"isInfo\"\n    [class.cx-button--success]=\"isSuccess\"\n    [class.cx-button--warning]=\"isWarning\"\n    [class.cx-button--danger]=\"isDanger\"\n    [class.cx-button--transparent]=\"isTransparent\"\n    [class.cx-button--icon]=\"isIconOnly\"\n    [class.cx-button--small]=\"size === 'small'\"\n    [class.cx-button--large]=\"size === 'large'\"\n    [class.cx-button--disabled]=\"disabled\"\n    [class.cx-button--loading]=\"showSpinner$()\"\n    [class.cx-button--rounded]=\"rounded\"\n    [attr.href]=\"isUnavailable ? null : href\"\n    [attr.aria-label]=\"resolvedAriaLabel\"\n    [attr.aria-disabled]=\"isUnavailable ? 'true' : null\"\n    [attr.aria-busy]=\"loading$() ? 'true' : null\"\n    [attr.tabindex]=\"isUnavailable ? '-1' : null\"\n    (click)=\"onActivate($event)\"\n  >\n    <ng-container [ngTemplateOutlet]=\"content\" />\n  </a>\n} @else {\n  <button\n    [type]=\"nativeType\"\n    class=\"cx-button\"\n    [class.cx-button--default]=\"isDefault\"\n    [class.cx-button--primary]=\"isPrimary\"\n    [class.cx-button--accent]=\"isAccent\"\n    [class.cx-button--info]=\"isInfo\"\n    [class.cx-button--success]=\"isSuccess\"\n    [class.cx-button--warning]=\"isWarning\"\n    [class.cx-button--danger]=\"isDanger\"\n    [class.cx-button--transparent]=\"isTransparent\"\n    [class.cx-button--icon]=\"isIconOnly\"\n    [class.cx-button--small]=\"size === 'small'\"\n    [class.cx-button--large]=\"size === 'large'\"\n    [class.cx-button--disabled]=\"disabled\"\n    [class.cx-button--loading]=\"showSpinner$()\"\n    [class.cx-button--rounded]=\"rounded\"\n    [disabled]=\"isUnavailable\"\n    [attr.aria-label]=\"resolvedAriaLabel\"\n    [attr.aria-busy]=\"loading$() ? 'true' : null\"\n    (click)=\"onActivate()\"\n  >\n    <ng-container [ngTemplateOutlet]=\"content\" />\n  </button>\n}\n\n<ng-template #content>\n  <span\n    class=\"cx-button__content\"\n    [class.cx-button__content--hidden]=\"showSpinner$()\"\n    [attr.aria-hidden]=\"showSpinner$() ? 'true' : null\"\n  >\n    @if (icon; as iconName) {\n      <cx-icon class=\"cx-button__icon\" [icon]=\"iconName\" [size]=\"size === 'small' ? 12 : size === 'large' ? 18 : 16\" />\n    }\n    @if (visibleText) {\n      <span class=\"cx-button__label\">{{ visibleText }}</span>\n    }\n    @if (hasShortcut) {\n      <cx-shortcut-key class=\"cx-button__shortcut\" [parts]=\"normalizedShortcutParts\" aria-hidden=\"true\" />\n    }\n    @if (appendIcon; as iconName) {\n      <cx-icon class=\"cx-button__icon\" [icon]=\"iconName\" [size]=\"size === 'small' ? 12 : size === 'large' ? 18 : 16\" />\n    }\n  </span>\n\n  @if (showSpinner$()) {\n    <span class=\"cx-button__spinner-box\" aria-hidden=\"true\">\n      <cx-spinner mood=\"default\" size=\"auto\" />\n    </span>\n  }\n</ng-template>\n", styles: [":host{display:inline-flex;width:auto}.cx-button{position:relative;display:inline-flex;width:var(--cx-button-width, auto);min-height:var(--controller-size);align-items:center;justify-content:center;padding:0 var(--space-md);border:0;border-radius:var(--radius-md);background:var(--opacity-low);color:var(--ink);cursor:pointer;font-family:inherit;font-size:var(--font-size-body);font-weight:var(--font-weight-medium);line-height:1;margin:0;outline:none;transform-origin:center;transition:background-color var(--motion-fast) ease,color var(--motion-fast) ease,opacity var(--motion-fast) ease,transform var(--motion-fast) ease;text-decoration:none;white-space:nowrap}.cx-button--small{min-height:var(--controller-size-small);padding:0 var(--space-sm);font-size:var(--font-size-body-sm)}.cx-button--large{min-height:var(--controller-size-large);padding:0 var(--space-lg);font-size:var(--font-size-body-lg)}.cx-button--default{background:var(--opacity-low);color:var(--ink)}.cx-button:is(:hover,.cx-button--hover).cx-button--default:not(.cx-button--disabled):not(.cx-button--loading){background:var(--opacity-mid)}.cx-button--primary{background:var(--primary);color:var(--on-ink)}.cx-button:is(:hover,.cx-button--hover).cx-button--primary:not(.cx-button--disabled):not(.cx-button--loading){background:var(--primary-alt)}.cx-button--accent{background:var(--accent);color:var(--surface)}.cx-button:is(:hover,.cx-button--hover).cx-button--accent:not(.cx-button--disabled):not(.cx-button--loading){background:var(--accent-alt)}.cx-button--info{background:var(--info);color:var(--on-ink)}.cx-button:is(:hover,.cx-button--hover).cx-button--info:not(.cx-button--disabled):not(.cx-button--loading){background:var(--info-alt)}.cx-button--warning{background:var(--warning);color:var(--on-ink)}.cx-button:is(:hover,.cx-button--hover).cx-button--warning:not(.cx-button--disabled):not(.cx-button--loading){background:var(--warning-alt)}.cx-button--danger{background:var(--danger);color:var(--on-ink)}.cx-button:is(:hover,.cx-button--hover).cx-button--danger:not(.cx-button--disabled):not(.cx-button--loading){background:var(--danger-alt)}.cx-button--success{background:var(--success);color:var(--on-ink)}.cx-button:is(:hover,.cx-button--hover).cx-button--success:not(.cx-button--disabled):not(.cx-button--loading){background:var(--success-alt)}.cx-button--transparent{background:rgba(0,0,0,0);color:var(--ink)}.cx-button--transparent.cx-button--primary{color:var(--primary)}.cx-button--transparent.cx-button--accent{color:var(--accent)}.cx-button--transparent.cx-button--info{color:var(--info)}.cx-button--transparent.cx-button--success{color:var(--success)}.cx-button--transparent.cx-button--warning{color:var(--warning)}.cx-button--transparent.cx-button--danger{color:var(--danger)}.cx-button:is(:hover,.cx-button--hover).cx-button--transparent:not(.cx-button--disabled):not(.cx-button--loading){background:var(--opacity-low)}.cx-button:is(:hover,.cx-button--hover).cx-button--transparent.cx-button--primary:not(.cx-button--disabled):not(.cx-button--loading){background:var(--primary-opacity)}.cx-button:is(:hover,.cx-button--hover).cx-button--transparent.cx-button--accent:not(.cx-button--disabled):not(.cx-button--loading){background:var(--accent-opacity)}.cx-button:is(:hover,.cx-button--hover).cx-button--transparent.cx-button--info:not(.cx-button--disabled):not(.cx-button--loading){background:var(--info-opacity)}.cx-button:is(:hover,.cx-button--hover).cx-button--transparent.cx-button--success:not(.cx-button--disabled):not(.cx-button--loading){background:var(--success-opacity)}.cx-button:is(:hover,.cx-button--hover).cx-button--transparent.cx-button--warning:not(.cx-button--disabled):not(.cx-button--loading){background:var(--warning-opacity)}.cx-button:is(:hover,.cx-button--hover).cx-button--transparent.cx-button--danger:not(.cx-button--disabled):not(.cx-button--loading){background:var(--danger-opacity)}.cx-button--icon{min-width:var(--controller-size);padding:0}.cx-button--small.cx-button--icon{min-width:var(--controller-size-small)}.cx-button--large.cx-button--icon{min-width:var(--controller-size-large)}.cx-button--rounded{border-radius:var(--radius-pill);corner-shape:round}.cx-button--disabled{opacity:.2;cursor:default}.cx-button:focus-visible{outline:var(--outline-tab);outline-offset:var(--outline-tab-offset)}.cx-button:active:not(.cx-button--disabled):not(.cx-button--loading){outline:var(--outline-active);outline-offset:var(--outline-active-offset);transform:scale(0.98)}.cx-button__content{display:inline-flex;min-width:0;align-items:center;justify-content:center;gap:var(--space-sm)}.cx-button__content--hidden{visibility:hidden}.cx-button--small .cx-button__content{gap:var(--space-xs)}.cx-button--large .cx-button__content{gap:var(--space-md)}.cx-button__icon{display:inline-flex;flex:0 0 auto;color:currentColor}.cx-button__shortcut{--cx-shortcut-key-color: currentColor;display:inline-flex;flex:0 0 auto;margin-left:var(--space-xs)}.cx-button__label{display:block;color:currentColor;line-height:1}.cx-button__spinner-box{position:absolute;inset-block-start:50%;inset-inline-start:50%;transform:translate(-50%, -50%);display:inline-flex;width:16px;height:16px;flex:0 0 auto;pointer-events:none}.cx-button--small .cx-button__spinner-box{width:12px;height:12px}.cx-button--large .cx-button__spinner-box{width:18px;height:18px}"], dependencies: [{ kind: "directive", type: NgTemplateOutlet, selector: "[ngTemplateOutlet]", inputs: ["ngTemplateOutletContext", "ngTemplateOutlet", "ngTemplateOutletInjector"] }, { kind: "component", type: CxSpinnerComponent, selector: "cx-spinner", inputs: ["mood", "ariaLabel", "segments", "value", "size"] }, { kind: "component", type: CxIconComponent, selector: "cx-icon", inputs: ["icon", "size", "mood", "shape"] }, { kind: "component", type: CxShortcutKeyComponent, selector: "cx-shortcut-key", inputs: ["parts"] }], changeDetection: i0.ChangeDetectionStrategy.OnPush });
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "22.0.8", ngImport: i0, type: CxButtonComponent, decorators: [{
            type: Component,
            args: [{ selector: 'cx-button', imports: [NgTemplateOutlet, CxSpinnerComponent, CxIconComponent, CxShortcutKeyComponent], changeDetection: ChangeDetectionStrategy.OnPush, template: "@if (resolvedHref; as href) {\n  <a\n    class=\"cx-button\"\n    role=\"link\"\n    [class.cx-button--default]=\"isDefault\"\n    [class.cx-button--primary]=\"isPrimary\"\n    [class.cx-button--accent]=\"isAccent\"\n    [class.cx-button--info]=\"isInfo\"\n    [class.cx-button--success]=\"isSuccess\"\n    [class.cx-button--warning]=\"isWarning\"\n    [class.cx-button--danger]=\"isDanger\"\n    [class.cx-button--transparent]=\"isTransparent\"\n    [class.cx-button--icon]=\"isIconOnly\"\n    [class.cx-button--small]=\"size === 'small'\"\n    [class.cx-button--large]=\"size === 'large'\"\n    [class.cx-button--disabled]=\"disabled\"\n    [class.cx-button--loading]=\"showSpinner$()\"\n    [class.cx-button--rounded]=\"rounded\"\n    [attr.href]=\"isUnavailable ? null : href\"\n    [attr.aria-label]=\"resolvedAriaLabel\"\n    [attr.aria-disabled]=\"isUnavailable ? 'true' : null\"\n    [attr.aria-busy]=\"loading$() ? 'true' : null\"\n    [attr.tabindex]=\"isUnavailable ? '-1' : null\"\n    (click)=\"onActivate($event)\"\n  >\n    <ng-container [ngTemplateOutlet]=\"content\" />\n  </a>\n} @else {\n  <button\n    [type]=\"nativeType\"\n    class=\"cx-button\"\n    [class.cx-button--default]=\"isDefault\"\n    [class.cx-button--primary]=\"isPrimary\"\n    [class.cx-button--accent]=\"isAccent\"\n    [class.cx-button--info]=\"isInfo\"\n    [class.cx-button--success]=\"isSuccess\"\n    [class.cx-button--warning]=\"isWarning\"\n    [class.cx-button--danger]=\"isDanger\"\n    [class.cx-button--transparent]=\"isTransparent\"\n    [class.cx-button--icon]=\"isIconOnly\"\n    [class.cx-button--small]=\"size === 'small'\"\n    [class.cx-button--large]=\"size === 'large'\"\n    [class.cx-button--disabled]=\"disabled\"\n    [class.cx-button--loading]=\"showSpinner$()\"\n    [class.cx-button--rounded]=\"rounded\"\n    [disabled]=\"isUnavailable\"\n    [attr.aria-label]=\"resolvedAriaLabel\"\n    [attr.aria-busy]=\"loading$() ? 'true' : null\"\n    (click)=\"onActivate()\"\n  >\n    <ng-container [ngTemplateOutlet]=\"content\" />\n  </button>\n}\n\n<ng-template #content>\n  <span\n    class=\"cx-button__content\"\n    [class.cx-button__content--hidden]=\"showSpinner$()\"\n    [attr.aria-hidden]=\"showSpinner$() ? 'true' : null\"\n  >\n    @if (icon; as iconName) {\n      <cx-icon class=\"cx-button__icon\" [icon]=\"iconName\" [size]=\"size === 'small' ? 12 : size === 'large' ? 18 : 16\" />\n    }\n    @if (visibleText) {\n      <span class=\"cx-button__label\">{{ visibleText }}</span>\n    }\n    @if (hasShortcut) {\n      <cx-shortcut-key class=\"cx-button__shortcut\" [parts]=\"normalizedShortcutParts\" aria-hidden=\"true\" />\n    }\n    @if (appendIcon; as iconName) {\n      <cx-icon class=\"cx-button__icon\" [icon]=\"iconName\" [size]=\"size === 'small' ? 12 : size === 'large' ? 18 : 16\" />\n    }\n  </span>\n\n  @if (showSpinner$()) {\n    <span class=\"cx-button__spinner-box\" aria-hidden=\"true\">\n      <cx-spinner mood=\"default\" size=\"auto\" />\n    </span>\n  }\n</ng-template>\n", styles: [":host{display:inline-flex;width:auto}.cx-button{position:relative;display:inline-flex;width:var(--cx-button-width, auto);min-height:var(--controller-size);align-items:center;justify-content:center;padding:0 var(--space-md);border:0;border-radius:var(--radius-md);background:var(--opacity-low);color:var(--ink);cursor:pointer;font-family:inherit;font-size:var(--font-size-body);font-weight:var(--font-weight-medium);line-height:1;margin:0;outline:none;transform-origin:center;transition:background-color var(--motion-fast) ease,color var(--motion-fast) ease,opacity var(--motion-fast) ease,transform var(--motion-fast) ease;text-decoration:none;white-space:nowrap}.cx-button--small{min-height:var(--controller-size-small);padding:0 var(--space-sm);font-size:var(--font-size-body-sm)}.cx-button--large{min-height:var(--controller-size-large);padding:0 var(--space-lg);font-size:var(--font-size-body-lg)}.cx-button--default{background:var(--opacity-low);color:var(--ink)}.cx-button:is(:hover,.cx-button--hover).cx-button--default:not(.cx-button--disabled):not(.cx-button--loading){background:var(--opacity-mid)}.cx-button--primary{background:var(--primary);color:var(--on-ink)}.cx-button:is(:hover,.cx-button--hover).cx-button--primary:not(.cx-button--disabled):not(.cx-button--loading){background:var(--primary-alt)}.cx-button--accent{background:var(--accent);color:var(--surface)}.cx-button:is(:hover,.cx-button--hover).cx-button--accent:not(.cx-button--disabled):not(.cx-button--loading){background:var(--accent-alt)}.cx-button--info{background:var(--info);color:var(--on-ink)}.cx-button:is(:hover,.cx-button--hover).cx-button--info:not(.cx-button--disabled):not(.cx-button--loading){background:var(--info-alt)}.cx-button--warning{background:var(--warning);color:var(--on-ink)}.cx-button:is(:hover,.cx-button--hover).cx-button--warning:not(.cx-button--disabled):not(.cx-button--loading){background:var(--warning-alt)}.cx-button--danger{background:var(--danger);color:var(--on-ink)}.cx-button:is(:hover,.cx-button--hover).cx-button--danger:not(.cx-button--disabled):not(.cx-button--loading){background:var(--danger-alt)}.cx-button--success{background:var(--success);color:var(--on-ink)}.cx-button:is(:hover,.cx-button--hover).cx-button--success:not(.cx-button--disabled):not(.cx-button--loading){background:var(--success-alt)}.cx-button--transparent{background:rgba(0,0,0,0);color:var(--ink)}.cx-button--transparent.cx-button--primary{color:var(--primary)}.cx-button--transparent.cx-button--accent{color:var(--accent)}.cx-button--transparent.cx-button--info{color:var(--info)}.cx-button--transparent.cx-button--success{color:var(--success)}.cx-button--transparent.cx-button--warning{color:var(--warning)}.cx-button--transparent.cx-button--danger{color:var(--danger)}.cx-button:is(:hover,.cx-button--hover).cx-button--transparent:not(.cx-button--disabled):not(.cx-button--loading){background:var(--opacity-low)}.cx-button:is(:hover,.cx-button--hover).cx-button--transparent.cx-button--primary:not(.cx-button--disabled):not(.cx-button--loading){background:var(--primary-opacity)}.cx-button:is(:hover,.cx-button--hover).cx-button--transparent.cx-button--accent:not(.cx-button--disabled):not(.cx-button--loading){background:var(--accent-opacity)}.cx-button:is(:hover,.cx-button--hover).cx-button--transparent.cx-button--info:not(.cx-button--disabled):not(.cx-button--loading){background:var(--info-opacity)}.cx-button:is(:hover,.cx-button--hover).cx-button--transparent.cx-button--success:not(.cx-button--disabled):not(.cx-button--loading){background:var(--success-opacity)}.cx-button:is(:hover,.cx-button--hover).cx-button--transparent.cx-button--warning:not(.cx-button--disabled):not(.cx-button--loading){background:var(--warning-opacity)}.cx-button:is(:hover,.cx-button--hover).cx-button--transparent.cx-button--danger:not(.cx-button--disabled):not(.cx-button--loading){background:var(--danger-opacity)}.cx-button--icon{min-width:var(--controller-size);padding:0}.cx-button--small.cx-button--icon{min-width:var(--controller-size-small)}.cx-button--large.cx-button--icon{min-width:var(--controller-size-large)}.cx-button--rounded{border-radius:var(--radius-pill);corner-shape:round}.cx-button--disabled{opacity:.2;cursor:default}.cx-button:focus-visible{outline:var(--outline-tab);outline-offset:var(--outline-tab-offset)}.cx-button:active:not(.cx-button--disabled):not(.cx-button--loading){outline:var(--outline-active);outline-offset:var(--outline-active-offset);transform:scale(0.98)}.cx-button__content{display:inline-flex;min-width:0;align-items:center;justify-content:center;gap:var(--space-sm)}.cx-button__content--hidden{visibility:hidden}.cx-button--small .cx-button__content{gap:var(--space-xs)}.cx-button--large .cx-button__content{gap:var(--space-md)}.cx-button__icon{display:inline-flex;flex:0 0 auto;color:currentColor}.cx-button__shortcut{--cx-shortcut-key-color: currentColor;display:inline-flex;flex:0 0 auto;margin-left:var(--space-xs)}.cx-button__label{display:block;color:currentColor;line-height:1}.cx-button__spinner-box{position:absolute;inset-block-start:50%;inset-inline-start:50%;transform:translate(-50%, -50%);display:inline-flex;width:16px;height:16px;flex:0 0 auto;pointer-events:none}.cx-button--small .cx-button__spinner-box{width:12px;height:12px}.cx-button--large .cx-button__spinner-box{width:18px;height:18px}"] }]
        }], propDecorators: { text: [{
                type: Input
            }], mood: [{
                type: Input
            }], icon: [{
                type: Input
            }], appendIcon: [{
                type: Input
            }], shortcutParts: [{
                type: Input
            }], href: [{
                type: Input
            }], type: [{
                type: Input
            }], size: [{
                type: Input
            }], ariaLabel: [{
                type: Input
            }], disabled: [{
                type: Input
            }], transparent: [{
                type: Input
            }], rounded: [{
                type: Input
            }], loading: [{
                type: Input
            }], pressed: [{
                type: Output
            }] } });
