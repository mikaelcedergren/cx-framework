import { NgTemplateOutlet } from '@angular/common';
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
  ViewChild,
  computed,
  inject,
  signal,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { type CxMenuItem, CxMenuComponent } from '../../overlay/cx-menu';
import { CxIconComponent } from '../../media/cx-icon';

export interface CxBreadcrumbOption {
  id: string;
  label: string;
  disabled?: boolean;
}

export interface CxBreadcrumbItem {
  id: string;
  label: string;
  href?: string;
  routerLink?: string | readonly unknown[];
  fragment?: string;
  target?: string;
  rel?: string;
  selectedOptionId?: string;
  options?: readonly CxBreadcrumbOption[];
}

export interface CxBreadcrumbOptionSelectEvent {
  itemId: string;
  optionId: string;
}

@Component({
  selector: 'cx-breadcrumbs',
  imports: [NgTemplateOutlet, RouterLink, CxIconComponent, CxMenuComponent],
  templateUrl: './cx-breadcrumbs.component.html',
  styleUrl: './cx-breadcrumbs.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CxBreadcrumbsComponent implements AfterViewInit, OnDestroy {
  private readonly cdr = inject(ChangeDetectorRef);
  private resizeObserver?: ResizeObserver;
  private viewReady = false;

  @ViewChild('list', { read: ElementRef }) private readonly listRef?: ElementRef<HTMLElement>;
  @ViewChild('measureList', { read: ElementRef }) private readonly measureListRef?: ElementRef<HTMLElement>;

  private readonly itemsState = signal<CxBreadcrumbItem[]>([
    { id: 'environments', label: 'Environments' },
    { id: 'staging-eu-01', label: 'Staging-EU-01' },
    { id: 'assets', label: 'Assets' },
  ]);
  private readonly currentIdState = signal<string | undefined>(undefined);
  private readonly ariaLabelState = signal('Breadcrumbs');
  private readonly compactState = signal(false);

  @Input()
  public set ariaLabel(value: string | undefined) {
    const label = value?.trim();
    this.ariaLabelState.set(label ? label : 'Breadcrumbs');
  }

  @Input()
  public set items(value: readonly CxBreadcrumbItem[] | undefined) {
    const normalizedItems = (value ?? [])
      .filter(item => item?.id && item?.label)
      .map(item => ({
        id: item.id,
        label: item.label,
        href: item.href,
        routerLink: item.routerLink,
        fragment: item.fragment,
        target: item.target,
        rel: item.rel,
        selectedOptionId: item.selectedOptionId,
        options: (item.options ?? []).filter(option => option?.id && option?.label),
      }));
    this.itemsState.set(normalizedItems);
    this.scheduleCompactSync();
  }

  @Input()
  public set currentId(value: string | undefined) {
    this.currentIdState.set(value);
    this.scheduleCompactSync();
  }

  @Output() readonly itemSelect = new EventEmitter<string>();
  @Output() readonly optionSelect = new EventEmitter<CxBreadcrumbOptionSelectEvent>();

  protected readonly ariaLabel$ = this.ariaLabelState.asReadonly();
  protected readonly effectiveCurrentId$ = computed(() => {
    const currentId = this.currentIdState();
    if (currentId && this.itemsState().some(item => item.id === currentId)) {
      return currentId;
    }
    return this.itemsState().at(-1)?.id;
  });
  protected readonly pathItems$ = computed(() => {
    const items = this.itemsState();
    const currentId = this.effectiveCurrentId$();
    const currentIndex = items.findIndex(item => item.id === currentId);
    return currentIndex >= 0 ? items.slice(0, currentIndex + 1) : items;
  });
  protected readonly shouldCompact$ = computed(() => this.compactState() && this.pathItems$().length > 2);
  protected readonly firstItem$ = computed(() => this.pathItems$()[0]);
  protected readonly lastItem$ = computed(() => this.pathItems$().at(-1));
  protected readonly hiddenItems$ = computed(() => {
    const items = this.pathItems$();
    return this.shouldCompact$() ? items.slice(1, -1) : [];
  });
  protected readonly hiddenMenuItems$ = computed<CxMenuItem[]>(() =>
    this.hiddenItems$().map(item => ({ id: item.id, label: item.label })),
  );

  ngAfterViewInit(): void {
    this.viewReady = true;

    if (typeof ResizeObserver !== 'undefined') {
      this.resizeObserver = new ResizeObserver(() => this.syncCompactState());
      const list = this.listRef?.nativeElement;
      if (list) {
        this.resizeObserver.observe(list);
      }
    }

    this.scheduleCompactSync();
  }

  ngOnDestroy(): void {
    this.resizeObserver?.disconnect();
  }

  protected isCurrent(itemId: string): boolean {
    return this.effectiveCurrentId$() === itemId;
  }

  protected selectItem(itemId: string): void {
    if (this.isCurrent(itemId)) {
      return;
    }
    this.itemSelect.emit(itemId);
  }

  protected hasRouterLink(item: CxBreadcrumbItem): boolean {
    return item.routerLink !== undefined;
  }

  protected hasHref(item: CxBreadcrumbItem): boolean {
    return !!item.href;
  }

  protected hasOptions(item: CxBreadcrumbItem): boolean {
    return (item.options?.length ?? 0) > 0;
  }

  protected optionMenuItems(item: CxBreadcrumbItem): CxMenuItem[] {
    const selectedOptionId = item.selectedOptionId ?? item.id;
    return (item.options ?? []).map(option => ({
      id: option.id,
      label: option.label,
      disabled: option.disabled,
      selected: option.id === selectedOptionId,
    }));
  }

  protected selectOption(item: CxBreadcrumbItem, optionId: string): void {
    if ((item.selectedOptionId ?? item.id) === optionId) {
      return;
    }
    this.optionSelect.emit({ itemId: item.id, optionId });
  }

  private scheduleCompactSync(): void {
    if (!this.viewReady) {
      return;
    }
    queueMicrotask(() => this.syncCompactState());
  }

  private syncCompactState(): void {
    const list = this.listRef?.nativeElement;
    const measureList = this.measureListRef?.nativeElement;
    if (!list || !measureList || list.clientWidth <= 0) {
      return;
    }

    const shouldCompact = this.pathItems$().length > 2 && measureList.scrollWidth > list.clientWidth + 1;
    if (this.compactState() === shouldCompact) {
      return;
    }

    this.compactState.set(shouldCompact);
    this.cdr.markForCheck();
  }
}
