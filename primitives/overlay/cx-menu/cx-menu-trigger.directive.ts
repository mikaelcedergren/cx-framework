import { Directive, ElementRef, inject } from '@angular/core';

@Directive({
  selector: '[cxMenuTrigger]',
})
export class CxMenuTriggerDirective {
  private readonly host: ElementRef<HTMLElement> = inject(ElementRef);

  public nativeButton(): HTMLButtonElement {
    const host = this.host.nativeElement;
    if (host instanceof HTMLButtonElement) {
      return host;
    }

    const supportedHosts = new Set(['CX-BUTTON', 'CX-ICON-BUTTON']);
    if (!supportedHosts.has(host.tagName)) {
      throw new Error(
        `[cx-menu] cxMenuTrigger belongs on a native button, cx-button, or cx-icon-button; found ${host.tagName.toLowerCase()}.`,
      );
    }

    const buttons = Array.from(host.querySelectorAll<HTMLButtonElement>('button'));
    if (buttons.length !== 1) {
      throw new Error(
        `[cx-menu] cxMenuTrigger must resolve to exactly one native button; found ${buttons.length}.`,
      );
    }
    return buttons[0];
  }
}
