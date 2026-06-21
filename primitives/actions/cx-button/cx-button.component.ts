import { ChangeDetectionStrategy, Component, EventEmitter, Input, OnDestroy, Output } from '@angular/core';
import { type CxIconName } from '../../../icons/manifest';
import { CxSpinnerComponent } from '../../feedback/cx-spinner';
import { CxIconComponent } from '../../media/cx-icon';
import { createDelayedLoadingState } from '../shared/delayed-loading-state';

export type CxButtonMood = 'default' | 'primary' | 'accent' | 'info' | 'success' | 'warning' | 'danger';
export type CxButtonSize = 'default' | 'small' | 'large';
export type CxButtonType = 'button' | 'submit' | 'reset';

@Component({
  selector: 'cx-button',
  imports: [CxSpinnerComponent, CxIconComponent],
  templateUrl: './cx-button.component.html',
  styleUrl: './cx-button.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CxButtonComponent implements OnDestroy {
  private readonly delayedLoading = createDelayedLoadingState(0);

  @Input() text = '';
  @Input() mood: CxButtonMood = 'default';
  @Input() icon: CxIconName | undefined;
  @Input() appendIcon: CxIconName | undefined;
  @Input() type: CxButtonType = 'button';
  @Input() size: CxButtonSize = 'default';
  @Input() ariaLabel: string | undefined;
  @Input() disabled = false;
  @Input() transparent = false;
  @Input() rounded = false;

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
    return !this.visibleText && this.visibleIconCount === 1;
  }

  protected get resolvedAriaLabel(): string | null {
    const label = this.ariaLabel?.trim();
    if (label) {
      return label;
    }
    if (this.isIconOnly) {
      return this.humanizeIconName(this.icon ?? this.appendIcon);
    }
    return null;
  }

  protected get nativeType(): CxButtonType {
    return this.type === 'submit' || this.type === 'reset' ? this.type : 'button';
  }

  protected get isDefault(): boolean {
    return this.mood === 'default';
  }

  protected get isPrimary(): boolean {
    return this.mood === 'primary';
  }

  protected get isAccent(): boolean {
    return this.mood === 'accent';
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
    return this.mood === 'danger';
  }

  protected get isTransparent(): boolean {
    return this.transparent;
  }

  private get visibleIconCount(): number {
    return Number(Boolean(this.icon)) + Number(Boolean(this.appendIcon));
  }

  private humanizeIconName(name: CxIconName | undefined): string {
    return name
      ?.split('-')
      .filter(Boolean)
      .map(part => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ') || 'Button';
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
