import { ChangeDetectionStrategy, Component, EventEmitter, HostBinding, Input, OnDestroy, Output } from '@angular/core';
import { type CxIconName } from '../../../icons/manifest';
import { type CxButtonMood, type CxButtonSize } from '../cx-button';
import { CxIconComponent } from '../../media/cx-icon';
import { CxSpinnerComponent } from '../../feedback/cx-spinner';
import { CxBadgeComponent } from '../../display/cx-badge';
import { createCountdownState } from '../shared/countdown-state';
import { createDelayedLoadingState } from '../shared/delayed-loading-state';

export type CxIconButtonVariant = 'default' | 'transparent';

@Component({
  selector: 'cx-icon-button',
  imports: [CxBadgeComponent, CxIconComponent, CxSpinnerComponent],
  templateUrl: './cx-icon-button.component.html',
  styleUrl: './cx-icon-button.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CxIconButtonComponent implements OnDestroy {
  @Input() icon: CxIconName = 'info';
  @Input() ariaLabel = 'Icon button';
  @Input() mood: CxButtonMood = 'default';
  @Input() variant: CxIconButtonVariant = 'default';
  @Input() size: CxButtonSize = 'default';
  @Input() active = false;
  @Input() ariaPressed: boolean | undefined;
  @Input() hover = false;
  @Input() disabled = false;
  @Input() badgeValue: string | undefined;
  /** Stretch to the full width of the host's container (e.g. a full-row add button). */
  @Input() block = false;

  @HostBinding('class.cx-icon-button--block') get blockClass(): boolean {
    return this.block;
  }

  @Output() readonly pressed = new EventEmitter<void>();
  @Output() readonly countdownChange = new EventEmitter<boolean>();

  private readonly delayedLoading = createDelayedLoadingState(0);
  private readonly countdownState = createCountdownState(6000, () => {
    this.countdownChange.emit(false);
  });

  @Input()
  public set loading(value: boolean) {
    this.delayedLoading.sync(Boolean(value));
  }

  @Input()
  public set countdown(value: boolean) {
    this.countdownState.sync(Boolean(value));
  }

  protected readonly loading$ = this.delayedLoading.loading$;
  protected readonly showSpinner$ = this.delayedLoading.showSpinner$;
  protected readonly countdownActive$ = this.countdownState.active$;

  protected hasBadge(): boolean {
    return this.badgeValue !== undefined;
  }

  protected hasBadgeCount(): boolean {
    return this.badgeCount() !== undefined;
  }

  protected badgeCount(): number | undefined {
    const value = this.badgeValue?.trim();
    if (!value) {
      return undefined;
    }

    const count = Number(value);
    return Number.isInteger(count) && count >= 0 ? count : undefined;
  }

  public ngOnDestroy(): void {
    this.delayedLoading.destroy();
    this.countdownState.destroy();
  }

  protected onClick(): void {
    if (this.disabled || this.loading$() || this.countdownActive$()) {
      return;
    }
    this.pressed.emit();
  }
}
