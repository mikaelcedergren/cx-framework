import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { CxIconComponent } from '../../media/cx-icon/index.js';
import * as i0 from "@angular/core";
export class CxTrendTagComponent {
    amountValue = 3;
    favorValue = 'up';
    unitValue = 'percent';
    set favor(value) {
        this.favorValue = value === 'down' ? 'down' : 'up';
    }
    set unit(value) {
        this.unitValue = value === 'none' ? 'none' : 'percent';
    }
    set amount(value) {
        this.amountValue = Number.isFinite(value) ? value : 0;
    }
    iconName() {
        const amount = this.roundedAmount();
        if (amount < 0) {
            return 'trend-down';
        }
        if (amount === 0) {
            return 'arrow-right';
        }
        return 'trend-up';
    }
    trendClass() {
        const favoredAmount = this.favorValue === 'up' ? this.roundedAmount() : -this.roundedAmount();
        if (favoredAmount > 0)
            return 'up';
        if (favoredAmount < 0)
            return 'down';
        return 'flat';
    }
    displayValue() {
        const value = this.formatAmount(this.roundedAmount());
        return this.unitValue === 'percent' ? `${value}%` : value;
    }
    roundedAmount() {
        const rounded = Math.round(this.amountValue * 100) / 100;
        return Object.is(rounded, -0) ? 0 : rounded;
    }
    formatAmount(amount) {
        return amount
            .toFixed(2)
            .replace(/\.00$/, '')
            .replace(/(\.\d)0$/, '$1');
    }
    static ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "22.0.8", ngImport: i0, type: CxTrendTagComponent, deps: [], target: i0.ɵɵFactoryTarget.Component });
    static ɵcmp = i0.ɵɵngDeclareComponent({ minVersion: "14.0.0", version: "22.0.8", type: CxTrendTagComponent, isStandalone: true, selector: "cx-trend-tag", inputs: { favor: "favor", unit: "unit", amount: "amount" }, ngImport: i0, template: "<span\n  class=\"cx-trend-tag\"\n  [class.cx-trend-tag--up]=\"trendClass() === 'up'\"\n  [class.cx-trend-tag--flat]=\"trendClass() === 'flat'\"\n  [class.cx-trend-tag--down]=\"trendClass() === 'down'\"\n>\n  <cx-icon class=\"cx-trend-tag__icon\" [icon]=\"iconName()\" [size]=\"16\" />\n  <span class=\"cx-trend-tag__value\">{{ displayValue() }}</span>\n</span>\n", styles: [":host{display:inline-flex;width:auto}.cx-trend-tag{display:inline-flex;width:max-content;height:calc(var(--controller-size-small) - var(--space-xs));align-items:center;padding-inline-end:var(--space-xs);border-radius:var(--radius-sm);background:var(--success-opacity);color:var(--success);box-sizing:border-box}.cx-trend-tag__icon{flex:0 0 auto;color:currentColor}.cx-trend-tag__value{display:block;line-height:var(--line-height-body);white-space:nowrap;font-size:var(--font-size-body);font-weight:var(--font-weight-bold);color:currentColor}.cx-trend-tag--up{background:var(--success-opacity);color:var(--success)}.cx-trend-tag--flat{background:var(--info-opacity);color:var(--info)}.cx-trend-tag--down{background:var(--danger-opacity);color:var(--danger)}"], dependencies: [{ kind: "component", type: CxIconComponent, selector: "cx-icon", inputs: ["icon", "size", "mood", "shape"] }], changeDetection: i0.ChangeDetectionStrategy.OnPush });
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "22.0.8", ngImport: i0, type: CxTrendTagComponent, decorators: [{
            type: Component,
            args: [{ selector: 'cx-trend-tag', imports: [CxIconComponent], changeDetection: ChangeDetectionStrategy.OnPush, template: "<span\n  class=\"cx-trend-tag\"\n  [class.cx-trend-tag--up]=\"trendClass() === 'up'\"\n  [class.cx-trend-tag--flat]=\"trendClass() === 'flat'\"\n  [class.cx-trend-tag--down]=\"trendClass() === 'down'\"\n>\n  <cx-icon class=\"cx-trend-tag__icon\" [icon]=\"iconName()\" [size]=\"16\" />\n  <span class=\"cx-trend-tag__value\">{{ displayValue() }}</span>\n</span>\n", styles: [":host{display:inline-flex;width:auto}.cx-trend-tag{display:inline-flex;width:max-content;height:calc(var(--controller-size-small) - var(--space-xs));align-items:center;padding-inline-end:var(--space-xs);border-radius:var(--radius-sm);background:var(--success-opacity);color:var(--success);box-sizing:border-box}.cx-trend-tag__icon{flex:0 0 auto;color:currentColor}.cx-trend-tag__value{display:block;line-height:var(--line-height-body);white-space:nowrap;font-size:var(--font-size-body);font-weight:var(--font-weight-bold);color:currentColor}.cx-trend-tag--up{background:var(--success-opacity);color:var(--success)}.cx-trend-tag--flat{background:var(--info-opacity);color:var(--info)}.cx-trend-tag--down{background:var(--danger-opacity);color:var(--danger)}"] }]
        }], propDecorators: { favor: [{
                type: Input
            }], unit: [{
                type: Input
            }], amount: [{
                type: Input
            }] } });
