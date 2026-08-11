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
import { CxTooltipDirective } from '../../overlay/cx-tooltip';
import { CxCalendarComponent, type CxCalendarRange } from '../cx-calendar';
import { CxCheckboxComponent } from '../cx-checkbox';
import {
  CxTimeFieldComponent,
  formatCxTimeValue,
  parseCxTimeValue,
} from '../cx-time-field';
import {
  addCxMonths,
  compareCxDays,
  formatCxDateDisplay,
  formatCxDateSpanDisplay,
  formatCxDateValue,
  getCxTodayParts,
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
  type CxFieldSize,
  type CxRenderedValidationMessage,
  normalizeCxValidation,
} from '../shared/field.types';

export type CxDateSpanValue = {
  start?: string;
  end?: string;
};

export type CxDateSpanQuickRange = {
  id: string;
  label: string;
  start: string;
  end: string;
};

export type CxDateSpanDisabledDates = (date: Date) => boolean;
export type CxDateSpanPickerSize = CxFieldSize;
export type CxDateSpanPickerWeekStart = CxCalendarWeekStart;

@Component({
  selector: 'cx-date-span-picker',
  imports: [
    CxCalendarComponent,
    CxCheckboxComponent,
    CxIconComponent,
    CxPopoverComponent,
    CxTooltipDirective,
    CxTimeFieldComponent,
    CxValidationMessageComponent,
  ],
  templateUrl: './cx-date-span-picker.component.html',
  styleUrl: './cx-date-span-picker.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CxDateSpanPickerComponent implements AfterViewInit, OnDestroy {
  private static nextId = 0;
  private readonly host = inject(ElementRef<HTMLElement>);
  private readonly startValueState = signal<string | undefined>(undefined);
  private readonly endValueState = signal<string | undefined>(undefined);
  private readonly quickRangesState = signal<CxDateSpanQuickRange[]>([]);
  private readonly validationState = signal<CxFieldValidation | undefined>(undefined);
  private readonly openState = signal(false);
  private readonly popoverMaxWidthState = signal<number | undefined>(undefined);
  protected readonly overlay = new CxFloatingSurfaceController(
    rect => this.measureOverlay(rect),
    () => this.popoverRef?.surfaceElement(),
  );
  protected readonly popoverMaxWidth$ = this.popoverMaxWidthState.asReadonly();
  private readonly leftViewYearState = signal(getCxTodayParts().year);
  private readonly leftViewMonthState = signal(getCxTodayParts().month);
  private readonly rightViewYearState = signal(addCxMonths(getCxTodayParts().year, getCxTodayParts().month, 1).year);
  private readonly rightViewMonthState = signal(addCxMonths(getCxTodayParts().year, getCxTodayParts().month, 1).month);
  private readonly calendarPreviewEndState = signal<Date | undefined>(undefined);
  protected readonly labelId = `cx-date-span-picker-label-${CxDateSpanPickerComponent.nextId}`;
  protected readonly messagesId = `cx-date-span-picker-messages-${CxDateSpanPickerComponent.nextId}`;
  protected readonly surfaceId = `cx-date-span-picker-surface-${CxDateSpanPickerComponent.nextId++}`;
  @ViewChild('fieldButton', { read: ElementRef })
  private readonly fieldButtonRef?: ElementRef<HTMLElement>;
  @ViewChild('popover')
  private popoverRef?: CxPopoverComponent;
  @ViewChild('leftCalendar')
  private leftCalendarRef?: CxCalendarComponent;
  @ViewChild('rightCalendar')
  private rightCalendarRef?: CxCalendarComponent;
  private dialogFocusFrame: number | undefined;

  @Input() label = 'Date span';
  @Input() ariaLabel: string | undefined;
  @Input() placeholder = 'Select date range';
  @Input() hint: string | undefined;
  @Input() disabled = false;
  @Input() loading = false;
  @Input() optional = false;
  @Input() size: CxDateSpanPickerSize = 'default';
  @Input() timeEnabled = false;
  @Input() allDayEnabled = true;
  @Input() allDayStart = false;
  @Input() allDayEnd = false;
  @Input() min: number | undefined;
  @Input() max: number | undefined;
  @Input() maxSpan: number | undefined;
  @Input() disabledDates: CxDateSpanDisabledDates | undefined;
  @Input() weekStart: CxDateSpanPickerWeekStart = 'mon';
  @Input() clearable = false;
  @Input() closeOnSelect = true;

  @Input()
  public set quickRanges(value: CxDateSpanQuickRange[] | undefined) {
    this.quickRangesState.set((value ?? []).map(range => ({ ...range })));
  }

  @Input()
  public set validation(value: CxFieldValidation | null | undefined) {
    this.validationState.set(value ?? undefined);
  }

  @Input()
  public set value(value: CxDateSpanValue | undefined) {
    this.startValueState.set(value?.start?.trim() ? value.start : undefined);
    this.endValueState.set(value?.end?.trim() ? value.end : undefined);
    this.syncViewToSelection();
  }

  @Output() readonly valueChange = new EventEmitter<CxDateSpanValue>();
  @Output() readonly allDayStartChange = new EventEmitter<boolean>();
  @Output() readonly allDayEndChange = new EventEmitter<boolean>();

  protected readonly isOpen$ = this.openState.asReadonly();
  protected readonly quickRanges$ = this.quickRangesState.asReadonly();
  protected readonly startDate$ = computed(() => parseCxDateValue(this.startValueState()));
  protected readonly endDate$ = computed(() => parseCxDateValue(this.endValueState()));
  protected readonly calendarRange$ = computed<CxCalendarRange>(() => ({
    start: this.toOptionalLocalDate(this.startDate$()),
    end: this.toOptionalLocalDate(this.endDate$()),
  }));
  protected readonly calendarPreviewEnd$ = this.calendarPreviewEndState.asReadonly();
  protected readonly leftViewDate$ = computed(
    () => new Date(this.leftViewYearState(), this.leftViewMonthState() - 1, 1, 0, 0, 0, 0),
  );
  protected readonly rightViewDate$ = computed(
    () => new Date(this.rightViewYearState(), this.rightViewMonthState() - 1, 1, 0, 0, 0, 0),
  );
  protected readonly calendarDateDisabled = (date: Date): boolean =>
    !this.isDaySelectable({
      year: date.getFullYear(),
      month: date.getMonth() + 1,
      day: date.getDate(),
    });
  protected readonly displayText$ = computed(
    () => formatCxDateSpanDisplay(this.startValueState(), this.endValueState()) ?? (this.placeholder.trim() || 'Select date range'),
  );
  protected readonly showPlaceholder$ = computed(() => !this.startDate$() && !this.endDate$());
  protected readonly startTimeValue$ = computed(() => {
    const startDate = this.startDate$();
    return startDate ? formatCxTimeValue(startDate.hours, startDate.minutes) : '00:00';
  });
  protected readonly endTimeValue$ = computed(() => {
    const endDate = this.endDate$();
    return endDate ? formatCxTimeValue(endDate.hours, endDate.minutes) : '23:59';
  });
  protected readonly effectiveAllDayStart$ = computed(
    () => this.timeEnabled && this.allDayEnabled && this.allDayStart,
  );
  protected readonly effectiveAllDayEnd$ = computed(
    () => this.timeEnabled && this.allDayEnabled && this.allDayEnd,
  );
  protected readonly hasClear$ = computed(
    () =>
      this.clearable &&
      (!!this.startDate$() || !!this.endDate$()) &&
      !this.disabled &&
      !this.loading,
  );
  protected readonly validationMessages$ = computed<ReadonlyArray<CxRenderedValidationMessage>>(() =>
    this.disabled ? [] : normalizeCxValidation(this.validationState()),
  );
  protected readonly hasError$ = computed(() => this.validationMessages$().some(message => message.type === 'error'));
  protected readonly showHint$ = computed(() => !!this.hint?.trim() && this.validationMessages$().length === 0);
  protected readonly isLocked$ = () => this.disabled || this.loading;
  protected readonly isInteractive$ = () => !this.disabled && !this.loading;
  protected readonly summaryText$ = computed(() => {
    const startText = formatCxDateDisplay(this.startValueState(), this.timeEnabled);
    const endText = formatCxDateDisplay(this.endValueState(), this.timeEnabled);
    if (startText && endText) {
      return `From ${startText} to ${endText}`;
    }
    if (startText) {
      return `From ${startText}`;
    }
    if (endText) {
      return `Until ${endText}`;
    }
    return undefined;
  });

  protected get resolvedFieldAriaLabel(): string | undefined {
    const ariaLabel = this.ariaLabel?.trim();
    if (ariaLabel) {
      return ariaLabel;
    }
    if (this.label.trim()) {
      return undefined;
    }
    return this.placeholder.trim() || 'Date span';
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
    this.overlay.sync(this.fieldButtonRef?.nativeElement);
    this.overlay.observeTrigger(this.fieldButtonRef?.nativeElement, () => {
      if (this.openState()) {
        this.overlay.sync();
      }
    });
  }

  public ngOnDestroy(): void {
    this.cancelDialogFocus();
    this.overlay.destroy();
  }

  protected toggleOpen(field?: HTMLElement): void {
    if (!this.isInteractive$()) {
      return;
    }

    if (this.openState()) {
      this.closePopover();
      return;
    }

    this.openState.set(true);
    this.overlay.endSession();
    this.overlay.setTrigger(field);
    this.syncViewToSelection();
    queueMicrotask(() => {
      this.overlay.sync();
    });
    this.scheduleDialogFocus();
  }

  protected closePopover(): void {
    if (!this.openState()) {
      return;
    }
    this.cancelDialogFocus();
    this.openState.set(false);
    queueMicrotask(() => {
      const field = this.fieldButtonRef?.nativeElement;
      if (field?.isConnected && !this.isLocked$()) {
        field.focus({ preventScroll: true });
      }
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
      this.closePopover();
    }
  }

  protected onCalendarRangeChange(range: CxCalendarRange): void {
    if (!this.isInteractive$()) {
      return;
    }

    const currentStart = this.startDate$();
    const currentEnd = this.endDate$();
    const rangeStart = this.toDateParts(range.start);
    const rangeEnd = this.toDateParts(range.end);
    const nextStart = rangeStart ? this.buildBoundaryParts(rangeStart, 'start', currentStart) : undefined;
    const nextEnd = rangeEnd ? this.buildBoundaryParts(rangeEnd, 'end', currentEnd ?? currentStart) : undefined;
    this.commitRange(nextStart, nextEnd);

    if (nextEnd && this.closeOnSelect && !this.timeEnabled) {
      this.closePopover();
    }
  }

  protected onCalendarRangePreviewEndChange(value: Date | undefined): void {
    this.calendarPreviewEndState.set(value ? new Date(value.getTime()) : undefined);
  }

  protected onLeftViewDateChange(value: Date): void {
    this.leftViewYearState.set(value.getFullYear());
    this.leftViewMonthState.set(value.getMonth() + 1);
  }

  protected onRightViewDateChange(value: Date): void {
    this.rightViewYearState.set(value.getFullYear());
    this.rightViewMonthState.set(value.getMonth() + 1);
  }

  protected onQuickRangeSelect(range: CxDateSpanQuickRange): void {
    if (!this.isInteractive$()) {
      return;
    }
    const start = parseCxDateValue(range.start);
    const end = parseCxDateValue(range.end);
    if (!start || !end) {
      return;
    }
    this.commitRange(start, end);
    if (this.closeOnSelect && !this.timeEnabled) {
      this.closePopover();
    }
  }

  protected onClear(event: MouseEvent): void {
    if (!this.hasClear$()) {
      return;
    }
    event.preventDefault();
    event.stopPropagation();
    this.commitRange(undefined, undefined);
    this.setAllDayStart(false);
    this.setAllDayEnd(false);
  }

  protected onStartTimeChange(value: string | undefined): void {
    if (!this.isInteractive$()) {
      return;
    }
    const startDate = this.startDate$();
    if (!startDate) {
      return;
    }
    const parsedTime = parseCxTimeValue(value);
    if (!parsedTime) {
      return;
    }
    this.commitRange(
      {
        ...startDate,
        hours: parsedTime.hours24,
        minutes: parsedTime.minutes,
      },
      this.endDate$() ?? undefined,
    );
  }

  protected onEndTimeChange(value: string | undefined): void {
    if (!this.isInteractive$()) {
      return;
    }
    const endDate = this.endDate$();
    if (!endDate) {
      return;
    }
    const parsedTime = parseCxTimeValue(value);
    if (!parsedTime) {
      return;
    }
    this.commitRange(
      this.startDate$() ?? undefined,
      {
        ...endDate,
        hours: parsedTime.hours24,
        minutes: parsedTime.minutes,
      },
    );
  }

  protected onAllDayStartChange(value: boolean): void {
    this.setAllDayStart(value);
    if (!value) {
      return;
    }
    const startDate = this.startDate$();
    if (!startDate) {
      return;
    }
    this.commitRange({ ...startDate, hours: 0, minutes: 0 }, this.endDate$() ?? undefined);
  }

  protected onAllDayEndChange(value: boolean): void {
    this.setAllDayEnd(value);
    if (!value) {
      return;
    }
    const endDate = this.endDate$();
    if (!endDate) {
      return;
    }
    this.commitRange(this.startDate$() ?? undefined, { ...endDate, hours: 23, minutes: 59 });
  }

  protected isDaySelectable(day: Pick<CxLocalDateParts, 'year' | 'month' | 'day'>): boolean {
    const today = getCxTodayParts();
    if (typeof this.min === 'number' && compareCxDays(day, this.addDaysToParts(today, Math.trunc(this.min))) < 0) {
      return false;
    }
    if (typeof this.max === 'number' && compareCxDays(day, this.addDaysToParts(today, Math.trunc(this.max))) > 0) {
      return false;
    }
    if (this.disabledDates?.(this.toLocalDate(day))) {
      return false;
    }
    const start = this.startDate$();
    const maxSpan = typeof this.maxSpan === 'number' && this.maxSpan > 0 ? Math.floor(this.maxSpan) : undefined;
    if (maxSpan && start && !this.endDate$() && Math.abs(this.differenceInDays(day, start)) >= maxSpan) {
      return false;
    }
    return true;
  }

  protected isQuickRangeActive(range: CxDateSpanQuickRange): boolean {
    return this.startValueState() === range.start && this.endValueState() === range.end;
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
    const surface = typeof document !== 'undefined' ? document.getElementById(this.surfaceId) : null;
    if (surface && surface.contains(target)) {
      return;
    }
    if (target instanceof Element && target.closest('[data-cx-popover-surface]')) {
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

  private buildBoundaryParts(
    date: Pick<CxLocalDateParts, 'year' | 'month' | 'day'>,
    boundary: 'start' | 'end',
    fallback?: Pick<CxLocalDateParts, 'hours' | 'minutes'> | null,
  ): CxLocalDateParts {
    const isAllDay = boundary === 'start' ? this.effectiveAllDayStart$() : this.effectiveAllDayEnd$();
    return {
      year: date.year,
      month: date.month,
      day: date.day,
      hours: isAllDay ? (boundary === 'end' ? 23 : 0) : fallback?.hours ?? (boundary === 'end' && this.timeEnabled ? 23 : 0),
      minutes: isAllDay ? (boundary === 'end' ? 59 : 0) : fallback?.minutes ?? (boundary === 'end' && this.timeEnabled ? 59 : 0),
    };
  }

  private commitRange(start: CxLocalDateParts | undefined, end: CxLocalDateParts | undefined): void {
    const nextValue: CxDateSpanValue = {
      start: start ? formatCxDateValue(start, this.timeEnabled) : undefined,
      end: end ? formatCxDateValue(end, this.timeEnabled) : undefined,
    };
    this.startValueState.set(nextValue.start);
    this.endValueState.set(nextValue.end);
    this.calendarPreviewEndState.set(undefined);
    this.valueChange.emit(nextValue);
    this.syncViewToSelection();
  }

  private setAllDayStart(value: boolean): void {
    if (this.allDayStart === value) {
      return;
    }
    this.allDayStart = value;
    this.allDayStartChange.emit(value);
  }

  private setAllDayEnd(value: boolean): void {
    if (this.allDayEnd === value) {
      return;
    }
    this.allDayEnd = value;
    this.allDayEndChange.emit(value);
  }

  private syncViewToSelection(): void {
    const source = this.startDate$() ?? getCxTodayParts();
    const nextRight = addCxMonths(source.year, source.month, 1);
    this.leftViewYearState.set(source.year);
    this.leftViewMonthState.set(source.month);
    this.rightViewYearState.set(nextRight.year);
    this.rightViewMonthState.set(nextRight.month);
  }

  private scheduleDialogFocus(attempt = 0): void {
    const focusDialog = (): void => {
      this.dialogFocusFrame = undefined;
      if (!this.openState()) {
        return;
      }
      if (this.leftCalendarRef?.focusActiveDay() || this.rightCalendarRef?.focusActiveDay()) {
        return;
      }

      const fallback = this.popoverRef?.surfaceElement()?.querySelector<HTMLElement>(
        'button:not(:disabled):not([tabindex="-1"]), input:not(:disabled), [tabindex]:not([tabindex="-1"])',
      );
      if (fallback) {
        fallback.focus({ preventScroll: true });
        return;
      }
      if (attempt < 3) {
        this.scheduleDialogFocus(attempt + 1);
      }
    };

    if (typeof window === 'undefined') {
      queueMicrotask(focusDialog);
      return;
    }
    this.cancelDialogFocus();
    this.dialogFocusFrame = window.requestAnimationFrame(focusDialog);
  }

  private cancelDialogFocus(): void {
    if (typeof window !== 'undefined' && this.dialogFocusFrame !== undefined) {
      window.cancelAnimationFrame(this.dialogFocusFrame);
    }
    this.dialogFocusFrame = undefined;
  }

  private measureOverlay(_rect: DOMRect): CxFloatingSurfaceRequest {
    const controllerSize = this.readLengthToken('--controller-size', 32);
    const spaceXs = this.readLengthToken('--space-xs', 4);
    const spaceSm = this.readLengthToken('--space-sm', 8);
    const spaceMd = this.readLengthToken('--space-md', 16);
    const calendarWidth = controllerSize * 8.75;
    const calendarGap = spaceSm + spaceXs;
    const surfacePadding = spaceSm * 2;
    const quickRangeWidth = this.quickRangesState().length > 0 ? controllerSize * 4 + spaceSm + spaceXs + spaceSm : 0;
    const estimatedWidth = calendarWidth * 2 + calendarGap + surfacePadding + spaceSm + quickRangeWidth;
    this.popoverMaxWidthState.set(estimatedWidth);
    return {
      width: estimatedWidth,
      estimatedHeight: this.timeEnabled ? controllerSize * 13 : controllerSize * 10.5,
      align: 'start',
      viewportPadding: spaceMd,
      gap: spaceSm,
    };
  }

  private readLengthToken(name: string, fallback: number): number {
    const rawValue = window.getComputedStyle(this.host.nativeElement).getPropertyValue(name).trim();
    const parsedValue = Number.parseFloat(rawValue);
    return Number.isFinite(parsedValue) ? parsedValue : fallback;
  }

  private addDaysToParts(parts: Pick<CxLocalDateParts, 'year' | 'month' | 'day'>, delta: number): CxLocalDateParts {
    const next = new Date(parts.year, parts.month - 1, parts.day + delta, 12, 0, 0, 0);
    return {
      year: next.getFullYear(),
      month: next.getMonth() + 1,
      day: next.getDate(),
      hours: 0,
      minutes: 0,
    };
  }

  private differenceInDays(
    a: Pick<CxLocalDateParts, 'year' | 'month' | 'day'>,
    b: Pick<CxLocalDateParts, 'year' | 'month' | 'day'>,
  ): number {
    const aDate = this.toLocalDate(a);
    const bDate = this.toLocalDate(b);
    return Math.round((aDate.getTime() - bDate.getTime()) / (1000 * 60 * 60 * 24));
  }

  private toLocalDate(parts: Pick<CxLocalDateParts, 'year' | 'month' | 'day'>): Date {
    return new Date(parts.year, parts.month - 1, parts.day, 12, 0, 0, 0);
  }

  private toOptionalLocalDate(parts: Pick<CxLocalDateParts, 'year' | 'month' | 'day'> | null | undefined): Date | undefined {
    return parts ? this.toLocalDate(parts) : undefined;
  }

  private toDateParts(value: Date | undefined): CxLocalDateParts | undefined {
    if (!value || Number.isNaN(value.getTime())) {
      return undefined;
    }
    return {
      year: value.getFullYear(),
      month: value.getMonth() + 1,
      day: value.getDate(),
      hours: 0,
      minutes: 0,
    };
  }
}
