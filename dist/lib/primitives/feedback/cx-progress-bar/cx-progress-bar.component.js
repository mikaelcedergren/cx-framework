import { ChangeDetectionStrategy, Component, Input, computed, signal } from '@angular/core';
import * as i0 from "@angular/core";
let cxProgressBarId = 0;
export class CxProgressBarComponent {
    valueState = signal(64, /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "valueState" }] : /* istanbul ignore next */ []));
    maxState = signal(100, /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "maxState" }] : /* istanbul ignore next */ []));
    instanceId = ++cxProgressBarId;
    labelId = `cx-progress-bar-label-${this.instanceId}`;
    hintId = `cx-progress-bar-hint-${this.instanceId}`;
    label = 'Progress';
    ariaLabel;
    hint;
    mood = 'default';
    showValue = true;
    indeterminate = false;
    valueLabel;
    set value(value) {
        this.valueState.set(Number.isFinite(value) ? value : 0);
    }
    set max(value) {
        this.maxState.set(Number.isFinite(value) && value > 0 ? value : 100);
    }
    normalizedValue$ = computed(() => {
        const max = this.maxState();
        const value = this.valueState();
        return Math.min(Math.max(value, 0), max);
    }, /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "normalizedValue$" }] : /* istanbul ignore next */ []));
    max$ = this.maxState.asReadonly();
    progressRatio() {
        if (this.indeterminate) {
            return 0;
        }
        return this.normalizedValue$() / this.maxState();
    }
    progressPercent() {
        return Math.round(this.progressRatio() * 100);
    }
    resolvedValueLabel() {
        const explicit = this.valueLabel?.trim();
        if (explicit) {
            return explicit;
        }
        if (this.indeterminate) {
            return undefined;
        }
        return `${this.progressPercent()}%`;
    }
    visibleLabel() {
        return this.label?.trim() ?? '';
    }
    visibleHint() {
        return this.hint?.trim() ?? '';
    }
    resolvedAriaLabel() {
        return this.ariaLabel?.trim() || 'Progress';
    }
    static ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "22.0.8", ngImport: i0, type: CxProgressBarComponent, deps: [], target: i0.ɵɵFactoryTarget.Component });
    static ɵcmp = i0.ɵɵngDeclareComponent({ minVersion: "17.0.0", version: "22.0.8", type: CxProgressBarComponent, isStandalone: true, selector: "cx-progress-bar", inputs: { label: "label", ariaLabel: "ariaLabel", hint: "hint", mood: "mood", showValue: "showValue", indeterminate: "indeterminate", valueLabel: "valueLabel", value: "value", max: "max" }, ngImport: i0, template: "<div\n  class=\"cx-progress-bar\"\n  [class.cx-progress-bar--default]=\"mood === 'default'\"\n  [class.cx-progress-bar--accent]=\"mood === 'accent'\"\n  [class.cx-progress-bar--success]=\"mood === 'success'\"\n  [class.cx-progress-bar--danger]=\"mood === 'danger'\"\n  [class.cx-progress-bar--indeterminate]=\"indeterminate\"\n>\n  @if (visibleLabel() || (showValue && resolvedValueLabel())) {\n    <div class=\"cx-progress-bar__header\">\n      @if (visibleLabel(); as labelText) {\n        <div class=\"cx-progress-bar__label\" [id]=\"labelId\">{{ labelText }}</div>\n      }\n      @if (showValue && resolvedValueLabel(); as valueLabelText) {\n        <div class=\"cx-progress-bar__value\">{{ valueLabelText }}</div>\n      }\n    </div>\n  }\n\n  <div\n    class=\"cx-progress-bar__track\"\n    role=\"progressbar\"\n    [style.--cx-progress-ratio]=\"progressRatio()\"\n    aria-valuemin=\"0\"\n    [attr.aria-valuemax]=\"max$()\"\n    [attr.aria-valuenow]=\"indeterminate ? null : normalizedValue$()\"\n    [attr.aria-valuetext]=\"resolvedValueLabel() ?? null\"\n    [attr.aria-labelledby]=\"visibleLabel() ? labelId : null\"\n    [attr.aria-label]=\"visibleLabel() ? null : resolvedAriaLabel()\"\n    [attr.aria-describedby]=\"visibleHint() ? hintId : null\"\n  >\n    <span class=\"cx-progress-bar__fill\" aria-hidden=\"true\"></span>\n  </div>\n\n  @if (visibleHint(); as hintText) {\n    <div class=\"cx-progress-bar__hint\" [id]=\"hintId\">{{ hintText }}</div>\n  }\n</div>\n", styles: [":host{display:block;width:100%}.cx-progress-bar{display:flex;width:100%;flex-direction:column;gap:var(--space-sm);color:var(--primary)}.cx-progress-bar--default{color:var(--primary)}.cx-progress-bar--accent{color:var(--accent)}.cx-progress-bar--success{color:var(--success)}.cx-progress-bar--danger{color:var(--danger)}.cx-progress-bar__header{display:flex;align-items:center;justify-content:space-between;gap:var(--space-sm)}.cx-progress-bar__label,.cx-progress-bar__value{font-size:var(--font-size-body);line-height:1.2}.cx-progress-bar__label{color:var(--ink);font-weight:var(--font-weight-bold)}.cx-progress-bar__value{color:var(--opacity-high);font-weight:var(--font-weight-medium)}.cx-progress-bar__track{position:relative;width:100%;height:var(--space-sm);overflow:hidden;border-radius:var(--radius-pill);corner-shape:round;background:var(--opacity-low)}.cx-progress-bar__fill{position:absolute;inset:0 auto 0 0;width:calc(var(--cx-progress-ratio, 0)*100%);min-width:0;border-radius:inherit;corner-shape:inherit;background:currentColor;transition:width var(--motion-slow) var(--ease-out-strong),background-color var(--motion-fast) ease}.cx-progress-bar--indeterminate .cx-progress-bar__fill{width:36%;min-width:72px;animation:cx-progress-bar-indeterminate 1.35s cubic-bezier(0.65, 0, 0.35, 1) infinite}.cx-progress-bar__hint{color:var(--opacity-high);font-size:var(--font-size-body-sm);font-weight:var(--font-weight-regular);line-height:var(--line-height-body-relaxed)}@media(prefers-reduced-motion: reduce){.cx-progress-bar__fill{transition:none}.cx-progress-bar--indeterminate .cx-progress-bar__fill{left:32%;animation:none;transform:none}}@keyframes cx-progress-bar-indeterminate{0%{transform:translateX(-115%)}100%{transform:translateX(310%)}}"], changeDetection: i0.ChangeDetectionStrategy.OnPush });
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "22.0.8", ngImport: i0, type: CxProgressBarComponent, decorators: [{
            type: Component,
            args: [{ selector: 'cx-progress-bar', changeDetection: ChangeDetectionStrategy.OnPush, template: "<div\n  class=\"cx-progress-bar\"\n  [class.cx-progress-bar--default]=\"mood === 'default'\"\n  [class.cx-progress-bar--accent]=\"mood === 'accent'\"\n  [class.cx-progress-bar--success]=\"mood === 'success'\"\n  [class.cx-progress-bar--danger]=\"mood === 'danger'\"\n  [class.cx-progress-bar--indeterminate]=\"indeterminate\"\n>\n  @if (visibleLabel() || (showValue && resolvedValueLabel())) {\n    <div class=\"cx-progress-bar__header\">\n      @if (visibleLabel(); as labelText) {\n        <div class=\"cx-progress-bar__label\" [id]=\"labelId\">{{ labelText }}</div>\n      }\n      @if (showValue && resolvedValueLabel(); as valueLabelText) {\n        <div class=\"cx-progress-bar__value\">{{ valueLabelText }}</div>\n      }\n    </div>\n  }\n\n  <div\n    class=\"cx-progress-bar__track\"\n    role=\"progressbar\"\n    [style.--cx-progress-ratio]=\"progressRatio()\"\n    aria-valuemin=\"0\"\n    [attr.aria-valuemax]=\"max$()\"\n    [attr.aria-valuenow]=\"indeterminate ? null : normalizedValue$()\"\n    [attr.aria-valuetext]=\"resolvedValueLabel() ?? null\"\n    [attr.aria-labelledby]=\"visibleLabel() ? labelId : null\"\n    [attr.aria-label]=\"visibleLabel() ? null : resolvedAriaLabel()\"\n    [attr.aria-describedby]=\"visibleHint() ? hintId : null\"\n  >\n    <span class=\"cx-progress-bar__fill\" aria-hidden=\"true\"></span>\n  </div>\n\n  @if (visibleHint(); as hintText) {\n    <div class=\"cx-progress-bar__hint\" [id]=\"hintId\">{{ hintText }}</div>\n  }\n</div>\n", styles: [":host{display:block;width:100%}.cx-progress-bar{display:flex;width:100%;flex-direction:column;gap:var(--space-sm);color:var(--primary)}.cx-progress-bar--default{color:var(--primary)}.cx-progress-bar--accent{color:var(--accent)}.cx-progress-bar--success{color:var(--success)}.cx-progress-bar--danger{color:var(--danger)}.cx-progress-bar__header{display:flex;align-items:center;justify-content:space-between;gap:var(--space-sm)}.cx-progress-bar__label,.cx-progress-bar__value{font-size:var(--font-size-body);line-height:1.2}.cx-progress-bar__label{color:var(--ink);font-weight:var(--font-weight-bold)}.cx-progress-bar__value{color:var(--opacity-high);font-weight:var(--font-weight-medium)}.cx-progress-bar__track{position:relative;width:100%;height:var(--space-sm);overflow:hidden;border-radius:var(--radius-pill);corner-shape:round;background:var(--opacity-low)}.cx-progress-bar__fill{position:absolute;inset:0 auto 0 0;width:calc(var(--cx-progress-ratio, 0)*100%);min-width:0;border-radius:inherit;corner-shape:inherit;background:currentColor;transition:width var(--motion-slow) var(--ease-out-strong),background-color var(--motion-fast) ease}.cx-progress-bar--indeterminate .cx-progress-bar__fill{width:36%;min-width:72px;animation:cx-progress-bar-indeterminate 1.35s cubic-bezier(0.65, 0, 0.35, 1) infinite}.cx-progress-bar__hint{color:var(--opacity-high);font-size:var(--font-size-body-sm);font-weight:var(--font-weight-regular);line-height:var(--line-height-body-relaxed)}@media(prefers-reduced-motion: reduce){.cx-progress-bar__fill{transition:none}.cx-progress-bar--indeterminate .cx-progress-bar__fill{left:32%;animation:none;transform:none}}@keyframes cx-progress-bar-indeterminate{0%{transform:translateX(-115%)}100%{transform:translateX(310%)}}"] }]
        }], propDecorators: { label: [{
                type: Input
            }], ariaLabel: [{
                type: Input
            }], hint: [{
                type: Input
            }], mood: [{
                type: Input
            }], showValue: [{
                type: Input
            }], indeterminate: [{
                type: Input
            }], valueLabel: [{
                type: Input
            }], value: [{
                type: Input
            }], max: [{
                type: Input
            }] } });
