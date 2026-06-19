import { ChangeDetectionStrategy, Component, Input, computed, signal } from '@angular/core';

export type CxProgressBarMood = 'default' | 'accent' | 'success' | 'danger';

@Component({
  selector: 'cx-progress-bar',
  templateUrl: './cx-progress-bar.component.html',
  styleUrl: './cx-progress-bar.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CxProgressBarComponent {
  private readonly valueState = signal(64);
  private readonly maxState = signal(100);

  @Input() label = 'Progress';
  @Input() hint: string | undefined;
  @Input() mood: CxProgressBarMood = 'default';
  @Input() showValue = true;
  @Input() indeterminate = false;
  @Input() valueLabel: string | undefined;

  @Input()
  public set value(value: number) {
    this.valueState.set(Number.isFinite(value) ? value : 0);
  }

  @Input()
  public set max(value: number) {
    this.maxState.set(Number.isFinite(value) && value > 0 ? value : 100);
  }

  protected readonly normalizedValue$ = computed(() => {
    const max = this.maxState();
    const value = this.valueState();
    return Math.min(Math.max(value, 0), max);
  });
  protected readonly max$ = this.maxState.asReadonly();
  protected progressRatio(): number {
    if (this.indeterminate) {
      return 0;
    }
    return this.normalizedValue$() / this.maxState();
  }

  protected progressPercent(): number {
    return Math.round(this.progressRatio() * 100);
  }

  protected resolvedValueLabel(): string | undefined {
    const explicit = this.valueLabel?.trim();
    if (explicit) {
      return explicit;
    }
    if (this.indeterminate) {
      return undefined;
    }
    return `${this.progressPercent()}%`;
  }
}
