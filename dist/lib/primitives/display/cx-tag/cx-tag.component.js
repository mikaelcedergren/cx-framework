import { ChangeDetectionStrategy, Component, ElementRef, EventEmitter, Input, Output, booleanAttribute, inject, } from '@angular/core';
import { CxIconComponent } from '../../media/cx-icon/index.js';
import { CxTooltipDirective } from '../../overlay/cx-tooltip/index.js';
import * as i0 from "@angular/core";
export const CX_TAG_COLORS = [
    'default',
    'blue',
    'cyan',
    'lime',
    'green',
    'yellow',
    'orange',
    'tangerine',
    'red',
    'pink',
    'purple',
    'violet',
];
export const CX_TAG_COLOR_PICKER_OPTIONS = [
    'blue',
    'cyan',
    'lime',
    'green',
    'yellow',
    'orange',
    'tangerine',
    'red',
    'pink',
    'purple',
    'violet',
];
export class CxTagComponent {
    host = inject(ElementRef);
    text = 'Tag';
    icon;
    color = 'default';
    outline = false;
    dismissible = false;
    /**
     * Turns the tag body into a real button. Opt-in because a tag is often
     * slotted inside another button or label, where a nested button would be
     * invalid and would steal the outer control's activation.
     */
    interactive = false;
    /** Accessible name for the interactive body; falls back to the visible text. */
    ariaLabel;
    /**
     * Set only when the tag opens a surface. Drives aria-haspopup and
     * aria-expanded on the body button, so the popup relationship sits on the
     * real control instead of this component's non-interactive host.
     */
    expanded;
    /** ID of the surface an interactive tag opens. */
    controls;
    dismiss = new EventEmitter();
    pressed = new EventEmitter();
    get visibleText() {
        return this.text?.trim() ?? '';
    }
    get dismissLabel() {
        return this.visibleText ? `Dismiss ${this.visibleText}` : 'Dismiss tag';
    }
    /** Null keeps the visible text as the button's accessible name. */
    get bodyLabel() {
        return this.ariaLabel?.trim() || null;
    }
    get popupKind() {
        return this.expanded === undefined ? null : 'dialog';
    }
    /**
     * Focuses an interactive tag without its container needing to know which
     * element inside carries the button. No-ops on a passive tag.
     */
    focus() {
        this.host.nativeElement
            .querySelector('.cx-tag__body')
            ?.focus();
    }
    onDismiss(event) {
        event.preventDefault();
        event.stopPropagation();
        if (!this.dismissible) {
            return;
        }
        this.dismiss.emit();
    }
    onPressed(event) {
        event.stopPropagation();
        if (!this.interactive) {
            return;
        }
        this.pressed.emit();
    }
    static ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "22.0.8", ngImport: i0, type: CxTagComponent, deps: [], target: i0.ɵɵFactoryTarget.Component });
    static ɵcmp = i0.ɵɵngDeclareComponent({ minVersion: "17.0.0", version: "22.0.8", type: CxTagComponent, isStandalone: true, selector: "cx-tag", inputs: { text: "text", icon: "icon", color: "color", outline: "outline", dismissible: "dismissible", interactive: ["interactive", "interactive", booleanAttribute], ariaLabel: "ariaLabel", expanded: "expanded", controls: "controls" }, outputs: { dismiss: "dismiss", pressed: "pressed" }, ngImport: i0, template: "<span\n  class=\"cx-tag\"\n  [class.cx-tag--outline]=\"outline\"\n  [class.cx-tag--interactive]=\"interactive\"\n  [class.cx-tag--dismissible]=\"dismissible\"\n  [class.cx-tag--with-icon]=\"!!icon\"\n  [class.cx-tag--blue]=\"color === 'blue'\"\n  [class.cx-tag--cyan]=\"color === 'cyan'\"\n  [class.cx-tag--lime]=\"color === 'lime'\"\n  [class.cx-tag--green]=\"color === 'green'\"\n  [class.cx-tag--yellow]=\"color === 'yellow'\"\n  [class.cx-tag--orange]=\"color === 'orange'\"\n  [class.cx-tag--tangerine]=\"color === 'tangerine'\"\n  [class.cx-tag--red]=\"color === 'red'\"\n  [class.cx-tag--pink]=\"color === 'pink'\"\n  [class.cx-tag--purple]=\"color === 'purple'\"\n  [class.cx-tag--violet]=\"color === 'violet'\"\n>\n  @if (interactive) {\n    <!-- The overflow tooltip moves onto the button: a tooltip on the inner\n         span would never see focusin once an ancestor owns focus, and one on\n         the root span would describe two focusable children. -->\n    <button\n      type=\"button\"\n      class=\"cx-tag__body\"\n      [attr.aria-label]=\"bodyLabel\"\n      [attr.aria-haspopup]=\"popupKind\"\n      [attr.aria-expanded]=\"expanded === undefined ? null : expanded\"\n      [attr.aria-controls]=\"controls || null\"\n      [cxTooltip]=\"visibleText\"\n      [cxTooltipOverflow]=\"true\"\n      (click)=\"onPressed($event)\"\n    >\n      @if (icon; as iconName) {\n        <cx-icon class=\"cx-tag__icon\" [icon]=\"iconName\" [size]=\"12\" aria-hidden=\"true\" />\n      }\n      @if (visibleText) {\n        <span class=\"cx-tag__text\" data-cx-tooltip-overflow>{{ visibleText }}</span>\n      }\n    </button>\n  } @else {\n    @if (icon; as iconName) {\n      <cx-icon class=\"cx-tag__icon\" [icon]=\"iconName\" [size]=\"12\" aria-hidden=\"true\" />\n    }\n    @if (visibleText) {\n      <span class=\"cx-tag__text\" [cxTooltip]=\"visibleText\" [cxTooltipOverflow]=\"true\">{{ visibleText }}</span>\n    }\n  }\n  @if (dismissible) {\n    <button type=\"button\" class=\"cx-tag__dismiss\" [attr.aria-label]=\"dismissLabel\" (click)=\"onDismiss($event)\">\n      <cx-icon icon=\"remove\" [size]=\"12\" />\n    </button>\n  }\n</span>\n", styles: [":host{display:inline-flex;max-width:100%;width:auto}.cx-tag{position:relative;display:inline-flex;cursor:default;width:max-content;max-width:100%;min-width:var(--controller-size-small);min-height:var(--icon-size-md);align-items:center;gap:var(--space-xs);padding:0 var(--space-xs);padding-inline-end:var(--cx-tag-padding-inline-end, var(--space-xs));border:1px solid rgba(0,0,0,0);border-radius:var(--radius-sm);background:var(--opacity-low);box-sizing:border-box;color:var(--opacity-high);vertical-align:middle}.cx-tag--with-icon{padding-left:var(--space-2xs)}.cx-tag--interactive{cursor:pointer;transition:background var(--motion-fast) var(--ease-out-in),color var(--motion-fast) var(--ease-out-in)}.cx-tag--interactive:has(.cx-tag__body:hover){background:color-mix(in srgb, var(--cx-tag-accent, var(--ink)) 18%, var(--surface));color:var(--ink)}.cx-tag--interactive:has(.cx-tag__body:focus-visible){outline:var(--outline-tab);outline-offset:var(--outline-tab-offset)}.cx-tag__body{display:inline-flex;min-width:0;max-width:100%;flex:1 1 auto;align-items:center;align-self:stretch;gap:var(--space-xs);padding:0;border:0;margin:0;appearance:none;background:none;color:inherit;cursor:inherit;font-size:var(--font-size-body-sm);font-weight:var(--font-weight-regular);line-height:var(--line-height-small);outline:none;text-align:left}.cx-tag__icon{display:inline-flex;flex:0 0 auto;color:currentColor}.cx-tag__text{display:block;min-width:0;flex:1 1 auto;overflow:hidden;font-size:var(--font-size-body-sm);font-weight:var(--font-weight-regular);line-height:var(--line-height-small);text-overflow:ellipsis;white-space:nowrap}.cx-tag__dismiss{position:absolute;top:50%;inset-inline-end:var(--space-2xs);display:inline-flex;width:18px;height:18px;align-items:center;justify-content:center;padding:0;border:var(--line);border-radius:var(--radius-pill);corner-shape:round;background:color-mix(in srgb, var(--surface) 82%, transparent);backdrop-filter:blur(calc(var(--frost-softness) * 2));-webkit-backdrop-filter:blur(calc(var(--frost-softness) * 2));color:var(--ink);cursor:pointer;margin:0;opacity:0;pointer-events:none;translate:0 -50%;transition:opacity var(--motion-fast) var(--ease-out-in),transform var(--motion-fast) var(--ease-out-in),background var(--motion-fast) var(--ease-out-in),border-color var(--motion-fast) var(--ease-out-in)}.cx-tag:hover .cx-tag__dismiss,.cx-tag:has(.cx-tag__dismiss:focus-visible) .cx-tag__dismiss{opacity:1;pointer-events:auto}.cx-tag__dismiss:hover{background:var(--opacity-low);border-color:var(--opacity-mid)}.cx-tag__dismiss:active{transform:scale(0.94)}.cx-tag__dismiss:focus-visible{outline:var(--outline-tab);outline-offset:var(--outline-tab-offset)}@media(hover: none),(pointer: coarse){.cx-tag__dismiss{width:var(--controller-size-small);height:var(--controller-size-small);opacity:1;pointer-events:auto}}.cx-tag--blue{--cx-tag-accent: var(--blue);background:var(--blue-opacity);color:var(--blue)}.cx-tag--outline.cx-tag--blue{border-color:var(--blue)}.cx-tag--cyan{--cx-tag-accent: var(--cyan);background:var(--cyan-opacity);color:var(--cyan)}.cx-tag--outline.cx-tag--cyan{border-color:var(--cyan)}.cx-tag--lime{--cx-tag-accent: var(--lime);background:var(--lime-opacity);color:var(--lime)}.cx-tag--outline.cx-tag--lime{border-color:var(--lime)}.cx-tag--green{--cx-tag-accent: var(--green);background:var(--green-opacity);color:var(--green)}.cx-tag--outline.cx-tag--green{border-color:var(--green)}.cx-tag--yellow{--cx-tag-accent: var(--yellow);background:var(--yellow-opacity);color:var(--yellow)}.cx-tag--outline.cx-tag--yellow{border-color:var(--yellow)}.cx-tag--orange{--cx-tag-accent: var(--orange);background:var(--orange-opacity);color:var(--orange)}.cx-tag--outline.cx-tag--orange{border-color:var(--orange)}.cx-tag--tangerine{--cx-tag-accent: var(--tangerine);background:var(--tangerine-opacity);color:var(--tangerine)}.cx-tag--outline.cx-tag--tangerine{border-color:var(--tangerine)}.cx-tag--red{--cx-tag-accent: var(--red);background:var(--red-opacity);color:var(--red)}.cx-tag--outline.cx-tag--red{border-color:var(--red)}.cx-tag--pink{--cx-tag-accent: var(--pink);background:var(--pink-opacity);color:var(--pink)}.cx-tag--outline.cx-tag--pink{border-color:var(--pink)}.cx-tag--purple{--cx-tag-accent: var(--purple);background:var(--purple-opacity);color:var(--purple)}.cx-tag--outline.cx-tag--purple{border-color:var(--purple)}.cx-tag--violet{--cx-tag-accent: var(--violet);background:var(--violet-opacity);color:var(--violet)}.cx-tag--outline.cx-tag--violet{border-color:var(--violet)}.cx-tag--outline{border-color:var(--opacity-mid);background:rgba(0,0,0,0)}"], dependencies: [{ kind: "component", type: CxIconComponent, selector: "cx-icon", inputs: ["icon", "size", "mood", "shape"] }, { kind: "directive", type: CxTooltipDirective, selector: "[cxTooltip]", inputs: ["cxTooltip", "cxTooltipPosition", "cxTooltipDelay", "cxTooltipDisabled", "cxTooltipOverflow"] }], changeDetection: i0.ChangeDetectionStrategy.OnPush });
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "22.0.8", ngImport: i0, type: CxTagComponent, decorators: [{
            type: Component,
            args: [{ selector: 'cx-tag', imports: [CxIconComponent, CxTooltipDirective], changeDetection: ChangeDetectionStrategy.OnPush, template: "<span\n  class=\"cx-tag\"\n  [class.cx-tag--outline]=\"outline\"\n  [class.cx-tag--interactive]=\"interactive\"\n  [class.cx-tag--dismissible]=\"dismissible\"\n  [class.cx-tag--with-icon]=\"!!icon\"\n  [class.cx-tag--blue]=\"color === 'blue'\"\n  [class.cx-tag--cyan]=\"color === 'cyan'\"\n  [class.cx-tag--lime]=\"color === 'lime'\"\n  [class.cx-tag--green]=\"color === 'green'\"\n  [class.cx-tag--yellow]=\"color === 'yellow'\"\n  [class.cx-tag--orange]=\"color === 'orange'\"\n  [class.cx-tag--tangerine]=\"color === 'tangerine'\"\n  [class.cx-tag--red]=\"color === 'red'\"\n  [class.cx-tag--pink]=\"color === 'pink'\"\n  [class.cx-tag--purple]=\"color === 'purple'\"\n  [class.cx-tag--violet]=\"color === 'violet'\"\n>\n  @if (interactive) {\n    <!-- The overflow tooltip moves onto the button: a tooltip on the inner\n         span would never see focusin once an ancestor owns focus, and one on\n         the root span would describe two focusable children. -->\n    <button\n      type=\"button\"\n      class=\"cx-tag__body\"\n      [attr.aria-label]=\"bodyLabel\"\n      [attr.aria-haspopup]=\"popupKind\"\n      [attr.aria-expanded]=\"expanded === undefined ? null : expanded\"\n      [attr.aria-controls]=\"controls || null\"\n      [cxTooltip]=\"visibleText\"\n      [cxTooltipOverflow]=\"true\"\n      (click)=\"onPressed($event)\"\n    >\n      @if (icon; as iconName) {\n        <cx-icon class=\"cx-tag__icon\" [icon]=\"iconName\" [size]=\"12\" aria-hidden=\"true\" />\n      }\n      @if (visibleText) {\n        <span class=\"cx-tag__text\" data-cx-tooltip-overflow>{{ visibleText }}</span>\n      }\n    </button>\n  } @else {\n    @if (icon; as iconName) {\n      <cx-icon class=\"cx-tag__icon\" [icon]=\"iconName\" [size]=\"12\" aria-hidden=\"true\" />\n    }\n    @if (visibleText) {\n      <span class=\"cx-tag__text\" [cxTooltip]=\"visibleText\" [cxTooltipOverflow]=\"true\">{{ visibleText }}</span>\n    }\n  }\n  @if (dismissible) {\n    <button type=\"button\" class=\"cx-tag__dismiss\" [attr.aria-label]=\"dismissLabel\" (click)=\"onDismiss($event)\">\n      <cx-icon icon=\"remove\" [size]=\"12\" />\n    </button>\n  }\n</span>\n", styles: [":host{display:inline-flex;max-width:100%;width:auto}.cx-tag{position:relative;display:inline-flex;cursor:default;width:max-content;max-width:100%;min-width:var(--controller-size-small);min-height:var(--icon-size-md);align-items:center;gap:var(--space-xs);padding:0 var(--space-xs);padding-inline-end:var(--cx-tag-padding-inline-end, var(--space-xs));border:1px solid rgba(0,0,0,0);border-radius:var(--radius-sm);background:var(--opacity-low);box-sizing:border-box;color:var(--opacity-high);vertical-align:middle}.cx-tag--with-icon{padding-left:var(--space-2xs)}.cx-tag--interactive{cursor:pointer;transition:background var(--motion-fast) var(--ease-out-in),color var(--motion-fast) var(--ease-out-in)}.cx-tag--interactive:has(.cx-tag__body:hover){background:color-mix(in srgb, var(--cx-tag-accent, var(--ink)) 18%, var(--surface));color:var(--ink)}.cx-tag--interactive:has(.cx-tag__body:focus-visible){outline:var(--outline-tab);outline-offset:var(--outline-tab-offset)}.cx-tag__body{display:inline-flex;min-width:0;max-width:100%;flex:1 1 auto;align-items:center;align-self:stretch;gap:var(--space-xs);padding:0;border:0;margin:0;appearance:none;background:none;color:inherit;cursor:inherit;font-size:var(--font-size-body-sm);font-weight:var(--font-weight-regular);line-height:var(--line-height-small);outline:none;text-align:left}.cx-tag__icon{display:inline-flex;flex:0 0 auto;color:currentColor}.cx-tag__text{display:block;min-width:0;flex:1 1 auto;overflow:hidden;font-size:var(--font-size-body-sm);font-weight:var(--font-weight-regular);line-height:var(--line-height-small);text-overflow:ellipsis;white-space:nowrap}.cx-tag__dismiss{position:absolute;top:50%;inset-inline-end:var(--space-2xs);display:inline-flex;width:18px;height:18px;align-items:center;justify-content:center;padding:0;border:var(--line);border-radius:var(--radius-pill);corner-shape:round;background:color-mix(in srgb, var(--surface) 82%, transparent);backdrop-filter:blur(calc(var(--frost-softness) * 2));-webkit-backdrop-filter:blur(calc(var(--frost-softness) * 2));color:var(--ink);cursor:pointer;margin:0;opacity:0;pointer-events:none;translate:0 -50%;transition:opacity var(--motion-fast) var(--ease-out-in),transform var(--motion-fast) var(--ease-out-in),background var(--motion-fast) var(--ease-out-in),border-color var(--motion-fast) var(--ease-out-in)}.cx-tag:hover .cx-tag__dismiss,.cx-tag:has(.cx-tag__dismiss:focus-visible) .cx-tag__dismiss{opacity:1;pointer-events:auto}.cx-tag__dismiss:hover{background:var(--opacity-low);border-color:var(--opacity-mid)}.cx-tag__dismiss:active{transform:scale(0.94)}.cx-tag__dismiss:focus-visible{outline:var(--outline-tab);outline-offset:var(--outline-tab-offset)}@media(hover: none),(pointer: coarse){.cx-tag__dismiss{width:var(--controller-size-small);height:var(--controller-size-small);opacity:1;pointer-events:auto}}.cx-tag--blue{--cx-tag-accent: var(--blue);background:var(--blue-opacity);color:var(--blue)}.cx-tag--outline.cx-tag--blue{border-color:var(--blue)}.cx-tag--cyan{--cx-tag-accent: var(--cyan);background:var(--cyan-opacity);color:var(--cyan)}.cx-tag--outline.cx-tag--cyan{border-color:var(--cyan)}.cx-tag--lime{--cx-tag-accent: var(--lime);background:var(--lime-opacity);color:var(--lime)}.cx-tag--outline.cx-tag--lime{border-color:var(--lime)}.cx-tag--green{--cx-tag-accent: var(--green);background:var(--green-opacity);color:var(--green)}.cx-tag--outline.cx-tag--green{border-color:var(--green)}.cx-tag--yellow{--cx-tag-accent: var(--yellow);background:var(--yellow-opacity);color:var(--yellow)}.cx-tag--outline.cx-tag--yellow{border-color:var(--yellow)}.cx-tag--orange{--cx-tag-accent: var(--orange);background:var(--orange-opacity);color:var(--orange)}.cx-tag--outline.cx-tag--orange{border-color:var(--orange)}.cx-tag--tangerine{--cx-tag-accent: var(--tangerine);background:var(--tangerine-opacity);color:var(--tangerine)}.cx-tag--outline.cx-tag--tangerine{border-color:var(--tangerine)}.cx-tag--red{--cx-tag-accent: var(--red);background:var(--red-opacity);color:var(--red)}.cx-tag--outline.cx-tag--red{border-color:var(--red)}.cx-tag--pink{--cx-tag-accent: var(--pink);background:var(--pink-opacity);color:var(--pink)}.cx-tag--outline.cx-tag--pink{border-color:var(--pink)}.cx-tag--purple{--cx-tag-accent: var(--purple);background:var(--purple-opacity);color:var(--purple)}.cx-tag--outline.cx-tag--purple{border-color:var(--purple)}.cx-tag--violet{--cx-tag-accent: var(--violet);background:var(--violet-opacity);color:var(--violet)}.cx-tag--outline.cx-tag--violet{border-color:var(--violet)}.cx-tag--outline{border-color:var(--opacity-mid);background:rgba(0,0,0,0)}"] }]
        }], propDecorators: { text: [{
                type: Input
            }], icon: [{
                type: Input
            }], color: [{
                type: Input
            }], outline: [{
                type: Input
            }], dismissible: [{
                type: Input
            }], interactive: [{
                type: Input,
                args: [{ transform: booleanAttribute }]
            }], ariaLabel: [{
                type: Input
            }], expanded: [{
                type: Input
            }], controls: [{
                type: Input
            }], dismiss: [{
                type: Output
            }], pressed: [{
                type: Output
            }] } });
