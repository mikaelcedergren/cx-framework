import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output, signal } from '@angular/core';
import { type CxIconName } from '../../../icons/manifest';
import { CxIconComponent, type CxIconMood } from '../../media/cx-icon';

@Component({
  selector: 'cx-big-radio',
  imports: [CxIconComponent],
  templateUrl: './cx-big-radio.component.html',
  styleUrl: './cx-big-radio.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CxBigRadioComponent {
  private readonly selectedState = signal(false);

  @Input() heading = '';
  @Input() description = '';
  @Input() icon: CxIconName | undefined;
  @Input() iconMood: CxIconMood = 'default';
  @Input() disabled = false;

  @Input()
  public set selected(selected: boolean) {
    this.selectedState.set(selected);
  }

  @Output() readonly selectedChange = new EventEmitter<boolean>();
  @Output() readonly focusChange = new EventEmitter<boolean>();

  protected readonly selected$ = this.selectedState.asReadonly();

  protected visibleHeading$(): string {
    return this.heading.trim();
  }

  protected visibleDescription$(): string {
    return this.description.trim();
  }

  protected activate(): void {
    if (this.disabled || this.selectedState()) {
      return;
    }
    this.selectedState.set(true);
    this.selectedChange.emit(true);
  }

  protected onFocus(focused: boolean): void {
    this.focusChange.emit(focused);
  }

}
