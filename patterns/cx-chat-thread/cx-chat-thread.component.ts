import { ChangeDetectionStrategy, Component, Input, signal } from '@angular/core';

@Component({
  selector: 'cx-chat-thread',
  templateUrl: './cx-chat-thread.component.html',
  styleUrl: './cx-chat-thread.component.scss',
  host: {
    class: 'cx-chat-thread',
  },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CxChatThreadComponent {
  private readonly viewerIdState = signal('');

  @Input()
  public set viewerId(value: string | undefined) {
    this.viewerIdState.set(value ?? '');
  }

  public readonly viewerId$ = this.viewerIdState.asReadonly();
}
