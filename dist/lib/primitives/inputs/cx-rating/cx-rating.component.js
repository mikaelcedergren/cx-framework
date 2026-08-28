import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output, computed, signal } from '@angular/core';
import { CxIconComponent } from '../../media/cx-icon/index.js';
import * as i0 from "@angular/core";
/**
 * A star (or custom-icon) rating. Interactive by default for capturing a score;
 * `readonly` turns it into a display that supports fractional values such as 3.5.
 */
export class CxRatingComponent {
    valueState = signal(0, /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "valueState" }] : /* istanbul ignore next */ []));
    maxState = signal(5, /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "maxState" }] : /* istanbul ignore next */ []));
    hoverState = signal(null, /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "hoverState" }] : /* istanbul ignore next */ []));
    readonlyState = false;
    disabledState = false;
    icon = 'star-on';
    size = 'default';
    ariaLabel = 'Rating';
    set readonly(value) {
        this.readonlyState = !!value;
        if (this.readonlyState) {
            this.hoverState.set(null);
        }
    }
    get readonly() {
        return this.readonlyState;
    }
    set disabled(value) {
        this.disabledState = !!value;
        if (this.disabledState) {
            this.hoverState.set(null);
        }
    }
    get disabled() {
        return this.disabledState;
    }
    set value(value) {
        this.valueState.set(this.clamp(value ?? 0));
    }
    set max(value) {
        const next = Math.max(1, Math.round(value ?? 5));
        this.maxState.set(next);
        this.valueState.set(this.clamp(this.valueState()));
    }
    valueChange = new EventEmitter();
    value$ = this.valueState.asReadonly();
    max$ = this.maxState.asReadonly();
    stars$ = computed(() => Array.from({ length: this.maxState() }, (_, index) => index + 1), /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "stars$" }] : /* istanbul ignore next */ []));
    displayValue$ = computed(() => this.hoverState() ?? this.valueState(), /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "displayValue$" }] : /* istanbul ignore next */ []));
    get iconSize() {
        return this.size === 'small' ? 16 : this.size === 'large' ? 24 : 20;
    }
    get interactive() {
        return !this.readonly && !this.disabled;
    }
    get valueText() {
        return `${this.valueState()} of ${this.maxState()}`;
    }
    fillPercent(index) {
        const fraction = this.displayValue$() - (index - 1);
        return Math.max(0, Math.min(1, fraction)) * 100;
    }
    onStarEnter(index) {
        if (this.interactive) {
            this.hoverState.set(index);
        }
    }
    onLeave() {
        this.hoverState.set(null);
    }
    onStarClick(index) {
        if (!this.interactive) {
            return;
        }
        this.commit(index);
    }
    onKeydown(event) {
        if (!this.interactive) {
            return;
        }
        const current = this.valueState();
        let next;
        switch (event.key) {
            case 'ArrowRight':
            case 'ArrowUp':
                next = current + 1;
                break;
            case 'ArrowLeft':
            case 'ArrowDown':
                next = current - 1;
                break;
            case 'Home':
                next = 0;
                break;
            case 'End':
                next = this.maxState();
                break;
            default:
                return;
        }
        event.preventDefault();
        this.commit(next);
    }
    commit(next) {
        const clamped = this.clamp(next);
        this.hoverState.set(null);
        if (clamped !== this.valueState()) {
            this.valueState.set(clamped);
            this.valueChange.emit(clamped);
        }
    }
    clamp(value) {
        if (Number.isNaN(value)) {
            return 0;
        }
        return Math.max(0, Math.min(this.maxState(), value));
    }
    static ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "22.0.8", ngImport: i0, type: CxRatingComponent, deps: [], target: i0.ɵɵFactoryTarget.Component });
    static ɵcmp = i0.ɵɵngDeclareComponent({ minVersion: "17.0.0", version: "22.0.8", type: CxRatingComponent, isStandalone: true, selector: "cx-rating", inputs: { icon: "icon", size: "size", ariaLabel: "ariaLabel", readonly: "readonly", disabled: "disabled", value: "value", max: "max" }, outputs: { valueChange: "valueChange" }, host: { properties: { "class.cx-rating--small": "size === 'small'", "class.cx-rating--large": "size === 'large'", "class.cx-rating--readonly": "readonly", "class.cx-rating--disabled": "disabled" } }, ngImport: i0, template: "<div\n  class=\"cx-rating\"\n  [attr.role]=\"interactive ? 'slider' : 'img'\"\n  [attr.tabindex]=\"interactive ? 0 : null\"\n  [attr.aria-label]=\"ariaLabel\"\n  [attr.aria-valuemin]=\"interactive ? 0 : null\"\n  [attr.aria-valuemax]=\"interactive ? max$() : null\"\n  [attr.aria-valuenow]=\"interactive ? value$() : null\"\n  [attr.aria-valuetext]=\"valueText\"\n  [attr.aria-readonly]=\"readonly ? 'true' : null\"\n  [attr.aria-disabled]=\"disabled ? 'true' : null\"\n  (keydown)=\"onKeydown($event)\"\n  (mouseleave)=\"onLeave()\"\n>\n  @for (star of stars$(); track star) {\n    <span\n      class=\"cx-rating__star\"\n      (mouseenter)=\"onStarEnter(star)\"\n      (click)=\"onStarClick(star)\"\n    >\n      <cx-icon class=\"cx-rating__glyph cx-rating__glyph--empty\" [icon]=\"icon\" [size]=\"iconSize\" />\n      <span class=\"cx-rating__fill\" [style.width.%]=\"fillPercent(star)\">\n        <cx-icon class=\"cx-rating__glyph cx-rating__glyph--full\" [icon]=\"icon\" [size]=\"iconSize\" />\n      </span>\n    </span>\n  }\n</div>\n", styles: [":host{display:inline-flex}.cx-rating{display:inline-flex;align-items:center;gap:var(--space-2xs);border-radius:var(--radius-sm)}.cx-rating:focus-visible{outline:var(--outline-tab);outline-offset:2px}:host(.cx-rating--small) .cx-rating{gap:0}:host(.cx-rating--large) .cx-rating{gap:var(--space-xs)}.cx-rating__star{position:relative;display:inline-flex;line-height:0;color:var(--opacity-mid);cursor:pointer;transition:transform var(--motion-fast) ease}:host(.cx-rating--readonly) .cx-rating__star,:host(.cx-rating--disabled) .cx-rating__star{cursor:default}.cx-rating__star:active{transform:scale(0.85)}:host(.cx-rating--readonly) .cx-rating__star:active,:host(.cx-rating--disabled) .cx-rating__star:active{transform:none}.cx-rating__glyph--empty{color:var(--opacity-mid)}.cx-rating__fill{position:absolute;inset:0;display:inline-flex;overflow:hidden;color:var(--yellow);pointer-events:none}.cx-rating__glyph--full{color:var(--yellow)}:host(.cx-rating--disabled){opacity:var(--opacity-disabled)}"], dependencies: [{ kind: "component", type: CxIconComponent, selector: "cx-icon", inputs: ["icon", "size", "mood", "shape"] }], changeDetection: i0.ChangeDetectionStrategy.OnPush });
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "22.0.8", ngImport: i0, type: CxRatingComponent, decorators: [{
            type: Component,
            args: [{ selector: 'cx-rating', imports: [CxIconComponent], host: {
                        '[class.cx-rating--small]': "size === 'small'",
                        '[class.cx-rating--large]': "size === 'large'",
                        '[class.cx-rating--readonly]': 'readonly',
                        '[class.cx-rating--disabled]': 'disabled',
                    }, changeDetection: ChangeDetectionStrategy.OnPush, template: "<div\n  class=\"cx-rating\"\n  [attr.role]=\"interactive ? 'slider' : 'img'\"\n  [attr.tabindex]=\"interactive ? 0 : null\"\n  [attr.aria-label]=\"ariaLabel\"\n  [attr.aria-valuemin]=\"interactive ? 0 : null\"\n  [attr.aria-valuemax]=\"interactive ? max$() : null\"\n  [attr.aria-valuenow]=\"interactive ? value$() : null\"\n  [attr.aria-valuetext]=\"valueText\"\n  [attr.aria-readonly]=\"readonly ? 'true' : null\"\n  [attr.aria-disabled]=\"disabled ? 'true' : null\"\n  (keydown)=\"onKeydown($event)\"\n  (mouseleave)=\"onLeave()\"\n>\n  @for (star of stars$(); track star) {\n    <span\n      class=\"cx-rating__star\"\n      (mouseenter)=\"onStarEnter(star)\"\n      (click)=\"onStarClick(star)\"\n    >\n      <cx-icon class=\"cx-rating__glyph cx-rating__glyph--empty\" [icon]=\"icon\" [size]=\"iconSize\" />\n      <span class=\"cx-rating__fill\" [style.width.%]=\"fillPercent(star)\">\n        <cx-icon class=\"cx-rating__glyph cx-rating__glyph--full\" [icon]=\"icon\" [size]=\"iconSize\" />\n      </span>\n    </span>\n  }\n</div>\n", styles: [":host{display:inline-flex}.cx-rating{display:inline-flex;align-items:center;gap:var(--space-2xs);border-radius:var(--radius-sm)}.cx-rating:focus-visible{outline:var(--outline-tab);outline-offset:2px}:host(.cx-rating--small) .cx-rating{gap:0}:host(.cx-rating--large) .cx-rating{gap:var(--space-xs)}.cx-rating__star{position:relative;display:inline-flex;line-height:0;color:var(--opacity-mid);cursor:pointer;transition:transform var(--motion-fast) ease}:host(.cx-rating--readonly) .cx-rating__star,:host(.cx-rating--disabled) .cx-rating__star{cursor:default}.cx-rating__star:active{transform:scale(0.85)}:host(.cx-rating--readonly) .cx-rating__star:active,:host(.cx-rating--disabled) .cx-rating__star:active{transform:none}.cx-rating__glyph--empty{color:var(--opacity-mid)}.cx-rating__fill{position:absolute;inset:0;display:inline-flex;overflow:hidden;color:var(--yellow);pointer-events:none}.cx-rating__glyph--full{color:var(--yellow)}:host(.cx-rating--disabled){opacity:var(--opacity-disabled)}"] }]
        }], propDecorators: { icon: [{
                type: Input
            }], size: [{
                type: Input
            }], ariaLabel: [{
                type: Input
            }], readonly: [{
                type: Input
            }], disabled: [{
                type: Input
            }], value: [{
                type: Input
            }], max: [{
                type: Input
            }], valueChange: [{
                type: Output
            }] } });
