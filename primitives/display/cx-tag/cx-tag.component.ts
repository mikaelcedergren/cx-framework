import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  Output,
  booleanAttribute,
  inject,
} from '@angular/core';
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
  private readonly host: ElementRef<HTMLElement> = inject(ElementRef);

  @Input() text = 'Tag';
  @Input() icon: CxIconName | undefined;
  @Input() color: CxTagColor = 'default';
  @Input() outline = false;
  @Input() dismissible = false;
  /**
   * Turns the tag body into a real button. Opt-in because a tag is often
   * slotted inside another button or label, where a nested button would be
   * invalid and would steal the outer control's activation.
   */
  @Input({ transform: booleanAttribute }) interactive = false;
  /** Accessible name for the interactive body; falls back to the visible text. */
  @Input() ariaLabel: string | undefined;
  /**
   * Set only when the tag opens a surface. Drives aria-haspopup and
   * aria-expanded on the body button, so the popup relationship sits on the
   * real control instead of this component's non-interactive host.
   */
  @Input() expanded: boolean | undefined;
  /** ID of the surface an interactive tag opens. */
  @Input() controls: string | undefined;

  @Output() readonly dismiss = new EventEmitter<void>();
  @Output() readonly pressed = new EventEmitter<void>();

  protected get visibleText(): string {
    return this.text?.trim() ?? '';
  }

  protected get dismissLabel(): string {
    return this.visibleText ? `Dismiss ${this.visibleText}` : 'Dismiss tag';
  }

  /** Null keeps the visible text as the button's accessible name. */
  protected get bodyLabel(): string | null {
    return this.ariaLabel?.trim() || null;
  }

  protected get popupKind(): string | null {
    return this.expanded === undefined ? null : 'dialog';
  }

  /**
   * Focuses an interactive tag without its container needing to know which
   * element inside carries the button. No-ops on a passive tag.
   */
  public focus(): void {
    this.host.nativeElement
      .querySelector<HTMLElement>('.cx-tag__body')
      ?.focus();
  }

  protected onDismiss(event: MouseEvent): void {
    event.preventDefault();
    event.stopPropagation();
    if (!this.dismissible) {
      return;
    }
    this.dismiss.emit();
  }

  protected onPressed(event: MouseEvent): void {
    event.stopPropagation();
    if (!this.interactive) {
      return;
    }
    this.pressed.emit();
  }
}
