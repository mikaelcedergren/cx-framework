import { A11yModule } from "@angular/cdk/a11y";
import { ChangeDetectionStrategy, Component, ElementRef, EventEmitter, HostListener, Input, Output, ViewChild, computed, effect, inject, signal, untracked, } from "@angular/core";
import { DomSanitizer } from "@angular/platform-browser";
import { CxIconButtonComponent } from "../../actions/cx-icon-button/index.js";
import { CxCodeBlockComponent } from "../../display/cx-code-block/index.js";
import { CxMarkdownComponent } from "../../display/cx-markdown/index.js";
import { CxTableComponent, } from "../../data/cx-table/index.js";
import { CxSpinnerComponent } from "../../feedback/cx-spinner/index.js";
import { CxStateMessageComponent } from "../../feedback/cx-state-message/index.js";
import { isHostVisible } from "../../shared/host-visibility.js";
import { CxTooltipDirective } from "../cx-tooltip/index.js";
import { CxOverlayStateService, } from "../overlay-state.js";
import { filePreviewKind, parseDelimitedPreview, PreviewError, readPreviewBytes, } from "./file-preview.js";
import * as i0 from "@angular/core";
import * as i1 from "@angular/cdk/a11y";
export class CxLightboxComponent {
    host = inject(ElementRef);
    sanitizer = inject(DomSanitizer);
    overlayState = inject(CxOverlayStateService);
    requestedOpenState = signal(false, /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "requestedOpenState" }] : /* istanbul ignore next */ []));
    filesState = signal([], /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "filesState" }] : /* istanbul ignore next */ []));
    indexState = signal(0, /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "indexState" }] : /* istanbul ignore next */ []));
    retryState = signal(0, /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "retryState" }] : /* istanbul ignore next */ []));
    overlayHandle;
    controller;
    pdfObjectUrl;
    loadTimer;
    viewport;
    resizeObserver;
    drag;
    backdropPress;
    ariaLabelState = "File preview";
    previousAriaLabelState = "Previous file";
    nextAriaLabelState = "Next file";
    isOpen$ = computed(() => this.requestedOpenState() && this.filesState().length > 0, /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "isOpen$" }] : /* istanbul ignore next */ []));
    currentIndex$ = computed(() => Math.min(this.indexState(), Math.max(0, this.filesState().length - 1)), /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "currentIndex$" }] : /* istanbul ignore next */ []));
    currentFile$ = computed(() => this.filesState()[this.currentIndex$()], /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "currentFile$" }] : /* istanbul ignore next */ []));
    kind$ = computed(() => this.currentFile$() ? filePreviewKind(this.currentFile$()) : "unsupported", /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "kind$" }] : /* istanbul ignore next */ []));
    hasNavigation$ = computed(() => this.filesState().length > 1, /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "hasNavigation$" }] : /* istanbul ignore next */ []));
    canGoPrevious$ = computed(() => this.currentIndex$() > 0, /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "canGoPrevious$" }] : /* istanbul ignore next */ []));
    canGoNext$ = computed(() => this.currentIndex$() < this.filesState().length - 1, /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "canGoNext$" }] : /* istanbul ignore next */ []));
    positionText$ = computed(() => `${this.currentIndex$() + 1} / ${this.filesState().length}`, /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "positionText$" }] : /* istanbul ignore next */ []));
    positionLabel$ = computed(() => `File ${this.currentIndex$() + 1} of ${this.filesState().length}`, /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "positionLabel$" }] : /* istanbul ignore next */ []));
    renderKey$ = signal(0, /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "renderKey$" }] : /* istanbul ignore next */ []));
    source$ = signal("", /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "source$" }] : /* istanbul ignore next */ []));
    pdfUrl$ = signal(undefined, /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "pdfUrl$" }] : /* istanbul ignore next */ []));
    state$ = signal("loading", /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "state$" }] : /* istanbul ignore next */ []));
    message$ = signal("", /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "message$" }] : /* istanbul ignore next */ []));
    retryable$ = signal(false, /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "retryable$" }] : /* istanbul ignore next */ []));
    text$ = signal("", /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "text$" }] : /* istanbul ignore next */ []));
    textLimited$ = signal(false, /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "textLimited$" }] : /* istanbul ignore next */ []));
    wrap$ = signal(true, /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "wrap$" }] : /* istanbul ignore next */ []));
    showSource$ = signal(false, /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "showSource$" }] : /* istanbul ignore next */ []));
    tableColumns$ = signal([], /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "tableColumns$" }] : /* istanbul ignore next */ []));
    tableRows$ = signal([], /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "tableRows$" }] : /* istanbul ignore next */ []));
    tableLimited$ = signal(false, /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "tableLimited$" }] : /* istanbul ignore next */ []));
    naturalSize$ = signal({ width: 0, height: 0 }, /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "naturalSize$" }] : /* istanbul ignore next */ []));
    viewportSize$ = signal({ width: 0, height: 0 }, /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "viewportSize$" }] : /* istanbul ignore next */ []));
    zoom$ = signal(undefined, /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "zoom$" }] : /* istanbul ignore next */ []));
    dragging$ = signal(false, /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "dragging$" }] : /* istanbul ignore next */ []));
    fitScale$ = computed(() => {
        const image = this.naturalSize$();
        const viewport = this.viewportSize$();
        return image.width && viewport.width
            ? Math.min(1, viewport.width / image.width, viewport.height / image.height)
            : 1;
    }, /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "fitScale$" }] : /* istanbul ignore next */ []));
    scale$ = computed(() => this.zoom$() ?? this.fitScale$(), /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "scale$" }] : /* istanbul ignore next */ []));
    zoomText$ = computed(() => `${Math.round(this.scale$() * 100)}%`, /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "zoomText$" }] : /* istanbul ignore next */ []));
    imageWidth$ = computed(() => this.naturalSize$().width * this.scale$(), /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "imageWidth$" }] : /* istanbul ignore next */ []));
    imageHeight$ = computed(() => this.naturalSize$().height * this.scale$(), /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "imageHeight$" }] : /* istanbul ignore next */ []));
    canPan$ = computed(() => this.imageWidth$() > this.viewportSize$().width ||
        this.imageHeight$() > this.viewportSize$().height, /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "canPan$" }] : /* istanbul ignore next */ []));
    metadata$ = computed(() => {
        const size = this.currentFile$()?.size;
        if (size === undefined)
            return "";
        if (size < 1024)
            return `${size} B`;
        if (size < 1024 * 1024)
            return `${Math.round(size / 1024)} KB`;
        return `${(size / (1024 * 1024)).toFixed(1)} MB`;
    }, /* @ts-ignore */
    ...(ngDevMode ? [{ debugName: "metadata$" }] : /* istanbul ignore next */ []));
    set files(value) {
        if (!Array.isArray(value) ||
            value.some((file) => !file?.src?.trim() ||
                !file.name?.trim() ||
                (file.size !== undefined &&
                    (!Number.isFinite(file.size) || file.size < 0)))) {
            throw new Error("[cx-lightbox] files requires an array of files with non-empty src and name, and an optional non-negative size.");
        }
        this.filesState.set(value);
        this.reconcileOverlay();
    }
    get files() {
        return this.filesState();
    }
    set index(value) {
        this.indexState.set(Number.isFinite(value) ? Math.max(0, Math.trunc(value)) : 0);
    }
    get index() {
        return this.currentIndex$();
    }
    set open(value) {
        this.requestedOpenState.set(Boolean(value));
        this.reconcileOverlay();
    }
    get open() {
        return this.requestedOpenState();
    }
    set ariaLabel(value) {
        this.ariaLabelState = value?.trim() || "File preview";
    }
    get ariaLabel() {
        return this.ariaLabelState;
    }
    set previousAriaLabel(value) {
        this.previousAriaLabelState = value?.trim() || "Previous file";
    }
    get previousAriaLabel() {
        return this.previousAriaLabelState;
    }
    set nextAriaLabel(value) {
        this.nextAriaLabelState = value?.trim() || "Next file";
    }
    get nextAriaLabel() {
        return this.nextAriaLabelState;
    }
    indexChange = new EventEmitter();
    openChange = new EventEmitter();
    /** Supply this handler for protected download endpoints or cross-origin originals. */
    download = new EventEmitter();
    set previewViewport(value) {
        this.resizeObserver?.disconnect();
        this.viewport = value?.nativeElement;
        if (this.viewport) {
            this.resizeObserver = new ResizeObserver((entries) => {
                const rect = entries[0]?.contentRect;
                if (rect)
                    this.viewportSize$.set({ width: rect.width, height: rect.height });
            });
            this.resizeObserver.observe(this.viewport);
        }
    }
    constructor() {
        effect(() => {
            const file = this.isOpen$() ? this.currentFile$() : undefined;
            this.retryState();
            untracked(() => {
                this.releasePreview();
                if (file)
                    void this.loadPreview(file);
            });
        });
    }
    ngOnDestroy() {
        this.releasePreview();
        this.resizeObserver?.disconnect();
        this.overlayState.release(this.overlayHandle);
    }
    isBackdrop(target) {
        return (target instanceof Element &&
            target.matches(".cx-lightbox, .cx-lightbox__stage, .cx-lightbox__surface:not(.cx-lightbox__surface--document), .cx-lightbox__viewport, .cx-lightbox__image-plane, .cx-lightbox__footer"));
    }
    onBackdropPointerDown(event) {
        this.backdropPress =
            event.button === 0 && this.isBackdrop(event.target)
                ? { x: event.clientX, y: event.clientY }
                : undefined;
    }
    onBackdropPointerMove(event) {
        // A pan or selection that crosses the backdrop must not dismiss the preview.
        if (this.backdropPress &&
            Math.hypot(event.clientX - this.backdropPress.x, event.clientY - this.backdropPress.y) > 5)
            this.backdropPress = undefined;
    }
    onBackdropClick(event) {
        const pressedOutside = this.backdropPress !== undefined;
        this.backdropPress = undefined;
        if (pressedOutside &&
            this.isBackdrop(event.target) &&
            this.overlayState.isTopmost(this.overlayHandle)) {
            this.closeFromUser();
        }
    }
    onDialogKeydown(event) {
        if (event.defaultPrevented ||
            event.isComposing ||
            event.altKey ||
            event.ctrlKey ||
            event.metaKey ||
            event.shiftKey ||
            !this.isOpen$() ||
            !this.overlayState.isTopmost(this.overlayHandle))
            return;
        const target = event.target;
        // Content owns its keys: selection, media seeking, table navigation and panning.
        if (target instanceof Element &&
            (target.closest('input, textarea, select, audio, video, iframe, [contenteditable="true"], .cx-lightbox__document') ||
                (this.canPan$() && target.closest(".cx-lightbox__viewport"))))
            return;
        if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
            event.preventDefault();
            event.stopPropagation();
            this.navigate(event.key === "ArrowLeft" ? -1 : 1);
        }
    }
    navigate(direction) {
        if (!this.overlayState.isTopmost(this.overlayHandle))
            return;
        const next = Math.max(0, Math.min(this.currentIndex$() + direction, this.filesState().length - 1));
        if (next === this.currentIndex$())
            return;
        this.indexState.set(next);
        this.indexChange.emit(next);
    }
    closeFromUser() {
        if (!this.requestedOpenState())
            return;
        this.requestedOpenState.set(false);
        this.releasePreview();
        this.reconcileOverlay();
        this.openChange.emit(false);
    }
    retry() {
        this.retryState.update((value) => value + 1);
    }
    ready(key) {
        if (this.controller?.signal.aborted ||
            (key !== undefined && key !== this.renderKey$()))
            return;
        clearTimeout(this.loadTimer);
        this.state$.set("ready");
    }
    imageLoaded(event, key) {
        if (this.controller?.signal.aborted || key !== this.renderKey$())
            return;
        const image = event.target;
        this.naturalSize$.set({
            width: image.naturalWidth,
            height: image.naturalHeight,
        });
        this.ready();
    }
    mediaFailed(key) {
        if (this.controller?.signal.aborted || key !== this.renderKey$())
            return;
        this.fail(new PreviewError("This file could not be previewed. It may be damaged or use an unsupported format.", true));
    }
    zoomBy(amount) {
        this.zoom$.set(Math.max(0.1, Math.min(4, Math.round((this.scale$() + amount) * 100) / 100)));
    }
    fit() {
        this.zoom$.set(undefined);
        if (this.viewport) {
            this.viewport.scrollTop = 0;
            this.viewport.scrollLeft = 0;
        }
    }
    startPan(event) {
        if (!this.canPan$() ||
            event.button !== 0 ||
            !this.viewport ||
            event.pointerType === "touch")
            return;
        this.drag = {
            x: event.clientX,
            y: event.clientY,
            left: this.viewport.scrollLeft,
            top: this.viewport.scrollTop,
        };
        this.viewport.setPointerCapture(event.pointerId);
        this.dragging$.set(true);
        event.preventDefault();
    }
    pan(event) {
        if (!this.drag || !this.viewport)
            return;
        this.viewport.scrollLeft = this.drag.left - (event.clientX - this.drag.x);
        this.viewport.scrollTop = this.drag.top - (event.clientY - this.drag.y);
    }
    endPan() {
        this.drag = undefined;
        this.dragging$.set(false);
    }
    downloadOriginal() {
        const file = this.currentFile$();
        if (!file)
            return;
        if (this.download.observed) {
            this.download.emit(file);
            return;
        }
        const anchor = document.createElement("a");
        anchor.href = this.fileUrl(file.src);
        anchor.download = file.name;
        anchor.rel = "noopener";
        document.body.append(anchor);
        anchor.click();
        anchor.remove();
    }
    openSeparately() {
        const file = this.currentFile$();
        if (file)
            window.open(this.fileUrl(file.src), "_blank", "noopener,noreferrer");
    }
    fileUrl(src) {
        const url = new URL(src, document.baseURI);
        if (!["http:", "https:", "blob:"].includes(url.protocol))
            throw new PreviewError("This file address cannot be previewed.");
        return url.href;
    }
    async loadPreview(file) {
        this.renderKey$.update((value) => value + 1);
        this.state$.set("loading");
        this.message$.set("");
        this.retryable$.set(false);
        this.source$.set("");
        this.pdfUrl$.set(undefined);
        this.text$.set("");
        this.textLimited$.set(false);
        this.tableColumns$.set([]);
        this.tableRows$.set([]);
        this.tableLimited$.set(false);
        this.zoom$.set(undefined);
        this.naturalSize$.set({ width: 0, height: 0 });
        this.wrap$.set(true);
        this.showSource$.set(false);
        this.endPan();
        const controller = new AbortController();
        this.controller = controller;
        try {
            const src = this.fileUrl(file.src);
            const kind = filePreviewKind(file);
            this.source$.set(src);
            if (kind === "unsupported") {
                this.state$.set("unsupported");
                return;
            }
            if (["image", "audio", "video"].includes(kind)) {
                this.loadTimer = setTimeout(() => this.fail(new PreviewError("The preview is taking too long to load.", true)), 20_000);
                return;
            }
            if (kind === "pdf" && !navigator.pdfViewerEnabled) {
                throw new PreviewError("This browser cannot display PDFs here. Open the file in a new tab or download it.");
            }
            const response = await fetch(src, {
                signal: AbortSignal.any([
                    controller.signal,
                    AbortSignal.timeout(20_000),
                ]),
            });
            const bytes = await readPreviewBytes(response, kind === "pdf" ? 25 * 1024 * 1024 : 1024 * 1024);
            if (controller.signal.aborted)
                return;
            if (!bytes.length) {
                this.state$.set("empty");
                return;
            }
            if (kind === "pdf") {
                // Only verified PDF bytes become a trusted frame URL; never embed an arbitrary HTML response.
                if (!new TextDecoder().decode(bytes.slice(0, 5)).startsWith("%PDF-"))
                    throw new PreviewError("This file is not a readable PDF. Download the original file.");
                this.pdfObjectUrl = URL.createObjectURL(new Blob([bytes], { type: "application/pdf" }));
                this.pdfUrl$.set(this.sanitizer.bypassSecurityTrustResourceUrl(this.pdfObjectUrl));
                this.loadTimer = setTimeout(() => this.fail(new PreviewError("The PDF could not be displayed here. Open it in a new tab or download the original.")), 10_000);
                return;
            }
            let text;
            try {
                const encoding = bytes[0] === 0xff && bytes[1] === 0xfe
                    ? "utf-16le"
                    : bytes[0] === 0xfe && bytes[1] === 0xff
                        ? "utf-16be"
                        : "utf-8";
                text = new TextDecoder(encoding, { fatal: true }).decode(bytes);
            }
            catch {
                throw new PreviewError("This file uses an unsupported text encoding. Download the original file.");
            }
            if (!text.trim()) {
                this.state$.set("empty");
                return;
            }
            if (text.includes("\0"))
                throw new PreviewError("This file is not readable text. Download the original file.");
            if (kind === "table") {
                const delimiter = file.name.toLowerCase().endsWith(".tsv") ||
                    file.mimeType?.split(";")[0] === "text/tab-separated-values"
                    ? "\t"
                    : ",";
                const parsed = parseDelimitedPreview(text, delimiter);
                if (!parsed.rows.length) {
                    this.state$.set("empty");
                    return;
                }
                const width = Math.max(...parsed.rows.map((row) => row.length));
                this.tableColumns$.set(Array.from({ length: width }, (_, index) => ({
                    id: String(index),
                    label: parsed.rows[0][index] || `Column ${index + 1}`,
                    size: "content",
                    hideable: false,
                    pinnable: false,
                })));
                this.tableRows$.set(parsed.rows.slice(1).map((row, index) => ({
                    id: String(index),
                    cells: Object.fromEntries(Array.from({ length: width }, (_, column) => [
                        String(column),
                        { kind: "text", value: row[column] ?? "" },
                    ])),
                })));
                this.tableLimited$.set(parsed.limited);
            }
            let formatted = text;
            if (file.name.toLowerCase().endsWith(".json") ||
                file.mimeType === "application/json") {
                try {
                    formatted = JSON.stringify(JSON.parse(text), null, 2);
                }
                catch {
                    /* Preserve malformed JSON as readable source. */
                }
            }
            const preview = formatted
                .slice(0, 200_000)
                .split("\n")
                .slice(0, 2000)
                .join("\n");
            this.textLimited$.set(preview.length < formatted.length);
            this.text$.set(preview);
            this.ready();
        }
        catch (error) {
            if (!controller.signal.aborted)
                this.fail(error);
        }
    }
    fail(error) {
        clearTimeout(this.loadTimer);
        this.message$.set(error instanceof PreviewError
            ? error.message
            : "The file could not be loaded. Try again or download the original.");
        this.retryable$.set(error instanceof PreviewError ? error.retryable : true);
        this.state$.set("error");
    }
    releasePreview() {
        this.controller?.abort();
        clearTimeout(this.loadTimer);
        this.host.nativeElement
            .querySelectorAll("video, audio")
            .forEach((media) => {
            media.pause();
            media.removeAttribute("src");
            media.load();
        });
        if (this.pdfObjectUrl) {
            URL.revokeObjectURL(this.pdfObjectUrl);
            this.pdfObjectUrl = undefined;
        }
        this.endPan();
    }
    reconcileOverlay() {
        if (this.isOpen$()) {
            this.overlayHandle ??= this.overlayState.capture({
                surface: () => this.host.nativeElement.querySelector(".cx-lightbox") ??
                    undefined,
                isActive: () => isHostVisible(this.host.nativeElement.querySelector(".cx-lightbox")),
                onEscape: () => this.closeFromUser(),
            });
        }
        else {
            this.overlayState.release(this.overlayHandle);
            this.overlayHandle = undefined;
        }
    }
    static ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "22.2.2", ngImport: i0, type: CxLightboxComponent, deps: [], target: i0.ɵɵFactoryTarget.Component });
    static ɵcmp = i0.ɵɵngDeclareComponent({ minVersion: "17.0.0", version: "22.2.2", type: CxLightboxComponent, isStandalone: true, selector: "cx-lightbox", inputs: { files: "files", index: "index", open: "open", ariaLabel: "ariaLabel", previousAriaLabel: "previousAriaLabel", nextAriaLabel: "nextAriaLabel" }, outputs: { indexChange: "indexChange", openChange: "openChange", download: "download" }, host: { listeners: { "document:keydown": "onDialogKeydown($event)" } }, viewQueries: [{ propertyName: "previewViewport", first: true, predicate: ["viewport"], descendants: true }], ngImport: i0, template: "@if (isOpen$()) {\n  @if (currentFile$(); as file) {\n    <div\n      class=\"cx-lightbox\"\n      [class.cx-lightbox--caption]=\"!!file.caption\"\n      role=\"dialog\"\n      aria-modal=\"true\"\n      cdkTrapFocus\n      [cdkTrapFocusAutoCapture]=\"true\"\n      [attr.aria-label]=\"ariaLabel\"\n      [attr.aria-keyshortcuts]=\"\n        hasNavigation$() ? 'Escape ArrowLeft ArrowRight' : 'Escape'\n      \"\n      (pointerdown)=\"onBackdropPointerDown($event)\"\n      (pointermove)=\"onBackdropPointerMove($event)\"\n      (click)=\"onBackdropClick($event)\"\n    >\n      <header class=\"cx-lightbox__header\">\n        <div class=\"cx-lightbox__identity\">\n          <span\n            class=\"cx-lightbox__name\"\n            [cxTooltip]=\"file.name\"\n            [cxTooltipOverflow]=\"true\"\n            data-cx-tooltip-overflow\n            >{{ file.name }}</span\n          >\n          @if (metadata$()) {\n            <span class=\"cx-lightbox__metadata\">{{ metadata$() }}</span>\n          }\n        </div>\n        @if (\n          hasNavigation$() ||\n          (state$() === \"ready\" &&\n            (kind$() === \"image\" ||\n              kind$() === \"text\" ||\n              kind$() === \"markdown\"))\n        ) {\n          <div\n            class=\"cx-lightbox__toolbar\"\n            role=\"group\"\n            aria-label=\"Preview controls\"\n          >\n            @if (hasNavigation$()) {\n              <span\n                class=\"cx-lightbox__position\"\n                role=\"status\"\n                aria-live=\"polite\"\n                aria-atomic=\"true\"\n                [attr.aria-label]=\"positionLabel$()\"\n                >{{ positionText$() }}</span\n              >\n            }\n            @if (state$() === \"ready\") {\n              @if (kind$() === \"image\") {\n                <div\n                  class=\"cx-lightbox__group\"\n                  role=\"group\"\n                  aria-label=\"Image zoom\"\n                >\n                  <cx-icon-button\n                    icon=\"minus\"\n                    variant=\"transparent\"\n                    ariaLabel=\"Zoom out\"\n                    cxTooltip=\"Zoom out\"\n                    [disabled]=\"scale$() <= 0.1\"\n                    (pressed)=\"zoomBy(-0.25)\"\n                  />\n                  <span class=\"cx-lightbox__position\" aria-live=\"polite\">{{\n                    zoomText$()\n                  }}</span>\n                  <cx-icon-button\n                    icon=\"plus\"\n                    variant=\"transparent\"\n                    ariaLabel=\"Zoom in\"\n                    cxTooltip=\"Zoom in\"\n                    [disabled]=\"scale$() >= 4\"\n                    (pressed)=\"zoomBy(0.25)\"\n                  />\n                  <cx-icon-button\n                    icon=\"minimize\"\n                    variant=\"transparent\"\n                    ariaLabel=\"Fit to view\"\n                    cxTooltip=\"Fit to view\"\n                    (pressed)=\"fit()\"\n                  />\n                </div>\n              }\n              @if (kind$() === \"text\" || kind$() === \"markdown\") {\n                <div\n                  class=\"cx-lightbox__group\"\n                  role=\"group\"\n                  aria-label=\"Text view\"\n                >\n                  @if (kind$() === \"text\" || showSource$()) {\n                    <cx-icon-button\n                      icon=\"text\"\n                      variant=\"transparent\"\n                      ariaLabel=\"Wrap lines\"\n                      cxTooltip=\"Wrap lines\"\n                      [selected]=\"wrap$()\"\n                      [ariaPressed]=\"wrap$()\"\n                      (pressed)=\"wrap$.set(!wrap$())\"\n                    />\n                  }\n                  @if (kind$() === \"markdown\") {\n                    <cx-icon-button\n                      icon=\"braces\"\n                      variant=\"transparent\"\n                      ariaLabel=\"Show source\"\n                      cxTooltip=\"Show source\"\n                      [selected]=\"showSource$()\"\n                      [ariaPressed]=\"showSource$()\"\n                      (pressed)=\"showSource$.set(!showSource$())\"\n                    />\n                  }\n                </div>\n              }\n            }\n          </div>\n        }\n        <div class=\"cx-lightbox__actions\">\n          @if (source$()) {\n            <cx-icon-button\n              icon=\"download\"\n              variant=\"transparent\"\n              ariaLabel=\"Download original\"\n              cxTooltip=\"Download original\"\n              (pressed)=\"downloadOriginal()\"\n            />\n            @if (kind$() === \"pdf\") {\n              <cx-icon-button\n                icon=\"open-new\"\n                variant=\"transparent\"\n                ariaLabel=\"Open PDF in new tab\"\n                cxTooltip=\"Open PDF in new tab\"\n                (pressed)=\"openSeparately()\"\n              />\n            }\n          }\n          <cx-icon-button\n            icon=\"remove\"\n            variant=\"transparent\"\n            ariaLabel=\"Close preview\"\n            cxTooltip=\"Close preview\"\n            (pressed)=\"closeFromUser()\"\n          />\n        </div>\n      </header>\n\n      <div\n        class=\"cx-lightbox__stage\"\n        [class.cx-lightbox__stage--navigation]=\"hasNavigation$()\"\n      >\n        @if (hasNavigation$()) {\n          <cx-icon-button\n            icon=\"chevron-left\"\n            class=\"cx-lightbox__previous\"\n            variant=\"emphasis\"\n            [rounded]=\"true\"\n            [ariaLabel]=\"previousAriaLabel\"\n            [cxTooltip]=\"previousAriaLabel\"\n            [disabled]=\"!canGoPrevious$()\"\n            (pressed)=\"navigate(-1)\"\n          />\n        }\n        <section\n          class=\"cx-lightbox__surface\"\n          tabindex=\"-1\"\n          cdkFocusInitial\n          [attr.aria-label]=\"file.name\"\n          [class.cx-lightbox__surface--document]=\"\n            kind$() === 'pdf' ||\n            kind$() === 'text' ||\n            kind$() === 'markdown' ||\n            kind$() === 'table'\n          \"\n        >\n          @for (key of [renderKey$()]; track key) {\n            @if (state$() === \"loading\") {\n              <div class=\"cx-lightbox__state\">\n                <cx-spinner ariaLabel=\"Loading preview\" />\n              </div>\n            }\n            @if (\n              state$() === \"error\" ||\n              state$() === \"unsupported\" ||\n              state$() === \"empty\"\n            ) {\n              <div class=\"cx-lightbox__state\">\n                <div class=\"cx-lightbox__state-content\">\n                  <cx-state-message\n                    visual=\"none\"\n                    [heading]=\"\n                      state$() === 'empty'\n                        ? 'This file is empty'\n                        : 'Preview unavailable'\n                    \"\n                    [description]=\"\n                      state$() === 'unsupported'\n                        ? 'Download the original to open it in another app.'\n                        : message$() || undefined\n                    \"\n                  />\n                  @if (retryable$()) {\n                    <cx-icon-button\n                      icon=\"reload\"\n                      ariaLabel=\"Retry preview\"\n                      cxTooltip=\"Retry preview\"\n                      (pressed)=\"retry()\"\n                    />\n                  }\n                </div>\n              </div>\n            } @else {\n              @switch (kind$()) {\n                @case (\"image\") {\n                  <div\n                    #viewport\n                    class=\"cx-lightbox__viewport\"\n                    tabindex=\"0\"\n                    aria-label=\"Image preview\"\n                    [class.cx-lightbox__viewport--pannable]=\"canPan$()\"\n                    [class.cx-lightbox__viewport--dragging]=\"dragging$()\"\n                    (pointerdown)=\"startPan($event)\"\n                    (pointermove)=\"pan($event)\"\n                    (pointerup)=\"endPan()\"\n                    (pointercancel)=\"endPan()\"\n                    (lostpointercapture)=\"endPan()\"\n                  >\n                    <div class=\"cx-lightbox__image-plane\">\n                      @if (source$()) {\n                        <img\n                          class=\"cx-lightbox__image\"\n                          [src]=\"source$()\"\n                          [alt]=\"file.alt || file.name\"\n                          [draggable]=\"false\"\n                          [style.width.px]=\"imageWidth$() || null\"\n                          [style.height.px]=\"imageHeight$() || null\"\n                          [style.visibility]=\"\n                            state$() === 'ready' ? 'visible' : 'hidden'\n                          \"\n                          (load)=\"imageLoaded($event, key)\"\n                          (error)=\"mediaFailed(key)\"\n                        />\n                      }\n                    </div>\n                  </div>\n                }\n                @case (\"pdf\") {\n                  @if (pdfUrl$(); as url) {\n                    <iframe\n                      class=\"cx-lightbox__pdf cx-lightbox__document\"\n                      [src]=\"url\"\n                      [title]=\"file.name\"\n                      (load)=\"ready(key)\"\n                      (error)=\"mediaFailed(key)\"\n                    ></iframe>\n                  }\n                }\n                @case (\"video\") {\n                  @if (source$()) {\n                    <video\n                      class=\"cx-lightbox__video\"\n                      [src]=\"source$()\"\n                      controls\n                      playsinline\n                      preload=\"metadata\"\n                      [attr.aria-label]=\"file.name\"\n                      (loadedmetadata)=\"ready(key)\"\n                      (error)=\"mediaFailed(key)\"\n                    ></video>\n                  }\n                }\n                @case (\"audio\") {\n                  @if (source$()) {\n                    <audio\n                      class=\"cx-lightbox__audio\"\n                      [src]=\"source$()\"\n                      controls\n                      preload=\"metadata\"\n                      [attr.aria-label]=\"file.name\"\n                      (loadedmetadata)=\"ready(key)\"\n                      (error)=\"mediaFailed(key)\"\n                    ></audio>\n                  }\n                }\n                @default {\n                  @if (state$() === \"ready\") {\n                    <div\n                      class=\"cx-lightbox__document\"\n                      tabindex=\"0\"\n                      [attr.aria-label]=\"file.name\"\n                    >\n                      @if (textLimited$() && kind$() !== \"table\") {\n                        <p class=\"cx-lightbox__notice\">\n                          Showing the first part of this file. Download the\n                          original for the full text.\n                        </p>\n                      }\n                      @if (kind$() === \"table\") {\n                        @if (tableLimited$()) {\n                          <p class=\"cx-lightbox__notice\">\n                            Showing the first 200 rows and up to 40 columns.\n                            Download the original for the full table.\n                          </p>\n                        }\n                        <cx-table\n                          [columns]=\"tableColumns$()\"\n                          [rows]=\"tableRows$()\"\n                          density=\"compact\"\n                          [columnsResizable]=\"false\"\n                          [columnsReorderable]=\"false\"\n                          [showRowActions]=\"false\"\n                          [rightClickMenu]=\"false\"\n                          [emptyState]=\"{\n                            heading: 'No data rows',\n                            description:\n                              'This file contains only column headings.',\n                          }\"\n                        />\n                      } @else if (kind$() === \"markdown\" && !showSource$()) {\n                        <cx-markdown [markdown]=\"text$()\" />\n                      } @else {\n                        <cx-code-block [code]=\"text$()\" [wrap]=\"wrap$()\" />\n                      }\n                    </div>\n                  }\n                }\n              }\n            }\n          }\n        </section>\n        @if (hasNavigation$()) {\n          <cx-icon-button\n            icon=\"chevron-right\"\n            class=\"cx-lightbox__next\"\n            variant=\"emphasis\"\n            [rounded]=\"true\"\n            [ariaLabel]=\"nextAriaLabel\"\n            [cxTooltip]=\"nextAriaLabel\"\n            [disabled]=\"!canGoNext$()\"\n            (pressed)=\"navigate(1)\"\n          />\n        }\n      </div>\n\n      @if (file.caption) {\n        <footer class=\"cx-lightbox__footer\">\n          <p class=\"cx-lightbox__caption\">{{ file.caption }}</p>\n        </footer>\n      }\n    </div>\n  }\n}\n", styles: [":host{display:contents}.cx-lightbox{position:fixed;inset:0;z-index:var(--z-index-dialog);display:grid;grid-template-rows:auto minmax(0, 1fr);gap:var(--space-md);padding:var(--space-lg);box-sizing:border-box;background:var(--overlay-backdrop);backdrop-filter:blur(var(--overlay-backdrop-blur));color:var(--ink)}.cx-lightbox--caption{grid-template-rows:auto minmax(0, 1fr) auto}.cx-lightbox__header{display:grid;grid-template-columns:minmax(0, 1fr) auto minmax(0, 1fr);align-items:center;gap:var(--space-md);min-width:0;padding:var(--space-sm) var(--space-md);background:var(--surface);border-radius:var(--radius-lg)}.cx-lightbox__identity{min-width:0;display:grid;gap:var(--space-2xs)}.cx-lightbox__name{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:var(--font-size-body);font-weight:var(--font-weight-medium)}.cx-lightbox__metadata{color:var(--opacity-high);font-size:var(--font-size-body-sm)}.cx-lightbox__actions{grid-column:3;justify-self:end;display:flex;align-items:center;flex:0 0 auto;gap:var(--space-xs)}.cx-lightbox__stage{min-height:0;min-width:0;display:grid}.cx-lightbox__stage--navigation{grid-template-columns:auto minmax(0, 1fr) auto;gap:var(--space-md)}.cx-lightbox__previous,.cx-lightbox__next{align-self:center}.cx-lightbox__surface{position:relative;min-height:0;min-width:0;width:100%;height:100%;display:grid;justify-self:center;outline:none;animation:cx-lightbox-enter var(--motion-base) var(--ease-out)}.cx-lightbox__surface--document{max-width:var(--content-width-xl);border-radius:var(--radius-lg);background:var(--surface);overflow:hidden}.cx-lightbox__viewport{min-height:0;min-width:0;overflow:auto;outline:none;overscroll-behavior:contain}.cx-lightbox__viewport:focus-visible{outline:var(--outline-tab);outline-offset:var(--outline-tab-offset)}.cx-lightbox__viewport--pannable{cursor:grab}.cx-lightbox__viewport--dragging{cursor:grabbing}.cx-lightbox__image-plane{display:grid;place-items:center;min-width:100%;min-height:100%;width:max-content}.cx-lightbox__image{display:block;max-width:none;border-radius:var(--radius-lg)}.cx-lightbox__pdf{display:block;border:0;width:100%;height:100%;padding:0}.cx-lightbox__document{min-width:0;min-height:0;overflow:auto;overscroll-behavior:contain;box-sizing:border-box}div.cx-lightbox__document{padding:var(--space-lg)}.cx-lightbox__video{display:block;align-self:center;justify-self:center;max-width:100%;max-height:100%;min-height:0;border-radius:var(--radius-lg)}.cx-lightbox__audio{align-self:center;justify-self:center;width:100%;max-width:var(--content-width-md)}.cx-lightbox__state{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:var(--space-md);padding:var(--space-lg);background:var(--surface);border-radius:var(--radius-lg)}.cx-lightbox__state-content{display:grid;justify-items:center;gap:var(--space-sm)}.cx-lightbox__notice{margin:0 0 var(--space-md);font-size:var(--font-size-body-sm);color:var(--opacity-high)}.cx-lightbox__footer{display:grid;justify-items:center;gap:var(--space-sm);min-width:0}.cx-lightbox__caption{margin:0;padding:var(--space-xs) var(--space-sm);max-width:var(--content-width-md);background:var(--surface);color:var(--opacity-high);border-radius:var(--radius-sm);font-size:var(--font-size-body-sm);text-align:center;overflow-wrap:anywhere}.cx-lightbox__toolbar{display:flex;flex-wrap:wrap;justify-content:center;align-items:center;gap:var(--space-lg);min-width:0}.cx-lightbox__group{display:flex;align-items:center;gap:var(--space-xs)}.cx-lightbox__position{min-width:5ch;text-align:center;font-size:var(--font-size-body-sm);font-variant-numeric:tabular-nums;color:var(--opacity-high)}@media(max-width: 720px){.cx-lightbox{padding:var(--space-sm);gap:var(--space-sm)}.cx-lightbox__header{grid-template-columns:minmax(0, 1fr) auto;padding:var(--space-xs) var(--space-sm);gap:var(--space-sm)}.cx-lightbox__actions{grid-column:2;grid-row:1}.cx-lightbox__toolbar{grid-column:1/-1;grid-row:2;gap:var(--space-md)}.cx-lightbox__stage--navigation{gap:var(--space-sm)}div.cx-lightbox__document{padding:var(--space-md)}}@keyframes cx-lightbox-enter{from{opacity:0}to{opacity:1}}@media(prefers-reduced-motion: reduce){.cx-lightbox__surface{animation:none}}"], dependencies: [{ kind: "ngmodule", type: A11yModule }, { kind: "directive", type: i1.CdkTrapFocus, selector: "[cdkTrapFocus]", inputs: ["cdkTrapFocus", "cdkTrapFocusAutoCapture"], exportAs: ["cdkTrapFocus"] }, { kind: "component", type: CxIconButtonComponent, selector: "cx-icon-button", inputs: ["icon", "ariaLabel", "role", "ariaHasPopup", "ariaExpanded", "ariaControls", "mood", "variant", "size", "selected", "ariaPressed", "rounded", "disabled", "badgeValue", "block", "loading", "countdown"], outputs: ["pressed", "countdownChange"] }, { kind: "directive", type: CxTooltipDirective, selector: "[cxTooltip]", inputs: ["cxTooltip", "cxTooltipPosition", "cxTooltipDelay", "cxTooltipDisabled", "cxTooltipOverflow"] }, { kind: "component", type: CxSpinnerComponent, selector: "cx-spinner", inputs: ["mood", "ariaLabel", "size"] }, { kind: "component", type: CxStateMessageComponent, selector: "cx-state-message", inputs: ["heading", "description", "action", "secondaryAction", "state", "visual", "layout", "icon"], outputs: ["action", "secondaryAction"] }, { kind: "component", type: CxCodeBlockComponent, selector: "cx-code-block", inputs: ["code", "heading", "annotations", "copyable", "wrap"] }, { kind: "component", type: CxMarkdownComponent, selector: "cx-markdown", inputs: ["markdown", "variant"], outputs: ["linkClick"] }, { kind: "component", type: CxTableComponent, selector: "cx-table", inputs: ["density", "rowActivation", "showHeaders", "columnsResizable", "columnsReorderable", "stickyHeader", "zebra", "loading", "showRowActions", "rightClickMenu", "emptyState", "emptyStateAction", "noMatchesState", "selectionMode", "columns", "rows", "activeRowId", "selectedRowIds", "filterValues", "sort"], outputs: ["activeRowIdChange", "emptyStateActionSelect", "selectedRowIdsChange", "rowMenuItemSelect", "rowActivate", "columnOrderChange", "sortChange", "filterValuesChange", "resetTable", "filterQueryChange", "filterLoadMore", "columnHeaderMenuOpenChange", "columnPinChange", "columnVisibilityChange"] }], changeDetection: i0.ChangeDetectionStrategy.OnPush });
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "22.2.2", ngImport: i0, type: CxLightboxComponent, decorators: [{
            type: Component,
            args: [{ selector: "cx-lightbox", imports: [
                        A11yModule,
                        CxIconButtonComponent,
                        CxTooltipDirective,
                        CxSpinnerComponent,
                        CxStateMessageComponent,
                        CxCodeBlockComponent,
                        CxMarkdownComponent,
                        CxTableComponent,
                    ], changeDetection: ChangeDetectionStrategy.OnPush, template: "@if (isOpen$()) {\n  @if (currentFile$(); as file) {\n    <div\n      class=\"cx-lightbox\"\n      [class.cx-lightbox--caption]=\"!!file.caption\"\n      role=\"dialog\"\n      aria-modal=\"true\"\n      cdkTrapFocus\n      [cdkTrapFocusAutoCapture]=\"true\"\n      [attr.aria-label]=\"ariaLabel\"\n      [attr.aria-keyshortcuts]=\"\n        hasNavigation$() ? 'Escape ArrowLeft ArrowRight' : 'Escape'\n      \"\n      (pointerdown)=\"onBackdropPointerDown($event)\"\n      (pointermove)=\"onBackdropPointerMove($event)\"\n      (click)=\"onBackdropClick($event)\"\n    >\n      <header class=\"cx-lightbox__header\">\n        <div class=\"cx-lightbox__identity\">\n          <span\n            class=\"cx-lightbox__name\"\n            [cxTooltip]=\"file.name\"\n            [cxTooltipOverflow]=\"true\"\n            data-cx-tooltip-overflow\n            >{{ file.name }}</span\n          >\n          @if (metadata$()) {\n            <span class=\"cx-lightbox__metadata\">{{ metadata$() }}</span>\n          }\n        </div>\n        @if (\n          hasNavigation$() ||\n          (state$() === \"ready\" &&\n            (kind$() === \"image\" ||\n              kind$() === \"text\" ||\n              kind$() === \"markdown\"))\n        ) {\n          <div\n            class=\"cx-lightbox__toolbar\"\n            role=\"group\"\n            aria-label=\"Preview controls\"\n          >\n            @if (hasNavigation$()) {\n              <span\n                class=\"cx-lightbox__position\"\n                role=\"status\"\n                aria-live=\"polite\"\n                aria-atomic=\"true\"\n                [attr.aria-label]=\"positionLabel$()\"\n                >{{ positionText$() }}</span\n              >\n            }\n            @if (state$() === \"ready\") {\n              @if (kind$() === \"image\") {\n                <div\n                  class=\"cx-lightbox__group\"\n                  role=\"group\"\n                  aria-label=\"Image zoom\"\n                >\n                  <cx-icon-button\n                    icon=\"minus\"\n                    variant=\"transparent\"\n                    ariaLabel=\"Zoom out\"\n                    cxTooltip=\"Zoom out\"\n                    [disabled]=\"scale$() <= 0.1\"\n                    (pressed)=\"zoomBy(-0.25)\"\n                  />\n                  <span class=\"cx-lightbox__position\" aria-live=\"polite\">{{\n                    zoomText$()\n                  }}</span>\n                  <cx-icon-button\n                    icon=\"plus\"\n                    variant=\"transparent\"\n                    ariaLabel=\"Zoom in\"\n                    cxTooltip=\"Zoom in\"\n                    [disabled]=\"scale$() >= 4\"\n                    (pressed)=\"zoomBy(0.25)\"\n                  />\n                  <cx-icon-button\n                    icon=\"minimize\"\n                    variant=\"transparent\"\n                    ariaLabel=\"Fit to view\"\n                    cxTooltip=\"Fit to view\"\n                    (pressed)=\"fit()\"\n                  />\n                </div>\n              }\n              @if (kind$() === \"text\" || kind$() === \"markdown\") {\n                <div\n                  class=\"cx-lightbox__group\"\n                  role=\"group\"\n                  aria-label=\"Text view\"\n                >\n                  @if (kind$() === \"text\" || showSource$()) {\n                    <cx-icon-button\n                      icon=\"text\"\n                      variant=\"transparent\"\n                      ariaLabel=\"Wrap lines\"\n                      cxTooltip=\"Wrap lines\"\n                      [selected]=\"wrap$()\"\n                      [ariaPressed]=\"wrap$()\"\n                      (pressed)=\"wrap$.set(!wrap$())\"\n                    />\n                  }\n                  @if (kind$() === \"markdown\") {\n                    <cx-icon-button\n                      icon=\"braces\"\n                      variant=\"transparent\"\n                      ariaLabel=\"Show source\"\n                      cxTooltip=\"Show source\"\n                      [selected]=\"showSource$()\"\n                      [ariaPressed]=\"showSource$()\"\n                      (pressed)=\"showSource$.set(!showSource$())\"\n                    />\n                  }\n                </div>\n              }\n            }\n          </div>\n        }\n        <div class=\"cx-lightbox__actions\">\n          @if (source$()) {\n            <cx-icon-button\n              icon=\"download\"\n              variant=\"transparent\"\n              ariaLabel=\"Download original\"\n              cxTooltip=\"Download original\"\n              (pressed)=\"downloadOriginal()\"\n            />\n            @if (kind$() === \"pdf\") {\n              <cx-icon-button\n                icon=\"open-new\"\n                variant=\"transparent\"\n                ariaLabel=\"Open PDF in new tab\"\n                cxTooltip=\"Open PDF in new tab\"\n                (pressed)=\"openSeparately()\"\n              />\n            }\n          }\n          <cx-icon-button\n            icon=\"remove\"\n            variant=\"transparent\"\n            ariaLabel=\"Close preview\"\n            cxTooltip=\"Close preview\"\n            (pressed)=\"closeFromUser()\"\n          />\n        </div>\n      </header>\n\n      <div\n        class=\"cx-lightbox__stage\"\n        [class.cx-lightbox__stage--navigation]=\"hasNavigation$()\"\n      >\n        @if (hasNavigation$()) {\n          <cx-icon-button\n            icon=\"chevron-left\"\n            class=\"cx-lightbox__previous\"\n            variant=\"emphasis\"\n            [rounded]=\"true\"\n            [ariaLabel]=\"previousAriaLabel\"\n            [cxTooltip]=\"previousAriaLabel\"\n            [disabled]=\"!canGoPrevious$()\"\n            (pressed)=\"navigate(-1)\"\n          />\n        }\n        <section\n          class=\"cx-lightbox__surface\"\n          tabindex=\"-1\"\n          cdkFocusInitial\n          [attr.aria-label]=\"file.name\"\n          [class.cx-lightbox__surface--document]=\"\n            kind$() === 'pdf' ||\n            kind$() === 'text' ||\n            kind$() === 'markdown' ||\n            kind$() === 'table'\n          \"\n        >\n          @for (key of [renderKey$()]; track key) {\n            @if (state$() === \"loading\") {\n              <div class=\"cx-lightbox__state\">\n                <cx-spinner ariaLabel=\"Loading preview\" />\n              </div>\n            }\n            @if (\n              state$() === \"error\" ||\n              state$() === \"unsupported\" ||\n              state$() === \"empty\"\n            ) {\n              <div class=\"cx-lightbox__state\">\n                <div class=\"cx-lightbox__state-content\">\n                  <cx-state-message\n                    visual=\"none\"\n                    [heading]=\"\n                      state$() === 'empty'\n                        ? 'This file is empty'\n                        : 'Preview unavailable'\n                    \"\n                    [description]=\"\n                      state$() === 'unsupported'\n                        ? 'Download the original to open it in another app.'\n                        : message$() || undefined\n                    \"\n                  />\n                  @if (retryable$()) {\n                    <cx-icon-button\n                      icon=\"reload\"\n                      ariaLabel=\"Retry preview\"\n                      cxTooltip=\"Retry preview\"\n                      (pressed)=\"retry()\"\n                    />\n                  }\n                </div>\n              </div>\n            } @else {\n              @switch (kind$()) {\n                @case (\"image\") {\n                  <div\n                    #viewport\n                    class=\"cx-lightbox__viewport\"\n                    tabindex=\"0\"\n                    aria-label=\"Image preview\"\n                    [class.cx-lightbox__viewport--pannable]=\"canPan$()\"\n                    [class.cx-lightbox__viewport--dragging]=\"dragging$()\"\n                    (pointerdown)=\"startPan($event)\"\n                    (pointermove)=\"pan($event)\"\n                    (pointerup)=\"endPan()\"\n                    (pointercancel)=\"endPan()\"\n                    (lostpointercapture)=\"endPan()\"\n                  >\n                    <div class=\"cx-lightbox__image-plane\">\n                      @if (source$()) {\n                        <img\n                          class=\"cx-lightbox__image\"\n                          [src]=\"source$()\"\n                          [alt]=\"file.alt || file.name\"\n                          [draggable]=\"false\"\n                          [style.width.px]=\"imageWidth$() || null\"\n                          [style.height.px]=\"imageHeight$() || null\"\n                          [style.visibility]=\"\n                            state$() === 'ready' ? 'visible' : 'hidden'\n                          \"\n                          (load)=\"imageLoaded($event, key)\"\n                          (error)=\"mediaFailed(key)\"\n                        />\n                      }\n                    </div>\n                  </div>\n                }\n                @case (\"pdf\") {\n                  @if (pdfUrl$(); as url) {\n                    <iframe\n                      class=\"cx-lightbox__pdf cx-lightbox__document\"\n                      [src]=\"url\"\n                      [title]=\"file.name\"\n                      (load)=\"ready(key)\"\n                      (error)=\"mediaFailed(key)\"\n                    ></iframe>\n                  }\n                }\n                @case (\"video\") {\n                  @if (source$()) {\n                    <video\n                      class=\"cx-lightbox__video\"\n                      [src]=\"source$()\"\n                      controls\n                      playsinline\n                      preload=\"metadata\"\n                      [attr.aria-label]=\"file.name\"\n                      (loadedmetadata)=\"ready(key)\"\n                      (error)=\"mediaFailed(key)\"\n                    ></video>\n                  }\n                }\n                @case (\"audio\") {\n                  @if (source$()) {\n                    <audio\n                      class=\"cx-lightbox__audio\"\n                      [src]=\"source$()\"\n                      controls\n                      preload=\"metadata\"\n                      [attr.aria-label]=\"file.name\"\n                      (loadedmetadata)=\"ready(key)\"\n                      (error)=\"mediaFailed(key)\"\n                    ></audio>\n                  }\n                }\n                @default {\n                  @if (state$() === \"ready\") {\n                    <div\n                      class=\"cx-lightbox__document\"\n                      tabindex=\"0\"\n                      [attr.aria-label]=\"file.name\"\n                    >\n                      @if (textLimited$() && kind$() !== \"table\") {\n                        <p class=\"cx-lightbox__notice\">\n                          Showing the first part of this file. Download the\n                          original for the full text.\n                        </p>\n                      }\n                      @if (kind$() === \"table\") {\n                        @if (tableLimited$()) {\n                          <p class=\"cx-lightbox__notice\">\n                            Showing the first 200 rows and up to 40 columns.\n                            Download the original for the full table.\n                          </p>\n                        }\n                        <cx-table\n                          [columns]=\"tableColumns$()\"\n                          [rows]=\"tableRows$()\"\n                          density=\"compact\"\n                          [columnsResizable]=\"false\"\n                          [columnsReorderable]=\"false\"\n                          [showRowActions]=\"false\"\n                          [rightClickMenu]=\"false\"\n                          [emptyState]=\"{\n                            heading: 'No data rows',\n                            description:\n                              'This file contains only column headings.',\n                          }\"\n                        />\n                      } @else if (kind$() === \"markdown\" && !showSource$()) {\n                        <cx-markdown [markdown]=\"text$()\" />\n                      } @else {\n                        <cx-code-block [code]=\"text$()\" [wrap]=\"wrap$()\" />\n                      }\n                    </div>\n                  }\n                }\n              }\n            }\n          }\n        </section>\n        @if (hasNavigation$()) {\n          <cx-icon-button\n            icon=\"chevron-right\"\n            class=\"cx-lightbox__next\"\n            variant=\"emphasis\"\n            [rounded]=\"true\"\n            [ariaLabel]=\"nextAriaLabel\"\n            [cxTooltip]=\"nextAriaLabel\"\n            [disabled]=\"!canGoNext$()\"\n            (pressed)=\"navigate(1)\"\n          />\n        }\n      </div>\n\n      @if (file.caption) {\n        <footer class=\"cx-lightbox__footer\">\n          <p class=\"cx-lightbox__caption\">{{ file.caption }}</p>\n        </footer>\n      }\n    </div>\n  }\n}\n", styles: [":host{display:contents}.cx-lightbox{position:fixed;inset:0;z-index:var(--z-index-dialog);display:grid;grid-template-rows:auto minmax(0, 1fr);gap:var(--space-md);padding:var(--space-lg);box-sizing:border-box;background:var(--overlay-backdrop);backdrop-filter:blur(var(--overlay-backdrop-blur));color:var(--ink)}.cx-lightbox--caption{grid-template-rows:auto minmax(0, 1fr) auto}.cx-lightbox__header{display:grid;grid-template-columns:minmax(0, 1fr) auto minmax(0, 1fr);align-items:center;gap:var(--space-md);min-width:0;padding:var(--space-sm) var(--space-md);background:var(--surface);border-radius:var(--radius-lg)}.cx-lightbox__identity{min-width:0;display:grid;gap:var(--space-2xs)}.cx-lightbox__name{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:var(--font-size-body);font-weight:var(--font-weight-medium)}.cx-lightbox__metadata{color:var(--opacity-high);font-size:var(--font-size-body-sm)}.cx-lightbox__actions{grid-column:3;justify-self:end;display:flex;align-items:center;flex:0 0 auto;gap:var(--space-xs)}.cx-lightbox__stage{min-height:0;min-width:0;display:grid}.cx-lightbox__stage--navigation{grid-template-columns:auto minmax(0, 1fr) auto;gap:var(--space-md)}.cx-lightbox__previous,.cx-lightbox__next{align-self:center}.cx-lightbox__surface{position:relative;min-height:0;min-width:0;width:100%;height:100%;display:grid;justify-self:center;outline:none;animation:cx-lightbox-enter var(--motion-base) var(--ease-out)}.cx-lightbox__surface--document{max-width:var(--content-width-xl);border-radius:var(--radius-lg);background:var(--surface);overflow:hidden}.cx-lightbox__viewport{min-height:0;min-width:0;overflow:auto;outline:none;overscroll-behavior:contain}.cx-lightbox__viewport:focus-visible{outline:var(--outline-tab);outline-offset:var(--outline-tab-offset)}.cx-lightbox__viewport--pannable{cursor:grab}.cx-lightbox__viewport--dragging{cursor:grabbing}.cx-lightbox__image-plane{display:grid;place-items:center;min-width:100%;min-height:100%;width:max-content}.cx-lightbox__image{display:block;max-width:none;border-radius:var(--radius-lg)}.cx-lightbox__pdf{display:block;border:0;width:100%;height:100%;padding:0}.cx-lightbox__document{min-width:0;min-height:0;overflow:auto;overscroll-behavior:contain;box-sizing:border-box}div.cx-lightbox__document{padding:var(--space-lg)}.cx-lightbox__video{display:block;align-self:center;justify-self:center;max-width:100%;max-height:100%;min-height:0;border-radius:var(--radius-lg)}.cx-lightbox__audio{align-self:center;justify-self:center;width:100%;max-width:var(--content-width-md)}.cx-lightbox__state{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:var(--space-md);padding:var(--space-lg);background:var(--surface);border-radius:var(--radius-lg)}.cx-lightbox__state-content{display:grid;justify-items:center;gap:var(--space-sm)}.cx-lightbox__notice{margin:0 0 var(--space-md);font-size:var(--font-size-body-sm);color:var(--opacity-high)}.cx-lightbox__footer{display:grid;justify-items:center;gap:var(--space-sm);min-width:0}.cx-lightbox__caption{margin:0;padding:var(--space-xs) var(--space-sm);max-width:var(--content-width-md);background:var(--surface);color:var(--opacity-high);border-radius:var(--radius-sm);font-size:var(--font-size-body-sm);text-align:center;overflow-wrap:anywhere}.cx-lightbox__toolbar{display:flex;flex-wrap:wrap;justify-content:center;align-items:center;gap:var(--space-lg);min-width:0}.cx-lightbox__group{display:flex;align-items:center;gap:var(--space-xs)}.cx-lightbox__position{min-width:5ch;text-align:center;font-size:var(--font-size-body-sm);font-variant-numeric:tabular-nums;color:var(--opacity-high)}@media(max-width: 720px){.cx-lightbox{padding:var(--space-sm);gap:var(--space-sm)}.cx-lightbox__header{grid-template-columns:minmax(0, 1fr) auto;padding:var(--space-xs) var(--space-sm);gap:var(--space-sm)}.cx-lightbox__actions{grid-column:2;grid-row:1}.cx-lightbox__toolbar{grid-column:1/-1;grid-row:2;gap:var(--space-md)}.cx-lightbox__stage--navigation{gap:var(--space-sm)}div.cx-lightbox__document{padding:var(--space-md)}}@keyframes cx-lightbox-enter{from{opacity:0}to{opacity:1}}@media(prefers-reduced-motion: reduce){.cx-lightbox__surface{animation:none}}"] }]
        }], ctorParameters: () => [], propDecorators: { files: [{
                type: Input
            }], index: [{
                type: Input
            }], open: [{
                type: Input
            }], ariaLabel: [{
                type: Input
            }], previousAriaLabel: [{
                type: Input
            }], nextAriaLabel: [{
                type: Input
            }], indexChange: [{
                type: Output
            }], openChange: [{
                type: Output
            }], download: [{
                type: Output
            }], previewViewport: [{
                type: ViewChild,
                args: ["viewport"]
            }], onDialogKeydown: [{
                type: HostListener,
                args: ["document:keydown", ["$event"]]
            }] } });
