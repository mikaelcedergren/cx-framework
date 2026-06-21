import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output, computed, signal } from '@angular/core';
import { CxTextFieldComponent } from '../../primitives/inputs/cx-text-field';
import { CxRadioComponent } from '../../primitives/inputs/cx-radio';

export type CxRadioRevealOption = {
  id: string;
  label: string;
  hint?: string;
  revealPlaceholder?: string;
  revealHint?: string;
};

type CxResolvedRadioRevealOption = {
  id: string;
  label: string;
  hint?: string;
  revealPlaceholder?: string;
  revealHint?: string;
};

@Component({
  selector: 'cx-radio-reveal',
  imports: [CxTextFieldComponent, CxRadioComponent],
  templateUrl: './cx-radio-reveal.component.html',
  styleUrl: './cx-radio-reveal.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CxRadioRevealComponent {
  private readonly optionsState = signal<CxResolvedRadioRevealOption[]>([]);
  private readonly selectedIdState = signal('');
  protected readonly revealValueState = signal('');

  @Input() label = '';
  @Input() disabled = false;

  @Input()
  public set options(value: readonly CxRadioRevealOption[] | null | undefined) {
    const nextOptions: CxResolvedRadioRevealOption[] = [];
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
        revealPlaceholder: option.revealPlaceholder?.trim() || undefined,
        revealHint: option.revealHint?.trim() || undefined,
      });
    }
    this.optionsState.set(nextOptions);
    this.ensureValidSelection();
  }

  @Input()
  public set selectedId(value: string | undefined) {
    this.selectedIdState.set(value?.trim() || '');
    this.ensureValidSelection();
  }

  @Input()
  public set revealValue(value: string | undefined) {
    this.revealValueState.set(value ?? '');
  }

  @Output() readonly selectedIdChange = new EventEmitter<string>();
  @Output() readonly revealValueChange = new EventEmitter<string>();

  protected readonly options$ = this.optionsState.asReadonly();
  protected readonly selectedId$ = this.selectedIdState.asReadonly();
  protected readonly selectedRevealOption$ = computed(() => {
    const selectedId = this.selectedIdState();
    if (!selectedId) {
      return undefined;
    }
    return this.optionsState().find(option => option.id === selectedId && (!!option.revealPlaceholder || !!option.revealHint));
  });
  protected readonly hasLabel$ = computed(() => this.label.trim().length > 0);

  protected onOptionCheckedChange(optionId: string, checked: boolean): void {
    if (!checked || this.disabled || this.selectedIdState() === optionId) {
      return;
    }
    this.selectedIdState.set(optionId);
    this.selectedIdChange.emit(optionId);
  }

  protected onRevealValueChange(value: string): void {
    this.revealValueState.set(value);
    this.revealValueChange.emit(value);
  }

  protected getRevealAriaLabel(option: CxResolvedRadioRevealOption): string {
    return option.revealPlaceholder || option.label;
  }

  private ensureValidSelection(): void {
    const selectedId = this.selectedIdState();
    if (!selectedId) {
      return;
    }
    if (this.optionsState().some(option => option.id === selectedId)) {
      return;
    }
    this.selectedIdState.set('');
  }
}
