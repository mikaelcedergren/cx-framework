import { ChangeDetectionStrategy, Component, Input, computed, signal } from '@angular/core';
import * as i0 from "@angular/core";
/** Empty space between countdown segments, in pathLength units (the ring is pathLength="100"). */
const SEGMENT_GAP = 6;
export class CxCountdownRingComponent {
    size$ = signal('default', /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "size$" }] : /* istanbul ignore next */ []));
    segmentsState = signal(6, /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "segmentsState" }] : /* istanbul ignore next */ []));
    remainingState = signal(0, /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "remainingState" }] : /* istanbul ignore next */ []));
    directionState = signal('clockwise', /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "directionState" }] : /* istanbul ignore next */ []));
    mood = 'default';
    /** Optional accessible label. Otherwise exposes the number of pieces remaining. */
    ariaLabel;
    /** Direction in which pieces empty, starting at the top of the ring. */
    set direction(value) {
        if (value !== 'clockwise' && value !== 'counterclockwise') {
            throw new Error('cx-countdown-ring: direction must be clockwise or counterclockwise.');
        }
        this.directionState.set(value);
    }
    get direction() {
        return this.directionState();
    }
    /** Total pieces in the ring. Use a positive whole number. */
    set segments(value) {
        if (!Number.isSafeInteger(value) || value < 1) {
            throw new Error('cx-countdown-ring: segments must be a positive whole number.');
        }
        this.segmentsState.set(value);
    }
    get segments() {
        return this.segmentsState();
    }
    /** Pieces remaining. The consumer owns timing and supplies a whole number from 0 to segments. */
    set remaining(value) {
        if (!Number.isSafeInteger(value) || value < 0) {
            throw new Error('cx-countdown-ring: remaining must be a non-negative whole number.');
        }
        this.remainingState.set(value);
    }
    get remaining() {
        return this.remainingState();
    }
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
    segmentArcs$ = computed(() => {
        const count = this.segmentsState();
        const remaining = this.remainingState();
        if (remaining > count) {
            throw new Error('cx-countdown-ring: remaining cannot exceed segments.');
        }
        const spent = count - remaining;
        const clockwise = this.directionState() === 'clockwise';
        const slot = 100 / count;
        const arc = slot - Math.min(SEGMENT_GAP, slot * 0.36);
        const segments = [];
        for (let i = 0; i < count; i += 1) {
            segments.push({
                index: i,
                dash: `${arc} ${100 - arc}`,
                offset: `${-(i * slot)}`,
                filled: clockwise ? i >= spent : i < remaining,
            });
        }
        return segments;
    }, /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "segmentArcs$" }] : /* istanbul ignore next */ []));
    resolvedAriaLabel$() {
        return this.ariaLabel?.trim() || `${this.remainingState()} of ${this.segmentsState()} remaining`;
    }
    static ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "22.2.2", ngImport: i0, type: CxCountdownRingComponent, deps: [], target: i0.ɵɵFactoryTarget.Component });
    static ɵcmp = i0.ɵɵngDeclareComponent({ minVersion: "17.0.0", version: "22.2.2", type: CxCountdownRingComponent, isStandalone: true, selector: "cx-countdown-ring", inputs: { mood: "mood", ariaLabel: "ariaLabel", direction: "direction", segments: "segments", remaining: "remaining", size: "size" }, host: { properties: { "attr.role": "'img'", "attr.aria-label": "resolvedAriaLabel$()", "class.cx-countdown-ring-host--small": "size$() === \"small\"", "class.cx-countdown-ring-host--default": "size$() === \"default\"", "class.cx-countdown-ring-host--large": "size$() === \"large\"", "class.cx-countdown-ring-host--xlarge": "size$() === \"xlarge\"", "class.cx-countdown-ring-host--auto": "size$() === \"auto\"", "class.cx-countdown-ring-host--mood-primary": "mood === \"primary\"", "class.cx-countdown-ring-host--mood-accent": "mood === \"accent\"", "class.cx-countdown-ring-host--mood-info": "mood === \"info\"", "class.cx-countdown-ring-host--mood-success": "mood === \"success\"", "class.cx-countdown-ring-host--mood-warning": "mood === \"warning\"", "class.cx-countdown-ring-host--mood-danger": "mood === \"danger\"" } }, ngImport: i0, template: "<svg class=\"cx-countdown-ring__svg\" viewBox=\"0 0 24 24\" fill=\"none\" aria-hidden=\"true\">\n  <g transform=\"rotate(-90 12 12)\">\n    @for (segment of segmentArcs$(); track segment.index) {\n      <circle\n        class=\"cx-countdown-ring__segment\"\n        [class.cx-countdown-ring__segment--filled]=\"segment.filled\"\n        cx=\"12\"\n        cy=\"12\"\n        r=\"9.25\"\n        stroke=\"currentColor\"\n        stroke-width=\"2\"\n        stroke-linecap=\"butt\"\n        pathLength=\"100\"\n        [attr.stroke-dasharray]=\"segment.dash\"\n        [attr.stroke-dashoffset]=\"segment.offset\"\n      />\n    }\n  </g>\n</svg>\n", styles: [":host{display:inline-flex;width:24px;height:24px;align-items:center;justify-content:center;color:inherit}:host(.cx-countdown-ring-host--small){width:16px;height:16px}:host(.cx-countdown-ring-host--large){width:32px;height:32px}:host(.cx-countdown-ring-host--xlarge){width:64px;height:64px}:host(.cx-countdown-ring-host--auto){width:100%;height:100%}:host(.cx-countdown-ring-host--mood-primary){color:var(--primary)}:host(.cx-countdown-ring-host--mood-accent){color:var(--accent)}:host(.cx-countdown-ring-host--mood-info){color:var(--info)}:host(.cx-countdown-ring-host--mood-success){color:var(--success)}:host(.cx-countdown-ring-host--mood-warning){color:var(--warning)}:host(.cx-countdown-ring-host--mood-danger){color:var(--danger)}.cx-countdown-ring__svg{display:block;width:100%;height:100%}.cx-countdown-ring__segment{color:var(--opacity-mid)}.cx-countdown-ring__segment--filled{color:inherit}"], changeDetection: i0.ChangeDetectionStrategy.OnPush });
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "22.2.2", ngImport: i0, type: CxCountdownRingComponent, decorators: [{
            type: Component,
            args: [{ selector: 'cx-countdown-ring', host: {
                        '[attr.role]': "'img'",
                        '[attr.aria-label]': 'resolvedAriaLabel$()',
                        '[class.cx-countdown-ring-host--small]': 'size$() === "small"',
                        '[class.cx-countdown-ring-host--default]': 'size$() === "default"',
                        '[class.cx-countdown-ring-host--large]': 'size$() === "large"',
                        '[class.cx-countdown-ring-host--xlarge]': 'size$() === "xlarge"',
                        '[class.cx-countdown-ring-host--auto]': 'size$() === "auto"',
                        '[class.cx-countdown-ring-host--mood-primary]': 'mood === "primary"',
                        '[class.cx-countdown-ring-host--mood-accent]': 'mood === "accent"',
                        '[class.cx-countdown-ring-host--mood-info]': 'mood === "info"',
                        '[class.cx-countdown-ring-host--mood-success]': 'mood === "success"',
                        '[class.cx-countdown-ring-host--mood-warning]': 'mood === "warning"',
                        '[class.cx-countdown-ring-host--mood-danger]': 'mood === "danger"',
                    }, changeDetection: ChangeDetectionStrategy.OnPush, template: "<svg class=\"cx-countdown-ring__svg\" viewBox=\"0 0 24 24\" fill=\"none\" aria-hidden=\"true\">\n  <g transform=\"rotate(-90 12 12)\">\n    @for (segment of segmentArcs$(); track segment.index) {\n      <circle\n        class=\"cx-countdown-ring__segment\"\n        [class.cx-countdown-ring__segment--filled]=\"segment.filled\"\n        cx=\"12\"\n        cy=\"12\"\n        r=\"9.25\"\n        stroke=\"currentColor\"\n        stroke-width=\"2\"\n        stroke-linecap=\"butt\"\n        pathLength=\"100\"\n        [attr.stroke-dasharray]=\"segment.dash\"\n        [attr.stroke-dashoffset]=\"segment.offset\"\n      />\n    }\n  </g>\n</svg>\n", styles: [":host{display:inline-flex;width:24px;height:24px;align-items:center;justify-content:center;color:inherit}:host(.cx-countdown-ring-host--small){width:16px;height:16px}:host(.cx-countdown-ring-host--large){width:32px;height:32px}:host(.cx-countdown-ring-host--xlarge){width:64px;height:64px}:host(.cx-countdown-ring-host--auto){width:100%;height:100%}:host(.cx-countdown-ring-host--mood-primary){color:var(--primary)}:host(.cx-countdown-ring-host--mood-accent){color:var(--accent)}:host(.cx-countdown-ring-host--mood-info){color:var(--info)}:host(.cx-countdown-ring-host--mood-success){color:var(--success)}:host(.cx-countdown-ring-host--mood-warning){color:var(--warning)}:host(.cx-countdown-ring-host--mood-danger){color:var(--danger)}.cx-countdown-ring__svg{display:block;width:100%;height:100%}.cx-countdown-ring__segment{color:var(--opacity-mid)}.cx-countdown-ring__segment--filled{color:inherit}"] }]
        }], propDecorators: { mood: [{
                type: Input
            }], ariaLabel: [{
                type: Input
            }], direction: [{
                type: Input
            }], segments: [{
                type: Input
            }], remaining: [{
                type: Input
            }], size: [{
                type: Input
            }] } });
