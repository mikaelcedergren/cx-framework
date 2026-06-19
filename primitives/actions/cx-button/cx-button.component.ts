import { ChangeDetectionStrategy, Component, EventEmitter, Input, OnDestroy, Output } from '@angular/core';
import { type CxIconName } from '../../../icons/manifest';
import { CxSpinnerComponent } from '../../feedback/cx-spinner';
import { CxIconComponent } from '../../media/cx-icon';
import { createDelayedLoadingState } from '../shared/delayed-loading-state';

export type CxButtonMood = 'default' | 'primary' | 'accent' | 'info' | 'success' | 'warning' | 'danger';
export type CxButtonSize = 'default' | 'small' | 'large';
export type CxButtonVariant = 'default' | 'primary' | 'transparent' | 'link' | 'dashed' | 'accent' | 'danger';

@Component({
  selector: 'cx-button',
  imports: [CxSpinnerComponent, CxIconComponent],
  templateUrl: './cx-button.component.html',
  styleUrl: './cx-button.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CxButtonComponent implements OnDestroy {
  private readonly delayedLoading = createDelayedLoadingState(0);

  @Input() text = 'Button';
  @Input() variant: CxButtonVariant = 'default';
  @Input() mood: CxButtonMood = 'default';
  @Input() icon: CxIconName | undefined;
  @Input() appendIcon: CxIconName | undefined;
  @Input() size: CxButtonSize = 'default';
  @Input() selected: boolean | undefined;
  @Input() ariaLabel: string | undefined;
  @Input() disabled = false;

  @Input()
  public set loading(value: boolean) {
    this.delayedLoading.sync(Boolean(value));
  }

  @Output() readonly pressed = new EventEmitter<void>();

  protected readonly loading$ = this.delayedLoading.loading$;
  protected readonly showSpinner$ = this.delayedLoading.showSpinner$;

  protected get visibleText(): string {
    return this.text?.trim() ?? '';
  }

  protected get isIconOnly(): boolean {
    return !this.visibleText && !!this.icon && !this.appendIcon;
  }

  protected get isDefault(): boolean {
    return this.mood === 'default' && this.variant === 'default';
  }

  protected get isPrimary(): boolean {
    return this.mood === 'primary' || (this.mood === 'default' && this.variant === 'primary');
  }

  protected get isAccent(): boolean {
    return this.mood === 'accent' || (this.mood === 'default' && this.variant === 'accent');
  }

  protected get isInfo(): boolean {
    return this.mood === 'info';
  }

  protected get isSuccess(): boolean {
    return this.mood === 'success';
  }

  protected get isWarning(): boolean {
    return this.mood === 'warning';
  }

  protected get isDanger(): boolean {
    return this.mood === 'danger' || (this.mood === 'default' && this.variant === 'danger');
  }

  protected get isTransparent(): boolean {
    return this.mood === 'default' && this.variant === 'transparent';
  }

  protected get isLink(): boolean {
    return this.mood === 'default' && this.variant === 'link';
  }

  protected get isDashed(): boolean {
    return this.mood === 'default' && this.variant === 'dashed';
  }

  public ngOnDestroy(): void {
    this.delayedLoading.destroy();
  }

  protected onClick(): void {
    if (this.disabled || this.loading$()) {
      return;
    }
    this.pressed.emit();
  }
}
