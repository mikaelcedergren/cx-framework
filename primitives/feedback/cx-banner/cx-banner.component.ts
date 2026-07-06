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
export type CxBannerAction = CxFeedbackAction;

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

  @Input() mood: CxBannerMood = 'default';
  @Input() heading = '';
  @Input() description = '';
  @Input() action: CxBannerAction | undefined;
  @Input() secondaryAction: CxBannerAction | undefined;

  @Input()
  public set dismissible(value: boolean) {
    const dismissible = Boolean(value);
    this.dismissibleState.set(dismissible);
    if (!dismissible && this.renderedState()) {
      this.openState.set(true);
    }
  }

  @Input()
  public set visible(value: boolean) {
    this.setOpen(Boolean(value));
  }

  @Output() readonly actionSelect = new EventEmitter<CxBannerAction>();
  @Output() readonly secondaryActionSelect = new EventEmitter<CxBannerAction>();
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

  protected actionButtonMood(action: CxBannerAction): CxButtonMood {
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

  protected get visibleAction(): CxBannerAction | undefined {
    return visibleCxFeedbackAction(this.action);
  }

  protected get visibleSecondaryAction(): CxBannerAction | undefined {
    return visibleCxFeedbackAction(this.secondaryAction);
  }

  protected hasActions(): boolean {
    return this.visibleAction !== undefined || this.visibleSecondaryAction !== undefined;
  }

  ngOnDestroy(): void {
    this.renderedState.set(false);
    this.openState.set(false);
  }

  protected onActionSelect(action: CxBannerAction): void {
    this.actionSelect.emit(action);
  }

  protected onSecondaryActionSelect(action: CxBannerAction): void {
    this.secondaryActionSelect.emit(action);
  }

  protected onDismissPress(): void {
    this.setOpen(false);
    this.visibleChange.emit(false);
  }

  protected onTransitionEnd(event: TransitionEvent): void {
    if (event.target !== event.currentTarget || event.propertyName !== 'transform' || this.openState()) {
      return;
    }
    this.renderedState.set(false);
  }

  private setOpen(nextVisible: boolean): void {
    if (nextVisible) {
      this.renderedState.set(true);
      if (!this.dismissibleState() || prefersReducedMotion()) {
        this.openState.set(true);
        return;
      }

      this.openState.set(false);
      if (typeof window !== 'undefined') {
        window.requestAnimationFrame(() => {
          this.openState.set(true);
        });
      } else {
        this.openState.set(true);
      }
      return;
    }

    this.openState.set(false);
    if (!this.renderedState() || !this.dismissibleState() || prefersReducedMotion()) {
      this.renderedState.set(false);
    }
  }

}
