import { NgTemplateOutlet } from '@angular/common';
import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { type CxIconName } from '../../../icons/manifest';
import { CxIconComponent, type CxIconSize } from '../../media/cx-icon';

export type CxReactionSize = 'small' | 'default' | 'large';

/**
 * A compact toggle for reacting with an icon and showing a running count.
 * `selected` reflects whether the current user has reacted; the component is
 * controlled, emitting the intended next value through `selectedChange`.
 */
@Component({
  selector: 'cx-reaction',
  imports: [NgTemplateOutlet, CxIconComponent],
  templateUrl: './cx-reaction.component.html',
  styleUrl: './cx-reaction.component.scss',
  host: {
    '[class.cx-reaction-host--small]': "size === 'small'",
    '[class.cx-reaction-host--large]': "size === 'large'",
  },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CxReactionComponent {
  @Input() icon: CxIconName = 'thumbs-up';
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

  protected get resolvedIconSize(): CxIconSize {
    if (this.size === 'small') {
      return '14';
    }
    if (this.size === 'large') {
      return '20';
    }
    return '16';
  }

  protected toggle(): void {
    if (this.disabled || this.readonly) {
      return;
    }
    this.selectedChange.emit(!this.selected);
  }
}
