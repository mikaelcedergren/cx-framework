import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { CxIconComponent } from '../../primitives/media/cx-icon/index.js';
import { CxTooltipDirective } from '../../primitives/overlay/cx-tooltip/index.js';
import * as i0 from "@angular/core";
/**
 * A horizontal item row: a leading icon, a title and description, and a trailing
 * slot for one control (a switch, button, or select). Use it for settings rows,
 * device lists, and similar "label + action" collections. The trailing control
 * is projected and keeps its own behaviour; the card only owns the layout.
 */
export class CxItemCardComponent {
    heading = '';
    description;
    icon;
    variant = 'default';
    get hasDescription() {
        return Boolean(this.description?.trim());
    }
    static ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "22.0.8", ngImport: i0, type: CxItemCardComponent, deps: [], target: i0.ɵɵFactoryTarget.Component });
    static ɵcmp = i0.ɵɵngDeclareComponent({ minVersion: "17.0.0", version: "22.0.8", type: CxItemCardComponent, isStandalone: true, selector: "cx-item-card", inputs: { heading: "heading", description: "description", icon: "icon", variant: "variant" }, host: { properties: { "class.cx-item-card-host--outline": "variant === 'outline'", "class.cx-item-card-host--transparent": "variant === 'transparent'" } }, ngImport: i0, template: "<div class=\"cx-item-card\">\n  @if (icon) {\n    <div class=\"cx-item-card__icon\">\n      <cx-icon [icon]=\"icon\" size=\"20\" />\n    </div>\n  }\n\n  @if (heading.trim() || hasDescription) {\n  <div class=\"cx-item-card__body\">\n    <div\n      class=\"cx-item-card__heading\"\n      [cxTooltip]=\"heading\"\n      [cxTooltipOverflow]=\"true\"\n    >\n      {{ heading }}\n    </div>\n    @if (hasDescription) {\n      <div\n        class=\"cx-item-card__description\"\n        [cxTooltip]=\"description\"\n        [cxTooltipOverflow]=\"true\"\n      >\n        {{ description }}\n      </div>\n    }\n  </div>\n  }\n\n  <div class=\"cx-item-card__action\">\n    <ng-content />\n  </div>\n</div>\n", styles: [":host{display:block}.cx-item-card{display:flex;align-items:center;gap:var(--space-md);padding:var(--space-sm) var(--space-md);border-radius:var(--radius-md);background:var(--surface-alt)}:host(.cx-item-card-host--outline) .cx-item-card{background:rgba(0,0,0,0);border:var(--line)}:host(.cx-item-card-host--transparent) .cx-item-card{padding:var(--space-sm) 0;background:rgba(0,0,0,0)}.cx-item-card__icon{display:inline-flex;flex:0 0 auto;align-items:center;justify-content:center;width:var(--controller-size);height:var(--controller-size);border-radius:var(--radius-sm);background:var(--opacity-low);color:var(--ink)}.cx-item-card__body{display:flex;min-width:0;flex:1 1 auto;flex-direction:column;gap:var(--space-2xs)}.cx-item-card__heading{overflow:hidden;color:var(--ink);font-size:var(--font-size-body);font-weight:var(--font-weight-medium);line-height:var(--line-height-body);text-overflow:ellipsis;white-space:nowrap}.cx-item-card__description{overflow:hidden;color:var(--opacity-high);font-size:var(--font-size-body-sm);line-height:var(--line-height-body);text-overflow:ellipsis;white-space:nowrap}.cx-item-card__action{display:inline-flex;flex:0 0 auto;align-items:center}.cx-item-card__action:empty{display:none}"], dependencies: [{ kind: "component", type: CxIconComponent, selector: "cx-icon", inputs: ["icon", "size", "mood", "shape"] }, { kind: "directive", type: CxTooltipDirective, selector: "[cxTooltip]", inputs: ["cxTooltip", "cxTooltipPosition", "cxTooltipDelay", "cxTooltipDisabled", "cxTooltipOverflow"] }], changeDetection: i0.ChangeDetectionStrategy.OnPush });
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "22.0.8", ngImport: i0, type: CxItemCardComponent, decorators: [{
            type: Component,
            args: [{ selector: 'cx-item-card', imports: [CxIconComponent, CxTooltipDirective], host: {
                        '[class.cx-item-card-host--outline]': "variant === 'outline'",
                        '[class.cx-item-card-host--transparent]': "variant === 'transparent'",
                    }, changeDetection: ChangeDetectionStrategy.OnPush, template: "<div class=\"cx-item-card\">\n  @if (icon) {\n    <div class=\"cx-item-card__icon\">\n      <cx-icon [icon]=\"icon\" size=\"20\" />\n    </div>\n  }\n\n  @if (heading.trim() || hasDescription) {\n  <div class=\"cx-item-card__body\">\n    <div\n      class=\"cx-item-card__heading\"\n      [cxTooltip]=\"heading\"\n      [cxTooltipOverflow]=\"true\"\n    >\n      {{ heading }}\n    </div>\n    @if (hasDescription) {\n      <div\n        class=\"cx-item-card__description\"\n        [cxTooltip]=\"description\"\n        [cxTooltipOverflow]=\"true\"\n      >\n        {{ description }}\n      </div>\n    }\n  </div>\n  }\n\n  <div class=\"cx-item-card__action\">\n    <ng-content />\n  </div>\n</div>\n", styles: [":host{display:block}.cx-item-card{display:flex;align-items:center;gap:var(--space-md);padding:var(--space-sm) var(--space-md);border-radius:var(--radius-md);background:var(--surface-alt)}:host(.cx-item-card-host--outline) .cx-item-card{background:rgba(0,0,0,0);border:var(--line)}:host(.cx-item-card-host--transparent) .cx-item-card{padding:var(--space-sm) 0;background:rgba(0,0,0,0)}.cx-item-card__icon{display:inline-flex;flex:0 0 auto;align-items:center;justify-content:center;width:var(--controller-size);height:var(--controller-size);border-radius:var(--radius-sm);background:var(--opacity-low);color:var(--ink)}.cx-item-card__body{display:flex;min-width:0;flex:1 1 auto;flex-direction:column;gap:var(--space-2xs)}.cx-item-card__heading{overflow:hidden;color:var(--ink);font-size:var(--font-size-body);font-weight:var(--font-weight-medium);line-height:var(--line-height-body);text-overflow:ellipsis;white-space:nowrap}.cx-item-card__description{overflow:hidden;color:var(--opacity-high);font-size:var(--font-size-body-sm);line-height:var(--line-height-body);text-overflow:ellipsis;white-space:nowrap}.cx-item-card__action{display:inline-flex;flex:0 0 auto;align-items:center}.cx-item-card__action:empty{display:none}"] }]
        }], propDecorators: { heading: [{
                type: Input
            }], description: [{
                type: Input
            }], icon: [{
                type: Input
            }], variant: [{
                type: Input
            }] } });
