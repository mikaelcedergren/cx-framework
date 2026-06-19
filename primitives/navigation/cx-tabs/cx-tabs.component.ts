import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  Output,
  QueryList,
  ViewChildren,
  signal,
} from '@angular/core';

export interface CxTabItem {
  id: string;
  label: string;
}

export type CxTabsVariant = 'default' | 'transparent';

@Component({
  selector: 'cx-tabs',
  templateUrl: './cx-tabs.component.html',
  styleUrl: './cx-tabs.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CxTabsComponent {
  @ViewChildren('tabButton') private readonly tabButtons!: QueryList<ElementRef<HTMLButtonElement>>;

  private readonly selectedIdState = signal('work');
  private readonly variantState = signal<CxTabsVariant>('default');

  @Input() ariaLabel = 'Tabs';
  @Input() items: CxTabItem[] = [
    { id: 'work', label: 'Work' },
    { id: 'procrastinate', label: 'Procrastinate' },
    { id: 'panic', label: 'Panic' },
  ];

  @Input()
  public set selectedId(value: string | undefined) {
    const nextValue = value && this.items.some(item => item.id === value)
      ? value
      : this.items[0]?.id ?? 'work';
    this.selectedIdState.set(nextValue);
  }

  @Input()
  public set variant(value: CxTabsVariant | undefined) {
    this.variantState.set(value === 'transparent' ? 'transparent' : 'default');
  }

  @Output() readonly selectedIdChange = new EventEmitter<string>();

  protected readonly selectedId$ = this.selectedIdState.asReadonly();
  protected readonly variant$ = this.variantState.asReadonly();

  protected select(id: string): void {
    if (this.selectedIdState() === id) {
      return;
    }
    this.selectedIdState.set(id);
    this.selectedIdChange.emit(id);
  }

  protected onKeydown(event: KeyboardEvent, index: number): void {
    if (!['ArrowRight', 'ArrowLeft', 'ArrowDown', 'ArrowUp', 'Home', 'End', ' ', 'Enter'].includes(event.key)) {
      return;
    }

    event.preventDefault();

    if (event.key === ' ' || event.key === 'Enter') {
      const item = this.items[index];
      if (item) {
        this.select(item.id);
      }
      return;
    }

    const maxIndex = this.items.length - 1;
    if (maxIndex < 0) {
      return;
    }

    let nextIndex = index;
    if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
      nextIndex = index >= maxIndex ? 0 : index + 1;
    } else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
      nextIndex = index <= 0 ? maxIndex : index - 1;
    } else if (event.key === 'Home') {
      nextIndex = 0;
    } else if (event.key === 'End') {
      nextIndex = maxIndex;
    }

    const nextItem = this.items[nextIndex];
    if (!nextItem) {
      return;
    }

    this.select(nextItem.id);
    this.tabButtons.get(nextIndex)?.nativeElement.focus();
  }
}
