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
import { CxIconComponent } from '../../media/cx-icon';
import { CxPopoverComponent } from '../../overlay/cx-popover';
import { CxCalendarComponent } from '../cx-calendar';
import { CxCheckboxComponent } from '../cx-checkbox';
import {
  CxTimeFieldComponent,
  formatCxTimeValue,
  parseCxTimeValue,
} from '../cx-time-field';
import {
  compareCxDays,
  formatCxDateDisplay,
  formatCxDateValue,
  parseCxDateValue,
  type CxCalendarWeekStart,
  type CxLocalDateParts,
} from '../shared/cx-date.utils';
import {
  CxFloatingSurfaceController,
  type CxFloatingSurfaceRequest,
} from '../../overlay/floating-surface-controller';
import {
  type CxFieldValidation,
  type CxRenderedValidationMessage,
  normalizeCxValidation,
} from '../shared/field.types';

export type CxDatePickerSize = 'small' | 'default' | 'large';
export type CxDatePickerWeekStart = CxCalendarWeekStart;

@Component({
  selector: 'cx-date-picker',
  imports: [
    CxCalendarComponent,
    CxCheckboxComponent,
    CxIconComponent,
    CxPopoverComponent,
    CxTimeFieldComponent,
    CxValidationMessageComponent,
  ],
  templateUrl: './cx-date-picker.component.html',
  styleUrl: './cx-date-picker.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CxDatePickerComponent implements AfterViewInit, OnDestroy {
  private static nextId = 0;
  private readonly host = inject(ElementRef<HTMLElement>);
  private readonly valueState = signal<string | undefined>(undefined);
  private readonly validationState = signal<CxFieldValidation | undefined>(undefined);
  private readonly openState = signal(false);
  private readonly focusedState = signal(false);
  protected readonly overlay = new CxFloatingSurfaceController(rect => this.measureOverlay(rect));
  protected readonly labelId = `cx-date-picker-label-${CxDatePickerComponent.nextId}`;
  protected readonly messagesId = `cx-date-picker-messages-${CxDatePickerComponent.nextId}`;
  protected readonly surfaceId = `cx-date-picker-surface-${CxDatePickerComponent.nextId++}`;
  @ViewChild('field', { read: ElementRef })
  private readonly fieldRef?: ElementRef<HTMLElement>;

  @Input() label = 'Date';
  @Input() hint: string | undefined;
  @Input() optional = false;
  @Input() ariaLabel: string | undefined;
  @Input() placeholder = 'Select date';
  @Input() size: CxDatePickerSize = 'default';
  @Input() weekStart: CxDatePickerWeekStart = 'mon';
  @Input() yearRange = 50;
  @Input() min: string | undefined;
  @Input() max: string | undefined;
  @Input() timeEnabled = false;
  @Input() allDayEnabled = false;
  @Input() allDay = false;
  @Input() disabled = false;
  @Input() loading = false;
  @Input() clearable = false;

  @Input()
  public set validation(value: CxFieldValidation | null | undefined) {
    this.validationState.set(value ?? undefined);
  }

  @Input()
  public set value(value: string | undefined) {
    this.valueState.set(value?.trim() ? value : undefined);
  }

  @Output() readonly valueChange = new EventEmitter<string | undefined>();
  @Output() readonly clear = new EventEmitter<void>();
  @Output() readonly focusChange = new EventEmitter<boolean>();

  protected readonly isOpen$ = this.openState.asReadonly();
  protected readonly focused$ = this.focusedState.asReadonly();
  protected readonly selectedDate$ = computed(() => parseCxDateValue(this.valueState()));
  protected readonly minDate$ = computed(() => parseCxDateValue(this.min));
  protected readonly maxDate$ = computed(() => parseCxDateValue(this.max));
  protected readonly calendarValue$ = computed(() => this.toLocalDate(this.selectedDate$()));
  protected readonly calendarMin$ = computed(() => this.toLocalDate(this.minDate$()));
  protected readonly calendarMax$ = computed(() => this.toLocalDate(this.maxDate$()));
  protected readonly effectiveAllDay$ = computed(() => this.timeEnabled && this.allDayEnabled && this.allDay);
  protected readonly displayText$ = computed(
    () =>
      formatCxDateDisplay(this.valueState(), this.timeEnabled && !this.effectiveAllDay$()) ??
      (this.placeholder.trim() || 'Select date'),
  );
  protected readonly showPlaceholder$ = computed(() => !this.selectedDate$());
  protected readonly selectedTimeValue$ = computed(() => {
    const selectedDate = this.selectedDate$();
    if (!selectedDate) {
      return '00:00';
    }
    return formatCxTimeValue(selectedDate.hours, selectedDate.minutes);
  });
  protected readonly hasClear$ = computed(
    () => this.clearable && !!this.selectedDate$() && !this.disabled && !this.loading,
  );
  protected readonly outOfRange$ = computed(() => {
    const selectedDate = this.selectedDate$();
    if (!selectedDate) {
      return false;
    }
    return this.isOutsideRange(selectedDate);
  });
  protected readonly validationMessages$ = computed<ReadonlyArray<CxRenderedValidationMessage>>(() => {
    if (this.disabled) {
      return [];
    }
    const explicitValidation = normalizeCxValidation(this.validationState());
    if (explicitValidation.length > 0) {
      return explicitValidation;
    }
    if (this.outOfRange$()) {
      return [{
        id: 'error:Date must be within the allowed range.',
        type: 'error',
        message: 'Date must be within the allowed range.',
      }];
    }
    return [];
  });
  protected readonly hasError$ = computed(() => this.validationMessages$().some(message => message.type === 'error'));
  protected readonly showHint$ = computed(() => !!this.hint?.trim() && this.validationMessages$().length === 0);
  protected readonly isLocked$ = () => this.disabled || this.loading;
  protected readonly isInteractive$ = () => !this.disabled && !this.loading;

  protected get resolvedFieldAriaLabel(): string | undefined {
    const ariaLabel = this.ariaLabel?.trim();
    if (ariaLabel) {
      return ariaLabel;
    }
    if (this.label.trim()) {
      return undefined;
    }
    return 'Date';
  }

  protected get resolvedFieldAriaLabelledBy(): string | undefined {
    if (this.ariaLabel?.trim()) {
      return undefined;
    }
    return this.label.trim() ? this.labelId : undefined;
  }

  protected get resolvedFieldAriaDescribedBy(): string | undefined {
    return this.showHint$() || this.validationMessages$().length > 0 ? this.messagesId : undefined;
  }

  public ngAfterViewInit(): void {
    this.overlay.sync(this.fieldRef?.nativeElement);
    this.overlay.observeTrigger(this.fieldRef?.nativeElement, () => {
      if (this.openState()) {
        this.overlay.sync();
      }
    });
  }

  public ngOnDestroy(): void {
    this.overlay.destroy();
  }

  protected toggleOpen(field?: HTMLElement): void {
    if (!this.isInteractive$()) {
      return;
    }

    const nextOpen = !this.openState();
    this.openState.set(nextOpen);
    if (!nextOpen) {
      return;
    }

    this.overlay.setTrigger(field);
    queueMicrotask(() => {
      this.overlay.sync();
    });
  }

  protected onFieldKeydown(event: KeyboardEvent, field?: HTMLElement): void {
    if (!this.isInteractive$()) {
      return;
    }
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      this.toggleOpen(field);
      return;
    }
    if (event.key === 'Escape') {
      this.openState.set(false);
    }
  }

  protected onFieldFocus(focused: boolean): void {
    if (this.disabled || this.loading || this.focusedState() === focused) {
      return;
    }
    this.focusedState.set(focused);
    this.focusChange.emit(focused);
  }

  protected onClear(event: MouseEvent): void {
    if (!this.hasClear$()) {
      return;
    }
    event.preventDefault();
    event.stopPropagation();
    this.valueState.set(undefined);
    this.openState.set(false);
    this.valueChange.emit(undefined);
    this.clear.emit();
  }

  protected onCalendarValueChange(value: Date | undefined): void {
    if (!this.isInteractive$() || !value) {
      return;
    }

    const currentValue = this.selectedDate$();
    const nextValue: CxLocalDateParts = {
      year: value.getFullYear(),
      month: value.getMonth() + 1,
      day: value.getDate(),
      hours: currentValue?.hours ?? 0,
      minutes: currentValue?.minutes ?? 0,
    };
    if (this.isOutsideRange(nextValue)) {
      return;
    }
    this.commitValue(nextValue);

    if (!this.timeEnabled) {
      this.openState.set(false);
    }
  }

  protected onTimeValueChange(value: string | undefined): void {
    if (!this.isInteractive$()) {
      return;
    }
    const selectedDate = this.selectedDate$();
    if (!selectedDate) {
      return;
    }
    const parsedTime = parseCxTimeValue(value);
    if (!parsedTime) {
      return;
    }
    this.commitValue({
      ...selectedDate,
      hours: parsedTime.hours24,
      minutes: parsedTime.minutes,
    });
  }

  protected onAllDayChange(allDay: boolean): void {
    if (!this.isInteractive$()) {
      return;
    }
    this.allDay = allDay;
    const selectedDate = this.selectedDate$();
    if (selectedDate) {
      this.commitValue(selectedDate);
    }
  }

  protected isOutsideRange(day: Pick<CxLocalDateParts, 'year' | 'month' | 'day'>): boolean {
    const target: CxLocalDateParts = { year: day.year, month: day.month, day: day.day, hours: 0, minutes: 0 };
    const min = this.minDate$();
    const max = this.maxDate$();
    return (min !== null && compareCxDays(target, min) < 0) || (max !== null && compareCxDays(target, max) > 0);
  }

  @HostListener('document:pointerdown', ['$event'])
  protected onDocumentPointerDown(event: PointerEvent): void {
    if (!this.openState()) {
      return;
    }
    const target = event.target;
    if (!(target instanceof Node)) {
      this.openState.set(false);
      return;
    }
    if (this.host.nativeElement.contains(target)) {
      return;
    }
    const surface = typeof document !== 'undefined' ? document.getElementById(this.surfaceId) : null;
    if (surface && surface.contains(target)) {
      return;
    }
    if (target instanceof Element && target.closest('[data-cx-popover-surface]')) {
      return;
    }
    this.openState.set(false);
  }

  @HostListener('document:keydown.escape')
  protected onEscapeKey(): void {
    if (this.openState()) {
      this.openState.set(false);
    }
  }

  @HostListener('window:resize')
  protected onWindowResize(): void {
    if (this.openState()) {
      this.overlay.sync();
    }
  }

  private commitValue(parts: CxLocalDateParts): void {
    const nextValue = formatCxDateValue(parts, this.timeEnabled && !this.effectiveAllDay$());
    this.valueState.set(nextValue);
    this.valueChange.emit(nextValue);
  }

  private measureOverlay(_rect: DOMRect): CxFloatingSurfaceRequest {
    const controllerSize = this.readLengthToken('--controller-size', 32);
    const viewportPadding = this.readLengthToken('--space-md', 16);
    const gap = this.readLengthToken('--space-sm', 8);
    return {
      width: controllerSize * 9.25,
      estimatedHeight: this.timeEnabled ? controllerSize * 12.25 : controllerSize * 9.5,
      align: 'start',
      viewportPadding,
      gap,
    };
  }

  private readLengthToken(name: string, fallback: number): number {
    const rawValue = window.getComputedStyle(this.host.nativeElement).getPropertyValue(name).trim();
    const parsedValue = Number.parseFloat(rawValue);
    return Number.isFinite(parsedValue) ? parsedValue : fallback;
  }

  private toLocalDate(parts: CxLocalDateParts | null | undefined): Date | undefined {
    return parts ? new Date(parts.year, parts.month - 1, parts.day, 0, 0, 0, 0) : undefined;
  }
}
