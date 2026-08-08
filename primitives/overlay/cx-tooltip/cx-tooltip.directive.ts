import { DOCUMENT } from '@angular/common';
import {
  AfterViewInit,
  ComponentRef,
  Directive,
  ElementRef,
  HostListener,
  Injectable,
  OnDestroy,
  ViewContainerRef,
  booleanAttribute,
  effect,
  inject,
  input,
  signal,
} from '@angular/core';
import {
  ConnectedPosition,
  FlexibleConnectedPositionStrategy,
  Overlay,
  OverlayRef,
} from '@angular/cdk/overlay';
import { ComponentPortal } from '@angular/cdk/portal';
import { CxTooltipSurfaceComponent } from './cx-tooltip-surface.component';

let cxTooltipId = 0;

const CX_TOOLTIP_DEFAULT_DELAY_MS = 1000;
const CX_TOOLTIP_CLOSE_GRACE_MS = 120;
const CX_TOOLTIP_OVERFLOW_CLASS = 'cx-overflow-fade--clipped';
const CX_TOOLTIP_OVERFLOW_ATTRIBUTE = 'data-cx-tooltip-overflow';
const CX_TOOLTIP_OVERFLOW_TARGET = `[${CX_TOOLTIP_OVERFLOW_ATTRIBUTE}]`;
const CX_TOOLTIP_OVERFLOW_TEXT_ATTRIBUTE = 'data-cx-tooltip-text';
const CX_TOOLTIP_FOCUS_OWNER = [
  'a[href]',
  'area[href]',
  'button:not([disabled])',
  'input:not([disabled]):not([type="hidden"])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  'summary',
  'audio[controls]',
  'video[controls]',
  '[contenteditable="true"]',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

export type CxTooltipDelay = 'default' | 'none';
export type CxTooltipPosition = 'top' | 'right' | 'bottom' | 'left';

type CxTooltipMeasurementCallback = () => void;

/**
 * Shares one resize observer and one document mutation observer across every
 * overflow-aware tooltip. This keeps large tables bounded while still
 * rechecking text, visibility, direction, and layout changes.
 */
@Injectable({ providedIn: 'root' })
class CxTooltipOverflowObserver {
  private readonly document = inject(DOCUMENT);
  private readonly registrations = new Map<HTMLElement, Set<CxTooltipMeasurementCallback>>();
  private resizeObserver?: ResizeObserver;
  private mutationObserver?: MutationObserver;
  private measurementFrame?: number;

  observe(element: HTMLElement, callback: CxTooltipMeasurementCallback): () => void {
    let callbacks = this.registrations.get(element);
    if (!callbacks) {
      callbacks = new Set();
      this.registrations.set(element, callbacks);
      this.ensureObservers();
      this.resizeObserver?.observe(element);
    }
    callbacks.add(callback);
    this.scheduleMeasurements();

    let active = true;
    return () => {
      if (!active) {
        return;
      }
      active = false;
      const registeredCallbacks = this.registrations.get(element);
      registeredCallbacks?.delete(callback);
      if (registeredCallbacks?.size) {
        return;
      }
      this.registrations.delete(element);
      this.resizeObserver?.unobserve(element);
      if (this.registrations.size === 0) {
        this.disconnectObservers();
      }
    };
  }

  private ensureObservers(): void {
    const view = this.document.defaultView;
    if (!view) {
      return;
    }
    if (!this.resizeObserver && typeof view.ResizeObserver !== 'undefined') {
      this.resizeObserver = new view.ResizeObserver(() => this.scheduleMeasurements());
    }
    if (!this.mutationObserver && typeof view.MutationObserver !== 'undefined') {
      this.mutationObserver = new view.MutationObserver(() => this.scheduleMeasurements());
      this.mutationObserver.observe(this.document.documentElement, {
        subtree: true,
        childList: true,
        characterData: true,
        attributes: true,
        attributeFilter: [
          'class',
          'style',
          'hidden',
          'dir',
          CX_TOOLTIP_OVERFLOW_ATTRIBUTE,
          CX_TOOLTIP_OVERFLOW_TEXT_ATTRIBUTE,
        ],
      });
    }
  }

  private scheduleMeasurements(): void {
    const view = this.document.defaultView;
    if (!view || this.measurementFrame !== undefined) {
      return;
    }
    this.measurementFrame = view.requestAnimationFrame(() => {
      this.measurementFrame = undefined;
      const callbacks = new Set(
        [...this.registrations.values()].flatMap(registration => [...registration]),
      );
      for (const callback of callbacks) {
        callback();
      }
    });
  }

  private disconnectObservers(): void {
    this.resizeObserver?.disconnect();
    this.resizeObserver = undefined;
    this.mutationObserver?.disconnect();
    this.mutationObserver = undefined;
    const view = this.document.defaultView;
    if (view && this.measurementFrame !== undefined) {
      view.cancelAnimationFrame(this.measurementFrame);
    }
    this.measurementFrame = undefined;
  }
}

/**
 * Owns document-level interaction needed only by active tooltips. One Escape
 * listener serves every open/pending trigger, and one mutation observer keeps
 * active aria-describedby relationships merged with consumer updates.
 */
@Injectable({ providedIn: 'root' })
class CxTooltipInteractionCoordinator {
  private readonly document = inject(DOCUMENT);
  private readonly escapeCallbacks = new Set<() => void>();
  private readonly descriptionCallbacks = new Map<HTMLElement, Set<() => void>>();
  private descriptionObserver?: MutationObserver;

  private readonly onDocumentKeydown = (event: KeyboardEvent): void => {
    if (event.key !== 'Escape') {
      return;
    }
    for (const callback of [...this.escapeCallbacks]) {
      callback();
    }
  };

  registerEscape(callback: () => void): () => void {
    if (this.escapeCallbacks.size === 0) {
      this.document.addEventListener('keydown', this.onDocumentKeydown);
    }
    this.escapeCallbacks.add(callback);

    let active = true;
    return () => {
      if (!active) {
        return;
      }
      active = false;
      this.escapeCallbacks.delete(callback);
      if (this.escapeCallbacks.size === 0) {
        this.document.removeEventListener('keydown', this.onDocumentKeydown);
      }
    };
  }

  observeDescription(element: HTMLElement, callback: () => void): () => void {
    let callbacks = this.descriptionCallbacks.get(element);
    if (!callbacks) {
      callbacks = new Set();
      this.descriptionCallbacks.set(element, callbacks);
      this.ensureDescriptionObserver();
    }
    callbacks.add(callback);

    let active = true;
    return () => {
      if (!active) {
        return;
      }
      active = false;
      const registeredCallbacks = this.descriptionCallbacks.get(element);
      registeredCallbacks?.delete(callback);
      if (registeredCallbacks?.size) {
        return;
      }
      this.descriptionCallbacks.delete(element);
      if (this.descriptionCallbacks.size === 0) {
        this.descriptionObserver?.disconnect();
        this.descriptionObserver = undefined;
      }
    };
  }

  private ensureDescriptionObserver(): void {
    const view = this.document.defaultView;
    if (this.descriptionObserver || !view || typeof view.MutationObserver === 'undefined') {
      return;
    }
    this.descriptionObserver = new view.MutationObserver(records => {
      for (const record of records) {
        if (!(record.target instanceof HTMLElement)) {
          continue;
        }
        const callbacks = this.descriptionCallbacks.get(record.target);
        if (!callbacks) {
          continue;
        }
        for (const callback of [...callbacks]) {
          callback();
        }
      }
    });
    this.descriptionObserver.observe(this.document.documentElement, {
      subtree: true,
      attributes: true,
      attributeFilter: ['aria-describedby'],
    });
  }
}

/**
 * Framework tooltip trigger. Attach it directly to the one element being
 * described; `cx-tooltip` remains available when composition needs a wrapper.
 */
@Directive({
  selector: '[cxTooltip]',
  standalone: true,
})
export class CxTooltipDirective implements AfterViewInit, OnDestroy {
  readonly cxTooltip = input<string | undefined>(undefined);
  readonly cxTooltipPosition = input<CxTooltipPosition>('top');
  readonly cxTooltipDelay = input<CxTooltipDelay>('default');
  readonly cxTooltipDisabled = input(false, { transform: booleanAttribute });
  readonly cxTooltipOverflow = input(false, { transform: booleanAttribute });

  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  private readonly overlay = inject(Overlay);
  private readonly viewContainerRef = inject(ViewContainerRef);
  private readonly overflowObserver = inject(CxTooltipOverflowObserver);
  private readonly interactionCoordinator = inject(CxTooltipInteractionCoordinator);
  private readonly viewReady = signal(false);
  private readonly tooltipId = `cx-tooltip-${++cxTooltipId}`;

  private triggerHovered = false;
  private triggerFocused = false;
  private surfaceHovered = false;
  private escapeDismissed = false;
  private open = false;
  private openTimer?: number;
  private closeTimer?: number;
  private overflowTargets: HTMLElement[] = [];
  private clippedOverflowTargets = new Set<HTMLElement>();
  private hoveredOverflowTarget?: HTMLElement;
  private stopOverflowObservations: Array<() => void> = [];
  private readonly overflowMeasurementCallback = () => this.syncOverflowMeasurement();
  private stopEscapeHandling?: () => void;
  private readonly escapeCallback = () => this.onEscapeKey();
  private descriptionTarget?: HTMLElement;
  private stopDescriptionObservation?: () => void;
  private readonly descriptionMutationCallback = () => this.mergeDescription();
  private overlayRef?: OverlayRef;
  private positionStrategy?: FlexibleConnectedPositionStrategy;
  private surfaceRef?: ComponentRef<CxTooltipSurfaceComponent>;
  private surfaceHoverSubscription?: { unsubscribe(): void };
  private positionSubscription?: { unsubscribe(): void };

  constructor() {
    effect(() => {
      const ready = this.viewReady();
      const overflow = this.cxTooltipOverflow();
      if (!ready) {
        return;
      }
      this.configureOverflow(overflow);
    });

    effect(() => {
      const ready = this.viewReady();
      const baseText = this.messageText();
      const disabled = this.cxTooltipDisabled();
      const overflow = this.cxTooltipOverflow();
      const delay = this.cxTooltipDelay();
      const position = this.cxTooltipPosition();
      if (!ready) {
        return;
      }

      const text = overflow ? this.effectiveMessageText() : baseText;
      if (disabled || !text) {
        this.closeNow();
        return;
      }

      if (this.open) {
        this.syncOpenSurface(position);
        return;
      }

      this.clearOpenTimer();
      if (this.triggerFocused) {
        this.openNow();
      } else if (this.triggerHovered) {
        this.requestOpen(delay);
      }
    });
  }

  ngAfterViewInit(): void {
    this.viewReady.set(true);
  }

  ngOnDestroy(): void {
    this.clearOverflowObservations();
    this.closeNow();
    this.stopEscapeHandling?.();
    this.stopEscapeHandling = undefined;
  }

  @HostListener('mouseenter')
  protected onTriggerMouseEnter(): void {
    this.triggerHovered = true;
    this.clearCloseTimer();
    if (this.cxTooltipOverflow()) {
      this.syncOverflowMeasurement(false);
    }
    this.requestOpen(this.cxTooltipDelay());
  }

  @HostListener('mouseover', ['$event'])
  protected onTriggerMouseOver(event: MouseEvent): void {
    if (!this.cxTooltipOverflow()) {
      return;
    }
    const nextTarget = this.resolveHoveredOverflowTarget(event.target);
    if (nextTarget === this.hoveredOverflowTarget) {
      return;
    }
    this.hoveredOverflowTarget = nextTarget;
    this.clearOpenTimer();
    if (this.triggerFocused) {
      if (this.open) {
        this.syncOpenSurface(this.cxTooltipPosition());
      }
      return;
    }
    if (!nextTarget || !this.clippedOverflowTargets.has(nextTarget)) {
      this.scheduleOverflowTargetClose();
      return;
    }
    if (this.open) {
      this.syncOpenSurface(this.cxTooltipPosition());
    } else {
      this.requestOpen(this.cxTooltipDelay());
    }
  }

  @HostListener('mouseleave')
  protected onTriggerMouseLeave(): void {
    this.triggerHovered = false;
    this.clearDismissalWhenIdle();
    if (!this.open && !this.surfaceHovered) {
      this.hoveredOverflowTarget = undefined;
    }
    this.scheduleClose();
  }

  @HostListener('focusin', ['$event'])
  protected onTriggerFocusIn(event: FocusEvent): void {
    if (this.host.matches(CX_TOOLTIP_FOCUS_OWNER) && event.target !== this.host) {
      // Focus belongs to an independent nested action (for example a field's
      // Clear button), not to the host trigger described by this tooltip.
      return;
    }
    this.triggerFocused = true;
    this.clearCloseTimer();
    if (this.cxTooltipOverflow()) {
      this.syncOverflowMeasurement(false);
    }
    if (this.open) {
      this.setDescriptionTarget(this.resolveDescriptionTarget(event.target));
      this.syncOpenSurface(this.cxTooltipPosition());
      return;
    }
    this.openNow(event.target);
  }

  @HostListener('focusout', ['$event'])
  protected onTriggerFocusOut(event: FocusEvent): void {
    const nextTarget = event.relatedTarget;
    if (nextTarget instanceof Node && this.host.contains(nextTarget)) {
      if (event.target === this.host && nextTarget !== this.host) {
        this.triggerFocused = false;
        this.clearDismissalWhenIdle();
        this.scheduleClose();
      }
      return;
    }
    this.triggerFocused = false;
    this.clearDismissalWhenIdle();
    this.scheduleClose();
  }

  private onEscapeKey(): void {
    if (!this.open && this.openTimer === undefined) {
      return;
    }
    this.escapeDismissed = true;
    this.clearOpenTimer();
    this.closeNow();
  }

  private requestOpen(delay: CxTooltipDelay): void {
    if (!this.canOpen() || this.open) {
      return;
    }
    if (this.triggerFocused || delay === 'none') {
      this.openNow();
      return;
    }
    if (!this.triggerHovered || this.openTimer !== undefined) {
      return;
    }
    const view = this.host.ownerDocument.defaultView;
    if (!view) {
      return;
    }
    this.startEscapeHandling();
    this.openTimer = view.setTimeout(() => {
      this.openTimer = undefined;
      if (this.triggerHovered) {
        this.openNow();
      } else {
        this.stopEscapeHandlingIfIdle();
      }
    }, CX_TOOLTIP_DEFAULT_DELAY_MS);
  }

  private openNow(eventTarget?: EventTarget | null): void {
    this.clearOpenTimer();
    this.clearCloseTimer();
    if (!this.canOpen()) {
      return;
    }

    const descriptionTarget = this.resolveDescriptionTarget(eventTarget);
    const overlayRef = this.ensureOverlay();
    if (!overlayRef.hasAttached()) {
      this.surfaceRef = overlayRef.attach(
        new ComponentPortal(CxTooltipSurfaceComponent, this.viewContainerRef),
      );
      this.surfaceHoverSubscription = this.surfaceRef.instance.hovered.subscribe(hovered => {
        this.onSurfaceHoverChange(hovered);
      });
    }
    this.open = true;
    this.startEscapeHandling();
    this.syncOpenSurface(this.cxTooltipPosition());
    this.setDescriptionTarget(descriptionTarget);
  }

  private ensureOverlay(): OverlayRef {
    if (this.overlayRef) {
      return this.overlayRef;
    }
    const origin = this.tooltipOrigin();
    this.positionStrategy = this.overlay
      .position()
      .flexibleConnectedTo(origin)
      .withPositions(this.positions(this.cxTooltipPosition()))
      .withPush(true)
      .withViewportMargin(8)
      .withFlexibleDimensions(false);
    this.positionSubscription = this.positionStrategy.positionChanges.subscribe(event => {
      this.surfaceRef?.setInput('placement', this.resolvePlacement(event.connectionPair));
    });
    this.overlayRef = this.overlay.create({
      positionStrategy: this.positionStrategy,
      scrollStrategy: this.overlay.scrollStrategies.reposition(),
    });
    return this.overlayRef;
  }

  private syncOpenSurface(position: CxTooltipPosition): void {
    this.positionStrategy?.setOrigin(this.tooltipOrigin());
    this.positionStrategy?.withPositions(this.positions(position));
    this.surfaceRef?.setInput('tooltipId', this.tooltipId);
    this.surfaceRef?.setInput('text', this.effectiveMessageText());
    this.surfaceRef?.setInput('placement', position);
    this.surfaceRef?.changeDetectorRef.detectChanges();
    this.overlayRef?.updatePosition();
  }

  private onSurfaceHoverChange(hovered: boolean): void {
    this.surfaceHovered = hovered;
    if (hovered) {
      this.clearCloseTimer();
      return;
    }
    this.clearDismissalWhenIdle();
    this.scheduleClose();
  }

  private scheduleClose(): void {
    this.clearOpenTimer();
    if (this.triggerHovered || this.triggerFocused || this.surfaceHovered) {
      return;
    }
    if (!this.open) {
      return;
    }
    const view = this.host.ownerDocument.defaultView;
    if (!view || this.closeTimer !== undefined) {
      return;
    }
    this.closeTimer = view.setTimeout(() => {
      this.closeTimer = undefined;
      if (!this.triggerHovered && !this.triggerFocused && !this.surfaceHovered) {
        this.closeNow();
      }
    }, CX_TOOLTIP_CLOSE_GRACE_MS);
  }

  private scheduleOverflowTargetClose(): void {
    this.clearOpenTimer();
    if (!this.open || this.triggerFocused || this.surfaceHovered) {
      return;
    }
    const view = this.host.ownerDocument.defaultView;
    if (!view || this.closeTimer !== undefined) {
      return;
    }
    this.closeTimer = view.setTimeout(() => {
      this.closeTimer = undefined;
      if (!this.triggerFocused && !this.surfaceHovered && !this.overflowAllowsOpen()) {
        this.closeNow();
      }
    }, CX_TOOLTIP_CLOSE_GRACE_MS);
  }

  private closeNow(): void {
    this.clearOpenTimer();
    this.clearCloseTimer();
    this.surfaceHovered = false;
    this.clearDismissalWhenIdle();
    this.removeDescription();
    if (!this.open) {
      this.releaseOverlay();
      this.stopEscapeHandlingIfIdle();
      if (!this.triggerHovered && !this.surfaceHovered) {
        this.hoveredOverflowTarget = undefined;
      }
      return;
    }
    this.open = false;
    this.releaseOverlay();
    this.stopEscapeHandlingIfIdle();
    if (!this.triggerHovered) {
      this.hoveredOverflowTarget = undefined;
    }
  }

  private canOpen(): boolean {
    return (
      !this.cxTooltipDisabled() &&
      !!this.effectiveMessageText() &&
      !this.escapeDismissed &&
      this.overflowAllowsOpen() &&
      (this.triggerHovered || this.triggerFocused || this.surfaceHovered)
    );
  }

  private clearDismissalWhenIdle(): void {
    if (!this.triggerHovered && !this.triggerFocused && !this.surfaceHovered) {
      this.escapeDismissed = false;
    }
  }

  private configureOverflow(enabled: boolean): void {
    if (!enabled) {
      this.clearOverflowObservations();
      if (this.cxTooltipDisabled() || !this.messageText()) {
        this.closeNow();
      } else if (this.open) {
        this.syncOpenSurface(this.cxTooltipPosition());
      } else if (this.triggerFocused) {
        this.openNow();
      } else if (this.triggerHovered) {
        this.requestOpen(this.cxTooltipDelay());
      }
      return;
    }
    this.syncOverflowMeasurement();
  }

  private syncOverflowMeasurement(reconcile = true): void {
    const nextTargets = this.resolveOverflowTargets();
    const targetsChanged = !this.sameTargets(nextTargets, this.overflowTargets);
    if (targetsChanged) {
      const previousHoveredTarget = this.hoveredOverflowTarget;
      this.clearOverflowObservations();
      this.overflowTargets = nextTargets;
      this.stopOverflowObservations = nextTargets.map(target =>
        this.overflowObserver.observe(target, this.overflowMeasurementCallback),
      );
      this.hoveredOverflowTarget =
        previousHoveredTarget && nextTargets.includes(previousHoveredTarget)
          ? previousHoveredTarget
          : undefined;
    }

    const nextClippedTargets = new Set<HTMLElement>();
    for (const target of nextTargets) {
      const clipped = this.isClipped(target);
      target.classList.toggle(CX_TOOLTIP_OVERFLOW_CLASS, clipped);
      if (clipped) {
        nextClippedTargets.add(target);
      }
    }
    this.clippedOverflowTargets = nextClippedTargets;

    if (!this.overflowAllowsOpen() || !this.effectiveMessageText()) {
      this.closeNow();
      return;
    }
    if (this.open) {
      this.syncOpenSurface(this.cxTooltipPosition());
    } else if (reconcile) {
      this.requestOpen(this.cxTooltipDelay());
    }
  }

  private resolveOverflowTargets(): HTMLElement[] {
    const targets = [...this.host.querySelectorAll<HTMLElement>(CX_TOOLTIP_OVERFLOW_TARGET)];
    return targets.length ? targets : [this.host];
  }

  private resolveHoveredOverflowTarget(eventTarget: EventTarget | null): HTMLElement | undefined {
    if (this.overflowTargets.length === 1 && this.overflowTargets[0] === this.host) {
      return this.host;
    }
    if (!(eventTarget instanceof Element)) {
      return undefined;
    }
    const target = eventTarget.closest<HTMLElement>(CX_TOOLTIP_OVERFLOW_TARGET);
    return target && this.overflowTargets.includes(target) ? target : undefined;
  }

  private overflowAllowsOpen(): boolean {
    if (!this.cxTooltipOverflow()) {
      return true;
    }
    if (this.triggerFocused) {
      return this.clippedOverflowTargets.size > 0;
    }
    if (this.surfaceHovered) {
      return this.clippedOverflowTargets.size > 0;
    }
    if (this.hoveredOverflowTarget) {
      return this.clippedOverflowTargets.has(this.hoveredOverflowTarget);
    }
    return false;
  }

  private tooltipOrigin(): HTMLElement {
    if (!this.cxTooltipOverflow() || this.triggerFocused) {
      return this.host;
    }
    return this.hoveredOverflowTarget && this.clippedOverflowTargets.has(this.hoveredOverflowTarget)
      ? this.hoveredOverflowTarget
      : this.host;
  }

  private effectiveMessageText(): string {
    if (!this.cxTooltipOverflow()) {
      return this.messageText();
    }
    if (
      !this.triggerFocused &&
      this.hoveredOverflowTarget &&
      this.clippedOverflowTargets.has(this.hoveredOverflowTarget)
    ) {
      return this.overflowTargetText(this.hoveredOverflowTarget);
    }
    const messages = [...this.clippedOverflowTargets]
      .map(target => this.overflowTargetText(target))
      .filter((message, index, allMessages) => !!message && allMessages.indexOf(message) === index);
    return messages.length ? messages.join(' · ') : this.messageText();
  }

  private overflowTargetText(target: HTMLElement): string {
    const explicitText = target.getAttribute(CX_TOOLTIP_OVERFLOW_TEXT_ATTRIBUTE)?.trim();
    if (explicitText) {
      return explicitText;
    }
    const targetText = target.textContent?.replace(/\s+/g, ' ').trim();
    return target === this.host
      ? this.messageText() || targetText || ''
      : targetText || this.messageText();
  }

  private clearOverflowObservations(): void {
    for (const stopObserving of this.stopOverflowObservations) {
      stopObserving();
    }
    this.stopOverflowObservations = [];
    for (const target of this.overflowTargets) {
      target.classList.remove(CX_TOOLTIP_OVERFLOW_CLASS);
    }
    this.overflowTargets = [];
    this.clippedOverflowTargets.clear();
    this.hoveredOverflowTarget = undefined;
  }

  private sameTargets(left: readonly HTMLElement[], right: readonly HTMLElement[]): boolean {
    return left.length === right.length && left.every((target, index) => target === right[index]);
  }

  private isClipped(target: HTMLElement): boolean {
    if (!target.isConnected || target.getClientRects().length === 0) {
      return false;
    }
    const view = target.ownerDocument.defaultView;
    if (!view) {
      return false;
    }
    const style = view.getComputedStyle(target);
    const clipsInline = style.overflowX === 'hidden' || style.overflowX === 'clip';
    const clipsBlock = style.overflowY === 'hidden' || style.overflowY === 'clip';
    const inlineClipped = clipsInline && target.scrollWidth > target.clientWidth + 1;
    const blockClipped = clipsBlock && target.scrollHeight > target.clientHeight + 1;
    return inlineClipped || blockClipped;
  }

  private resolveDescriptionTarget(eventTarget?: EventTarget | null): HTMLElement {
    // A focusable host unequivocally owns the tooltip applied to it. Composite
    // fields may contain independent clear/reveal actions; those descendants
    // keep their own names without making the field tooltip ambiguous.
    if (this.host.matches(CX_TOOLTIP_FOCUS_OWNER)) {
      return this.host;
    }
    const focusOwners = [...this.host.querySelectorAll<HTMLElement>(CX_TOOLTIP_FOCUS_OWNER)];
    if (focusOwners.length > 1) {
      throw new Error(
        'cxTooltip can describe only one focusable trigger. ' +
          'Attach cxTooltip directly to each native trigger instead of wrapping multiple controls.',
      );
    }
    if (
      eventTarget instanceof HTMLElement &&
      this.host.contains(eventTarget) &&
      eventTarget.matches(CX_TOOLTIP_FOCUS_OWNER)
    ) {
      return eventTarget;
    }
    return focusOwners[0] ?? this.host;
  }

  private setDescriptionTarget(target: HTMLElement): void {
    if (target !== this.descriptionTarget) {
      this.removeDescription();
      this.descriptionTarget = target;
      this.mergeDescription();
      this.stopDescriptionObservation = this.interactionCoordinator.observeDescription(
        target,
        this.descriptionMutationCallback,
      );
      return;
    }
    this.mergeDescription();
  }

  private mergeDescription(): void {
    const target = this.descriptionTarget;
    if (!target) {
      return;
    }
    const descriptions = new Set(this.descriptionTokens(target));
    descriptions.add(this.tooltipId);
    const nextValue = [...descriptions].join(' ');
    if (target.getAttribute('aria-describedby') !== nextValue) {
      target.setAttribute('aria-describedby', nextValue);
    }
  }

  private removeDescription(): void {
    this.stopDescriptionObservation?.();
    this.stopDescriptionObservation = undefined;
    const target = this.descriptionTarget;
    this.descriptionTarget = undefined;
    if (!target) {
      return;
    }
    const descriptions = this.descriptionTokens(target).filter(token => token !== this.tooltipId);
    if (descriptions.length) {
      target.setAttribute('aria-describedby', descriptions.join(' '));
    } else {
      target.removeAttribute('aria-describedby');
    }
  }

  private descriptionTokens(target: HTMLElement): string[] {
    return (target.getAttribute('aria-describedby') ?? '').split(/\s+/).filter(Boolean);
  }

  private positions(preferred: CxTooltipPosition): ConnectedPosition[] {
    const positions: Record<CxTooltipPosition, ConnectedPosition> = {
      top: {
        originX: 'center',
        originY: 'top',
        overlayX: 'center',
        overlayY: 'bottom',
        offsetY: -8,
      },
      bottom: {
        originX: 'center',
        originY: 'bottom',
        overlayX: 'center',
        overlayY: 'top',
        offsetY: 8,
      },
      right: {
        originX: 'end',
        originY: 'center',
        overlayX: 'start',
        overlayY: 'center',
        offsetX: 8,
      },
      left: {
        originX: 'start',
        originY: 'center',
        overlayX: 'end',
        overlayY: 'center',
        offsetX: -8,
      },
    };
    return [
      positions[preferred],
      ...Object.entries(positions)
        .filter(([position]) => position !== preferred)
        .map(([, position]) => position),
    ];
  }

  private resolvePlacement(position: ConnectedPosition): CxTooltipPosition {
    if (position.originY === 'top' && position.overlayY === 'bottom') {
      return 'top';
    }
    if (position.originY === 'bottom' && position.overlayY === 'top') {
      return 'bottom';
    }
    if (position.originX === 'start' && position.overlayX === 'end') {
      return 'left';
    }
    return 'right';
  }

  private clearOpenTimer(): void {
    const view = this.host.ownerDocument.defaultView;
    if (view && this.openTimer !== undefined) {
      view.clearTimeout(this.openTimer);
    }
    this.openTimer = undefined;
    this.stopEscapeHandlingIfIdle();
  }

  private clearCloseTimer(): void {
    const view = this.host.ownerDocument.defaultView;
    if (view && this.closeTimer !== undefined) {
      view.clearTimeout(this.closeTimer);
    }
    this.closeTimer = undefined;
  }

  private startEscapeHandling(): void {
    this.stopEscapeHandling ??= this.interactionCoordinator.registerEscape(this.escapeCallback);
  }

  private stopEscapeHandlingIfIdle(): void {
    if (this.open || this.openTimer !== undefined) {
      return;
    }
    this.stopEscapeHandling?.();
    this.stopEscapeHandling = undefined;
  }

  private releaseOverlay(): void {
    this.surfaceHoverSubscription?.unsubscribe();
    this.surfaceHoverSubscription = undefined;
    this.positionSubscription?.unsubscribe();
    this.positionSubscription = undefined;
    this.overlayRef?.dispose();
    this.overlayRef = undefined;
    this.positionStrategy = undefined;
    this.surfaceRef = undefined;
  }

  private messageText(): string {
    return this.cxTooltip()?.trim() ?? '';
  }
}
