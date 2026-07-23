import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { CxIconComponent } from '../../media/cx-icon';

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
  imports: [CxIconComponent],
  templateUrl: './cx-steps.component.html',
  styleUrl: './cx-steps.component.scss',
  host: {
    '[class.cx-steps--compact]': 'density === "compact"',
    '[class.cx-steps--fill]': 'layout === "fill"',
  },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CxStepsComponent {
  @Input() steps: readonly CxStep[] = [];
  @Input() index = 0;
  @Input() density: CxStepsDensity = 'default';
  @Input() layout: CxStepsLayout = 'default';

  protected currentIndex(): number {
    if (this.steps.length === 0) {
      return -1;
    }

    const index = Number.isFinite(this.index) ? Math.trunc(this.index) : 0;
    return Math.max(0, Math.min(index, this.steps.length - 1));
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
}
