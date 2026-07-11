import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  EventEmitter,
  HostBinding,
  HostListener,
  Input,
  NgZone,
  OnDestroy,
  Output,
  ViewChild,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { type CxIconName } from '../../../icons/manifest';
import { CxTooltipComponent } from '../../overlay/cx-tooltip';
import { CxButtonComponent } from '../cx-button';
import { isHostVisible } from '../../shared/host-visibility';
import { eventMatchesShortcut, isTypingTarget, normalizeShortcutParts } from '../shared/shortcuts';

export interface CxActionAreaAction {
  id: string;
  text: string;
  icon?: CxIconName;
  ariaLabel?: string;
  shortcutParts?: readonly string[];
  disabled?: boolean;
}

export type CxActionAreaActionSource = 'button' | 'shortcut';

export interface CxActionAreaActionSelectEvent {
  id: string;
  action: CxActionAreaAction;
  source: CxActionAreaActionSource;
}

type CxResolvedActionAreaAction = CxActionAreaAction & {
  key: string;
  shortcutParts?: readonly string[];
};

type CxActionAreaFitMode = 'full' | 'compact' | 'icon';

const CX_ACTION_AREA_REVEAL_DELAY_MS = 300;

const CX_ACTION_AREA_INFO_ACTION: CxResolvedActionAreaAction = {
  id: 'info',
  text: 'Info',
  icon: 'info',
  ariaLabel: 'Show info',
  shortcutParts: ['shift', 'i'],
  disabled: false,
  key: 'feature-info',
};

const CX_ACTION_AREA_AI_ACTION: CxResolvedActionAreaAction = {
  id: 'ai',
  text: 'Ask AI',
  icon: 'ai',
  shortcutParts: ['shift', 'a'],
  disabled: false,
  key: 'feature-ai',
};

const CX_ACTION_AREA_SUPPORT_ACTION: CxResolvedActionAreaAction = {
  id: 'support',
  text: 'Support',
  icon: 'support',
  ariaLabel: 'Get support',
  shortcutParts: ['shift', 's'],
  disabled: false,
  key: 'feature-support',
};

const CX_ACTION_AREA_EDIT_ACTION: CxResolvedActionAreaAction = {
  id: 'edit',
  text: 'Edit',
  icon: 'edit',
  shortcutParts: ['shift', 'e'],
  disabled: false,
  key: 'feature-edit',
};

