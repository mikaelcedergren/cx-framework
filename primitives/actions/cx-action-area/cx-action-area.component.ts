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
import { CxShortcutKeyComponent } from '../../display/cx-shortcut-key';
import { CxIconComponent } from '../../media/cx-icon';

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
  imports: [CxIconComponent, CxShortcutKeyComponent],
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
  private readonly editableState = signal(false);
  private readonly ariaLabelState = signal('Action area');
  private readonly disabledState = signal(false);
  private readonly shortcutsEnabledState = signal(true);
  private readonly hoveringState = signal(false);
  private readonly focusWithinState = signal(false);
  private readonly fitModeState = signal<CxActionAreaFitMode>('full');
  private actionsRail: HTMLElement | undefined;
  private resizeObserver: ResizeObserver | undefined;
  private measurementFrame: number | undefined;
  private measuring = false;

  @Input()
  public set actions(value: readonly CxActionAreaAction[] | undefined) {
    this.actionsState.set(this.normalizeActions(value));
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
  public set editable(value: boolean) {
    this.editableState.set(Boolean(value));
  }

  @Input()
  public set ariaLabel(value: string | undefined) {
    this.ariaLabelState.set(value?.trim() || 'Action area');
  }

  @Input()
  public set disabled(value: boolean) {
    this.disabledState.set(Boolean(value));
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
    actions.push(...this.actionsState());
    if (this.editableState()) {
      actions.push(CX_ACTION_AREA_EDIT_ACTION);
    }
    return actions;
  });
  protected readonly visibleActions$ = this.allActions$;
  protected readonly isInteractive$ = computed(() => !this.disabledState() && this.allActions$().length > 0);
  protected readonly isActive$ = computed(() =>
    this.isInteractive$() && (this.hoveringState() || this.focusWithinState()),
  );
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
  }

  @HostListener('pointerleave')
  protected onPointerLeave(): void {
    this.hoveringState.set(false);
    if (this.focusWithinState()) {
      this.claimActiveInstance();
      return;
    }
    this.releaseActiveInstance();
  }

  @HostListener('focusin')
  protected onFocusIn(): void {
    if (!this.isInteractive$()) {
      return;
    }
    this.focusWithinState.set(true);
    this.claimActiveInstance();
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
      return;
    }
    this.releaseActiveInstance();
  }

  @HostListener('blur', ['$event'])
  protected onBlur(event: FocusEvent): void {
    this.onFocusOut(event);
  }

  @HostListener('document:keydown', ['$event'])
  protected onDocumentKeydown(event: KeyboardEvent): void {
    const hasDomFocus = this.hasDomFocus();
    if (
      (CxActionAreaComponent.activeInstance !== this && !hasDomFocus) ||
      (!this.isActive$() && !hasDomFocus) ||
      !this.shortcutsEnabledState() ||
      event.repeat ||
      event.isComposing ||
      this.isTypingTarget(event.target) ||
      this.isTypingTarget(typeof document === 'undefined' ? null : document.activeElement)
    ) {
      return;
    }

    const action = this.allActions$().find(item =>
      !item.disabled && item.shortcutParts && this.eventMatchesShortcut(item.shortcutParts, event),
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

  protected onActionClick(action: CxResolvedActionAreaAction, event: MouseEvent): void {
    event.preventDefault();
    event.stopPropagation();
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
        const shortcutParts = this.normalizeShortcutParts(action.shortcutParts);
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

  private normalizeShortcutParts(parts: readonly string[] | undefined): readonly string[] {
    if (!Array.isArray(parts)) {
      return [];
    }
    return parts
      .filter(part => typeof part === 'string')
      .map(part => part.trim())
      .filter(Boolean);
  }

  private humanizeActionId(id: string): string {
    return id
      .split(/[-_\s]+/)
      .filter(Boolean)
      .map(part => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ') || 'Action';
  }

  private eventMatchesShortcut(parts: readonly string[], event: KeyboardEvent): boolean {
    const normalizedParts = parts.map(part => part.trim().toLowerCase()).filter(Boolean);
    if (normalizedParts.length === 0) {
      return false;
    }
    const isMac = typeof navigator !== 'undefined' && /mac/i.test(navigator.platform);
    const wantsCtrl =
      normalizedParts.includes('ctrl') ||
      normalizedParts.includes('control') ||
      (!isMac && normalizedParts.includes('mod'));
    const wantsMeta =
      normalizedParts.includes('cmd') ||
      normalizedParts.includes('command') ||
      (isMac && normalizedParts.includes('mod'));
    const wantsAlt =
      normalizedParts.includes('alt') ||
      normalizedParts.includes('option') ||
      normalizedParts.includes('opt');
    const wantsShift = normalizedParts.includes('shift');
    if (
      event.ctrlKey !== wantsCtrl ||
      event.metaKey !== wantsMeta ||
      event.altKey !== wantsAlt ||
      event.shiftKey !== wantsShift
    ) {
      return false;
    }
    const keyPart = normalizedParts.find(
      part => !['mod', 'cmd', 'command', 'ctrl', 'control', 'alt', 'option', 'opt', 'shift'].includes(part),
    );
    return keyPart ? this.normalizeShortcutKey(event.key) === this.normalizeShortcutKey(keyPart) : false;
  }

  private normalizeShortcutKey(value: string): string {
    const key = value.trim().toLowerCase();
    if (key === 'esc') return 'escape';
    if (key === 'return') return 'enter';
    if (key === 'space') return ' ';
    return key;
  }

  private hasDomFocus(): boolean {
    const activeElement = typeof document === 'undefined' ? null : document.activeElement;
    return activeElement instanceof Node && this.host.nativeElement.contains(activeElement);
  }

  private shortcutLabel(parts: readonly string[] | undefined): string {
    return this.normalizeShortcutParts(parts).join('+');
  }

  private isTypingTarget(target: EventTarget | null): boolean {
    return (
      target instanceof HTMLElement &&
      Boolean(target.closest('input, textarea, select, [contenteditable="true"]'))
    );
  }
}
