import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import * as i0 from "@angular/core";
const SCORE_MAX = 10;
const GRADE_STEPS = ['a', 'b', 'c', 'd', 'e', 'f'];
const SEVERITY_STEPS = ['low', 'medium', 'high', 'critical'];
function cxSeverityRiskRatio(score, favor) {
    const normalizedScore = Number.isFinite(score) ? Math.max(0, Math.min(SCORE_MAX, score)) : 0;
    const ratio = normalizedScore / SCORE_MAX;
    return favor === 'low' ? ratio : 1 - ratio;
}
export function cxSeverityLevelForScore(score, favor = 'low') {
    const risk = cxSeverityRiskRatio(score, favor);
    if (risk >= 0.9)
        return 'critical';
    if (risk >= 0.7)
        return 'high';
    if (risk >= 0.4)
        return 'medium';
    return 'low';
}
export function cxSeverityGradeForScore(score, favor = 'low') {
    const index = Math.min(Math.floor(cxSeverityRiskRatio(score, favor) * GRADE_STEPS.length), GRADE_STEPS.length - 1);
    return GRADE_STEPS[index];
}
export class CxSeverityTagComponent {
    severityOverride;
    scoreValue;
    variant = 'bars';
    display = 'severity';
    favor = 'low';
    kev = false;
    set severity(value) {
        this.severityOverride = value;
    }
    set score(value) {
        if (typeof value === 'number') {
            this.scoreValue = Number.isFinite(value) ? value : undefined;
            return;
        }
        const trimmed = value?.trim();
        if (!trimmed) {
            this.scoreValue = undefined;
            return;
        }
        const parsed = Number(trimmed);
        this.scoreValue = Number.isFinite(parsed) ? parsed : undefined;
    }
    label() {
        if (this.display === 'recommended' || this.severityOverride === 'recommended') {
            return 'Recommended';
        }
        if (this.display === 'grade') {
            return this.gradeLabel().toUpperCase();
        }
        switch (this.severityLevel()) {
            case 'high':
                return 'High';
            case 'medium':
                return 'Medium';
            case 'low':
                return 'Low';
            default:
                return 'Critical';
        }
    }
    filledBars() {
        if (!this.hasContent()) {
            return 0;
        }
        if (this.display === 'recommended' || this.severityOverride === 'recommended') {
            return this.barCount();
        }
        if (this.display === 'grade') {
            return GRADE_STEPS.indexOf(this.gradeLabel()) + 1;
        }
        switch (this.severityLevel()) {
            case 'low':
                return 1;
            case 'medium':
                return 2;
            case 'high':
                return 3;
            case 'critical':
            default:
                return 4;
        }
    }
    bars() {
        return Array.from({ length: this.barCount() }, (_, index) => index);
    }
    scoreText() {
        const score = this.normalizedScore();
        if (this.display === 'recommended' || score === undefined) {
            return undefined;
        }
        return Number.isInteger(score) ? String(score) : score.toFixed(1);
    }
    scoreVisible() {
        return this.scoreText() !== undefined;
    }
    hasContent() {
        if (this.display === 'recommended' || this.severityOverride === 'recommended') {
            return true;
        }
        return this.normalizedScore() !== undefined || Boolean(this.severityOverride);
    }
    stateClass() {
        if (!this.hasContent()) {
            return 'empty';
        }
        if (this.display === 'recommended' || this.severityOverride === 'recommended') {
            return 'recommended';
        }
        if (this.display === 'grade') {
            return `grade-${this.gradeLabel()}`;
        }
        return this.severityLevel();
    }
    barCount() {
        return this.display === 'grade' ? GRADE_STEPS.length : SEVERITY_STEPS.length;
    }
    severityLevel() {
        const score = this.normalizedScore();
        if (score === undefined && this.severityOverride && this.severityOverride !== 'recommended') {
            return this.severityOverride;
        }
        return cxSeverityLevelForScore(score ?? 0, this.favor);
    }
    gradeLabel() {
        const score = this.normalizedScore();
        if (score === undefined) {
            return 'f';
        }
        return cxSeverityGradeForScore(score, this.favor);
    }
    normalizedScore() {
        if (this.scoreValue === undefined || !Number.isFinite(this.scoreValue)) {
            return undefined;
        }
        return Math.max(0, Math.min(SCORE_MAX, this.scoreValue));
    }
    static ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "22.0.8", ngImport: i0, type: CxSeverityTagComponent, deps: [], target: i0.ɵɵFactoryTarget.Component });
    static ɵcmp = i0.ɵɵngDeclareComponent({ minVersion: "17.0.0", version: "22.0.8", type: CxSeverityTagComponent, isStandalone: true, selector: "cx-severity-tag", inputs: { variant: "variant", display: "display", favor: "favor", kev: "kev", severity: "severity", score: "score" }, ngImport: i0, template: "<div\n  class=\"cx-severity-tag\"\n  [class.cx-severity-tag--dot]=\"variant === 'dot'\"\n  [class.cx-severity-tag--bars]=\"variant === 'bars'\"\n  [class.cx-severity-tag--critical]=\"stateClass() === 'critical'\"\n  [class.cx-severity-tag--high]=\"stateClass() === 'high'\"\n  [class.cx-severity-tag--medium]=\"stateClass() === 'medium'\"\n  [class.cx-severity-tag--low]=\"stateClass() === 'low'\"\n  [class.cx-severity-tag--recommended]=\"stateClass() === 'recommended'\"\n  [class.cx-severity-tag--grade-a]=\"stateClass() === 'grade-a'\"\n  [class.cx-severity-tag--grade-b]=\"stateClass() === 'grade-b'\"\n  [class.cx-severity-tag--grade-c]=\"stateClass() === 'grade-c'\"\n  [class.cx-severity-tag--grade-d]=\"stateClass() === 'grade-d'\"\n  [class.cx-severity-tag--grade-e]=\"stateClass() === 'grade-e'\"\n  [class.cx-severity-tag--grade-f]=\"stateClass() === 'grade-f'\"\n>\n  @if (hasContent()) {\n    @if (variant === 'bars') {\n      <span class=\"cx-severity-tag__grade\" aria-hidden=\"true\">\n        @for (bar of bars(); track bar) {\n          <span\n            class=\"cx-severity-tag__bar\"\n            [class.cx-severity-tag__bar--filled]=\"bar < filledBars()\"\n          ></span>\n        }\n      </span>\n    } @else {\n      <span class=\"cx-severity-tag__dot\" aria-hidden=\"true\"></span>\n    }\n\n    <span class=\"cx-severity-tag__label\">{{ label() }}</span>\n\n    @if (scoreVisible()) {\n      <span class=\"cx-severity-tag__score\">{{ scoreText() }}</span>\n    }\n\n    @if (kev) {\n      <span class=\"cx-severity-tag__kev\">KEV</span>\n    }\n  } @else {\n    <span class=\"cx-severity-tag__empty\">&mdash;</span>\n  }\n</div>\n", styles: [":host{display:inline-flex;width:auto}.cx-severity-tag{--cx-severity-accent: var(--opacity-mid);--cx-severity-indicator-opacity: 1;display:inline-flex;min-height:var(--controller-size-small);align-items:center;justify-content:flex-start;gap:var(--space-sm);width:max-content;min-width:0;padding:var(--space-xs) var(--space-sm);border-radius:var(--radius-sm);background:var(--opacity-low);color:var(--ink);box-sizing:border-box}.cx-severity-tag__dot{display:inline-flex;width:8px;height:8px;flex:0 0 auto;border-radius:var(--radius-pill);corner-shape:round;background:var(--cx-severity-accent);opacity:var(--cx-severity-indicator-opacity)}.cx-severity-tag__grade{display:inline-flex;align-items:flex-end;gap:var(--space-2xs);height:16px;opacity:var(--cx-severity-indicator-opacity)}.cx-severity-tag__bar{display:inline-flex;width:2px;height:100%;border-radius:var(--radius-xs);background:var(--opacity-mid)}.cx-severity-tag__bar--filled{background:var(--cx-severity-accent)}.cx-severity-tag__label,.cx-severity-tag__score,.cx-severity-tag__kev,.cx-severity-tag__empty{display:block;line-height:var(--line-height-body);white-space:nowrap}.cx-severity-tag__label{font-size:var(--font-size-body-sm);font-weight:var(--font-weight-bold);color:var(--ink)}.cx-severity-tag__score{font-size:var(--font-size-body-sm);font-weight:var(--font-weight-regular);color:var(--opacity-high)}.cx-severity-tag__kev{padding:0 var(--space-xs);border-radius:var(--radius-xs);background:var(--red-opacity);color:var(--red);font-size:var(--font-size-body-sm);font-weight:var(--font-weight-bold);letter-spacing:0}.cx-severity-tag__empty{width:var(--controller-size-small);color:var(--opacity-high);font-size:var(--font-size-body-sm);font-weight:var(--font-weight-medium);text-align:center}.cx-severity-tag--critical{--cx-severity-accent: var(--red)}.cx-severity-tag--high{--cx-severity-accent: var(--orange)}.cx-severity-tag--medium{--cx-severity-accent: var(--yellow);--cx-severity-indicator-opacity: 0.7}.cx-severity-tag--low{--cx-severity-accent: var(--green);--cx-severity-indicator-opacity: 0.4}.cx-severity-tag--recommended{--cx-severity-accent: var(--info)}.cx-severity-tag--grade-a{--cx-severity-accent: var(--green);--cx-severity-indicator-opacity: 0.4}.cx-severity-tag--grade-b{--cx-severity-accent: color-mix(in srgb, var(--green) 55%, var(--yellow));--cx-severity-indicator-opacity: 0.6}.cx-severity-tag--grade-c{--cx-severity-accent: var(--yellow);--cx-severity-indicator-opacity: 0.8}.cx-severity-tag--grade-d{--cx-severity-accent: var(--orange)}.cx-severity-tag--grade-e{--cx-severity-accent: var(--tangerine)}.cx-severity-tag--grade-f{--cx-severity-accent: var(--red)}"], changeDetection: i0.ChangeDetectionStrategy.OnPush });
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "22.0.8", ngImport: i0, type: CxSeverityTagComponent, decorators: [{
            type: Component,
            args: [{ selector: 'cx-severity-tag', changeDetection: ChangeDetectionStrategy.OnPush, template: "<div\n  class=\"cx-severity-tag\"\n  [class.cx-severity-tag--dot]=\"variant === 'dot'\"\n  [class.cx-severity-tag--bars]=\"variant === 'bars'\"\n  [class.cx-severity-tag--critical]=\"stateClass() === 'critical'\"\n  [class.cx-severity-tag--high]=\"stateClass() === 'high'\"\n  [class.cx-severity-tag--medium]=\"stateClass() === 'medium'\"\n  [class.cx-severity-tag--low]=\"stateClass() === 'low'\"\n  [class.cx-severity-tag--recommended]=\"stateClass() === 'recommended'\"\n  [class.cx-severity-tag--grade-a]=\"stateClass() === 'grade-a'\"\n  [class.cx-severity-tag--grade-b]=\"stateClass() === 'grade-b'\"\n  [class.cx-severity-tag--grade-c]=\"stateClass() === 'grade-c'\"\n  [class.cx-severity-tag--grade-d]=\"stateClass() === 'grade-d'\"\n  [class.cx-severity-tag--grade-e]=\"stateClass() === 'grade-e'\"\n  [class.cx-severity-tag--grade-f]=\"stateClass() === 'grade-f'\"\n>\n  @if (hasContent()) {\n    @if (variant === 'bars') {\n      <span class=\"cx-severity-tag__grade\" aria-hidden=\"true\">\n        @for (bar of bars(); track bar) {\n          <span\n            class=\"cx-severity-tag__bar\"\n            [class.cx-severity-tag__bar--filled]=\"bar < filledBars()\"\n          ></span>\n        }\n      </span>\n    } @else {\n      <span class=\"cx-severity-tag__dot\" aria-hidden=\"true\"></span>\n    }\n\n    <span class=\"cx-severity-tag__label\">{{ label() }}</span>\n\n    @if (scoreVisible()) {\n      <span class=\"cx-severity-tag__score\">{{ scoreText() }}</span>\n    }\n\n    @if (kev) {\n      <span class=\"cx-severity-tag__kev\">KEV</span>\n    }\n  } @else {\n    <span class=\"cx-severity-tag__empty\">&mdash;</span>\n  }\n</div>\n", styles: [":host{display:inline-flex;width:auto}.cx-severity-tag{--cx-severity-accent: var(--opacity-mid);--cx-severity-indicator-opacity: 1;display:inline-flex;min-height:var(--controller-size-small);align-items:center;justify-content:flex-start;gap:var(--space-sm);width:max-content;min-width:0;padding:var(--space-xs) var(--space-sm);border-radius:var(--radius-sm);background:var(--opacity-low);color:var(--ink);box-sizing:border-box}.cx-severity-tag__dot{display:inline-flex;width:8px;height:8px;flex:0 0 auto;border-radius:var(--radius-pill);corner-shape:round;background:var(--cx-severity-accent);opacity:var(--cx-severity-indicator-opacity)}.cx-severity-tag__grade{display:inline-flex;align-items:flex-end;gap:var(--space-2xs);height:16px;opacity:var(--cx-severity-indicator-opacity)}.cx-severity-tag__bar{display:inline-flex;width:2px;height:100%;border-radius:var(--radius-xs);background:var(--opacity-mid)}.cx-severity-tag__bar--filled{background:var(--cx-severity-accent)}.cx-severity-tag__label,.cx-severity-tag__score,.cx-severity-tag__kev,.cx-severity-tag__empty{display:block;line-height:var(--line-height-body);white-space:nowrap}.cx-severity-tag__label{font-size:var(--font-size-body-sm);font-weight:var(--font-weight-bold);color:var(--ink)}.cx-severity-tag__score{font-size:var(--font-size-body-sm);font-weight:var(--font-weight-regular);color:var(--opacity-high)}.cx-severity-tag__kev{padding:0 var(--space-xs);border-radius:var(--radius-xs);background:var(--red-opacity);color:var(--red);font-size:var(--font-size-body-sm);font-weight:var(--font-weight-bold);letter-spacing:0}.cx-severity-tag__empty{width:var(--controller-size-small);color:var(--opacity-high);font-size:var(--font-size-body-sm);font-weight:var(--font-weight-medium);text-align:center}.cx-severity-tag--critical{--cx-severity-accent: var(--red)}.cx-severity-tag--high{--cx-severity-accent: var(--orange)}.cx-severity-tag--medium{--cx-severity-accent: var(--yellow);--cx-severity-indicator-opacity: 0.7}.cx-severity-tag--low{--cx-severity-accent: var(--green);--cx-severity-indicator-opacity: 0.4}.cx-severity-tag--recommended{--cx-severity-accent: var(--info)}.cx-severity-tag--grade-a{--cx-severity-accent: var(--green);--cx-severity-indicator-opacity: 0.4}.cx-severity-tag--grade-b{--cx-severity-accent: color-mix(in srgb, var(--green) 55%, var(--yellow));--cx-severity-indicator-opacity: 0.6}.cx-severity-tag--grade-c{--cx-severity-accent: var(--yellow);--cx-severity-indicator-opacity: 0.8}.cx-severity-tag--grade-d{--cx-severity-accent: var(--orange)}.cx-severity-tag--grade-e{--cx-severity-accent: var(--tangerine)}.cx-severity-tag--grade-f{--cx-severity-accent: var(--red)}"] }]
        }], propDecorators: { variant: [{
                type: Input
            }], display: [{
                type: Input
            }], favor: [{
                type: Input
            }], kev: [{
                type: Input
            }], severity: [{
                type: Input
            }], score: [{
                type: Input
            }] } });
