import { A11yModule } from "@angular/cdk/a11y";
import { DOCUMENT, NgTemplateOutlet } from "@angular/common";
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  NgZone,
  afterEveryRender,
  computed,
  effect,
  inject,
  input,
  model,
  output,
  signal,
  untracked,
  viewChild,
} from "@angular/core";
import { CxButtonComponent } from "../../primitives/actions/cx-button";
import { CxShortcutKeyComponent } from "../../primitives/display/cx-shortcut-key";
import { CxTextShimmerComponent } from "../../primitives/display/cx-text-shimmer";
import { CxMarkdownComponent } from "../../primitives/display/cx-markdown";
import { CxIconComponent } from "../../primitives/media/cx-icon";
import {
  CxOverlayStateService,
  type CxOverlayStateHandle,
} from "../../primitives/overlay/overlay-state";
import { CxTooltipDirective } from "../../primitives/overlay/cx-tooltip";
import { isHostVisible } from "../../primitives/shared/host-visibility";
import {
  filterAssistantActions,
  type CxAssistantAction,
  type CxAssistantAnswer,
  type CxAssistantContext,
  type CxAssistantPicker,
  type CxAssistantResponder,
  type CxAssistantTurn,
} from "./assistant.types";

type Mode = "idle" | "ribbon" | "open";
type Phase = "empty" | "thinking" | "answered" | "error";
type Motion = "morph" | "collapse" | "open" | "close" | "resize";
const MOTION_MS: Record<Motion, number> = {
  morph: 300,
  collapse: 420,
  open: 560,
  close: 520,
  resize: 420,
};
let nextId = 0;

