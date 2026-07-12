import { DOCUMENT } from '@angular/common';
import { DestroyRef, Injectable, inject } from '@angular/core';

export type CxOverlayStateKind = 'modal' | 'transient';

export type CxOverlayStateCaptureOptions = {
  kind?: CxOverlayStateKind;
  restoreFocus?: boolean;
  isActive?: () => boolean;
  onEscape?: (event: KeyboardEvent) => void;
};

export type CxOverlayStateHandle = {
  id: number;
  kind: CxOverlayStateKind;
  focusedElement?: HTMLElement;
  restoreFocus: boolean;
  isActive: () => boolean;
  onEscape?: (event: KeyboardEvent) => void;
  released: boolean;
};

@Injectable({ providedIn: 'root' })
export class CxOverlayStateService {
  private readonly document = inject(DOCUMENT);
  private readonly stack: CxOverlayStateHandle[] = [];
  private nextId = 0;
  private modalDepth = 0;
  private previousBodyOverflow = '';
  private readonly keydownListener = (event: KeyboardEvent) => this.onDocumentKeydown(event);

  constructor() {
    this.document.addEventListener('keydown', this.keydownListener, true);
    inject(DestroyRef).onDestroy(() => {
      this.document.removeEventListener('keydown', this.keydownListener, true);
    });
  }

  capture(options: CxOverlayStateCaptureOptions = {}): CxOverlayStateHandle {
    const kind = options.kind ?? 'modal';
    const restoreFocus = options.restoreFocus ?? kind === 'modal';
    const activeElement = this.document.activeElement;
    const handle: CxOverlayStateHandle = {
      id: ++this.nextId,
      kind,
      focusedElement: restoreFocus && activeElement instanceof HTMLElement ? activeElement : undefined,
      restoreFocus,
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
    return handle;
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

    if (handle.kind === 'modal') {
      this.modalDepth = Math.max(0, this.modalDepth - 1);
    }
    if (handle.kind === 'modal' && this.modalDepth === 0) {
      this.document.body.style.overflow = this.previousBodyOverflow;
      this.previousBodyOverflow = '';
    }

    if (wasTop && handle.restoreFocus && handle.focusedElement?.isConnected) {
      handle.focusedElement.focus({ preventScroll: true });
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
    if (!owner?.onEscape) {
      return;
    }

    event.preventDefault();
    event.stopImmediatePropagation();
    owner.onEscape(event);
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
