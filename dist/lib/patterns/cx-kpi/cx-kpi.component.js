import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { CxIconComponent } from '../../primitives/media/cx-icon/index.js';
import { CxTrendTagComponent, } from '../../primitives/display/cx-trend-tag/index.js';
import { CxProgressBarComponent } from '../../primitives/feedback/cx-progress-bar/index.js';
import * as i0 from "@angular/core";
/**
 * A key-performance-indicator card: a headline metric with an optional trend,
 * status-tinted icon, progress, footer note, and a slot for a sparkline
 * (`[cxKpiChart]`). It composes cx-trend-tag and cx-progress-bar.
 */
export class CxKpiComponent {
    heading = '';
    value = '0';
    icon;
    mood = 'default';
    trendAmount;
    trendFavor = 'up';
    trendUnit = 'percent';
    progress;
    progressMax = 100;
    progressLabel = 'Progress';
    footer;
    get hasHeading() {
        return Boolean(this.heading.trim());
    }
    get visibleValue() {
        return this.value?.trim() ?? '';
    }
    get hasTrend() {
        return typeof this.trendAmount === 'number' && Number.isFinite(this.trendAmount);
    }
    get hasProgress() {
        return this.progress !== undefined && this.progress !== null;
    }
    get hasFooter() {
        return Boolean(this.footer?.trim());
    }
    get progressMood() {
        switch (this.mood) {
            case 'accent':
                return 'accent';
            case 'success':
                return 'success';
            case 'danger':
                return 'danger';
            default:
                return 'default';
        }
    }
    static ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "22.0.8", ngImport: i0, type: CxKpiComponent, deps: [], target: i0.ɵɵFactoryTarget.Component });
    static ɵcmp = i0.ɵɵngDeclareComponent({ minVersion: "17.0.0", version: "22.0.8", type: CxKpiComponent, isStandalone: true, selector: "cx-kpi", inputs: { heading: "heading", value: "value", icon: "icon", mood: "mood", trendAmount: "trendAmount", trendFavor: "trendFavor", trendUnit: "trendUnit", progress: "progress", progressMax: "progressMax", progressLabel: "progressLabel", footer: "footer" }, ngImport: i0, template: "<div class=\"cx-kpi\">\n  @if (icon || hasHeading) {\n    <div class=\"cx-kpi__header\">\n      @if (icon) {\n        <cx-icon class=\"cx-kpi__icon\" [icon]=\"icon\" size=\"32\" shape=\"square-subtle\" [mood]=\"mood\" />\n      }\n\n      @if (hasHeading) {\n        <div class=\"cx-kpi__heading\">{{ heading }}</div>\n      }\n    </div>\n  }\n\n  @if (visibleValue || hasTrend) {\n  <div class=\"cx-kpi__metric\">\n    @if (visibleValue) {\n      <div class=\"cx-kpi__value\">{{ visibleValue }}</div>\n    }\n\n    @if (hasTrend) {\n      <cx-trend-tag\n        class=\"cx-kpi__trend\"\n        [amount]=\"trendAmount!\"\n        [favor]=\"trendFavor\"\n        [unit]=\"trendUnit\"\n      />\n    }\n  </div>\n  }\n\n  @if (hasProgress) {\n    <cx-progress-bar\n      class=\"cx-kpi__progress\"\n      [label]=\"progressLabel\"\n      [value]=\"progress ?? 0\"\n      [max]=\"progressMax\"\n      [mood]=\"progressMood\"\n    />\n  }\n\n  @if (hasFooter) {\n    <div class=\"cx-kpi__footer\">{{ footer }}</div>\n  }\n\n  <ng-content select=\"[cxKpiChart]\" />\n</div>\n", styles: [":host{display:block}.cx-kpi{display:flex;flex-direction:column;gap:var(--space-sm);padding:var(--space-md);border:var(--line-discreet);border-radius:var(--radius-xl);background:var(--surface-alt)}.cx-kpi__header{display:flex;min-width:0;align-items:center;gap:var(--space-sm)}.cx-kpi__icon{flex:0 0 auto}.cx-kpi__heading{min-width:0;color:var(--ink);font-size:var(--font-size-body);font-weight:var(--font-weight-bold);line-height:var(--line-height-body);overflow-wrap:anywhere}.cx-kpi__metric{display:flex;min-width:0;flex-direction:column;gap:var(--space-sm)}.cx-kpi__value{min-width:0;color:var(--ink);font-size:var(--controller-size);font-weight:var(--font-weight-bold);line-height:var(--line-height-heading);font-variant-numeric:tabular-nums;overflow-wrap:anywhere}.cx-kpi__trend{flex:0 0 auto;align-self:flex-start}.cx-kpi__footer{color:var(--opacity-high);font-size:var(--font-size-body-sm);line-height:var(--line-height-body)}"], dependencies: [{ kind: "component", type: CxIconComponent, selector: "cx-icon", inputs: ["icon", "size", "mood", "shape"] }, { kind: "component", type: CxTrendTagComponent, selector: "cx-trend-tag", inputs: ["favor", "unit", "amount"] }, { kind: "component", type: CxProgressBarComponent, selector: "cx-progress-bar", inputs: ["label", "ariaLabel", "hint", "mood", "showValue", "indeterminate", "valueLabel", "value", "max"] }], changeDetection: i0.ChangeDetectionStrategy.OnPush });
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "22.0.8", ngImport: i0, type: CxKpiComponent, decorators: [{
            type: Component,
            args: [{ selector: 'cx-kpi', imports: [CxIconComponent, CxTrendTagComponent, CxProgressBarComponent], changeDetection: ChangeDetectionStrategy.OnPush, template: "<div class=\"cx-kpi\">\n  @if (icon || hasHeading) {\n    <div class=\"cx-kpi__header\">\n      @if (icon) {\n        <cx-icon class=\"cx-kpi__icon\" [icon]=\"icon\" size=\"32\" shape=\"square-subtle\" [mood]=\"mood\" />\n      }\n\n      @if (hasHeading) {\n        <div class=\"cx-kpi__heading\">{{ heading }}</div>\n      }\n    </div>\n  }\n\n  @if (visibleValue || hasTrend) {\n  <div class=\"cx-kpi__metric\">\n    @if (visibleValue) {\n      <div class=\"cx-kpi__value\">{{ visibleValue }}</div>\n    }\n\n    @if (hasTrend) {\n      <cx-trend-tag\n        class=\"cx-kpi__trend\"\n        [amount]=\"trendAmount!\"\n        [favor]=\"trendFavor\"\n        [unit]=\"trendUnit\"\n      />\n    }\n  </div>\n  }\n\n  @if (hasProgress) {\n    <cx-progress-bar\n      class=\"cx-kpi__progress\"\n      [label]=\"progressLabel\"\n      [value]=\"progress ?? 0\"\n      [max]=\"progressMax\"\n      [mood]=\"progressMood\"\n    />\n  }\n\n  @if (hasFooter) {\n    <div class=\"cx-kpi__footer\">{{ footer }}</div>\n  }\n\n  <ng-content select=\"[cxKpiChart]\" />\n</div>\n", styles: [":host{display:block}.cx-kpi{display:flex;flex-direction:column;gap:var(--space-sm);padding:var(--space-md);border:var(--line-discreet);border-radius:var(--radius-xl);background:var(--surface-alt)}.cx-kpi__header{display:flex;min-width:0;align-items:center;gap:var(--space-sm)}.cx-kpi__icon{flex:0 0 auto}.cx-kpi__heading{min-width:0;color:var(--ink);font-size:var(--font-size-body);font-weight:var(--font-weight-bold);line-height:var(--line-height-body);overflow-wrap:anywhere}.cx-kpi__metric{display:flex;min-width:0;flex-direction:column;gap:var(--space-sm)}.cx-kpi__value{min-width:0;color:var(--ink);font-size:var(--controller-size);font-weight:var(--font-weight-bold);line-height:var(--line-height-heading);font-variant-numeric:tabular-nums;overflow-wrap:anywhere}.cx-kpi__trend{flex:0 0 auto;align-self:flex-start}.cx-kpi__footer{color:var(--opacity-high);font-size:var(--font-size-body-sm);line-height:var(--line-height-body)}"] }]
        }], propDecorators: { heading: [{
                type: Input
            }], value: [{
                type: Input
            }], icon: [{
                type: Input
            }], mood: [{
                type: Input
            }], trendAmount: [{
                type: Input
            }], trendFavor: [{
                type: Input
            }], trendUnit: [{
                type: Input
            }], progress: [{
                type: Input
            }], progressMax: [{
                type: Input
            }], progressLabel: [{
                type: Input
            }], footer: [{
                type: Input
            }] } });
