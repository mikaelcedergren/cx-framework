import { ChangeDetectionStrategy, Component, Input, signal } from '@angular/core';
import { CxIconComponent } from '../../media/cx-icon';
import { CxTooltipDirective } from '../../overlay/cx-tooltip';

export interface CxStep {
  name: string;
  badge?: string | number;
  status?: CxStepStatus;
  mood?: CxStepMood;
}

export type CxStepStatus = 'pending';
export type CxStepMood = 'default' | 'danger';
export type CxStepsDensity = 'default' | 'compact';
export type CxStepsLayout = 'default' | 'fill';

@Component({
  selector: 'cx-steps',
  imports: [CxIconComponent, CxTooltipDirective],
  templateUrl: './cx-steps.component.html',
  styleUrl: './cx-steps.component.scss',
  host: {
    '[class.cx-steps--compact]': 'density === "compact"',
    '[class.cx-steps--fill]': 'layout === "fill"',
  },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CxStepsComponent {
  private readonly stepsState = signal<readonly CxStep[]>([]);

  @Input()
  public set steps(value: readonly CxStep[] | undefined) {
    this.stepsState.set(this.normalizeSteps(value));
  }

  public get steps(): readonly CxStep[] {
    return this.stepsState();
  }

  @Input() index = 0;
  @Input() density: CxStepsDensity = 'default';
  @Input() layout: CxStepsLayout = 'default';

  protected readonly steps$ = this.stepsState.asReadonly();

  protected currentIndex(): number {
    if (this.steps.length === 0) {
      return -1;
    }

    const index = Number.isFinite(this.index) ? Math.trunc(this.index) : 0;
    return Math.max(0, Math.min(index, this.steps.length));
  }

  protected isCurrent(index: number): boolean {
    return index === this.currentIndex();
  }

  protected isCompleted(step: CxStep, index: number): boolean {
    return !this.isPending(step) && index < this.currentIndex();
  }

  protected labelIsVisible(index: number): boolean {
    return this.density !== 'compact' || this.isCurrent(index);
  }

  protected isDanger(step: CxStep): boolean {
    return step.mood === 'danger';
  }

  protected isPending(step: CxStep): boolean {
    return step.status === 'pending';
  }

  /**
   * The label a step would have shown at default density, for the tooltip that
   * stands in for it while compact. Includes the badge, since the badge is part
   * of the visible label the tooltip is replacing.
   */
  protected stepTooltip(step: CxStep): string {
    const badge = this.badgeText(step);
    return badge ? `${step.name} (${badge})` : step.name;
  }

  protected badgeText(step: CxStep): string {
    if (typeof step.badge === 'number') {
      return Number.isFinite(step.badge) ? String(step.badge) : '';
    }
    return step.badge?.trim() ?? '';
  }

  protected stepStatus(step: CxStep, index: number): string {
    const sequenceStatus = this.isCurrent(index)
      ? 'Current'
      : this.isPending(step)
        ? 'Pending'
        : this.isCompleted(step, index)
          ? 'Completed'
          : 'Upcoming';
    return [
      sequenceStatus,
      this.isCurrent(index) && this.isPending(step) ? 'pending' : '',
      this.isDanger(step) ? 'needs attention' : '',
    ].filter(Boolean).join(', ');
  }

  private normalizeSteps(value: readonly CxStep[] | undefined): readonly CxStep[] {
    return (value ?? []).map(step => {
      const name = step?.name?.trim() ?? '';
      return { ...step, name };
    });
  }
}
