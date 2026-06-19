import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  EventEmitter,
  HostListener,
  Input,
  Output,
  computed,
  inject,
  signal,
} from '@angular/core';
import { CxIconComponent } from '../../media/cx-icon';

export type CxColorPickerValue =
  | 'primary'
  | 'accent'
  | 'success'
  | 'warning'
  | 'danger'
  | 'info'
  | 'blue'
  | 'cyan'
  | 'lime'
  | 'green'
  | 'yellow'
  | 'orange'
  | 'tangerine'
  | 'red'
  | 'pink'
  | 'purple'
  | 'violet';

export type CxColorPickerOption = {
  readonly value: CxColorPickerValue;
  readonly label: string;
};

export const CX_COLOR_PICKER_SEMANTIC_OPTIONS: readonly CxColorPickerOption[] = [
  { value: 'primary', label: 'Primary' },
  { value: 'accent', label: 'Accent' },
  { value: 'success', label: 'Success' },
  { value: 'warning', label: 'Warning' },
  { value: 'danger', label: 'Danger' },
  { value: 'info', label: 'Info' },
];

export const CX_COLOR_PICKER_PALETTE_OPTIONS: readonly CxColorPickerOption[] = [
  { value: 'blue', label: 'Blue' },
  { value: 'cyan', label: 'Cyan' },
  { value: 'lime', label: 'Lime' },
  { value: 'green', label: 'Green' },
  { value: 'yellow', label: 'Yellow' },
  { value: 'orange', label: 'Orange' },
  { value: 'tangerine', label: 'Tangerine' },
  { value: 'red', label: 'Red' },
  { value: 'pink', label: 'Pink' },
  { value: 'purple', label: 'Purple' },
  { value: 'violet', label: 'Violet' },
];

@Component({
  selector: 'cx-color-picker',
  imports: [CxIconComponent],
  templateUrl: './cx-color-picker.component.html',
  styleUrl: './cx-color-picker.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CxColorPickerComponent {
  private readonly host = inject(ElementRef<HTMLElement>);
  private readonly valueState = signal<CxColorPickerValue | undefined>('primary');
  private readonly optionsState = signal<readonly CxColorPickerOption[]>(CX_COLOR_PICKER_SEMANTIC_OPTIONS);
  private readonly placeholderState = signal('Select color');
  private readonly disabledState = signal(false);
  private readonly readOnlyState = signal(false);
  private readonly clearableState = signal(false);
  private readonly showValueState = signal(true);
  private readonly openState = signal(false);

  @Output() readonly valueChange = new EventEmitter<CxColorPickerValue | undefined>();

  @Input()
  public set value(value: CxColorPickerValue | undefined) {
    this.valueState.set(value);
  }

  @Input()
  public set options(options: readonly CxColorPickerOption[] | null | undefined) {
    this.optionsState.set(options?.length ? options : CX_COLOR_PICKER_SEMANTIC_OPTIONS);
  }

  @Input()
  public set placeholder(placeholder: string | null | undefined) {
    this.placeholderState.set(placeholder ?? 'Select color');
  }

  @Input()
  public set disabled(disabled: boolean | null | undefined) {
    this.disabledState.set(disabled === true);
    if (disabled) {
      this.openState.set(false);
    }
  }

  @Input()
  public set readOnly(readOnly: boolean | null | undefined) {
    this.readOnlyState.set(readOnly === true);
    if (readOnly) {
      this.openState.set(false);
    }
  }

  @Input()
  public set clearable(clearable: boolean | null | undefined) {
    this.clearableState.set(clearable === true);
  }

  @Input()
  public set showValue(showValue: boolean | null | undefined) {
    this.showValueState.set(showValue !== false);
  }

  protected readonly value$ = this.valueState.asReadonly();
  protected readonly options$ = this.optionsState.asReadonly();
  protected readonly placeholder$ = this.placeholderState.asReadonly();
  protected readonly disabled$ = this.disabledState.asReadonly();
  protected readonly readOnly$ = this.readOnlyState.asReadonly();
  protected readonly clearable$ = this.clearableState.asReadonly();
  protected readonly showValue$ = this.showValueState.asReadonly();
  protected readonly open$ = this.openState.asReadonly();
  protected readonly selectedOption$ = computed(() =>
    this.optionsState().find(option => option.value === this.valueState()),
  );
  protected readonly interactionBlocked$ = computed(() => this.disabledState() || this.readOnlyState());

  protected onTrigger(): void {
    if (this.interactionBlocked$()) {
      return;
    }

    this.openState.set(!this.openState());
  }

  protected onSelect(value: CxColorPickerValue | undefined): void {
    if (this.interactionBlocked$()) {
      return;
    }

    this.valueState.set(value);
    this.openState.set(false);
    this.valueChange.emit(value);
  }

  @HostListener('document:click', ['$event'])
  protected onDocumentClick(event: MouseEvent): void {
    const target = event.target;
    if (!(target instanceof Node) || !this.host.nativeElement.contains(target)) {
      this.openState.set(false);
    }
  }
}
