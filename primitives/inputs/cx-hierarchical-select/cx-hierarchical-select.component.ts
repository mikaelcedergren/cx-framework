import { ChangeDetectionStrategy, Component, ElementRef, EventEmitter, HostListener, Input, Output, computed, inject, signal } from '@angular/core';
import { CxTreeViewComponent, type CxTreeViewItem } from '../../data/cx-tree-view';
import { CxInputComponent } from '../cx-input';
import { CxIconComponent } from '../../media/cx-icon';

export type CxHierarchicalSelectItem = CxTreeViewItem;

@Component({
  selector: 'cx-hierarchical-select',
  imports: [
    CxIconComponent,
    CxInputComponent,
    CxTreeViewComponent,
  ],
  templateUrl: './cx-hierarchical-select.component.html',
  styleUrl: './cx-hierarchical-select.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CxHierarchicalSelectComponent {
  private readonly host = inject(ElementRef<HTMLElement>);
  private readonly itemsState = signal<readonly CxHierarchicalSelectItem[]>([]);
  private readonly valueState = signal<string | undefined>(undefined);
  private readonly expandedIdsState = signal<readonly string[]>([]);
  private readonly queryState = signal('');
  private readonly openState = signal(false);
  private readonly disabledState = signal(false);
  private readonly readOnlyState = signal(false);

  @Input() placeholder = 'Select option';
  @Input() searchable = false;
  @Input() clearable = false;
  @Input() showIcons = true;

  @Input()
  public set items(value: readonly CxHierarchicalSelectItem[] | null | undefined) {
    this.itemsState.set(value ?? []);
  }

  @Input()
  public set value(value: string | undefined) {
    this.valueState.set(value);
  }

  @Input()
  public set expandedIds(value: readonly string[] | null | undefined) {
    this.expandedIdsState.set(value ?? []);
  }

  @Input()
  public set disabled(value: boolean) {
    this.disabledState.set(value === true);
    if (value === true) {
      this.openState.set(false);
    }
  }

  public get disabled(): boolean {
    return this.disabledState();
  }

  @Input()
  public set readOnly(value: boolean) {
    this.readOnlyState.set(value === true);
    if (value === true) {
      this.openState.set(false);
    }
  }

  public get readOnly(): boolean {
    return this.readOnlyState();
  }

  @Output() readonly valueChange = new EventEmitter<string | undefined>();
  @Output() readonly expandedIdsChange = new EventEmitter<readonly string[]>();

  protected readonly items$ = this.itemsState.asReadonly();
  protected readonly value$ = this.valueState.asReadonly();
  protected readonly expandedIds$ = this.expandedIdsState.asReadonly();
  protected readonly query$ = this.queryState.asReadonly();
  protected readonly open$ = this.openState.asReadonly();
  protected readonly selectedItem$ = computed(() => findTreeItem(this.itemsState(), this.valueState()));
  protected readonly visibleItems$ = computed(() => filterTreeItems(this.itemsState(), this.queryState()));

  protected displayText(): string {
    return this.selectedItem$()?.label ?? this.placeholder;
  }

  protected showPlaceholder(): boolean {
    return !this.selectedItem$();
  }

  protected isLocked(): boolean {
    return this.disabledState() || this.readOnlyState();
  }

  protected toggleOpen(): void {
    if (this.isLocked()) {
      return;
    }
    this.openState.set(!this.openState());
  }

  protected closePanel(): void {
    this.openState.set(false);
  }

  protected onQueryChange(value: string): void {
    this.queryState.set(value);
  }

  protected onExpandedIdsChange(value: readonly string[]): void {
    this.expandedIdsState.set(value);
    this.expandedIdsChange.emit(value);
  }

  protected onValueChange(value: string | undefined): void {
    this.valueState.set(value);
    this.openState.set(false);
    this.valueChange.emit(value);
  }

  protected onClear(event: MouseEvent): void {
    event.stopPropagation();
    if (this.isLocked()) {
      return;
    }
    this.onValueChange(undefined);
  }

  @HostListener('document:click', ['$event'])
  protected onDocumentClick(event: MouseEvent): void {
    if (!this.host.nativeElement.contains(event.target as Node)) {
      this.closePanel();
    }
  }
}

function findTreeItem(items: readonly CxHierarchicalSelectItem[], id: string | undefined): CxHierarchicalSelectItem | undefined {
  if (!id) {
    return undefined;
  }
  for (const item of items) {
    if (item.id === id) {
      return item;
    }
    const child = findTreeItem(item.children ?? [], id);
    if (child) {
      return child;
    }
  }
  return undefined;
}

function filterTreeItems(items: readonly CxHierarchicalSelectItem[], query: string): readonly CxHierarchicalSelectItem[] {
  const normalized = query.trim().toLowerCase();
  if (!normalized) {
    return items;
  }
  const visible: CxHierarchicalSelectItem[] = [];
  for (const item of items) {
    const children = filterTreeItems(item.children ?? [], normalized);
    const matches = item.label.toLowerCase().includes(normalized);
    if (matches || children.length > 0) {
      visible.push({ ...item, children });
    }
  }
  return visible;
}
