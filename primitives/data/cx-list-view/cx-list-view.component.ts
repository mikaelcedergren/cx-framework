import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output, signal } from '@angular/core';
import { type CxIconName } from '../../../icons/manifest';
import { CxIconComponent } from '../../media/cx-icon';

export type CxListViewDensity = 'comfortable' | 'compact';

export interface CxListViewItem {
  readonly id: string;
  readonly label: string;
  readonly description?: string;
  readonly meta?: string;
  readonly icon?: CxIconName;
  readonly disabled?: boolean;
}

@Component({
  selector: 'cx-list-view',
  imports: [CxIconComponent],
  templateUrl: './cx-list-view.component.html',
  styleUrl: './cx-list-view.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CxListViewComponent {
  private readonly itemsState = signal<readonly CxListViewItem[]>([]);
  private readonly selectedIdState = signal<string | undefined>(undefined);

  @Input() density: CxListViewDensity = 'comfortable';
  @Input() selectable = true;
  @Input() disabled = false;
  @Input() divided = true;
  @Input() emptyText = 'Nothing here yet.';

  @Input()
  public set items(value: readonly CxListViewItem[] | null | undefined) {
    this.itemsState.set(value ?? []);
  }

  @Input()
  public set selectedId(value: string | undefined) {
    this.selectedIdState.set(value);
  }

  @Output() readonly selectedIdChange = new EventEmitter<string | undefined>();

  protected readonly items$ = this.itemsState.asReadonly();
  protected readonly selectedId$ = this.selectedIdState.asReadonly();

  protected onSelect(item: CxListViewItem): void {
    if (!this.selectable || this.disabled || item.disabled) {
      return;
    }
    this.selectedIdState.set(item.id);
    this.selectedIdChange.emit(item.id);
  }
}
