import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  Output,
  QueryList,
  ViewChildren,
  computed,
  signal,
} from '@angular/core';

let nextCxVariantId = 0;

export interface CxVariantOption {
  id: string;
  label: string;
}

@Component({
  selector: 'cx-variant',
  templateUrl: './cx-variant.component.html',
  styleUrl: './cx-variant.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CxVariantComponent {
  @ViewChildren('tabButton') private readonly tabButtons!: QueryList<ElementRef<HTMLButtonElement>>;

  protected readonly panelId = `cx-variant-panel-${nextCxVariantId++}`;
  private readonly variantsState = signal<readonly CxVariantOption[]>([]);
  private readonly selectedVariantState = signal('');

  @Input()
  public set variants(value: readonly CxVariantOption[] | null | undefined) {
    this.variantsState.set(value ?? []);
  }

  @Input()
  public set selectedVariant(value: string | undefined) {
    this.selectedVariantState.set(value ?? '');
  }

  @Output() readonly selectedVariantChange = new EventEmitter<string>();

  protected readonly variants$ = this.variantsState.asReadonly();
  protected readonly selectedVariant$ = computed(() => {
    const selectedVariant = this.selectedVariantState();
    const variants = this.variantsState();
    if (variants.some(variant => variant.id === selectedVariant)) {
      return selectedVariant;
    }
    return variants[0]?.id ?? '';
  });
  protected readonly selectedVariantIndex$ = computed(() =>
    this.variantsState().findIndex(variant => variant.id === this.selectedVariant$()),
  );
  protected readonly selectedTabId$ = computed(() => {
    const index = this.selectedVariantIndex$();
    return index >= 0 ? this.tabId(index) : null;
  });

  protected selectVariant(variantId: string): void {
    if (this.selectedVariantState() === variantId) {
      return;
    }
    this.selectedVariantState.set(variantId);
    this.selectedVariantChange.emit(variantId);
  }

  protected tabId(index: number): string {
    return `${this.panelId}-tab-${index}`;
  }

  protected onTabKeydown(event: KeyboardEvent, index: number): void {
    if (!['ArrowRight', 'ArrowLeft', 'ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) {
      return;
    }

    event.preventDefault();

    const maxIndex = this.variantsState().length - 1;
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

    const nextVariant = this.variantsState()[nextIndex];
    if (!nextVariant) {
      return;
    }

    this.selectVariant(nextVariant.id);
    this.tabButtons.get(nextIndex)?.nativeElement.focus();
  }
}
