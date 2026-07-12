import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { CxIconComponent } from '../../media/cx-icon';

export interface CxStep {
  name: string;
  visible?: boolean;
  badge?: string | number;
  mood?: CxStepMood;
}

export type CxStepMood = 'default' | 'danger';
export type CxStepsDensity = 'default' | 'compact';
export type CxStepsLabelMode = 'all' | 'current' | 'none';

@Component({
  selector: 'cx-steps',
  imports: [CxIconComponent],
  templateUrl: './cx-steps.component.html',
  styleUrl: './cx-steps.component.scss',
  host: {
    '[class.cx-steps--compact]': 'density === "compact"',
    '[class.cx-steps--disabled]': 'disabled',
  },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CxStepsComponent {
  @Input() steps: readonly CxStep[] = [];
  @Input() index = 0;
  @Input() density: CxStepsDensity = 'default';
  @Input() labelMode: CxStepsLabelMode = 'all';
  @Input() disabled = false;

  protected visibleSteps(): readonly CxStep[] {
    return this.steps.filter(step => step.visible !== false);
  }

  protected visibleIndex(): number {
    const visibleSteps = this.visibleSteps();
    if (this.steps.length === 0 || visibleSteps.length === 0) {
      return -1;
    }
    const currentIndex = Math.max(0, Math.min(this.index, this.steps.length - 1));
    return visibleSteps.indexOf(this.steps[currentIndex]);
  }

  protected lastVisibleIndex(): number {
    return this.visibleSteps().length - 1;
  }

  protected showLabel(index: number): boolean {
    return this.labelMode === 'all' || (this.labelMode === 'current' && index === this.visibleIndex());
  }

  protected isDanger(step: CxStep): boolean {
    return step.mood === 'danger';
  }

  protected badgeText(step: CxStep): string {
    if (typeof step.badge === 'number') {
      return Number.isFinite(step.badge) ? String(step.badge) : '';
    }
    return step.badge?.trim() ?? '';
  }
}
