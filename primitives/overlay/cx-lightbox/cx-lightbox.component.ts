import { A11yModule } from "@angular/cdk/a11y";
import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  EventEmitter,
  HostListener,
  Input,
  OnDestroy,
  Output,
  ViewChild,
  computed,
  effect,
  inject,
  signal,
  untracked,
} from "@angular/core";
import { DomSanitizer, type SafeResourceUrl } from "@angular/platform-browser";
import { CxIconButtonComponent } from "../../actions/cx-icon-button";
import { CxCodeBlockComponent } from "../../display/cx-code-block";
import { CxMarkdownComponent } from "../../display/cx-markdown";
import {
  CxTableComponent,
  type CxTableColumn,
  type CxTableRow,
} from "../../data/cx-table";
import { CxSpinnerComponent } from "../../feedback/cx-spinner";
import { CxStateMessageComponent } from "../../feedback/cx-state-message";
import { isHostVisible } from "../../shared/host-visibility";
import { CxTooltipDirective } from "../cx-tooltip";
import {
  CxOverlayStateService,
  type CxOverlayStateHandle,
} from "../overlay-state";
import {
  filePreviewKind,
  parseDelimitedPreview,
  PreviewError,
  readPreviewBytes,
  type CxLightboxFile,
} from "./file-preview";
export type { CxLightboxFile } from "./file-preview";

