import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { type CxIconName } from '../../../icons/manifest';
import { CxIconComponent } from '../../media/cx-icon';
import { CxTooltipDirective } from '../../overlay/cx-tooltip';

export const CX_TAG_COLORS = [
  'default',
  'blue',
  'cyan',
  'lime',
  'green',
  'yellow',
  'orange',
  'tangerine',
  'red',
  'pink',
  'purple',
  'violet',
] as const;

export type CxTagColor = (typeof CX_TAG_COLORS)[number];

export const CX_TAG_COLOR_PICKER_OPTIONS = [
  'blue',
  'cyan',
  'lime',
  'green',
  'yellow',
  'orange',
  'tangerine',
  'red',
  'pink',
  'purple',
  'violet',
] as const satisfies readonly CxTagColor[];

@Component({
  selector: 'cx-tag',
  imports: [CxIconComponent, CxTooltipDirective],
  templateUrl: './cx-tag.component.html',
  styleUrl: './cx-tag.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CxTagComponent {
  @Input() text = 'Tag';
  @Input() icon: CxIconName | undefined;
  @Input() color: CxTagColor = 'default';
  @Input() outline = false;
  @Input() dismissible = false;

  @Output() readonly dismiss = new EventEmitter<void>();

  protected get visibleText(): string {
    return this.text?.trim() ?? '';
  }

  protected get dismissLabel(): string {
    return this.visibleText ? `Dismiss ${this.visibleText}` : 'Dismiss tag';
  }

  protected onDismiss(event: MouseEvent): void {
    event.preventDefault();
    event.stopPropagation();
    if (!this.dismissible) {
      return;
    }
    this.dismiss.emit();
  }
}
