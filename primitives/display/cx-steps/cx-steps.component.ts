import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { CxIconComponent } from '../../media/cx-icon';

export interface CxStep {
  name: string;
  visible?: boolean;
}

@Component({
  selector: 'cx-steps',
  imports: [CxIconComponent],
  templateUrl: './cx-steps.component.html',
  styleUrl: './cx-steps.component.scss',
  host: {
    '[class.cx-steps--compact]': 'compact',
    '[class.cx-steps--disabled]': 'disabled',
  },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CxStepsComponent {
  @Input() steps: readonly CxStep[] = [];
  @Input() index = 0;
  @Input() compact = false;
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
}