@Component({
  selector: "cx-assistant",
  imports: [
    A11yModule,
    CxTooltipDirective,
    NgTemplateOutlet,
    CxButtonComponent,
    CxShortcutKeyComponent,
    CxTextShimmerComponent,
    CxMarkdownComponent,
    CxIconComponent,
  ],
  templateUrl: "./cx-assistant.component.html",
  styleUrl: "./cx-assistant.component.scss",
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CxAssistantComponent {
  readonly heading = input("Assistant");
  readonly open = model(false);
  readonly context = input<CxAssistantContext | null>(null);
  readonly actions = input<readonly CxAssistantAction[]>([]);
  readonly quickActions = input<readonly CxAssistantAction[]>([]);
  readonly respond = input<CxAssistantResponder | null>(null);
  readonly pick = input<CxAssistantPicker | null>(null);
  /** Disable in embedded specimens. Mount one shortcut owner per application. */
  readonly shortcut = input(true);
  /** UTF-8 bytes give a deliberately conservative token upper bound, without a model dependency. */
  readonly maxInputTokens = input(512);
  readonly select = output<string>();
  readonly contextChange = output<CxAssistantContext | null>();

  private readonly document = inject(DOCUMENT);
  private readonly host =
    inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  private readonly destroyRef = inject(DestroyRef);
  private readonly zone = inject(NgZone);
  private readonly overlays = inject(CxOverlayStateService);
  private overlay?: CxOverlayStateHandle;
  private readonly box = viewChild.required<ElementRef<HTMLElement>>("box");
  private readonly ring = viewChild<ElementRef<HTMLElement>>("ring");
  private readonly glowBand = viewChild<ElementRef<HTMLElement>>("glowBand");
  private readonly content = viewChild<ElementRef<HTMLElement>>("content");
  private readonly questionInput =
    viewChild<ElementRef<HTMLInputElement>>("questionInput");
  private readonly followUpInput =
    viewChild<ElementRef<HTMLInputElement>>("followUpInput");
  private readonly reducedMotion = this.document.defaultView?.matchMedia(
    "(prefers-reduced-motion: reduce)",
  );
  protected readonly id = `cx-assistant-${++nextId}`;
  protected readonly shortcutParts = /Mac|iPhone|iPad/.test(
    this.document.defaultView?.navigator.platform ?? "",
  )
    ? ["Cmd", "K"]
    : ["Ctrl", "K"];
  protected readonly actionShortcut =
    this.shortcutParts[0] === "Cmd" ? ["Cmd", "Enter"] : ["Ctrl", "Enter"];
  protected readonly query = signal("");
  protected readonly inputLimit = computed(() =>
    Number.isFinite(this.maxInputTokens())
      ? Math.max(1, Math.floor(this.maxInputTokens()))
      : 512,
  );
  protected readonly overInputLimit = computed(
    () =>
      new TextEncoder().encode(this.query().trim()).length > this.inputLimit(),
  );
  protected readonly question = signal("");
  protected readonly error = signal("");
  protected readonly answer = signal<CxAssistantAnswer | null>(null);
  protected readonly history = signal<readonly CxAssistantTurn[]>([]);
  protected readonly selectedContext = signal<CxAssistantContext | null>(null);
  protected readonly activeContext = computed(
    () => this.selectedContext() ?? this.context(),
  );
  protected readonly choices = computed(() =>
    this.query().trim()
      ? filterAssistantActions(this.actions(), this.query())
          .filter((action) => action.query?.trim() !== this.query().trim())
          .slice(0, 8)
      : this.quickActions(),
  );
  protected readonly activeIndex = signal(-1);
  protected readonly activeChoice = computed<CxAssistantAction | undefined>(
    () =>
      this.choices()[this.activeIndex()] ??
      (this.query().trim()
        ? this.choices().find((action) => !action.disabled)
        : undefined),
  );
  protected readonly hovered = signal(false);
  protected readonly picking = signal(false);
  protected readonly greeting = signal(true);
  protected readonly mode = computed<Mode>(() =>
    this.open()
      ? "open"
      : this.hovered() || this.picking() || this.greeting()
        ? "ribbon"
        : "idle",
  );
  protected readonly motion = signal<Motion>("morph");
  protected readonly moving = signal(false);
  protected readonly ribbonMounted = signal(false);
  protected readonly ribbonLeaving = signal(false);
  protected readonly windowMounted = signal(false);
  protected readonly windowLeaving = signal(false);
  protected readonly shownPhase = signal<Phase>("empty");
  protected readonly leavingPhase = signal<Phase | null>(null);
  protected readonly ringPoured = signal(false);
  protected readonly blinking = signal(false);
  protected readonly trapsFocus = signal(false);
  protected readonly pickTarget = signal<{
    element: HTMLElement;
    context: CxAssistantContext;
    left: number;
    top: number;
    width: number;
    height: number;
  } | null>(null);
  // The fixed viewport overlay needs valid geometry before ResizeObserver's first delivery.
  private readonly rootHeight = signal(
    this.document.documentElement.clientHeight,
  );
  private readonly rootWidth = signal(
    this.document.documentElement.clientWidth,
  );
  private readonly windowHeight = signal(0);
  protected readonly geometry = computed(() => {
    if (this.mode() === "idle")
      return { width: 112, height: 6, bottom: 6, radius: 3 };
    if (this.mode() === "ribbon")
      return {
        width: Math.min(360, this.rootWidth() - 32),
        height: 52,
        bottom: 16,
        radius: 26,
      };
    const height = this.windowHeight() || 52;
    return {
      width: Math.min(640, this.rootWidth() - 32),
      height,
      bottom: Math.max(this.rootHeight() * 0.78 - height, 16),
      radius: 20,
    };
  });
  private hoverArmed = true;
  private request?: AbortController;
  private busy = false;
  private focusPending = false;
  private gradientAngle = 0;
  private readonly timers = new Map<string, ReturnType<typeof setTimeout>>();

  constructor() {
    const keydown = (event: KeyboardEvent) => this.onDocumentKeydown(event);
    this.document.addEventListener("keydown", keydown);
    const animationAllowed = signal(
      !this.document.hidden && !this.reducedMotion?.matches,
    );
    const updateAnimationAllowed = () =>
      animationAllowed.set(
        !this.document.hidden && !this.reducedMotion?.matches,
      );
    this.document.addEventListener("visibilitychange", updateAnimationAllowed);
    this.reducedMotion?.addEventListener("change", updateAnimationAllowed);
    effect((cleanup) => {
      const ring = this.ring()?.nativeElement;
      const glow = this.glowBand()?.nativeElement;
      const view = this.document.defaultView;
      const mode = this.mode();
      const thinking = mode === "open" && this.shownPhase() === "thinking";
      const collapsing =
        this.moving() && ["collapse", "close"].includes(this.motion());
      if (
        !ring ||
        !glow ||
        !view ||
        !animationAllowed() ||
        !(mode === "ribbon" || thinking || collapsing)
      )
        return;

      const period = thinking ? 1200 : 1800;
      let previousTime: number | undefined;
      let frame = 0;
      // Paint the angle on the clipped surfaces themselves. Rotating an oversized
      // child lets its rasterized bounds become a second clip during a size change.
      const paint = (time: number) => {
        if (previousTime !== undefined)
          this.gradientAngle =
            (this.gradientAngle + ((time - previousTime) * 360) / period) % 360;
        previousTime = time;
        const gradient = `conic-gradient(from ${this.gradientAngle}deg, var(--primary), var(--accent), var(--primary), var(--purple), var(--pink), var(--purple), var(--primary))`;
        ring.style.backgroundImage = gradient;
        glow.style.backgroundImage = gradient;
        frame = view.requestAnimationFrame(paint);
      };
      this.zone.runOutsideAngular(() => {
        frame = view.requestAnimationFrame(paint);
      });
      cleanup(() => view.cancelAnimationFrame(frame));
    });
    const rootObserver = new ResizeObserver(() => {
      this.rootHeight.set(this.host.clientHeight);
      this.rootWidth.set(this.host.clientWidth);
    });
    rootObserver.observe(this.host);
    const observer = new ResizeObserver((entries) => {
      const entry = entries.at(-1);
      if (entry)
        this.windowHeight.set(
          Math.ceil(entry.target.getBoundingClientRect().height),
        );
    });
    effect((cleanup) => {
      const el = this.content()?.nativeElement;
      if (el) {
        observer.observe(el);
        cleanup(() => observer.unobserve(el));
      }
    });
    this.later("greeting", () => this.greeting.set(false), 1500);
    let previous: Mode = "idle";
    effect(() => {
      const mode = this.mode();
      untracked(() => {
        if (mode === previous) return;
        const motion: Motion =
          mode === "open"
            ? "open"
            : previous === "open"
              ? "close"
              : mode === "idle"
                ? "collapse"
                : "morph";
        previous = mode;
        this.motion.set(motion);
        this.moving.set(true);
        this.later(
          "motion",
          () => {
            this.motion.set(motion === "open" ? "resize" : "morph");
            this.moving.set(false);
          },
          MOTION_MS[motion],
        );
        this.setLayer("ribbon", mode === "ribbon");
        this.setLayer("window", mode === "open");
        this.ringPoured.set(mode !== "idle");
        this.cancel("blink");
        this.blinking.set(false);
        if (mode === "idle")
          this.later(
            "blink",
            () => {
              this.blinking.set(true);
              this.later("blink", () => this.blinking.set(false), 1100);
            },
            MOTION_MS[motion],
          );
      });
    });
    effect(() => {
      const open = this.open();
      untracked(() => {
        if (open) this.focusPending = true;
        if (open && !this.overlay)
          this.overlay = this.overlays.capture({
            surface: () => this.box().nativeElement,
            layerSurfaces: () => [this.host],
            isActive: () => isHostVisible(this.host),
            onEscape: () => this.escape(),
          });
        if (!open) {
          this.request?.abort();
          if (this.busy) {
            this.busy = false;
            this.setPhase("empty");
          }
          this.release();
        }
      });
    });
    effect(() => {
      this.context();
      untracked(() => {
        this.selectedContext.set(null);
        this.reset();
      });
    });
    effect(() => {
      this.questionInput();
      this.followUpInput();
      this.focusPending = true;
    });
    afterEveryRender(() => {
      const ownsFocus = this.open() && this.overlays.isTopmost(this.overlay);
      this.trapsFocus.set(ownsFocus);
      if (!ownsFocus || !this.focusPending) return;
      const input =
        this.questionInput()?.nativeElement ??
        this.followUpInput()?.nativeElement;
      if (input && !input.closest("[inert]")) {
        // A retained input may have been edited and cleared between renders.
        if (input.value !== this.query()) input.value = this.query();
        input.focus({ preventScroll: true });
        this.focusPending = false;
      }
    });
    this.destroyRef.onDestroy(() => {
      this.request?.abort();
      this.release();
      this.document.removeEventListener("keydown", keydown);
      this.document.removeEventListener(
        "visibilitychange",
        updateAnimationAllowed,
      );
      this.reducedMotion?.removeEventListener("change", updateAnimationAllowed);
      rootObserver.disconnect();
      observer.disconnect();
      for (const timer of this.timers.values()) clearTimeout(timer);
    });
  }
  protected onPointerEnter(): void {
    if (this.hoverArmed) this.later("hover", () => this.hovered.set(true), 140);
  }
  protected onPointerLeave(): void {
    this.hoverArmed = true;
    this.later("hover", () => this.hovered.set(false), 220);
  }
  protected onHitClick(): void {
    if (!this.open() && !this.picking()) this.openWindow();
  }
  protected onBoxClick(event: MouseEvent): void {
    if (
      !(event.target as Element).closest(".assistant__content, button") &&
      !this.picking()
    )
      this.openWindow();
  }
  protected openWindow(): void {
    this.cancel("greeting");
    this.greeting.set(false);
    this.picking.set(false);
    this.pickTarget.set(null);
    this.open.set(true);
  }
  protected close(): void {
    this.request?.abort();
    this.cancel("hover");
    this.hovered.set(false);
    this.greeting.set(false);
    this.hoverArmed = false;
    if (this.busy) {
      this.busy = false;
      this.setPhase("empty");
    }
    this.open.set(false);
  }
  protected setQuery(value: string): void {
    this.query.set(value);
    this.activeIndex.set(-1);
  }
  protected inputKey(event: KeyboardEvent): void {
    if (event.isComposing || event.metaKey || event.ctrlKey) return;
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      const choices = this.choices();
      if (!choices.length) return;
      event.preventDefault();
      const step = event.key === "ArrowDown" ? 1 : -1;
      let i = this.activeIndex() < 0 && step < 0 ? 0 : this.activeIndex();
      for (let n = 0; n < choices.length; n++) {
        i = (i + step + choices.length) % choices.length;
        if (!choices[i].disabled) break;
      }
      this.activeIndex.set(i);
      this.document
        .getElementById(`${this.id}-choice-${i}`)
        ?.scrollIntoView({ block: "nearest" });
    } else if (event.key === "Enter") {
      event.preventDefault();
      this.submit();
    }
  }
  protected submit(): void {
    if (this.overInputLimit()) return;
    const action = this.activeChoice();
    if (action) this.choose(action);
    else void this.ask();
  }
  protected choose(action: CxAssistantAction): void {
    if (action.disabled) return;
    if (action.query !== undefined) {
      this.setQuery(action.query);
      this.setPhase("empty");
      this.focusPending = true;
      return;
    }
    this.close();
    this.select.emit(action.id);
  }
  protected async ask(): Promise<void> {
    const question = this.query().trim();
    if (!question || this.busy || this.overInputLimit()) return;
    const respond = this.respond();
    if (!respond) {
      this.error.set(
        "Questions are not connected here. Choose an available action.",
      );
      this.setPhase("error");
      return;
    }
    this.request?.abort();
    const request = new AbortController();
    this.request = request;
    this.busy = true;
    if (this.answer())
      this.history.update((turns) =>
        [...turns, { question: this.question(), answer: this.answer()! }].slice(
          -10,
        ),
      );
    this.answer.set(null);
    this.question.set(question);
    this.error.set("");
    this.setPhase("thinking");
    this.box().nativeElement.focus({ preventScroll: true });
    try {
      const answer = await respond({
        question,
        context: this.activeContext(),
        history: this.history(),
        signal: request.signal,
      });
      if (request.signal.aborted) return;
      this.busy = false;
      this.answer.set(answer);
      this.query.set("");
      this.activeIndex.set(-1);
      this.setPhase("answered");
    } catch (error) {
      if (request.signal.aborted) return;
      this.busy = false;
      this.error.set(
        error instanceof Error
          ? error.message
          : "The answer could not be loaded. Try again.",
      );
      this.setPhase("error");
    }
  }
  protected back(): void {
    const turns = this.history();
    const last = turns.at(-1);
    if (!last) {
      this.reset();
      return;
    }
    this.history.set(turns.slice(0, -1));
    this.question.set(last.question);
    this.answer.set(last.answer);
    this.query.set("");
    this.setPhase("answered");
  }
  protected reset(): void {
    this.request?.abort();
    this.busy = false;
    this.answer.set(null);
    this.history.set([]);
    this.query.set("");
    this.question.set("");
    this.error.set("");
    this.setPhase("empty");
  }
  protected togglePick(event: Event): void {
    event.stopPropagation();
    if (!this.pick()) return;
    if (this.picking()) {
      this.cancelPick();
      return;
    }
    this.close();
    this.picking.set(true);
  }
  protected cancelPick(): void {
    this.picking.set(false);
    this.pickTarget.set(null);
  }
  protected onPickMove(event: PointerEvent): void {
    this.pickTarget.set(this.findPickTarget(event.clientX, event.clientY));
  }
  protected onPickLeave(): void {
    this.pickTarget.set(null);
  }
  protected onPickClick(event: MouseEvent): void {
    const target = this.findPickTarget(event.clientX, event.clientY);
    if (!target) {
      this.cancelPick();
      return;
    }
    this.reset();
    this.selectedContext.set(target.context);
    this.contextChange.emit(target.context);
    this.openWindow();
  }
  private findPickTarget(x: number, y: number) {
    const element = this.document
      .elementsFromPoint(x, y)
      .find((el) => !this.host.contains(el));
    const target = element && this.pick()?.(element);
    if (!target) return null;
    const rect = target.element.getBoundingClientRect(),
      host = this.host.getBoundingClientRect();
    return {
      ...target,
      left: rect.left - host.left,
      top: rect.top - host.top,
      width: rect.width,
      height: rect.height,
    };
  }
  private onDocumentKeydown(event: KeyboardEvent): void {
    if (
      event.defaultPrevented ||
      event.isComposing ||
      event.repeat ||
      !isHostVisible(this.host)
    )
      return;
    if (
      this.shortcut() &&
      (event.metaKey || event.ctrlKey) &&
      !event.altKey &&
      !event.shiftKey &&
      event.key.toLowerCase() === "k"
    ) {
      event.preventDefault();
      this.open() ? this.close() : this.openWindow();
    } else if (event.key === "Escape" && this.picking()) {
      event.preventDefault();
      this.cancelPick();
    } else if (
      this.open() &&
      this.overlays.isTopmost(this.overlay) &&
      (event.metaKey || event.ctrlKey) &&
      event.key === "Enter"
    ) {
      event.preventDefault();
      const action = this.answer()?.action;
      if (this.shownPhase() === "answered" && action && !this.query().trim())
        this.choose(action);
      else void this.ask();
    }
  }
  private escape(): void {
    if (this.busy) this.close();
    else if (this.query()) this.setQuery("");
    else if (this.history().length) this.back();
    else this.close();
  }
  private release(): void {
    if (this.overlay) {
      this.overlays.release(this.overlay);
      this.overlay = undefined;
    }
  }
  private setPhase(phase: Phase): void {
    this.cancel("phase");
    if (this.shownPhase() === phase) {
      // A fast response can return before the outgoing input is replaced.
      this.leavingPhase.set(null);
      this.focusPending = true;
      return;
    }
    this.leavingPhase.set(this.shownPhase());
    this.later(
      "phase",
      () => {
        this.shownPhase.set(phase);
        this.leavingPhase.set(null);
      },
      120,
    );
  }
  private setLayer(layer: "ribbon" | "window", mounted: boolean): void {
    const state = layer === "ribbon" ? this.ribbonMounted : this.windowMounted,
      leaving = layer === "ribbon" ? this.ribbonLeaving : this.windowLeaving;
    this.cancel(layer);
    if (mounted) {
      leaving.set(false);
      state.set(true);
      return;
    }
    if (!state()) return;
    leaving.set(true);
    const collapsing =
      this.motion() === "close" || this.motion() === "collapse";
    this.later(
      layer,
      () => {
        state.set(false);
        leaving.set(false);
      },
      !collapsing ? 120 : layer === "window" ? 560 : 400,
    );
  }
  private cancel(key: string): void {
    clearTimeout(this.timers.get(key));
    this.timers.delete(key);
  }
  private later(key: string, callback: () => void, ms: number): void {
    this.cancel(key);
    this.timers.set(
      key,
      setTimeout(
        () => {
          this.timers.delete(key);
          callback();
        },
        this.reducedMotion?.matches ? 0 : ms,
      ),
    );
  }
}
