import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output, computed, signal } from '@angular/core';
import { type CxIconName } from '../../icons/manifest';
import { CxButtonComponent, type CxButtonMood } from '../../primitives/actions/cx-button';

export interface CxActionBarItem {
  id: string;
  name?: string;
  icon?: CxIconName;
  priority?: 'primary';
  mood?: CxButtonMood;
  disabled?: boolean;
  transparent?: boolean;
}

export interface CxActionBarGroup {
  id?: string;
  items: readonly CxActionBarItem[];
}

export interface CxActionBarData {
  count: number;
  menu: readonly CxActionBarGroup[];
}

@Component({
  selector: 'cx-action-bar',
  imports: [CxButtonComponent],
  templateUrl: './cx-action-bar.component.html',
  styleUrl: './cx-action-bar.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CxActionBarComponent {
  protected readonly data$ = signal<CxActionBarData | undefined>(undefined);

  @Input()
  public set data(value: CxActionBarData | null | undefined) {
    if (value == null) {
      this.data$.set(undefined);
      return;
    }
    if (!Number.isInteger(value.count) || value.count <= 0) {
      throw new Error('[cx-action-bar] data.count must be a positive integer when data is supplied.');
    }
    if (!Array.isArray(value.menu)) {
      throw new Error('[cx-action-bar] data.menu must be an array.');
    }

    const actionIds = new Set<string>();
    for (const group of value.menu) {
      if (!Array.isArray(group.items)) {
        throw new Error('[cx-action-bar] every group requires an items array.');
      }
      for (const item of group.items) {
        const id = item.id?.trim();
        if (!id) {
          throw new Error('[cx-action-bar] every action requires a non-empty id.');
        }
        if (actionIds.has(id)) {
          throw new Error(`[cx-action-bar] action ids must be unique; received "${id}" more than once.`);
        }
        actionIds.add(id);
      }
    }
    this.data$.set(value);
  }

  @Output() readonly deselectAll = new EventEmitter<void>();
  @Output() readonly action = new EventEmitter<string>();

  protected readonly visibleGroups$ = computed<ReadonlyArray<CxActionBarGroup>>(() => {
    return this.data$()?.menu.filter((group) => group.items.length > 0) ?? [];
  });

  protected get countLabel(): string {
    const count = this.data$()?.count ?? 0;
    return count === 1 ? '1 item selected' : `${count} items selected`;
  }

  protected trackGroup(index: number, group: CxActionBarGroup): string {
    return group.id ?? String(index);
  }

  protected actionText(item: CxActionBarItem): string {
    return item.priority === 'primary' || !item.icon ? item.name?.trim() ?? '' : '';
  }

  protected actionAriaLabel(item: CxActionBarItem): string {
    return item.name?.trim() || item.id.trim();
  }

  protected actionTransparent(item: CxActionBarItem): boolean {
    return item.transparent ?? true;
  }

  protected actionMood(item: CxActionBarItem): CxButtonMood {
    return item.mood ?? 'default';
  }

  protected onAction(item: CxActionBarItem): void {
    if (item.disabled) {
      return;
    }
    this.action.emit(item.id);
  }
}
