import {
  Directive,
  Input,
  TemplateRef,
  ViewContainerRef,
  booleanAttribute,
  inject,
} from '@angular/core';

/**
 * Keeps the component reference literal without constructing every inactive
 * workbench and its document listeners, observers, or portaled overlays.
 */
@Directive({
  selector: '[cxActiveWorkbench]',
})
export class CxActiveWorkbenchDirective {
  private readonly template = inject(TemplateRef<unknown>);
  private readonly container = inject(ViewContainerRef);
  private rendered = false;

  @Input({ transform: booleanAttribute })
  public set cxActiveWorkbench(active: boolean) {
    const nextRendered = Boolean(active);
    if (nextRendered === this.rendered) {
      return;
    }

    this.rendered = nextRendered;
    if (nextRendered) {
      this.container.createEmbeddedView(this.template);
      return;
    }

    this.container.clear();
  }
}
