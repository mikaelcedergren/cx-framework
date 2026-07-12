import { ChangeDetectionStrategy, Component, EventEmitter, Input, OnDestroy, Output, signal } from '@angular/core';
import { type CxIconName } from '../../../icons/manifest';
import { CxButtonComponent, type CxButtonMood } from '../../actions/cx-button';
import { CxIconButtonComponent } from '../../actions/cx-icon-button';
import { CxIconComponent } from '../../media/cx-icon';
import { type CxFeedbackAction, visibleCxFeedbackAction } from '../cx-feedback-action';
import { prefersReducedMotion } from '../reduced-motion';

export type CxToastMood = 'default' | 'info' | 'success' | 'warning' | 'danger';

const TOAST_DURATION_MS = 5000;

@Component({
  selector: 'cx-toast',
  imports: [CxButtonComponent, CxIconComponent, CxIconButtonComponent],
  templateUrl: './cx-toast.component.html',
  styleUrl: './cx-toast.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CxToastComponent implements OnDestroy {
  private hideTimer: number | undefined;
  private openFrame: number | undefined;
  private timerFrame: number | undefined;
  private timerStartedAt: number | undefined;
  private remainingTime = TOAST_DURATION_MS;
  private requestedOpen = false;
  private dismissibleValue = false;
  private pointerInside = false;
  private focusInside = false;
  private readonly openState = signal(false);
  private readonly renderedState = signal(false);
  private readonly actionState = signal<CxFeedbackAction | undefined>(undefined);
  private readonly secondaryActionState = signal<CxFeedbackAction | undefined>(undefined);
  private readonly timerProgressState = signal(1);
  private readonly timerTransitionState = signal(0);

  @Input() heading = 'Notification';
  @Input() description: string | undefined;
  @Input() mood: CxToastMood = 'default';

  @Input()
  public set action(value: CxFeedbackAction | undefined) {
    const wasTimed = this.effectiveTimed;
    this.actionState.set(value);
    this.syncTimingPolicy(wasTimed);
  }

  public get action(): CxFeedbackAction | undefined {
    return this.actionState();
  }

  @Input()
  public set secondaryAction(value: CxFeedbackAction | undefined) {
    const wasTimed = this.effectiveTimed;
    this.secondaryActionState.set(value);
    this.syncTimingPolicy(wasTimed);
  }

  public get secondaryAction(): CxFeedbackAction | undefined {
    return this.secondaryActionState();
  }

  @Input()
  public set open(value: boolean) {
    this.setOpen(Boolean(value));
  }

  @Input()
  public set dismissible(value: boolean) {
    const wasTimed = this.effectiveTimed;
    const nextDismissible = Boolean(value);
    if (nextDismissible === this.dismissibleValue) {
      return;
    }
    this.dismissibleValue = nextDismissible;
    this.syncTimingPolicy(wasTimed);
  }

  public get dismissible(): boolean {
    return this.dismissibleValue;
  }

  @Output() readonly openChange = new EventEmitter<boolean>();
  @Output('action') readonly actionEmitter = new EventEmitter<CxFeedbackAction>();
  @Output('secondaryAction') readonly secondaryActionEmitter = new EventEmitter<CxFeedbackAction>();
  @Output() readonly dismissed = new EventEmitter<void>();

  protected readonly isRendered$ = this.renderedState.asReadonly();
  protected readonly isOpen$ = this.openState.asReadonly();
  protected readonly timerProgress$ = this.timerProgressState.asReadonly();
  protected readonly timerTransition$ = this.timerTransitionState.asReadonly();

  protected get isMultiline(): boolean {
    return !!this.description?.trim();
  }

  protected get effectiveDismissible(): boolean {
    return this.dismissible || this.hasActions;
  }

  protected get effectiveTimed(): boolean {
    return !this.effectiveDismissible;
  }

  protected get hasHeading(): boolean {
    return this.heading.trim().length > 0;
  }

  protected get hasContent(): boolean {
    return this.hasHeading || this.isMultiline;
  }

  protected get visibleAction(): CxFeedbackAction | undefined {
    return visibleCxFeedbackAction(this.actionState());
  }

  protected get visibleSecondaryAction(): CxFeedbackAction | undefined {
    return visibleCxFeedbackAction(this.secondaryActionState());
  }

  protected get hasActions(): boolean {
    return this.visibleAction !== undefined || this.visibleSecondaryAction !== undefined;
  }

  protected get hasControls(): boolean {
    return this.hasActions || this.effectiveDismissible;
  }

  protected get moodIcon(): CxIconName | undefined {
    switch (this.mood) {
      case 'success':
        return 'check';
      case 'warning':
        return 'warning';
      case 'info':
        return 'info';
      case 'danger':
        return 'exclamation';
      default:
        return undefined;
    }
  }

  protected get actionButtonMood(): CxButtonMood {
    switch (this.mood) {
      case 'info':
      case 'success':
      case 'warning':
      case 'danger':
        return this.mood;
      case 'default':
      default:
        return 'primary';
    }
  }

  ngOnDestroy(): void {
    this.cancelOpenFrame();
    this.cancelTiming(false);
  }

  protected dismiss(): void {
    if (!this.requestedOpen) {
      return;
    }
    this.dismissed.emit();
    this.requestClose();
  }

  protected onActionPressed(action: CxFeedbackAction): void {
    this.actionEmitter.emit(action);
  }

  protected onSecondaryActionPressed(action: CxFeedbackAction): void {
    this.secondaryActionEmitter.emit(action);
  }

  protected onPointerEnter(): void {
    this.pointerInside = true;
    this.pauseTiming();
  }

  protected onPointerLeave(): void {
    this.pointerInside = false;
    this.resumeTiming();
  }

  protected onFocusIn(): void {
    this.focusInside = true;
    this.pauseTiming();
  }

  protected onFocusOut(event: FocusEvent): void {
    const surface = event.currentTarget;
    const nextTarget = event.relatedTarget;
    if (surface instanceof HTMLElement && nextTarget instanceof Node && surface.contains(nextTarget)) {
      return;
    }
    this.focusInside = false;
    this.resumeTiming();
  }

  protected onTransitionEnd(event: TransitionEvent): void {
    if (
      event.target !== event.currentTarget ||
      event.propertyName !== 'transform' ||
      this.requestedOpen ||
      this.openState()
    ) {
      return;
    }
    this.renderedState.set(false);
  }

  private setOpen(nextOpen: boolean): void {
    if (nextOpen === this.requestedOpen) {
      return;
    }

    this.cancelOpenFrame();

    if (nextOpen) {
      this.requestedOpen = true;
      this.pointerInside = false;
      this.focusInside = false;
      this.cancelTiming(true);
      this.renderedState.set(true);
      this.openState.set(false);
      if (typeof window !== 'undefined' && !prefersReducedMotion()) {
        this.openFrame = window.requestAnimationFrame(() => {
          this.openFrame = undefined;
          if (!this.requestedOpen) {
            return;
          }
          this.openState.set(true);
          this.resetTimedCycle();
        });
        return;
      }
      this.openState.set(true);
      this.resetTimedCycle();
      return;
    }

    this.pauseTiming();
    this.requestedOpen = false;
    this.pointerInside = false;
    this.focusInside = false;
    this.openState.set(false);
    if (!this.renderedState() || prefersReducedMotion()) {
      this.renderedState.set(false);
    }
  }

  private requestClose(): void {
    if (!this.requestedOpen) {
      return;
    }
    this.setOpen(false);
    this.openChange.emit(false);
  }

  private syncTimingPolicy(wasTimed: boolean): void {
    if (wasTimed === this.effectiveTimed) {
      return;
    }

    if (!this.effectiveTimed) {
      this.cancelTiming(true);
      return;
    }

    this.resetTimedCycle();
  }

  private resetTimedCycle(): void {
    this.cancelTiming(true);
    this.resumeTiming();
  }

  private pauseTiming(): void {
    if (!this.effectiveTimed) {
      return;
    }

    this.cancelTimerFrame();
    if (this.timerStartedAt !== undefined) {
      const elapsed = Math.max(0, Date.now() - this.timerStartedAt);
      this.remainingTime = Math.max(0, this.remainingTime - elapsed);
      this.timerStartedAt = undefined;
    }
    this.clearHideTimer();
    this.timerTransitionState.set(0);
    this.timerProgressState.set(this.remainingTime / TOAST_DURATION_MS);
  }

  private resumeTiming(): void {
    if (!this.shouldRunTimer() || this.hideTimer !== undefined || this.timerFrame !== undefined) {
      return;
    }

    if (this.remainingTime <= 0) {
      this.requestClose();
      return;
    }

    this.timerTransitionState.set(0);
    this.timerProgressState.set(this.remainingTime / TOAST_DURATION_MS);
    this.timerFrame = window.requestAnimationFrame(() => {
      this.timerFrame = undefined;
      if (!this.shouldRunTimer()) {
        return;
      }

      const duration = this.remainingTime;
      this.timerStartedAt = Date.now();
      this.timerTransitionState.set(duration);
      this.timerProgressState.set(0);
      this.hideTimer = window.setTimeout(() => {
        this.hideTimer = undefined;
        this.timerStartedAt = undefined;
        this.remainingTime = 0;
        this.timerTransitionState.set(0);
        this.timerProgressState.set(0);
        this.requestClose();
      }, duration);
    });
  }

  private shouldRunTimer(): boolean {
    return (
      typeof window !== 'undefined' &&
      this.requestedOpen &&
      this.openState() &&
      this.effectiveTimed &&
      !this.pointerInside &&
      !this.focusInside
    );
  }

  private cancelOpenFrame(): void {
    if (this.openFrame === undefined || typeof window === 'undefined') {
      return;
    }
    window.cancelAnimationFrame(this.openFrame);
    this.openFrame = undefined;
  }

  private cancelTimerFrame(): void {
    if (this.timerFrame === undefined || typeof window === 'undefined') {
      return;
    }
    window.cancelAnimationFrame(this.timerFrame);
    this.timerFrame = undefined;
  }

  private clearHideTimer(): void {
    if (this.hideTimer === undefined) {
      return;
    }
    window.clearTimeout(this.hideTimer);
    this.hideTimer = undefined;
  }

  private cancelTiming(resetProgress: boolean): void {
    this.cancelTimerFrame();
    this.clearHideTimer();
    this.timerStartedAt = undefined;
    this.timerTransitionState.set(0);
    if (resetProgress) {
      this.remainingTime = TOAST_DURATION_MS;
      this.timerProgressState.set(1);
    }
  }
}
