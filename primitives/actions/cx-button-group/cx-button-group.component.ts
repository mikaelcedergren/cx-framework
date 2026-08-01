import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  EventEmitter,
  HostBinding,
  Input,
  OnDestroy,
  Output,
  QueryList,
  ViewChild,
  ViewChildren,
  computed,
  signal,
} from '@angular/core';
import { Subscription } from 'rxjs';
import { type CxIconName } from '../../../icons/manifest';
import { CxIconComponent } from '../../media/cx-icon';

export interface CxButtonGroupOption {
  id: string;
  label?: string;
  icon?: CxIconName;
  disabled?: boolean;
}

export interface CxButtonGroupButton {
  id: string;
  name: string;
  icon?: CxIconName;
  disabled: boolean;
  selected: boolean;
}

export type CxButtonGroupSize = 'default' | 'small';

@Component({
  selector: 'cx-button-group',
  imports: [CxIconComponent],
  templateUrl: './cx-button-group.component.html',
  styleUrl: './cx-button-group.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CxButtonGroupComponent implements AfterViewInit, OnDestroy {
  @ViewChild('rowRef') private readonly rowRef?: ElementRef<HTMLElement>;
  @ViewChildren('buttonRef', { read: ElementRef }) private readonly buttonRefs?: QueryList<ElementRef<HTMLElement>>;

  private readonly availableValuesState = signal<CxButtonGroupOption[]>([]);
  private readonly valueState = signal<string | undefined>(undefined);
  private readonly sizeState = signal<CxButtonGroupSize>('default');
  private readonly disabledState = signal(false);
  private readonly fillState = signal(false);
  protected readonly indicatorVisible$ = signal(false);
  private readonly indicatorX$ = signal(0);
  private readonly indicatorY$ = signal(0);
  private readonly indicatorWidth$ = signal(0);
  private readonly indicatorHeight$ = signal(0);
  private buttonChangesSubscription?: Subscription;
  private resizeObserver?: ResizeObserver;
  private animationFrameId: number | undefined;

  /** Accessible name for the single-choice group. */
  @Input() ariaLabel: string | undefined = 'Options';

  @Input()
  public set availableValues(value: CxButtonGroupOption[] | undefined) {
    this.availableValuesState.set(value ?? []);
    this.scheduleIndicatorRefresh();
  }

  @Input()
  public set value(value: string | undefined) {
    this.valueState.set(value);
    this.scheduleIndicatorRefresh();
  }

  @Input()
  public set size(value: CxButtonGroupSize | undefined) {
    this.sizeState.set(value === 'small' ? 'small' : 'default');
    this.scheduleIndicatorRefresh();
  }

  @Input()
  public set disabled(value: boolean | undefined) {
    this.disabledState.set(!!value);
  }

  /** Stretches the group to its container width, distributing buttons evenly. */
  @Input()
  public set fill(value: boolean | undefined) {
    this.fillState.set(!!value);
    this.scheduleIndicatorRefresh();
  }

  @Output() readonly valueChange = new EventEmitter<string>();

  @HostBinding('class.cx-button-group-disabled')
  protected get disabledHostClass(): boolean {
    return this.disabledState();
  }

  @HostBinding('class.cx-button-group-fill')
  protected get fillHostClass(): boolean {
    return this.fillState();
  }

  @HostBinding('style.--cx-button-group-indicator-x')
  protected get indicatorX(): string {
    return `${this.indicatorX$()}px`;
  }

  @HostBinding('style.--cx-button-group-indicator-y')
  protected get indicatorY(): string {
    return `${this.indicatorY$()}px`;
  }

  @HostBinding('style.--cx-button-group-indicator-width')
  protected get indicatorWidth(): string {
    return `${this.indicatorWidth$()}px`;
  }

  @HostBinding('style.--cx-button-group-indicator-height')
  protected get indicatorHeight(): string {
    return `${this.indicatorHeight$()}px`;
  }

  protected readonly size$ = this.sizeState.asReadonly();
  protected readonly disabled$ = this.disabledState.asReadonly();
  protected readonly buttons$ = computed<CxButtonGroupButton[]>(() =>
    this.availableValuesState().map(option => ({
      id: option.id,
      name: option.label ?? option.id,
      icon: option.icon,
      disabled: !!option.disabled,
      selected: option.id === this.valueState(),
    })),
  );

  public ngAfterViewInit(): void {
    this.buttonChangesSubscription = this.buttonRefs?.changes.subscribe(() => {
      this.observeIndicatorTargets();
      this.scheduleIndicatorRefresh();
    });

    this.observeIndicatorTargets();
    this.scheduleIndicatorRefresh();
  }

  public ngOnDestroy(): void {
    this.buttonChangesSubscription?.unsubscribe();
    this.destroyIndicatorMeasurement();
  }

  protected select(event: MouseEvent, option: CxButtonGroupButton): void {
    if (this.disabledState() || option.disabled || option.selected) {
      return;
    }

    event.stopPropagation();
    this.valueState.set(option.id);
    this.valueChange.emit(option.id);
    this.scheduleIndicatorRefresh();
  }

  protected onKeydown(event: KeyboardEvent, index: number): void {
    if (this.disabledState()) {
      return;
    }

    if (!['ArrowRight', 'ArrowLeft', 'ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) {
      return;
    }

    event.preventDefault();

    const buttons = this.buttons$();
    const enabledIndexes = buttons
      .map((button, buttonIndex) => button.disabled ? -1 : buttonIndex)
      .filter(buttonIndex => buttonIndex >= 0);
    if (enabledIndexes.length === 0) {
      return;
    }

    let nextIndex: number;
    if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
      nextIndex = this.nextEnabledIndex(enabledIndexes, index, 1);
    } else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
      nextIndex = this.nextEnabledIndex(enabledIndexes, index, -1);
    } else if (event.key === 'Home') {
      nextIndex = enabledIndexes[0]!;
    } else if (event.key === 'End') {
      nextIndex = enabledIndexes[enabledIndexes.length - 1]!;
    } else {
      return;
    }

    const nextButton = buttons[nextIndex];
    if (!nextButton) {
      return;
    }

    this.buttonRefs?.get(nextIndex)?.nativeElement.focus();
    if (!nextButton.selected) {
      this.valueState.set(nextButton.id);
      this.valueChange.emit(nextButton.id);
      this.scheduleIndicatorRefresh();
    }
  }

  protected tabIndexFor(index: number): string {
    if (this.disabledState()) {
      return '-1';
    }

    const buttons = this.buttons$();
    const selectedEnabledIndex = buttons.findIndex(button => button.selected && !button.disabled);
    const tabStopIndex = selectedEnabledIndex >= 0
      ? selectedEnabledIndex
      : buttons.findIndex(button => !button.disabled);
    return index === tabStopIndex ? '0' : '-1';
  }

  private nextEnabledIndex(enabledIndexes: readonly number[], currentIndex: number, direction: 1 | -1): number {
    const currentEnabledPosition = enabledIndexes.indexOf(currentIndex);
    if (currentEnabledPosition < 0) {
      return direction === 1 ? enabledIndexes[0]! : enabledIndexes[enabledIndexes.length - 1]!;
    }

    return enabledIndexes[
      (currentEnabledPosition + direction + enabledIndexes.length) % enabledIndexes.length
    ]!;
  }

  private observeIndicatorTargets(): void {
    this.resizeObserver?.disconnect();

    if (typeof ResizeObserver === 'undefined') {
      return;
    }

    this.resizeObserver = new ResizeObserver(() => this.scheduleIndicatorRefresh());

    if (this.rowRef?.nativeElement) {
      this.resizeObserver.observe(this.rowRef.nativeElement);
    }

    this.buttonRefs?.forEach(button => this.resizeObserver?.observe(button.nativeElement));
  }

  private scheduleIndicatorRefresh(): void {
    if (this.animationFrameId !== undefined) {
      cancelAnimationFrame(this.animationFrameId);
    }

    if (typeof requestAnimationFrame === 'undefined') {
      this.refreshIndicator();
      return;
    }

    this.animationFrameId = requestAnimationFrame(() => {
      this.animationFrameId = undefined;
      this.refreshIndicator();
    });
  }

  private refreshIndicator(): void {
    const selectedIndex = this.buttons$().findIndex(button => button.selected);
    const selectedButton = this.buttonRefs?.toArray()[selectedIndex]?.nativeElement;
    if (selectedIndex < 0 || selectedButton === undefined) {
      this.indicatorVisible$.set(false);
      return;
    }

    this.indicatorX$.set(selectedButton.offsetLeft);
    this.indicatorY$.set(selectedButton.offsetTop);
    this.indicatorWidth$.set(selectedButton.offsetWidth);
    this.indicatorHeight$.set(selectedButton.offsetHeight);
    this.indicatorVisible$.set(true);
  }

  private destroyIndicatorMeasurement(): void {
    if (this.animationFrameId !== undefined) {
      cancelAnimationFrame(this.animationFrameId);
    }

    this.resizeObserver?.disconnect();
  }
}
