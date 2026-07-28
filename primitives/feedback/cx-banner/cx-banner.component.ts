import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  OnDestroy,
  Output,
  signal,
} from '@angular/core';
import { CxButtonComponent, type CxButtonMood } from '../../actions/cx-button';
import { type CxIconName } from '../../../icons/manifest';
import { CxIconComponent } from '../../media/cx-icon';
import { type CxFeedbackAction, visibleCxFeedbackAction } from '../cx-feedback-action';
import { prefersReducedMotion } from '../reduced-motion';

export type CxBannerMood = 'default' | 'warning' | 'success' | 'danger';
@Component({
  selector: 'cx-banner',
  imports: [CxButtonComponent, CxIconComponent],
  templateUrl: './cx-banner.component.html',
  styleUrl: './cx-banner.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CxBannerComponent implements OnDestroy {
  private readonly renderedState = signal(false);
  private readonly openState = signal(false);
  private readonly dismissibleState = signal(true);
  private requestedOpen = false;
  private openFrame: number | undefined;

  @Input() mood: CxBannerMood = 'default';
  @Input() heading = '';
  @Input() description = '';
  @Input() action: CxFeedbackAction | undefined;
  @Input() secondaryAction: CxFeedbackAction | undefined;
  @Input() dismissAriaLabel = 'Dismiss banner';

  @Input()
  public set dismissible(value: boolean) {
    const dismissible = Boolean(value);
    this.dismissibleState.set(dismissible);
    if (!dismissible) {
      this.cancelOpenFrame();
      if (this.requestedOpen && this.renderedState()) {
        this.openState.set(true);
      } else if (!this.requestedOpen) {
        this.renderedState.set(false);
      }
    }
  }

  @Input()
  public set visible(value: boolean) {
    this.setOpen(Boolean(value));
  }

  @Output() readonly actionSelect = new EventEmitter<CxFeedbackAction>();
  @Output() readonly secondaryActionSelect = new EventEmitter<CxFeedbackAction>();
  @Output() readonly visibleChange = new EventEmitter<boolean>();

  protected readonly isRendered$ = this.renderedState.asReadonly();
  protected readonly isOpen$ = this.openState.asReadonly();
  protected readonly isDismissible$ = this.dismissibleState.asReadonly();

  protected get resolvedIcon(): CxIconName {
    switch (this.mood) {
      case 'danger':
        return 'error';
      case 'warning':
        return 'warning';
      case 'success':
        return 'check';
      case 'default':
      default:
        return 'info';
    }
  }

  protected get resolvedRole(): string {
    if (this.mood === 'danger' || this.mood === 'warning') {
      return 'alert';
    }
    return 'status';
  }

  protected actionButtonMood(action: CxFeedbackAction): CxButtonMood {
    if (action.mood !== undefined) {
      return action.mood;
    }
    switch (this.mood) {
      case 'success':
        return 'success';
      case 'danger':
        return 'danger';
      case 'warning':
        return 'warning';
      case 'default':
      default:
        return 'info';
    }
  }

  protected get visibleAction(): CxFeedbackAction | undefined {
    return visibleCxFeedbackAction(this.action);
  }

  protected get visibleSecondaryAction(): CxFeedbackAction | undefined {
    return visibleCxFeedbackAction(this.secondaryAction);
  }

  protected hasActions(): boolean {
    return this.visibleAction !== undefined || this.visibleSecondaryAction !== undefined;
  }

  ngOnDestroy(): void {
    this.cancelOpenFrame();
    this.renderedState.set(false);
    this.openState.set(false);
  }

  protected onActionSelect(action: CxFeedbackAction): void {
    this.actionSelect.emit(action);
  }

  protected onSecondaryActionSelect(action: CxFeedbackAction): void {
    this.secondaryActionSelect.emit(action);
  }

  protected onDismissPress(): void {
    this.setOpen(false);
    this.visibleChange.emit(false);
  }

  protected onTransitionEnd(event: TransitionEvent): void {
    if (event.target !== event.currentTarget || event.propertyName !== 'transform' || this.requestedOpen) {
      return;
    }
    this.renderedState.set(false);
  }

  private setOpen(nextVisible: boolean): void {
    if (nextVisible === this.requestedOpen) {
      return;
    }

    const wasWaitingToOpen = this.openFrame !== undefined;
    this.requestedOpen = nextVisible;
    this.cancelOpenFrame();

    if (nextVisible) {
      this.renderedState.set(true);
      if (!this.dismissibleState() || prefersReducedMotion()) {
        this.openState.set(true);
        return;
      }

      this.openState.set(false);
      if (typeof window !== 'undefined') {
        this.openFrame = window.requestAnimationFrame(() => {
          this.openFrame = undefined;
          if (!this.requestedOpen) {
            return;
          }
          this.openState.set(true);
        });
      } else {
        this.openState.set(true);
      }
      return;
    }

    this.openState.set(false);
    if (wasWaitingToOpen || !this.renderedState() || !this.dismissibleState() || prefersReducedMotion()) {
      this.renderedState.set(false);
    }
  }

  private cancelOpenFrame(): void {
    if (this.openFrame === undefined || typeof window === 'undefined') {
      return;
    }

    window.cancelAnimationFrame(this.openFrame);
    this.openFrame = undefined;
  }
}
