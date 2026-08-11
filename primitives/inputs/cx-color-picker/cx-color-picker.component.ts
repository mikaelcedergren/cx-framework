import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  EventEmitter,
  HostListener,
  Input,
  OnDestroy,
  Output,
  ViewChild,
  computed,
  inject,
  signal,
} from '@angular/core';
import { CxValidationMessageComponent } from '../../feedback/cx-validation-message';
import { CxSpinnerComponent } from '../../feedback/cx-spinner';
import { CxIconComponent } from '../../media/cx-icon';
import { CxPopoverComponent } from '../../overlay/cx-popover';
import { CxTooltipDirective } from '../../overlay/cx-tooltip';
import {
  CxFloatingSurfaceController,
  type CxFloatingSurfaceRequest,
  type CxFloatingSurfaceViewport,
} from '../../overlay/floating-surface-controller';
import {
  type CxFieldSize,
  type CxFieldValidation,
  normalizeCxValidation,
} from '../shared/field.types';

export const CX_COLOR_PICKER_COLORS = [
  'blue',
  'cyan',
  'lime',
  'green',
  'yellow',
  'orange',
  'tangerine',
  'red',
  'pink',
  'purple',
  'violet',
] as const;

export type CxColorPickerColor = (typeof CX_COLOR_PICKER_COLORS)[number];

export type CxColorPickerOption = {
  readonly color: CxColorPickerColor;
  readonly label: string;
};

export const CX_COLOR_PICKER_PALETTE_OPTIONS: readonly CxColorPickerOption[] = [
  { color: 'blue', label: 'Blue' },
  { color: 'cyan', label: 'Cyan' },
  { color: 'lime', label: 'Lime' },
  { color: 'green', label: 'Green' },
  { color: 'yellow', label: 'Yellow' },
  { color: 'orange', label: 'Orange' },
  { color: 'tangerine', label: 'Tangerine' },
  { color: 'red', label: 'Red' },
  { color: 'pink', label: 'Pink' },
  { color: 'purple', label: 'Purple' },
  { color: 'violet', label: 'Violet' },
];

const CX_COLOR_PICKER_COLOR_SET: ReadonlySet<string> = new Set<string>(CX_COLOR_PICKER_COLORS);

