import { NgTemplateOutlet } from '@angular/common';
import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output, signal } from '@angular/core';
import { type CxIconName } from '../../../icons/manifest';
import { CxIconComponent } from '../../media/cx-icon';

export type CxTreeViewDensity = 'comfortable' | 'compact';

export interface CxTreeViewItem {
  readonly id: string;
  readonly label: string;
  readonly icon?: CxIconName;
  readonly disabled?: boolean;
  readonly children?: readonly CxTreeViewItem[];
}

@Component({
  selector: 'cx-tree-view',
  imports: [NgTemplateOutlet, CxIconComponent],
  templateUrl: './cx-tree-view.component.html',
  styleUrl: './cx-tree-view.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CxTreeViewComponent {
  private readonly itemsState = signal<readonly CxTreeViewItem[]>([]);
  private readonly selectedIdState = signal<string | undefined>(undefined);
  private readonly expandedIdsState = signal<readonly string[]>([]);
  private readonly densityState = signal<CxTreeViewDensity>('comfortable');
  private readonly selectableState = signal(true);
  private readonly disabledState = signal(false);
  private readonly showIconsState = signal(true);

  @Input()
  public set density(value: CxTreeViewDensity | undefined) {
    this.densityState.set(value ?? 'comfortable');
  }

  @Input()
  public set selectable(value: boolean | undefined) {
    this.selectableState.set(value !== false);
  }

  @Input()
  public set disabled(value: boolean | undefined) {
    this.disabledState.set(value === true);
  }

  @Input()
  public set showIcons(value: boolean | undefined) {
    this.showIconsState.set(value !== false);
  }

  @Input()
  public set items(value: readonly CxTreeViewItem[] | null | undefined) {
    this.itemsState.set(value ?? []);
  }

  @Input()
  public set selectedId(value: string | undefined) {
    this.selectedIdState.set(value);
  }

  @Input()
  public set expandedIds(value: readonly string[] | null | undefined) {
    this.expandedIdsState.set(value ?? []);
  }

  @Output() readonly selectedIdChange = new EventEmitter<string | undefined>();
  @Output() readonly expandedIdsChange = new EventEmitter<readonly string[]>();

  protected readonly items$ = this.itemsState.asReadonly();
  protected readonly selectedId$ = this.selectedIdState.asReadonly();
  protected readonly expandedIds$ = this.expandedIdsState.asReadonly();
  protected readonly density$ = this.densityState.asReadonly();
  protected readonly selectable$ = this.selectableState.asReadonly();
  protected readonly disabled$ = this.disabledState.asReadonly();
  protected readonly showIcons$ = this.showIconsState.asReadonly();

  protected hasChildren(item: CxTreeViewItem): boolean {
    return (item.children?.length ?? 0) > 0;
  }

  protected isExpanded(item: CxTreeViewItem): boolean {
    return this.expandedIdsState().includes(item.id);
  }

  protected onToggle(item: CxTreeViewItem): void {
    if (!this.hasChildren(item) || this.disabledState() || item.disabled) {
      return;
    }
    const expanded = this.expandedIdsState();
    const next = expanded.includes(item.id)
      ? expanded.filter(id => id !== item.id)
      : [...expanded, item.id];
    this.expandedIdsState.set(next);
    this.expandedIdsChange.emit(next);
  }

  protected onSelect(item: CxTreeViewItem): void {
    if (!this.selectableState() || this.disabledState() || item.disabled) {
      return;
    }
    this.selectedIdState.set(item.id);
    this.selectedIdChange.emit(item.id);
  }
}
