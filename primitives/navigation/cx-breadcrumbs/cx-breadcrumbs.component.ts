import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output, computed, signal } from '@angular/core';
import { CxIconComponent } from '../../media/cx-icon';

export interface CxBreadcrumbItem {
  id: string;
  label: string;
}

@Component({
  selector: 'cx-breadcrumbs',
  imports: [CxIconComponent],
  templateUrl: './cx-breadcrumbs.component.html',
  styleUrl: './cx-breadcrumbs.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CxBreadcrumbsComponent {
  private readonly itemsState = signal<CxBreadcrumbItem[]>([
    { id: 'environments', label: 'Environments' },
    { id: 'staging-eu-01', label: 'Staging-EU-01' },
    { id: 'assets', label: 'Assets' },
  ]);
  private readonly currentIdState = signal<string | undefined>(undefined);
  private readonly ariaLabelState = signal('Breadcrumbs');

  @Input()
  public set ariaLabel(value: string | undefined) {
    const label = value?.trim();
    this.ariaLabelState.set(label ? label : 'Breadcrumbs');
  }

  @Input()
  public set items(value: readonly CxBreadcrumbItem[] | undefined) {
    const normalizedItems = (value ?? []).filter(item => item?.id && item?.label);
    this.itemsState.set([...normalizedItems]);
  }

  @Input()
  public set currentId(value: string | undefined) {
    this.currentIdState.set(value);
  }

  @Output() readonly itemSelect = new EventEmitter<string>();

  protected readonly ariaLabel$ = this.ariaLabelState.asReadonly();
  protected readonly items$ = this.itemsState.asReadonly();
  protected readonly effectiveCurrentId$ = computed(() => {
    const currentId = this.currentIdState();
    if (currentId && this.itemsState().some(item => item.id === currentId)) {
      return currentId;
    }
    return this.itemsState().at(-1)?.id;
  });

  protected isCurrent(itemId: string): boolean {
    return this.effectiveCurrentId$() === itemId;
  }

  protected selectItem(itemId: string): void {
    if (this.isCurrent(itemId)) {
      return;
    }
    this.itemSelect.emit(itemId);
  }
}
