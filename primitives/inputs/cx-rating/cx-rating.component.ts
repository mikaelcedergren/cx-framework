import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output, computed, signal } from '@angular/core';
import { type CxIconName } from '../../../icons/manifest';
import { CxIconComponent } from '../../media/cx-icon';

export type CxRatingSize = 'small' | 'default' | 'large';

/**
 * A star (or custom-icon) rating. Interactive by default for capturing a score;
 * `readonly` turns it into a display that supports fractional values such as 3.5.
 */
@Component({
  selector: 'cx-rating',
  imports: [CxIconComponent],
  templateUrl: './cx-rating.component.html',
  styleUrl: './cx-rating.component.scss',
  host: {
    '[class.cx-rating--small]': "size === 'small'",
    '[class.cx-rating--large]': "size === 'large'",
    '[class.cx-rating--readonly]': 'readonly',
    '[class.cx-rating--disabled]': 'disabled',
  },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CxRatingComponent {
  private readonly valueState = signal(0);
  private readonly maxState = signal(5);
  private readonly hoverState = signal<number | null>(null);

  @Input() icon: CxIconName = 'star-on';
  @Input() size: CxRatingSize = 'default';
  @Input() readonly = false;
  @Input() disabled = false;
  @Input() ariaLabel = 'Rating';

  @Input()
  public set value(value: number | null | undefined) {
    this.valueState.set(this.clamp(value ?? 0));
  }

  @Input()
  public set max(value: number | null | undefined) {
    const next = Math.max(1, Math.round(value ?? 5));
    this.maxState.set(next);
    this.valueState.set(this.clamp(this.valueState()));
  }

  @Output() readonly valueChange = new EventEmitter<number>();

  protected readonly max$ = this.maxState.asReadonly();
  protected readonly stars$ = computed(() => Array.from({ length: this.maxState() }, (_, index) => index + 1));
  protected readonly displayValue$ = computed(() => this.hoverState() ?? this.valueState());

  protected get iconSize(): number {
    return this.size === 'small' ? 16 : this.size === 'large' ? 24 : 20;
  }

  protected get interactive(): boolean {
    return !this.readonly && !this.disabled;
  }

  protected get valueText(): string {
    return `${this.valueState()} of ${this.maxState()}`;
  }

  protected fillPercent(index: number): number {
    const fraction = this.displayValue$() - (index - 1);
    return Math.max(0, Math.min(1, fraction)) * 100;
  }

  protected onStarEnter(index: number): void {
    if (this.interactive) {
      this.hoverState.set(index);
    }
  }

  protected onLeave(): void {
    this.hoverState.set(null);
  }

  protected onStarClick(index: number): void {
    if (!this.interactive) {
      return;
    }
    // Clicking the current single-star value clears it back to zero.
    const next = this.valueState() === index ? index - 1 : index;
    this.commit(next);
  }

  protected onKeydown(event: KeyboardEvent): void {
    if (!this.interactive) {
      return;
    }
    const current = this.valueState();
    let next: number | undefined;
    switch (event.key) {
      case 'ArrowRight':
      case 'ArrowUp':
        next = current + 1;
        break;
      case 'ArrowLeft':
      case 'ArrowDown':
        next = current - 1;
        break;
      case 'Home':
        next = 0;
        break;
      case 'End':
        next = this.maxState();
        break;
      default:
        return;
    }
    event.preventDefault();
    this.commit(next);
  }

  private commit(next: number): void {
    const clamped = this.clamp(next);
    this.hoverState.set(null);
    if (clamped !== this.valueState()) {
      this.valueState.set(clamped);
      this.valueChange.emit(clamped);
    }
  }

  private clamp(value: number): number {
    if (Number.isNaN(value)) {
      return 0;
    }
    return Math.max(0, Math.min(this.maxState(), value));
  }
}
