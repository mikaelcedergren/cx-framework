import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  Output,
  signal,
} from '@angular/core';
import { CxIconComponent } from '../../media/cx-icon';

let nextExpansionPanelId = 0;

export type CxExpansionPanelVariant = 'default' | 'flat';

@Component({
  selector: 'cx-expansion-panel',
  imports: [CxIconComponent],
  templateUrl: './cx-expansion-panel.component.html',
  styleUrl: './cx-expansion-panel.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CxExpansionPanelComponent {
  private readonly expandedState = signal(false);

  /**
   * The words on the toggle, and the panel's whole name.
   *
   * The default says what the component is, the way `cx-toast` defaults to
   * "Notification" and `cx-drop-zone` to "Add a file". It used to say "Severity",
   * which is a field in a security product rather than anything a disclosure is —
   * a domain name that had leaked into a primitive and read as a mistake on every
   * other surface.
   *
   * Do not "tidy" this to `''`. The heading is the trigger button's only content,
   * so an empty one leaves that button with no accessible name at all, and the
   * expand control announcing "Expand " into silence. A generic word is worth
   * less than the real one and far more than nothing.
   */
  @Input() heading = 'Details';
  @Input() variant: CxExpansionPanelVariant = 'default';

  @Input()
  public set expanded(value: boolean | undefined) {
    this.expandedState.set(!!value);
  }

  @Output() readonly expandedChange = new EventEmitter<boolean>();

  protected readonly contentId = `cx-expansion-panel-content-${nextExpansionPanelId += 1}`;
  protected readonly expanded$ = this.expandedState.asReadonly();

  protected toggle(): void {
    const next = !this.expandedState();
    this.expandedState.set(next);
    this.expandedChange.emit(next);
  }
}
