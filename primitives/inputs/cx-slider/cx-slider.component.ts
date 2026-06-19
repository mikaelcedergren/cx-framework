import { ChangeDetectionStrategy, Component, EventEmitter, Input, OnDestroy, Output, computed, signal } from '@angular/core';
import { CxValidationMessageComponent } from '../../feedback/cx-validation-message';
import {
  type CxValidationMessage,
  normalizeCxValidationMessages,
} from '../shared/field.types';

export type CxSliderRangeValue = readonly [number, number];
type CxSliderThumb = 'single' | 'start' | 'end';

@Component({
  selector: 'cx-slider',
  imports: [CxValidationMessageComponent],
  templateUrl: './cx-slider.component.html',
  styleUrl: './cx-slider.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CxSliderComponent implements OnDestroy {
  private static nextId = 0;
  private static readonly TOOLTIP_LINGER_MS = 1000;
  private static readonly TOOLTIP_FADE_MS = 180;
  private tooltipHideDelayTimeout: ReturnType<typeof setTimeout> | null = null;
  private tooltipTeardownTimeout: ReturnType<typeof setTimeout> | null = null;
  private readonly tooltipRenderedState = signal(false);
  private readonly tooltipOpenState = signal(false);
  private readonly minState = signal(0);
  private readonly maxState = signal(100);
  private readonly stepState = signal(1);
  private readonly valueState = signal(40);
  private readonly rangeState = signal(false);
  private readonly rangeValueState = signal<CxSliderRangeValue>([25, 75]);
  private readonly validationMessagesState = signal<ReadonlyArray<CxValidationMessage>>([]);
  private readonly showTooltipOnDragState = signal(false);
  private readonly valueFormatterState = signal<((value: number) => string) | undefined>(undefined);
  private readonly activeThumbState = signal<CxSliderThumb | null>(null);
  private readonly draggingThumbState = signal<CxSliderThumb | null>(null);
  private removePointerReleaseListeners: (() => void) | null = null;
  protected readonly labelId = `cx-slider-label-${CxSliderComponent.nextId}`;
  protected readonly messagesId = `cx-slider-messages-${CxSliderComponent.nextId++}`;

  @Input() label = 'Threshold';
  @Input() hint: string | undefined;
  @Input() disabled = false;
  @Input() optional = false;
  @Input() showValue = true;

  @Input()
  public set validationMessages(value: ReadonlyArray<CxValidationMessage> | null | undefined) {
    this.validationMessagesState.set(value ?? []);
  }

  @Input()
  public set range(value: boolean) {
    this.rangeState.set(Boolean(value));
  }

  @Input()
  public set showTooltipOnDrag(value: boolean) {
    this.showTooltipOnDragState.set(Boolean(value));
  }

  @Input()
  public set min(value: number) {
    const nextMin = Number.isFinite(value) ? value : 0;
    this.minState.set(nextMin);
    if (this.maxState() < nextMin) {
      this.maxState.set(nextMin);
    }
    this.syncValueWithinBounds();
    this.syncRangeWithinBounds();
  }

  @Input()
  public set max(value: number) {
    const nextMax = Number.isFinite(value) ? value : this.minState();
    this.maxState.set(Math.max(this.minState(), nextMax));
    this.syncValueWithinBounds();
    this.syncRangeWithinBounds();
  }

  @Input()
  public set step(value: number) {
    if (!Number.isFinite(value) || value <= 0) {
      this.stepState.set(1);
    } else {
      this.stepState.set(value);
    }
    this.syncValueWithinBounds();
    this.syncRangeWithinBounds();
  }

  @Input()
  public set value(value: number) {
    this.valueState.set(this.normalizeValue(value));
  }

  @Input()
  public set rangeValue(value: CxSliderRangeValue | readonly number[] | null | undefined) {
    if (!value || value.length < 2) {
      this.syncRangeWithinBounds();
      return;
    }

    this.rangeValueState.set(this.normalizeRangePair(Number(value[0]), Number(value[1])));
  }

  @Input()
  public set valueFormatter(fn: ((value: number) => string) | undefined) {
    this.valueFormatterState.set(fn);
  }

  @Output() readonly valueChange = new EventEmitter<number>();
  @Output() readonly rangeValueChange = new EventEmitter<CxSliderRangeValue>();

  protected readonly min$ = this.minState.asReadonly();
  protected readonly max$ = this.maxState.asReadonly();
  protected readonly step$ = this.stepState.asReadonly();
  protected readonly value$ = this.valueState.asReadonly();
  protected readonly range$ = this.rangeState.asReadonly();
  protected readonly lowerValue$ = computed(() => this.rangeValueState()[0]);
  protected readonly upperValue$ = computed(() => this.rangeValueState()[1]);
  protected readonly valuePercent$ = computed(() => this.toPercent(this.valueState()));
  protected readonly lowerPercent$ = computed(() => this.toPercent(this.lowerValue$()));
  protected readonly upperPercent$ = computed(() => this.toPercent(this.upperValue$()));
  protected readonly fillOffsetPercent$ = computed(() => (this.rangeState() ? this.lowerPercent$() : 0));
  protected readonly fillWidthPercent$ = computed(() => {
    if (this.rangeState()) {
      return Math.max(this.upperPercent$() - this.lowerPercent$(), 0);
    }
    return this.valuePercent$();
  });
  protected readonly valueLabel$ = computed(() => {
    const format = this.formatValue.bind(this);
    if (this.rangeState()) {
      return `${format(this.lowerValue$())} – ${format(this.upperValue$())}`;
    }
    return format(this.valueState());
  });
  protected readonly validationMessages$ = () =>
    this.disabled
      ? []
      : normalizeCxValidationMessages(this.validationMessagesState());
  protected readonly hasError$ = () => this.validationMessages$().some(message => message.type === 'error');
  protected readonly showHint$ = () => !!this.hint?.trim() && this.validationMessages$().length === 0;
  protected readonly showTooltipOnDrag$ = this.showTooltipOnDragState.asReadonly();
  protected readonly tooltipRendered$ = computed(() => this.tooltipRenderedState() && this.activeThumbState() !== null);
  protected readonly tooltipOpen$ = this.tooltipOpenState.asReadonly();
  protected readonly tooltipLabel$ = computed(() => {
    switch (this.activeThumbState()) {
      case 'start':
        return this.formatValue(this.lowerValue$());
      case 'end':
        return this.formatValue(this.upperValue$());
      case 'single':
      default:
        return this.formatValue(this.valueState());
    }
  });
  protected readonly tooltipPercent$ = computed(() => {
    switch (this.activeThumbState()) {
      case 'start':
        return this.lowerPercent$();
      case 'end':
        return this.upperPercent$();
      case 'single':
      default:
        return this.valuePercent$();
    }
  });

  protected get resolvedSliderAriaLabel(): string | undefined {
    if (this.label.trim()) {
      return undefined;
    }
    return 'Slider';
  }

  protected get resolvedSliderAriaLabelledBy(): string | undefined {
    return this.label.trim() ? this.labelId : undefined;
  }

  protected get resolvedSliderAriaDescribedBy(): string | undefined {
    const ids: string[] = [];
    if (this.showHint$() || this.validationMessages$().length > 0) {
      ids.push(this.messagesId);
    }
    return ids.length > 0 ? ids.join(' ') : undefined;
  }

  protected get resolvedMinThumbAriaLabel(): string | undefined {
    if (this.label.trim()) {
      return undefined;
    }
    return 'Minimum value';
  }

  protected get resolvedMaxThumbAriaLabel(): string | undefined {
    if (this.label.trim()) {
      return undefined;
    }
    return 'Maximum value';
  }

  ngOnDestroy(): void {
    this.clearTooltipTimers();
    this.detachPointerReleaseListeners();
  }

  protected onSingleInput(event: Event): void {
    if (this.disabled) {
      return;
    }

    const target = event.target;
    if (!(target instanceof HTMLInputElement)) {
      return;
    }

    const nextValue = this.normalizeValue(target.valueAsNumber);
    this.valueState.set(nextValue);
    this.valueChange.emit(nextValue);
    this.showTooltipForThumb('single', this.draggingThumbState() === 'single');
  }

  protected onRangeInput(event: Event, thumb: 'start' | 'end'): void {
    if (this.disabled) {
      return;
    }

    const target = event.target;
    if (!(target instanceof HTMLInputElement)) {
      return;
    }

    const current = this.rangeValueState();
    const nextValue = this.normalizeValue(target.valueAsNumber);
    const nextRange: CxSliderRangeValue = thumb === 'start'
      ? [Math.min(nextValue, current[1]), current[1]]
      : [current[0], Math.max(nextValue, current[0])];

    this.rangeValueState.set(nextRange);
    this.rangeValueChange.emit(nextRange);
    this.showTooltipForThumb(thumb, this.draggingThumbState() === thumb);
  }

  protected onThumbFocus(thumb: CxSliderThumb): void {
    if (!this.showTooltipOnDragState() || this.disabled) {
      return;
    }
    this.showTooltipForThumb(thumb, this.draggingThumbState() === thumb);
  }

  protected onThumbPointerDown(thumb: CxSliderThumb): void {
    if (!this.showTooltipOnDragState() || this.disabled) {
      return;
    }

    this.draggingThumbState.set(thumb);
    this.attachPointerReleaseListeners();
    this.showTooltipForThumb(thumb, true);
  }

  protected onThumbBlur(): void {
    if (this.draggingThumbState() !== null) {
      return;
    }
    this.scheduleTooltipHide();
  }

  private onThumbPointerRelease(): void {
    if (this.draggingThumbState() === null) {
      return;
    }

    this.draggingThumbState.set(null);
    this.detachPointerReleaseListeners();
    this.scheduleTooltipHide();
  }

  private showTooltipForThumb(thumb: CxSliderThumb, persistWhileDragging = false): void {
    if (!this.showTooltipOnDragState() || this.disabled) {
      return;
    }

    this.clearTooltipTimers();
    this.activeThumbState.set(thumb);
    this.tooltipRenderedState.set(true);
    this.tooltipOpenState.set(false);
    if (typeof window !== 'undefined') {
      window.requestAnimationFrame(() => {
        this.tooltipOpenState.set(true);
      });
    } else {
      this.tooltipOpenState.set(true);
    }

    if (!persistWhileDragging) {
      this.scheduleTooltipHide();
    }
  }

  private scheduleTooltipHide(): void {
    this.clearTooltipTimers();
    this.tooltipHideDelayTimeout = setTimeout(() => {
      this.tooltipOpenState.set(false);
      this.tooltipTeardownTimeout = setTimeout(() => {
        this.tooltipRenderedState.set(false);
        this.activeThumbState.set(null);
        this.tooltipTeardownTimeout = null;
      }, CxSliderComponent.TOOLTIP_FADE_MS);
      this.tooltipHideDelayTimeout = null;
    }, CxSliderComponent.TOOLTIP_LINGER_MS);
  }

  private clearTooltipTimers(): void {
    if (this.tooltipHideDelayTimeout !== null) {
      clearTimeout(this.tooltipHideDelayTimeout);
      this.tooltipHideDelayTimeout = null;
    }
    if (this.tooltipTeardownTimeout !== null) {
      clearTimeout(this.tooltipTeardownTimeout);
      this.tooltipTeardownTimeout = null;
    }
  }

  private attachPointerReleaseListeners(): void {
    if (this.removePointerReleaseListeners || typeof window === 'undefined') {
      return;
    }

    const handleRelease = () => this.onThumbPointerRelease();
    window.addEventListener('pointerup', handleRelease);
    window.addEventListener('pointercancel', handleRelease);
    this.removePointerReleaseListeners = () => {
      window.removeEventListener('pointerup', handleRelease);
      window.removeEventListener('pointercancel', handleRelease);
      this.removePointerReleaseListeners = null;
    };
  }

  private detachPointerReleaseListeners(): void {
    this.removePointerReleaseListeners?.();
  }

  private syncValueWithinBounds(): void {
    this.valueState.set(this.normalizeValue(this.valueState()));
  }

  private syncRangeWithinBounds(): void {
    const current = this.rangeValueState();
    this.rangeValueState.set(this.normalizeRangePair(current[0], current[1]));
  }

  private formatValue(value: number): string {
    const formatter = this.valueFormatterState();
    return formatter ? formatter(value) : `${value}`;
  }

  private normalizeRangePair(start: number, end: number): CxSliderRangeValue {
    let nextStart = this.normalizeValue(start);
    let nextEnd = this.normalizeValue(end);
    if (nextStart > nextEnd) {
      [nextStart, nextEnd] = [nextEnd, nextStart];
    }
    return [nextStart, nextEnd];
  }

  private normalizeValue(value: number): number {
    const min = this.minState();
    const max = this.maxState();
    const step = this.stepState();
    const candidate = Number.isFinite(value) ? value : min;
    const clamped = Math.min(Math.max(candidate, min), max);
    const rounded = Math.round((clamped - min) / step) * step + min;
    const precision = this.getStepPrecision(step);
    const normalized = Number(rounded.toFixed(precision));
    return Math.min(Math.max(normalized, min), max);
  }

  private toPercent(value: number): number {
    const min = this.minState();
    const max = this.maxState();
    if (max <= min) {
      return 0;
    }
    return ((value - min) / (max - min)) * 100;
  }

  private getStepPrecision(step: number): number {
    const stepText = `${step}`;
    const decimalIndex = stepText.indexOf('.');
    return decimalIndex >= 0 ? stepText.length - decimalIndex - 1 : 0;
  }
}
