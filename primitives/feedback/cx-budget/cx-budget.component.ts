import { ChangeDetectionStrategy, Component, Input, computed, signal } from '@angular/core';

export type CxBudgetFavor = 'low' | 'high';
type CxBudgetColor = 'success' | 'yellow' | 'orange' | 'danger';

@Component({
  selector: 'cx-budget',
  templateUrl: './cx-budget.component.html',
  styleUrl: './cx-budget.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CxBudgetComponent {
  private readonly currentState = signal(0);
  private readonly maximumState = signal(1);
  private readonly favorState = signal<CxBudgetFavor>('low');

  @Input()
  public set current(value: number) {
    this.currentState.set(Number.isFinite(value) ? value : 0);
  }

  @Input()
  public set maximum(value: number) {
    this.maximumState.set(Number.isFinite(value) ? value : 1);
  }

  @Input()
  public set favor(value: CxBudgetFavor) {
    this.favorState.set(value === 'high' ? 'high' : 'low');
  }

  protected readonly percentage$ = computed(() => Math.round((this.currentState() / this.safeMaximum()) * 100));
  protected readonly fillWidth$ = computed(() => Math.min(this.percentage$(), 100));
  protected readonly overageWidth$ = computed(() => Math.min(Math.max(0, this.percentage$() - 100), 100));
  protected readonly isOverBudget$ = computed(() => this.currentState() > this.maximumState());
  protected readonly color$ = computed<CxBudgetColor>(() => this.colorFor(this.percentage$(), this.favorState()));

  private safeMaximum(): number {
    return this.maximumState() || 1;
  }

  private colorFor(percentage: number, favor: CxBudgetFavor): CxBudgetColor {
    if (favor === 'high') {
      if (percentage >= 80) return 'success';
      if (percentage >= 50) return 'yellow';
      if (percentage >= 20) return 'orange';
      return 'danger';
    }

    if (percentage > 100) return 'danger';
    if (percentage > 80) return 'orange';
    if (percentage > 50) return 'yellow';
    return 'success';
  }
}
