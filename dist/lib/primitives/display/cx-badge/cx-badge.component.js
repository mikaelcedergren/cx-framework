import { ChangeDetectionStrategy, Component, ElementRef, Input, ViewChild, signal, } from '@angular/core';
import * as i0 from "@angular/core";
const CX_BADGE_MAX_COUNT = 99;
export class CxBadgeComponent {
    visible = true;
    placement = 'corner';
    count;
    text;
    mood = 'default';
    ariaLabel;
    measuredIndicatorWidth = signal(undefined, /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "measuredIndicatorWidth" }] : /* istanbul ignore next */ []));
    indicatorResizeObserver;
    invalidValueCombination = false;
    warnedInvalidValueCombination = false;
    set indicatorRef(ref) {
        this.indicatorResizeObserver?.disconnect();
        this.indicatorResizeObserver = undefined;
        this.measuredIndicatorWidth.set(undefined);
        if (!ref || typeof ResizeObserver === 'undefined') {
            return;
        }
        const element = ref.nativeElement;
        this.indicatorResizeObserver = new ResizeObserver(([entry]) => {
            if (!entry) {
                return;
            }
            const borderBox = Array.isArray(entry.borderBoxSize) ? entry.borderBoxSize[0] : entry.borderBoxSize;
            const width = borderBox?.inlineSize ?? element.getBoundingClientRect().width;
            if (Number.isFinite(width) && width > 0 && this.measuredIndicatorWidth() !== width) {
                this.measuredIndicatorWidth.set(width);
            }
        });
        this.indicatorResizeObserver.observe(element);
    }
    ngOnChanges(_changes) {
        this.validateValueCombination();
    }
    ngOnDestroy() {
        this.indicatorResizeObserver?.disconnect();
    }
    hasCount() {
        return this.count !== undefined && Number.isFinite(this.count);
    }
    hasText() {
        return Boolean(this.displayText());
    }
    showsIndicator() {
        return this.visible && !this.invalidValueCombination;
    }
    showsCount() {
        return this.showsIndicator() && this.hasCount();
    }
    showsText() {
        return this.showsIndicator() && !this.hasCount() && this.hasText();
    }
    hasValue() {
        return this.showsCount() || this.showsText();
    }
    displayValue() {
        const count = Math.max(0, Math.floor(this.count ?? 0));
        return count > CX_BADGE_MAX_COUNT ? `${CX_BADGE_MAX_COUNT}+` : `${count}`;
    }
    displayText() {
        return this.text?.trim() ?? '';
    }
    indicatorWidth() {
        const measuredWidth = this.measuredIndicatorWidth();
        if (measuredWidth !== undefined) {
            return `${measuredWidth}px`;
        }
        if (this.showsCount()) {
            return '16px';
        }
        return this.showsText() ? '24px' : '8px';
    }
    indicatorHeight() {
        return this.hasValue() ? '16px' : '8px';
    }
    validateValueCombination() {
        this.invalidValueCombination = this.hasCount() && this.hasText();
        if (this.invalidValueCombination) {
            if (!this.warnedInvalidValueCombination) {
                console.error('[cx-badge] count and text cannot be used together. Provide one value or leave both empty for a dot.');
                this.warnedInvalidValueCombination = true;
            }
            return;
        }
        this.warnedInvalidValueCombination = false;
    }
    static ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "22.0.8", ngImport: i0, type: CxBadgeComponent, deps: [], target: i0.ɵɵFactoryTarget.Component });
    static ɵcmp = i0.ɵɵngDeclareComponent({ minVersion: "17.0.0", version: "22.0.8", type: CxBadgeComponent, isStandalone: true, selector: "cx-badge", inputs: { visible: "visible", placement: "placement", count: "count", text: "text", mood: "mood", ariaLabel: "ariaLabel" }, viewQueries: [{ propertyName: "indicatorRef", first: true, predicate: ["indicator"], descendants: true, read: ElementRef }], usesOnChanges: true, ngImport: i0, template: "<span\n  class=\"cx-badge\"\n  [class.cx-badge--inline]=\"placement === 'inline'\"\n  [class.cx-badge--corner]=\"placement === 'corner'\"\n  [class.cx-badge--visible]=\"visible\"\n  [class.cx-badge--with-value]=\"hasValue()\"\n  [class.cx-badge--default]=\"mood === 'default'\"\n  [class.cx-badge--accent]=\"mood === 'accent'\"\n  [class.cx-badge--success]=\"mood === 'success'\"\n  [class.cx-badge--warning]=\"mood === 'warning'\"\n  [class.cx-badge--danger]=\"mood === 'danger'\"\n  [style.--cx-badge-indicator-width]=\"indicatorWidth()\"\n  [style.--cx-badge-indicator-height]=\"indicatorHeight()\"\n>\n  <span\n    class=\"cx-badge__content\"\n    [class.cx-badge__content--cutout]=\"placement === 'corner' && showsIndicator()\"\n  >\n    <ng-content />\n  </span>\n\n  @if (showsIndicator()) {\n    <span\n      #indicator\n      class=\"cx-badge__indicator\"\n      [class.cx-badge__indicator--dot]=\"!hasValue()\"\n      [class.cx-badge__indicator--count]=\"showsCount()\"\n      [class.cx-badge__indicator--text]=\"showsText()\"\n      [attr.role]=\"ariaLabel?.trim() ? 'img' : null\"\n      [attr.aria-label]=\"ariaLabel?.trim() || null\"\n      [attr.aria-hidden]=\"ariaLabel?.trim() ? null : 'true'\"\n    >\n      @if (showsCount()) {\n        <span class=\"cx-badge__value\">{{ displayValue() }}</span>\n      } @else if (showsText()) {\n        <span class=\"cx-badge__value cx-badge__value--text\">{{ displayText() }}</span>\n      }\n    </span>\n  }\n</span>\n", styles: [":host{display:inline-flex;width:auto}.cx-badge{--cx-badge-cutout-size: 3px;--cx-badge-indicator-width: 8px;--cx-badge-indicator-height: 8px;position:relative;display:inline-flex;min-width:8px;min-height:8px;align-items:center;justify-content:center;background:rgba(0,0,0,0);color:var(--on-ink);box-sizing:border-box}.cx-badge__content{display:inline-flex}.cx-badge__content--cutout{--cx-badge-indicator-right: 0px;--cx-badge-indicator-top: 0px;--cx-badge-indicator-center-offset-x: calc( (var(--cx-badge-indicator-width) / 4) + var(--cx-badge-indicator-right) );--cx-badge-indicator-center-x: calc(100% - var(--cx-badge-indicator-center-offset-x));--cx-badge-indicator-center-y: calc( (var(--cx-badge-indicator-height) / 4) + var(--cx-badge-indicator-top) );--cx-badge-cutout-radius: calc( (var(--cx-badge-indicator-height) / 2) + var(--cx-badge-cutout-size) );--cx-badge-cutout-straight-width: calc( var(--cx-badge-indicator-width) - var(--cx-badge-indicator-height) );--cx-badge-cutout-left-center-x: calc( var(--cx-badge-indicator-center-x) - (var(--cx-badge-cutout-straight-width) / 2) );--cx-badge-cutout-right-center-x: calc( var(--cx-badge-indicator-center-x) + (var(--cx-badge-cutout-straight-width) / 2) );--cx-badge-cutout-rect-right: calc( var(--cx-badge-indicator-center-offset-x) - (var(--cx-badge-cutout-straight-width) / 2) );--cx-badge-cutout-rect-top: calc( var(--cx-badge-indicator-center-y) - var(--cx-badge-cutout-radius) );mask-image:linear-gradient(#000 0 0),radial-gradient(circle var(--cx-badge-cutout-radius) at var(--cx-badge-cutout-left-center-x) var(--cx-badge-indicator-center-y), #000 0 calc(100% - 1px), transparent 100%),linear-gradient(#000 0 0),radial-gradient(circle var(--cx-badge-cutout-radius) at var(--cx-badge-cutout-right-center-x) var(--cx-badge-indicator-center-y), #000 0 calc(100% - 1px), transparent 100%);mask-composite:subtract,add,add;mask-position:0 0,0 0,right var(--cx-badge-cutout-rect-right) top var(--cx-badge-cutout-rect-top),0 0;mask-repeat:no-repeat;mask-size:100% 100%,100% 100%,max(1px,var(--cx-badge-cutout-straight-width)) calc(2*var(--cx-badge-cutout-radius)),100% 100%;-webkit-mask-image:linear-gradient(#000 0 0),radial-gradient(circle var(--cx-badge-cutout-radius) at var(--cx-badge-cutout-left-center-x) var(--cx-badge-indicator-center-y), #000 0 calc(100% - 1px), transparent 100%),linear-gradient(#000 0 0),radial-gradient(circle var(--cx-badge-cutout-radius) at var(--cx-badge-cutout-right-center-x) var(--cx-badge-indicator-center-y), #000 0 calc(100% - 1px), transparent 100%);-webkit-mask-composite:xor,source-over,source-over;-webkit-mask-position:0 0,0 0,right var(--cx-badge-cutout-rect-right) top var(--cx-badge-cutout-rect-top),0 0;-webkit-mask-repeat:no-repeat;-webkit-mask-size:100% 100%,100% 100%,max(1px,var(--cx-badge-cutout-straight-width)) calc(2*var(--cx-badge-cutout-radius)),100% 100%}.cx-badge__indicator{position:absolute;top:0;right:0;display:inline-flex;align-items:center;justify-content:center;transform:translate(25%, -25%);pointer-events:none;background:var(--primary);border-radius:var(--radius-pill);corner-shape:round;color:var(--on-ink);box-sizing:border-box;overflow:hidden}.cx-badge--danger .cx-badge__indicator{background:var(--danger)}.cx-badge--accent .cx-badge__indicator{background:var(--accent)}.cx-badge--success .cx-badge__indicator{background:var(--success)}.cx-badge--warning .cx-badge__indicator{background:var(--warning)}.cx-badge--inline{gap:var(--space-xs)}.cx-badge--inline .cx-badge__content:empty{display:none}.cx-badge--inline .cx-badge__indicator{position:static;transform:none;flex-shrink:0}.cx-badge__indicator--dot{width:var(--cx-badge-indicator-width);height:var(--cx-badge-indicator-height);border-radius:var(--radius-pill);corner-shape:round}.cx-badge--with-value{width:auto;min-width:var(--cx-badge-indicator-width);min-height:var(--cx-badge-indicator-height)}.cx-badge--with-value .cx-badge__content--cutout{--cx-badge-indicator-right: -2px;--cx-badge-indicator-top: -2px}.cx-badge__indicator--count,.cx-badge__indicator--text{top:-2px;right:-2px;height:var(--cx-badge-indicator-height);min-width:16px;border-radius:var(--radius-pill);corner-shape:round;color:var(--surface)}.cx-badge__indicator--count{padding:0 var(--space-2xs)}.cx-badge__indicator--text{min-width:24px;padding:0 var(--space-xs)}.cx-badge__value{display:block;line-height:1;white-space:nowrap;font-size:var(--font-size-body-xs);font-weight:var(--font-weight-medium);color:currentColor}.cx-badge__value--text{text-transform:uppercase}"], changeDetection: i0.ChangeDetectionStrategy.OnPush });
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "22.0.8", ngImport: i0, type: CxBadgeComponent, decorators: [{
            type: Component,
            args: [{ selector: 'cx-badge', changeDetection: ChangeDetectionStrategy.OnPush, template: "<span\n  class=\"cx-badge\"\n  [class.cx-badge--inline]=\"placement === 'inline'\"\n  [class.cx-badge--corner]=\"placement === 'corner'\"\n  [class.cx-badge--visible]=\"visible\"\n  [class.cx-badge--with-value]=\"hasValue()\"\n  [class.cx-badge--default]=\"mood === 'default'\"\n  [class.cx-badge--accent]=\"mood === 'accent'\"\n  [class.cx-badge--success]=\"mood === 'success'\"\n  [class.cx-badge--warning]=\"mood === 'warning'\"\n  [class.cx-badge--danger]=\"mood === 'danger'\"\n  [style.--cx-badge-indicator-width]=\"indicatorWidth()\"\n  [style.--cx-badge-indicator-height]=\"indicatorHeight()\"\n>\n  <span\n    class=\"cx-badge__content\"\n    [class.cx-badge__content--cutout]=\"placement === 'corner' && showsIndicator()\"\n  >\n    <ng-content />\n  </span>\n\n  @if (showsIndicator()) {\n    <span\n      #indicator\n      class=\"cx-badge__indicator\"\n      [class.cx-badge__indicator--dot]=\"!hasValue()\"\n      [class.cx-badge__indicator--count]=\"showsCount()\"\n      [class.cx-badge__indicator--text]=\"showsText()\"\n      [attr.role]=\"ariaLabel?.trim() ? 'img' : null\"\n      [attr.aria-label]=\"ariaLabel?.trim() || null\"\n      [attr.aria-hidden]=\"ariaLabel?.trim() ? null : 'true'\"\n    >\n      @if (showsCount()) {\n        <span class=\"cx-badge__value\">{{ displayValue() }}</span>\n      } @else if (showsText()) {\n        <span class=\"cx-badge__value cx-badge__value--text\">{{ displayText() }}</span>\n      }\n    </span>\n  }\n</span>\n", styles: [":host{display:inline-flex;width:auto}.cx-badge{--cx-badge-cutout-size: 3px;--cx-badge-indicator-width: 8px;--cx-badge-indicator-height: 8px;position:relative;display:inline-flex;min-width:8px;min-height:8px;align-items:center;justify-content:center;background:rgba(0,0,0,0);color:var(--on-ink);box-sizing:border-box}.cx-badge__content{display:inline-flex}.cx-badge__content--cutout{--cx-badge-indicator-right: 0px;--cx-badge-indicator-top: 0px;--cx-badge-indicator-center-offset-x: calc( (var(--cx-badge-indicator-width) / 4) + var(--cx-badge-indicator-right) );--cx-badge-indicator-center-x: calc(100% - var(--cx-badge-indicator-center-offset-x));--cx-badge-indicator-center-y: calc( (var(--cx-badge-indicator-height) / 4) + var(--cx-badge-indicator-top) );--cx-badge-cutout-radius: calc( (var(--cx-badge-indicator-height) / 2) + var(--cx-badge-cutout-size) );--cx-badge-cutout-straight-width: calc( var(--cx-badge-indicator-width) - var(--cx-badge-indicator-height) );--cx-badge-cutout-left-center-x: calc( var(--cx-badge-indicator-center-x) - (var(--cx-badge-cutout-straight-width) / 2) );--cx-badge-cutout-right-center-x: calc( var(--cx-badge-indicator-center-x) + (var(--cx-badge-cutout-straight-width) / 2) );--cx-badge-cutout-rect-right: calc( var(--cx-badge-indicator-center-offset-x) - (var(--cx-badge-cutout-straight-width) / 2) );--cx-badge-cutout-rect-top: calc( var(--cx-badge-indicator-center-y) - var(--cx-badge-cutout-radius) );mask-image:linear-gradient(#000 0 0),radial-gradient(circle var(--cx-badge-cutout-radius) at var(--cx-badge-cutout-left-center-x) var(--cx-badge-indicator-center-y), #000 0 calc(100% - 1px), transparent 100%),linear-gradient(#000 0 0),radial-gradient(circle var(--cx-badge-cutout-radius) at var(--cx-badge-cutout-right-center-x) var(--cx-badge-indicator-center-y), #000 0 calc(100% - 1px), transparent 100%);mask-composite:subtract,add,add;mask-position:0 0,0 0,right var(--cx-badge-cutout-rect-right) top var(--cx-badge-cutout-rect-top),0 0;mask-repeat:no-repeat;mask-size:100% 100%,100% 100%,max(1px,var(--cx-badge-cutout-straight-width)) calc(2*var(--cx-badge-cutout-radius)),100% 100%;-webkit-mask-image:linear-gradient(#000 0 0),radial-gradient(circle var(--cx-badge-cutout-radius) at var(--cx-badge-cutout-left-center-x) var(--cx-badge-indicator-center-y), #000 0 calc(100% - 1px), transparent 100%),linear-gradient(#000 0 0),radial-gradient(circle var(--cx-badge-cutout-radius) at var(--cx-badge-cutout-right-center-x) var(--cx-badge-indicator-center-y), #000 0 calc(100% - 1px), transparent 100%);-webkit-mask-composite:xor,source-over,source-over;-webkit-mask-position:0 0,0 0,right var(--cx-badge-cutout-rect-right) top var(--cx-badge-cutout-rect-top),0 0;-webkit-mask-repeat:no-repeat;-webkit-mask-size:100% 100%,100% 100%,max(1px,var(--cx-badge-cutout-straight-width)) calc(2*var(--cx-badge-cutout-radius)),100% 100%}.cx-badge__indicator{position:absolute;top:0;right:0;display:inline-flex;align-items:center;justify-content:center;transform:translate(25%, -25%);pointer-events:none;background:var(--primary);border-radius:var(--radius-pill);corner-shape:round;color:var(--on-ink);box-sizing:border-box;overflow:hidden}.cx-badge--danger .cx-badge__indicator{background:var(--danger)}.cx-badge--accent .cx-badge__indicator{background:var(--accent)}.cx-badge--success .cx-badge__indicator{background:var(--success)}.cx-badge--warning .cx-badge__indicator{background:var(--warning)}.cx-badge--inline{gap:var(--space-xs)}.cx-badge--inline .cx-badge__content:empty{display:none}.cx-badge--inline .cx-badge__indicator{position:static;transform:none;flex-shrink:0}.cx-badge__indicator--dot{width:var(--cx-badge-indicator-width);height:var(--cx-badge-indicator-height);border-radius:var(--radius-pill);corner-shape:round}.cx-badge--with-value{width:auto;min-width:var(--cx-badge-indicator-width);min-height:var(--cx-badge-indicator-height)}.cx-badge--with-value .cx-badge__content--cutout{--cx-badge-indicator-right: -2px;--cx-badge-indicator-top: -2px}.cx-badge__indicator--count,.cx-badge__indicator--text{top:-2px;right:-2px;height:var(--cx-badge-indicator-height);min-width:16px;border-radius:var(--radius-pill);corner-shape:round;color:var(--surface)}.cx-badge__indicator--count{padding:0 var(--space-2xs)}.cx-badge__indicator--text{min-width:24px;padding:0 var(--space-xs)}.cx-badge__value{display:block;line-height:1;white-space:nowrap;font-size:var(--font-size-body-xs);font-weight:var(--font-weight-medium);color:currentColor}.cx-badge__value--text{text-transform:uppercase}"] }]
        }], propDecorators: { visible: [{
                type: Input
            }], placement: [{
                type: Input
            }], count: [{
                type: Input
            }], text: [{
                type: Input
            }], mood: [{
                type: Input
            }], ariaLabel: [{
                type: Input
            }], indicatorRef: [{
                type: ViewChild,
                args: ['indicator', { read: ElementRef }]
            }] } });
