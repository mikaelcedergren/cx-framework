import { ChangeDetectionStrategy, Component, EventEmitter, Input, OnDestroy, Output, signal } from '@angular/core';
import { type CxIconName } from '../../../icons/manifest';
import { CxButtonComponent, type CxButtonMood } from '../../actions/cx-button';
import { CxIconButtonComponent } from '../../actions/cx-icon-button';
import { CxIconComponent } from '../../media/cx-icon';
import { type CxFeedbackAction, visibleCxFeedbackAction } from '../cx-feedback-action';
import { prefersReducedMotion } from '../reduced-motion';

export type CxToastMood = 'default' | 'info' | 'success' | 'warning' | 'danger';

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
  private dismissibleValue = false;
  private readonly openState = signal(false);
  private readonly renderedState = signal(false);

  @Input() heading = 'Notification';
  @Input() description: string | undefined;
  @Input() mood: CxToastMood = 'default';
  @Input() action: CxFeedbackAction | undefined;
  @Input() secondaryAction: CxFeedbackAction | undefined;

  @Input()
  public set open(value: boolean) {
    this.setOpen(value);
  }

  @Input()
  public set dismissible(value: boolean) {
    this.dismissibleValue = Boolean(value);
    this.syncHideTimer();
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

  protected get isMultiline(): boolean {
    return !!this.description?.trim();
  }

  protected get effectiveDismissible(): boolean {
    return this.dismissible;
  }

  protected get effectiveTimed(): boolean {
    return !this.dismissible;
  }

  protected get hasHeading(): boolean {
    return this.heading.trim().length > 0;
  }

  protected get hasContent(): boolean {
    return this.hasHeading || this.isMultiline;
  }

  protected get visibleAction(): CxFeedbackAction | undefined {
    return visibleCxFeedbackAction(this.action);
  }

  protected get visibleSecondaryAction(): CxFeedbackAction | undefined {
    return visibleCxFeedbackAction(this.secondaryAction);
  }

  protected get hasControls(): boolean {
    return this.visibleAction !== undefined || this.visibleSecondaryAction !== undefined || this.effectiveDismissible;
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
    this.clearHideTimer();
  }

  protected dismiss(): void {
    this.dismissed.emit();
    this.requestClose();
  }

  protected onActionPressed(action: CxFeedbackAction): void {
    this.actionEmitter.emit(action);
  }

  protected onSecondaryActionPressed(action: CxFeedbackAction): void {
    this.secondaryActionEmitter.emit(action);
  }

  protected onTransitionEnd(event: TransitionEvent): void {
    if (event.target !== event.currentTarget || event.propertyName !== 'transform' || this.openState()) {
      return;
    }
    this.renderedState.set(false);
  }

  private setOpen(nextOpen: boolean): void {
    this.cancelOpenFrame();
    this.clearHideTimer();

    if (nextOpen) {
      this.renderedState.set(true);
      this.openState.set(false);
      if (typeof window !== 'undefined') {
        this.openFrame = window.requestAnimationFrame(() => {
          this.openFrame = undefined;
          this.openState.set(true);
          this.syncHideTimer();
        });
        return;
      } else {
        this.openState.set(true);
      }
    } else {
      this.openState.set(false);
      if (!this.renderedState() || prefersReducedMotion()) {
        this.renderedState.set(false);
      }
    }

    this.syncHideTimer();
  }

  private requestClose(): void {
    if (!this.renderedState() && !this.openState()) {
      return;
    }
    this.setOpen(false);
    this.openChange.emit(false);
  }

  private syncHideTimer(): void {
    this.clearHideTimer();
    if (!this.openState() || !this.effectiveTimed || typeof window === 'undefined') {
      return;
    }

    this.hideTimer = window.setTimeout(() => {
      this.requestClose();
    }, 5000);
  }

  private cancelOpenFrame(): void {
    if (this.openFrame === undefined || typeof window === 'undefined') {
      return;
    }
    window.cancelAnimationFrame(this.openFrame);
    this.openFrame = undefined;
  }

  private clearHideTimer(): void {
    if (this.hideTimer === undefined) {
      return;
    }
    window.clearTimeout(this.hideTimer);
    this.hideTimer = undefined;
  }

}
