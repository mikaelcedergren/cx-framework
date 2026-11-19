import { InteractivityChecker } from "@angular/cdk/a11y";

/** Internal ownership of a content region's earned Tab stop. */
export class ContentFocusObserver {
  private readonly resize: ResizeObserver;
  private readonly mutations: MutationObserver;
  private frame: number | undefined;
  private ownsRegion = false;

  constructor(
    private readonly element: HTMLElement,
    private readonly checker: InteractivityChecker,
    private readonly scrollLabel?: () => string,
    private readonly keyboardManaged: () => boolean = () => false,
  ) {
    this.resize = new ResizeObserver(() => this.schedule());
    this.mutations = new MutationObserver((records) => {
      if (records.some((record) => record.type === "childList"))
        this.observeSizes();
      this.schedule();
    });
    this.mutations.observe(element, {
      subtree: true,
      childList: true,
      characterData: true,
      attributes: true,
      attributeFilter: [
        "hidden",
        "inert",
        "disabled",
        "tabindex",
        "href",
        "contenteditable",
        "class",
        "style",
        "role",
        "aria-hidden",
      ],
    });
    this.observeSizes();
    this.refresh();
  }

  refresh(): void {
    const element = this.element;
    const tabPanel = element.getAttribute("role") === "tabpanel";
    const style = getComputedStyle(element);
    const scrolls =
      /auto|scroll/.test(style.overflowY) &&
      element.scrollHeight > element.clientHeight + 1;
    const available = (node: Element): node is HTMLElement => {
      if (
        !(node instanceof HTMLElement) ||
        node.closest('[inert], [hidden], [aria-hidden="true"]')
      )
        return false;
      const style = getComputedStyle(node);
      return (
        style.display !== "none" &&
        style.visibility === "visible" &&
        !["SCRIPT", "STYLE", "TEMPLATE"].includes(node.tagName)
      );
    };
    const tabbable = (node: Element): boolean =>
      available(node) &&
      this.checker.isFocusable(node) &&
      this.checker.isTabbable(node);
    const descendants = Array.from(element.querySelectorAll<HTMLElement>("*"));
    const hasControl = descendants.some(tabbable);

    // Follow content order, not the presence of a button somewhere later in a
    // document. Introductory text still needs an entry point after the tabs.
    const firstContent = (
      parent: HTMLElement,
    ): "control" | "text" | undefined => {
      for (const node of parent.childNodes) {
        if (node.nodeType === Node.TEXT_NODE && node.textContent?.trim())
          return "text";
        if (!(node instanceof HTMLElement) || !available(node)) continue;
        if (tabbable(node)) return "control";
        // A field's label is part of entering that field, not a separate text stop.
        if (
          node instanceof HTMLLabelElement &&
          node.control &&
          tabbable(node.control)
        )
          return "control";
        if (
          (node instanceof HTMLImageElement && node.alt) ||
          node.getAttribute("role") === "img"
        )
          return "text";
        const child = firstContent(node);
        if (child) return child;
      }
      return undefined;
    };
    const first = tabPanel ? firstContent(element) : undefined;
    const needsStop =
      !this.keyboardManaged() &&
      (tabPanel
        ? first === "text" || (scrolls && !hasControl)
        : scrolls && !hasControl);
    // Explicit -1 also prevents browsers adding an automatic scroll-container
    // stop when the controls inside already provide keyboard access.
    const value = needsStop ? "0" : tabPanel || scrolls ? "-1" : null;
    if (value === null) element.removeAttribute("tabindex");
    else if (element.getAttribute("tabindex") !== value)
      element.setAttribute("tabindex", value);

    if (tabPanel) {
      this.ownsRegion = false; // The owning component supplies tab-panel semantics.
    } else if (needsStop && this.scrollLabel) {
      this.ownsRegion = true;
      if (element.getAttribute("role") !== "region")
        element.setAttribute("role", "region");
      const label = this.scrollLabel();
      if (element.getAttribute("aria-label") !== label)
        element.setAttribute("aria-label", label);
    } else if (this.ownsRegion) {
      element.removeAttribute("role");
      element.removeAttribute("aria-label");
      this.ownsRegion = false;
    }
  }

  disconnect(): void {
    this.resize.disconnect();
    this.mutations.disconnect();
    if (this.frame !== undefined) cancelAnimationFrame(this.frame);
    this.element.removeAttribute("tabindex");
    if (this.ownsRegion) {
      this.element.removeAttribute("role");
      this.element.removeAttribute("aria-label");
    }
  }

  private observeSizes(): void {
    this.resize.disconnect();
    this.resize.observe(this.element);
    for (const child of this.element.children) this.resize.observe(child);
  }

  private schedule(): void {
    if (this.frame !== undefined) return;
    this.frame = requestAnimationFrame(() => {
      this.frame = undefined;
      this.refresh();
    });
  }
}