@Component({
  selector: 'cx-action-area',
  imports: [CxButtonComponent, CxTooltipComponent],
  templateUrl: './cx-action-area.component.html',
  styleUrl: './cx-action-area.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CxActionAreaComponent implements OnDestroy {
  private static activeInstance: CxActionAreaComponent | undefined;

  private readonly host = inject(ElementRef<HTMLElement>);
  private readonly changeDetector = inject(ChangeDetectorRef);
  private readonly zone = inject(NgZone);
  private readonly actionsState = signal<readonly CxResolvedActionAreaAction[]>([]);
  private readonly infoState = signal(false);
  private readonly askAiState = signal(false);
  private readonly supportState = signal(false);
  private readonly editableState = signal(false);
  private readonly ariaLabelState = signal('Action area');
  private readonly disabledState = signal(false);
  private readonly shortcutsEnabledState = signal(true);
  private readonly hoveringState = signal(false);
  private readonly focusWithinState = signal(false);
  private readonly visualActiveState = signal(false);
  private readonly fitModeState = signal<CxActionAreaFitMode>('full');
  private actionsRail: HTMLElement | undefined;
  private resizeObserver: ResizeObserver | undefined;
  private measurementFrame: number | undefined;
  private activeRevealTimer: number | undefined;
  private measuring = false;

  @Input()
  public set actions(value: readonly CxActionAreaAction[] | undefined) {
    const actions = this.normalizeActions(value);
    this.actionsState.set(actions);
    if (actions.length === 0 && !this.infoState() && !this.askAiState() && !this.supportState() && !this.editableState()) {
      this.hideActiveVisual();
    }
  }

  @Input()
  public set info(value: boolean) {
    this.infoState.set(Boolean(value));
  }

  @Input()
  public set askAi(value: boolean) {
    this.askAiState.set(Boolean(value));
  }

  @Input()
  public set support(value: boolean) {
    this.supportState.set(Boolean(value));
  }

  @Input()
  public set editable(value: boolean) {
    this.editableState.set(Boolean(value));
  }

  @Input()
  public set ariaLabel(value: string | undefined) {
    this.ariaLabelState.set(value?.trim() || 'Action area');
  }

  @Input()
  public set disabled(value: boolean) {
    const disabled = Boolean(value);
    this.disabledState.set(disabled);
    if (disabled) {
      this.hideActiveVisual();
    }
  }

  @Input()
  public set shortcutsEnabled(value: boolean) {
    this.shortcutsEnabledState.set(Boolean(value));
  }

  @Output() readonly actionSelect = new EventEmitter<CxActionAreaActionSelectEvent>();

  private readonly allActions$ = computed<readonly CxResolvedActionAreaAction[]>(() => {
    const actions: CxResolvedActionAreaAction[] = [];
    if (this.infoState()) {
      actions.push(CX_ACTION_AREA_INFO_ACTION);
    }
    if (this.askAiState()) {
      actions.push(CX_ACTION_AREA_AI_ACTION);
    }
    if (this.supportState()) {
      actions.push(CX_ACTION_AREA_SUPPORT_ACTION);
    }
    actions.push(...this.actionsState());
    if (this.editableState()) {
      actions.push(CX_ACTION_AREA_EDIT_ACTION);
    }
    return actions;
  });
  protected readonly visibleActions$ = this.allActions$;
  protected readonly isInteractive$ = computed(() => !this.disabledState() && this.allActions$().length > 0);
  protected readonly hasInteractionIntent$ = computed(() =>
    this.isInteractive$() && (this.hoveringState() || this.focusWithinState()),
  );
  protected readonly isActive$ = computed(() => this.isInteractive$() && this.visualActiveState());
  private readonly fitMeasurementEffect = effect(() => {
    this.allActions$();
    this.shortcutsEnabledState();
    this.isInteractive$();
    this.scheduleFitMeasurement();
  });

  @ViewChild('actionsRail')
  protected set actionsRailRef(value: ElementRef<HTMLElement> | undefined) {
    this.actionsRail = value?.nativeElement;
    this.observeActionAreaSize();
    this.scheduleFitMeasurement();
  }

  @HostBinding('class.cx-action-area-host--interactive')
  protected get interactiveClass(): boolean {
    return this.isInteractive$();
  }

  @HostBinding('class.cx-action-area-host--active')
  protected get activeClass(): boolean {
    return this.isActive$();
  }

  @HostBinding('class.cx-action-area-host--disabled')
  protected get disabledClass(): boolean {
    return this.disabledState();
  }

  @HostBinding('class.cx-action-area-host--compact')
  protected get compactClass(): boolean {
    return this.fitModeState() === 'compact';
  }

  @HostBinding('class.cx-action-area-host--icon')
  protected get iconClass(): boolean {
    return this.fitModeState() === 'icon';
  }

  @HostBinding('attr.role')
  protected get hostRole(): string | null {
    return this.isInteractive$() ? 'group' : null;
  }

  @HostBinding('attr.aria-label')
  protected get hostAriaLabel(): string | null {
    return this.isInteractive$() ? this.ariaLabelState() : null;
  }

  @HostBinding('attr.tabindex')
  protected get hostTabIndex(): 0 | null {
    return this.isInteractive$() ? 0 : null;
  }

  public ngOnDestroy(): void {
    this.releaseActiveInstance();
    this.fitMeasurementEffect.destroy();
    this.resizeObserver?.disconnect();
    this.clearActiveRevealTimer();
    if (this.measurementFrame !== undefined && typeof cancelAnimationFrame !== 'undefined') {
      cancelAnimationFrame(this.measurementFrame);
    }
  }

  @HostListener('pointerenter')
  protected onPointerEnter(): void {
    if (!this.isInteractive$()) {
      return;
    }
    this.hoveringState.set(true);
    this.claimActiveInstance();
    this.scheduleActiveReveal();
  }

  @HostListener('pointerleave')
  protected onPointerLeave(): void {
    this.hoveringState.set(false);
    if (this.focusWithinState()) {
      this.claimActiveInstance();
      this.scheduleActiveReveal();
      return;
    }
    this.releaseActiveInstance();
    this.hideActiveVisual();
  }

  @HostListener('focusin')
  protected onFocusIn(): void {
    if (!this.isInteractive$()) {
      return;
    }
    this.focusWithinState.set(true);
    this.claimActiveInstance();
    this.scheduleActiveReveal();
  }

  @HostListener('focus')
  protected onFocus(): void {
    this.onFocusIn();
  }

  @HostListener('focusout', ['$event'])
  protected onFocusOut(event: FocusEvent): void {
    const nextTarget = event.relatedTarget;
    if (nextTarget instanceof Node && this.host.nativeElement.contains(nextTarget)) {
      return;
    }
    this.focusWithinState.set(false);
    if (this.hoveringState()) {
      this.claimActiveInstance();
      this.scheduleActiveReveal();
      return;
    }
    this.releaseActiveInstance();
    this.hideActiveVisual();
  }

  @HostListener('blur', ['$event'])
  protected onBlur(event: FocusEvent): void {
    this.onFocusOut(event);
  }

  @HostListener('document:keydown', ['$event'])
  protected onDocumentKeydown(event: KeyboardEvent): void {
    const hasDomFocus = this.hasDomFocus();
    if (
      !isHostVisible(this.host.nativeElement) ||
      (CxActionAreaComponent.activeInstance !== this && !hasDomFocus) ||
      (!this.hasInteractionIntent$() && !hasDomFocus) ||
      !this.shortcutsEnabledState() ||
      event.repeat ||
      event.isComposing ||
      isTypingTarget(event.target) ||
      isTypingTarget(typeof document === 'undefined' ? null : document.activeElement)
    ) {
      return;
    }

    const action = this.allActions$().find(item =>
      !item.disabled && item.shortcutParts && eventMatchesShortcut(item.shortcutParts, event),
    );
    if (!action) {
      return;
    }

    if (hasDomFocus) {
      this.claimActiveInstance();
    }
    event.preventDefault();
    event.stopPropagation();
    this.emitAction(action, 'shortcut');
  }

  protected hasShortcut(action: CxResolvedActionAreaAction): boolean {
    return this.shortcutsEnabledState() && (action.shortcutParts?.length ?? 0) > 0;
  }

  protected actionText(action: CxResolvedActionAreaAction): string {
    return this.fitModeState() === 'icon' && action.icon ? '' : action.text;
  }

  protected actionShortcutParts(action: CxResolvedActionAreaAction): readonly string[] | undefined {
    return this.fitModeState() === 'full' && this.hasShortcut(action) ? action.shortcutParts : undefined;
  }

  protected actionTooltipText(action: CxResolvedActionAreaAction): string | undefined {
    return this.fitModeState() === 'icon' && action.icon ? action.text : undefined;
  }

  protected actionAriaLabel(action: CxResolvedActionAreaAction): string {
    const label = action.ariaLabel?.trim();
    if (label) {
      return label;
    }

    const shortcut = this.shortcutsEnabledState() ? this.shortcutLabel(action.shortcutParts) : '';
    return shortcut ? `${action.text} (${shortcut})` : action.text;
  }

  protected onActionPointerDown(event: PointerEvent): void {
    event.stopPropagation();
  }

  protected onActionClick(event: MouseEvent): void {
    event.preventDefault();
    event.stopPropagation();
  }

  protected onActionPressed(action: CxResolvedActionAreaAction): void {
    if (action.disabled) {
      return;
    }
    this.emitAction(action, 'button');
  }

  private claimActiveInstance(): void {
    if (!this.isInteractive$()) {
      return;
    }
    CxActionAreaComponent.activeInstance = this;
  }

  private releaseActiveInstance(): void {
    if (CxActionAreaComponent.activeInstance === this) {
      CxActionAreaComponent.activeInstance = undefined;
    }
  }

  private scheduleActiveReveal(): void {
    if (!this.hasInteractionIntent$()) {
      this.hideActiveVisual();
      return;
    }
    if (this.visualActiveState() || this.activeRevealTimer !== undefined) {
      return;
    }
    if (typeof window === 'undefined') {
      this.showActiveVisual();
      return;
    }

    this.zone.runOutsideAngular(() => {
      this.activeRevealTimer = window.setTimeout(() => {
        this.activeRevealTimer = undefined;
        this.zone.run(() => this.showActiveVisual());
      }, CX_ACTION_AREA_REVEAL_DELAY_MS);
    });
  }

  private showActiveVisual(): void {
    if (!this.hasInteractionIntent$() || this.visualActiveState()) {
      return;
    }
    this.visualActiveState.set(true);
    this.changeDetector.detectChanges();
  }

  private hideActiveVisual(): void {
    this.clearActiveRevealTimer();
    if (!this.visualActiveState()) {
      return;
    }
    this.visualActiveState.set(false);
    this.changeDetector.detectChanges();
  }

  private clearActiveRevealTimer(): void {
    if (this.activeRevealTimer === undefined || typeof window === 'undefined') {
      this.activeRevealTimer = undefined;
      return;
    }
    window.clearTimeout(this.activeRevealTimer);
    this.activeRevealTimer = undefined;
  }

  private emitAction(action: CxResolvedActionAreaAction, source: CxActionAreaActionSource): void {
    const { key: _key, ...publicAction } = action;
    this.actionSelect.emit({
      id: action.id,
      action: publicAction,
      source,
    });
  }

  private observeActionAreaSize(): void {
    this.resizeObserver?.disconnect();
    this.resizeObserver = undefined;
    const rail = this.actionsRail;
    if (!rail || typeof ResizeObserver === 'undefined') {
      return;
    }

    this.zone.runOutsideAngular(() => {
      this.resizeObserver = new ResizeObserver(() => this.scheduleFitMeasurement());
      this.resizeObserver.observe(this.host.nativeElement);
      this.resizeObserver.observe(rail);
    });
  }

  private scheduleFitMeasurement(): void {
    if (typeof requestAnimationFrame === 'undefined' || this.measurementFrame !== undefined) {
      return;
    }

    this.zone.runOutsideAngular(() => {
      this.measurementFrame = requestAnimationFrame(() => {
        this.measurementFrame = undefined;
        this.measureFitMode();
      });
    });
  }

  private measureFitMode(): void {
    const rail = this.actionsRail;
    if (!rail || !this.isInteractive$()) {
      this.setFitMode('full');
      return;
    }
    if (this.measuring) {
      return;
    }

    this.measuring = true;
    try {
      this.setFitMode('full');
      if (!this.actionRailOverflows(rail)) {
        return;
      }

      this.setFitMode('compact');
      if (!this.actionRailOverflows(rail)) {
        return;
      }

      this.setFitMode('icon');
    } finally {
      this.measuring = false;
    }
  }

  private setFitMode(mode: CxActionAreaFitMode): void {
    if (this.fitModeState() === mode) {
      return;
    }

    this.zone.run(() => {
      this.fitModeState.set(mode);
      this.changeDetector.detectChanges();
    });
  }

  private actionRailOverflows(rail: HTMLElement): boolean {
    const buttons = Array.from(rail.querySelectorAll<HTMLElement>('.cx-action-area__action'));
    if (buttons.length === 0) {
      return false;
    }

    const railRect = rail.getBoundingClientRect();
    const buttonRects = buttons.map(button => button.getBoundingClientRect());
    const contentLeft = Math.min(...buttonRects.map(rect => rect.left));
    const contentRight = Math.max(...buttonRects.map(rect => rect.right));
    const style = getComputedStyle(rail);
    const inlinePadding =
      Number.parseFloat(style.paddingInlineStart || style.paddingLeft || '0') +
      Number.parseFloat(style.paddingInlineEnd || style.paddingRight || '0');
    return contentRight - contentLeft + inlinePadding > railRect.width + 1;
  }

  private normalizeActions(value: readonly CxActionAreaAction[] | undefined): readonly CxResolvedActionAreaAction[] {
    return (value ?? [])
      .filter(action => action && typeof action.id === 'string')
      .map((action, index) => {
        const id = action.id.trim();
        const text = action.text?.trim() || this.humanizeActionId(id);
        const shortcutParts = normalizeShortcutParts(action.shortcutParts);
        return {
          ...action,
          id,
          text,
          icon: action.icon,
          ariaLabel: action.ariaLabel?.trim() || undefined,
          shortcutParts: shortcutParts.length > 0 ? shortcutParts : undefined,
          disabled: action.disabled === true,
          key: `${id || 'action'}-${index}`,
        };
      })
      .filter(action => action.id.length > 0);
  }

  private humanizeActionId(id: string): string {
    return id
      .split(/[-_\s]+/)
      .filter(Boolean)
      .map(part => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ') || 'Action';
  }

  private hasDomFocus(): boolean {
    const activeElement = typeof document === 'undefined' ? null : document.activeElement;
    return activeElement instanceof Node && this.host.nativeElement.contains(activeElement);
  }

  private shortcutLabel(parts: readonly string[] | undefined): string {
    return normalizeShortcutParts(parts).join('+');
  }
}