@Component({
  selector: 'cx-color-picker',
  imports: [CxIconComponent, CxPopoverComponent, CxSpinnerComponent, CxTooltipDirective, CxValidationMessageComponent],
  templateUrl: './cx-color-picker.component.html',
  styleUrl: './cx-color-picker.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CxColorPickerComponent implements AfterViewInit, OnDestroy {
  private static nextId = 0;
  private readonly host = inject(ElementRef<HTMLElement>);
  private readonly colorState = signal<CxColorPickerColor | undefined>(undefined);
  private readonly disabledState = signal(false);
  private readonly loadingState = signal(false);
  private readonly clearableState = signal(false);
  private readonly showValueState = signal(true);
  private readonly validationState = signal<CxFieldValidation | undefined>(undefined);
  private readonly openState = signal(false);
  protected readonly overlay = new CxFloatingSurfaceController(
    (rect, viewport) => this.measureOverlay(rect, viewport),
    () => this.popoverRef?.surfaceElement(),
  );
  protected readonly labelId = `cx-color-picker-label-${CxColorPickerComponent.nextId}`;
  protected readonly messagesId = `cx-color-picker-messages-${CxColorPickerComponent.nextId}`;
  protected readonly popoverId = `cx-color-picker-popover-${CxColorPickerComponent.nextId++}`;

  @ViewChild('trigger', { read: ElementRef })
  private triggerRef?: ElementRef<HTMLElement>;
  @ViewChild('popover')
  private popoverRef?: CxPopoverComponent;

  @Output() readonly colorChange = new EventEmitter<CxColorPickerColor | undefined>();

  @Input() label = 'Color';
  @Input() hint: string | undefined;
  @Input() optional = false;
  @Input() ariaLabel: string | undefined;
  @Input() size: CxFieldSize = 'default';

  @Input()
  public set color(color: CxColorPickerColor | undefined) {
    this.colorState.set(this.isColor(color) ? color : undefined);
  }

  @Input()
  public set disabled(disabled: boolean | null | undefined) {
    this.disabledState.set(disabled === true);
    if (disabled) {
      this.openState.set(false);
    }
  }

  @Input()
  public set loading(loading: boolean | null | undefined) {
    this.loadingState.set(loading === true);
    if (loading) {
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

  @Input()
  public set validation(value: CxFieldValidation | null | undefined) {
    this.validationState.set(value ?? undefined);
  }

  protected readonly color$ = this.colorState.asReadonly();
  protected readonly options = CX_COLOR_PICKER_PALETTE_OPTIONS;
  protected readonly disabled$ = this.disabledState.asReadonly();
  protected readonly loading$ = this.loadingState.asReadonly();
  protected readonly clearable$ = this.clearableState.asReadonly();
  protected readonly showValue$ = this.showValueState.asReadonly();
  protected readonly open$ = this.openState.asReadonly();
  protected readonly selectedOption$ = computed(() =>
    CX_COLOR_PICKER_PALETTE_OPTIONS.find(option => option.color === this.colorState()),
  );
  protected readonly selectedColor$ = computed(() => this.selectedOption$()?.color);
  protected readonly displayText$ = computed(() => this.selectedOption$()?.label || 'None');
  protected readonly isInteractive$ = computed(() => !this.disabledState() && !this.loadingState());
  protected readonly validationMessages$ = computed(() =>
    this.disabledState() ? [] : normalizeCxValidation(this.validationState()),
  );
  protected readonly hasError$ = computed(() => this.validationMessages$().some(message => message.type === 'error'));
  protected readonly showHint$ = computed(() => !!this.hint?.trim() && this.validationMessages$().length === 0);
  protected readonly triggerAriaLabel$ = computed(() => {
    const ariaLabel = this.ariaLabel?.trim();
    if (ariaLabel) {
      return ariaLabel;
    }
    return this.label.trim() ? undefined : `Color: ${this.displayText$()}`;
  });
  protected readonly triggerAriaLabelledBy$ = computed(() => {
    if (this.ariaLabel?.trim()) {
      return undefined;
    }
    return this.label.trim() ? this.labelId : undefined;
  });
  protected readonly triggerAriaDescribedBy$ = computed(() =>
    this.showHint$() || this.validationMessages$().length > 0 ? this.messagesId : undefined,
  );

  ngAfterViewInit(): void {
    this.overlay.sync(this.triggerRef?.nativeElement);
    this.overlay.observeTrigger(this.triggerRef?.nativeElement);
  }

  ngOnDestroy(): void {
    this.overlay.destroy();
  }

  protected toggleOpen(field?: HTMLElement): void {
    if (!this.isInteractive$()) {
      return;
    }
    if (this.openState()) {
      this.openState.set(false);
      return;
    }

    this.overlay.setTrigger(field);
    this.openState.set(true);
    queueMicrotask(() => this.overlay.sync(field));
  }

  protected onTriggerKeydown(event: KeyboardEvent, field?: HTMLElement): void {
    if (!this.isInteractive$()) {
      return;
    }
    if (event.key === 'Enter' || event.key === ' ' || event.key === 'ArrowDown') {
      event.preventDefault();
      this.toggleOpen(field);
      return;
    }
    if (event.key === 'Escape') {
      this.closePopover();
    }
  }

  protected selectOption(option: CxColorPickerOption): void {
    if (!this.isInteractive$()) {
      return;
    }
    this.setColor(option.color);
  }

  protected clearSelection(): void {
    if (!this.isInteractive$() || !this.clearableState()) {
      return;
    }
    this.setColor(undefined);
  }

  protected closePopover(): void {
    this.openState.set(false);
    this.overlay.endSession();
  }

  protected isOptionSelected(option: CxColorPickerOption): boolean {
    return this.colorState() === option.color;
  }

  @HostListener('document:pointerdown', ['$event'])
  protected onDocumentPointerDown(event: PointerEvent): void {
    if (!this.openState()) {
      return;
    }
    const target = event.target;
    if (!(target instanceof Node)) {
      this.closePopover();
      return;
    }
    if (this.host.nativeElement.contains(target)) {
      return;
    }
    const surface = this.popoverRef?.surfaceElement();
    if (surface && surface.contains(target)) {
      return;
    }
    this.closePopover();
  }

  @HostListener('window:resize')
  protected onWindowResize(): void {
    if (this.openState()) {
      this.overlay.sync();
    }
  }

  private setColor(color: CxColorPickerColor | undefined): void {
    this.colorState.set(color);
    this.openState.set(false);
    this.colorChange.emit(color);
  }

  private measureOverlay(rect: DOMRect, viewport: CxFloatingSurfaceViewport): CxFloatingSurfaceRequest {
    const minWidth = Math.floor(Math.min(rect.width, viewport.width - 16));
    const optionCount = Math.max(CX_COLOR_PICKER_PALETTE_OPTIONS.length + (this.clearableState() ? 1 : 0), 1);
    const estimatedHeight = Math.min(optionCount * 48, 360);
    return {
      width: minWidth,
      minWidth,
      estimatedHeight,
      align: 'start',
    };
  }

  private isColor(color: unknown): color is CxColorPickerColor {
    return typeof color === 'string' && CX_COLOR_PICKER_COLOR_SET.has(color);
  }
}
