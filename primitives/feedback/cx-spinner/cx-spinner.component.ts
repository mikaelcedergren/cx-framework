import { ChangeDetectionStrategy, Component, Input, computed, signal } from '@angular/core';

export type CxSpinnerSize = 'small' | 'default' | 'large' | 'xlarge' | 'auto';
type CxSpinnerInputSize = CxSpinnerSize | '16' | '24' | '32' | '64';
export type CxSpinnerMood = 'default' | 'primary' | 'accent' | 'info' | 'success' | 'warning' | 'danger';

interface CxSpinnerSegment {
  index: number;
  dash: string;
  offset: string;
  filled: boolean;
}

/** Empty space between countdown segments, in pathLength units (the ring is pathLength="100"). */
const SEGMENT_GAP = 6;

@Component({
  selector: 'cx-spinner',
  host: {
    '[attr.role]': "mode$() === 'countdown' ? 'img' : 'status'",
    '[attr.aria-busy]': "mode$() === 'countdown' ? null : 'true'",
    '[attr.aria-label]': 'resolvedAriaLabel$()',
    '[class.cx-spinner-host--small]': 'size$() === "small"',
    '[class.cx-spinner-host--default]': 'size$() === "default"',
    '[class.cx-spinner-host--large]': 'size$() === "large"',
    '[class.cx-spinner-host--xlarge]': 'size$() === "xlarge"',
    '[class.cx-spinner-host--auto]': 'size$() === "auto"',
    '[class.cx-spinner-host--mood-primary]': 'mood === "primary"',
    '[class.cx-spinner-host--mood-accent]': 'mood === "accent"',
    '[class.cx-spinner-host--mood-info]': 'mood === "info"',
    '[class.cx-spinner-host--mood-success]': 'mood === "success"',
    '[class.cx-spinner-host--mood-warning]': 'mood === "warning"',
    '[class.cx-spinner-host--mood-danger]': 'mood === "danger"',
  },
  templateUrl: './cx-spinner.component.html',
  styleUrl: './cx-spinner.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CxSpinnerComponent {
  protected readonly size$ = signal<CxSpinnerSize>('default');
  private readonly segmentsState = signal<number | null>(null);
  private readonly valueState = signal(0);

  @Input() mood: CxSpinnerMood = 'default';

  /** Accessible label. Defaults to "Loading" for the indeterminate spinner. */
  @Input() ariaLabel: string | undefined;

  /**
   * When set to a positive integer, the spinner becomes a determinate ring
   * divided into this many segments — used for countdown timers. Leave unset
   * (null) for the default indeterminate loading spinner.
   */
  @Input()
  public set segments(value: number | null | undefined) {
    this.segmentsState.set(
      value != null && Number.isFinite(value) && value >= 1 ? Math.floor(value) : null,
    );
  }
  public get segments(): number | null {
    return this.segmentsState();
  }

  /** Number of filled (remaining) segments in countdown mode, clamped to 0..segments. */
  @Input()
  public set value(value: number | undefined) {
    this.valueState.set(Number.isFinite(value) ? Math.max(0, Math.floor(value as number)) : 0);
  }
  public get value(): number {
    return this.valueState();
  }

  @Input()
  public set size(value: CxSpinnerInputSize | undefined) {
    switch (value) {
      case 'small':
      case '16':
        this.size$.set('small');
        return;
      case 'large':
      case '32':
        this.size$.set('large');
        return;
      case 'xlarge':
      case '64':
        this.size$.set('xlarge');
        return;
      case 'auto':
        this.size$.set('auto');
        return;
      case 'default':
      case '24':
      default:
        this.size$.set('default');
        return;
    }
  }

  public get size(): CxSpinnerSize {
    return this.size$();
  }

  protected readonly mode$ = computed<'spin' | 'countdown'>(() =>
    this.segmentsState() != null ? 'countdown' : 'spin',
  );

  protected readonly segmentArcs$ = computed<CxSpinnerSegment[]>(() => {
    const count = this.segmentsState();
    if (count == null) {
      return [];
    }
    const remaining = Math.min(this.valueState(), count);
    const spent = count - remaining;
    const slot = 100 / count;
    const arc = Math.max(slot - SEGMENT_GAP, 0.001);
    const segments: CxSpinnerSegment[] = [];
    for (let i = 0; i < count; i += 1) {
      segments.push({
        index: i,
        dash: `${arc} ${100 - arc}`,
        offset: `${-(i * slot)}`,
        filled: i >= spent,
      });
    }
    return segments;
  });

  protected readonly resolvedAriaLabel$ = computed<string>(() => {
    const label = this.ariaLabel?.trim();
    if (this.mode$() === 'countdown') {
      if (label) {
        return label;
      }
      const count = this.segmentsState() ?? 0;
      return `${Math.min(this.valueState(), count)} of ${count} remaining`;
    }
    return label || 'Loading';
  });
}
