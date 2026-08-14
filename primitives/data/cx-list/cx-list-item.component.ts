import {
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  Output,
  signal,
  type OnChanges,
  type SimpleChanges,
} from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { type CxIconName } from '../../../icons/manifest';
import { CxIconComponent } from '../../media/cx-icon';
import { CxTooltipDirective } from '../../overlay/cx-tooltip';

let nextListItemId = 0;

/**
 * List-level presentation owned by the parent `cx-list`. Content projection
 * puts the row outside the list's style scope, so the list pushes these values
 * down instead of reaching in with a descendant selector.
 */
export interface CxListItemContext {
  readonly density: 'comfortable' | 'compact';
  readonly divided: boolean;
  /** A parent list is driving the open state, so the row must not toggle itself. */
  readonly managed: boolean;
}

@Component({
  selector: 'cx-list-item',
  imports: [NgTemplateOutlet, CxIconComponent, CxTooltipDirective],
  templateUrl: './cx-list-item.component.html',
  styleUrl: './cx-list-item.component.scss',
  host: {
    role: 'listitem',
    '[class.cx-list-item-host--compact]': 'context$().density === "compact"',
    '[class.cx-list-item-host--divided]': 'context$().divided',
    '[class.cx-list-item-host--expanded]': 'expanded$()',
    '[class.cx-list-item-host--disabled]': 'disabled',
  },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CxListItemComponent implements OnChanges {
  private readonly expandedState = signal(false);
  private readonly contextState = signal<CxListItemContext>({
    density: 'comfortable',
    divided: true,
    managed: false,
  });

  private warnedInvalidActivation = false;

  /**
   * Stable key for the parent list's single-open state. Falls back to the
   * generated id, so an uncontrolled list still opens one row at a time.
   */
  @Input() itemId: string | undefined;
  @Input() heading = 'List item';
  @Input() description: string | undefined;
  /** Short trailing value such as a count, status word, or timestamp. */
  @Input() meta: string | undefined;
  @Input() prependIcon: CxIconName | undefined;
  /**
   * Turns the row body into a button that emits `pressed`. Ignored when the
   * row is `expandable`, because a row cannot both navigate away and open.
   */
  @Input({ transform: booleanAttribute }) interactive = false;
  /** Navigation destination. Renders the row body as a real link. */
  @Input() href: string | undefined;
  @Input() target: string | undefined;
  @Input() rel: string | undefined;
  /** Row body opens its projected content instead of emitting `pressed`. */
  @Input({ transform: booleanAttribute }) expandable = false;
  @Input({ transform: booleanAttribute }) disabled = false;

  @Output() readonly pressed = new EventEmitter<void>();
  @Output() readonly expandedChange = new EventEmitter<boolean>();

  /** Raised on user activation so the parent list can close its other rows. */
  @Output() readonly expandToggle = new EventEmitter<string>();

  protected readonly contentId = `cx-list-item-content-${(nextListItemId += 1)}`;
  protected readonly expanded$ = this.expandedState.asReadonly();
  protected readonly context$ = this.contextState.asReadonly();

  ngOnChanges(_changes: SimpleChanges): void {
    this.warnInvalidCombinations();
  }

  /** Key the parent list tracks this row by. */
  public get key(): string {
    return this.itemId ?? this.contentId;
  }

  /** Parent-driven open state; does not re-emit `expandedChange` back to the list. */
  public setExpanded(expanded: boolean): void {
    if (this.expandedState() === expanded) {
      return;
    }
    this.expandedState.set(expanded);
    this.expandedChange.emit(expanded);
  }

  public setContext(context: CxListItemContext): void {
    this.contextState.set(context);
  }

  /** A static row has no affordance and takes no pointer or keyboard activation. */
  protected get activatable(): boolean {
    return this.expandable || Boolean(this.resolvedHref) || this.interactive;
  }

  protected get resolvedHref(): string | undefined {
    return this.href?.trim() || undefined;
  }

  protected get resolvedRel(): string | null {
    return this.rel?.trim() || (this.target?.trim() === '_blank' ? 'noopener' : null);
  }

  protected onActivate(): void {
    if (this.disabled || !this.activatable) {
      return;
    }
    if (this.expandable) {
      this.expandToggle.emit(this.key);
      // Outside a cx-list nothing else owns the open state, so the row keeps
      // its own. A chevron that does nothing would be broken chrome.
      if (!this.contextState().managed) {
        this.setExpanded(!this.expandedState());
      }
      return;
    }
    this.pressed.emit();
  }

  protected onLinkClick(event: MouseEvent): void {
    if (!this.disabled) {
      return;
    }
    event.preventDefault();
    event.stopPropagation();
  }

  private warnInvalidCombinations(): void {
    const activationCount = Number(this.expandable) + Number(Boolean(this.resolvedHref)) + Number(this.interactive);
    if (this.warnedInvalidActivation || activationCount < 2) {
      return;
    }
    this.warnedInvalidActivation = true;
    console.warn(
      `cx-list-item "${this.heading}" sets more than one activation mode. ` +
        'A row opens, navigates, or acts; expandable wins, then href, then interactive.',
    );
  }
}
