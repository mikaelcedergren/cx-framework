import { ChangeDetectionStrategy, Component, Input, signal } from '@angular/core';
import * as i0 from "@angular/core";
export class CxSpinnerComponent {
    size$ = signal('default', /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "size$" }] : /* istanbul ignore next */ []));
    mood = 'default';
    /** Accessible label. Defaults to "Loading" for the indeterminate spinner. */
    ariaLabel;
    set size(value) {
        switch (value) {
            case 'small':
                this.size$.set('small');
                return;
            case 'large':
                this.size$.set('large');
                return;
            case 'xlarge':
                this.size$.set('xlarge');
                return;
            case 'auto':
                this.size$.set('auto');
                return;
            case 'default':
            default:
                this.size$.set('default');
                return;
        }
    }
    get size() {
        return this.size$();
    }
    resolvedAriaLabel$() {
        return this.ariaLabel?.trim() || 'Loading';
    }
    static ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "22.2.2", ngImport: i0, type: CxSpinnerComponent, deps: [], target: i0.ɵɵFactoryTarget.Component });
    static ɵcmp = i0.ɵɵngDeclareComponent({ minVersion: "14.0.0", version: "22.2.2", type: CxSpinnerComponent, isStandalone: true, selector: "cx-spinner", inputs: { mood: "mood", ariaLabel: "ariaLabel", size: "size" }, host: { properties: { "attr.role": "'status'", "attr.aria-busy": "'true'", "attr.aria-label": "resolvedAriaLabel$()", "class.cx-spinner-host--small": "size$() === \"small\"", "class.cx-spinner-host--default": "size$() === \"default\"", "class.cx-spinner-host--large": "size$() === \"large\"", "class.cx-spinner-host--xlarge": "size$() === \"xlarge\"", "class.cx-spinner-host--auto": "size$() === \"auto\"", "class.cx-spinner-host--mood-primary": "mood === \"primary\"", "class.cx-spinner-host--mood-accent": "mood === \"accent\"", "class.cx-spinner-host--mood-info": "mood === \"info\"", "class.cx-spinner-host--mood-success": "mood === \"success\"", "class.cx-spinner-host--mood-warning": "mood === \"warning\"", "class.cx-spinner-host--mood-danger": "mood === \"danger\"" } }, ngImport: i0, template: "<svg class=\"cx-spinner__svg\" viewBox=\"0 0 24 24\" fill=\"none\" aria-hidden=\"true\">\n  <circle class=\"cx-spinner__track\" cx=\"12\" cy=\"12\" r=\"9.25\" stroke=\"currentColor\" stroke-width=\"1.5\" />\n  <circle\n    class=\"cx-spinner__arc\"\n    cx=\"12\"\n    cy=\"12\"\n    r=\"9.25\"\n    stroke=\"currentColor\"\n    stroke-width=\"1.5\"\n    stroke-linecap=\"round\"\n    pathLength=\"100\"\n    stroke-dasharray=\"25 100\"\n  />\n</svg>\n", styles: [":host{display:inline-flex;width:24px;height:24px;align-items:center;justify-content:center;color:inherit}:host(.cx-spinner-host--small){width:16px;height:16px}:host(.cx-spinner-host--large){width:32px;height:32px}:host(.cx-spinner-host--xlarge){width:64px;height:64px}:host(.cx-spinner-host--auto){width:100%;height:100%}:host(.cx-spinner-host--mood-primary){color:var(--primary)}:host(.cx-spinner-host--mood-accent){color:var(--accent)}:host(.cx-spinner-host--mood-info){color:var(--info)}:host(.cx-spinner-host--mood-success){color:var(--success)}:host(.cx-spinner-host--mood-warning){color:var(--warning)}:host(.cx-spinner-host--mood-danger){color:var(--danger)}.cx-spinner__svg{display:block;width:100%;height:100%}.cx-spinner__track{color:var(--opacity-mid)}.cx-spinner__arc{transform-origin:center;animation:cx-spinner-spin 1.8s linear infinite,cx-spinner-arc-pulse 1.4s ease-in-out infinite}@keyframes cx-spinner-spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}@keyframes cx-spinner-arc-pulse{0%{stroke-dasharray:8 100;stroke-dashoffset:0}50%{stroke-dasharray:68 100;stroke-dashoffset:-18}100%{stroke-dasharray:8 100;stroke-dashoffset:-108}}@media(prefers-reduced-motion: reduce){.cx-spinner__arc{animation:none}}"], changeDetection: i0.ChangeDetectionStrategy.OnPush });
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "22.2.2", ngImport: i0, type: CxSpinnerComponent, decorators: [{
            type: Component,
            args: [{ selector: 'cx-spinner', host: {
                        '[attr.role]': "'status'",
                        '[attr.aria-busy]': "'true'",
                        '[attr.aria-label]': 'resolvedAriaLabel$()',
                        '[class.cx-spinner-host--small]': 'size$() === "small"',
                        '[class.cx-spinner-host--default]': 'size$() === "default"',
                        '[class.cx-spinner-host--large]': 'size$() === "large"',
                        '[class.cx-spinner-host--xlarge]': 'size$() === "xlarge"',
                        '[class.cx-spinner-host--auto]': 'size$() === "auto"',
                        '[class.cx-spinner-host--mood-primary]': 'mood === "primary"',
                        '[class.cx-spinner-host--mood-accent]': 'mood === "accent"',
                        '[class.cx-spinner-host--mood-info]': 'mood === "info"',
                        '[class.cx-spinner-host--mood-success]': 'mood === "success"',
                        '[class.cx-spinner-host--mood-warning]': 'mood === "warning"',
                        '[class.cx-spinner-host--mood-danger]': 'mood === "danger"',
                    }, changeDetection: ChangeDetectionStrategy.OnPush, template: "<svg class=\"cx-spinner__svg\" viewBox=\"0 0 24 24\" fill=\"none\" aria-hidden=\"true\">\n  <circle class=\"cx-spinner__track\" cx=\"12\" cy=\"12\" r=\"9.25\" stroke=\"currentColor\" stroke-width=\"1.5\" />\n  <circle\n    class=\"cx-spinner__arc\"\n    cx=\"12\"\n    cy=\"12\"\n    r=\"9.25\"\n    stroke=\"currentColor\"\n    stroke-width=\"1.5\"\n    stroke-linecap=\"round\"\n    pathLength=\"100\"\n    stroke-dasharray=\"25 100\"\n  />\n</svg>\n", styles: [":host{display:inline-flex;width:24px;height:24px;align-items:center;justify-content:center;color:inherit}:host(.cx-spinner-host--small){width:16px;height:16px}:host(.cx-spinner-host--large){width:32px;height:32px}:host(.cx-spinner-host--xlarge){width:64px;height:64px}:host(.cx-spinner-host--auto){width:100%;height:100%}:host(.cx-spinner-host--mood-primary){color:var(--primary)}:host(.cx-spinner-host--mood-accent){color:var(--accent)}:host(.cx-spinner-host--mood-info){color:var(--info)}:host(.cx-spinner-host--mood-success){color:var(--success)}:host(.cx-spinner-host--mood-warning){color:var(--warning)}:host(.cx-spinner-host--mood-danger){color:var(--danger)}.cx-spinner__svg{display:block;width:100%;height:100%}.cx-spinner__track{color:var(--opacity-mid)}.cx-spinner__arc{transform-origin:center;animation:cx-spinner-spin 1.8s linear infinite,cx-spinner-arc-pulse 1.4s ease-in-out infinite}@keyframes cx-spinner-spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}@keyframes cx-spinner-arc-pulse{0%{stroke-dasharray:8 100;stroke-dashoffset:0}50%{stroke-dasharray:68 100;stroke-dashoffset:-18}100%{stroke-dasharray:8 100;stroke-dashoffset:-108}}@media(prefers-reduced-motion: reduce){.cx-spinner__arc{animation:none}}"] }]
        }], propDecorators: { mood: [{
                type: Input
            }], ariaLabel: [{
                type: Input
            }], size: [{
                type: Input
            }] } });
