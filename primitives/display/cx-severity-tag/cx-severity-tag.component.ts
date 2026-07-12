import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

export type CxSeverityLevel = 'critical' | 'high' | 'medium' | 'low' | 'recommended';
export type CxSeverityTagVariant = 'bars' | 'dot';
export type CxSeverityTagDisplay = 'severity' | 'grade' | 'recommended';
export type CxSeverityTagFavor = 'low' | 'high';
export type CxSeverityGrade = 'a' | 'b' | 'c' | 'd' | 'e' | 'f';

const SCORE_MAX = 10;
const GRADE_STEPS: readonly CxSeverityGrade[] = ['a', 'b', 'c', 'd', 'e', 'f'];
const SEVERITY_STEPS: readonly Exclude<CxSeverityLevel, 'recommended'>[] = ['low', 'medium', 'high', 'critical'];

function cxSeverityRiskRatio(score: number, favor: CxSeverityTagFavor): number {
  const normalizedScore = Number.isFinite(score) ? Math.max(0, Math.min(SCORE_MAX, score)) : 0;
  const ratio = normalizedScore / SCORE_MAX;
  return favor === 'low' ? ratio : 1 - ratio;
}

export function cxSeverityLevelForScore(
  score: number,
  favor: CxSeverityTagFavor = 'low',
): Exclude<CxSeverityLevel, 'recommended'> {
  const risk = cxSeverityRiskRatio(score, favor);
  if (risk >= 0.9) return 'critical';
  if (risk >= 0.7) return 'high';
  if (risk >= 0.4) return 'medium';
  return 'low';
}

export function cxSeverityGradeForScore(
  score: number,
  favor: CxSeverityTagFavor = 'low',
): CxSeverityGrade {
  const index = Math.min(Math.floor(cxSeverityRiskRatio(score, favor) * GRADE_STEPS.length), GRADE_STEPS.length - 1);
  return GRADE_STEPS[index];
}

@Component({
  selector: 'cx-severity-tag',
  templateUrl: './cx-severity-tag.component.html',
  styleUrl: './cx-severity-tag.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CxSeverityTagComponent {
  private severityOverride: CxSeverityLevel | undefined;
  private scoreValue: number | undefined;

  @Input() variant: CxSeverityTagVariant = 'bars';
  @Input() display: CxSeverityTagDisplay = 'severity';
  @Input() favor: CxSeverityTagFavor = 'low';
  @Input() kev = false;

  @Input()
  public set severity(value: CxSeverityLevel | undefined) {
    this.severityOverride = value;
  }

  @Input()
  public set score(value: number | string | undefined) {
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

  protected label(): string {
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

  protected filledBars(): number {
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

  protected bars(): number[] {
    return Array.from({ length: this.barCount() }, (_, index) => index);
  }

  protected scoreText(): string | undefined {
    const score = this.normalizedScore();
    if (this.display === 'recommended' || score === undefined) {
      return undefined;
    }
    return Number.isInteger(score) ? String(score) : score.toFixed(1);
  }

  protected scoreVisible(): boolean {
    return this.scoreText() !== undefined;
  }

  protected hasContent(): boolean {
    if (this.display === 'recommended' || this.severityOverride === 'recommended') {
      return true;
    }
    return this.normalizedScore() !== undefined || Boolean(this.severityOverride);
  }

  protected stateClass(): string {
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

  private barCount(): number {
    return this.display === 'grade' ? GRADE_STEPS.length : SEVERITY_STEPS.length;
  }

  private severityLevel(): Exclude<CxSeverityLevel, 'recommended'> {
    const score = this.normalizedScore();
    if (score === undefined && this.severityOverride && this.severityOverride !== 'recommended') {
      return this.severityOverride;
    }
    return cxSeverityLevelForScore(score ?? 0, this.favor);
  }

  private gradeLabel(): CxSeverityGrade {
    const score = this.normalizedScore();
    if (score === undefined) {
      return 'f';
    }
    return cxSeverityGradeForScore(score, this.favor);
  }

  private normalizedScore(): number | undefined {
    if (this.scoreValue === undefined || !Number.isFinite(this.scoreValue)) {
      return undefined;
    }
    return Math.max(0, Math.min(SCORE_MAX, this.scoreValue));
  }
}
