import { ChangeDetectionStrategy, Component, Input, computed, signal } from '@angular/core';
import { type CxIconName } from '../../../icons/manifest';
import { CxAlertComponent } from '../cx-alert';
import { CxIconComponent } from '../../media/cx-icon';
import {
  type CxRenderedValidationMessage,
  type CxValidationMessage,
  type CxValidationMessageType,
  normalizeCxValidationMessages,
} from '../../inputs/shared/field.types';

export type CxValidationMessageDisplay = 'inline' | 'global';
export type CxValidationMessageInput = CxValidationMessage;

@Component({
  selector: 'cx-validation-message',
  host: {
    class: 'cx-validation-message',
    '[class.cx-validation-message--inline]': "display$() === 'inline'",
    '[class.cx-validation-message--global]': "display$() === 'global'",
  },
  imports: [CxAlertComponent, CxIconComponent],
  templateUrl: './cx-validation-message.component.html',
  styleUrl: './cx-validation-message.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CxValidationMessageComponent {
  private readonly displayState = signal<CxValidationMessageDisplay>('inline');
  private readonly showAllState = signal(false);
  private readonly messagesState = signal<ReadonlyArray<CxValidationMessageInput>>([
    { type: 'error', text: 'This field is required.' },
  ]);

  @Input()
  public set type(value: CxValidationMessageDisplay | null | undefined) {
    this.displayState.set(value === 'global' ? 'global' : 'inline');
  }

  @Input()
  public set showAll(value: boolean | null | undefined) {
    this.showAllState.set(value === true);
  }

  @Input()
  public set messages(value: ReadonlyArray<CxValidationMessageInput> | null | undefined) {
    this.messagesState.set(value ?? []);
  }

  protected readonly display$ = this.displayState.asReadonly();
  protected readonly messages$ = computed<ReadonlyArray<CxRenderedValidationMessage>>(() => {
    const normalized = normalizeCxValidationMessages(this.messagesState());
    return this.showAllState() ? normalized : normalized.slice(0, 1);
  });

  protected iconFor(type: CxValidationMessageType): CxIconName | null {
    switch (type) {
      case 'status':
        return null;
      case 'success':
        return 'check';
      case 'warning':
        return 'warning';
      case 'error':
        return 'error';
      case 'info':
      default:
        return 'info';
    }
  }

  protected roleFor(type: CxValidationMessageType): 'alert' | 'status' {
    return type === 'error' || type === 'warning' ? 'alert' : 'status';
  }
}
