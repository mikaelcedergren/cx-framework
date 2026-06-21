import { ChangeDetectionStrategy, Component, Input, computed, signal } from '@angular/core';

export type CxBudgetFavor = 'low' | 'high';
export type CxBudgetFormat = 'percent' | 'currency' | 'unit';
export type CxBudgetCurrency = 'SEK' | 'USD' | 'EUR' | 'GBP';
export type CxBudgetVariant = 'compact' | 'detailed';
type CxBudgetColor = 'success' | 'yellow' | 'orange' | 'danger';

const CURRENCY_META: Record<CxBudgetCurrency, { symbol: string; placement: 'before' | 'after' }> = {
  EUR: { symbol: '€', placement: 'before' },
  GBP: { symbol: '£', placement: 'before' },
  SEK: { symbol: 'kr', placement: 'after' },
  USD: { symbol: '$', placement: 'before' },
};

@Component({
  selector: 'cx-budget',
  templateUrl: './cx-budget.component.html',
  styleUrl: './cx-budget.component.scss',
  host: {
    '[class.cx-budget-host--compact]': 'variant$() === "compact"',
    '[class.cx-budget-host--detailed]': 'variant$() === "detailed"',
  },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CxBudgetComponent {
  private readonly currentState = signal(0);
  private readonly maximumState = signal(1);
  private readonly favorState = signal<CxBudgetFavor>('low');
  private readonly formatState = signal<CxBudgetFormat>('percent');
  private readonly currencyState = signal<CxBudgetCurrency>('EUR');
  private readonly variantState = signal<CxBudgetVariant>('compact');
  private readonly unitState = signal('');
  private readonly currentLabelState = signal('');
  private readonly maximumLabelState = signal('');
  private readonly hintState = signal('');
  private readonly ariaLabelState = signal('Budget');

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

  @Input()
  public set format(value: CxBudgetFormat | undefined) {
    if (value === 'currency' || value === 'unit') {
      this.formatState.set(value);
      return;
    }
    this.formatState.set('percent');
  }

  @Input()
  public set currency(value: CxBudgetCurrency | undefined) {
    this.currencyState.set(this.isCurrency(value) ? value : 'EUR');
  }

  @Input()
  public set variant(value: CxBudgetVariant | undefined) {
    this.variantState.set(value === 'detailed' ? 'detailed' : 'compact');
  }

  @Input()
  public set unit(value: string | null | undefined) {
    this.unitState.set(value?.trim() ?? '');
  }

  @Input()
  public set currentLabel(value: string | null | undefined) {
    this.currentLabelState.set(value?.trim() ?? '');
  }

  @Input()
  public set maximumLabel(value: string | null | undefined) {
    this.maximumLabelState.set(value?.trim() ?? '');
  }

  @Input()
  public set hint(value: string | null | undefined) {
    this.hintState.set(value?.trim() ?? '');
  }

  @Input()
  public set ariaLabel(value: string | null | undefined) {
    this.ariaLabelState.set(value?.trim() || 'Budget');
  }

  protected readonly format$ = this.formatState.asReadonly();
  protected readonly variant$ = this.variantState.asReadonly();
  protected readonly hint$ = this.hintState.asReadonly();
  protected readonly isDetailed$ = computed(() => this.variantState() === 'detailed');
  protected readonly hasValidMaximum$ = computed(() => this.maximumState() > 0);
  protected readonly percentage$ = computed(() => {
    if (!this.hasValidMaximum$()) {
      return 0;
    }
    return Math.round(Math.max(0, (this.currentState() / this.maximumState()) * 100));
  });
  protected readonly fillWidth$ = computed(() => Math.min(Math.max(0, this.percentage$()), 100));
  protected readonly overageWidth$ = computed(() => Math.min(Math.max(0, this.percentage$() - 100), 100));
  protected readonly isOverBudget$ = computed(() => this.currentState() > this.maximumState() && this.maximumState() > 0);
  protected readonly color$ = computed<CxBudgetColor>(() => this.colorFor(this.percentage$(), this.favorState()));
  protected readonly resolvedAriaLabel$ = this.ariaLabelState.asReadonly();
  protected readonly ariaValueMax$ = computed(() => this.hasValidMaximum$() ? this.maximumState() : null);
  protected readonly ariaValueNow$ = computed(() => {
    if (!this.hasValidMaximum$()) {
      return null;
    }
    return Math.min(Math.max(this.currentState(), 0), this.maximumState());
  });
  protected readonly ariaValueText$ = computed(() => {
    if (!this.hasValidMaximum$()) {
      return 'Set maximum above 0.';
    }

    const parts = [
      `${this.currentText$()} of ${this.maximumText$()}`,
      `${this.percentage$()}% used`,
    ];

    if (this.isOverBudget$()) {
      parts.push(`Over maximum by ${this.formattedOverageValue()}`);
    }

    const hint = this.hintState();
    if (hint) {
      parts.push(hint);
    }

    return `${parts.join('. ')}.`;
  });
  protected readonly currentText$ = computed(() => this.withLabel(
    this.formattedCurrentValue(),
    this.currentLabelState(),
  ));
  protected readonly maximumText$ = computed(() => this.withLabel(
    this.formattedMaximumValue(),
    this.maximumLabelState(),
  ));

  private isCurrency(value: string | undefined): value is CxBudgetCurrency {
    return value === 'SEK' || value === 'USD' || value === 'EUR' || value === 'GBP';
  }

  private formattedCurrentValue(): string {
    if (this.formatState() === 'percent') {
      return `${this.percentage$()}%`;
    }

    return this.formatFormattedNumber(this.currentState());
  }

  private formattedMaximumValue(): string {
    if (this.formatState() === 'percent') {
      return '100%';
    }

    return this.formatFormattedNumber(this.maximumState());
  }

  private formattedOverageValue(): string {
    const overage = Math.max(0, this.currentState() - this.maximumState());
    if (this.formatState() === 'percent') {
      return `${Math.max(0, this.percentage$() - 100)}%`;
    }

    return this.formatFormattedNumber(overage);
  }

  private formatFormattedNumber(value: number): string {
    if (this.formatState() === 'currency') {
      return this.formatCurrency(value, this.currencyState());
    }

    return this.formatUnit(value);
  }

  private formatCurrency(value: number, currency: CxBudgetCurrency): string {
    const meta = CURRENCY_META[currency];
    const sign = value < 0 ? '-' : '';
    const number = this.formatNumber(Math.abs(value));

    return meta.placement === 'before' ? `${sign}${meta.symbol}${number}` : `${sign}${number} ${meta.symbol}`;
  }

  private formatUnit(value: number): string {
    const unit = this.unitState();
    const number = this.formatNumber(value);
    return unit ? `${number} ${unit}` : number;
  }

  private formatNumber(value: number): string {
    return new Intl.NumberFormat('en-US', {
      maximumFractionDigits: Number.isInteger(value) ? 0 : 1,
    }).format(value).replace(/,/g, ' ');
  }

  private withLabel(value: string, label: string): string {
    return label ? `${value} ${label}` : value;
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
