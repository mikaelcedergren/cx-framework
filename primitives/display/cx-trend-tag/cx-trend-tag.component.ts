import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { CxIconComponent } from '../../media/cx-icon';

export type CxTrendTagTrend = 'up' | 'flat' | 'down';
export type CxTrendTagFavor = 'up' | 'down';
export type CxTrendTagUnit = 'percent' | 'none';

@Component({
  selector: 'cx-trend-tag',
  imports: [CxIconComponent],
  templateUrl: './cx-trend-tag.component.html',
  styleUrl: './cx-trend-tag.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CxTrendTagComponent {
  private amountValue = 3;
  private favorValue: CxTrendTagFavor = 'up';
  private unitValue: CxTrendTagUnit = 'percent';
  private valueOverride: string | undefined;

  @Input()
  public set favor(value: CxTrendTagFavor | undefined) {
    this.favorValue = value === 'down' ? 'down' : 'up';
  }

  @Input()
  public set unit(value: CxTrendTagUnit | undefined) {
    this.unitValue = value === 'none' ? 'none' : 'percent';
  }

  @Input()
  public set amount(value: number) {
    this.amountValue = Number.isFinite(value) ? value : 0;
    this.valueOverride = undefined;
  }

  @Input()
  public set trend(value: CxTrendTagTrend) {
    if (value === 'flat') {
      this.amountValue = 0;
      return;
    }
    this.favor = value;
  }

  @Input()
  public set value(value: string | undefined) {
    this.valueOverride = value;
    const parsed = Number((value ?? '').replace(/[+,%\s]/g, ''));
    if (Number.isFinite(parsed)) {
      this.amountValue = parsed;
    }
    this.unit = value?.includes('%') ? 'percent' : 'none';
  }

  protected iconName() {
    const amount = this.roundedAmount();
    if (amount < 0) {
      return 'trend-down' as const;
    }
    if (amount === 0) {
      return 'arrow-right' as const;
    }
    return 'trend-up' as const;
  }

  protected trendClass(): CxTrendTagTrend {
    const favoredAmount = this.favorValue === 'up' ? this.roundedAmount() : -this.roundedAmount();
    if (favoredAmount > 0) return 'up';
    if (favoredAmount < 0) return 'down';
    return 'flat';
  }

  protected displayValue(): string {
    const override = this.valueOverride?.trim();
    if (override) {
      return override;
    }
    const value = this.formatAmount(this.roundedAmount());
    return this.unitValue === 'percent' ? `${value}%` : value;
  }

  private roundedAmount(): number {
    const rounded = Math.round(this.amountValue * 100) / 100;
    return Object.is(rounded, -0) ? 0 : rounded;
  }

  private formatAmount(amount: number): string {
    return amount
      .toFixed(2)
      .replace(/\.00$/, '')
      .replace(/(\.\d)0$/, '$1');
  }
}
