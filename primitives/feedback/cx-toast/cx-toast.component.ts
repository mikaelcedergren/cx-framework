import { ChangeDetectionStrategy, Component, EventEmitter, Input, OnDestroy, Output, signal } from '@angular/core';
import { type CxIconName } from '../../../icons/manifest';
import { CxButtonComponent, type CxButtonMood, type CxButtonVariant } from '../../actions/cx-button';
import { CxIconButtonComponent } from '../../actions/cx-icon-button';
import { CxIconComponent } from '../../media/cx-icon';

export type CxToastMood = 'default' | 'info' | 'success' | 'warning' | 'danger';

export interface CxToastAction {
  readonly text: string;
  readonly variant?: CxButtonVariant;
  readonly mood?: CxButtonMood;
  readonly icon?: CxIconName;
  readonly appendIcon?: CxIconName;
  readonly disabled?: boolean;
  readonly loading?: boolean;
  readonly ariaLabel?: string;
}

@Component({
  selector: 'cx-toast',
  imports: [CxButtonComponent, CxIconComponent, CxIconButtonComponent],
  templateUrl: './cx-toast.component.html',
  styleUrl: './cx-toast.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CxToastComponent implements OnDestroy {
  private hideTimer: number | undefined;
  private dismissibleValue = false;
  private readonly openState = signal(false);
  private readonly renderedState = signal(false);

  @Input() heading = 'Notification';
  @Input() description: string | undefined;
  @Input() mood: CxToastMood = 'default';
  @Input() action: CxToastAction | undefined;
  @Input() secondaryAction: CxToastAction | undefined;

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
  @Output('action') readonly actionEmitter = new EventEmitter<CxToastAction>();
  @Output('secondaryAction') readonly secondaryActionEmitter = new EventEmitter<CxToastAction>();
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

  protected get visibleAction(): CxToastAction | undefined {
    return this.visibleActionFor(this.action);
  }

  protected get visibleSecondaryAction(): CxToastAction | undefined {
    return this.visibleActionFor(this.secondaryAction);
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
    this.clearHideTimer();
  }

  protected dismiss(): void {
    this.dismissed.emit();
    this.requestClose();
  }

  protected onActionPressed(action: CxToastAction): void {
    this.actionEmitter.emit(action);
  }

  protected onSecondaryActionPressed(action: CxToastAction): void {
    this.secondaryActionEmitter.emit(action);
  }

  protected onTransitionEnd(event: TransitionEvent): void {
    if (event.target !== event.currentTarget || event.propertyName !== 'transform' || this.openState()) {
      return;
    }
    this.renderedState.set(false);
  }

  private setOpen(nextOpen: boolean): void {
    this.clearHideTimer();

    if (nextOpen) {
      this.renderedState.set(true);
      this.openState.set(false);
      if (typeof window !== 'undefined') {
        window.requestAnimationFrame(() => {
          this.openState.set(true);
        });
      } else {
        this.openState.set(true);
      }
    } else {
      this.openState.set(false);
      if (!this.renderedState() || this.prefersReducedMotion()) {
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

  private clearHideTimer(): void {
    if (this.hideTimer === undefined) {
      return;
    }
    window.clearTimeout(this.hideTimer);
    this.hideTimer = undefined;
  }

  private prefersReducedMotion(): boolean {
    return typeof window !== 'undefined'
      && 'matchMedia' in window
      && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  private visibleActionFor(action: CxToastAction | undefined): CxToastAction | undefined {
    return action?.text.trim() ? action : undefined;
  }
}
