import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output, signal } from '@angular/core';
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

  @Input() heading = 'Severity';
  @Input() variant: CxExpansionPanelVariant = 'default';
  @Input() active = false;

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
