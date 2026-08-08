import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output, signal } from '@angular/core';
import { type CxIconName } from '../../../icons/manifest';
import { CxIconComponent } from '../../media/cx-icon';
import { CxTooltipDirective } from '../../overlay/cx-tooltip';

export type CxToggleButtonSize = 'default' | 'small';

@Component({
  selector: 'cx-toggle-button',
  imports: [CxIconComponent, CxTooltipDirective],
  templateUrl: './cx-toggle-button.component.html',
  styleUrl: './cx-toggle-button.component.scss',
  host: {
    '[class.cx-toggle-button-host--small]': "size === 'small'",
  },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CxToggleButtonComponent {
  private readonly selectedState = signal(false);

  @Input() text = '';
  @Input() icon: CxIconName | undefined;
  @Input() iconSelected: CxIconName | undefined;
  @Input() size: CxToggleButtonSize = 'default';
  @Input() ariaLabel: string | undefined;
  @Input() disabled = false;

  @Input()
  public set selected(value: boolean) {
    this.selectedState.set(value);
  }

  @Output() readonly selectedChange = new EventEmitter<boolean>();

  protected readonly selected$ = this.selectedState.asReadonly();

  protected get displayIcon(): CxIconName | undefined {
    return this.selectedState() && this.iconSelected ? this.iconSelected : this.icon;
  }

  protected get visibleText(): string {
    return this.text.trim();
  }

  protected get hasVisibleContent(): boolean {
    return Boolean(this.visibleText || this.icon);
  }

  protected get isIconOnly(): boolean {
    return !this.visibleText && Boolean(this.icon);
  }

  protected get resolvedAriaLabel(): string | null {
    const label = this.ariaLabel?.trim();
    if (label) {
      return label;
    }
    if (this.visibleText || !this.icon) {
      return null;
    }
    return this.icon
      ?.split('-')
      .filter(Boolean)
      .map(part => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ') ?? 'Toggle';
  }

  protected toggle(): void {
    if (this.disabled) {
      return;
    }
    this.selectedState.update(current => !current);
    this.selectedChange.emit(this.selectedState());
  }
}
