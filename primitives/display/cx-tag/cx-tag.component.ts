import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { type CxIconName } from '../../../icons/manifest';
import { CxIconComponent } from '../../media/cx-icon';

export const CX_TAG_COLORS = [
  'default',
  'blue',
  'cyan',
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
export type CxTagSize = 'default' | 'large';
export type CxTagVariant = 'readOnly' | 'outline' | 'dismissible' | 'interactive';

export interface CxTag {
  text: string;
  info?: string;
  icon?: CxIconName;
  color?: CxTagColor;
  variant?: CxTagVariant;
  size?: CxTagSize;
  disabled?: boolean;
  tags?: CxTag[];
}

export const CX_TAG_COLOR_PICKER_OPTIONS = [
  'blue',
  'cyan',
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
  imports: [CxIconComponent],
  templateUrl: './cx-tag.component.html',
  styleUrl: './cx-tag.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CxTagComponent {
  @Input() text = 'Tag';
  @Input() info: string | undefined;
  @Input() icon: CxIconName | undefined;
  @Input() color: CxTagColor = 'default';
  @Input() variant: CxTagVariant = 'readOnly';
  @Input() size: CxTagSize | undefined;
  @Input() disabled = false;
  @Input() tags: CxTag[] = [];

  @Output() readonly remove = new EventEmitter<void>();

  protected get hasChildren(): boolean {
    return this.tags.length > 0;
  }

  protected get showRemove(): boolean {
    return this.variant === 'dismissible' && !this.disabled;
  }

  protected childColor(tag: CxTag): CxTagColor {
    return tag.color ?? 'default';
  }

  protected childVariant(tag: CxTag): CxTagVariant {
    return tag.variant ?? 'readOnly';
  }

  protected removeIcon(): CxIconName {
    return 'remove';
  }

  protected onRemove(event: MouseEvent): void {
    event.preventDefault();
    event.stopPropagation();
    if (!this.showRemove) {
      return;
    }
    this.remove.emit();
  }
}
