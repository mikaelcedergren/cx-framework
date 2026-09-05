import { AfterViewInit, Directive, ElementRef, OnDestroy, inject, signal } from '@angular/core';

/** Marks content that cx-labeled-row reveals from its label-side info button. */
@Directive({
  selector: '[infoContent]',
})
export class CxLabeledRowInfoDirective implements AfterViewInit, OnDestroy {
  private readonly element = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  private readonly hasVisibleContentState = signal(false);
  private observer?: MutationObserver;

  readonly hasVisibleContent = this.hasVisibleContentState.asReadonly();

  public ngAfterViewInit(): void {
    this.syncVisibleContent();
    if (typeof MutationObserver === 'undefined') {
      return;
    }
    this.observer = new MutationObserver(() => this.syncVisibleContent());
    this.observer.observe(this.element, {
      childList: true,
      characterData: true,
      subtree: true,
    });
  }

  public ngOnDestroy(): void {
    this.observer?.disconnect();
  }

  private syncVisibleContent(): void {
    this.hasVisibleContentState.set(
      this.element.childElementCount > 0 || this.element.textContent?.trim().length > 0,
    );
  }
}
