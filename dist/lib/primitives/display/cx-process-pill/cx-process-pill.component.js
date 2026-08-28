import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { CxIconComponent } from '../../media/cx-icon/index.js';
import { CxTooltipDirective } from '../../overlay/cx-tooltip/index.js';
import * as i0 from "@angular/core";
/**
 * A single stage in a process. Presentational only — it renders a mood-coloured
 * indicator (icon or dot), a label, and an optional count. The interactive
 * behaviour (selection, keyboard, the move-toward-done logic) lives in
 * `cx-process`, which composes these. Usable standalone as a status legend.
 */
export class CxProcessPillComponent {
    /** Stage name. */
    label = '';
    /** Items currently in this stage. Omitted (undefined) hides the count; `0` is shown — a known empty stage is meaningful. */
    count;
    /** Semantic colour for the indicator. */
    mood = 'default';
    /** Leading icon. When omitted, a mood-coloured dot is shown instead. */
    icon;
    /** Active/selected appearance (the rail drives this from the current filter). */
    selected = false;
    /** Marks a settled, end-of-flow stage (e.g. Fixed, Closed) rather than open work. */
    terminal = false;
    /** De-emphasised appearance — used by the rail to quiet open stages once nothing is left to handle. */
    muted = false;
    /** Non-interactive, dimmed appearance. */
    disabled = false;
    /** Condensed appearance: hides the label, keeping the indicator and count. The rail sets this when the row runs out of room. */
    dense = false;
    hasCount() {
        return this.count !== undefined && this.count !== null;
    }
    static ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "22.0.8", ngImport: i0, type: CxProcessPillComponent, deps: [], target: i0.ɵɵFactoryTarget.Component });
    static ɵcmp = i0.ɵɵngDeclareComponent({ minVersion: "17.0.0", version: "22.0.8", type: CxProcessPillComponent, isStandalone: true, selector: "cx-process-pill", inputs: { label: "label", count: "count", mood: "mood", icon: "icon", selected: "selected", terminal: "terminal", muted: "muted", disabled: "disabled", dense: "dense" }, host: { properties: { "class.cx-process-pill--info": "mood === 'info'", "class.cx-process-pill--success": "mood === 'success'", "class.cx-process-pill--warning": "mood === 'warning'", "class.cx-process-pill--danger": "mood === 'danger'", "class.cx-process-pill--selected": "selected", "class.cx-process-pill--terminal": "terminal", "class.cx-process-pill--muted": "muted", "class.cx-process-pill--disabled": "disabled", "class.cx-process-pill--dense": "dense" }, classAttribute: "cx-process-pill" }, ngImport: i0, template: "<span class=\"cx-process-pill__indicator\" aria-hidden=\"true\">\n  @if (icon) {\n    <cx-icon class=\"cx-process-pill__icon\" [icon]=\"icon\" size=\"16\" />\n  } @else {\n    <span class=\"cx-process-pill__dot\"></span>\n  }\n</span>\n\n@if (label) {\n  <span\n    class=\"cx-process-pill__label\"\n    [cxTooltip]=\"label\"\n    [cxTooltipOverflow]=\"true\"\n  >{{ label }}</span>\n}\n\n@if (hasCount()) {\n  <span class=\"cx-process-pill__count\">{{ count }}</span>\n}\n", styles: [":host{display:inline-flex;min-height:var(--controller-size);box-sizing:border-box;max-width:100%;align-items:center;gap:var(--space-xs);padding:var(--space-2xs) var(--space-sm);border-radius:var(--radius-pill, 999px);corner-shape:round;color:var(--opacity-high);white-space:nowrap;transition:background-color var(--motion-fast) ease,color var(--motion-fast) ease,opacity var(--motion-fast) ease}:host(:hover){background:var(--opacity-low);color:var(--ink)}:host(.cx-process-pill--selected){background:var(--opacity-mid);color:var(--ink)}:host(.cx-process-pill--muted){opacity:.5}:host(.cx-process-pill--disabled){opacity:var(--opacity-disabled);pointer-events:none}.cx-process-pill__indicator{display:inline-flex;flex:0 0 auto;align-items:center;justify-content:center}.cx-process-pill__icon{color:var(--opacity-high)}.cx-process-pill__dot{width:var(--space-sm);height:var(--space-sm);border-radius:var(--radius-pill, 999px);corner-shape:round;background:var(--opacity-high)}.cx-process-pill__label{display:block;min-width:0;overflow:hidden;font-size:var(--font-size-body-sm);line-height:var(--line-height-small);white-space:nowrap;text-overflow:ellipsis}:host(.cx-process-pill--selected) .cx-process-pill__label{font-weight:var(--font-weight-bold)}.cx-process-pill__count{flex:0 0 auto;font-size:var(--font-size-body-sm);font-weight:var(--font-weight-bold);font-variant-numeric:tabular-nums}:host(.cx-process-pill--info) .cx-process-pill__dot{background:var(--info)}:host(.cx-process-pill--info) .cx-process-pill__icon{color:var(--info)}:host(.cx-process-pill--success) .cx-process-pill__dot{background:var(--success)}:host(.cx-process-pill--success) .cx-process-pill__icon{color:var(--success)}:host(.cx-process-pill--warning) .cx-process-pill__dot{background:var(--warning)}:host(.cx-process-pill--warning) .cx-process-pill__icon{color:var(--warning)}:host(.cx-process-pill--danger) .cx-process-pill__dot{background:var(--danger)}:host(.cx-process-pill--danger) .cx-process-pill__icon{color:var(--danger)}:host(.cx-process-pill--dense) .cx-process-pill__label{display:none}@media(prefers-reduced-motion: reduce){:host{transition:none}}"], dependencies: [{ kind: "component", type: CxIconComponent, selector: "cx-icon", inputs: ["icon", "size", "mood", "shape"] }, { kind: "directive", type: CxTooltipDirective, selector: "[cxTooltip]", inputs: ["cxTooltip", "cxTooltipPosition", "cxTooltipDelay", "cxTooltipDisabled", "cxTooltipOverflow"] }], changeDetection: i0.ChangeDetectionStrategy.OnPush });
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "22.0.8", ngImport: i0, type: CxProcessPillComponent, decorators: [{
            type: Component,
            args: [{ selector: 'cx-process-pill', imports: [CxIconComponent, CxTooltipDirective], host: {
                        class: 'cx-process-pill',
                        '[class.cx-process-pill--info]': "mood === 'info'",
                        '[class.cx-process-pill--success]': "mood === 'success'",
                        '[class.cx-process-pill--warning]': "mood === 'warning'",
                        '[class.cx-process-pill--danger]': "mood === 'danger'",
                        '[class.cx-process-pill--selected]': 'selected',
                        '[class.cx-process-pill--terminal]': 'terminal',
                        '[class.cx-process-pill--muted]': 'muted',
                        '[class.cx-process-pill--disabled]': 'disabled',
                        '[class.cx-process-pill--dense]': 'dense',
                    }, changeDetection: ChangeDetectionStrategy.OnPush, template: "<span class=\"cx-process-pill__indicator\" aria-hidden=\"true\">\n  @if (icon) {\n    <cx-icon class=\"cx-process-pill__icon\" [icon]=\"icon\" size=\"16\" />\n  } @else {\n    <span class=\"cx-process-pill__dot\"></span>\n  }\n</span>\n\n@if (label) {\n  <span\n    class=\"cx-process-pill__label\"\n    [cxTooltip]=\"label\"\n    [cxTooltipOverflow]=\"true\"\n  >{{ label }}</span>\n}\n\n@if (hasCount()) {\n  <span class=\"cx-process-pill__count\">{{ count }}</span>\n}\n", styles: [":host{display:inline-flex;min-height:var(--controller-size);box-sizing:border-box;max-width:100%;align-items:center;gap:var(--space-xs);padding:var(--space-2xs) var(--space-sm);border-radius:var(--radius-pill, 999px);corner-shape:round;color:var(--opacity-high);white-space:nowrap;transition:background-color var(--motion-fast) ease,color var(--motion-fast) ease,opacity var(--motion-fast) ease}:host(:hover){background:var(--opacity-low);color:var(--ink)}:host(.cx-process-pill--selected){background:var(--opacity-mid);color:var(--ink)}:host(.cx-process-pill--muted){opacity:.5}:host(.cx-process-pill--disabled){opacity:var(--opacity-disabled);pointer-events:none}.cx-process-pill__indicator{display:inline-flex;flex:0 0 auto;align-items:center;justify-content:center}.cx-process-pill__icon{color:var(--opacity-high)}.cx-process-pill__dot{width:var(--space-sm);height:var(--space-sm);border-radius:var(--radius-pill, 999px);corner-shape:round;background:var(--opacity-high)}.cx-process-pill__label{display:block;min-width:0;overflow:hidden;font-size:var(--font-size-body-sm);line-height:var(--line-height-small);white-space:nowrap;text-overflow:ellipsis}:host(.cx-process-pill--selected) .cx-process-pill__label{font-weight:var(--font-weight-bold)}.cx-process-pill__count{flex:0 0 auto;font-size:var(--font-size-body-sm);font-weight:var(--font-weight-bold);font-variant-numeric:tabular-nums}:host(.cx-process-pill--info) .cx-process-pill__dot{background:var(--info)}:host(.cx-process-pill--info) .cx-process-pill__icon{color:var(--info)}:host(.cx-process-pill--success) .cx-process-pill__dot{background:var(--success)}:host(.cx-process-pill--success) .cx-process-pill__icon{color:var(--success)}:host(.cx-process-pill--warning) .cx-process-pill__dot{background:var(--warning)}:host(.cx-process-pill--warning) .cx-process-pill__icon{color:var(--warning)}:host(.cx-process-pill--danger) .cx-process-pill__dot{background:var(--danger)}:host(.cx-process-pill--danger) .cx-process-pill__icon{color:var(--danger)}:host(.cx-process-pill--dense) .cx-process-pill__label{display:none}@media(prefers-reduced-motion: reduce){:host{transition:none}}"] }]
        }], propDecorators: { label: [{
                type: Input
            }], count: [{
                type: Input
            }], mood: [{
                type: Input
            }], icon: [{
                type: Input
            }], selected: [{
                type: Input
            }], terminal: [{
                type: Input
            }], muted: [{
                type: Input
            }], disabled: [{
                type: Input
            }], dense: [{
                type: Input
            }] } });
