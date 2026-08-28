import { ChangeDetectionStrategy, Component, Input, computed, signal } from '@angular/core';
import { CxTooltipDirective } from '../../overlay/cx-tooltip/index.js';
import * as i0 from "@angular/core";
const CURRENCY_META = {
    EUR: { symbol: '€', placement: 'before' },
    GBP: { symbol: '£', placement: 'before' },
    SEK: { symbol: 'kr', placement: 'after' },
    USD: { symbol: '$', placement: 'before' },
};
export class CxBudgetComponent {
    currentState = signal(0, /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "currentState" }] : /* istanbul ignore next */ []));
    maximumState = signal(1, /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "maximumState" }] : /* istanbul ignore next */ []));
    favorState = signal('low', /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "favorState" }] : /* istanbul ignore next */ []));
    formatState = signal('percent', /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "formatState" }] : /* istanbul ignore next */ []));
    currencyState = signal('EUR', /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "currencyState" }] : /* istanbul ignore next */ []));
    variantState = signal('compact', /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "variantState" }] : /* istanbul ignore next */ []));
    unitLabelState = signal('', /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "unitLabelState" }] : /* istanbul ignore next */ []));
    currentLabelState = signal('', /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "currentLabelState" }] : /* istanbul ignore next */ []));
    maximumLabelState = signal('', /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "maximumLabelState" }] : /* istanbul ignore next */ []));
    hintState = signal('', /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "hintState" }] : /* istanbul ignore next */ []));
    ariaLabelState = signal('Budget', /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "ariaLabelState" }] : /* istanbul ignore next */ []));
    set current(value) {
        this.currentState.set(Number.isFinite(value) ? value : 0);
    }
    set maximum(value) {
        this.maximumState.set(Number.isFinite(value) ? value : 1);
    }
    set favor(value) {
        this.favorState.set(value === 'high' ? 'high' : 'low');
    }
    set format(value) {
        if (value === 'currency' || value === 'unit') {
            this.formatState.set(value);
            return;
        }
        this.formatState.set('percent');
    }
    set currency(value) {
        this.currencyState.set(this.isCurrency(value) ? value : 'EUR');
    }
    set variant(value) {
        this.variantState.set(value === 'detailed' ? 'detailed' : 'compact');
    }
    set unitLabel(value) {
        this.unitLabelState.set(value?.trim() ?? '');
    }
    set currentLabel(value) {
        this.currentLabelState.set(value?.trim() ?? '');
    }
    set maximumLabel(value) {
        this.maximumLabelState.set(value?.trim() ?? '');
    }
    set hint(value) {
        this.hintState.set(value?.trim() ?? '');
    }
    set ariaLabel(value) {
        this.ariaLabelState.set(value?.trim() || 'Budget');
    }
    format$ = this.formatState.asReadonly();
    variant$ = this.variantState.asReadonly();
    hint$ = this.hintState.asReadonly();
    isDetailed$ = computed(() => this.variantState() === 'detailed', /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "isDetailed$" }] : /* istanbul ignore next */ []));
    hasValidMaximum$ = computed(() => this.maximumState() > 0, /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "hasValidMaximum$" }] : /* istanbul ignore next */ []));
    percentage$ = computed(() => {
        if (!this.hasValidMaximum$()) {
            return 0;
        }
        return Math.round(Math.max(0, (this.currentState() / this.maximumState()) * 100));
    }, /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "percentage$" }] : /* istanbul ignore next */ []));
    fillWidth$ = computed(() => Math.min(Math.max(0, this.percentage$()), 100), /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "fillWidth$" }] : /* istanbul ignore next */ []));
    overageWidth$ = computed(() => Math.min(Math.max(0, this.percentage$() - 100), 100), /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "overageWidth$" }] : /* istanbul ignore next */ []));
    isOverBudget$ = computed(() => this.currentState() > this.maximumState() && this.maximumState() > 0, /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "isOverBudget$" }] : /* istanbul ignore next */ []));
    color$ = computed(() => this.colorFor(this.percentage$(), this.favorState()), /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "color$" }] : /* istanbul ignore next */ []));
    resolvedAriaLabel$ = this.ariaLabelState.asReadonly();
    currentValueText$ = computed(() => this.formattedCurrentValue(), /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "currentValueText$" }] : /* istanbul ignore next */ []));
    currentLabelText$ = this.currentLabelState.asReadonly();
    ariaValueMax$ = computed(() => this.hasValidMaximum$() ? this.maximumState() : null, /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "ariaValueMax$" }] : /* istanbul ignore next */ []));
    ariaValueNow$ = computed(() => {
        if (!this.hasValidMaximum$()) {
            return null;
        }
        return Math.min(Math.max(this.currentState(), 0), this.maximumState());
    }, /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "ariaValueNow$" }] : /* istanbul ignore next */ []));
    ariaValueText$ = computed(() => {
        if (!this.hasValidMaximum$()) {
            return 'Set maximum above 0.';
        }
        const parts = [
            `${this.currentText$()} of ${this.maximumText$()}`,
            `${this.percentage$()}% used`,
        ];
        if (this.isOverBudget$()) {
            parts.push(`Over maximum by ${this.formattedOverageValue()}`);
        }
        const hint = this.hintState();
        if (hint) {
            parts.push(hint);
        }
        return `${parts.join('. ')}.`;
    }, /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "ariaValueText$" }] : /* istanbul ignore next */ []));
    currentText$ = computed(() => this.withLabel(this.formattedCurrentValue(), this.currentLabelState()), /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "currentText$" }] : /* istanbul ignore next */ []));
    maximumText$ = computed(() => this.withLabel(this.formattedMaximumValue(), this.maximumLabelState()), /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "maximumText$" }] : /* istanbul ignore next */ []));
    isCurrency(value) {
        return value === 'SEK' || value === 'USD' || value === 'EUR' || value === 'GBP';
    }
    formattedCurrentValue() {
        if (this.formatState() === 'percent') {
            return `${this.percentage$()}%`;
        }
        return this.formatFormattedNumber(this.currentState());
    }
    formattedMaximumValue() {
        if (this.formatState() === 'percent') {
            return '100%';
        }
        return this.formatFormattedNumber(this.maximumState());
    }
    formattedOverageValue() {
        const overage = Math.max(0, this.currentState() - this.maximumState());
        if (this.formatState() === 'percent') {
            return `${Math.max(0, this.percentage$() - 100)}%`;
        }
        return this.formatFormattedNumber(overage);
    }
    formatFormattedNumber(value) {
        if (this.formatState() === 'currency') {
            return this.formatCurrency(value, this.currencyState());
        }
        return this.formatUnit(value);
    }
    formatCurrency(value, currency) {
        const meta = CURRENCY_META[currency];
        const sign = value < 0 ? '-' : '';
        const number = this.formatNumber(Math.abs(value));
        return meta.placement === 'before' ? `${sign}${meta.symbol}${number}` : `${sign}${number} ${meta.symbol}`;
    }
    formatUnit(value) {
        const unit = this.unitLabelState();
        const number = this.formatNumber(value);
        return unit ? `${number} ${unit}` : number;
    }
    formatNumber(value) {
        return new Intl.NumberFormat('en-US', {
            maximumFractionDigits: Number.isInteger(value) ? 0 : 1,
        }).format(value).replace(/,/g, ' ');
    }
    withLabel(value, label) {
        return label ? `${value} ${label}` : value;
    }
    colorFor(percentage, favor) {
        if (favor === 'high') {
            if (percentage >= 80)
                return 'success';
            if (percentage >= 50)
                return 'yellow';
            if (percentage >= 20)
                return 'orange';
            return 'danger';
        }
        if (percentage > 100)
            return 'danger';
        if (percentage > 80)
            return 'orange';
        if (percentage > 50)
            return 'yellow';
        return 'success';
    }
    static ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "22.0.8", ngImport: i0, type: CxBudgetComponent, deps: [], target: i0.ɵɵFactoryTarget.Component });
    static ɵcmp = i0.ɵɵngDeclareComponent({ minVersion: "17.0.0", version: "22.0.8", type: CxBudgetComponent, isStandalone: true, selector: "cx-budget", inputs: { current: "current", maximum: "maximum", favor: "favor", format: "format", currency: "currency", variant: "variant", unitLabel: "unitLabel", currentLabel: "currentLabel", maximumLabel: "maximumLabel", hint: "hint", ariaLabel: "ariaLabel" }, host: { properties: { "class.cx-budget-host--compact": "variant$() === \"compact\"", "class.cx-budget-host--detailed": "variant$() === \"detailed\"" } }, ngImport: i0, template: "<div\n  class=\"cx-budget\"\n  [class.cx-budget--compact]=\"variant$() === 'compact'\"\n  [class.cx-budget--detailed]=\"variant$() === 'detailed'\"\n  [class.cx-budget--invalid]=\"!hasValidMaximum$()\"\n  [attr.role]=\"hasValidMaximum$() ? 'meter' : 'status'\"\n  [attr.aria-label]=\"resolvedAriaLabel$()\"\n  [attr.aria-invalid]=\"hasValidMaximum$() ? null : 'true'\"\n  [attr.aria-valuemin]=\"hasValidMaximum$() ? 0 : null\"\n  [attr.aria-valuemax]=\"ariaValueMax$()\"\n  [attr.aria-valuenow]=\"ariaValueNow$()\"\n  [attr.aria-valuetext]=\"hasValidMaximum$() ? ariaValueText$() : null\"\n>\n  <div class=\"cx-budget-meter\">\n    <div class=\"cx-budget-track\" aria-hidden=\"true\">\n      <div\n        class=\"cx-budget-fill\"\n        [class.cx-budget-fill-success]=\"color$() === 'success'\"\n        [class.cx-budget-fill-yellow]=\"color$() === 'yellow'\"\n        [class.cx-budget-fill-orange]=\"color$() === 'orange'\"\n        [class.cx-budget-fill-danger]=\"color$() === 'danger'\"\n        [class.cx-budget-fill-connected]=\"isOverBudget$()\"\n        [style.width.%]=\"fillWidth$()\"\n      ></div>\n      @if (isOverBudget$()) {\n        <div class=\"cx-budget-overage\" [style.width.%]=\"overageWidth$()\"></div>\n      }\n    </div>\n\n    @if (hasValidMaximum$()) {\n      @if (isDetailed$()) {\n        <div class=\"cx-budget-values\">\n          <span\n            class=\"cx-budget-label cx-budget-label--current\"\n            [class.cx-budget-label--success]=\"color$() === 'success'\"\n            [class.cx-budget-label--yellow]=\"color$() === 'yellow'\"\n            [class.cx-budget-label--orange]=\"color$() === 'orange'\"\n            [class.cx-budget-label--danger]=\"color$() === 'danger'\"\n            [cxTooltip]=\"currentText$()\"\n            [cxTooltipOverflow]=\"true\"\n          >\n            {{ currentText$() }}\n          </span>\n          <span\n            class=\"cx-budget-label cx-budget-label--maximum\"\n            [cxTooltip]=\"maximumText$()\"\n            [cxTooltipOverflow]=\"true\"\n          >{{ maximumText$() }}</span>\n        </div>\n      } @else {\n        <div\n          class=\"cx-budget-label cx-budget-label--current\"\n          [class.cx-budget-label--success]=\"color$() === 'success'\"\n          [class.cx-budget-label--yellow]=\"color$() === 'yellow'\"\n          [class.cx-budget-label--orange]=\"color$() === 'orange'\"\n          [class.cx-budget-label--danger]=\"color$() === 'danger'\"\n          [cxTooltip]=\"currentText$()\"\n          [cxTooltipOverflow]=\"true\"\n        >\n          <span class=\"cx-budget-label__value\" data-cx-tooltip-overflow>{{ currentValueText$() }}</span>\n          @if (currentLabelText$()) {\n            <span class=\"cx-budget-label__context\" data-cx-tooltip-overflow>{{ currentLabelText$() }}</span>\n          }\n        </div>\n      }\n    }\n  </div>\n\n  @if (!hasValidMaximum$()) {\n    <div class=\"cx-budget-invalid\" role=\"status\">Set maximum above 0.</div>\n  }\n\n  @if (hasValidMaximum$() && hint$()) {\n    <div class=\"cx-budget-hint\">{{ hint$() }}</div>\n  }\n</div>\n", styles: [":host{display:block;width:max-content;max-width:100%}:host(.cx-budget-host--detailed){width:100%}.cx-budget{display:grid;max-width:100%;color:var(--opacity-high)}.cx-budget--compact{width:max-content}.cx-budget--detailed{width:100%;gap:var(--space-sm)}.cx-budget--compact.cx-budget--invalid{gap:var(--space-xs)}.cx-budget-meter{min-width:0}.cx-budget--compact .cx-budget-meter{display:flex;width:max-content;max-width:100%;align-items:center;gap:var(--space-sm)}.cx-budget--detailed .cx-budget-meter{display:grid;width:100%;min-width:0;align-items:center}.cx-budget-track{display:flex;flex:0 0 78px;width:78px;min-width:78px;height:8px;overflow:visible;border-radius:var(--radius-xs);background:var(--opacity-low)}.cx-budget--detailed .cx-budget-track{position:relative;grid-area:1/1;width:100%;min-width:0;flex:1 1 auto;height:calc(var(--controller-size)*.875);overflow:hidden;border:var(--line-discreet);border-radius:var(--radius-md);box-sizing:border-box}.cx-budget-fill{height:100%;border-radius:var(--radius-xs);transition:width var(--motion-slow) var(--ease-out-strong)}.cx-budget-fill-connected{border-radius:var(--radius-xs) 0 0 var(--radius-xs)}.cx-budget-fill-success{background:var(--success)}.cx-budget-fill-yellow{background:var(--warning)}.cx-budget-fill-orange{background:var(--warning-alt)}.cx-budget-fill-danger{background:var(--danger)}.cx-budget--detailed .cx-budget-fill-success{background:var(--success-opacity)}.cx-budget--detailed .cx-budget-fill-yellow{background:var(--warning-opacity)}.cx-budget--detailed .cx-budget-fill-orange{background:var(--warning-opacity)}.cx-budget--detailed .cx-budget-fill-danger{background:var(--danger-opacity)}.cx-budget-overage{height:100%;border-radius:0 var(--radius-xs) var(--radius-xs) 0;background:repeating-linear-gradient(-45deg, var(--danger), var(--danger) 2px, var(--danger-opacity) 2px, var(--danger-opacity) 4px);transition:width var(--motion-slow) var(--ease-out-strong)}.cx-budget--detailed .cx-budget-overage{position:absolute;top:0;right:0;bottom:0;border-radius:0 var(--radius-md) var(--radius-md) 0}.cx-budget-values{grid-area:1/1;display:flex;min-width:0;align-items:center;justify-content:space-between;gap:var(--space-md);padding:0 var(--space-md)}.cx-budget-label{min-width:0;overflow:hidden;color:var(--opacity-high);font-size:var(--font-size-body-sm);font-weight:var(--font-weight-bold);line-height:var(--line-height-small);text-overflow:ellipsis;white-space:nowrap}.cx-budget--detailed .cx-budget-label{font-size:var(--font-size-body);line-height:var(--line-height-body)}.cx-budget-label--current{flex:0 1 auto}.cx-budget--compact .cx-budget-label--current{display:inline-flex;min-width:0;align-items:baseline;gap:var(--space-xs);color:var(--opacity-high)}.cx-budget--compact .cx-budget-label__value,.cx-budget--compact .cx-budget-label__context{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.cx-budget--compact .cx-budget-label__value{flex:0 0 auto;color:var(--ink)}.cx-budget--compact .cx-budget-label__context{flex:1 1 auto}.cx-budget-label--maximum{flex:1 1 auto;font-weight:var(--font-weight-regular);text-align:right}.cx-budget-label--success{color:var(--success)}.cx-budget-label--yellow{color:var(--warning)}.cx-budget-label--orange{color:var(--warning-alt)}.cx-budget-label--danger{color:var(--danger)}.cx-budget-hint{min-width:0;overflow-wrap:anywhere;color:var(--opacity-high);font-size:var(--font-size-body-sm);font-weight:var(--font-weight-regular);line-height:var(--line-height-small);text-align:center}.cx-budget-invalid{min-width:0;max-width:100%;overflow-wrap:anywhere;color:var(--danger);font-size:var(--font-size-body-sm);font-weight:var(--font-weight-bold);line-height:var(--line-height-small)}.cx-budget--detailed .cx-budget-invalid{font-size:var(--font-size-body);line-height:var(--line-height-body);text-align:center}.cx-budget--invalid .cx-budget-track{background:var(--danger-opacity)}@media(prefers-reduced-motion: reduce){.cx-budget-fill,.cx-budget-overage{transition:none}}"], dependencies: [{ kind: "directive", type: CxTooltipDirective, selector: "[cxTooltip]", inputs: ["cxTooltip", "cxTooltipPosition", "cxTooltipDelay", "cxTooltipDisabled", "cxTooltipOverflow"] }], changeDetection: i0.ChangeDetectionStrategy.OnPush });
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "22.0.8", ngImport: i0, type: CxBudgetComponent, decorators: [{
            type: Component,
            args: [{ selector: 'cx-budget', imports: [CxTooltipDirective], host: {
                        '[class.cx-budget-host--compact]': 'variant$() === "compact"',
                        '[class.cx-budget-host--detailed]': 'variant$() === "detailed"',
                    }, changeDetection: ChangeDetectionStrategy.OnPush, template: "<div\n  class=\"cx-budget\"\n  [class.cx-budget--compact]=\"variant$() === 'compact'\"\n  [class.cx-budget--detailed]=\"variant$() === 'detailed'\"\n  [class.cx-budget--invalid]=\"!hasValidMaximum$()\"\n  [attr.role]=\"hasValidMaximum$() ? 'meter' : 'status'\"\n  [attr.aria-label]=\"resolvedAriaLabel$()\"\n  [attr.aria-invalid]=\"hasValidMaximum$() ? null : 'true'\"\n  [attr.aria-valuemin]=\"hasValidMaximum$() ? 0 : null\"\n  [attr.aria-valuemax]=\"ariaValueMax$()\"\n  [attr.aria-valuenow]=\"ariaValueNow$()\"\n  [attr.aria-valuetext]=\"hasValidMaximum$() ? ariaValueText$() : null\"\n>\n  <div class=\"cx-budget-meter\">\n    <div class=\"cx-budget-track\" aria-hidden=\"true\">\n      <div\n        class=\"cx-budget-fill\"\n        [class.cx-budget-fill-success]=\"color$() === 'success'\"\n        [class.cx-budget-fill-yellow]=\"color$() === 'yellow'\"\n        [class.cx-budget-fill-orange]=\"color$() === 'orange'\"\n        [class.cx-budget-fill-danger]=\"color$() === 'danger'\"\n        [class.cx-budget-fill-connected]=\"isOverBudget$()\"\n        [style.width.%]=\"fillWidth$()\"\n      ></div>\n      @if (isOverBudget$()) {\n        <div class=\"cx-budget-overage\" [style.width.%]=\"overageWidth$()\"></div>\n      }\n    </div>\n\n    @if (hasValidMaximum$()) {\n      @if (isDetailed$()) {\n        <div class=\"cx-budget-values\">\n          <span\n            class=\"cx-budget-label cx-budget-label--current\"\n            [class.cx-budget-label--success]=\"color$() === 'success'\"\n            [class.cx-budget-label--yellow]=\"color$() === 'yellow'\"\n            [class.cx-budget-label--orange]=\"color$() === 'orange'\"\n            [class.cx-budget-label--danger]=\"color$() === 'danger'\"\n            [cxTooltip]=\"currentText$()\"\n            [cxTooltipOverflow]=\"true\"\n          >\n            {{ currentText$() }}\n          </span>\n          <span\n            class=\"cx-budget-label cx-budget-label--maximum\"\n            [cxTooltip]=\"maximumText$()\"\n            [cxTooltipOverflow]=\"true\"\n          >{{ maximumText$() }}</span>\n        </div>\n      } @else {\n        <div\n          class=\"cx-budget-label cx-budget-label--current\"\n          [class.cx-budget-label--success]=\"color$() === 'success'\"\n          [class.cx-budget-label--yellow]=\"color$() === 'yellow'\"\n          [class.cx-budget-label--orange]=\"color$() === 'orange'\"\n          [class.cx-budget-label--danger]=\"color$() === 'danger'\"\n          [cxTooltip]=\"currentText$()\"\n          [cxTooltipOverflow]=\"true\"\n        >\n          <span class=\"cx-budget-label__value\" data-cx-tooltip-overflow>{{ currentValueText$() }}</span>\n          @if (currentLabelText$()) {\n            <span class=\"cx-budget-label__context\" data-cx-tooltip-overflow>{{ currentLabelText$() }}</span>\n          }\n        </div>\n      }\n    }\n  </div>\n\n  @if (!hasValidMaximum$()) {\n    <div class=\"cx-budget-invalid\" role=\"status\">Set maximum above 0.</div>\n  }\n\n  @if (hasValidMaximum$() && hint$()) {\n    <div class=\"cx-budget-hint\">{{ hint$() }}</div>\n  }\n</div>\n", styles: [":host{display:block;width:max-content;max-width:100%}:host(.cx-budget-host--detailed){width:100%}.cx-budget{display:grid;max-width:100%;color:var(--opacity-high)}.cx-budget--compact{width:max-content}.cx-budget--detailed{width:100%;gap:var(--space-sm)}.cx-budget--compact.cx-budget--invalid{gap:var(--space-xs)}.cx-budget-meter{min-width:0}.cx-budget--compact .cx-budget-meter{display:flex;width:max-content;max-width:100%;align-items:center;gap:var(--space-sm)}.cx-budget--detailed .cx-budget-meter{display:grid;width:100%;min-width:0;align-items:center}.cx-budget-track{display:flex;flex:0 0 78px;width:78px;min-width:78px;height:8px;overflow:visible;border-radius:var(--radius-xs);background:var(--opacity-low)}.cx-budget--detailed .cx-budget-track{position:relative;grid-area:1/1;width:100%;min-width:0;flex:1 1 auto;height:calc(var(--controller-size)*.875);overflow:hidden;border:var(--line-discreet);border-radius:var(--radius-md);box-sizing:border-box}.cx-budget-fill{height:100%;border-radius:var(--radius-xs);transition:width var(--motion-slow) var(--ease-out-strong)}.cx-budget-fill-connected{border-radius:var(--radius-xs) 0 0 var(--radius-xs)}.cx-budget-fill-success{background:var(--success)}.cx-budget-fill-yellow{background:var(--warning)}.cx-budget-fill-orange{background:var(--warning-alt)}.cx-budget-fill-danger{background:var(--danger)}.cx-budget--detailed .cx-budget-fill-success{background:var(--success-opacity)}.cx-budget--detailed .cx-budget-fill-yellow{background:var(--warning-opacity)}.cx-budget--detailed .cx-budget-fill-orange{background:var(--warning-opacity)}.cx-budget--detailed .cx-budget-fill-danger{background:var(--danger-opacity)}.cx-budget-overage{height:100%;border-radius:0 var(--radius-xs) var(--radius-xs) 0;background:repeating-linear-gradient(-45deg, var(--danger), var(--danger) 2px, var(--danger-opacity) 2px, var(--danger-opacity) 4px);transition:width var(--motion-slow) var(--ease-out-strong)}.cx-budget--detailed .cx-budget-overage{position:absolute;top:0;right:0;bottom:0;border-radius:0 var(--radius-md) var(--radius-md) 0}.cx-budget-values{grid-area:1/1;display:flex;min-width:0;align-items:center;justify-content:space-between;gap:var(--space-md);padding:0 var(--space-md)}.cx-budget-label{min-width:0;overflow:hidden;color:var(--opacity-high);font-size:var(--font-size-body-sm);font-weight:var(--font-weight-bold);line-height:var(--line-height-small);text-overflow:ellipsis;white-space:nowrap}.cx-budget--detailed .cx-budget-label{font-size:var(--font-size-body);line-height:var(--line-height-body)}.cx-budget-label--current{flex:0 1 auto}.cx-budget--compact .cx-budget-label--current{display:inline-flex;min-width:0;align-items:baseline;gap:var(--space-xs);color:var(--opacity-high)}.cx-budget--compact .cx-budget-label__value,.cx-budget--compact .cx-budget-label__context{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.cx-budget--compact .cx-budget-label__value{flex:0 0 auto;color:var(--ink)}.cx-budget--compact .cx-budget-label__context{flex:1 1 auto}.cx-budget-label--maximum{flex:1 1 auto;font-weight:var(--font-weight-regular);text-align:right}.cx-budget-label--success{color:var(--success)}.cx-budget-label--yellow{color:var(--warning)}.cx-budget-label--orange{color:var(--warning-alt)}.cx-budget-label--danger{color:var(--danger)}.cx-budget-hint{min-width:0;overflow-wrap:anywhere;color:var(--opacity-high);font-size:var(--font-size-body-sm);font-weight:var(--font-weight-regular);line-height:var(--line-height-small);text-align:center}.cx-budget-invalid{min-width:0;max-width:100%;overflow-wrap:anywhere;color:var(--danger);font-size:var(--font-size-body-sm);font-weight:var(--font-weight-bold);line-height:var(--line-height-small)}.cx-budget--detailed .cx-budget-invalid{font-size:var(--font-size-body);line-height:var(--line-height-body);text-align:center}.cx-budget--invalid .cx-budget-track{background:var(--danger-opacity)}@media(prefers-reduced-motion: reduce){.cx-budget-fill,.cx-budget-overage{transition:none}}"] }]
        }], propDecorators: { current: [{
                type: Input
            }], maximum: [{
                type: Input
            }], favor: [{
                type: Input
            }], format: [{
                type: Input
            }], currency: [{
                type: Input
            }], variant: [{
                type: Input
            }], unitLabel: [{
                type: Input
            }], currentLabel: [{
                type: Input
            }], maximumLabel: [{
                type: Input
            }], hint: [{
                type: Input
            }], ariaLabel: [{
                type: Input
            }] } });
