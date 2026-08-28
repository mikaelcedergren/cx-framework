import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { getCxIcon } from '../../../icons/manifest.js';
import * as i0 from "@angular/core";
const DEFAULT_ICON_SIZE = '16';
const CX_ICON_SIZES = new Set(['12', '14', '16', '20', '24', '32', '64', 'auto']);
const CSS_NUMBER_PATTERN = /^\d+(?:\.\d+)?$/;
const CSS_LENGTH_PATTERN = /^\d+(?:\.\d+)?(?:px|rem|em|%)$/;
function resolveIconSize(value) {
    const normalized = typeof value === 'number'
        ? (Number.isFinite(value) ? String(value) : '')
        : value.trim();
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
    static ɵcmp = i0.ɵɵngDeclareComponent({ minVersion: "17.0.0", version: "22.0.8", type: CxIconComponent, isStandalone: true, selector: "cx-icon", inputs: { icon: "icon", size: "size", mood: "mood", shape: "shape" }, host: { properties: { "style.--cx-icon-size": "resolvedSize", "class.cx-icon--size-12": "resolvedSizeClass === \"12\"", "class.cx-icon--size-14": "resolvedSizeClass === \"14\"", "class.cx-icon--size-16": "resolvedSizeClass === \"16\"", "class.cx-icon--size-20": "resolvedSizeClass === \"20\"", "class.cx-icon--size-24": "resolvedSizeClass === \"24\"", "class.cx-icon--size-32": "resolvedSizeClass === \"32\"", "class.cx-icon--size-64": "resolvedSizeClass === \"64\"", "class.cx-icon--size-auto": "resolvedSizeClass === \"auto\"", "class.cx-icon--spinner": "icon === \"spinner\"", "class.cx-icon--shaped": "shape !== \"none\"", "class.cx-icon--square": "shape.startsWith(\"square\")", "class.cx-icon--circle": "shape.startsWith(\"circle\")", "class.cx-icon--subtle": "shape.endsWith(\"subtle\")", "class.cx-icon--solid": "shape.endsWith(\"solid\") || shape.endsWith(\"outline\")", "class.cx-icon--outline": "shape.endsWith(\"outline\")", "class.cx-icon--mood-primary": "mood === \"primary\"", "class.cx-icon--mood-accent": "mood === \"accent\"", "class.cx-icon--mood-info": "mood === \"info\"", "class.cx-icon--mood-success": "mood === \"success\"", "class.cx-icon--mood-warning": "mood === \"warning\"", "class.cx-icon--mood-danger": "mood === \"danger\"" } }, ngImport: i0, template: "@if (iconDefinition; as definition) {\n  <svg\n    class=\"cx-icon\"\n    [attr.viewBox]=\"definition.viewBox\"\n    aria-hidden=\"true\"\n  >\n    @for (node of definition.nodes; track $index) {\n      <path\n        class=\"cx-icon__path\"\n        [attr.d]=\"node.d\"\n        [attr.stroke]=\"node.stroke ?? null\"\n        [attr.fill]=\"node.fill ?? null\"\n        [attr.stroke-width]=\"node.strokeWidth ?? null\"\n        [attr.stroke-dasharray]=\"node.strokeDasharray ?? null\"\n        [attr.stroke-linecap]=\"node.strokeLinecap ?? null\"\n        [attr.stroke-linejoin]=\"node.strokeLinejoin ?? null\"\n        [attr.fill-rule]=\"node.fillRule ?? null\"\n        [attr.clip-rule]=\"node.clipRule ?? null\"\n      />\n    }\n  </svg>\n}\n", styles: [":host{display:inline-flex;--cx-icon-glyph-size: var(--cx-icon-size, 16px);--cx-icon-square-radius: var(--radius-sm);--cx-icon-outline-width: 4px;--cx-icon-color: inherit;--cx-icon-subtle-background: var(--opacity-low);--cx-icon-solid-background: var(--surface);--cx-icon-solid-color: inherit;width:var(--cx-icon-size, 16px);height:var(--cx-icon-size, 16px);aspect-ratio:1/1;align-items:center;justify-content:center;color:var(--cx-icon-color);line-height:0}.cx-icon{display:block;width:var(--cx-icon-glyph-size);height:var(--cx-icon-glyph-size);flex:0 0 auto;aspect-ratio:1/1}.cx-icon__path{vector-effect:non-scaling-stroke}:host(.cx-icon--size-auto){width:100%;height:100%;--cx-icon-glyph-size: 100%}:host(.cx-icon--size-auto.cx-icon--shaped){height:auto;--cx-icon-glyph-size: 66.66%}:host(.cx-icon--size-12.cx-icon--shaped){--cx-icon-glyph-size: 8px}:host(.cx-icon--size-14.cx-icon--shaped),:host(.cx-icon--size-16.cx-icon--shaped){--cx-icon-glyph-size: 10px}:host(.cx-icon--size-12.cx-icon--shaped),:host(.cx-icon--size-14.cx-icon--shaped){--cx-icon-outline-width: 2px;--cx-icon-square-radius: var(--radius-xs)}:host(.cx-icon--size-20.cx-icon--shaped){--cx-icon-glyph-size: 12px}:host(.cx-icon--size-24.cx-icon--shaped){--cx-icon-glyph-size: 16px}:host(.cx-icon--size-32.cx-icon--shaped){--cx-icon-glyph-size: 20px;--cx-icon-outline-width: 6px}:host(.cx-icon--size-64.cx-icon--shaped){--cx-icon-glyph-size: 40px;--cx-icon-outline-width: 8px;--cx-icon-square-radius: var(--radius-md)}:host(.cx-icon--square){border-radius:var(--cx-icon-square-radius)}:host(.cx-icon--circle){border-radius:var(--radius-pill);corner-shape:round}:host(.cx-icon--subtle){background:var(--cx-icon-subtle-background)}:host(.cx-icon--solid){background:var(--cx-icon-solid-background);color:var(--cx-icon-solid-color)}:host(.cx-icon--outline){outline:var(--cx-icon-outline-width) solid var(--opacity-low)}:host(.cx-icon--spinner) .cx-icon{animation:cx-icon-spin 1.05s linear infinite}@keyframes cx-icon-spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}:host(.cx-icon--mood-primary){--cx-icon-color: var(--primary);--cx-icon-subtle-background: var(--primary-opacity);--cx-icon-solid-background: var(--primary);--cx-icon-solid-color: var(--on-ink)}:host(.cx-icon--mood-accent){--cx-icon-color: var(--accent);--cx-icon-subtle-background: var(--accent-opacity);--cx-icon-solid-background: var(--accent);--cx-icon-solid-color: var(--on-ink)}:host(.cx-icon--mood-info){--cx-icon-color: var(--info);--cx-icon-subtle-background: var(--info-opacity);--cx-icon-solid-background: var(--info);--cx-icon-solid-color: var(--on-ink)}:host(.cx-icon--mood-success){--cx-icon-color: var(--success);--cx-icon-subtle-background: var(--success-opacity);--cx-icon-solid-background: var(--success);--cx-icon-solid-color: var(--on-ink)}:host(.cx-icon--mood-warning){--cx-icon-color: var(--warning);--cx-icon-subtle-background: var(--warning-opacity);--cx-icon-solid-background: var(--warning);--cx-icon-solid-color: var(--on-ink)}:host(.cx-icon--mood-danger){--cx-icon-color: var(--danger);--cx-icon-subtle-background: var(--danger-opacity);--cx-icon-solid-background: var(--danger);--cx-icon-solid-color: var(--on-ink)}@media(prefers-reduced-motion: reduce){:host(.cx-icon--spinner) .cx-icon{animation:none}}"], changeDetection: i0.ChangeDetectionStrategy.OnPush });
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "22.0.8", ngImport: i0, type: CxIconComponent, decorators: [{
            type: Component,
            args: [{ selector: 'cx-icon', host: {
                        '[style.--cx-icon-size]': 'resolvedSize',
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
                    }, changeDetection: ChangeDetectionStrategy.OnPush, template: "@if (iconDefinition; as definition) {\n  <svg\n    class=\"cx-icon\"\n    [attr.viewBox]=\"definition.viewBox\"\n    aria-hidden=\"true\"\n  >\n    @for (node of definition.nodes; track $index) {\n      <path\n        class=\"cx-icon__path\"\n        [attr.d]=\"node.d\"\n        [attr.stroke]=\"node.stroke ?? null\"\n        [attr.fill]=\"node.fill ?? null\"\n        [attr.stroke-width]=\"node.strokeWidth ?? null\"\n        [attr.stroke-dasharray]=\"node.strokeDasharray ?? null\"\n        [attr.stroke-linecap]=\"node.strokeLinecap ?? null\"\n        [attr.stroke-linejoin]=\"node.strokeLinejoin ?? null\"\n        [attr.fill-rule]=\"node.fillRule ?? null\"\n        [attr.clip-rule]=\"node.clipRule ?? null\"\n      />\n    }\n  </svg>\n}\n", styles: [":host{display:inline-flex;--cx-icon-glyph-size: var(--cx-icon-size, 16px);--cx-icon-square-radius: var(--radius-sm);--cx-icon-outline-width: 4px;--cx-icon-color: inherit;--cx-icon-subtle-background: var(--opacity-low);--cx-icon-solid-background: var(--surface);--cx-icon-solid-color: inherit;width:var(--cx-icon-size, 16px);height:var(--cx-icon-size, 16px);aspect-ratio:1/1;align-items:center;justify-content:center;color:var(--cx-icon-color);line-height:0}.cx-icon{display:block;width:var(--cx-icon-glyph-size);height:var(--cx-icon-glyph-size);flex:0 0 auto;aspect-ratio:1/1}.cx-icon__path{vector-effect:non-scaling-stroke}:host(.cx-icon--size-auto){width:100%;height:100%;--cx-icon-glyph-size: 100%}:host(.cx-icon--size-auto.cx-icon--shaped){height:auto;--cx-icon-glyph-size: 66.66%}:host(.cx-icon--size-12.cx-icon--shaped){--cx-icon-glyph-size: 8px}:host(.cx-icon--size-14.cx-icon--shaped),:host(.cx-icon--size-16.cx-icon--shaped){--cx-icon-glyph-size: 10px}:host(.cx-icon--size-12.cx-icon--shaped),:host(.cx-icon--size-14.cx-icon--shaped){--cx-icon-outline-width: 2px;--cx-icon-square-radius: var(--radius-xs)}:host(.cx-icon--size-20.cx-icon--shaped){--cx-icon-glyph-size: 12px}:host(.cx-icon--size-24.cx-icon--shaped){--cx-icon-glyph-size: 16px}:host(.cx-icon--size-32.cx-icon--shaped){--cx-icon-glyph-size: 20px;--cx-icon-outline-width: 6px}:host(.cx-icon--size-64.cx-icon--shaped){--cx-icon-glyph-size: 40px;--cx-icon-outline-width: 8px;--cx-icon-square-radius: var(--radius-md)}:host(.cx-icon--square){border-radius:var(--cx-icon-square-radius)}:host(.cx-icon--circle){border-radius:var(--radius-pill);corner-shape:round}:host(.cx-icon--subtle){background:var(--cx-icon-subtle-background)}:host(.cx-icon--solid){background:var(--cx-icon-solid-background);color:var(--cx-icon-solid-color)}:host(.cx-icon--outline){outline:var(--cx-icon-outline-width) solid var(--opacity-low)}:host(.cx-icon--spinner) .cx-icon{animation:cx-icon-spin 1.05s linear infinite}@keyframes cx-icon-spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}:host(.cx-icon--mood-primary){--cx-icon-color: var(--primary);--cx-icon-subtle-background: var(--primary-opacity);--cx-icon-solid-background: var(--primary);--cx-icon-solid-color: var(--on-ink)}:host(.cx-icon--mood-accent){--cx-icon-color: var(--accent);--cx-icon-subtle-background: var(--accent-opacity);--cx-icon-solid-background: var(--accent);--cx-icon-solid-color: var(--on-ink)}:host(.cx-icon--mood-info){--cx-icon-color: var(--info);--cx-icon-subtle-background: var(--info-opacity);--cx-icon-solid-background: var(--info);--cx-icon-solid-color: var(--on-ink)}:host(.cx-icon--mood-success){--cx-icon-color: var(--success);--cx-icon-subtle-background: var(--success-opacity);--cx-icon-solid-background: var(--success);--cx-icon-solid-color: var(--on-ink)}:host(.cx-icon--mood-warning){--cx-icon-color: var(--warning);--cx-icon-subtle-background: var(--warning-opacity);--cx-icon-solid-background: var(--warning);--cx-icon-solid-color: var(--on-ink)}:host(.cx-icon--mood-danger){--cx-icon-color: var(--danger);--cx-icon-subtle-background: var(--danger-opacity);--cx-icon-solid-background: var(--danger);--cx-icon-solid-color: var(--on-ink)}@media(prefers-reduced-motion: reduce){:host(.cx-icon--spinner) .cx-icon{animation:none}}"] }]
        }], propDecorators: { icon: [{
                type: Input
            }], size: [{
                type: Input
            }], mood: [{
                type: Input
            }], shape: [{
                type: Input
            }] } });
