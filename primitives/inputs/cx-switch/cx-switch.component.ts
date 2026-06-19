import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output, computed, signal } from '@angular/core';
import { CxValidationMessageComponent } from '../../feedback/cx-validation-message';
import {
  type CxValidationMessage,
  normalizeCxValidationMessages,
} from '../shared/field.types';

export type CxSwitchSize = 'default' | 'small';

@Component({
  selector: 'cx-switch',
  imports: [CxValidationMessageComponent],
  templateUrl: './cx-switch.component.html',
  styleUrl: './cx-switch.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CxSwitchComponent {
  private static nextId = 0;
  private readonly selectedState = signal(false);
  private readonly validationMessagesState = signal<ReadonlyArray<CxValidationMessage>>([]);
  protected readonly hintId = `cx-switch-${++CxSwitchComponent.nextId}-hint`;
  protected readonly messagesId = `cx-switch-${CxSwitchComponent.nextId}-messages`;

  @Input() text = 'Type something';
  @Input() hint: string | undefined;
  @Input() size: CxSwitchSize = 'default';
  @Input() disabled = false;
  @Input() custom = false;

  @Input()
  public set validationMessages(value: ReadonlyArray<CxValidationMessage> | null | undefined) {
    this.validationMessagesState.set(value ?? []);
  }

  @Input()
  public set selected(value: boolean) {
    this.selectedState.set(value);
  }

  @Output() readonly selectedChange = new EventEmitter<boolean>();
  @Output() readonly focusChange = new EventEmitter<boolean>();

  protected readonly selected$ = this.selectedState.asReadonly();
  protected readonly validationMessages$ = () =>
    this.disabled
      ? []
      : normalizeCxValidationMessages(this.validationMessagesState());
  protected readonly hasError$ = () => this.validationMessages$().some(message => message.type === 'error');
  protected readonly showHint$ = () => !!this.hint?.trim() && this.validationMessages$().length === 0;
  protected readonly describedByIds$ = computed(() => {
    const ids = [
      this.showHint$() ? this.hintId : undefined,
      this.validationMessages$().length > 0 ? this.messagesId : undefined,
    ].filter((id): id is string => !!id);
    return ids.length > 0 ? ids.join(' ') : undefined;
  });

  protected toggleSelected(event?: Event): void {
    if (this.disabled) {
      return;
    }
    event?.preventDefault();
    event?.stopPropagation();
    this.selectedState.update(current => !current);
    this.selectedChange.emit(this.selectedState());
  }

  protected onKeydown(event: KeyboardEvent): void {
    if (event.key !== ' ') {
      return;
    }
    this.toggleSelected(event);
  }

  protected onFocusChange(focused: boolean): void {
    this.focusChange.emit(focused);
  }
}
