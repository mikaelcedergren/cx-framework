import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output, computed, signal } from '@angular/core';
import { type CxIconName } from '../../icons/manifest';
import { CxButtonComponent, type CxButtonVariant } from '../../primitives/actions/cx-button';

export interface CxActionBarItem {
  id: string;
  name?: string;
  label?: string;
  icon?: CxIconName;
  priority?: 'primary';
  type?: CxButtonVariant;
  variant?: CxButtonVariant;
  disabled?: boolean;
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
    this.data$.set(value ?? undefined);
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
    return item.priority === 'primary' ? item.name ?? item.label ?? '' : '';
  }

  protected actionAriaLabel(item: CxActionBarItem): string {
    return item.name ?? item.label ?? item.id;
  }

  protected actionVariant(item: CxActionBarItem): CxButtonVariant {
    return item.type ?? item.variant ?? 'transparent';
  }

  protected onAction(item: CxActionBarItem): void {
    if (item.disabled) {
      return;
    }
    this.action.emit(item.id);
  }
}
