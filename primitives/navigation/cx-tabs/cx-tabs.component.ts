import {
  AfterViewInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnDestroy,
  Output,
  QueryList,
  ViewChild,
  ViewChildren,
  computed,
  inject,
  signal,
} from '@angular/core';
import { Subscription } from 'rxjs';
import { CxIconButtonComponent } from '../../actions/cx-icon-button';
import { CxMenuComponent, type CxMenuItem } from '../../overlay/cx-menu';

export interface CxTabItem {
  id: string;
  label: string;
  count?: number;
  disabled?: boolean;
}

function coerceBoolean(value: boolean | string | undefined): boolean {
  return value === '' || value === true || value === 'true';
}

@Component({
  selector: 'cx-tabs',
  imports: [CxIconButtonComponent, CxMenuComponent],
  templateUrl: './cx-tabs.component.html',
  styleUrl: './cx-tabs.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CxTabsComponent implements AfterViewInit, OnDestroy {
  private readonly changeDetector = inject(ChangeDetectorRef);

  @ViewChild('rootRef', { read: ElementRef })
  private readonly rootRef?: ElementRef<HTMLElement>;

  @ViewChild('trackRef', { read: ElementRef })
  private readonly trackRef?: ElementRef<HTMLElement>;

  @ViewChildren('tabButton', { read: ElementRef })
  private readonly tabButtons?: QueryList<ElementRef<HTMLButtonElement>>;

  private readonly itemsState = signal<CxTabItem[]>([]);
  private readonly selectedIdState = signal('');
  private readonly hasOverflowState = signal(false);
  private readonly overflowIdsState = signal<string[]>([]);
  private readonly transparentState = signal(false);
  private readonly equalWidthState = signal(false);
  protected readonly overflowOpen$ = signal(false);
  protected readonly indicatorVisible$ = signal(false);
  private readonly indicatorXState = signal(0);
  private readonly indicatorWidthState = signal(0);
  private tabsChangesSubscription?: Subscription;
  private resizeObserver?: ResizeObserver;
  private layoutFrameId: number | undefined;
  private indicatorFrameId: number | undefined;
  private scrollFrameId: number | undefined;
  private pointerScrollLeft: number | undefined;

  @Input() ariaLabel = 'Tabs';

  @Input()
  public set items(value: readonly CxTabItem[] | undefined) {
    const nextItems = this.normalizeItems(value);
    this.itemsState.set(nextItems);
    this.ensureSelectedId();
    this.scheduleLayoutRefresh();
  }

  @Input()
  public set selectedId(value: string | undefined) {
    const nextSelectedId = this.resolveSelectedId(value);
    const previousSelectedId = this.selectedIdState();
    this.selectedIdState.set(nextSelectedId);
    if (nextSelectedId !== previousSelectedId) {
      this.scheduleSelectedTabScroll();
    }
    this.scheduleLayoutRefresh();
  }

  @Input()
  public set transparent(value: boolean | string | undefined) {
    this.transparentState.set(coerceBoolean(value));
  }

  @Input()
  public set equalWidth(value: boolean | string | undefined) {
    this.equalWidthState.set(coerceBoolean(value));
    this.scheduleLayoutRefresh();
  }

  @Output() readonly selectedIdChange = new EventEmitter<string>();

  protected readonly selectedId$ = this.selectedIdState.asReadonly();
  protected readonly items$ = this.itemsState.asReadonly();
  protected readonly transparent$ = this.transparentState.asReadonly();
  protected readonly equalWidth$ = this.equalWidthState.asReadonly();
  protected readonly hasOverflow$ = this.hasOverflowState.asReadonly();
  protected readonly overflowItems$ = computed<CxTabItem[]>(() => {
    const overflowIds = new Set(this.overflowIdsState());
    return this.itemsState().filter(item => overflowIds.has(item.id));
  });
  protected readonly selectedIsOverflow$ = computed(() =>
    this.overflowItems$().some(item => item.id === this.selectedIdState()),
  );
  protected readonly overflowMenuItems$ = computed<CxMenuItem[]>(() =>
    this.overflowItems$().map(item => ({
      id: item.id,
      label: this.menuLabelFor(item),
      disabled: item.disabled,
      selected: item.id === this.selectedIdState(),
    })),
  );

  protected get indicatorX(): string {
    return `${this.indicatorXState()}px`;
  }

  protected get indicatorWidth(): string {
    return `${this.indicatorWidthState()}px`;
  }

  public ngAfterViewInit(): void {
    this.tabsChangesSubscription = this.tabButtons?.changes.subscribe(() => {
      this.observeLayoutTargets();
      this.scheduleLayoutRefresh();
    });
    this.observeLayoutTargets();
    this.scheduleLayoutRefresh();
  }

  public ngOnDestroy(): void {
    this.tabsChangesSubscription?.unsubscribe();
    this.destroyMeasurements();
  }

  protected select(id: string, scrollToSelection = false): void {
    const item = this.itemsState().find(candidate => candidate.id === id);
    if (!item || item.disabled) {
      return;
    }
    if (this.selectedIdState() === id) {
      return;
    }
    this.selectedIdState.set(id);
    this.selectedIdChange.emit(id);
    if (scrollToSelection) {
      this.scheduleSelectedTabScroll();
    } else {
      this.schedulePointerScrollRestore();
    }
    this.scheduleLayoutRefresh();
  }

  protected onKeydown(event: KeyboardEvent, index: number): void {
    if (!['ArrowRight', 'ArrowLeft', 'ArrowDown', 'ArrowUp', 'Home', 'End', ' ', 'Enter'].includes(event.key)) {
      return;
    }

    event.preventDefault();

    const enabledItems = this.itemsState().filter(item => !item.disabled);
    if (enabledItems.length === 0) {
      return;
    }

    if (event.key === ' ' || event.key === 'Enter') {
      const item = this.itemsState()[index];
      if (item) {
        this.select(item.id, false);
      }
      return;
    }

    const currentItem = this.itemsState()[index];
    const currentEnabledIndex = Math.max(
      enabledItems.findIndex(item => item.id === currentItem?.id),
      0,
    );
    const maxIndex = enabledItems.length - 1;
    let nextEnabledIndex = currentEnabledIndex;
    if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
      nextEnabledIndex = currentEnabledIndex >= maxIndex ? 0 : currentEnabledIndex + 1;
    } else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
      nextEnabledIndex = currentEnabledIndex <= 0 ? maxIndex : currentEnabledIndex - 1;
    } else if (event.key === 'Home') {
      nextEnabledIndex = 0;
    } else if (event.key === 'End') {
      nextEnabledIndex = maxIndex;
    }

    const nextItem = enabledItems[nextEnabledIndex];
    if (!nextItem) {
      return;
    }

    this.select(nextItem.id, true);
    const nextIndex = this.itemsState().findIndex(item => item.id === nextItem.id);
    this.focusTab(nextIndex);
  }

  protected onTabPointerDown(event: PointerEvent): void {
    this.pointerScrollLeft = this.trackRef?.nativeElement.scrollLeft;
    event.preventDefault();
  }

  protected tabIndexFor(item: CxTabItem, index: number): string {
    if (item.disabled) {
      return '-1';
    }
    if (item.id === this.selectedIdState()) {
      return '0';
    }
    if (!this.selectedIdState()) {
      return this.itemsState().findIndex(candidate => !candidate.disabled) === index ? '0' : '-1';
    }
    return '-1';
  }

  protected hasCount(item: CxTabItem): boolean {
    return typeof item.count === 'number' && Number.isFinite(item.count);
  }

  protected menuLabelFor(item: CxTabItem): string {
    return this.hasCount(item) ? `${item.label} (${item.count})` : item.label;
  }

  private normalizeItems(value: readonly CxTabItem[] | undefined): CxTabItem[] {
    return [...(value ?? [])]
      .map(item => ({
        id: item.id?.trim() ?? '',
        label: item.label?.trim() || item.id?.trim() || '',
        count: this.normalizeCount(item.count),
        disabled: !!item.disabled,
      }))
      .filter(item => item.id && item.label);
  }

  private normalizeCount(value: number | undefined): number | undefined {
    return typeof value === 'number' && Number.isFinite(value) && value >= 0
      ? Math.floor(value)
      : undefined;
  }

  private resolveSelectedId(value: string | undefined): string {
    const items = this.itemsState();
    const requested = value?.trim();
    if (requested && items.some(item => item.id === requested && !item.disabled)) {
      return requested;
    }
    return items.find(item => !item.disabled)?.id ?? '';
  }

  private ensureSelectedId(): void {
    const resolved = this.resolveSelectedId(this.selectedIdState());
    if (resolved !== this.selectedIdState()) {
      this.selectedIdState.set(resolved);
    }
  }

  private observeLayoutTargets(): void {
    this.resizeObserver?.disconnect();
    if (typeof ResizeObserver === 'undefined') {
      return;
    }
    this.resizeObserver = new ResizeObserver(() => this.scheduleLayoutRefresh());
    if (this.rootRef?.nativeElement) {
      this.resizeObserver.observe(this.rootRef.nativeElement);
    }
    if (this.trackRef?.nativeElement) {
      this.resizeObserver.observe(this.trackRef.nativeElement);
    }
    this.tabButtons?.forEach(button => this.resizeObserver?.observe(button.nativeElement));
  }

  private scheduleLayoutRefresh(): void {
    if (this.layoutFrameId !== undefined) {
      cancelAnimationFrame(this.layoutFrameId);
    }
    if (typeof requestAnimationFrame === 'undefined') {
      this.refreshLayout();
      return;
    }
    this.layoutFrameId = requestAnimationFrame(() => {
      this.layoutFrameId = undefined;
      this.refreshLayout();
    });
  }

  private refreshLayout(): void {
    this.ensureSelectedId();
    this.refreshOverflowItems();
    this.scheduleIndicatorRefresh();
  }

  private refreshOverflowItems(): void {
    const items = this.itemsState();
    if (items.length === 0) {
      this.setHasOverflow(false);
      this.setOverflowIds([]);
      return;
    }

    const track = this.trackRef?.nativeElement;
    const tabButtons = this.tabButtons?.toArray() ?? [];
    if (!track || tabButtons.length !== items.length || track.clientWidth <= 0) {
      this.setHasOverflow(false);
      this.setOverflowIds([]);
      return;
    }

    const hasOverflow = track.scrollWidth > track.clientWidth + 1;
    this.setHasOverflow(hasOverflow);
    if (!hasOverflow) {
      this.setOverflowIds([]);
      return;
    }

    const trackRect = track.getBoundingClientRect();
    const overflowIds = items
      .filter((item, index) => {
        const rect = tabButtons[index]?.nativeElement.getBoundingClientRect();
        if (!rect) {
          return false;
        }
        return rect.left < trackRect.left - 1 || rect.right > trackRect.right + 1;
      })
      .map(item => item.id);

    this.setOverflowIds(overflowIds);
  }

  private setHasOverflow(hasOverflow: boolean): void {
    if (this.hasOverflowState() === hasOverflow) {
      return;
    }
    this.hasOverflowState.set(hasOverflow);
    this.changeDetector.markForCheck();
  }

  private setOverflowIds(ids: string[]): void {
    const previous = this.overflowIdsState();
    if (previous.length === ids.length && previous.every((id, index) => id === ids[index])) {
      return;
    }
    this.overflowIdsState.set(ids);
    this.changeDetector.markForCheck();
  }

  private scheduleIndicatorRefresh(): void {
    if (this.indicatorFrameId !== undefined) {
      cancelAnimationFrame(this.indicatorFrameId);
    }
    if (typeof requestAnimationFrame === 'undefined') {
      this.refreshIndicator();
      return;
    }
    this.indicatorFrameId = requestAnimationFrame(() => {
      this.indicatorFrameId = undefined;
      this.refreshIndicator();
    });
  }

  private refreshIndicator(): void {
    const selectedIndex = this.itemsState().findIndex(item => item.id === this.selectedIdState());
    const selectedButton = this.tabButtons?.toArray()[selectedIndex]?.nativeElement;
    if (selectedIndex < 0 || !selectedButton) {
      this.indicatorVisible$.set(false);
      return;
    }
    this.indicatorXState.set(selectedButton.offsetLeft);
    this.indicatorWidthState.set(selectedButton.offsetWidth);
    this.indicatorVisible$.set(true);
  }

  protected onTrackScroll(): void {
    this.scheduleLayoutRefresh();
  }

  private scheduleSelectedTabScroll(): void {
    if (this.scrollFrameId !== undefined) {
      cancelAnimationFrame(this.scrollFrameId);
    }
    if (typeof requestAnimationFrame === 'undefined') {
      this.scrollSelectedTabIntoView();
      return;
    }
    this.scrollFrameId = requestAnimationFrame(() => {
      this.scrollFrameId = undefined;
      this.scrollSelectedTabIntoView();
    });
  }

  private scrollSelectedTabIntoView(): void {
    const selectedIndex = this.itemsState().findIndex(item => item.id === this.selectedIdState());
    const selectedButton = this.tabButtons?.toArray()[selectedIndex]?.nativeElement;
    const track = this.trackRef?.nativeElement;
    if (!selectedButton || !track) {
      return;
    }

    const tabLeft = selectedButton.offsetLeft;
    const tabRight = tabLeft + selectedButton.offsetWidth;
    const viewportLeft = track.scrollLeft;
    const viewportRight = viewportLeft + track.clientWidth;
    let nextScrollLeft = viewportLeft;

    if (tabLeft < viewportLeft) {
      nextScrollLeft = tabLeft;
    } else if (tabRight > viewportRight) {
      nextScrollLeft = tabRight - track.clientWidth;
    }

    if (Math.abs(nextScrollLeft - viewportLeft) < 1) {
      this.scheduleLayoutRefresh();
      return;
    }

    track.scrollTo({
      left: Math.max(0, nextScrollLeft),
      behavior: 'smooth',
    });
    this.scheduleLayoutRefresh();
  }

  private schedulePointerScrollRestore(): void {
    const scrollLeft = this.pointerScrollLeft;
    const track = this.trackRef?.nativeElement;
    this.pointerScrollLeft = undefined;
    if (scrollLeft === undefined || !track) {
      return;
    }

    const restore = () => {
      track.scrollLeft = scrollLeft;
      this.scheduleLayoutRefresh();
    };
    if (typeof requestAnimationFrame === 'undefined') {
      restore();
      return;
    }
    requestAnimationFrame(restore);
  }

  private focusTab(index: number): void {
    if (index < 0) {
      return;
    }
    const focus = () => this.tabButtons?.get(index)?.nativeElement.focus({ preventScroll: true });
    if (typeof requestAnimationFrame === 'undefined') {
      focus();
      return;
    }
    requestAnimationFrame(focus);
  }

  private destroyMeasurements(): void {
    if (this.layoutFrameId !== undefined) {
      cancelAnimationFrame(this.layoutFrameId);
    }
    if (this.indicatorFrameId !== undefined) {
      cancelAnimationFrame(this.indicatorFrameId);
    }
    if (this.scrollFrameId !== undefined) {
      cancelAnimationFrame(this.scrollFrameId);
    }
    this.resizeObserver?.disconnect();
  }
}