@Component({
  selector: "cx-lightbox",
  imports: [
    A11yModule,
    CxIconButtonComponent,
    CxTooltipDirective,
    CxSpinnerComponent,
    CxStateMessageComponent,
    CxCodeBlockComponent,
    CxMarkdownComponent,
    CxTableComponent,
  ],
  templateUrl: "./cx-lightbox.component.html",
  styleUrl: "./cx-lightbox.component.scss",
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CxLightboxComponent implements OnDestroy {
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly sanitizer = inject(DomSanitizer);
  private readonly overlayState = inject(CxOverlayStateService);
  private readonly requestedOpenState = signal(false);
  private readonly filesState = signal<readonly CxLightboxFile[]>([]);
  private readonly indexState = signal(0);
  private readonly retryState = signal(0);
  private overlayHandle?: CxOverlayStateHandle;
  private controller?: AbortController;
  private pdfObjectUrl?: string;
  private loadTimer?: ReturnType<typeof setTimeout>;
  private viewport?: HTMLElement;
  private resizeObserver?: ResizeObserver;
  private drag?: { x: number; y: number; left: number; top: number };
  private backdropPress?: { x: number; y: number };
  private ariaLabelState = "File preview";
  private previousAriaLabelState = "Previous file";
  private nextAriaLabelState = "Next file";

  protected readonly isOpen$ = computed(
    () => this.requestedOpenState() && this.filesState().length > 0,
  );
  protected readonly currentIndex$ = computed(() =>
    Math.min(this.indexState(), Math.max(0, this.filesState().length - 1)),
  );
  protected readonly currentFile$ = computed(
    () => this.filesState()[this.currentIndex$()],
  );
  protected readonly kind$ = computed(() =>
    this.currentFile$() ? filePreviewKind(this.currentFile$()!) : "unsupported",
  );
  protected readonly hasNavigation$ = computed(
    () => this.filesState().length > 1,
  );
  protected readonly canGoPrevious$ = computed(() => this.currentIndex$() > 0);
  protected readonly canGoNext$ = computed(
    () => this.currentIndex$() < this.filesState().length - 1,
  );
  protected readonly positionText$ = computed(
    () => `${this.currentIndex$() + 1} / ${this.filesState().length}`,
  );
  protected readonly positionLabel$ = computed(
    () => `File ${this.currentIndex$() + 1} of ${this.filesState().length}`,
  );
  protected readonly renderKey$ = signal(0);
  protected readonly source$ = signal("");
  protected readonly pdfUrl$ = signal<SafeResourceUrl | undefined>(undefined);
  protected readonly state$ = signal<
    "loading" | "ready" | "error" | "unsupported" | "empty"
  >("loading");
  protected readonly message$ = signal("");
  protected readonly retryable$ = signal(false);
  protected readonly text$ = signal("");
  protected readonly textLimited$ = signal(false);
  protected readonly wrap$ = signal(true);
  protected readonly showSource$ = signal(false);
  protected readonly tableColumns$ = signal<CxTableColumn[]>([]);
  protected readonly tableRows$ = signal<CxTableRow[]>([]);
  protected readonly tableLimited$ = signal(false);
  protected readonly naturalSize$ = signal({ width: 0, height: 0 });
  protected readonly viewportSize$ = signal({ width: 0, height: 0 });
  protected readonly zoom$ = signal<number | undefined>(undefined);
  protected readonly dragging$ = signal(false);
  protected readonly fitScale$ = computed(() => {
    const image = this.naturalSize$();
    const viewport = this.viewportSize$();
    return image.width && viewport.width
      ? Math.min(
          1,
          viewport.width / image.width,
          viewport.height / image.height,
        )
      : 1;
  });
  protected readonly scale$ = computed(() => this.zoom$() ?? this.fitScale$());
  protected readonly zoomText$ = computed(
    () => `${Math.round(this.scale$() * 100)}%`,
  );
  protected readonly imageWidth$ = computed(
    () => this.naturalSize$().width * this.scale$(),
  );
  protected readonly imageHeight$ = computed(
    () => this.naturalSize$().height * this.scale$(),
  );
  protected readonly canPan$ = computed(
    () =>
      this.imageWidth$() > this.viewportSize$().width ||
      this.imageHeight$() > this.viewportSize$().height,
  );
  protected readonly metadata$ = computed(() => {
    const size = this.currentFile$()?.size;
    if (size === undefined) return "";
    if (size < 1024) return `${size} B`;
    if (size < 1024 * 1024) return `${Math.round(size / 1024)} KB`;
    return `${(size / (1024 * 1024)).toFixed(1)} MB`;
  });

  @Input()
  set files(value: readonly CxLightboxFile[]) {
    if (
      !Array.isArray(value) ||
      value.some(
        (file) =>
          !file?.src?.trim() ||
          !file.name?.trim() ||
          (file.size !== undefined &&
            (!Number.isFinite(file.size) || file.size < 0)),
      )
    ) {
      throw new Error(
        "[cx-lightbox] files requires an array of files with non-empty src and name, and an optional non-negative size.",
      );
    }
    this.filesState.set(value);
    this.reconcileOverlay();
  }
  get files(): readonly CxLightboxFile[] {
    return this.filesState();
  }
  @Input()
  set index(value: number) {
    this.indexState.set(
      Number.isFinite(value) ? Math.max(0, Math.trunc(value)) : 0,
    );
  }
  get index(): number {
    return this.currentIndex$();
  }
  @Input()
  set open(value: boolean) {
    this.requestedOpenState.set(Boolean(value));
    this.reconcileOverlay();
  }
  get open(): boolean {
    return this.requestedOpenState();
  }
  @Input()
  set ariaLabel(value: string | null | undefined) {
    this.ariaLabelState = value?.trim() || "File preview";
  }
  get ariaLabel(): string {
    return this.ariaLabelState;
  }
  @Input()
  set previousAriaLabel(value: string | null | undefined) {
    this.previousAriaLabelState = value?.trim() || "Previous file";
  }
  get previousAriaLabel(): string {
    return this.previousAriaLabelState;
  }
  @Input()
  set nextAriaLabel(value: string | null | undefined) {
    this.nextAriaLabelState = value?.trim() || "Next file";
  }
  get nextAriaLabel(): string {
    return this.nextAriaLabelState;
  }
  @Output() readonly indexChange = new EventEmitter<number>();
  @Output() readonly openChange = new EventEmitter<boolean>();
  /** Supply this handler for protected download endpoints or cross-origin originals. */
  @Output() readonly download = new EventEmitter<CxLightboxFile>();

  @ViewChild("viewport")
  set previewViewport(value: ElementRef<HTMLElement> | undefined) {
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
        if (file) void this.loadPreview(file);
      });
    });
  }

  ngOnDestroy(): void {
    this.releasePreview();
    this.resizeObserver?.disconnect();
    this.overlayState.release(this.overlayHandle);
  }

  private isBackdrop(target: EventTarget | null): boolean {
    return (
      target instanceof Element &&
      target.matches(
        ".cx-lightbox, .cx-lightbox__stage, .cx-lightbox__surface:not(.cx-lightbox__surface--document), .cx-lightbox__viewport, .cx-lightbox__image-plane, .cx-lightbox__footer",
      )
    );
  }

  protected onBackdropPointerDown(event: PointerEvent): void {
    this.backdropPress =
      event.button === 0 && this.isBackdrop(event.target)
        ? { x: event.clientX, y: event.clientY }
        : undefined;
  }

  protected onBackdropPointerMove(event: PointerEvent): void {
    // A pan or selection that crosses the backdrop must not dismiss the preview.
    if (
      this.backdropPress &&
      Math.hypot(
        event.clientX - this.backdropPress.x,
        event.clientY - this.backdropPress.y,
      ) > 5
    )
      this.backdropPress = undefined;
  }

  protected onBackdropClick(event: MouseEvent): void {
    const pressedOutside = this.backdropPress !== undefined;
    this.backdropPress = undefined;
    if (
      pressedOutside &&
      this.isBackdrop(event.target) &&
      this.overlayState.isTopmost(this.overlayHandle)
    ) {
      this.closeFromUser();
    }
  }

  @HostListener("document:keydown", ["$event"])
  protected onDialogKeydown(event: KeyboardEvent): void {
    if (
      event.defaultPrevented ||
      event.isComposing ||
      event.altKey ||
      event.ctrlKey ||
      event.metaKey ||
      event.shiftKey ||
      !this.isOpen$() ||
      !this.overlayState.isTopmost(this.overlayHandle)
    )
      return;
    const target = event.target;
    // Content owns its keys: selection, media seeking, table navigation and panning.
    if (
      target instanceof Element &&
      (target.closest(
        'input, textarea, select, audio, video, iframe, [contenteditable="true"], .cx-lightbox__document',
      ) ||
        (this.canPan$() && target.closest(".cx-lightbox__viewport")))
    )
      return;
    if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
      event.preventDefault();
      event.stopPropagation();
      this.navigate(event.key === "ArrowLeft" ? -1 : 1);
    }
  }

  protected navigate(direction: -1 | 1): void {
    if (!this.overlayState.isTopmost(this.overlayHandle)) return;
    const next = Math.max(
      0,
      Math.min(this.currentIndex$() + direction, this.filesState().length - 1),
    );
    if (next === this.currentIndex$()) return;
    this.indexState.set(next);
    this.indexChange.emit(next);
  }

  protected closeFromUser(): void {
    if (!this.requestedOpenState()) return;
    this.requestedOpenState.set(false);
    this.releasePreview();
    this.reconcileOverlay();
    this.openChange.emit(false);
  }

  protected retry(): void {
    this.retryState.update((value) => value + 1);
  }
  protected ready(key?: number): void {
    if (
      this.controller?.signal.aborted ||
      (key !== undefined && key !== this.renderKey$())
    )
      return;
    clearTimeout(this.loadTimer);
    this.state$.set("ready");
  }
  protected imageLoaded(event: Event, key: number): void {
    if (this.controller?.signal.aborted || key !== this.renderKey$()) return;
    const image = event.target as HTMLImageElement;
    this.naturalSize$.set({
      width: image.naturalWidth,
      height: image.naturalHeight,
    });
    this.ready();
  }
  protected mediaFailed(key: number): void {
    if (this.controller?.signal.aborted || key !== this.renderKey$()) return;
    this.fail(
      new PreviewError(
        "This file could not be previewed. It may be damaged or use an unsupported format.",
        true,
      ),
    );
  }
  protected zoomBy(amount: number): void {
    this.zoom$.set(
      Math.max(
        0.1,
        Math.min(4, Math.round((this.scale$() + amount) * 100) / 100),
      ),
    );
  }
  protected fit(): void {
    this.zoom$.set(undefined);
    if (this.viewport) {
      this.viewport.scrollTop = 0;
      this.viewport.scrollLeft = 0;
    }
  }
  protected startPan(event: PointerEvent): void {
    if (
      !this.canPan$() ||
      event.button !== 0 ||
      !this.viewport ||
      event.pointerType === "touch"
    )
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
  protected pan(event: PointerEvent): void {
    if (!this.drag || !this.viewport) return;
    this.viewport.scrollLeft = this.drag.left - (event.clientX - this.drag.x);
    this.viewport.scrollTop = this.drag.top - (event.clientY - this.drag.y);
  }
  protected endPan(): void {
    this.drag = undefined;
    this.dragging$.set(false);
  }

  protected downloadOriginal(): void {
    const file = this.currentFile$();
    if (!file) return;
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
  protected openSeparately(): void {
    const file = this.currentFile$();
    if (file)
      window.open(this.fileUrl(file.src), "_blank", "noopener,noreferrer");
  }

  private fileUrl(src: string): string {
    const url = new URL(src, document.baseURI);
    if (!["http:", "https:", "blob:"].includes(url.protocol))
      throw new PreviewError("This file address cannot be previewed.");
    return url.href;
  }

  private async loadPreview(file: CxLightboxFile): Promise<void> {
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
        this.loadTimer = setTimeout(
          () =>
            this.fail(
              new PreviewError("The preview is taking too long to load.", true),
            ),
          20_000,
        );
        return;
      }
      if (kind === "pdf" && !navigator.pdfViewerEnabled) {
        throw new PreviewError(
          "This browser cannot display PDFs here. Open the file in a new tab or download it.",
        );
      }
      const response = await fetch(src, {
        signal: AbortSignal.any([
          controller.signal,
          AbortSignal.timeout(20_000),
        ]),
      });
      const bytes = await readPreviewBytes(
        response,
        kind === "pdf" ? 25 * 1024 * 1024 : 1024 * 1024,
      );
      if (controller.signal.aborted) return;
      if (!bytes.length) {
        this.state$.set("empty");
        return;
      }
      if (kind === "pdf") {
        // Only verified PDF bytes become a trusted frame URL; never embed an arbitrary HTML response.
        if (!new TextDecoder().decode(bytes.slice(0, 5)).startsWith("%PDF-"))
          throw new PreviewError(
            "This file is not a readable PDF. Download the original file.",
          );
        this.pdfObjectUrl = URL.createObjectURL(
          new Blob([bytes], { type: "application/pdf" }),
        );
        this.pdfUrl$.set(
          this.sanitizer.bypassSecurityTrustResourceUrl(this.pdfObjectUrl),
        );
        this.loadTimer = setTimeout(
          () =>
            this.fail(
              new PreviewError(
                "The PDF could not be displayed here. Open it in a new tab or download the original.",
              ),
            ),
          10_000,
        );
        return;
      }
      let text: string;
      try {
        const encoding =
          bytes[0] === 0xff && bytes[1] === 0xfe
            ? "utf-16le"
            : bytes[0] === 0xfe && bytes[1] === 0xff
              ? "utf-16be"
              : "utf-8";
        text = new TextDecoder(encoding, { fatal: true }).decode(bytes);
      } catch {
        throw new PreviewError(
          "This file uses an unsupported text encoding. Download the original file.",
        );
      }
      if (!text.trim()) {
        this.state$.set("empty");
        return;
      }
      if (text.includes("\0"))
        throw new PreviewError(
          "This file is not readable text. Download the original file.",
        );
      if (kind === "table") {
        const delimiter =
          file.name.toLowerCase().endsWith(".tsv") ||
          file.mimeType?.split(";")[0] === "text/tab-separated-values"
            ? "\t"
            : ",";
        const parsed = parseDelimitedPreview(text, delimiter);
        if (!parsed.rows.length) {
          this.state$.set("empty");
          return;
        }
        const width = Math.max(...parsed.rows.map((row) => row.length));
        this.tableColumns$.set(
          Array.from({ length: width }, (_, index) => ({
            id: String(index),
            label: parsed.rows[0]![index] || `Column ${index + 1}`,
            size: "content",
            hideable: false,
            pinnable: false,
          })),
        );
        this.tableRows$.set(
          parsed.rows.slice(1).map((row, index) => ({
            id: String(index),
            cells: Object.fromEntries(
              Array.from({ length: width }, (_, column) => [
                String(column),
                { kind: "text", value: row[column] ?? "" },
              ]),
            ),
          })),
        );
        this.tableLimited$.set(parsed.limited);
      }
      let formatted = text;
      if (
        file.name.toLowerCase().endsWith(".json") ||
        file.mimeType === "application/json"
      ) {
        try {
          formatted = JSON.stringify(JSON.parse(text), null, 2);
        } catch {
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
    } catch (error) {
      if (!controller.signal.aborted) this.fail(error);
    }
  }

  private fail(error: unknown): void {
    clearTimeout(this.loadTimer);
    this.message$.set(
      error instanceof PreviewError
        ? error.message
        : "The file could not be loaded. Try again or download the original.",
    );
    this.retryable$.set(error instanceof PreviewError ? error.retryable : true);
    this.state$.set("error");
  }
  private releasePreview(): void {
    this.controller?.abort();
    clearTimeout(this.loadTimer);
    this.host.nativeElement
      .querySelectorAll<HTMLMediaElement>("video, audio")
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
  private reconcileOverlay(): void {
    if (this.isOpen$()) {
      this.overlayHandle ??= this.overlayState.capture({
        surface: () =>
          this.host.nativeElement.querySelector<HTMLElement>(".cx-lightbox") ??
          undefined,
        isActive: () =>
          isHostVisible(this.host.nativeElement.querySelector(".cx-lightbox")),
        onEscape: () => this.closeFromUser(),
      });
    } else {
      this.overlayState.release(this.overlayHandle);
      this.overlayHandle = undefined;
    }
  }
}
