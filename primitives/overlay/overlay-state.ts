import { DOCUMENT } from '@angular/common';
import { Injectable, inject } from '@angular/core';

export type CxOverlayStateHandle = {
  id: number;
  focusedElement?: HTMLElement;
  released: boolean;
};

@Injectable({ providedIn: 'root' })
export class CxOverlayStateService {
  private readonly document = inject(DOCUMENT);
  private readonly stack: CxOverlayStateHandle[] = [];
  private nextId = 0;
  private previousBodyOverflow = '';

  capture(): CxOverlayStateHandle {
    const activeElement = this.document.activeElement;
    const handle: CxOverlayStateHandle = {
      id: ++this.nextId,
      focusedElement: activeElement instanceof HTMLElement ? activeElement : undefined,
      released: false,
    };

    if (this.stack.length === 0) {
      this.previousBodyOverflow = this.document.body.style.overflow;
      this.document.body.style.overflow = 'hidden';
    }

    this.stack.push(handle);
    return handle;
  }

  release(handle: CxOverlayStateHandle | undefined): void {
    if (!handle || handle.released) {
      return;
    }

    const wasTop = this.stack.at(-1) === handle;
    handle.released = true;
    const index = this.stack.indexOf(handle);
    if (index >= 0) {
      this.stack.splice(index, 1);
    }

    if (this.stack.length === 0) {
      this.document.body.style.overflow = this.previousBodyOverflow;
      this.previousBodyOverflow = '';
    }

    if (wasTop && handle.focusedElement?.isConnected) {
      handle.focusedElement.focus({ preventScroll: true });
    }
  }
}
