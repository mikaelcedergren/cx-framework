import { ChangeDetectionStrategy, Component, Input, signal } from '@angular/core';
import * as i0 from "@angular/core";
export class CxSecretDisplayComponent {
    copyResetTimer;
    valueState = '';
    maskedState = false;
    ariaLabelState = 'Secret value';
    revealed = signal(false, /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "revealed" }] : /* istanbul ignore next */ []));
    copyState = signal('idle', /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "copyState" }] : /* istanbul ignore next */ []));
    set value(value) {
        this.valueState = value ?? '';
    }
    get value() {
        return this.valueState;
    }
    set masked(value) {
        this.maskedState = value;
        if (value) {
            this.revealed.set(false);
        }
    }
    get masked() {
        return this.maskedState;
    }
    set ariaLabel(value) {
        const label = value?.trim();
        this.ariaLabelState = label || 'Secret value';
    }
    get ariaLabel() {
        return this.ariaLabelState;
    }
    ngOnDestroy() {
        if (this.copyResetTimer) {
            clearTimeout(this.copyResetTimer);
        }
    }
    displayValue() {
        if (this.isHidden()) {
            return '•'.repeat(this.value.length);
        }
        return this.value;
    }
    valueAriaLabel() {
        return this.isHidden() ? `${this.ariaLabel}, hidden` : this.ariaLabel;
    }
    revealLabel() {
        return this.isHidden() ? 'Show secret' : 'Hide secret';
    }
    copyAriaLabel() {
        const state = this.copyState();
        if (state === 'copied')
            return 'Copied';
        if (state === 'failed')
            return 'Copy failed';
        return `Copy ${this.ariaLabel}`;
    }
    copyLabel() {
        const state = this.copyState();
        if (state === 'copied')
            return 'Copied';
        if (state === 'failed')
            return 'Copy failed';
        return 'Copy';
    }
    isHidden() {
        return this.masked && !this.revealed();
    }
    toggleReveal() {
        this.revealed.update(value => !value);
    }
    async copy() {
        if (!this.value)
            return;
        try {
            await navigator.clipboard.writeText(this.value);
            this.flashCopyState('copied');
        }
        catch {
            this.flashCopyState('failed');
        }
    }
    flashCopyState(state) {
        this.copyState.set(state);
        if (this.copyResetTimer) {
            clearTimeout(this.copyResetTimer);
        }
        this.copyResetTimer = setTimeout(() => this.copyState.set('idle'), 1500);
    }
    static ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "22.0.8", ngImport: i0, type: CxSecretDisplayComponent, deps: [], target: i0.ɵɵFactoryTarget.Component });
    static ɵcmp = i0.ɵɵngDeclareComponent({ minVersion: "17.0.0", version: "22.0.8", type: CxSecretDisplayComponent, isStandalone: true, selector: "cx-secret-display", inputs: { value: "value", masked: "masked", ariaLabel: "ariaLabel" }, host: { properties: { "class.cx-secret-display-host--empty": "!value" } }, ngImport: i0, template: "<div class=\"cx-secret-display\">\n  <div class=\"cx-secret-display__value\" role=\"text\" [attr.aria-label]=\"valueAriaLabel()\">\n    <span class=\"cx-secret-display__value-text\" aria-hidden=\"true\">{{ displayValue() || ' ' }}</span>\n  </div>\n\n  <div class=\"cx-secret-display__actions\">\n    @if (masked) {\n      <button\n        type=\"button\"\n        class=\"cx-secret-display__btn\"\n        [attr.aria-label]=\"revealLabel()\"\n        [attr.aria-pressed]=\"!isHidden()\"\n        (click)=\"toggleReveal()\"\n      >\n        @if (isHidden()) {\n          <svg class=\"cx-secret-display__btn-icon\" viewBox=\"0 0 24 24\" aria-hidden=\"true\">\n            <path d=\"M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z\" />\n            <circle cx=\"12\" cy=\"12\" r=\"3\" />\n          </svg>\n        } @else {\n          <svg class=\"cx-secret-display__btn-icon\" viewBox=\"0 0 24 24\" aria-hidden=\"true\">\n            <path d=\"M17.94 17.94A10.9 10.9 0 0 1 12 19c-6.5 0-10-7-10-7a18.4 18.4 0 0 1 4.06-5.06\" />\n            <path d=\"M9.9 5.1A10.9 10.9 0 0 1 12 5c6.5 0 10 7 10 7a18.4 18.4 0 0 1-2.16 3.15\" />\n            <line x1=\"1\" y1=\"1\" x2=\"23\" y2=\"23\" />\n            <path d=\"M9.88 9.88A3 3 0 0 0 14.12 14.12\" />\n          </svg>\n        }\n      </button>\n    }\n\n    <button\n      type=\"button\"\n      class=\"cx-secret-display__btn cx-secret-display__btn-copy\"\n      [class.is-copied]=\"copyState() === 'copied'\"\n      [class.is-failed]=\"copyState() === 'failed'\"\n      [attr.aria-label]=\"copyAriaLabel()\"\n      [disabled]=\"!value\"\n      (click)=\"copy()\"\n    >\n      <span class=\"cx-secret-display__btn-icon-wrap\" aria-hidden=\"true\">\n        @switch (copyState()) {\n          @case ('copied') {\n            <svg class=\"cx-secret-display__btn-icon\" viewBox=\"0 0 24 24\">\n              <polyline points=\"20 6 9 17 4 12\" />\n            </svg>\n          }\n          @case ('failed') {\n            <svg class=\"cx-secret-display__btn-icon\" viewBox=\"0 0 24 24\">\n              <line x1=\"12\" y1=\"8\" x2=\"12\" y2=\"13\" />\n              <line x1=\"12\" y1=\"16\" x2=\"12\" y2=\"16\" />\n              <circle cx=\"12\" cy=\"12\" r=\"9\" />\n            </svg>\n          }\n          @default {\n            <svg class=\"cx-secret-display__btn-icon\" viewBox=\"0 0 24 24\">\n              <rect x=\"9\" y=\"9\" width=\"13\" height=\"13\" rx=\"2\" ry=\"2\" />\n              <path d=\"M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1\" />\n            </svg>\n          }\n        }\n      </span>\n      <span class=\"cx-secret-display__btn-label\">{{ copyLabel() }}</span>\n    </button>\n  </div>\n</div>\n", styles: [":host{display:inline-block;width:100%}.cx-secret-display{display:inline-flex;flex-direction:row;width:100%;align-items:center;gap:var(--space-sm);padding:var(--space-xs) var(--space-sm);border:var(--line);border-radius:var(--radius-sm);background:var(--opacity-low)}.cx-secret-display__value{display:flex;min-width:0;flex:1 1 auto;align-items:center;padding:var(--space-xs) 0;color:var(--ink);font-family:var(--font-family-mono);font-size:var(--font-size-body);letter-spacing:0;line-height:var(--line-height-body);overflow-wrap:anywhere;user-select:text}:host(.cx-secret-display-host--empty) .cx-secret-display__value{color:var(--opacity-high)}.cx-secret-display__value-text{display:inline-block;min-height:1em}.cx-secret-display__actions{display:inline-flex;flex-direction:row;flex:0 0 auto;align-items:center;gap:var(--space-xs)}.cx-secret-display__btn{font:inherit;display:inline-flex;gap:var(--space-xs);height:var(--controller-size);align-items:center;justify-content:center;padding:0 var(--space-sm);border:0;border-radius:var(--radius-sm);background:rgba(0,0,0,0);color:var(--opacity-high);cursor:pointer;transition:background-color var(--motion-fast) ease,color var(--motion-fast) ease}.cx-secret-display__btn:hover:not(:disabled){background:var(--opacity-low);color:var(--ink)}.cx-secret-display__btn:active:not(:disabled){background:var(--opacity-mid)}.cx-secret-display__btn:disabled{cursor:default;opacity:var(--opacity-disabled)}.cx-secret-display__btn:focus-visible{outline:var(--outline-tab);outline-offset:var(--outline-tab-offset)}.cx-secret-display__btn-icon-wrap{display:inline-flex;width:16px;height:16px;align-items:center;justify-content:center}.cx-secret-display__btn-icon{display:block;width:16px;height:16px;fill:none;stroke:currentColor;stroke-width:2;stroke-linecap:round;stroke-linejoin:round}.cx-secret-display__btn-label{font-size:var(--font-size-body-sm);font-weight:var(--font-weight-medium);white-space:nowrap}.cx-secret-display__btn-copy.is-copied{background:var(--success-opacity);color:var(--success)}.cx-secret-display__btn-copy.is-copied:hover:not(:disabled){background:var(--success-opacity);color:var(--success)}.cx-secret-display__btn-copy.is-failed{background:var(--danger-opacity);color:var(--danger)}.cx-secret-display__btn-copy.is-failed:hover:not(:disabled){background:var(--danger-opacity);color:var(--danger)}"], changeDetection: i0.ChangeDetectionStrategy.OnPush });
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "22.0.8", ngImport: i0, type: CxSecretDisplayComponent, decorators: [{
            type: Component,
            args: [{ selector: 'cx-secret-display', host: {
                        '[class.cx-secret-display-host--empty]': '!value',
                    }, changeDetection: ChangeDetectionStrategy.OnPush, template: "<div class=\"cx-secret-display\">\n  <div class=\"cx-secret-display__value\" role=\"text\" [attr.aria-label]=\"valueAriaLabel()\">\n    <span class=\"cx-secret-display__value-text\" aria-hidden=\"true\">{{ displayValue() || ' ' }}</span>\n  </div>\n\n  <div class=\"cx-secret-display__actions\">\n    @if (masked) {\n      <button\n        type=\"button\"\n        class=\"cx-secret-display__btn\"\n        [attr.aria-label]=\"revealLabel()\"\n        [attr.aria-pressed]=\"!isHidden()\"\n        (click)=\"toggleReveal()\"\n      >\n        @if (isHidden()) {\n          <svg class=\"cx-secret-display__btn-icon\" viewBox=\"0 0 24 24\" aria-hidden=\"true\">\n            <path d=\"M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z\" />\n            <circle cx=\"12\" cy=\"12\" r=\"3\" />\n          </svg>\n        } @else {\n          <svg class=\"cx-secret-display__btn-icon\" viewBox=\"0 0 24 24\" aria-hidden=\"true\">\n            <path d=\"M17.94 17.94A10.9 10.9 0 0 1 12 19c-6.5 0-10-7-10-7a18.4 18.4 0 0 1 4.06-5.06\" />\n            <path d=\"M9.9 5.1A10.9 10.9 0 0 1 12 5c6.5 0 10 7 10 7a18.4 18.4 0 0 1-2.16 3.15\" />\n            <line x1=\"1\" y1=\"1\" x2=\"23\" y2=\"23\" />\n            <path d=\"M9.88 9.88A3 3 0 0 0 14.12 14.12\" />\n          </svg>\n        }\n      </button>\n    }\n\n    <button\n      type=\"button\"\n      class=\"cx-secret-display__btn cx-secret-display__btn-copy\"\n      [class.is-copied]=\"copyState() === 'copied'\"\n      [class.is-failed]=\"copyState() === 'failed'\"\n      [attr.aria-label]=\"copyAriaLabel()\"\n      [disabled]=\"!value\"\n      (click)=\"copy()\"\n    >\n      <span class=\"cx-secret-display__btn-icon-wrap\" aria-hidden=\"true\">\n        @switch (copyState()) {\n          @case ('copied') {\n            <svg class=\"cx-secret-display__btn-icon\" viewBox=\"0 0 24 24\">\n              <polyline points=\"20 6 9 17 4 12\" />\n            </svg>\n          }\n          @case ('failed') {\n            <svg class=\"cx-secret-display__btn-icon\" viewBox=\"0 0 24 24\">\n              <line x1=\"12\" y1=\"8\" x2=\"12\" y2=\"13\" />\n              <line x1=\"12\" y1=\"16\" x2=\"12\" y2=\"16\" />\n              <circle cx=\"12\" cy=\"12\" r=\"9\" />\n            </svg>\n          }\n          @default {\n            <svg class=\"cx-secret-display__btn-icon\" viewBox=\"0 0 24 24\">\n              <rect x=\"9\" y=\"9\" width=\"13\" height=\"13\" rx=\"2\" ry=\"2\" />\n              <path d=\"M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1\" />\n            </svg>\n          }\n        }\n      </span>\n      <span class=\"cx-secret-display__btn-label\">{{ copyLabel() }}</span>\n    </button>\n  </div>\n</div>\n", styles: [":host{display:inline-block;width:100%}.cx-secret-display{display:inline-flex;flex-direction:row;width:100%;align-items:center;gap:var(--space-sm);padding:var(--space-xs) var(--space-sm);border:var(--line);border-radius:var(--radius-sm);background:var(--opacity-low)}.cx-secret-display__value{display:flex;min-width:0;flex:1 1 auto;align-items:center;padding:var(--space-xs) 0;color:var(--ink);font-family:var(--font-family-mono);font-size:var(--font-size-body);letter-spacing:0;line-height:var(--line-height-body);overflow-wrap:anywhere;user-select:text}:host(.cx-secret-display-host--empty) .cx-secret-display__value{color:var(--opacity-high)}.cx-secret-display__value-text{display:inline-block;min-height:1em}.cx-secret-display__actions{display:inline-flex;flex-direction:row;flex:0 0 auto;align-items:center;gap:var(--space-xs)}.cx-secret-display__btn{font:inherit;display:inline-flex;gap:var(--space-xs);height:var(--controller-size);align-items:center;justify-content:center;padding:0 var(--space-sm);border:0;border-radius:var(--radius-sm);background:rgba(0,0,0,0);color:var(--opacity-high);cursor:pointer;transition:background-color var(--motion-fast) ease,color var(--motion-fast) ease}.cx-secret-display__btn:hover:not(:disabled){background:var(--opacity-low);color:var(--ink)}.cx-secret-display__btn:active:not(:disabled){background:var(--opacity-mid)}.cx-secret-display__btn:disabled{cursor:default;opacity:var(--opacity-disabled)}.cx-secret-display__btn:focus-visible{outline:var(--outline-tab);outline-offset:var(--outline-tab-offset)}.cx-secret-display__btn-icon-wrap{display:inline-flex;width:16px;height:16px;align-items:center;justify-content:center}.cx-secret-display__btn-icon{display:block;width:16px;height:16px;fill:none;stroke:currentColor;stroke-width:2;stroke-linecap:round;stroke-linejoin:round}.cx-secret-display__btn-label{font-size:var(--font-size-body-sm);font-weight:var(--font-weight-medium);white-space:nowrap}.cx-secret-display__btn-copy.is-copied{background:var(--success-opacity);color:var(--success)}.cx-secret-display__btn-copy.is-copied:hover:not(:disabled){background:var(--success-opacity);color:var(--success)}.cx-secret-display__btn-copy.is-failed{background:var(--danger-opacity);color:var(--danger)}.cx-secret-display__btn-copy.is-failed:hover:not(:disabled){background:var(--danger-opacity);color:var(--danger)}"] }]
        }], propDecorators: { value: [{
                type: Input
            }], masked: [{
                type: Input
            }], ariaLabel: [{
                type: Input
            }] } });
