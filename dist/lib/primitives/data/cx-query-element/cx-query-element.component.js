import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { CxTooltipDirective } from '../../overlay/cx-tooltip/index.js';
import * as i0 from "@angular/core";
const DEFAULT_QUERY_ELEMENT_DATA = {
    kind: 'field',
    label: 'Status',
};
export class CxQueryElementComponent {
    kind = DEFAULT_QUERY_ELEMENT_DATA.kind;
    label = DEFAULT_QUERY_ELEMENT_DATA.label ?? '';
    values = [];
    valuesPrefix = '';
    valuesDivider = ', ';
    valuesSuffix = '';
    focused = false;
    disabled = false;
    grouped = false;
    tabIndex = 0;
    ariaLabel;
    set data(value) {
        const data = value ?? DEFAULT_QUERY_ELEMENT_DATA;
        this.kind = data.kind;
        this.label = data.label ?? this.defaultLabelFor(data.kind);
        this.values = (data.values ?? []).map(item => item?.trim() ?? '');
        this.valuesPrefix = data.valuesPrefix ?? '';
        this.valuesDivider = data.valuesDivider ?? ', ';
        this.valuesSuffix = data.valuesSuffix ?? '';
        this.focused = data.focused ?? false;
        this.disabled = data.disabled ?? false;
        this.grouped = data.grouped ?? false;
        this.tabIndex = data.tabIndex ?? 0;
        this.ariaLabel = data.ariaLabel?.trim() || undefined;
    }
    pressed = new EventEmitter();
    isValues() {
        return this.kind === 'values';
    }
    resolvedLabel() {
        const trimmed = this.label.trim();
        if (trimmed) {
            return trimmed;
        }
        return this.defaultLabelFor(this.kind);
    }
    resolvedText() {
        if (!this.isValues()) {
            return this.resolvedLabel();
        }
        const values = this.values.map(value => value || '<Empty>');
        return `${this.valuesPrefix}${values.join(this.valuesDivider)}${this.valuesSuffix}`;
    }
    onPressed(event) {
        event.stopPropagation();
        if (this.disabled) {
            return;
        }
        this.pressed.emit();
    }
    defaultLabelFor(kind) {
        switch (kind) {
            case 'insert':
                return '...';
            case 'operator':
                return '=';
            case 'boolean':
                return 'AND';
            case 'parenthesis':
                return '(';
            case 'values':
                return '';
            case 'field':
            default:
                return 'Status';
        }
    }
    static ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "22.0.8", ngImport: i0, type: CxQueryElementComponent, deps: [], target: i0.ɵɵFactoryTarget.Component });
    static ɵcmp = i0.ɵɵngDeclareComponent({ minVersion: "17.0.0", version: "22.0.8", type: CxQueryElementComponent, isStandalone: true, selector: "cx-query-element", inputs: { data: "data" }, outputs: { pressed: "pressed" }, ngImport: i0, template: "<button\n  type=\"button\"\n  class=\"cx-query-element\"\n  [class.cx-query-element--insert]=\"kind === 'insert'\"\n  [class.cx-query-element--field]=\"kind === 'field'\"\n  [class.cx-query-element--operator]=\"kind === 'operator'\"\n  [class.cx-query-element--boolean]=\"kind === 'boolean'\"\n  [class.cx-query-element--parenthesis]=\"kind === 'parenthesis'\"\n  [class.cx-query-element--values]=\"kind === 'values'\"\n  [class.cx-query-element--focused]=\"focused\"\n  [class.cx-query-element--disabled]=\"disabled\"\n  [class.cx-query-element--grouped]=\"grouped\"\n  [disabled]=\"disabled\"\n  [attr.tabindex]=\"tabIndex\"\n  [attr.aria-label]=\"ariaLabel ?? null\"\n  [cxTooltip]=\"resolvedText()\"\n  [cxTooltipOverflow]=\"true\"\n  (click)=\"onPressed($event)\"\n>\n  <span class=\"cx-query-element__content\" data-cx-tooltip-overflow>\n    @if (isValues()) {\n      @if (valuesPrefix) {\n        <span class=\"cx-query-element__muted\">{{ valuesPrefix }}</span>\n      }\n      @for (value of values; track $index) {\n        <span\n          class=\"cx-query-element__value\"\n          [class.cx-query-element__value--empty]=\"!value\"\n        >\n          @if (value) {\n            {{ value }}\n          } @else {\n            &lt;Empty&gt;\n          }\n        </span>\n        @if ($index < values.length - 1) {\n          <span class=\"cx-query-element__muted\">{{ valuesDivider }}</span>\n        }\n      }\n      @if (valuesSuffix) {\n        <span class=\"cx-query-element__muted\">{{ valuesSuffix }}</span>\n      }\n    } @else {\n      {{ resolvedLabel() }}\n    }\n  </span>\n</button>\n", styles: [":host{display:inline-flex;min-width:0;max-width:100%;width:auto}.cx-query-element{display:inline-flex;min-width:0;max-width:100%;min-height:var(--cx-query-element-min-height, var(--controller-size-small));align-items:center;overflow:hidden;padding:var(--cx-query-element-block-padding, var(--space-xs)) var(--space-xs);border:0;border-radius:var(--radius-sm);background:rgba(0,0,0,0);color:var(--opacity-high);cursor:pointer;font:inherit;line-height:var(--line-height-small);user-select:none;white-space:nowrap}.cx-query-element__content{display:inline-flex;min-width:0;max-width:100%;align-items:center;gap:var(--space-2xs);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.cx-query-element:hover:not(:disabled),.cx-query-element--focused{background:var(--opacity-mid);color:var(--ink)}.cx-query-element:focus-visible{outline:var(--outline-tab);outline-offset:var(--outline-tab-offset)}.cx-query-element--field,.cx-query-element--operator,.cx-query-element--values{border-radius:0;background:var(--opacity-low);color:var(--opacity-high);font-size:var(--cx-query-element-font-size, var(--font-size-body-sm))}.cx-query-element--grouped.cx-query-element--field,.cx-query-element--grouped.cx-query-element--operator,.cx-query-element--grouped.cx-query-element--values{border-radius:0;background:rgba(0,0,0,0)}.cx-query-element--field{border-start-start-radius:var(--radius-sm);border-end-start-radius:var(--radius-sm)}.cx-query-element--values{border-start-end-radius:var(--radius-sm);border-end-end-radius:var(--radius-sm)}.cx-query-element--grouped:hover:not(:disabled),.cx-query-element--grouped.cx-query-element--focused,.cx-query-element--grouped:focus-visible{border-radius:var(--radius-xs)}.cx-query-element--boolean{padding-inline:var(--space-xs);color:var(--ink);font-size:var(--font-size-body-sm);font-weight:var(--font-weight-bold)}.cx-query-element--insert,.cx-query-element--parenthesis{padding-inline:calc(var(--space-xs) + var(--space-2xs))}.cx-query-element--disabled{opacity:.45;cursor:default}.cx-query-element--grouped.cx-query-element--disabled{opacity:1}.cx-query-element__muted,.cx-query-element__value--empty{color:var(--opacity-high)}.cx-query-element__value{min-width:0;color:var(--ink)}.cx-query-element__value--empty{font-style:italic}"], dependencies: [{ kind: "directive", type: CxTooltipDirective, selector: "[cxTooltip]", inputs: ["cxTooltip", "cxTooltipPosition", "cxTooltipDelay", "cxTooltipDisabled", "cxTooltipOverflow"] }], changeDetection: i0.ChangeDetectionStrategy.OnPush });
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "22.0.8", ngImport: i0, type: CxQueryElementComponent, decorators: [{
            type: Component,
            args: [{ selector: 'cx-query-element', imports: [CxTooltipDirective], changeDetection: ChangeDetectionStrategy.OnPush, template: "<button\n  type=\"button\"\n  class=\"cx-query-element\"\n  [class.cx-query-element--insert]=\"kind === 'insert'\"\n  [class.cx-query-element--field]=\"kind === 'field'\"\n  [class.cx-query-element--operator]=\"kind === 'operator'\"\n  [class.cx-query-element--boolean]=\"kind === 'boolean'\"\n  [class.cx-query-element--parenthesis]=\"kind === 'parenthesis'\"\n  [class.cx-query-element--values]=\"kind === 'values'\"\n  [class.cx-query-element--focused]=\"focused\"\n  [class.cx-query-element--disabled]=\"disabled\"\n  [class.cx-query-element--grouped]=\"grouped\"\n  [disabled]=\"disabled\"\n  [attr.tabindex]=\"tabIndex\"\n  [attr.aria-label]=\"ariaLabel ?? null\"\n  [cxTooltip]=\"resolvedText()\"\n  [cxTooltipOverflow]=\"true\"\n  (click)=\"onPressed($event)\"\n>\n  <span class=\"cx-query-element__content\" data-cx-tooltip-overflow>\n    @if (isValues()) {\n      @if (valuesPrefix) {\n        <span class=\"cx-query-element__muted\">{{ valuesPrefix }}</span>\n      }\n      @for (value of values; track $index) {\n        <span\n          class=\"cx-query-element__value\"\n          [class.cx-query-element__value--empty]=\"!value\"\n        >\n          @if (value) {\n            {{ value }}\n          } @else {\n            &lt;Empty&gt;\n          }\n        </span>\n        @if ($index < values.length - 1) {\n          <span class=\"cx-query-element__muted\">{{ valuesDivider }}</span>\n        }\n      }\n      @if (valuesSuffix) {\n        <span class=\"cx-query-element__muted\">{{ valuesSuffix }}</span>\n      }\n    } @else {\n      {{ resolvedLabel() }}\n    }\n  </span>\n</button>\n", styles: [":host{display:inline-flex;min-width:0;max-width:100%;width:auto}.cx-query-element{display:inline-flex;min-width:0;max-width:100%;min-height:var(--cx-query-element-min-height, var(--controller-size-small));align-items:center;overflow:hidden;padding:var(--cx-query-element-block-padding, var(--space-xs)) var(--space-xs);border:0;border-radius:var(--radius-sm);background:rgba(0,0,0,0);color:var(--opacity-high);cursor:pointer;font:inherit;line-height:var(--line-height-small);user-select:none;white-space:nowrap}.cx-query-element__content{display:inline-flex;min-width:0;max-width:100%;align-items:center;gap:var(--space-2xs);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.cx-query-element:hover:not(:disabled),.cx-query-element--focused{background:var(--opacity-mid);color:var(--ink)}.cx-query-element:focus-visible{outline:var(--outline-tab);outline-offset:var(--outline-tab-offset)}.cx-query-element--field,.cx-query-element--operator,.cx-query-element--values{border-radius:0;background:var(--opacity-low);color:var(--opacity-high);font-size:var(--cx-query-element-font-size, var(--font-size-body-sm))}.cx-query-element--grouped.cx-query-element--field,.cx-query-element--grouped.cx-query-element--operator,.cx-query-element--grouped.cx-query-element--values{border-radius:0;background:rgba(0,0,0,0)}.cx-query-element--field{border-start-start-radius:var(--radius-sm);border-end-start-radius:var(--radius-sm)}.cx-query-element--values{border-start-end-radius:var(--radius-sm);border-end-end-radius:var(--radius-sm)}.cx-query-element--grouped:hover:not(:disabled),.cx-query-element--grouped.cx-query-element--focused,.cx-query-element--grouped:focus-visible{border-radius:var(--radius-xs)}.cx-query-element--boolean{padding-inline:var(--space-xs);color:var(--ink);font-size:var(--font-size-body-sm);font-weight:var(--font-weight-bold)}.cx-query-element--insert,.cx-query-element--parenthesis{padding-inline:calc(var(--space-xs) + var(--space-2xs))}.cx-query-element--disabled{opacity:.45;cursor:default}.cx-query-element--grouped.cx-query-element--disabled{opacity:1}.cx-query-element__muted,.cx-query-element__value--empty{color:var(--opacity-high)}.cx-query-element__value{min-width:0;color:var(--ink)}.cx-query-element__value--empty{font-style:italic}"] }]
        }], propDecorators: { data: [{
                type: Input
            }], pressed: [{
                type: Output
            }] } });
