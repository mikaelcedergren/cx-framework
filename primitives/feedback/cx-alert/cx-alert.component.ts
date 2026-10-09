import {
  afterRenderEffect,
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  EventEmitter,
  HostBinding,
  HostListener,
  inject,
  Input,
  Output,
  signal,
  viewChild,
} from "@angular/core";
import { type CxIconName } from "../../../icons/manifest";
import { CxButtonComponent, type CxButtonMood } from "../../actions/cx-button";
import { CxIconButtonComponent } from "../../actions/cx-icon-button";
import { CxIconComponent } from "../../media/cx-icon";
import { CxSpinnerComponent } from "../cx-spinner";

export type CxAlertMood = "default" | "info" | "warning" | "success" | "danger";

export interface CxAlertAction {
  readonly text: string;
  readonly href?: string;
}

@Component({
  selector: "cx-alert",
  imports: [
    CxButtonComponent,
    CxIconButtonComponent,
    CxIconComponent,
    CxSpinnerComponent,
  ],
  templateUrl: "./cx-alert.component.html",
  styleUrl: "./cx-alert.component.scss",
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CxAlertComponent {
  private static nextId = 0;
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private focusAfterRender = false;
  private readonly description =
    viewChild<ElementRef<HTMLElement>>("description");
  private readonly body = viewChild<ElementRef<HTMLElement>>("body");
  private readonly trigger = viewChild("trigger", {
    read: ElementRef<HTMLElement>,
  });
  private readonly expandableState = signal(false);
  private readonly expandedState = signal(false);
  protected readonly hasDescription = signal(false);
  protected readonly expanded$ = this.expandedState.asReadonly();
  protected readonly bodyId = `cx-alert-body-${++CxAlertComponent.nextId}`;
  @Input() heading = "";
  @Input() mood: CxAlertMood = "default";
  @Input() loading = false;
  @Input() action: CxAlertAction | undefined;
  @Input() dismissible = false;

  @Input({ transform: booleanAttribute })
  public set expandable(value: boolean) {
    if (value && !this.expandedState()) this.restoreBodyFocus();
    this.expandableState.set(value);
  }

  @Input({ transform: booleanAttribute })
  public set expanded(value: boolean) {
    this.setExpanded(value);
  }

  @Output() readonly actionSelect = new EventEmitter<CxAlertAction>();
  @Output() readonly dismiss = new EventEmitter<void>();
  @Output() readonly expandedChange = new EventEmitter<boolean>();

  constructor() {
    afterRenderEffect((onCleanup) => {
      const trigger = this.trigger()?.nativeElement.querySelector("button");
      if (this.focusAfterRender && trigger) {
        trigger.focus();
        this.focusAfterRender = false;
      }
      const description = this.description()?.nativeElement;
      if (!description) {
        this.hasDescription.set(false);
        return;
      }
      const sync = (): void => {
        this.hasDescription.set(this.hasMeaningfulContent(description));
      };
      sync();
      const observer = new MutationObserver(sync);
      observer.observe(description, {
        childList: true,
        subtree: true,
        characterData: true,
        attributes: true,
        attributeFilter: ["hidden"],
      });
      onCleanup(() => observer.disconnect());
    });
  }

  protected get canExpand(): boolean {
    return this.expandableState() && this.hasDescription();
  }

  protected get bodyVisible(): boolean {
    return !this.canExpand || this.expandedState();
  }

  protected toggle(): void {
    if (!this.canExpand) return;
    const next = !this.expandedState();
    this.setExpanded(next);
    this.expandedChange.emit(next);
  }

  @HostListener("click", ["$event"])
  protected onSurfaceClick(event: MouseEvent): void {
    if (!this.canExpand || event.defaultPrevented || event.button !== 0) return;
    // Stop at this alert: a focusable ancestor is not one of its controls.
    // The composed path also preserves controls projected through shadow DOM.
    for (const target of event.composedPath()) {
      if (target === this.host.nativeElement) break;
      if (!(target instanceof Element)) continue;
      if (
        target.matches(
          'a[href], area[href], button, input, select, textarea, label, summary, audio[controls], video[controls], iframe, [role="button"], [role="link"], [role="checkbox"], [role="radio"], [role="switch"], [role="textbox"], [role="combobox"], [role="slider"], [role="menuitem"], [role="option"], [tabindex]:not([tabindex="-1"])',
        ) ||
        (target instanceof HTMLElement && target.isContentEditable)
      )
        return;
    }
    const selection = this.host.nativeElement.ownerDocument.getSelection();
    if (
      selection &&
      !selection.isCollapsed &&
      selection.rangeCount &&
      selection.getRangeAt(0).intersectsNode(this.host.nativeElement)
    )
      return;
    this.toggle();
  }

  private setExpanded(value: boolean): void {
    if (!value && this.canExpand) this.restoreBodyFocus();
    this.expandedState.set(value);
  }

  private restoreBodyFocus(): void {
    const body = this.body()?.nativeElement;
    const active = this.host.nativeElement.ownerDocument.activeElement;
    if (body && active && body.contains(active)) {
      const trigger = this.trigger()?.nativeElement.querySelector("button");
      if (trigger) trigger.focus();
      else this.focusAfterRender = true;
    }
  }

  private hasMeaningfulContent(node: Node): boolean {
    if (node.nodeType === Node.TEXT_NODE) return !!node.textContent?.trim();
    if (!(node instanceof Element) || node.hasAttribute("hidden")) return false;
    if (node.matches("script, style, template")) return false;
    if (
      node.matches(
        "svg, img, canvas, video, audio, iframe, input, select, textarea",
      )
    )
      return true;
    return Array.from(node.childNodes).some((child) =>
      this.hasMeaningfulContent(child),
    );
  }

  @HostBinding("class")
  protected get hostClass(): string {
    const classes = ["cx-alert", `cx-alert--${this.mood}`];
    if (!this.hasHeading()) classes.push("cx-alert--hidden");
    return classes.join(" ");
  }

  @HostBinding("attr.role")
  protected get hostRole(): "alert" | "status" {
    return this.mood === "danger" || this.mood === "warning"
      ? "alert"
      : "status";
  }

  @HostBinding("attr.aria-busy")
  protected get hostBusy(): "true" | null {
    return this.loading ? "true" : null;
  }

  protected get resolvedHeading(): string {
    return this.heading.trim();
  }

  protected hasHeading(): boolean {
    return this.resolvedHeading.length > 0;
  }

  protected get resolvedIcon(): CxIconName {
    switch (this.mood) {
      case "success":
        return "check";
      case "warning":
        return "warning";
      case "danger":
        return "error";
      case "info":
      case "default":
      default:
        return "info";
    }
  }

  protected get visibleAction(): CxAlertAction | undefined {
    return this.action?.text.trim() ? this.action : undefined;
  }

  protected get actionMood(): CxButtonMood {
    return this.mood;
  }

  protected actionHref(action: CxAlertAction): string | undefined {
    return action.href?.trim() || undefined;
  }

  protected get dismissAriaLabel(): string {
    return `Dismiss ${this.resolvedHeading}`;
  }

  protected onActionSelect(action: CxAlertAction): void {
    if (!this.actionHref(action)) {
      this.actionSelect.emit(action);
    }
  }

  protected onDismiss(): void {
    this.dismiss.emit();
  }
}
