import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnDestroy,
  Output,
  QueryList,
  ViewChild,
  ViewChildren,
  booleanAttribute,
  computed,
  signal,
} from '@angular/core';
import { type CxIconName } from '../../icons/manifest';
import { CxIconButtonComponent } from '../../primitives/actions/cx-icon-button';
import {
  CxProcessPillComponent,
  type CxProcessPillMood,
} from '../../primitives/display/cx-process-pill';

export interface CxProcessStage {
  /** Stable id, emitted by `selectedIdChange` when the stage is selected. */
  id: string;
  /** Stage name. */
  label: string;
  /** Items in this stage. Drives the all-clear state when every open stage reaches `0`. */
  count?: number;
  /** Semantic colour for the stage indicator. */
  mood?: CxProcessPillMood;
  /** Leading icon; a mood-coloured dot is shown when omitted. */
  icon?: CxIconName;
  /** A settled end-of-flow stage (e.g. Fixed, Closed). Items here are no longer "to handle". */
  terminal?: boolean;
  /** Disable selection of this stage. */
  disabled?: boolean;
}

interface CxProcessTab {
  key: string;
  /** `undefined` for the leading "all" tab. */
  id: string | undefined;
  label: string;
  ariaLabel: string;
  count: number | undefined;
  mood: CxProcessPillMood;
  icon: CxIconName | undefined;
  terminal: boolean;
  open: boolean;
  muted: boolean;
  disabled: boolean;
  selected: boolean;
  dividerBefore: boolean;
}

const ALL_TAB_KEY = '__all__';

/**
 * A prominent, full-row quick filter that doubles as a progress rail: it leads
 * the user through an ordered lifecycle whose goal is an empty backlog. Each
 * stage is a `cx-process-pill`; selecting one filters the view behind it.
 *
 * Unlike a plain filter, the rail understands "done": when every open
 * (non-terminal) stage reaches `0`, it resolves into an explicit all-clear
 * state instead of a row of zeros. What the user may reconfigure is decided by
 * the host via `editable`, not by the user freely.
 */
