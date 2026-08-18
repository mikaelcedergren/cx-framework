import { InteractivityChecker } from '@angular/cdk/a11y';
import { DOCUMENT } from '@angular/common';
import {
  DestroyRef,
  Injectable,
  Injector,
  afterEveryRender,
  afterNextRender,
  inject,
  signal,
} from '@angular/core';
import { isHostVisible } from '../shared/host-visibility';

export type CxOverlayStateKind = 'modal' | 'transient';

export type CxOverlayStateCaptureOptions = {
  kind?: CxOverlayStateKind;
  restoreFocus?: boolean;
  /** The element that opened the overlay, so descriptions anchored to it (tooltips) can stand down while it owns an open surface. */
  owner?: HTMLElement;
  /** The rendered overlay root. It keeps visual stack order and fallback focus aligned with this capture. */
  surface?: () => HTMLElement | undefined;
  /**
   * Every independently positioned root that paints this overlay, ordered from
   * back to front. Use this when a surface and its backdrop are DOM siblings.
   */
  layerSurfaces?: () => readonly HTMLElement[];
  /** Whether this capture currently participates in topmost overlay ownership. Hidden and inactive surfaces return false. */
  isActive?: () => boolean;
  /** Runs after the coordinator consumes Escape for this topmost active overlay. Omit to block dismissal without acting. */
  onEscape?: (event: KeyboardEvent) => void;
};

export type CxOverlayStateHandle = {
  id: number;
  kind: CxOverlayStateKind;
  focusedElement?: HTMLElement;
  restoreFocus: boolean;
  owner?: HTMLElement;
  surface?: () => HTMLElement | undefined;
  layerSurfaces?: () => readonly HTMLElement[];
  isActive: () => boolean;
  onEscape?: (event: KeyboardEvent) => void;
  released: boolean;
};

@Injectable({ providedIn: 'root' })
export class CxOverlayStateService {
  private static readonly activationTargetMaxAgeMs = 1_000;
  private readonly document = inject(DOCUMENT);
  private readonly injector = inject(Injector);
  private readonly interactivityChecker = inject(InteractivityChecker);
  private readonly stack: CxOverlayStateHandle[] = [];
  private readonly focusAncestry = new WeakMap<CxOverlayStateHandle, readonly HTMLElement[]>();
  private readonly stackVersion = signal(0);
  private nextId = 0;
  private modalDepth = 0;
  private previousBodyOverflow = '';
  private activationTarget?: { element: HTMLElement; capturedAt: number };
  private readonly managedLayerElements = new Set<HTMLElement>();
  private readonly originalLayerStyles = new WeakMap<
    HTMLElement,
    { value: string; priority: string }
  >();
  private readonly clickListener = (event: MouseEvent) => this.onDocumentClick(event);
  private readonly keydownListener = (event: KeyboardEvent) => this.onDocumentKeydown(event);

  constructor() {
    this.document.addEventListener('click', this.clickListener, true);
    this.document.addEventListener('keydown', this.keydownListener, true);
    afterEveryRender(() => {
      if (this.stack.length > 0 || this.managedLayerElements.size > 0) {
        this.syncSurfaceLayers();
      }
    }, { injector: this.injector });
    inject(DestroyRef).onDestroy(() => {
      this.document.removeEventListener('click', this.clickListener, true);
      this.document.removeEventListener('keydown', this.keydownListener, true);
      this.restoreManagedLayerElements();
    });
  }

  capture(options: CxOverlayStateCaptureOptions = {}): CxOverlayStateHandle {
    const kind = options.kind ?? 'modal';
    const restoreFocus = options.restoreFocus ?? kind === 'modal';
    const activeElement = this.document.activeElement;
    const activationTarget = restoreFocus ? this.recentActivationTarget() : undefined;
    const focusOrigin = restoreFocus
      ? activationTarget ?? (activeElement instanceof HTMLElement ? activeElement : undefined)
      : undefined;
    if (activationTarget) {
      this.activationTarget = undefined;
    }
    const handle: CxOverlayStateHandle = {
      id: ++this.nextId,
      kind,
      focusedElement: focusOrigin,
      restoreFocus,
      owner: options.owner,
      surface: options.surface,
      layerSurfaces: options.layerSurfaces,
      isActive: options.isActive ?? (() => true),
      onEscape: options.onEscape,
      released: false,
    };

    if (kind === 'modal' && this.modalDepth === 0) {
      this.previousBodyOverflow = this.document.body.style.overflow;
      this.document.body.style.overflow = 'hidden';
    }
    if (kind === 'modal') {
      this.modalDepth += 1;
    }

    this.stack.push(handle);
    this.focusAncestry.set(handle, this.captureFocusAncestry(focusOrigin));
    this.stackVersion.update(version => version + 1);
    return handle;
  }

