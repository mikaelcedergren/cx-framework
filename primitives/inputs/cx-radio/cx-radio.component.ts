import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output, signal } from '@angular/core';
import { CxValidationMessageComponent } from '../../feedback/cx-validation-message';
import {
  type CxValidationMessage,
  normalizeCxValidationMessages,
} from '../shared/field.types';

let cxRadioId = 0;

@Component({
  selector: 'cx-radio',
  imports: [CxValidationMessageComponent],
  templateUrl: './cx-radio.component.html',
  styleUrl: './cx-radio.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CxRadioComponent {
  private readonly baseId = `cx-radio-${++cxRadioId}`;
  private readonly selectedState = signal(false);
  private readonly validationMessagesState = signal<ReadonlyArray<CxValidationMessage>>([]);

  @Input() text = 'High priority';
  @Input() hint: string | undefined;
  @Input() custom = false;
  @Input() disabled = false;

  @Input()
  public set validationMessages(value: ReadonlyArray<CxValidationMessage> | null | undefined) {
    this.validationMessagesState.set(value ?? []);
  }

  @Input()
  public set selected(value: boolean) {
    this.selectedState.set(value);
  }

  @Output() readonly selectedChange = new EventEmitter<boolean>();

  protected readonly selected$ = this.selectedState.asReadonly();
  protected readonly validationMessages$ = () =>
    this.disabled
      ? []
      : normalizeCxValidationMessages(this.validationMessagesState());
  protected readonly hasError$ = () => this.validationMessages$().some(message => message.type === 'error');
  protected readonly showHint$ = () => !!this.hint?.trim() && this.validationMessages$().length === 0;
  protected readonly hasText$ = () => !!this.text.trim();
  protected readonly hintId = `${this.baseId}-hint`;
  protected readonly messagesId = `${this.baseId}-messages`;
  protected readonly describedBy$ = () => {
    if (this.showHint$()) {
      return this.hintId;
    }

    if (this.validationMessages$().length > 0) {
      return this.messagesId;
    }

    return null;
  };

  protected activate(): void {
    if (this.disabled || this.selectedState()) {
      return;
    }
    this.selectedState.set(true);
    this.selectedChange.emit(true);
  }
}
