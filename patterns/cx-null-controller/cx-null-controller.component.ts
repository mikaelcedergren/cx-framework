import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output, computed, signal } from '@angular/core';
import { CxRadioComponent } from '../../primitives/inputs/cx-radio';
import { CxSwitchComponent } from '../../primitives/inputs/cx-switch';

export type CxNullControllerOption = {
  id: string;
  label: string;
  hint?: string;
};

type CxResolvedNullControllerOption = {
  id: string;
  label: string;
  hint?: string;
};

@Component({
  selector: 'cx-null-controller',
  imports: [CxSwitchComponent, CxRadioComponent],
  templateUrl: './cx-null-controller.component.html',
  styleUrl: './cx-null-controller.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CxNullControllerComponent {
  private readonly optionsState = signal<CxResolvedNullControllerOption[]>([]);
  private readonly enabledState = signal(false);
  private readonly selectedIdState = signal('');

  @Input() label = '';
  @Input() description: string | undefined;
  @Input() switchLabel = 'Override';
  @Input() disabled = false;

  @Input()
  public set options(value: readonly CxNullControllerOption[] | null | undefined) {
    const nextOptions: CxResolvedNullControllerOption[] = [];
    for (const option of value ?? []) {
      const id = option.id.trim();
      const label = option.label.trim();
      if (!id || !label) {
        continue;
      }
      nextOptions.push({
        id,
        label,
        hint: option.hint?.trim() || undefined,
      });
    }
    this.optionsState.set(nextOptions);
    this.ensureValidSelection();
  }

  @Input()
  public set enabled(value: boolean) {
    this.enabledState.set(Boolean(value));
  }

  @Input()
  public set selectedId(value: string | undefined) {
    this.selectedIdState.set(value?.trim() || '');
    this.ensureValidSelection();
  }

  @Output() readonly enabledChange = new EventEmitter<boolean>();
  @Output() readonly selectedIdChange = new EventEmitter<string>();

  protected readonly options$ = this.optionsState.asReadonly();
  protected readonly enabled$ = this.enabledState.asReadonly();
  protected readonly hasLabel$ = computed(() => this.label.trim().length > 0);
  protected readonly hasDescription$ = computed(() => (this.description?.trim().length ?? 0) > 0);
  protected readonly radiosDisabled$ = computed(() => this.disabled || !this.enabledState());

  protected isSelected(optionId: string): boolean {
    return this.enabledState() && this.selectedIdState() === optionId;
  }

  protected onEnabledChange(value: boolean): void {
    if (this.disabled) {
      return;
    }
    this.enabledState.set(value);
    this.enabledChange.emit(value);
  }

  protected onOptionCheckedChange(optionId: string, checked: boolean): void {
    if (!checked || this.radiosDisabled$() || this.selectedIdState() === optionId) {
      return;
    }
    this.selectedIdState.set(optionId);
    this.selectedIdChange.emit(optionId);
  }

  private ensureValidSelection(): void {
    const selectedId = this.selectedIdState();
    if (!selectedId) {
      return;
    }
    if (this.optionsState().some(option => option.id === selectedId)) {
      return;
    }
    this.selectedIdState.set(this.optionsState()[0]?.id ?? '');
  }
}