  /** Attach or correct a capture's owner after the fact; input order between `open` and `owner` bindings is not guaranteed. */
  assignOwner(handle: CxOverlayStateHandle | undefined, owner: HTMLElement | undefined): void {
    if (!handle || handle.released || handle.owner === owner) {
      return;
    }
    handle.owner = owner;
    this.stackVersion.update(version => version + 1);
  }

  /**
   * True while an active overlay was opened by this element, by an element
   * inside it, or by an element it sits inside. Descriptions anchored to the
   * opener (tooltips) must stand down for as long as this holds.
   */
  ownsOpenOverlay(element: HTMLElement): boolean {
    this.stackVersion();
    return this.stack.some(
      handle =>
        !handle.released &&
        handle.isActive() &&
        !!handle.owner &&
        (handle.owner === element || handle.owner.contains(element) || element.contains(handle.owner)),
    );
  }

  release(handle: CxOverlayStateHandle | undefined): void {
    if (!handle || handle.released) {
      return;
    }

    const wasTop = this.topmostActiveHandle() === handle;
    handle.released = true;
    const index = this.stack.indexOf(handle);
    if (index >= 0) {
      this.stack.splice(index, 1);
    }
    this.stackVersion.update(version => version + 1);

    if (handle.kind === 'modal') {
      this.modalDepth = Math.max(0, this.modalDepth - 1);
    }
    if (handle.kind === 'modal' && this.modalDepth === 0) {
      this.document.body.style.overflow = this.previousBodyOverflow;
      this.previousBodyOverflow = '';
    }

    if (wasTop && handle.restoreFocus) {
      const exposedTop = this.topmostActiveHandle();
      const exposedParent = exposedTop && this.isFocusParent(handle, exposedTop)
        ? exposedTop
        : undefined;
      this.restoreFocusAfterRender(handle, exposedParent, exposedTop);
    } else {
      this.focusAncestry.delete(handle);
    }
  }

  isTopmost(handle: CxOverlayStateHandle | undefined): boolean {
    return !!handle && !handle.released && this.topmostActiveHandle() === handle;
  }

  private onDocumentKeydown(event: KeyboardEvent): void {
    if (
      event.key !== 'Escape'
      || event.isComposing
      || event.altKey
      || event.ctrlKey
      || event.metaKey
      || event.shiftKey
    ) {
      return;
    }

    const owner = this.topmostActiveHandle();
    if (!owner) {
      return;
    }

    event.preventDefault();
    event.stopImmediatePropagation();
    owner.onEscape?.(event);
  }

  private onDocumentClick(event: MouseEvent): void {
    const activationTarget = event.composedPath().find(
      target => target instanceof HTMLElement
        && target !== this.document.body
        && target !== this.document.documentElement
        && isHostVisible(target)
        && this.interactivityChecker.isFocusable(target),
    );
    if (!(activationTarget instanceof HTMLElement)) {
      return;
    }

    const captured = { element: activationTarget, capturedAt: Date.now() };
    this.activationTarget = captured;
    afterNextRender(() => {
      if (this.activationTarget === captured) {
        this.activationTarget = undefined;
      }
    }, { injector: this.injector });
  }

  private recentActivationTarget(): HTMLElement | undefined {
    const captured = this.activationTarget;
    if (!captured) {
      return undefined;
    }
    if (
      Date.now() - captured.capturedAt > CxOverlayStateService.activationTargetMaxAgeMs
      || !captured.element.isConnected
      || !isHostVisible(captured.element)
      || !this.interactivityChecker.isFocusable(captured.element)
    ) {
      this.activationTarget = undefined;
      return undefined;
    }
    return captured.element;
  }

  private captureFocusAncestry(origin: HTMLElement | undefined): readonly HTMLElement[] {
    const ancestry: HTMLElement[] = [];
    let ancestor = origin?.parentElement;
    while (ancestor) {
      ancestry.push(ancestor);
      ancestor = ancestor.parentElement;
    }
    return ancestry;
  }

