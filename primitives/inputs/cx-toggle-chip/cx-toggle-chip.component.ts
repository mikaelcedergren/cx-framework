import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output, signal } from '@angular/core';
import { CxIconComponent } from '../../media/cx-icon';

export type CxToggleChipSize = 'default' | 'small' | 'large';

@Component({
  selector: 'cx-toggle-chip',
  imports: [CxIconComponent],
  templateUrl: './cx-toggle-chip.component.html',
  styleUrl: './cx-toggle-chip.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CxToggleChipComponent {
  private readonly selectedState = signal(false);

  @Input() text = 'Chip';
  @Input() size: CxToggleChipSize = 'default';
  @Input() ariaLabel: string | undefined;
  @Input() disabled = false;

  @Input()
  public set selected(value: boolean) {
    this.selectedState.set(value);
  }

  @Output() readonly selectedChange = new EventEmitter<boolean>();

  protected readonly selected$ = this.selectedState.asReadonly();

  protected toggle(): void {
    if (this.disabled) {
      return;
    }
    this.selectedChange.emit(!this.selectedState());
  }
}
