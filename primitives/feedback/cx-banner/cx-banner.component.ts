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
import { type CxFeedbackAction } from '../cx-feedback-action';

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

  @Input() mood: CxBannerMood = 'default';
  @Input() heading = '';
  @Input() description = '';
  @Input() action: CxBannerAction | undefined;
  @Input() secondaryAction: CxBannerAction | undefined;
  @Input() dismissible = true;

  @Input()
  public set visible(value: boolean) {
    this.setOpen(Boolean(value));
  }

  @Output() readonly actionSelect = new EventEmitter<CxBannerAction>();
  @Output() readonly secondaryActionSelect = new EventEmitter<CxBannerAction>();
  @Output() readonly visibleChange = new EventEmitter<boolean>();

  protected readonly isRendered$ = this.renderedState.asReadonly();
  protected readonly isOpen$ = this.openState.asReadonly();

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
    return this.visibleActionFor(this.action);
  }

  protected get visibleSecondaryAction(): CxBannerAction | undefined {
    return this.visibleActionFor(this.secondaryAction);
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
    if (!this.renderedState() || this.prefersReducedMotion()) {
      this.renderedState.set(false);
    }
  }

  private prefersReducedMotion(): boolean {
    return typeof window !== 'undefined'
      && 'matchMedia' in window
      && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  private visibleActionFor(action: CxBannerAction | undefined): CxBannerAction | undefined {
    return action?.text.trim() ? action : undefined;
  }
}