  private restoreFocusAfterRender(
    releasedHandle: CxOverlayStateHandle,
    exposedParent: CxOverlayStateHandle | undefined,
    exposedTop: CxOverlayStateHandle | undefined,
  ): void {
    let completed = false;
    const restore = () => {
      if (completed) {
        return;
      }
      completed = true;
      try {
        if (exposedParent) {
          if (!this.isTopmost(exposedParent)) {
            return;
          }
        } else {
          const currentTop = this.topmostActiveHandle();
          if (
            currentTop?.kind === 'modal'
            || (currentTop && currentTop !== exposedTop)
          ) {
            return;
          }
        }

        const invoker = releasedHandle.focusedElement;
        const parentSurface = exposedParent ? this.surfaceFor(exposedParent) : undefined;
        if (
          this.tryFocus(
            invoker && (!parentSurface || parentSurface.contains(invoker)) ? invoker : undefined,
          )
        ) {
          return;
        }
        this.tryFocus(this.resolveFallbackTarget(releasedHandle, exposedParent), true);
      } finally {
        this.focusAncestry.delete(releasedHandle);
      }
    };

    afterNextRender(restore, { injector: this.injector });
    // A conditionally rendered overlay may release from its destroy hook,
    // after Angular's callback window for that render has already passed.
    // Once its surface is gone, a microtask is safely post-teardown and keeps
    // focus from falling to body even when no later render is scheduled.
    queueMicrotask(() => {
      const releasedSurface = this.surfaceFor(releasedHandle);
      if (!releasedSurface || !releasedSurface.isConnected || !isHostVisible(releasedSurface)) {
        restore();
      }
    });
  }

  private isFocusParent(
    releasedHandle: CxOverlayStateHandle,
    candidate: CxOverlayStateHandle,
  ): boolean {
    const candidateSurface = this.surfaceFor(candidate);
    if (!candidateSurface) {
      return false;
    }
    const origin = releasedHandle.focusedElement;
    if (origin && candidateSurface.contains(origin)) {
      return true;
    }
    return (this.focusAncestry.get(releasedHandle) ?? []).some(
      ancestor => ancestor === candidateSurface || candidateSurface.contains(ancestor),
    );
  }

  private resolveFallbackTarget(
    handle: CxOverlayStateHandle,
    exposedParent: CxOverlayStateHandle | undefined,
  ): HTMLElement | undefined {
    if (exposedParent) {
      const parentTarget = this.resolveSurfaceFocusTarget(this.surfaceFor(exposedParent));
      if (parentTarget) {
        return parentTarget;
      }
      return this.visibleModalFocusTarget();
    }

    for (const ancestor of this.focusAncestry.get(handle) ?? []) {
      if (
        ancestor === this.document.body
        || ancestor === this.document.documentElement
        || !isHostVisible(ancestor)
      ) {
        continue;
      }

      const modal = ancestor.closest<HTMLElement>('[aria-modal="true"]');
      if (modal && isHostVisible(modal)) {
        return this.resolveSurfaceFocusTarget(modal);
      }

      return ancestor.querySelector<HTMLElement>('h1, h2, h3, h4, h5, h6') ?? ancestor;
    }

    const visibleModalTarget = this.visibleModalFocusTarget();
    if (visibleModalTarget) {
      return visibleModalTarget;
    }
    return this.document.querySelector<HTMLElement>('main h1, main h2, [role="main"] h1, [role="main"] h2')
      ?? undefined;
  }

  private resolveSurfaceFocusTarget(surface: HTMLElement | undefined): HTMLElement | undefined {
    if (!surface || !isHostVisible(surface)) {
      return undefined;
    }
    const focusSurface = surface.matches('[aria-modal="true"], [role="dialog"], [role="alertdialog"]')
      ? surface
      : Array.from(surface.querySelectorAll<HTMLElement>('[aria-modal="true"], [role="dialog"], [role="alertdialog"]'))
          .find(candidate => isHostVisible(candidate)) ?? surface;
    const labelledByIds = (focusSurface.getAttribute('aria-labelledby') ?? '')
      .split(/\s+/)
      .filter(Boolean);
    for (const id of labelledByIds) {
      const label = this.document.getElementById(id);
      if (label instanceof HTMLElement && focusSurface.contains(label) && isHostVisible(label)) {
        return label;
      }
    }
    return focusSurface.querySelector<HTMLElement>('h1, h2, h3, h4, h5, h6') ?? focusSurface;
  }

  private visibleModalFocusTarget(): HTMLElement | undefined {
    const visibleModals = Array.from(this.document.querySelectorAll<HTMLElement>('[aria-modal="true"]'))
      .filter(modal => isHostVisible(modal));
    return this.resolveSurfaceFocusTarget(visibleModals.at(-1));
  }

