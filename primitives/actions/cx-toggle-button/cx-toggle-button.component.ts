import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output, computed, signal } from '@angular/core';
import { type CxIconName } from '../../../icons/manifest';
import { CxButtonComponent } from '../cx-button';

export type CxToggleButtonSize = 'default' | 'small';

@Component({
  selector: 'cx-toggle-button',
  imports: [CxButtonComponent],
  templateUrl: './cx-toggle-button.component.html',
  styleUrl: './cx-toggle-button.component.scss',
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
  protected readonly displayIcon$ = computed(() =>
    this.selectedState() && this.iconSelected ? this.iconSelected : this.icon,
  );

  protected toggle(): void {
    if (this.disabled) {
      return;
    }
    this.selectedState.update(current => !current);
    this.selectedChange.emit(this.selectedState());
  }
}