@Component({
  selector: 'cx-process',
  imports: [CxProcessPillComponent, CxIconButtonComponent],
  templateUrl: './cx-process.component.html',
  styleUrl: './cx-process.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CxProcessComponent implements AfterViewInit, OnDestroy {
  @ViewChildren('tabRef', { read: ElementRef })
  private readonly tabRefs?: QueryList<ElementRef<HTMLButtonElement>>;

  @ViewChild('rowRef') private readonly rowRef?: ElementRef<HTMLElement>;

  private readonly condensedState = signal(false);
  private resizeObserver?: ResizeObserver;
  private animationFrameId: number | undefined;
  // Smallest row width at which the full labels last fit; we only restore them once there is at least this much room again, so the layout cannot oscillate.
  private expandWidth = Number.POSITIVE_INFINITY;

  private readonly stagesState = signal<CxProcessStage[]>([]);
  private readonly selectedIdState = signal<string | undefined>(undefined);
  private readonly showAllState = signal(true);
  private readonly allLabelState = signal('All');
  private readonly allClearLabelState = signal('All clear');
  private readonly editableState = signal(false);
  private readonly ariaLabelState = signal('Process stages');

  /** The ordered lifecycle stages, left (open) to right (terminal). */
  @Input()
  public set stages(value: CxProcessStage[] | undefined) {
    this.stagesState.set(value ?? []);
    this.scheduleMeasure();
  }

  /** Currently selected stage id; `undefined` selects the leading "all" tab. Two-way bindable. */
  @Input()
  public set selectedId(value: string | undefined) {
    this.selectedIdState.set(value);
  }

  /** Render a leading tab that clears the stage filter. Defaults to `true`. */
  @Input({ transform: booleanAttribute })
  public set showAll(value: boolean) {
    this.showAllState.set(value);
  }

  /** Label for the leading "all" tab. */
  @Input()
  public set allLabel(value: string | undefined) {
    this.allLabelState.set(value?.trim() || 'All');
  }

  /** Label the leading tab adopts once there is nothing left to handle. */
  @Input()
  public set allClearLabel(value: string | undefined) {
    this.allClearLabelState.set(value?.trim() || 'All clear');
  }

  /** When true, reveal a customise affordance on hover/focus that emits `customize`. */
  @Input({ transform: booleanAttribute })
  public set editable(value: boolean) {
    this.editableState.set(value);
  }

  /** Accessible name for the tablist. */
  @Input()
  public set ariaLabel(value: string | undefined) {
    this.ariaLabelState.set(value?.trim() || 'Process stages');
  }

  @Output() readonly selectedIdChange = new EventEmitter<string | undefined>();
  @Output() readonly customize = new EventEmitter<void>();

  protected readonly editable$ = this.editableState.asReadonly();
  protected readonly ariaLabel$ = this.ariaLabelState.asReadonly();
  protected readonly condensed$ = this.condensedState.asReadonly();

  private readonly hasLifecycle$ = computed(() => {
    const stages = this.stagesState();
    return stages.some(stage => stage.terminal) && stages.some(stage => !stage.terminal);
  });

  /** True when there is a real lifecycle and every open stage is known to be empty. */
  protected readonly isClear$ = computed(() => {
    if (!this.hasLifecycle$()) {
      return false;
    }
    const open = this.stagesState().filter(stage => !stage.terminal);
    return open.length > 0 && open.every(stage => stage.count === 0);
  });

  private readonly total$ = computed(() => {
    const counts = this.stagesState()
      .map(stage => stage.count)
      .filter((count): count is number => typeof count === 'number');
    return counts.length ? counts.reduce((sum, count) => sum + count, 0) : undefined;
  });

  protected readonly tabs$ = computed<CxProcessTab[]>(() => {
    const stages = this.stagesState();
    const selected = this.selectedIdState();
    const clear = this.isClear$();
    const tabs: CxProcessTab[] = [];

    if (this.showAllState()) {
      const allLabel = clear ? this.allClearLabelState() : this.allLabelState();
      tabs.push({
        key: ALL_TAB_KEY,
        id: undefined,
        label: allLabel,
        ariaLabel: clear ? allLabel : this.labelWithCount(allLabel, this.total$()),
        count: clear ? undefined : this.total$(),
        mood: clear ? 'success' : 'default',
        icon: clear ? 'check' : undefined,
        terminal: false,
        open: false,
        muted: false,
        disabled: false,
        selected: selected === undefined,
        dividerBefore: false,
      });
    }

    const firstTerminalId = stages.find(stage => stage.terminal)?.id;
    const hasOpen = stages.some(stage => !stage.terminal);
    for (const stage of stages) {
      const open = !stage.terminal;
      tabs.push({
        key: stage.id,
        id: stage.id,
        label: stage.label,
        ariaLabel: this.labelWithCount(stage.label, stage.count),
        count: stage.count,
        mood: stage.mood ?? 'default',
        icon: stage.icon,
        terminal: !!stage.terminal,
        open,
        muted: clear && open,
        disabled: !!stage.disabled,
        selected: selected === stage.id,
        dividerBefore: hasOpen && stage.id === firstTerminalId,
      });
    }

    return tabs;
  });

  /** Index of the single tab that holds the roving tab stop. */
  protected readonly focusIndex$ = computed(() => {
    const tabs = this.tabs$();
    const selected = tabs.findIndex(tab => tab.selected);
    return selected >= 0 ? selected : tabs.findIndex(tab => !tab.disabled);
  });

  public ngAfterViewInit(): void {
    if (typeof ResizeObserver === 'undefined') {
      return;
    }
    this.resizeObserver = new ResizeObserver(() => this.scheduleMeasure());
    if (this.rowRef) {
      this.resizeObserver.observe(this.rowRef.nativeElement);
    }
    this.scheduleMeasure();
  }

  public ngOnDestroy(): void {
    if (this.animationFrameId !== undefined && typeof cancelAnimationFrame !== 'undefined') {
      cancelAnimationFrame(this.animationFrameId);
    }
    this.resizeObserver?.disconnect();
  }

  private scheduleMeasure(): void {
    if (typeof requestAnimationFrame === 'undefined') {
      this.measure();
      return;
    }
    if (this.animationFrameId !== undefined) {
      cancelAnimationFrame(this.animationFrameId);
    }
    this.animationFrameId = requestAnimationFrame(() => {
      this.animationFrameId = undefined;
      this.measure();
    });
  }

  // Drop to icon + count when the labelled row would overflow, before falling
  // back to horizontal scrolling — and never wrap to a second row. Hysteresis on
  // `expandWidth` keeps the toggle from oscillating frame to frame.
  private measure(): void {
    const row = this.rowRef?.nativeElement;
    if (!row) {
      return;
    }
    if (!this.condensedState()) {
      if (row.scrollWidth > row.clientWidth + 1) {
        this.expandWidth = row.scrollWidth;
        this.condensedState.set(true);
      }
    } else if (row.clientWidth >= this.expandWidth) {
      this.condensedState.set(false);
    }
  }

  protected select(tab: CxProcessTab): void {
    if (tab.disabled || tab.selected) {
      return;
    }
    this.selectedIdState.set(tab.id);
    this.selectedIdChange.emit(tab.id);
  }

  protected onKeydown(event: KeyboardEvent, index: number): void {
    const navigationKeys = ['ArrowRight', 'ArrowLeft', 'ArrowDown', 'ArrowUp', 'Home', 'End', ' ', 'Enter'];
    if (!navigationKeys.includes(event.key)) {
      return;
    }
    event.preventDefault();

    const tabs = this.tabs$();
    if (event.key === ' ' || event.key === 'Enter') {
      const tab = tabs[index];
      if (tab) {
        this.select(tab);
      }
      return;
    }

    const maxIndex = tabs.length - 1;
    if (maxIndex < 0) {
      return;
    }

    let nextIndex = index;
    if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
      nextIndex = this.nextEnabledIndex(tabs, index, 1);
    } else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
      nextIndex = this.nextEnabledIndex(tabs, index, -1);
    } else if (event.key === 'Home') {
      nextIndex = this.nextEnabledIndex(tabs, maxIndex, 1);
    } else if (event.key === 'End') {
      nextIndex = this.nextEnabledIndex(tabs, 0, -1);
    }

    const nextTab = tabs[nextIndex];
    if (!nextTab || nextTab.disabled) {
      return;
    }
    this.select(nextTab);
    this.tabRefs?.get(nextIndex)?.nativeElement.focus();
  }

  private nextEnabledIndex(tabs: CxProcessTab[], from: number, direction: 1 | -1): number {
    const maxIndex = tabs.length - 1;
    let index = from;
    for (let step = 0; step <= maxIndex; step++) {
      index = direction === 1 ? (index >= maxIndex ? 0 : index + 1) : index <= 0 ? maxIndex : index - 1;
      if (!tabs[index]?.disabled) {
        return index;
      }
    }
    return from;
  }

  private labelWithCount(label: string, count: number | undefined): string {
    return typeof count === 'number' ? `${label}, ${count}` : label;
  }
}