  private syncSurfaceLayers(): void {
    const entries = this.stack.flatMap((handle, stackIndex) => {
      const layerSurfaces = this.layerSurfacesFor(handle);
      const containmentSurface = this.surfaceFor(handle) ?? layerSurfaces.at(-1);
      return layerSurfaces.length > 0 && containmentSurface
        ? [{ containmentSurface, layerSurfaces, rank: stackIndex + 1 }]
        : [];
    });
    const slotStride = Math.max(
      2,
      ...entries.map(entry => entry.layerSurfaces.length + 1),
    );
    const effectiveRanks = entries.map(entry => entry.rank);

    // A child overlay cannot escape an ancestor's stacking context. Lift the
    // ancestor to the newest contained overlay's rank so an intervening body
    // sibling cannot paint above the logically topmost child.
    entries.forEach((ancestor, ancestorIndex) => {
      for (
        let descendantIndex = ancestorIndex + 1;
        descendantIndex < entries.length;
        descendantIndex += 1
      ) {
        const descendant = entries[descendantIndex];
        if (
          descendant
          && ancestor.containmentSurface !== descendant.containmentSurface
          && ancestor.containmentSurface.contains(descendant.containmentSurface)
        ) {
          effectiveRanks[ancestorIndex] = Math.max(
            effectiveRanks[ancestorIndex] ?? ancestor.rank,
            descendant.rank,
          );
        }
      }
    });

    const assignments = new Map<HTMLElement, number>();
    entries.forEach((entry, entryIndex) => {
      const rank = effectiveRanks[entryIndex] ?? entry.rank;
      entry.layerSurfaces.forEach((element, surfaceIndex) => {
        const offset = rank * slotStride + surfaceIndex;
        assignments.set(element, Math.max(assignments.get(element) ?? 0, offset));
      });
    });

    const nextManagedElements = new Set(assignments.keys());
    for (const element of this.managedLayerElements) {
      if (!nextManagedElements.has(element)) {
        this.restoreManagedLayerElement(element);
      }
    }
    for (const [element, offset] of assignments) {
      if (!this.originalLayerStyles.has(element)) {
        this.originalLayerStyles.set(element, {
          value: element.style.getPropertyValue('z-index'),
          priority: element.style.getPropertyPriority('z-index'),
        });
      }
      element.style.setProperty('z-index', `calc(var(--z-index-dialog) + ${offset})`);
    }

    this.managedLayerElements.clear();
    for (const element of nextManagedElements) {
      this.managedLayerElements.add(element);
    }
  }

  private layerSurfacesFor(handle: CxOverlayStateHandle): readonly HTMLElement[] {
    try {
      const candidates = handle.layerSurfaces?.() ?? [handle.surface?.()];
      return candidates.filter(
        (candidate, index): candidate is HTMLElement =>
          candidate instanceof HTMLElement && candidates.indexOf(candidate) === index,
      );
    } catch {
      return [];
    }
  }

  private restoreManagedLayerElements(): void {
    for (const element of this.managedLayerElements) {
      this.restoreManagedLayerElement(element);
    }
    this.managedLayerElements.clear();
  }

  private restoreManagedLayerElement(element: HTMLElement): void {
    const original = this.originalLayerStyles.get(element);
    if (!original) {
      return;
    }
    if (original.value) {
      element.style.setProperty('z-index', original.value, original.priority);
    } else {
      element.style.removeProperty('z-index');
    }
    this.originalLayerStyles.delete(element);
  }

  private surfaceFor(handle: CxOverlayStateHandle): HTMLElement | undefined {
    try {
      return handle.surface?.();
    } catch {
      return undefined;
    }
  }

  private tryFocus(target: HTMLElement | undefined, allowTemporaryTabIndex = false): boolean {
    if (
      !target
      || target === this.document.body
      || target === this.document.documentElement
      || !isHostVisible(target)
      || target.closest('[aria-hidden="true"], [hidden], [inert]')
    ) {
      return false;
    }

    const alreadyFocusable = this.interactivityChecker.isFocusable(target);
    if (!alreadyFocusable && !allowTemporaryTabIndex) {
      return false;
    }

    const previousTabIndex = target.getAttribute('tabindex');
    if (!alreadyFocusable) {
      target.setAttribute('tabindex', '-1');
    }
    target.focus({ preventScroll: true });
    if (!alreadyFocusable) {
      if (previousTabIndex === null) {
        target.removeAttribute('tabindex');
      } else {
        target.setAttribute('tabindex', previousTabIndex);
      }
    }
    return this.document.activeElement === target;
  }

  private topmostActiveHandle(): CxOverlayStateHandle | undefined {
    for (let index = this.stack.length - 1; index >= 0; index -= 1) {
      const handle = this.stack[index];
      if (handle && !handle.released && handle.isActive()) {
        return handle;
      }
    }
    return undefined;
  }
}
