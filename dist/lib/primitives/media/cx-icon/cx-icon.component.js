import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { getCxIcon } from '../../../icons/manifest.js';
import * as i0 from "@angular/core";
const DEFAULT_ICON_SIZE = '16';
const CX_ICON_SIZES = new Set(['12', '14', '16', '20', '24', '32', '64', 'auto']);
const CSS_NUMBER_PATTERN = /^\d+(?:\.\d+)?$/;
const CSS_LENGTH_PATTERN = /^\d+(?:\.\d+)?(?:px|rem|em|%)$/;
function resolveIconSize(value) {
    const normalized = typeof value === 'number' ? (Number.isFinite(value) ? String(value) : '') : value.trim();
    if (normalized === 'auto') {
        return { cssValue: '100%', sizeClass: 'auto' };
    }
    if (CSS_NUMBER_PATTERN.test(normalized)) {
        return {
            cssValue: `${normalized}px`,
            sizeClass: CX_ICON_SIZES.has(normalized)
                ? normalized
                : 'custom',
        };
    }
    if (CSS_LENGTH_PATTERN.test(normalized)) {
        return { cssValue: normalized, sizeClass: 'custom' };
    }
    return { cssValue: `${DEFAULT_ICON_SIZE}px`, sizeClass: DEFAULT_ICON_SIZE };
}
export class CxIconComponent {
    sizeValue = DEFAULT_ICON_SIZE;
    moodValue = 'default';
    shapeValue = 'none';
    resolvedSize = `${DEFAULT_ICON_SIZE}px`;
    resolvedSizeClass = DEFAULT_ICON_SIZE;
    get resolvedHeight() {
        return this.resolvedSizeClass === 'auto' && this.shape !== 'none' ? 'auto' : this.resolvedSize;
    }
    icon;
    set size(value) {
        this.sizeValue = value ?? DEFAULT_ICON_SIZE;
        const resolved = resolveIconSize(this.sizeValue);
        this.resolvedSize = resolved.cssValue;
        this.resolvedSizeClass = resolved.sizeClass;
    }
    get size() {
        return this.sizeValue;
    }
    set mood(value) {
        this.moodValue = value ?? 'default';
    }
    get mood() {
        return this.moodValue;
    }
    set shape(value) {
        this.shapeValue = value ?? 'none';
    }
    get shape() {
        return this.shapeValue;
    }
    get iconDefinition() {
        return getCxIcon(this.icon);
    }
    static ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "22.0.8", ngImport: i0, type: CxIconComponent, deps: [], target: i0.ɵɵFactoryTarget.Component });
    static ɵcmp = i0.ɵɵngDeclareComponent({ minVersion: "17.0.0", version: "22.0.8", type: CxIconComponent, isStandalone: true, selector: "cx-icon", inputs: { icon: "icon", size: "size", mood: "mood", shape: "shape" }, host: { properties: { "style.width": "resolvedSize", "style.height": "resolvedHeight", "class.cx-icon--size-12": "resolvedSizeClass === \"12\"", "class.cx-icon--size-14": "resolvedSizeClass === \"14\"", "class.cx-icon--size-16": "resolvedSizeClass === \"16\"", "class.cx-icon--size-20": "resolvedSizeClass === \"20\"", "class.cx-icon--size-24": "resolvedSizeClass === \"24\"", "class.cx-icon--size-32": "resolvedSizeClass === \"32\"", "class.cx-icon--size-64": "resolvedSizeClass === \"64\"", "class.cx-icon--size-auto": "resolvedSizeClass === \"auto\"", "class.cx-icon--spinner": "icon === \"spinner\"", "class.cx-icon--shaped": "shape !== \"none\"", "class.cx-icon--square": "shape.startsWith(\"square\")", "class.cx-icon--circle": "shape.startsWith(\"circle\")", "class.cx-icon--subtle": "shape.endsWith(\"subtle\")", "class.cx-icon--solid": "shape.endsWith(\"solid\") || shape.endsWith(\"outline\")", "class.cx-icon--outline": "shape.endsWith(\"outline\")", "class.cx-icon--mood-primary": "mood === \"primary\"", "class.cx-icon--mood-accent": "mood === \"accent\"", "class.cx-icon--mood-info": "mood === \"info\"", "class.cx-icon--mood-success": "mood === \"success\"", "class.cx-icon--mood-warning": "mood === \"warning\"", "class.cx-icon--mood-danger": "mood === \"danger\"" } }, ngImport: i0, template: "@if (iconDefinition; as definition) {\n  <svg\n    class=\"cx-icon\"\n    [attr.viewBox]=\"definition.viewBox\"\n    aria-hidden=\"true\"\n  >\n    @for (node of definition.nodes; track $index) {\n      <path\n        class=\"cx-icon__path\"\n        [attr.d]=\"node.d\"\n        [attr.stroke]=\"node.stroke ?? null\"\n        [attr.fill]=\"node.fill ?? null\"\n        [attr.stroke-width]=\"node.strokeWidth ?? null\"\n        [attr.stroke-dasharray]=\"node.strokeDasharray ?? null\"\n        [attr.stroke-linecap]=\"node.strokeLinecap ?? null\"\n        [attr.stroke-linejoin]=\"node.strokeLinejoin ?? null\"\n        [attr.fill-rule]=\"node.fillRule ?? null\"\n        [attr.clip-rule]=\"node.clipRule ?? null\"\n      />\n    }\n  </svg>\n}\n", styles: [":host{display:inline-flex;aspect-ratio:1/1;align-items:center;justify-content:center;color:inherit;line-height:0}.cx-icon{display:block;width:100%;height:100%;flex:0 0 auto;aspect-ratio:1/1}.cx-icon__path{vector-effect:non-scaling-stroke}:host(.cx-icon--square){border-radius:var(--radius-sm)}:host(.cx-icon--circle){border-radius:var(--radius-pill);corner-shape:round}:host(.cx-icon--subtle){background:var(--opacity-low)}:host(.cx-icon--solid){background:var(--surface);color:inherit}:host(.cx-icon--outline){outline:var(--space-xs) solid var(--opacity-low)}:host(.cx-icon--size-auto.cx-icon--shaped) .cx-icon{width:66.66%;height:66.66%}:host(.cx-icon--size-12.cx-icon--shaped) .cx-icon{width:8px;height:8px}:host(.cx-icon--size-14.cx-icon--shaped) .cx-icon{width:10px;height:10px}:host(.cx-icon--size-16.cx-icon--shaped) .cx-icon{width:10px;height:10px}:host(.cx-icon--size-20.cx-icon--shaped) .cx-icon{width:12px;height:12px}:host(.cx-icon--size-24.cx-icon--shaped) .cx-icon{width:var(--icon-size-sm);height:var(--icon-size-sm)}:host(.cx-icon--size-32.cx-icon--shaped) .cx-icon{width:var(--icon-size-md);height:var(--icon-size-md)}:host(.cx-icon--size-64.cx-icon--shaped) .cx-icon{width:40px;height:40px}:host(.cx-icon--size-12.cx-icon--outline){outline-width:var(--space-2xs)}:host(.cx-icon--size-12.cx-icon--square){border-radius:var(--radius-xs)}:host(.cx-icon--size-14.cx-icon--outline){outline-width:var(--space-2xs)}:host(.cx-icon--size-14.cx-icon--square){border-radius:var(--radius-xs)}:host(.cx-icon--size-32.cx-icon--outline){outline-width:calc(var(--space-xs) + var(--space-2xs))}:host(.cx-icon--size-64.cx-icon--outline){outline-width:var(--space-sm)}:host(.cx-icon--size-64.cx-icon--square){border-radius:var(--radius-md)}:host(.cx-icon--spinner) .cx-icon{animation:cx-icon-spin 1.05s linear infinite}@keyframes cx-icon-spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}:host(.cx-icon--mood-primary){color:var(--primary)}:host(.cx-icon--mood-primary.cx-icon--subtle){background:var(--primary-opacity)}:host(.cx-icon--mood-primary.cx-icon--solid){background:var(--primary);color:var(--on-ink)}:host(.cx-icon--mood-accent){color:var(--accent)}:host(.cx-icon--mood-accent.cx-icon--subtle){background:var(--accent-opacity)}:host(.cx-icon--mood-accent.cx-icon--solid){background:var(--accent);color:var(--on-ink)}:host(.cx-icon--mood-info){color:var(--info)}:host(.cx-icon--mood-info.cx-icon--subtle){background:var(--info-opacity)}:host(.cx-icon--mood-info.cx-icon--solid){background:var(--info);color:var(--on-ink)}:host(.cx-icon--mood-success){color:var(--success)}:host(.cx-icon--mood-success.cx-icon--subtle){background:var(--success-opacity)}:host(.cx-icon--mood-success.cx-icon--solid){background:var(--success);color:var(--on-ink)}:host(.cx-icon--mood-warning){color:var(--warning)}:host(.cx-icon--mood-warning.cx-icon--subtle){background:var(--warning-opacity)}:host(.cx-icon--mood-warning.cx-icon--solid){background:var(--warning);color:var(--on-ink)}:host(.cx-icon--mood-danger){color:var(--danger)}:host(.cx-icon--mood-danger.cx-icon--subtle){background:var(--danger-opacity)}:host(.cx-icon--mood-danger.cx-icon--solid){background:var(--danger);color:var(--on-ink)}@media(prefers-reduced-motion: reduce){:host(.cx-icon--spinner) .cx-icon{animation:none}}"], changeDetection: i0.ChangeDetectionStrategy.OnPush });
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "22.0.8", ngImport: i0, type: CxIconComponent, decorators: [{
            type: Component,
            args: [{ selector: 'cx-icon', host: {
                        '[style.width]': 'resolvedSize',
                        '[style.height]': 'resolvedHeight',
                        '[class.cx-icon--size-12]': 'resolvedSizeClass === "12"',
                        '[class.cx-icon--size-14]': 'resolvedSizeClass === "14"',
                        '[class.cx-icon--size-16]': 'resolvedSizeClass === "16"',
                        '[class.cx-icon--size-20]': 'resolvedSizeClass === "20"',
                        '[class.cx-icon--size-24]': 'resolvedSizeClass === "24"',
                        '[class.cx-icon--size-32]': 'resolvedSizeClass === "32"',
                        '[class.cx-icon--size-64]': 'resolvedSizeClass === "64"',
                        '[class.cx-icon--size-auto]': 'resolvedSizeClass === "auto"',
                        '[class.cx-icon--spinner]': 'icon === "spinner"',
                        '[class.cx-icon--shaped]': 'shape !== "none"',
                        '[class.cx-icon--square]': 'shape.startsWith("square")',
                        '[class.cx-icon--circle]': 'shape.startsWith("circle")',
                        '[class.cx-icon--subtle]': 'shape.endsWith("subtle")',
                        '[class.cx-icon--solid]': 'shape.endsWith("solid") || shape.endsWith("outline")',
                        '[class.cx-icon--outline]': 'shape.endsWith("outline")',
                        '[class.cx-icon--mood-primary]': 'mood === "primary"',
                        '[class.cx-icon--mood-accent]': 'mood === "accent"',
                        '[class.cx-icon--mood-info]': 'mood === "info"',
                        '[class.cx-icon--mood-success]': 'mood === "success"',
                        '[class.cx-icon--mood-warning]': 'mood === "warning"',
                        '[class.cx-icon--mood-danger]': 'mood === "danger"',
                    }, changeDetection: ChangeDetectionStrategy.OnPush, template: "@if (iconDefinition; as definition) {\n  <svg\n    class=\"cx-icon\"\n    [attr.viewBox]=\"definition.viewBox\"\n    aria-hidden=\"true\"\n  >\n    @for (node of definition.nodes; track $index) {\n      <path\n        class=\"cx-icon__path\"\n        [attr.d]=\"node.d\"\n        [attr.stroke]=\"node.stroke ?? null\"\n        [attr.fill]=\"node.fill ?? null\"\n        [attr.stroke-width]=\"node.strokeWidth ?? null\"\n        [attr.stroke-dasharray]=\"node.strokeDasharray ?? null\"\n        [attr.stroke-linecap]=\"node.strokeLinecap ?? null\"\n        [attr.stroke-linejoin]=\"node.strokeLinejoin ?? null\"\n        [attr.fill-rule]=\"node.fillRule ?? null\"\n        [attr.clip-rule]=\"node.clipRule ?? null\"\n      />\n    }\n  </svg>\n}\n", styles: [":host{display:inline-flex;aspect-ratio:1/1;align-items:center;justify-content:center;color:inherit;line-height:0}.cx-icon{display:block;width:100%;height:100%;flex:0 0 auto;aspect-ratio:1/1}.cx-icon__path{vector-effect:non-scaling-stroke}:host(.cx-icon--square){border-radius:var(--radius-sm)}:host(.cx-icon--circle){border-radius:var(--radius-pill);corner-shape:round}:host(.cx-icon--subtle){background:var(--opacity-low)}:host(.cx-icon--solid){background:var(--surface);color:inherit}:host(.cx-icon--outline){outline:var(--space-xs) solid var(--opacity-low)}:host(.cx-icon--size-auto.cx-icon--shaped) .cx-icon{width:66.66%;height:66.66%}:host(.cx-icon--size-12.cx-icon--shaped) .cx-icon{width:8px;height:8px}:host(.cx-icon--size-14.cx-icon--shaped) .cx-icon{width:10px;height:10px}:host(.cx-icon--size-16.cx-icon--shaped) .cx-icon{width:10px;height:10px}:host(.cx-icon--size-20.cx-icon--shaped) .cx-icon{width:12px;height:12px}:host(.cx-icon--size-24.cx-icon--shaped) .cx-icon{width:var(--icon-size-sm);height:var(--icon-size-sm)}:host(.cx-icon--size-32.cx-icon--shaped) .cx-icon{width:var(--icon-size-md);height:var(--icon-size-md)}:host(.cx-icon--size-64.cx-icon--shaped) .cx-icon{width:40px;height:40px}:host(.cx-icon--size-12.cx-icon--outline){outline-width:var(--space-2xs)}:host(.cx-icon--size-12.cx-icon--square){border-radius:var(--radius-xs)}:host(.cx-icon--size-14.cx-icon--outline){outline-width:var(--space-2xs)}:host(.cx-icon--size-14.cx-icon--square){border-radius:var(--radius-xs)}:host(.cx-icon--size-32.cx-icon--outline){outline-width:calc(var(--space-xs) + var(--space-2xs))}:host(.cx-icon--size-64.cx-icon--outline){outline-width:var(--space-sm)}:host(.cx-icon--size-64.cx-icon--square){border-radius:var(--radius-md)}:host(.cx-icon--spinner) .cx-icon{animation:cx-icon-spin 1.05s linear infinite}@keyframes cx-icon-spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}:host(.cx-icon--mood-primary){color:var(--primary)}:host(.cx-icon--mood-primary.cx-icon--subtle){background:var(--primary-opacity)}:host(.cx-icon--mood-primary.cx-icon--solid){background:var(--primary);color:var(--on-ink)}:host(.cx-icon--mood-accent){color:var(--accent)}:host(.cx-icon--mood-accent.cx-icon--subtle){background:var(--accent-opacity)}:host(.cx-icon--mood-accent.cx-icon--solid){background:var(--accent);color:var(--on-ink)}:host(.cx-icon--mood-info){color:var(--info)}:host(.cx-icon--mood-info.cx-icon--subtle){background:var(--info-opacity)}:host(.cx-icon--mood-info.cx-icon--solid){background:var(--info);color:var(--on-ink)}:host(.cx-icon--mood-success){color:var(--success)}:host(.cx-icon--mood-success.cx-icon--subtle){background:var(--success-opacity)}:host(.cx-icon--mood-success.cx-icon--solid){background:var(--success);color:var(--on-ink)}:host(.cx-icon--mood-warning){color:var(--warning)}:host(.cx-icon--mood-warning.cx-icon--subtle){background:var(--warning-opacity)}:host(.cx-icon--mood-warning.cx-icon--solid){background:var(--warning);color:var(--on-ink)}:host(.cx-icon--mood-danger){color:var(--danger)}:host(.cx-icon--mood-danger.cx-icon--subtle){background:var(--danger-opacity)}:host(.cx-icon--mood-danger.cx-icon--solid){background:var(--danger);color:var(--on-ink)}@media(prefers-reduced-motion: reduce){:host(.cx-icon--spinner) .cx-icon{animation:none}}"] }]
        }], propDecorators: { icon: [{
                type: Input
            }], size: [{
                type: Input
            }], mood: [{
                type: Input
            }], shape: [{
                type: Input
            }] } });
