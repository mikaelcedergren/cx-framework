import { ChangeDetectionStrategy, Component, Input, computed, inject, signal } from '@angular/core';
import { type CxIconName } from '../../icons/manifest';
import { CxTagComponent, type CxTagColor } from '../../primitives/display/cx-tag';
import { CxChatThreadComponent } from '../cx-chat-thread/cx-chat-thread.component';

export interface CxChatMessageStatus {
  readonly label: string;
  readonly color: CxTagColor;
  readonly icon?: CxIconName;
}

@Component({
  selector: 'cx-chat-message',
  imports: [CxTagComponent],
  templateUrl: './cx-chat-message.component.html',
  styleUrl: './cx-chat-message.component.scss',
  host: {
    class: 'cx-chat-message',
    role: 'listitem',
    '[class.cx-chat-message--self]': 'isSelf$()',
    '[class.cx-chat-message--other]': '!isSelf$()',
    '[attr.title]': 'null',
  },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CxChatMessageComponent {
  private readonly thread = inject(CxChatThreadComponent, { optional: true, skipSelf: true });
  private readonly authorIdState = signal('');
  private readonly authorState = signal('');
  private readonly timestampState = signal('');
  private readonly statusState = signal<CxChatMessageStatus | undefined>(undefined);

  @Input()
  public set authorId(value: string | undefined) {
    this.authorIdState.set(value ?? '');
  }

  @Input()
  public set author(value: string | undefined) {
    this.authorState.set(value ?? '');
  }

  @Input()
  public set timestamp(value: string | undefined) {
    this.timestampState.set(value ?? '');
  }

  @Input()
  public set status(value: CxChatMessageStatus | undefined) {
    this.statusState.set(value);
  }

  protected readonly timestamp$ = this.timestampState.asReadonly();
  protected readonly status$ = this.statusState.asReadonly();
  protected readonly isSelf$ = computed(() => {
    const viewerId = this.thread?.viewerId$() ?? '';
    const authorId = this.authorIdState();
    return !!viewerId && !!authorId && viewerId === authorId;
  });
  protected readonly authorLabel$ = computed(() => {
    if (this.isSelf$()) {
      return 'You';
    }
    return this.authorState();
  });
}
