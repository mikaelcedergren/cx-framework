import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  Output,
  ViewChild,
  signal,
} from '@angular/core';
import { type CxIconName } from '../../../icons/manifest';
import { CxIconComponent, type CxIconMood } from '../../media/cx-icon';

@Component({
  selector: 'cx-big-checkbox',
  imports: [CxIconComponent],
  templateUrl: './cx-big-checkbox.component.html',
  styleUrl: './cx-big-checkbox.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CxBigCheckboxComponent {
  private readonly selectedState = signal(false);

  @ViewChild('choiceContent', { read: ElementRef })
  private choiceContentRef?: ElementRef<HTMLElement>;

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

  protected onNativeChange(event: Event): void {
    if (this.disabled) {
      return;
    }

    const target = event.target;
    const selected = target instanceof HTMLInputElement ? target.checked : !this.selectedState();
    this.selectedState.set(selected);
    this.selectedChange.emit(selected);
  }

  protected onFocus(focused: boolean): void {
    this.focusChange.emit(focused);
  }
}
