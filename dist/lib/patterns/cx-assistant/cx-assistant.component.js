import { A11yModule } from "@angular/cdk/a11y";
import { DOCUMENT, NgTemplateOutlet } from "@angular/common";
import { ChangeDetectionStrategy, Component, DestroyRef, ElementRef, NgZone, afterEveryRender, computed, effect, inject, input, model, output, signal, untracked, viewChild, } from "@angular/core";
import { CxButtonComponent } from "../../primitives/actions/cx-button/index.js";
import { CxShortcutKeyComponent } from "../../primitives/display/cx-shortcut-key/index.js";
import { CxTextShimmerComponent } from "../../primitives/display/cx-text-shimmer/index.js";
import { CxMarkdownComponent } from "../../primitives/display/cx-markdown/index.js";
import { CxIconComponent } from "../../primitives/media/cx-icon/index.js";
import { CxOverlayStateService, } from "../../primitives/overlay/overlay-state.js";
import { CxTooltipDirective } from "../../primitives/overlay/cx-tooltip/index.js";
import { isHostVisible } from "../../primitives/shared/host-visibility.js";
import { filterAssistantActions, } from "./assistant.types.js";
import * as i0 from "@angular/core";
import * as i1 from "@angular/cdk/a11y";
const MOTION_MS = {
    morph: 300,
    collapse: 420,
    open: 560,
    close: 520,
    resize: 420,
};
let nextId = 0;
export class CxAssistantComponent {
    heading = input("Assistant", /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "heading" }] : /* istanbul ignore next */ []));
    open = model(false, /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "open" }] : /* istanbul ignore next */ []));
    context = input(null, /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "context" }] : /* istanbul ignore next */ []));
    actions = input([], /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "actions" }] : /* istanbul ignore next */ []));
    quickActions = input([], /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "quickActions" }] : /* istanbul ignore next */ []));
    respond = input(null, /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "respond" }] : /* istanbul ignore next */ []));
    pick = input(null, /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "pick" }] : /* istanbul ignore next */ []));
    /** Disable in embedded specimens. Mount one shortcut owner per application. */
    shortcut = input(true, /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "shortcut" }] : /* istanbul ignore next */ []));
    /** UTF-8 bytes give a deliberately conservative token upper bound, without a model dependency. */
    maxInputTokens = input(512, /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "maxInputTokens" }] : /* istanbul ignore next */ []));
    select = output();
    contextChange = output();
    document = inject(DOCUMENT);
    host = inject(ElementRef).nativeElement;
    destroyRef = inject(DestroyRef);
    zone = inject(NgZone);
    overlays = inject(CxOverlayStateService);
    overlay;
    box = viewChild.required("box", /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "box" }] : /* istanbul ignore next */ []));
    ring = viewChild("ring", /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "ring" }] : /* istanbul ignore next */ []));
    glowBand = viewChild("glowBand", /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "glowBand" }] : /* istanbul ignore next */ []));
    content = viewChild("content", /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "content" }] : /* istanbul ignore next */ []));
    questionInput = viewChild("questionInput", /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "questionInput" }] : /* istanbul ignore next */ []));
    followUpInput = viewChild("followUpInput", /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "followUpInput" }] : /* istanbul ignore next */ []));
    reducedMotion = this.document.defaultView?.matchMedia("(prefers-reduced-motion: reduce)");
    id = `cx-assistant-${++nextId}`;
    shortcutParts = /Mac|iPhone|iPad/.test(this.document.defaultView?.navigator.platform ?? "")
        ? ["Cmd", "K"]
        : ["Ctrl", "K"];
    actionShortcut = this.shortcutParts[0] === "Cmd" ? ["Cmd", "Enter"] : ["Ctrl", "Enter"];
    query = signal("", /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "query" }] : /* istanbul ignore next */ []));
    inputLimit = computed(() => Number.isFinite(this.maxInputTokens())
        ? Math.max(1, Math.floor(this.maxInputTokens()))
        : 512, /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "inputLimit" }] : /* istanbul ignore next */ []));
    overInputLimit = computed(() => new TextEncoder().encode(this.query().trim()).length > this.inputLimit(), /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "overInputLimit" }] : /* istanbul ignore next */ []));
    question = signal("", /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "question" }] : /* istanbul ignore next */ []));
    error = signal("", /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "error" }] : /* istanbul ignore next */ []));
    answer = signal(null, /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "answer" }] : /* istanbul ignore next */ []));
    history = signal([], /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "history" }] : /* istanbul ignore next */ []));
    selectedContext = signal(null, /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "selectedContext" }] : /* istanbul ignore next */ []));
    activeContext = computed(() => this.selectedContext() ?? this.context(), /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "activeContext" }] : /* istanbul ignore next */ []));
    choices = computed(() => this.query().trim()
        ? filterAssistantActions(this.actions(), this.query())
            .filter((action) => action.query?.trim() !== this.query().trim())
            .slice(0, 8)
        : this.quickActions(), /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "choices" }] : /* istanbul ignore next */ []));
    activeIndex = signal(-1, /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "activeIndex" }] : /* istanbul ignore next */ []));
    activeChoice = computed(() => this.choices()[this.activeIndex()] ??
        (this.query().trim()
            ? this.choices().find((action) => !action.disabled)
            : undefined), /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "activeChoice" }] : /* istanbul ignore next */ []));
    hovered = signal(false, /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "hovered" }] : /* istanbul ignore next */ []));
    picking = signal(false, /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "picking" }] : /* istanbul ignore next */ []));
    greeting = signal(true, /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "greeting" }] : /* istanbul ignore next */ []));
    mode = computed(() => this.open()
        ? "open"
        : this.hovered() || this.picking() || this.greeting()
            ? "ribbon"
            : "idle", /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "mode" }] : /* istanbul ignore next */ []));
    motion = signal("morph", /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "motion" }] : /* istanbul ignore next */ []));
    moving = signal(false, /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "moving" }] : /* istanbul ignore next */ []));
    ribbonMounted = signal(false, /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "ribbonMounted" }] : /* istanbul ignore next */ []));
    ribbonLeaving = signal(false, /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "ribbonLeaving" }] : /* istanbul ignore next */ []));
    windowMounted = signal(false, /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "windowMounted" }] : /* istanbul ignore next */ []));
    windowLeaving = signal(false, /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "windowLeaving" }] : /* istanbul ignore next */ []));
    shownPhase = signal("empty", /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "shownPhase" }] : /* istanbul ignore next */ []));
    leavingPhase = signal(null, /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "leavingPhase" }] : /* istanbul ignore next */ []));
    ringPoured = signal(false, /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "ringPoured" }] : /* istanbul ignore next */ []));
    blinking = signal(false, /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "blinking" }] : /* istanbul ignore next */ []));
    trapsFocus = signal(false, /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "trapsFocus" }] : /* istanbul ignore next */ []));
    pickTarget = signal(null, /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "pickTarget" }] : /* istanbul ignore next */ []));
    // The fixed viewport overlay needs valid geometry before ResizeObserver's first delivery.
    rootHeight = signal(this.document.documentElement.clientHeight, /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "rootHeight" }] : /* istanbul ignore next */ []));
    rootWidth = signal(this.document.documentElement.clientWidth, /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "rootWidth" }] : /* istanbul ignore next */ []));
    windowHeight = signal(0, /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "windowHeight" }] : /* istanbul ignore next */ []));
    geometry = computed(() => {
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
    }, /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "geometry" }] : /* istanbul ignore next */ []));
    hoverArmed = true;
    request;
    busy = false;
    focusPending = false;
    gradientAngle = 0;
    timers = new Map();
    constructor() {
        const keydown = (event) => this.onDocumentKeydown(event);
        this.document.addEventListener("keydown", keydown);
        const animationAllowed = signal(!this.document.hidden && !this.reducedMotion?.matches, /* @ts-ignore */
        ...(ngDevMode ? [{ debugName: "animationAllowed" }] : /* istanbul ignore next */ []));
        const updateAnimationAllowed = () => animationAllowed.set(!this.document.hidden && !this.reducedMotion?.matches);
        this.document.addEventListener("visibilitychange", updateAnimationAllowed);
        this.reducedMotion?.addEventListener("change", updateAnimationAllowed);
        effect((cleanup) => {
            const ring = this.ring()?.nativeElement;
            const glow = this.glowBand()?.nativeElement;
            const view = this.document.defaultView;
            const mode = this.mode();
            const thinking = mode === "open" && this.shownPhase() === "thinking";
            const collapsing = this.moving() && ["collapse", "close"].includes(this.motion());
            if (!ring ||
                !glow ||
                !view ||
                !animationAllowed() ||
                !(mode === "ribbon" || thinking || collapsing))
                return;
            const period = thinking ? 1200 : 1800;
            let previousTime;
            let frame = 0;
            // Paint the angle on the clipped surfaces themselves. Rotating an oversized
            // child lets its rasterized bounds become a second clip during a size change.
            const paint = (time) => {
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
                this.windowHeight.set(Math.ceil(entry.target.getBoundingClientRect().height));
        });
        effect((cleanup) => {
            const el = this.content()?.nativeElement;
            if (el) {
                observer.observe(el);
                cleanup(() => observer.unobserve(el));
            }
        });
        this.later("greeting", () => this.greeting.set(false), 1500);
        let previous = "idle";
        effect(() => {
            const mode = this.mode();
            untracked(() => {
                if (mode === previous)
                    return;
                const motion = mode === "open"
                    ? "open"
                    : previous === "open"
                        ? "close"
                        : mode === "idle"
                            ? "collapse"
                            : "morph";
                previous = mode;
                this.motion.set(motion);
                this.moving.set(true);
                this.later("motion", () => {
                    this.motion.set(motion === "open" ? "resize" : "morph");
                    this.moving.set(false);
                }, MOTION_MS[motion]);
                this.setLayer("ribbon", mode === "ribbon");
                this.setLayer("window", mode === "open");
                this.ringPoured.set(mode !== "idle");
                this.cancel("blink");
                this.blinking.set(false);
                if (mode === "idle")
                    this.later("blink", () => {
                        this.blinking.set(true);
                        this.later("blink", () => this.blinking.set(false), 1100);
                    }, MOTION_MS[motion]);
            });
        });
        effect(() => {
            const open = this.open();
            untracked(() => {
                if (open)
                    this.focusPending = true;
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
            if (!ownsFocus || !this.focusPending)
                return;
            const input = this.questionInput()?.nativeElement ??
                this.followUpInput()?.nativeElement;
            if (input && !input.closest("[inert]")) {
                // A retained input may have been edited and cleared between renders.
                if (input.value !== this.query())
                    input.value = this.query();
                input.focus({ preventScroll: true });
                this.focusPending = false;
            }
        });
        this.destroyRef.onDestroy(() => {
            this.request?.abort();
            this.release();
            this.document.removeEventListener("keydown", keydown);
            this.document.removeEventListener("visibilitychange", updateAnimationAllowed);
            this.reducedMotion?.removeEventListener("change", updateAnimationAllowed);
            rootObserver.disconnect();
            observer.disconnect();
            for (const timer of this.timers.values())
                clearTimeout(timer);
        });
    }
    onPointerEnter() {
        if (this.hoverArmed)
            this.later("hover", () => this.hovered.set(true), 140);
    }
    onPointerLeave() {
        this.hoverArmed = true;
        this.later("hover", () => this.hovered.set(false), 220);
    }
    onHitClick() {
        if (!this.open() && !this.picking())
            this.openWindow();
    }
    onBoxClick(event) {
        if (!event.target.closest(".assistant__content, button") &&
            !this.picking())
            this.openWindow();
    }
    openWindow() {
        this.cancel("greeting");
        this.greeting.set(false);
        this.picking.set(false);
        this.pickTarget.set(null);
        this.open.set(true);
    }
    close() {
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
    setQuery(value) {
        this.query.set(value);
        this.activeIndex.set(-1);
    }
    inputKey(event) {
        if (event.isComposing || event.metaKey || event.ctrlKey)
            return;
        if (event.key === "ArrowDown" || event.key === "ArrowUp") {
            const choices = this.choices();
            if (!choices.length)
                return;
            event.preventDefault();
            const step = event.key === "ArrowDown" ? 1 : -1;
            let i = this.activeIndex() < 0 && step < 0 ? 0 : this.activeIndex();
            for (let n = 0; n < choices.length; n++) {
                i = (i + step + choices.length) % choices.length;
                if (!choices[i].disabled)
                    break;
            }
            this.activeIndex.set(i);
            this.document
                .getElementById(`${this.id}-choice-${i}`)
                ?.scrollIntoView({ block: "nearest" });
        }
        else if (event.key === "Enter") {
            event.preventDefault();
            this.submit();
        }
    }
    submit() {
        if (this.overInputLimit())
            return;
        const action = this.activeChoice();
        if (action)
            this.choose(action);
        else
            void this.ask();
    }
    choose(action) {
        if (action.disabled)
            return;
        if (action.query !== undefined) {
            this.setQuery(action.query);
            this.setPhase("empty");
            this.focusPending = true;
            return;
        }
        this.close();
        this.select.emit(action.id);
    }
    async ask() {
        const question = this.query().trim();
        if (!question || this.busy || this.overInputLimit())
            return;
        const respond = this.respond();
        if (!respond) {
            this.error.set("Questions are not connected here. Choose an available action.");
            this.setPhase("error");
            return;
        }
        this.request?.abort();
        const request = new AbortController();
        this.request = request;
        this.busy = true;
        if (this.answer())
            this.history.update((turns) => [...turns, { question: this.question(), answer: this.answer() }].slice(-10));
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
            if (request.signal.aborted)
                return;
            this.busy = false;
            this.answer.set(answer);
            this.query.set("");
            this.activeIndex.set(-1);
            this.setPhase("answered");
        }
        catch (error) {
            if (request.signal.aborted)
                return;
            this.busy = false;
            this.error.set(error instanceof Error
                ? error.message
                : "The answer could not be loaded. Try again.");
            this.setPhase("error");
        }
    }
    back() {
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
    reset() {
        this.request?.abort();
        this.busy = false;
        this.answer.set(null);
        this.history.set([]);
        this.query.set("");
        this.question.set("");
        this.error.set("");
        this.setPhase("empty");
    }
    togglePick(event) {
        event.stopPropagation();
        if (!this.pick())
            return;
        if (this.picking()) {
            this.cancelPick();
            return;
        }
        this.close();
        this.picking.set(true);
    }
    cancelPick() {
        this.picking.set(false);
        this.pickTarget.set(null);
    }
    onPickMove(event) {
        this.pickTarget.set(this.findPickTarget(event.clientX, event.clientY));
    }
    onPickLeave() {
        this.pickTarget.set(null);
    }
    onPickClick(event) {
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
    findPickTarget(x, y) {
        const element = this.document
            .elementsFromPoint(x, y)
            .find((el) => !this.host.contains(el));
        const target = element && this.pick()?.(element);
        if (!target)
            return null;
        const rect = target.element.getBoundingClientRect(), host = this.host.getBoundingClientRect();
        return {
            ...target,
            left: rect.left - host.left,
            top: rect.top - host.top,
            width: rect.width,
            height: rect.height,
        };
    }
    onDocumentKeydown(event) {
        if (event.defaultPrevented ||
            event.isComposing ||
            event.repeat ||
            !isHostVisible(this.host))
            return;
        if (this.shortcut() &&
            (event.metaKey || event.ctrlKey) &&
            !event.altKey &&
            !event.shiftKey &&
            event.key.toLowerCase() === "k") {
            event.preventDefault();
            this.open() ? this.close() : this.openWindow();
        }
        else if (event.key === "Escape" && this.picking()) {
            event.preventDefault();
            this.cancelPick();
        }
        else if (this.open() &&
            this.overlays.isTopmost(this.overlay) &&
            (event.metaKey || event.ctrlKey) &&
            event.key === "Enter") {
            event.preventDefault();
            const action = this.answer()?.action;
            if (this.shownPhase() === "answered" && action && !this.query().trim())
                this.choose(action);
            else
                void this.ask();
        }
    }
    escape() {
        if (this.busy)
            this.close();
        else if (this.query())
            this.setQuery("");
        else if (this.history().length)
            this.back();
        else
            this.close();
    }
    release() {
        if (this.overlay) {
            this.overlays.release(this.overlay);
            this.overlay = undefined;
        }
    }
    setPhase(phase) {
        this.cancel("phase");
        if (this.shownPhase() === phase) {
            // A fast response can return before the outgoing input is replaced.
            this.leavingPhase.set(null);
            this.focusPending = true;
            return;
        }
        this.leavingPhase.set(this.shownPhase());
        this.later("phase", () => {
            this.shownPhase.set(phase);
            this.leavingPhase.set(null);
        }, 120);
    }
    setLayer(layer, mounted) {
        const state = layer === "ribbon" ? this.ribbonMounted : this.windowMounted, leaving = layer === "ribbon" ? this.ribbonLeaving : this.windowLeaving;
        this.cancel(layer);
        if (mounted) {
            leaving.set(false);
            state.set(true);
            return;
        }
        if (!state())
            return;
        leaving.set(true);
        const collapsing = this.motion() === "close" || this.motion() === "collapse";
        this.later(layer, () => {
            state.set(false);
            leaving.set(false);
        }, !collapsing ? 120 : layer === "window" ? 560 : 400);
    }
    cancel(key) {
        clearTimeout(this.timers.get(key));
        this.timers.delete(key);
    }
    later(key, callback, ms) {
        this.cancel(key);
        this.timers.set(key, setTimeout(() => {
            this.timers.delete(key);
            callback();
        }, this.reducedMotion?.matches ? 0 : ms));
    }
    static ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "22.2.2", ngImport: i0, type: CxAssistantComponent, deps: [], target: i0.ɵɵFactoryTarget.Component });
    static ɵcmp = i0.ɵɵngDeclareComponent({ minVersion: "17.0.0", version: "22.2.2", type: CxAssistantComponent, isStandalone: true, selector: "cx-assistant", inputs: { heading: { classPropertyName: "heading", publicName: "heading", isSignal: true, isRequired: false, transformFunction: null }, open: { classPropertyName: "open", publicName: "open", isSignal: true, isRequired: false, transformFunction: null }, context: { classPropertyName: "context", publicName: "context", isSignal: true, isRequired: false, transformFunction: null }, actions: { classPropertyName: "actions", publicName: "actions", isSignal: true, isRequired: false, transformFunction: null }, quickActions: { classPropertyName: "quickActions", publicName: "quickActions", isSignal: true, isRequired: false, transformFunction: null }, respond: { classPropertyName: "respond", publicName: "respond", isSignal: true, isRequired: false, transformFunction: null }, pick: { classPropertyName: "pick", publicName: "pick", isSignal: true, isRequired: false, transformFunction: null }, shortcut: { classPropertyName: "shortcut", publicName: "shortcut", isSignal: true, isRequired: false, transformFunction: null }, maxInputTokens: { classPropertyName: "maxInputTokens", publicName: "maxInputTokens", isSignal: true, isRequired: false, transformFunction: null } }, outputs: { open: "openChange", select: "select", contextChange: "contextChange" }, viewQueries: [{ propertyName: "box", first: true, predicate: ["box"], descendants: true, isSignal: true }, { propertyName: "ring", first: true, predicate: ["ring"], descendants: true, isSignal: true }, { propertyName: "glowBand", first: true, predicate: ["glowBand"], descendants: true, isSignal: true }, { propertyName: "content", first: true, predicate: ["content"], descendants: true, isSignal: true }, { propertyName: "questionInput", first: true, predicate: ["questionInput"], descendants: true, isSignal: true }, { propertyName: "followUpInput", first: true, predicate: ["followUpInput"], descendants: true, isSignal: true }], ngImport: i0, template: "<ng-template #actionList>\n  @if (choices().length) {\n    <div class=\"assistant__choices\" aria-label=\"Quick actions\">\n      @for (choice of choices(); track choice.id; let index = $index) {\n        <button\n          type=\"button\"\n          class=\"assistant__choice\"\n          [id]=\"id + '-choice-' + index\"\n          [disabled]=\"choice.disabled\"\n          [class.is-active]=\"activeChoice()?.id === choice.id\"\n          (click)=\"choose(choice)\"\n        >\n          @if (choice.icon) {\n            <cx-icon [icon]=\"choice.icon\" />\n          }\n          <span class=\"assistant__choice-label\">{{ choice.label }}</span>\n          @if (choice.description) {\n            <span class=\"assistant__choice-description\">{{\n              choice.description\n            }}</span>\n          }\n        </button>\n      }\n    </div>\n  }\n</ng-template>\n<!-- One gradient definition shared by every sparkle on the page. -->\n<svg\n  class=\"assistant__defs\"\n  width=\"0\"\n  height=\"0\"\n  aria-hidden=\"true\"\n  focusable=\"false\"\n>\n  <defs>\n    <linearGradient [attr.id]=\"id + '-spark'\" x1=\"0\" y1=\"0\" x2=\"1\" y2=\"1\">\n      <stop offset=\"0\" stop-color=\"var(--primary)\" />\n      <stop offset=\"1\" stop-color=\"var(--accent)\" />\n    </linearGradient>\n  </defs>\n</svg>\n\n<ng-template #sparkle>\n  <svg\n    class=\"assistant__sparkle\"\n    viewBox=\"0 0 16 16\"\n    aria-hidden=\"true\"\n    focusable=\"false\"\n  >\n    <path\n      [attr.fill]=\"'url(#' + id + '-spark)'\"\n      d=\"M8 0c.4 3.9 3.6 7.2 8 8-4.4.8-7.6 4.1-8 8-.4-3.9-3.6-7.2-8-8 4.4-.8 7.6-4.1 8-8Z\"\n    />\n  </svg>\n</ng-template>\n\n<ng-template #pickIcon>\n  <svg\n    viewBox=\"0 0 16 16\"\n    aria-hidden=\"true\"\n    focusable=\"false\"\n    fill=\"none\"\n    stroke=\"currentColor\"\n    stroke-width=\"1.5\"\n  >\n    <rect\n      x=\"1.5\"\n      y=\"1.5\"\n      width=\"9\"\n      height=\"9\"\n      rx=\"1.5\"\n      stroke-dasharray=\"2.4 1.8\"\n    />\n    <path\n      d=\"M7 7l6.5 2.6-2.7 1.1-1.1 2.7L7 7Z\"\n      fill=\"currentColor\"\n      stroke-linejoin=\"round\"\n    />\n  </svg>\n</ng-template>\n\n<div\n  class=\"assistant__veil\"\n  [class.is-visible]=\"open()\"\n  (click)=\"close()\"\n></div>\n\n@if (picking()) {\n  <div\n    class=\"assistant-picker\"\n    (pointermove)=\"onPickMove($event)\"\n    (pointerleave)=\"onPickLeave()\"\n    (click)=\"onPickClick($event)\"\n  >\n    @if (pickTarget(); as target) {\n      <div\n        class=\"assistant-picker__box\"\n        [style.left.px]=\"target.left\"\n        [style.top.px]=\"target.top\"\n        [style.width.px]=\"target.width\"\n        [style.height.px]=\"target.height\"\n      >\n        <span class=\"assistant-picker__label\">{{ target.context.label }}</span>\n      </div>\n    }\n  </div>\n}\n\n<div\n  class=\"assistant__anchor\"\n  [class.assistant__anchor--open]=\"open()\"\n  (pointerenter)=\"onPointerEnter()\"\n  (pointerleave)=\"onPointerLeave()\"\n>\n  <button\n    type=\"button\"\n    class=\"assistant__hit\"\n    [attr.aria-label]=\"'Open ' + heading()\"\n    (click)=\"onHitClick()\"\n  ></button>\n  <!-- A blurred twin of the frame's gradient, behind the box, so the glow carries the same colours. -->\n  <div\n    class=\"assistant__glow\"\n    [class.assistant__glow--idle]=\"mode() === 'idle'\"\n    [class.assistant__glow--ribbon]=\"mode() === 'ribbon'\"\n    [class.assistant__glow--open]=\"mode() === 'open'\"\n    [class.assistant__glow--thinking]=\"shownPhase() === 'thinking'\"\n    [class.assistant__glow--motion-open]=\"motion() === 'open'\"\n    [class.assistant__glow--motion-close]=\"motion() === 'close'\"\n    [class.assistant__glow--motion-collapse]=\"motion() === 'collapse'\"\n    [class.assistant__glow--motion-resize]=\"motion() === 'resize'\"\n    [style.width.px]=\"geometry().width + 148\"\n    [style.height.px]=\"geometry().height + 148\"\n    [style.bottom.px]=\"geometry().bottom - 74\"\n    [style.border-radius.px]=\"geometry().radius + 74\"\n    aria-hidden=\"true\"\n  >\n    <div\n      #glowBand\n      class=\"assistant__glow-band\"\n      [style.border-radius.px]=\"geometry().radius + 14\"\n    ></div>\n  </div>\n  <div\n    #box\n    class=\"assistant\"\n    [class.assistant--idle]=\"mode() === 'idle'\"\n    [class.assistant--ribbon]=\"mode() === 'ribbon'\"\n    [class.assistant--open]=\"mode() === 'open'\"\n    [class.assistant--picking]=\"picking()\"\n    [class.assistant--blink]=\"blinking()\"\n    [class.assistant--thinking]=\"shownPhase() === 'thinking'\"\n    [class.assistant--motion-open]=\"motion() === 'open'\"\n    [class.assistant--motion-close]=\"motion() === 'close'\"\n    [class.assistant--motion-collapse]=\"motion() === 'collapse'\"\n    [class.assistant--motion-resize]=\"motion() === 'resize'\"\n    [class.assistant--moving]=\"moving()\"\n    [style.width.px]=\"geometry().width\"\n    [style.height.px]=\"geometry().height\"\n    [style.bottom.px]=\"geometry().bottom\"\n    [style.border-radius.px]=\"geometry().radius\"\n    [attr.role]=\"open() ? 'dialog' : null\"\n    [attr.aria-modal]=\"open() ? 'true' : null\"\n    [attr.aria-label]=\"open() ? heading() : null\"\n    [attr.tabindex]=\"open() ? -1 : null\"\n    (click)=\"onBoxClick($event)\"\n    [cdkTrapFocus]=\"trapsFocus()\"\n  >\n    <div class=\"assistant__hairline\" aria-hidden=\"true\"></div>\n    <div\n      #ring\n      class=\"assistant__ring\"\n      [class.assistant__ring--poured]=\"ringPoured()\"\n      aria-hidden=\"true\"\n    ></div>\n\n    @if (ribbonMounted()) {\n      <div\n        class=\"assistant__ribbon\"\n        [class.is-leaving]=\"ribbonLeaving()\"\n        [attr.inert]=\"ribbonLeaving() ? '' : null\"\n        [attr.aria-hidden]=\"ribbonLeaving() ? 'true' : null\"\n      >\n        <ng-container [ngTemplateOutlet]=\"sparkle\" />\n        <span class=\"assistant__ribbon-text\">\n          {{ picking() ? \"Pick something on the page\" : heading() }}\n        </span>\n        <cx-shortcut-key\n          class=\"assistant__keys\"\n          [parts]=\"picking() ? ['Esc'] : shortcutParts\"\n        />\n        @if (pick()) {\n          <span class=\"assistant__divider\" aria-hidden=\"true\"></span>\n          <button\n            type=\"button\"\n            class=\"assistant__pick\"\n            [class.is-active]=\"picking()\"\n            [attr.aria-pressed]=\"picking()\"\n            aria-label=\"Pick an element on the page\"\n            (click)=\"togglePick($event)\"\n          >\n            <ng-container [ngTemplateOutlet]=\"pickIcon\" />\n          </button>\n        }\n      </div>\n    }\n\n    @if (windowMounted()) {\n      <div\n        #content\n        class=\"assistant__content\"\n        [class.is-leaving]=\"windowLeaving()\"\n        [attr.inert]=\"windowLeaving() ? '' : null\"\n      >\n        <div class=\"assistant__header\">\n          <span class=\"assistant__title\">\n            @if (shownPhase() === \"answered\") {\n              <button\n                type=\"button\"\n                class=\"assistant__back\"\n                aria-label=\"Back\"\n                (click)=\"back()\"\n              >\n                <cx-icon icon=\"arrow-left\" />\n              </button>\n            } @else {\n              <ng-container [ngTemplateOutlet]=\"sparkle\" />\n            }\n            <span class=\"assistant__title-text\">{{ heading() }}</span>\n          </span>\n          @if (activeContext(); as context) {\n            <span\n              class=\"assistant__chip\"\n              [class.assistant__chip--picked]=\"selectedContext()\"\n              [cxTooltip]=\"context.label\"\n              [cxTooltipOverflow]=\"true\"\n              >{{ context.label }}</span\n            >\n          }\n          <span class=\"assistant__header-actions\">\n            @if (pick()) {\n              <button\n                type=\"button\"\n                class=\"assistant__ghost assistant__pick\"\n                aria-label=\"Pick an element on the page\"\n                (click)=\"togglePick($event)\"\n              >\n                <ng-container [ngTemplateOutlet]=\"pickIcon\" />\n              </button>\n            }\n            <button\n              type=\"button\"\n              class=\"assistant__ghost\"\n              aria-label=\"Close\"\n              (click)=\"close()\"\n            >\n              <svg\n                width=\"16\"\n                height=\"16\"\n                viewBox=\"0 0 16 16\"\n                aria-hidden=\"true\"\n                fill=\"none\"\n                stroke=\"currentColor\"\n                stroke-width=\"1.5\"\n                stroke-linecap=\"round\"\n              >\n                <path d=\"M4 4l8 8M12 4l-8 8\" />\n              </svg>\n            </button>\n          </span>\n        </div>\n        <div class=\"assistant__question\">\n          @if (shownPhase() === \"empty\" || shownPhase() === \"error\") {\n            <input\n              #questionInput\n              class=\"assistant__input\"\n              [class.is-leaving]=\"leavingPhase() === shownPhase()\"\n              type=\"text\"\n              aria-label=\"Ask Assistant\"\n              [attr.aria-invalid]=\"overInputLimit() || null\"\n              [attr.aria-describedby]=\"overInputLimit() ? id + '-limit' : null\"\n              autocomplete=\"off\"\n              spellcheck=\"false\"\n              [value]=\"query()\"\n              (input)=\"setQuery(questionInput.value)\"\n              (keydown)=\"inputKey($event)\"\n            />\n          } @else {\n            <span\n              class=\"assistant__asked assistant__enter\"\n              [class.assistant__asked--shimmer]=\"shownPhase() === 'thinking'\"\n              >{{ question() }}</span\n            >\n          }\n        </div>\n        @if (shownPhase() === \"empty\" || shownPhase() === \"error\") {\n          <ng-container [ngTemplateOutlet]=\"actionList\" />\n          @if (shownPhase() === \"error\") {\n            <p class=\"assistant__error\" role=\"alert\">{{ error() }}</p>\n          }\n        }\n        @if (shownPhase() === \"answered\") {\n          @if (answer(); as answer) {\n            <div\n              class=\"assistant__answer assistant__enter assistant__enter--late\"\n              aria-live=\"polite\"\n            >\n              <cx-markdown [markdown]=\"answer.text\" />\n              @if (answer.stats?.length) {\n                <div class=\"assistant__tiles\">\n                  @for (stat of answer.stats; track stat.label) {\n                    <div class=\"assistant__tile\">\n                      <span class=\"assistant__tile-value\">{{ stat.value }}</span\n                      ><span class=\"assistant__tile-label\">{{\n                        stat.label\n                      }}</span>\n                    </div>\n                  }\n                </div>\n              }\n              <ng-content select=\"[cxAssistantAnswer]\" />\n              <div class=\"assistant__follow-up\">\n                <cx-icon icon=\"arrow-right\" />\n                <input\n                  #followUpInput\n                  class=\"assistant__input assistant__input--follow-up\"\n                  type=\"text\"\n                  aria-label=\"Ask a follow-up\"\n                  [attr.aria-invalid]=\"overInputLimit() || null\"\n                  [attr.aria-describedby]=\"\n                    overInputLimit() ? id + '-limit' : null\n                  \"\n                  autocomplete=\"off\"\n                  [value]=\"query()\"\n                  (input)=\"setQuery(followUpInput.value)\"\n                  (keydown)=\"inputKey($event)\"\n                />\n              </div>\n              @if (query().trim()) {\n                <ng-container [ngTemplateOutlet]=\"actionList\" />\n              }\n            </div>\n          }\n        }\n        @if (overInputLimit()) {\n          <p class=\"assistant__error\" [id]=\"id + '-limit'\" role=\"alert\">\n            Shorten your question to fit the {{ inputLimit() }}-token limit.\n          </p>\n        }\n        <div class=\"assistant__footer\">\n          @if (shownPhase() === \"thinking\") {\n            <span role=\"status\"><cx-text-shimmer text=\"Thinking\u2026\" /></span>\n            <span class=\"assistant__footer-keys\"\n              ><cx-shortcut-key [parts]=\"['Esc']\" /><span>Close</span></span\n            >\n          } @else if (shownPhase() === \"answered\") {\n            <span class=\"assistant__footer-text\">{{ answer()?.source }}</span>\n            @if (answer()?.action; as action) {\n              <cx-button\n                mood=\"primary\"\n                [text]=\"action.label\"\n                [shortcutParts]=\"actionShortcut\"\n                (pressed)=\"choose(action)\"\n              />\n            } @else {\n              <button\n                type=\"button\"\n                class=\"assistant__footer-ask assistant__footer-keys\"\n                (click)=\"submit()\"\n                [disabled]=\"!query().trim() || overInputLimit()\"\n              >\n                <cx-shortcut-key [parts]=\"['Enter']\" /><span>{{\n                  activeChoice() ? \"Open\" : \"Ask\"\n                }}</span>\n              </button>\n            }\n          } @else {\n            <span class=\"assistant__footer-text\"\n              >Ask, find or do something</span\n            >\n            <span class=\"assistant__footer-keys\"\n              ><button\n                type=\"button\"\n                class=\"assistant__footer-ask\"\n                (click)=\"submit()\"\n                [disabled]=\"\n                  overInputLimit() || (!query().trim() && !activeChoice())\n                \"\n              >\n                {{\n                  activeChoice()\n                    ? activeChoice()?.query !== undefined\n                      ? \"Use\"\n                      : \"Open\"\n                    : \"Ask\"\n                }}</button\n              ><cx-shortcut-key [parts]=\"['Enter']\" /><cx-shortcut-key\n                [parts]=\"['Esc']\"\n              /><span>Close</span></span\n            >\n          }\n        </div>\n      </div>\n    }\n  </div>\n</div>\n", styles: [":host{position:fixed;inset:0;z-index:var(--z-index-dialog);pointer-events:none;color:var(--ink);font-family:var(--font-family-base)}.assistant__defs{position:absolute;width:0;height:0}.assistant__veil{position:absolute;inset:0;background:color-mix(in srgb, black 16%, transparent);opacity:0;visibility:hidden;transition:opacity 280ms ease,visibility 0s linear 280ms}.assistant__veil.is-visible{opacity:1;visibility:visible;pointer-events:auto;transition:opacity 280ms ease}.assistant-picker{position:absolute;inset:0;cursor:crosshair;pointer-events:auto}.assistant-picker__box{position:absolute;border-radius:var(--radius-sm);outline:2px solid var(--primary);outline-offset:2px;background:color-mix(in srgb, var(--primary) 8%, transparent);pointer-events:none;transition:left 120ms ease,top 120ms ease,width 120ms ease,height 120ms ease}.assistant-picker__label{position:absolute;bottom:100%;left:0;display:inline-flex;margin-bottom:8px;padding:6px 10px;border-radius:999px;background:var(--surface);box-shadow:var(--shadow-low);color:var(--opacity-high);font-size:var(--font-size-body-sm);line-height:1.2;white-space:nowrap}.assistant__anchor{position:absolute;inset:0}.assistant__hit{position:absolute;bottom:0;left:50%;width:160px;height:28px;transform:translateX(-50%);pointer-events:auto;cursor:pointer}.assistant__anchor--open .assistant__hit{display:none}.assistant{position:absolute;left:50%;box-sizing:border-box;overflow:hidden;background:rgba(0,0,0,0);outline:none;transform:translateX(-50%);pointer-events:auto;cursor:pointer;transition-property:width,height,bottom,border-radius,background-color,box-shadow,backdrop-filter;transition-duration:300ms;transition-timing-function:cubic-bezier(0.34, 1.26, 0.64, 1)}.assistant--moving{will-change:width,height,bottom}.assistant--motion-open{transition-duration:560ms;transition-timing-function:cubic-bezier(0.32, 0.72, 0, 1)}.assistant--motion-close{transition-duration:520ms;transition-timing-function:cubic-bezier(0.85, 0, 0.15, 1)}.assistant--motion-collapse{transition-duration:420ms;transition-timing-function:cubic-bezier(0.85, 0, 0.15, 1)}.assistant--idle{transition-property:width,height,bottom,border-radius,background-color,box-shadow,backdrop-filter;transition-duration:420ms,420ms,420ms,420ms,180ms,180ms,180ms;transition-delay:0s,0s,0s,0s,240ms,240ms,240ms;transition-timing-function:cubic-bezier(0.85, 0, 0.15, 1)}.assistant--idle:has(.assistant__content){transition-duration:520ms,520ms,520ms,520ms,180ms,180ms,180ms;transition-delay:0s,0s,0s,0s,340ms,340ms,340ms}.assistant--motion-resize{transition-duration:420ms;transition-timing-function:cubic-bezier(0.32, 0.72, 0, 1)}.assistant--ribbon{background:color-mix(in srgb, var(--surface) 78%, transparent);box-shadow:var(--shadow-mid);-webkit-backdrop-filter:blur(16px) saturate(1.3);backdrop-filter:blur(16px) saturate(1.3)}.assistant--open{cursor:default;background:color-mix(in srgb, var(--surface) 84%, transparent);box-shadow:var(--shadow-high);-webkit-backdrop-filter:blur(24px) saturate(1.4);backdrop-filter:blur(24px) saturate(1.4)}.assistant__hairline{position:absolute;inset:0;background:color-mix(in srgb, var(--ink) 28%, transparent);opacity:1;pointer-events:none;transition:opacity 200ms ease}.assistant--ribbon .assistant__hairline,.assistant--open .assistant__hairline{opacity:0}.assistant__hairline::before,.assistant__hairline::after{content:\"\";position:absolute;inset:0;border-radius:inherit;opacity:0}.assistant__hairline::before{background:color-mix(in srgb, var(--ink) 70%, transparent)}.assistant__hairline::after{background:linear-gradient(90deg, transparent 0 18%, var(--primary) 30%, var(--purple) 43%, var(--pink) 57%, var(--accent) 70%, transparent 82% 100%);background-repeat:no-repeat;background-size:300% 100%;background-position:0% 0}.assistant--blink .assistant__hairline::before{animation:assistant-blink-highlight 1100ms ease-in-out both}.assistant--blink .assistant__hairline::after{animation:assistant-blink-sweep 1100ms cubic-bezier(0.45, 0, 0.2, 1) both}.assistant--idle.assistant--blink{animation:assistant-blink-glow 1100ms ease-in-out both}.assistant--idle .assistant__hairline{transition:opacity 180ms ease 240ms}.assistant--idle:has(.assistant__content) .assistant__hairline{transition-delay:340ms}.assistant__glow{position:absolute;left:50%;box-sizing:border-box;padding:74px;overflow:hidden;opacity:0;transform:translateX(-50%);pointer-events:none;mask:linear-gradient(var(--ink) 0 0) content-box,linear-gradient(var(--ink) 0 0);mask-composite:exclude;-webkit-mask-composite:xor;transition-property:width,height,bottom,border-radius,opacity;transition-duration:300ms,300ms,300ms,300ms,200ms;transition-timing-function:cubic-bezier(0.34, 1.26, 0.64, 1)}.assistant__glow--motion-open{transition-duration:560ms,560ms,560ms,560ms,200ms;transition-timing-function:cubic-bezier(0.32, 0.72, 0, 1)}.assistant__glow--motion-close{transition-duration:520ms,520ms,520ms,520ms,200ms;transition-timing-function:cubic-bezier(0.85, 0, 0.15, 1)}.assistant__glow--motion-collapse{transition-duration:420ms,420ms,420ms,420ms,200ms;transition-timing-function:cubic-bezier(0.85, 0, 0.15, 1)}.assistant__glow--motion-resize{transition-duration:420ms,420ms,420ms,420ms,200ms;transition-timing-function:cubic-bezier(0.32, 0.72, 0, 1)}.assistant__glow--ribbon,.assistant__glow--open{opacity:.2}.assistant__glow--thinking{opacity:.28}.assistant__glow-band{position:absolute;inset:64px;overflow:hidden;filter:blur(30px)}.assistant__glow--idle{opacity:0;transition-duration:420ms,420ms,420ms,420ms,180ms;transition-delay:0s,0s,0s,0s,240ms;transition-timing-function:cubic-bezier(0.85, 0, 0.15, 1)}.assistant__anchor:has(.assistant__content) .assistant__glow--idle{transition-duration:520ms,520ms,520ms,520ms,180ms;transition-delay:0s,0s,0s,0s,340ms}.assistant__ring{position:absolute;inset:0;box-sizing:border-box;padding:4px;border-radius:inherit;overflow:hidden;opacity:0;pointer-events:none;transition:opacity 200ms ease;mask:linear-gradient(var(--ink) 0 0) content-box,linear-gradient(var(--ink) 0 0);mask-composite:exclude;-webkit-mask-composite:xor}.assistant__ring,.assistant__glow-band{background:conic-gradient(from 0deg, var(--primary), var(--accent), var(--primary), var(--purple), var(--pink), var(--purple), var(--primary))}.assistant__ring--poured{opacity:1;animation:assistant-pour 600ms cubic-bezier(0.2, 0.7, 0.2, 1) backwards}.assistant--idle .assistant__ring{opacity:0;transition:opacity 180ms ease 240ms}.assistant--idle:has(.assistant__content) .assistant__ring{transition-delay:340ms}.assistant__ribbon{position:absolute;top:0;left:0;display:flex;box-sizing:border-box;width:100%;height:52px;align-items:center;padding:0 18px;gap:12px;animation:assistant-enter 260ms cubic-bezier(0.2, 0.7, 0.2, 1) 160ms backwards;transition:width 300ms cubic-bezier(0.34, 1.26, 0.64, 1)}.assistant__sparkle{width:16px;height:16px;flex:0 0 auto}.assistant__ribbon-text{font-size:var(--font-size-body);font-weight:var(--font-weight-medium);line-height:1.2;white-space:nowrap}.assistant__keys{margin-left:auto}.assistant__divider{width:1px;height:18px;flex:0 0 auto;background:var(--opacity-mid)}.assistant__pick,.assistant__ghost{display:inline-flex;box-sizing:border-box;width:28px;height:28px;flex:0 0 auto;align-items:center;justify-content:center;padding:0;border:0;border-radius:var(--radius-md);background:rgba(0,0,0,0);color:var(--opacity-high);cursor:pointer;transition:background-color 120ms ease,color 120ms ease}.assistant__pick svg,.assistant__ghost svg{width:16px;height:16px}.assistant__pick:hover,.assistant__ghost:hover{background:var(--opacity-low);color:var(--ink)}.assistant__pick.is-active{background:var(--opacity-low);color:var(--primary)}.assistant__pick:focus-visible,.assistant__ghost:focus-visible{outline:2px solid var(--primary);outline-offset:2px}.assistant__content{display:flex;box-sizing:border-box;width:min(640px,100vw - 32px);max-height:calc(100dvh - 64px);overflow-y:auto;flex-direction:column;padding:20px;animation:assistant-enter 260ms cubic-bezier(0.2, 0.7, 0.2, 1) 160ms backwards}.assistant__header{display:flex;align-items:center;gap:var(--space-sm)}.assistant__title{min-width:0;display:inline-flex;flex:0 1 auto;align-items:center;gap:8px;font-size:var(--font-size-body);font-weight:var(--font-weight-medium);line-height:1.2}.assistant__title .assistant__sparkle{width:16px;height:16px}.assistant__back{display:inline-flex;box-sizing:border-box;width:24px;height:24px;flex:0 0 auto;align-items:center;justify-content:center;margin:-4px;padding:0;border:0;border-radius:var(--radius-md);background:rgba(0,0,0,0);color:var(--ink);cursor:pointer;transition:background-color 120ms ease}.assistant__back svg{width:16px;height:16px}.assistant__back:hover{background:var(--opacity-low)}.assistant__back:focus-visible{outline:2px solid var(--primary);outline-offset:2px}.assistant__chip{display:inline-flex;min-width:0;align-items:center;padding:6px 10px;border-radius:999px;background:var(--opacity-low);color:var(--opacity-high);font-size:var(--font-size-body-sm);line-height:1.2;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.assistant__chip--picked{background:var(--primary-opacity);color:var(--primary);font-weight:var(--font-weight-medium)}.assistant__header-actions{display:inline-flex;flex:0 0 auto;margin-left:auto;gap:4px}.assistant__question{display:flex;box-sizing:border-box;height:36px;align-items:center;margin-top:var(--space-md);padding:4px 0}.assistant__input,.assistant__asked{min-width:0;flex:1 1 auto;margin:0;padding:0;border:0;background:rgba(0,0,0,0);color:var(--ink);font-family:var(--font-family-base);font-size:var(--font-size-title-2);line-height:28px}.assistant__input{outline:none;caret-color:var(--primary)}.assistant__asked{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.assistant__asked--shimmer{background:linear-gradient(90deg, var(--ink) 0 35%, var(--primary) 50%, var(--ink) 65% 100%);background-size:250% 100%;-webkit-background-clip:text;background-clip:text;color:rgba(0,0,0,0);animation:assistant-enter 260ms cubic-bezier(0.2, 0.7, 0.2, 1) 40ms backwards,assistant-shimmer 1.4s linear infinite}.assistant__follow-up{display:flex;box-sizing:border-box;height:36px;align-items:center;padding-top:var(--space-sm);border-top:1px solid var(--opacity-low);gap:10px}.assistant__follow-up svg{width:16px;height:16px;flex:0 0 auto;color:var(--opacity-high)}.assistant__input--follow-up{font-size:var(--font-size-body);line-height:24px}.assistant__answer{display:flex;flex-direction:column;margin-top:var(--space-md);padding-top:var(--space-md);border-top:1px solid var(--opacity-low);gap:var(--space-md)}.assistant__tiles{display:grid;grid-template-columns:repeat(3, minmax(0, 1fr));gap:var(--space-sm)}.assistant__tile{display:flex;flex-direction:column;padding:12px 14px;border-radius:var(--radius-lg);background:var(--opacity-low)}.assistant__tile-value{font-size:var(--font-size-title-1);font-weight:var(--font-weight-medium);line-height:1.1}.assistant__tile-label{margin-top:2px;color:var(--opacity-high);font-size:var(--font-size-body-sm)}.assistant__footer{display:flex;box-sizing:border-box;height:56px;align-items:center;justify-content:space-between;margin:var(--space-md) -16px -16px;padding:0 16px;border-top:1px solid var(--opacity-low);border-radius:0 0 16px 16px;background:var(--opacity-low);gap:var(--space-md)}.assistant__footer-text{min-width:0;overflow:hidden;color:var(--opacity-high);font-size:var(--font-size-body-sm);line-height:1.3;text-overflow:ellipsis;white-space:nowrap}.assistant__footer-keys{display:inline-flex;flex:0 0 auto;align-items:center;color:var(--opacity-high);font-size:var(--font-size-body-sm);line-height:1;gap:6px}.assistant__footer-keys cx-shortcut-key{display:inline-flex;align-items:center}.assistant__footer-keys span+cx-shortcut-key{margin-left:6px}.assistant__enter{animation:assistant-enter 260ms cubic-bezier(0.2, 0.7, 0.2, 1) 40ms backwards}.assistant__enter--late{animation-delay:240ms}.is-leaving{opacity:0;animation:none;transition:opacity 120ms ease}.assistant__content.is-leaving{transition-duration:160ms;transition-delay:200ms}.assistant--idle .assistant__ribbon.is-leaving{transition-duration:160ms;transition-delay:160ms}@keyframes assistant-enter{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}}@keyframes assistant-pour{from{opacity:0}to{opacity:1}}@keyframes assistant-blink-highlight{0%,100%{opacity:0}14%,78%{opacity:1}}@keyframes assistant-blink-glow{0%,14%,86%,100%{box-shadow:0 0 0 0 rgba(0,0,0,0)}40%,60%{box-shadow:0 0 10px 1px color-mix(in srgb, var(--primary) 45%, transparent),0 0 22px 4px color-mix(in srgb, var(--pink) 30%, transparent)}}@keyframes assistant-blink-sweep{0%,14%{opacity:1;background-position:0% 0}78%,100%{opacity:1;background-position:100% 0}}@keyframes assistant-shimmer{from{background-position:100% 0}to{background-position:0 0}}@media(prefers-reduced-motion: reduce){:host *,:host *::before,:host *::after{transition-duration:1ms !important;transition-delay:0ms !important;animation-duration:1ms !important;animation-delay:0ms !important;animation-iteration-count:1 !important}}.assistant__hit{border:0;padding:0;background:rgba(0,0,0,0)}.assistant__hit:focus-visible{outline:2px solid var(--primary);outline-offset:-2px;border-radius:var(--radius-sm)}.assistant__choices{display:flex;flex-direction:column;margin-top:var(--space-md);max-height:280px;overflow-y:auto;gap:var(--space-xs)}.assistant__choice{display:flex;align-items:center;gap:var(--space-sm);width:100%;padding:var(--space-sm);border:0;border-radius:var(--radius-sm);background:rgba(0,0,0,0);color:var(--ink);text-align:left;font:inherit;cursor:pointer}.assistant__choice:hover,.assistant__choice.is-active{background:var(--opacity-low)}.assistant__choice:focus-visible{outline:2px solid var(--primary);outline-offset:-2px}.assistant__choice:disabled{opacity:.5;cursor:default}.assistant__choice-label{flex:1;min-width:0;overflow-wrap:anywhere}.assistant__choice-description{color:var(--opacity-high);font-size:var(--font-size-body-sm)}.assistant__error{color:var(--danger);margin:var(--space-md) 0 0}.assistant__footer-ask{border:0;padding:0;background:rgba(0,0,0,0);font:inherit;color:inherit;cursor:pointer}.assistant__footer-ask:focus-visible{outline:2px solid var(--primary);outline-offset:2px}.assistant__title-text{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.assistant__footer-ask:disabled{cursor:default}"], dependencies: [{ kind: "ngmodule", type: A11yModule }, { kind: "directive", type: i1.CdkTrapFocus, selector: "[cdkTrapFocus]", inputs: ["cdkTrapFocus", "cdkTrapFocusAutoCapture"], exportAs: ["cdkTrapFocus"] }, { kind: "directive", type: CxTooltipDirective, selector: "[cxTooltip]", inputs: ["cxTooltip", "cxTooltipPosition", "cxTooltipDelay", "cxTooltipDisabled", "cxTooltipOverflow"] }, { kind: "directive", type: NgTemplateOutlet, selector: "[ngTemplateOutlet]", inputs: ["ngTemplateOutletContext", "ngTemplateOutlet", "ngTemplateOutletInjector"] }, { kind: "component", type: CxButtonComponent, selector: "cx-button", inputs: ["text", "mood", "icon", "appendIcon", "shortcutParts", "href", "type", "size", "ariaLabel", "disabled", "transparent", "rounded", "loading"], outputs: ["pressed"] }, { kind: "component", type: CxShortcutKeyComponent, selector: "cx-shortcut-key", inputs: ["parts"] }, { kind: "component", type: CxTextShimmerComponent, selector: "cx-text-shimmer", inputs: ["text", "active"] }, { kind: "component", type: CxMarkdownComponent, selector: "cx-markdown", inputs: ["markdown", "variant"], outputs: ["linkClick"] }, { kind: "component", type: CxIconComponent, selector: "cx-icon", inputs: ["icon", "size", "mood", "shape"] }], changeDetection: i0.ChangeDetectionStrategy.OnPush });
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "22.2.2", ngImport: i0, type: CxAssistantComponent, decorators: [{
            type: Component,
            args: [{ selector: "cx-assistant", imports: [
                        A11yModule,
                        CxTooltipDirective,
                        NgTemplateOutlet,
                        CxButtonComponent,
                        CxShortcutKeyComponent,
                        CxTextShimmerComponent,
                        CxMarkdownComponent,
                        CxIconComponent,
                    ], changeDetection: ChangeDetectionStrategy.OnPush, template: "<ng-template #actionList>\n  @if (choices().length) {\n    <div class=\"assistant__choices\" aria-label=\"Quick actions\">\n      @for (choice of choices(); track choice.id; let index = $index) {\n        <button\n          type=\"button\"\n          class=\"assistant__choice\"\n          [id]=\"id + '-choice-' + index\"\n          [disabled]=\"choice.disabled\"\n          [class.is-active]=\"activeChoice()?.id === choice.id\"\n          (click)=\"choose(choice)\"\n        >\n          @if (choice.icon) {\n            <cx-icon [icon]=\"choice.icon\" />\n          }\n          <span class=\"assistant__choice-label\">{{ choice.label }}</span>\n          @if (choice.description) {\n            <span class=\"assistant__choice-description\">{{\n              choice.description\n            }}</span>\n          }\n        </button>\n      }\n    </div>\n  }\n</ng-template>\n<!-- One gradient definition shared by every sparkle on the page. -->\n<svg\n  class=\"assistant__defs\"\n  width=\"0\"\n  height=\"0\"\n  aria-hidden=\"true\"\n  focusable=\"false\"\n>\n  <defs>\n    <linearGradient [attr.id]=\"id + '-spark'\" x1=\"0\" y1=\"0\" x2=\"1\" y2=\"1\">\n      <stop offset=\"0\" stop-color=\"var(--primary)\" />\n      <stop offset=\"1\" stop-color=\"var(--accent)\" />\n    </linearGradient>\n  </defs>\n</svg>\n\n<ng-template #sparkle>\n  <svg\n    class=\"assistant__sparkle\"\n    viewBox=\"0 0 16 16\"\n    aria-hidden=\"true\"\n    focusable=\"false\"\n  >\n    <path\n      [attr.fill]=\"'url(#' + id + '-spark)'\"\n      d=\"M8 0c.4 3.9 3.6 7.2 8 8-4.4.8-7.6 4.1-8 8-.4-3.9-3.6-7.2-8-8 4.4-.8 7.6-4.1 8-8Z\"\n    />\n  </svg>\n</ng-template>\n\n<ng-template #pickIcon>\n  <svg\n    viewBox=\"0 0 16 16\"\n    aria-hidden=\"true\"\n    focusable=\"false\"\n    fill=\"none\"\n    stroke=\"currentColor\"\n    stroke-width=\"1.5\"\n  >\n    <rect\n      x=\"1.5\"\n      y=\"1.5\"\n      width=\"9\"\n      height=\"9\"\n      rx=\"1.5\"\n      stroke-dasharray=\"2.4 1.8\"\n    />\n    <path\n      d=\"M7 7l6.5 2.6-2.7 1.1-1.1 2.7L7 7Z\"\n      fill=\"currentColor\"\n      stroke-linejoin=\"round\"\n    />\n  </svg>\n</ng-template>\n\n<div\n  class=\"assistant__veil\"\n  [class.is-visible]=\"open()\"\n  (click)=\"close()\"\n></div>\n\n@if (picking()) {\n  <div\n    class=\"assistant-picker\"\n    (pointermove)=\"onPickMove($event)\"\n    (pointerleave)=\"onPickLeave()\"\n    (click)=\"onPickClick($event)\"\n  >\n    @if (pickTarget(); as target) {\n      <div\n        class=\"assistant-picker__box\"\n        [style.left.px]=\"target.left\"\n        [style.top.px]=\"target.top\"\n        [style.width.px]=\"target.width\"\n        [style.height.px]=\"target.height\"\n      >\n        <span class=\"assistant-picker__label\">{{ target.context.label }}</span>\n      </div>\n    }\n  </div>\n}\n\n<div\n  class=\"assistant__anchor\"\n  [class.assistant__anchor--open]=\"open()\"\n  (pointerenter)=\"onPointerEnter()\"\n  (pointerleave)=\"onPointerLeave()\"\n>\n  <button\n    type=\"button\"\n    class=\"assistant__hit\"\n    [attr.aria-label]=\"'Open ' + heading()\"\n    (click)=\"onHitClick()\"\n  ></button>\n  <!-- A blurred twin of the frame's gradient, behind the box, so the glow carries the same colours. -->\n  <div\n    class=\"assistant__glow\"\n    [class.assistant__glow--idle]=\"mode() === 'idle'\"\n    [class.assistant__glow--ribbon]=\"mode() === 'ribbon'\"\n    [class.assistant__glow--open]=\"mode() === 'open'\"\n    [class.assistant__glow--thinking]=\"shownPhase() === 'thinking'\"\n    [class.assistant__glow--motion-open]=\"motion() === 'open'\"\n    [class.assistant__glow--motion-close]=\"motion() === 'close'\"\n    [class.assistant__glow--motion-collapse]=\"motion() === 'collapse'\"\n    [class.assistant__glow--motion-resize]=\"motion() === 'resize'\"\n    [style.width.px]=\"geometry().width + 148\"\n    [style.height.px]=\"geometry().height + 148\"\n    [style.bottom.px]=\"geometry().bottom - 74\"\n    [style.border-radius.px]=\"geometry().radius + 74\"\n    aria-hidden=\"true\"\n  >\n    <div\n      #glowBand\n      class=\"assistant__glow-band\"\n      [style.border-radius.px]=\"geometry().radius + 14\"\n    ></div>\n  </div>\n  <div\n    #box\n    class=\"assistant\"\n    [class.assistant--idle]=\"mode() === 'idle'\"\n    [class.assistant--ribbon]=\"mode() === 'ribbon'\"\n    [class.assistant--open]=\"mode() === 'open'\"\n    [class.assistant--picking]=\"picking()\"\n    [class.assistant--blink]=\"blinking()\"\n    [class.assistant--thinking]=\"shownPhase() === 'thinking'\"\n    [class.assistant--motion-open]=\"motion() === 'open'\"\n    [class.assistant--motion-close]=\"motion() === 'close'\"\n    [class.assistant--motion-collapse]=\"motion() === 'collapse'\"\n    [class.assistant--motion-resize]=\"motion() === 'resize'\"\n    [class.assistant--moving]=\"moving()\"\n    [style.width.px]=\"geometry().width\"\n    [style.height.px]=\"geometry().height\"\n    [style.bottom.px]=\"geometry().bottom\"\n    [style.border-radius.px]=\"geometry().radius\"\n    [attr.role]=\"open() ? 'dialog' : null\"\n    [attr.aria-modal]=\"open() ? 'true' : null\"\n    [attr.aria-label]=\"open() ? heading() : null\"\n    [attr.tabindex]=\"open() ? -1 : null\"\n    (click)=\"onBoxClick($event)\"\n    [cdkTrapFocus]=\"trapsFocus()\"\n  >\n    <div class=\"assistant__hairline\" aria-hidden=\"true\"></div>\n    <div\n      #ring\n      class=\"assistant__ring\"\n      [class.assistant__ring--poured]=\"ringPoured()\"\n      aria-hidden=\"true\"\n    ></div>\n\n    @if (ribbonMounted()) {\n      <div\n        class=\"assistant__ribbon\"\n        [class.is-leaving]=\"ribbonLeaving()\"\n        [attr.inert]=\"ribbonLeaving() ? '' : null\"\n        [attr.aria-hidden]=\"ribbonLeaving() ? 'true' : null\"\n      >\n        <ng-container [ngTemplateOutlet]=\"sparkle\" />\n        <span class=\"assistant__ribbon-text\">\n          {{ picking() ? \"Pick something on the page\" : heading() }}\n        </span>\n        <cx-shortcut-key\n          class=\"assistant__keys\"\n          [parts]=\"picking() ? ['Esc'] : shortcutParts\"\n        />\n        @if (pick()) {\n          <span class=\"assistant__divider\" aria-hidden=\"true\"></span>\n          <button\n            type=\"button\"\n            class=\"assistant__pick\"\n            [class.is-active]=\"picking()\"\n            [attr.aria-pressed]=\"picking()\"\n            aria-label=\"Pick an element on the page\"\n            (click)=\"togglePick($event)\"\n          >\n            <ng-container [ngTemplateOutlet]=\"pickIcon\" />\n          </button>\n        }\n      </div>\n    }\n\n    @if (windowMounted()) {\n      <div\n        #content\n        class=\"assistant__content\"\n        [class.is-leaving]=\"windowLeaving()\"\n        [attr.inert]=\"windowLeaving() ? '' : null\"\n      >\n        <div class=\"assistant__header\">\n          <span class=\"assistant__title\">\n            @if (shownPhase() === \"answered\") {\n              <button\n                type=\"button\"\n                class=\"assistant__back\"\n                aria-label=\"Back\"\n                (click)=\"back()\"\n              >\n                <cx-icon icon=\"arrow-left\" />\n              </button>\n            } @else {\n              <ng-container [ngTemplateOutlet]=\"sparkle\" />\n            }\n            <span class=\"assistant__title-text\">{{ heading() }}</span>\n          </span>\n          @if (activeContext(); as context) {\n            <span\n              class=\"assistant__chip\"\n              [class.assistant__chip--picked]=\"selectedContext()\"\n              [cxTooltip]=\"context.label\"\n              [cxTooltipOverflow]=\"true\"\n              >{{ context.label }}</span\n            >\n          }\n          <span class=\"assistant__header-actions\">\n            @if (pick()) {\n              <button\n                type=\"button\"\n                class=\"assistant__ghost assistant__pick\"\n                aria-label=\"Pick an element on the page\"\n                (click)=\"togglePick($event)\"\n              >\n                <ng-container [ngTemplateOutlet]=\"pickIcon\" />\n              </button>\n            }\n            <button\n              type=\"button\"\n              class=\"assistant__ghost\"\n              aria-label=\"Close\"\n              (click)=\"close()\"\n            >\n              <svg\n                width=\"16\"\n                height=\"16\"\n                viewBox=\"0 0 16 16\"\n                aria-hidden=\"true\"\n                fill=\"none\"\n                stroke=\"currentColor\"\n                stroke-width=\"1.5\"\n                stroke-linecap=\"round\"\n              >\n                <path d=\"M4 4l8 8M12 4l-8 8\" />\n              </svg>\n            </button>\n          </span>\n        </div>\n        <div class=\"assistant__question\">\n          @if (shownPhase() === \"empty\" || shownPhase() === \"error\") {\n            <input\n              #questionInput\n              class=\"assistant__input\"\n              [class.is-leaving]=\"leavingPhase() === shownPhase()\"\n              type=\"text\"\n              aria-label=\"Ask Assistant\"\n              [attr.aria-invalid]=\"overInputLimit() || null\"\n              [attr.aria-describedby]=\"overInputLimit() ? id + '-limit' : null\"\n              autocomplete=\"off\"\n              spellcheck=\"false\"\n              [value]=\"query()\"\n              (input)=\"setQuery(questionInput.value)\"\n              (keydown)=\"inputKey($event)\"\n            />\n          } @else {\n            <span\n              class=\"assistant__asked assistant__enter\"\n              [class.assistant__asked--shimmer]=\"shownPhase() === 'thinking'\"\n              >{{ question() }}</span\n            >\n          }\n        </div>\n        @if (shownPhase() === \"empty\" || shownPhase() === \"error\") {\n          <ng-container [ngTemplateOutlet]=\"actionList\" />\n          @if (shownPhase() === \"error\") {\n            <p class=\"assistant__error\" role=\"alert\">{{ error() }}</p>\n          }\n        }\n        @if (shownPhase() === \"answered\") {\n          @if (answer(); as answer) {\n            <div\n              class=\"assistant__answer assistant__enter assistant__enter--late\"\n              aria-live=\"polite\"\n            >\n              <cx-markdown [markdown]=\"answer.text\" />\n              @if (answer.stats?.length) {\n                <div class=\"assistant__tiles\">\n                  @for (stat of answer.stats; track stat.label) {\n                    <div class=\"assistant__tile\">\n                      <span class=\"assistant__tile-value\">{{ stat.value }}</span\n                      ><span class=\"assistant__tile-label\">{{\n                        stat.label\n                      }}</span>\n                    </div>\n                  }\n                </div>\n              }\n              <ng-content select=\"[cxAssistantAnswer]\" />\n              <div class=\"assistant__follow-up\">\n                <cx-icon icon=\"arrow-right\" />\n                <input\n                  #followUpInput\n                  class=\"assistant__input assistant__input--follow-up\"\n                  type=\"text\"\n                  aria-label=\"Ask a follow-up\"\n                  [attr.aria-invalid]=\"overInputLimit() || null\"\n                  [attr.aria-describedby]=\"\n                    overInputLimit() ? id + '-limit' : null\n                  \"\n                  autocomplete=\"off\"\n                  [value]=\"query()\"\n                  (input)=\"setQuery(followUpInput.value)\"\n                  (keydown)=\"inputKey($event)\"\n                />\n              </div>\n              @if (query().trim()) {\n                <ng-container [ngTemplateOutlet]=\"actionList\" />\n              }\n            </div>\n          }\n        }\n        @if (overInputLimit()) {\n          <p class=\"assistant__error\" [id]=\"id + '-limit'\" role=\"alert\">\n            Shorten your question to fit the {{ inputLimit() }}-token limit.\n          </p>\n        }\n        <div class=\"assistant__footer\">\n          @if (shownPhase() === \"thinking\") {\n            <span role=\"status\"><cx-text-shimmer text=\"Thinking\u2026\" /></span>\n            <span class=\"assistant__footer-keys\"\n              ><cx-shortcut-key [parts]=\"['Esc']\" /><span>Close</span></span\n            >\n          } @else if (shownPhase() === \"answered\") {\n            <span class=\"assistant__footer-text\">{{ answer()?.source }}</span>\n            @if (answer()?.action; as action) {\n              <cx-button\n                mood=\"primary\"\n                [text]=\"action.label\"\n                [shortcutParts]=\"actionShortcut\"\n                (pressed)=\"choose(action)\"\n              />\n            } @else {\n              <button\n                type=\"button\"\n                class=\"assistant__footer-ask assistant__footer-keys\"\n                (click)=\"submit()\"\n                [disabled]=\"!query().trim() || overInputLimit()\"\n              >\n                <cx-shortcut-key [parts]=\"['Enter']\" /><span>{{\n                  activeChoice() ? \"Open\" : \"Ask\"\n                }}</span>\n              </button>\n            }\n          } @else {\n            <span class=\"assistant__footer-text\"\n              >Ask, find or do something</span\n            >\n            <span class=\"assistant__footer-keys\"\n              ><button\n                type=\"button\"\n                class=\"assistant__footer-ask\"\n                (click)=\"submit()\"\n                [disabled]=\"\n                  overInputLimit() || (!query().trim() && !activeChoice())\n                \"\n              >\n                {{\n                  activeChoice()\n                    ? activeChoice()?.query !== undefined\n                      ? \"Use\"\n                      : \"Open\"\n                    : \"Ask\"\n                }}</button\n              ><cx-shortcut-key [parts]=\"['Enter']\" /><cx-shortcut-key\n                [parts]=\"['Esc']\"\n              /><span>Close</span></span\n            >\n          }\n        </div>\n      </div>\n    }\n  </div>\n</div>\n", styles: [":host{position:fixed;inset:0;z-index:var(--z-index-dialog);pointer-events:none;color:var(--ink);font-family:var(--font-family-base)}.assistant__defs{position:absolute;width:0;height:0}.assistant__veil{position:absolute;inset:0;background:color-mix(in srgb, black 16%, transparent);opacity:0;visibility:hidden;transition:opacity 280ms ease,visibility 0s linear 280ms}.assistant__veil.is-visible{opacity:1;visibility:visible;pointer-events:auto;transition:opacity 280ms ease}.assistant-picker{position:absolute;inset:0;cursor:crosshair;pointer-events:auto}.assistant-picker__box{position:absolute;border-radius:var(--radius-sm);outline:2px solid var(--primary);outline-offset:2px;background:color-mix(in srgb, var(--primary) 8%, transparent);pointer-events:none;transition:left 120ms ease,top 120ms ease,width 120ms ease,height 120ms ease}.assistant-picker__label{position:absolute;bottom:100%;left:0;display:inline-flex;margin-bottom:8px;padding:6px 10px;border-radius:999px;background:var(--surface);box-shadow:var(--shadow-low);color:var(--opacity-high);font-size:var(--font-size-body-sm);line-height:1.2;white-space:nowrap}.assistant__anchor{position:absolute;inset:0}.assistant__hit{position:absolute;bottom:0;left:50%;width:160px;height:28px;transform:translateX(-50%);pointer-events:auto;cursor:pointer}.assistant__anchor--open .assistant__hit{display:none}.assistant{position:absolute;left:50%;box-sizing:border-box;overflow:hidden;background:rgba(0,0,0,0);outline:none;transform:translateX(-50%);pointer-events:auto;cursor:pointer;transition-property:width,height,bottom,border-radius,background-color,box-shadow,backdrop-filter;transition-duration:300ms;transition-timing-function:cubic-bezier(0.34, 1.26, 0.64, 1)}.assistant--moving{will-change:width,height,bottom}.assistant--motion-open{transition-duration:560ms;transition-timing-function:cubic-bezier(0.32, 0.72, 0, 1)}.assistant--motion-close{transition-duration:520ms;transition-timing-function:cubic-bezier(0.85, 0, 0.15, 1)}.assistant--motion-collapse{transition-duration:420ms;transition-timing-function:cubic-bezier(0.85, 0, 0.15, 1)}.assistant--idle{transition-property:width,height,bottom,border-radius,background-color,box-shadow,backdrop-filter;transition-duration:420ms,420ms,420ms,420ms,180ms,180ms,180ms;transition-delay:0s,0s,0s,0s,240ms,240ms,240ms;transition-timing-function:cubic-bezier(0.85, 0, 0.15, 1)}.assistant--idle:has(.assistant__content){transition-duration:520ms,520ms,520ms,520ms,180ms,180ms,180ms;transition-delay:0s,0s,0s,0s,340ms,340ms,340ms}.assistant--motion-resize{transition-duration:420ms;transition-timing-function:cubic-bezier(0.32, 0.72, 0, 1)}.assistant--ribbon{background:color-mix(in srgb, var(--surface) 78%, transparent);box-shadow:var(--shadow-mid);-webkit-backdrop-filter:blur(16px) saturate(1.3);backdrop-filter:blur(16px) saturate(1.3)}.assistant--open{cursor:default;background:color-mix(in srgb, var(--surface) 84%, transparent);box-shadow:var(--shadow-high);-webkit-backdrop-filter:blur(24px) saturate(1.4);backdrop-filter:blur(24px) saturate(1.4)}.assistant__hairline{position:absolute;inset:0;background:color-mix(in srgb, var(--ink) 28%, transparent);opacity:1;pointer-events:none;transition:opacity 200ms ease}.assistant--ribbon .assistant__hairline,.assistant--open .assistant__hairline{opacity:0}.assistant__hairline::before,.assistant__hairline::after{content:\"\";position:absolute;inset:0;border-radius:inherit;opacity:0}.assistant__hairline::before{background:color-mix(in srgb, var(--ink) 70%, transparent)}.assistant__hairline::after{background:linear-gradient(90deg, transparent 0 18%, var(--primary) 30%, var(--purple) 43%, var(--pink) 57%, var(--accent) 70%, transparent 82% 100%);background-repeat:no-repeat;background-size:300% 100%;background-position:0% 0}.assistant--blink .assistant__hairline::before{animation:assistant-blink-highlight 1100ms ease-in-out both}.assistant--blink .assistant__hairline::after{animation:assistant-blink-sweep 1100ms cubic-bezier(0.45, 0, 0.2, 1) both}.assistant--idle.assistant--blink{animation:assistant-blink-glow 1100ms ease-in-out both}.assistant--idle .assistant__hairline{transition:opacity 180ms ease 240ms}.assistant--idle:has(.assistant__content) .assistant__hairline{transition-delay:340ms}.assistant__glow{position:absolute;left:50%;box-sizing:border-box;padding:74px;overflow:hidden;opacity:0;transform:translateX(-50%);pointer-events:none;mask:linear-gradient(var(--ink) 0 0) content-box,linear-gradient(var(--ink) 0 0);mask-composite:exclude;-webkit-mask-composite:xor;transition-property:width,height,bottom,border-radius,opacity;transition-duration:300ms,300ms,300ms,300ms,200ms;transition-timing-function:cubic-bezier(0.34, 1.26, 0.64, 1)}.assistant__glow--motion-open{transition-duration:560ms,560ms,560ms,560ms,200ms;transition-timing-function:cubic-bezier(0.32, 0.72, 0, 1)}.assistant__glow--motion-close{transition-duration:520ms,520ms,520ms,520ms,200ms;transition-timing-function:cubic-bezier(0.85, 0, 0.15, 1)}.assistant__glow--motion-collapse{transition-duration:420ms,420ms,420ms,420ms,200ms;transition-timing-function:cubic-bezier(0.85, 0, 0.15, 1)}.assistant__glow--motion-resize{transition-duration:420ms,420ms,420ms,420ms,200ms;transition-timing-function:cubic-bezier(0.32, 0.72, 0, 1)}.assistant__glow--ribbon,.assistant__glow--open{opacity:.2}.assistant__glow--thinking{opacity:.28}.assistant__glow-band{position:absolute;inset:64px;overflow:hidden;filter:blur(30px)}.assistant__glow--idle{opacity:0;transition-duration:420ms,420ms,420ms,420ms,180ms;transition-delay:0s,0s,0s,0s,240ms;transition-timing-function:cubic-bezier(0.85, 0, 0.15, 1)}.assistant__anchor:has(.assistant__content) .assistant__glow--idle{transition-duration:520ms,520ms,520ms,520ms,180ms;transition-delay:0s,0s,0s,0s,340ms}.assistant__ring{position:absolute;inset:0;box-sizing:border-box;padding:4px;border-radius:inherit;overflow:hidden;opacity:0;pointer-events:none;transition:opacity 200ms ease;mask:linear-gradient(var(--ink) 0 0) content-box,linear-gradient(var(--ink) 0 0);mask-composite:exclude;-webkit-mask-composite:xor}.assistant__ring,.assistant__glow-band{background:conic-gradient(from 0deg, var(--primary), var(--accent), var(--primary), var(--purple), var(--pink), var(--purple), var(--primary))}.assistant__ring--poured{opacity:1;animation:assistant-pour 600ms cubic-bezier(0.2, 0.7, 0.2, 1) backwards}.assistant--idle .assistant__ring{opacity:0;transition:opacity 180ms ease 240ms}.assistant--idle:has(.assistant__content) .assistant__ring{transition-delay:340ms}.assistant__ribbon{position:absolute;top:0;left:0;display:flex;box-sizing:border-box;width:100%;height:52px;align-items:center;padding:0 18px;gap:12px;animation:assistant-enter 260ms cubic-bezier(0.2, 0.7, 0.2, 1) 160ms backwards;transition:width 300ms cubic-bezier(0.34, 1.26, 0.64, 1)}.assistant__sparkle{width:16px;height:16px;flex:0 0 auto}.assistant__ribbon-text{font-size:var(--font-size-body);font-weight:var(--font-weight-medium);line-height:1.2;white-space:nowrap}.assistant__keys{margin-left:auto}.assistant__divider{width:1px;height:18px;flex:0 0 auto;background:var(--opacity-mid)}.assistant__pick,.assistant__ghost{display:inline-flex;box-sizing:border-box;width:28px;height:28px;flex:0 0 auto;align-items:center;justify-content:center;padding:0;border:0;border-radius:var(--radius-md);background:rgba(0,0,0,0);color:var(--opacity-high);cursor:pointer;transition:background-color 120ms ease,color 120ms ease}.assistant__pick svg,.assistant__ghost svg{width:16px;height:16px}.assistant__pick:hover,.assistant__ghost:hover{background:var(--opacity-low);color:var(--ink)}.assistant__pick.is-active{background:var(--opacity-low);color:var(--primary)}.assistant__pick:focus-visible,.assistant__ghost:focus-visible{outline:2px solid var(--primary);outline-offset:2px}.assistant__content{display:flex;box-sizing:border-box;width:min(640px,100vw - 32px);max-height:calc(100dvh - 64px);overflow-y:auto;flex-direction:column;padding:20px;animation:assistant-enter 260ms cubic-bezier(0.2, 0.7, 0.2, 1) 160ms backwards}.assistant__header{display:flex;align-items:center;gap:var(--space-sm)}.assistant__title{min-width:0;display:inline-flex;flex:0 1 auto;align-items:center;gap:8px;font-size:var(--font-size-body);font-weight:var(--font-weight-medium);line-height:1.2}.assistant__title .assistant__sparkle{width:16px;height:16px}.assistant__back{display:inline-flex;box-sizing:border-box;width:24px;height:24px;flex:0 0 auto;align-items:center;justify-content:center;margin:-4px;padding:0;border:0;border-radius:var(--radius-md);background:rgba(0,0,0,0);color:var(--ink);cursor:pointer;transition:background-color 120ms ease}.assistant__back svg{width:16px;height:16px}.assistant__back:hover{background:var(--opacity-low)}.assistant__back:focus-visible{outline:2px solid var(--primary);outline-offset:2px}.assistant__chip{display:inline-flex;min-width:0;align-items:center;padding:6px 10px;border-radius:999px;background:var(--opacity-low);color:var(--opacity-high);font-size:var(--font-size-body-sm);line-height:1.2;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.assistant__chip--picked{background:var(--primary-opacity);color:var(--primary);font-weight:var(--font-weight-medium)}.assistant__header-actions{display:inline-flex;flex:0 0 auto;margin-left:auto;gap:4px}.assistant__question{display:flex;box-sizing:border-box;height:36px;align-items:center;margin-top:var(--space-md);padding:4px 0}.assistant__input,.assistant__asked{min-width:0;flex:1 1 auto;margin:0;padding:0;border:0;background:rgba(0,0,0,0);color:var(--ink);font-family:var(--font-family-base);font-size:var(--font-size-title-2);line-height:28px}.assistant__input{outline:none;caret-color:var(--primary)}.assistant__asked{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.assistant__asked--shimmer{background:linear-gradient(90deg, var(--ink) 0 35%, var(--primary) 50%, var(--ink) 65% 100%);background-size:250% 100%;-webkit-background-clip:text;background-clip:text;color:rgba(0,0,0,0);animation:assistant-enter 260ms cubic-bezier(0.2, 0.7, 0.2, 1) 40ms backwards,assistant-shimmer 1.4s linear infinite}.assistant__follow-up{display:flex;box-sizing:border-box;height:36px;align-items:center;padding-top:var(--space-sm);border-top:1px solid var(--opacity-low);gap:10px}.assistant__follow-up svg{width:16px;height:16px;flex:0 0 auto;color:var(--opacity-high)}.assistant__input--follow-up{font-size:var(--font-size-body);line-height:24px}.assistant__answer{display:flex;flex-direction:column;margin-top:var(--space-md);padding-top:var(--space-md);border-top:1px solid var(--opacity-low);gap:var(--space-md)}.assistant__tiles{display:grid;grid-template-columns:repeat(3, minmax(0, 1fr));gap:var(--space-sm)}.assistant__tile{display:flex;flex-direction:column;padding:12px 14px;border-radius:var(--radius-lg);background:var(--opacity-low)}.assistant__tile-value{font-size:var(--font-size-title-1);font-weight:var(--font-weight-medium);line-height:1.1}.assistant__tile-label{margin-top:2px;color:var(--opacity-high);font-size:var(--font-size-body-sm)}.assistant__footer{display:flex;box-sizing:border-box;height:56px;align-items:center;justify-content:space-between;margin:var(--space-md) -16px -16px;padding:0 16px;border-top:1px solid var(--opacity-low);border-radius:0 0 16px 16px;background:var(--opacity-low);gap:var(--space-md)}.assistant__footer-text{min-width:0;overflow:hidden;color:var(--opacity-high);font-size:var(--font-size-body-sm);line-height:1.3;text-overflow:ellipsis;white-space:nowrap}.assistant__footer-keys{display:inline-flex;flex:0 0 auto;align-items:center;color:var(--opacity-high);font-size:var(--font-size-body-sm);line-height:1;gap:6px}.assistant__footer-keys cx-shortcut-key{display:inline-flex;align-items:center}.assistant__footer-keys span+cx-shortcut-key{margin-left:6px}.assistant__enter{animation:assistant-enter 260ms cubic-bezier(0.2, 0.7, 0.2, 1) 40ms backwards}.assistant__enter--late{animation-delay:240ms}.is-leaving{opacity:0;animation:none;transition:opacity 120ms ease}.assistant__content.is-leaving{transition-duration:160ms;transition-delay:200ms}.assistant--idle .assistant__ribbon.is-leaving{transition-duration:160ms;transition-delay:160ms}@keyframes assistant-enter{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}}@keyframes assistant-pour{from{opacity:0}to{opacity:1}}@keyframes assistant-blink-highlight{0%,100%{opacity:0}14%,78%{opacity:1}}@keyframes assistant-blink-glow{0%,14%,86%,100%{box-shadow:0 0 0 0 rgba(0,0,0,0)}40%,60%{box-shadow:0 0 10px 1px color-mix(in srgb, var(--primary) 45%, transparent),0 0 22px 4px color-mix(in srgb, var(--pink) 30%, transparent)}}@keyframes assistant-blink-sweep{0%,14%{opacity:1;background-position:0% 0}78%,100%{opacity:1;background-position:100% 0}}@keyframes assistant-shimmer{from{background-position:100% 0}to{background-position:0 0}}@media(prefers-reduced-motion: reduce){:host *,:host *::before,:host *::after{transition-duration:1ms !important;transition-delay:0ms !important;animation-duration:1ms !important;animation-delay:0ms !important;animation-iteration-count:1 !important}}.assistant__hit{border:0;padding:0;background:rgba(0,0,0,0)}.assistant__hit:focus-visible{outline:2px solid var(--primary);outline-offset:-2px;border-radius:var(--radius-sm)}.assistant__choices{display:flex;flex-direction:column;margin-top:var(--space-md);max-height:280px;overflow-y:auto;gap:var(--space-xs)}.assistant__choice{display:flex;align-items:center;gap:var(--space-sm);width:100%;padding:var(--space-sm);border:0;border-radius:var(--radius-sm);background:rgba(0,0,0,0);color:var(--ink);text-align:left;font:inherit;cursor:pointer}.assistant__choice:hover,.assistant__choice.is-active{background:var(--opacity-low)}.assistant__choice:focus-visible{outline:2px solid var(--primary);outline-offset:-2px}.assistant__choice:disabled{opacity:.5;cursor:default}.assistant__choice-label{flex:1;min-width:0;overflow-wrap:anywhere}.assistant__choice-description{color:var(--opacity-high);font-size:var(--font-size-body-sm)}.assistant__error{color:var(--danger);margin:var(--space-md) 0 0}.assistant__footer-ask{border:0;padding:0;background:rgba(0,0,0,0);font:inherit;color:inherit;cursor:pointer}.assistant__footer-ask:focus-visible{outline:2px solid var(--primary);outline-offset:2px}.assistant__title-text{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.assistant__footer-ask:disabled{cursor:default}"] }]
        }], ctorParameters: () => [], propDecorators: { heading: [{ type: i0.Input, args: [{ isSignal: true, alias: "heading", required: false }] }], open: [{ type: i0.Input, args: [{ isSignal: true, alias: "open", required: false }] }, { type: i0.Output, args: ["openChange"] }], context: [{ type: i0.Input, args: [{ isSignal: true, alias: "context", required: false }] }], actions: [{ type: i0.Input, args: [{ isSignal: true, alias: "actions", required: false }] }], quickActions: [{ type: i0.Input, args: [{ isSignal: true, alias: "quickActions", required: false }] }], respond: [{ type: i0.Input, args: [{ isSignal: true, alias: "respond", required: false }] }], pick: [{ type: i0.Input, args: [{ isSignal: true, alias: "pick", required: false }] }], shortcut: [{ type: i0.Input, args: [{ isSignal: true, alias: "shortcut", required: false }] }], maxInputTokens: [{ type: i0.Input, args: [{ isSignal: true, alias: "maxInputTokens", required: false }] }], select: [{ type: i0.Output, args: ["select"] }], contextChange: [{ type: i0.Output, args: ["contextChange"] }], box: [{ type: i0.ViewChild, args: ["box", { isSignal: true }] }], ring: [{ type: i0.ViewChild, args: ["ring", { isSignal: true }] }], glowBand: [{ type: i0.ViewChild, args: ["glowBand", { isSignal: true }] }], content: [{ type: i0.ViewChild, args: ["content", { isSignal: true }] }], questionInput: [{ type: i0.ViewChild, args: ["questionInput", { isSignal: true }] }], followUpInput: [{ type: i0.ViewChild, args: ["followUpInput", { isSignal: true }] }] } });
