import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { CxIconComponent } from '../../media/cx-icon/index.js';
import { CxTooltipDirective } from '../../overlay/cx-tooltip/index.js';
import * as i0 from "@angular/core";
export class CxStatusTagComponent {
    mood = 'default';
    text = 'Status';
    icon;
    iconName() {
        if (this.icon) {
            return this.icon;
        }
        switch (this.mood) {
            case 'info':
                return 'info';
            case 'success':
                return 'resolved';
            case 'warning':
                return 'warning';
            case 'danger':
                return 'ban';
            case 'default':
            default:
                return 'pending';
        }
    }
    static ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "22.0.8", ngImport: i0, type: CxStatusTagComponent, deps: [], target: i0.ɵɵFactoryTarget.Component });
    static ɵcmp = i0.ɵɵngDeclareComponent({ minVersion: "17.0.0", version: "22.0.8", type: CxStatusTagComponent, isStandalone: true, selector: "cx-status-tag", inputs: { mood: "mood", text: "text", icon: "icon" }, ngImport: i0, template: "<div\n  class=\"cx-status-tag\"\n  [class.cx-status-tag--default]=\"mood === 'default'\"\n  [class.cx-status-tag--info]=\"mood === 'info'\"\n  [class.cx-status-tag--success]=\"mood === 'success'\"\n  [class.cx-status-tag--warning]=\"mood === 'warning'\"\n  [class.cx-status-tag--danger]=\"mood === 'danger'\"\n  [class.cx-status-tag--icon-override]=\"icon\"\n>\n  <span class=\"cx-status-tag__icon\" aria-hidden=\"true\">\n    <cx-icon [icon]=\"iconName()\" [size]=\"12\" />\n  </span>\n  @if (text.trim()) {\n    <span class=\"cx-status-tag__label\" [cxTooltip]=\"text\" [cxTooltipOverflow]=\"true\">{{ text }}</span>\n  }\n</div>\n", styles: [":host{display:inline-flex;width:auto}.cx-status-tag{display:inline-flex;min-height:var(--space-lg);align-items:center;gap:var(--space-sm);padding:0 var(--space-sm);border-radius:var(--radius-sm);background:var(--opacity-low);color:var(--ink);box-sizing:border-box;max-width:100%;white-space:nowrap}.cx-status-tag__icon{display:inline-flex;width:12px;height:12px;flex:0 0 auto;align-items:center;justify-content:center;color:var(--opacity-high);aspect-ratio:1/1}.cx-status-tag__label{display:block;min-width:0;overflow:hidden;line-height:var(--line-height-small);white-space:nowrap;text-overflow:ellipsis;font-size:var(--font-size-body-sm);font-weight:var(--font-weight-bold);color:var(--ink)}.cx-status-tag--info{background:var(--info-opacity)}.cx-status-tag--info .cx-status-tag__icon{color:var(--info)}.cx-status-tag--success{background:var(--success-opacity)}.cx-status-tag--success .cx-status-tag__icon{color:var(--success)}.cx-status-tag--warning{background:var(--warning-opacity)}.cx-status-tag--warning .cx-status-tag__icon{color:var(--warning)}.cx-status-tag--danger{background:var(--danger-opacity)}.cx-status-tag--danger .cx-status-tag__icon{color:var(--danger)}.cx-status-tag--default.cx-status-tag--icon-override .cx-status-tag__icon{color:var(--ink)}"], dependencies: [{ kind: "component", type: CxIconComponent, selector: "cx-icon", inputs: ["icon", "size", "mood", "shape"] }, { kind: "directive", type: CxTooltipDirective, selector: "[cxTooltip]", inputs: ["cxTooltip", "cxTooltipPosition", "cxTooltipDelay", "cxTooltipDisabled", "cxTooltipOverflow"] }], changeDetection: i0.ChangeDetectionStrategy.OnPush });
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "22.0.8", ngImport: i0, type: CxStatusTagComponent, decorators: [{
            type: Component,
            args: [{ selector: 'cx-status-tag', imports: [CxIconComponent, CxTooltipDirective], changeDetection: ChangeDetectionStrategy.OnPush, template: "<div\n  class=\"cx-status-tag\"\n  [class.cx-status-tag--default]=\"mood === 'default'\"\n  [class.cx-status-tag--info]=\"mood === 'info'\"\n  [class.cx-status-tag--success]=\"mood === 'success'\"\n  [class.cx-status-tag--warning]=\"mood === 'warning'\"\n  [class.cx-status-tag--danger]=\"mood === 'danger'\"\n  [class.cx-status-tag--icon-override]=\"icon\"\n>\n  <span class=\"cx-status-tag__icon\" aria-hidden=\"true\">\n    <cx-icon [icon]=\"iconName()\" [size]=\"12\" />\n  </span>\n  @if (text.trim()) {\n    <span class=\"cx-status-tag__label\" [cxTooltip]=\"text\" [cxTooltipOverflow]=\"true\">{{ text }}</span>\n  }\n</div>\n", styles: [":host{display:inline-flex;width:auto}.cx-status-tag{display:inline-flex;min-height:var(--space-lg);align-items:center;gap:var(--space-sm);padding:0 var(--space-sm);border-radius:var(--radius-sm);background:var(--opacity-low);color:var(--ink);box-sizing:border-box;max-width:100%;white-space:nowrap}.cx-status-tag__icon{display:inline-flex;width:12px;height:12px;flex:0 0 auto;align-items:center;justify-content:center;color:var(--opacity-high);aspect-ratio:1/1}.cx-status-tag__label{display:block;min-width:0;overflow:hidden;line-height:var(--line-height-small);white-space:nowrap;text-overflow:ellipsis;font-size:var(--font-size-body-sm);font-weight:var(--font-weight-bold);color:var(--ink)}.cx-status-tag--info{background:var(--info-opacity)}.cx-status-tag--info .cx-status-tag__icon{color:var(--info)}.cx-status-tag--success{background:var(--success-opacity)}.cx-status-tag--success .cx-status-tag__icon{color:var(--success)}.cx-status-tag--warning{background:var(--warning-opacity)}.cx-status-tag--warning .cx-status-tag__icon{color:var(--warning)}.cx-status-tag--danger{background:var(--danger-opacity)}.cx-status-tag--danger .cx-status-tag__icon{color:var(--danger)}.cx-status-tag--default.cx-status-tag--icon-override .cx-status-tag__icon{color:var(--ink)}"] }]
        }], propDecorators: { mood: [{
                type: Input
            }], text: [{
                type: Input
            }], icon: [{
                type: Input
            }] } });
