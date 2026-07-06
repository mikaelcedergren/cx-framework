import { NgTemplateOutlet } from '@angular/common';
import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';

export type CxReactionSize = 'small' | 'default' | 'large';

/**
 * A compact toggle for reacting with an emoji and showing a running count.
 * `selected` reflects whether the current user has reacted; the component is
 * controlled, emitting the intended next value through `selectedChange`.
 */
@Component({
  selector: 'cx-reaction',
  imports: [NgTemplateOutlet],
  templateUrl: './cx-reaction.component.html',
  styleUrl: './cx-reaction.component.scss',
  host: {
    '[class.cx-reaction-host--small]': "size === 'small'",
    '[class.cx-reaction-host--large]': "size === 'large'",
  },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CxReactionComponent {
  @Input() emoji = '👍';
  @Input() count = 0;
  @Input() selected = false;
  @Input() size: CxReactionSize = 'default';
  @Input() disabled = false;
  @Input() readonly = false;
  @Input() ariaLabel = 'React';

  @Output() readonly selectedChange = new EventEmitter<boolean>();

  protected get hasCount(): boolean {
    return this.count > 0;
  }

  protected toggle(): void {
    if (this.disabled || this.readonly) {
      return;
    }
    this.selectedChange.emit(!this.selected);
  }
}
