import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output, computed, signal } from '@angular/core';
import { CxRadioComponent } from '../../primitives/inputs/cx-radio';

export interface CxVariantOption {
  id: string;
  name: string;
  info?: string;
  disabled?: boolean;
}

@Component({
  selector: 'cx-variant',
  imports: [CxRadioComponent],
  templateUrl: './cx-variant.component.html',
  styleUrl: './cx-variant.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CxVariantComponent {
  private readonly variantsState = signal<readonly CxVariantOption[]>([]);
  private readonly valueState = signal('');

  @Input() ariaLabel = 'Variant';

  @Input()
  public set variants(value: readonly CxVariantOption[] | null | undefined) {
    this.variantsState.set(value ?? []);
  }

  @Input()
  public set value(value: string | undefined) {
    this.valueState.set(value ?? '');
  }

  @Output() readonly valueChange = new EventEmitter<string>();

  protected readonly variants$ = this.variantsState.asReadonly();
  protected readonly value$ = computed(() => {
    const selectedValue = this.valueState();
    const variants = this.variantsState();
    if (variants.some(variant => variant.id === selectedValue)) {
      return selectedValue;
    }
    return variants.find(variant => variant.disabled !== true)?.id ?? '';
  });

  protected onVariantChange(variant: CxVariantOption, selected: boolean): void {
    if (!selected || variant.disabled) {
      return;
    }
    this.valueState.set(variant.id);
    this.valueChange.emit(variant.id);
  }
}
