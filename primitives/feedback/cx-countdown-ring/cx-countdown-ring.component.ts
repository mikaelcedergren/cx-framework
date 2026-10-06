import { ChangeDetectionStrategy, Component, Input, computed, signal } from '@angular/core';

export type CxCountdownRingDirection = 'clockwise' | 'counterclockwise';
export type CxCountdownRingSize = 'small' | 'default' | 'large' | 'xlarge' | 'auto';
export type CxCountdownRingMood = 'default' | 'primary' | 'accent' | 'info' | 'success' | 'warning' | 'danger';

interface CxCountdownRingSegment {
  index: number;
  dash: string;
  offset: string;
  filled: boolean;
}

/** Empty space between countdown segments, in pathLength units (the ring is pathLength="100"). */
const SEGMENT_GAP = 6;

@Component({
  selector: 'cx-countdown-ring',
  host: {
    '[attr.role]': "'img'",
    '[attr.aria-label]': 'resolvedAriaLabel$()',
    '[class.cx-countdown-ring-host--small]': 'size$() === "small"',
    '[class.cx-countdown-ring-host--default]': 'size$() === "default"',
    '[class.cx-countdown-ring-host--large]': 'size$() === "large"',
    '[class.cx-countdown-ring-host--xlarge]': 'size$() === "xlarge"',
    '[class.cx-countdown-ring-host--auto]': 'size$() === "auto"',
    '[class.cx-countdown-ring-host--mood-primary]': 'mood === "primary"',
    '[class.cx-countdown-ring-host--mood-accent]': 'mood === "accent"',
    '[class.cx-countdown-ring-host--mood-info]': 'mood === "info"',
    '[class.cx-countdown-ring-host--mood-success]': 'mood === "success"',
    '[class.cx-countdown-ring-host--mood-warning]': 'mood === "warning"',
    '[class.cx-countdown-ring-host--mood-danger]': 'mood === "danger"',
  },
  templateUrl: './cx-countdown-ring.component.html',
  styleUrl: './cx-countdown-ring.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CxCountdownRingComponent {
  protected readonly size$ = signal<CxCountdownRingSize>('default');
  private readonly segmentsState = signal(6);
  private readonly remainingState = signal(0);
  private readonly directionState = signal<CxCountdownRingDirection>('clockwise');

  @Input() mood: CxCountdownRingMood = 'default';

  /** Optional accessible label. Otherwise exposes the number of pieces remaining. */
  @Input() ariaLabel: string | undefined;

  /** Direction in which pieces empty, starting at the top of the ring. */
  @Input()
  public set direction(value: CxCountdownRingDirection) {
    if (value !== 'clockwise' && value !== 'counterclockwise') {
      throw new Error('cx-countdown-ring: direction must be clockwise or counterclockwise.');
    }
    this.directionState.set(value);
  }
  public get direction(): CxCountdownRingDirection {
    return this.directionState();
  }

  /** Total pieces in the ring. Use a positive whole number. */
  @Input()
  public set segments(value: number) {
    if (!Number.isSafeInteger(value) || value < 1) {
      throw new Error('cx-countdown-ring: segments must be a positive whole number.');
    }
    this.segmentsState.set(value);
  }
  public get segments(): number {
    return this.segmentsState();
  }

  /** Pieces remaining. The consumer owns timing and supplies a whole number from 0 to segments. */
  @Input()
  public set remaining(value: number) {
    if (!Number.isSafeInteger(value) || value < 0) {
      throw new Error('cx-countdown-ring: remaining must be a non-negative whole number.');
    }
    this.remainingState.set(value);
  }
  public get remaining(): number {
    return this.remainingState();
  }

  @Input()
  public set size(value: CxCountdownRingSize | undefined) {
    switch (value) {
      case 'small':
        this.size$.set('small');
        return;
      case 'large':
        this.size$.set('large');
        return;
      case 'xlarge':
        this.size$.set('xlarge');
        return;
      case 'auto':
        this.size$.set('auto');
        return;
      case 'default':
      default:
        this.size$.set('default');
        return;
    }
  }

  public get size(): CxCountdownRingSize {
    return this.size$();
  }

  protected readonly segmentArcs$ = computed<CxCountdownRingSegment[]>(() => {
    const count = this.segmentsState();
    const remaining = this.remainingState();
    if (remaining > count) {
      throw new Error('cx-countdown-ring: remaining cannot exceed segments.');
    }
    const spent = count - remaining;
    const clockwise = this.directionState() === 'clockwise';
    const slot = 100 / count;
    const arc = slot - Math.min(SEGMENT_GAP, slot * 0.36);
    const segments: CxCountdownRingSegment[] = [];
    for (let i = 0; i < count; i += 1) {
      segments.push({
        index: i,
        dash: `${arc} ${100 - arc}`,
        offset: `${-(i * slot)}`,
        filled: clockwise ? i >= spent : i < remaining,
      });
    }
    return segments;
  });

  protected resolvedAriaLabel$(): string {
    return this.ariaLabel?.trim() || `${this.remainingState()} of ${this.segmentsState()} remaining`;
  }
}
